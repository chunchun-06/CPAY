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

  const payments = await Payment.find({ loanId }).lean();
  const schedule = generatePaymentSchedule(loan, payments);

  const total = schedule.length;
  const paginated = schedule.slice(skip, skip + Number(limit));

  return sendPaginated(res, paginated, total, Number(page), Number(limit), 'Payment history retrieved.');
});

/**
 * @route  POST /api/payments
 * @access Protected
 * @desc   Record a new payment against a loan
 */
const recordPayment = asyncHandler(async (req, res) => {
  const { loanId, customerId, date, totalAmount, interestPaid, principalPaid, remarks } = req.body;

  if (!mongoose.Types.ObjectId.isValid(loanId)) {
    return sendError(res, 'Invalid loan ID.', 400);
  }

  const loan = await Loan.findById(loanId);
  if (!loan) {
    return sendError(res, 'Loan not found.', 404);
  }

  if (loan.status === LOAN_STATUS.CLOSED) {
    return sendError(res, 'Cannot record payment for a closed loan.', 400);
  }

  // Validate principal paid doesn't exceed remaining principal
  if (principalPaid > loan.remainingPrincipal) {
    return sendError(
      res,
      `Principal paid (₹${principalPaid}) cannot exceed remaining principal (₹${loan.remainingPrincipal}).`,
      400
    );
  }

  // Validate total = interest + principal
  const expectedTotal = parseFloat((interestPaid + principalPaid).toFixed(2));
  if (Math.abs(totalAmount - expectedTotal) > 0.01) {
    return sendError(
      res,
      `Total amount (${totalAmount}) must equal interest paid (${interestPaid}) + principal paid (${principalPaid}).`,
      400
    );
  }

  const newRemainingPrincipal = parseFloat((loan.remainingPrincipal - principalPaid).toFixed(2));

  try {
    // Create payment record
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

    // Update loan
    loan.remainingPrincipal = newRemainingPrincipal;
    loan.totalInterestPaid = parseFloat((loan.totalInterestPaid + interestPaid).toFixed(2));
    loan.totalPrincipalPaid = parseFloat((loan.totalPrincipalPaid + principalPaid).toFixed(2));

    // Auto-close loan if fully paid
    if (newRemainingPrincipal <= 0) {
      loan.status = LOAN_STATUS.CLOSED;
      loan.closedAt = new Date();
    }

    await loan.save();

    await auditLog(req, AUDIT_ACTIONS.RECORD_PAYMENT, 'payment', payment._id.toString(), {
      loanId,
      totalAmount,
      interestPaid,
      principalPaid,
      remainingPrincipalAfter: newRemainingPrincipal,
    });

    return sendSuccess(
      res,
      { payment, loan },
      newRemainingPrincipal <= 0
        ? 'Payment recorded. Loan fully paid and closed.'
        : 'Payment recorded successfully.',
      201
    );
  } catch (error) {
    throw error;
  }
});

module.exports = { getPaymentHistory, recordPayment };
