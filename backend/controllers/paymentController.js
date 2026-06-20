'use strict';

const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Loan = require('../models/Loan');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendPaginated } = require('../helpers/responseHelper');
const { auditLog } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS, LOAN_STATUS } = require('../config/constants');
const { generatePaymentSchedule } = require('../helpers/paymentScheduleHelper');

/**
 * Helper function to safely recalculate all balances chronologically after an edit/delete.
 */
const recalculateLoanBalances = async (loanId) => {
  const loan = await Loan.findById(loanId);
  if (!loan) return null;

  const payments = await Payment.find({ loanId, isDeleted: false }).sort({ date: 1, createdAt: 1 });
  
  let currentPrincipal = loan.loanAmount;
  let totalInterest = 0;
  let totalPrincipal = 0;

  for (const p of payments) {
    currentPrincipal = parseFloat((currentPrincipal - p.principalPaid).toFixed(2));
    totalInterest = parseFloat((totalInterest + p.interestPaid).toFixed(2));
    totalPrincipal = parseFloat((totalPrincipal + p.principalPaid).toFixed(2));
    
    // Update the payment record if chronological re-computation changed it
    if (p.remainingPrincipalAfter !== currentPrincipal) {
      p.remainingPrincipalAfter = currentPrincipal;
      await p.save();
    }
  }

  loan.remainingPrincipal = currentPrincipal;
  loan.totalInterestPaid = totalInterest;
  loan.totalPrincipalPaid = totalPrincipal;

  // Auto-close or auto-reopen logic
  if (loan.remainingPrincipal <= 0 && loan.status !== LOAN_STATUS.CLOSED) {
    loan.status = LOAN_STATUS.CLOSED;
    loan.closedAt = new Date();
  } else if (loan.remainingPrincipal > 0 && loan.status === LOAN_STATUS.CLOSED) {
    loan.status = LOAN_STATUS.ACTIVE;
    loan.closedAt = null;
  }

  await loan.save();
  return loan;
};

/**
 * @route  GET /api/payments/loan/:loanId
 * @access Protected
 */
const getPaymentHistory = asyncHandler(async (req, res) => {
  const { loanId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  if (!mongoose.Types.ObjectId.isValid(loanId)) {
    return sendError(res, 'Invalid loan ID.', 400);
  }

  const loan = await Loan.findById(loanId).lean();
  if (!loan) {
    return sendError(res, 'Loan not found.', 404);
  }

  const payments = await Payment.find({ loanId, isDeleted: false }).lean();
  const schedule = generatePaymentSchedule(loan, payments);

  const total = schedule.length;
  const paginated = schedule.slice(skip, skip + Number(limit));

  return sendPaginated(res, paginated, total, Number(page), Number(limit), 'Payment history retrieved.');
});

/**
 * @route  POST /api/payments
 * @access Protected
 */
const recordPayment = asyncHandler(async (req, res) => {
  const { loanId, date, totalAmount, interestPaid, principalPaid, remarks } = req.body;

  if (!mongoose.Types.ObjectId.isValid(loanId)) {
    return sendError(res, 'Invalid loan ID.', 400);
  }

  const loan = await Loan.findById(loanId);
  if (!loan) return sendError(res, 'Loan not found.', 404);
  if (loan.status === LOAN_STATUS.CLOSED) {
    return sendError(res, 'Cannot record payment for a closed loan.', 400);
  }
  if (principalPaid > loan.remainingPrincipal) {
    return sendError(res, `Principal paid cannot exceed remaining principal (₹${loan.remainingPrincipal}).`, 400);
  }

  const expectedTotal = parseFloat((interestPaid + principalPaid).toFixed(2));
  if (Math.abs(totalAmount - expectedTotal) > 0.01) {
    return sendError(res, `Total amount must equal interest + principal.`, 400);
  }

  const newRemainingPrincipal = parseFloat((loan.remainingPrincipal - principalPaid).toFixed(2));

  const payment = await Payment.create({
    loanId,
    customerId: loan.customerId,
    date: new Date(date),
    totalAmount,
    interestPaid,
    principalPaid,
    remainingPrincipalAfter: newRemainingPrincipal,
    remarks,
    recordedBy: req.admin?.email || 'admin',
  });

  await recalculateLoanBalances(loanId);
  const updatedLoan = await Loan.findById(loanId);

  await auditLog(req, AUDIT_ACTIONS.RECORD_PAYMENT, 'payment', payment._id.toString(), {
    loanId,
    totalAmount,
    interestPaid,
    principalPaid,
  });

  return sendSuccess(res, { payment, loan: updatedLoan }, updatedLoan.status === LOAN_STATUS.CLOSED ? 'Payment recorded. Loan fully paid and closed.' : 'Payment recorded successfully.', 201);
});

/**
 * @route  PUT /api/payments/:id
 * @access Protected
 */
const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, totalAmount, interestPaid, principalPaid, remarks } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid payment ID.', 400);
  }

  const expectedTotal = parseFloat((interestPaid + principalPaid).toFixed(2));
  if (Math.abs(totalAmount - expectedTotal) > 0.01) {
    return sendError(res, `Total amount must equal interest + principal.`, 400);
  }

  const payment = await Payment.findOne({ _id: id, isDeleted: false });
  if (!payment) {
    return sendError(res, 'Payment not found or already deleted.', 404);
  }

  // Update fields
  payment.date = new Date(date);
  payment.totalAmount = totalAmount;
  payment.interestPaid = interestPaid;
  payment.principalPaid = principalPaid;
  payment.remarks = remarks;
  
  await payment.save();

  // Full recalculation to guarantee integrity
  const updatedLoan = await recalculateLoanBalances(payment.loanId);

  await auditLog(req, AUDIT_ACTIONS.UPDATE, 'payment', payment._id.toString(), {
    totalAmount,
    interestPaid,
    principalPaid,
  });

  return sendSuccess(res, { payment, loan: updatedLoan }, 'Payment updated successfully.');
});

/**
 * @route  DELETE /api/payments/:id
 * @access Protected
 */
const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 'Invalid payment ID.', 400);
  }

  const payment = await Payment.findOne({ _id: id, isDeleted: false });
  if (!payment) {
    return sendError(res, 'Payment not found or already deleted.', 404);
  }

  payment.isDeleted = true;
  payment.deletedBy = req.admin?.email || 'admin';
  await payment.save();

  // Full recalculation
  const updatedLoan = await recalculateLoanBalances(payment.loanId);

  await auditLog(req, AUDIT_ACTIONS.DELETE, 'payment', payment._id.toString(), {
    deletedBy: req.admin?.email,
  });

  return sendSuccess(res, { loan: updatedLoan }, 'Payment successfully deleted.');
});

module.exports = { getPaymentHistory, recordPayment, updatePayment, deletePayment };
