'use strict';

const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const os = require('os');
const fs = require('fs');
const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../helpers/responseHelper');
const { auditLog } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS } = require('../config/constants');
const { generateCustomerLedgerPDF } = require('../services/pdfService');
const { exportCollections, importCollections } = require('../services/backupService');
const { formatDate } = require('../helpers/dateHelper');

/**
 * @route  GET /api/export/customer/:id/pdf
 * @access Protected
 */
const exportCustomerPDF = asyncHandler(async (req, res) => {
  const { id } = req.params; // secureToken

  const customer = await Customer.findOne({ secureToken: id, isDeleted: false }).lean();
  if (!customer) {
    return sendError(res, 'Customer not found.', 404);
  }

  const loan = await Loan.findOne({ customerId: customer._id }).lean();
  if (!loan) {
    return sendError(res, 'No loan found for this customer.', 404);
  }

  // Add virtual
  loan.monthlyInterest = parseFloat(((loan.remainingPrincipal * loan.interestRate) / 100).toFixed(2));

  const payments = await Payment.find({ loanId: loan._id }).sort({ date: -1 }).lean();

  const pdfBuffer = await generateCustomerLedgerPDF(customer, loan, payments);

  const safeFileName = `${customer.fullName.replace(/\s+/g, '_')}_ledger_${Date.now()}.pdf`;

  await auditLog(req, AUDIT_ACTIONS.EXPORT, 'customer', id, { format: 'pdf' });

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${safeFileName}"`,
    'Content-Length': pdfBuffer.length,
  });

  return res.send(pdfBuffer);
});

/**
 * @route  GET /api/export/customer/:id/csv
 * @access Protected
 */
const exportCustomerCSV = asyncHandler(async (req, res) => {
  const { id } = req.params; // secureToken

  const customer = await Customer.findOne({ secureToken: id, isDeleted: false }).lean();
  if (!customer) {
    return sendError(res, 'Customer not found.', 404);
  }

  const loan = await Loan.findOne({ customerId: customer._id }).lean();
  if (!loan) {
    return sendError(res, 'No loan found for this customer.', 404);
  }

  const payments = await Payment.find({ loanId: loan._id }).sort({ date: -1 }).lean();

  // Write CSV to temp file
  const tmpFile = path.join(os.tmpdir(), `cpay_${id}_${Date.now()}.csv`);

  const csvWriter = createObjectCsvWriter({
    path: tmpFile,
    header: [
      { id: 'date', title: 'Date' },
      { id: 'totalAmount', title: 'Total Amount (₹)' },
      { id: 'interestPaid', title: 'Interest Paid (₹)' },
      { id: 'principalPaid', title: 'Principal Paid (₹)' },
      { id: 'remainingPrincipalAfter', title: 'Remaining Principal (₹)' },
      { id: 'remarks', title: 'Remarks' },
      { id: 'recordedBy', title: 'Recorded By' },
    ],
  });

  const records = payments.map((p) => ({
    date: formatDate(p.date),
    totalAmount: p.totalAmount,
    interestPaid: p.interestPaid,
    principalPaid: p.principalPaid,
    remainingPrincipalAfter: p.remainingPrincipalAfter,
    remarks: p.remarks || '',
    recordedBy: p.recordedBy,
  }));

  await csvWriter.writeRecords(records);

  const safeFileName = `${customer.fullName.replace(/\s+/g, '_')}_payments_${Date.now()}.csv`;

  await auditLog(req, AUDIT_ACTIONS.EXPORT, 'customer', id, { format: 'csv' });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);

  const fileStream = fs.createReadStream(tmpFile);
  fileStream.pipe(res);

  fileStream.on('end', () => {
    fs.unlink(tmpFile, () => {}); // Cleanup temp file
  });
});

/**
 * @route  GET /api/export/backup
 * @access Protected
 */
const backupDatabase = asyncHandler(async (req, res) => {
  const data = await exportCollections();

  await auditLog(req, AUDIT_ACTIONS.EXPORT, 'backup', null, {
    exportedAt: data.exportedAt,
  });

  const fileName = `cpay_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  return res.send(JSON.stringify(data, null, 2));
});

/**
 * @route  POST /api/export/restore
 * @access Protected
 */
const restoreDatabase = asyncHandler(async (req, res) => {
  const backupData = req.body;

  if (!backupData || !backupData.collections) {
    return sendError(res, 'Invalid backup data. Expected { collections: {...} } format.', 400);
  }

  const summary = await importCollections(backupData);

  await auditLog(req, AUDIT_ACTIONS.EXPORT, 'backup', null, { action: 'restore', summary });

  return sendSuccess(res, summary, 'Database restored successfully.');
});

module.exports = { exportCustomerPDF, exportCustomerCSV, backupDatabase, restoreDatabase };
