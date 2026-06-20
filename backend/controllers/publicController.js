'use strict';

const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../helpers/responseHelper');
const { getPaymentStatusForLoan } = require('../services/interestService');
const { generateCustomerLink } = require('../services/tokenService');
const { generatePaymentSchedule } = require('../helpers/paymentScheduleHelper');
const { LOAN_STATUS } = require('../config/constants');

/**
 * @route  GET /api/public/customer/:linkParam
 * @access Public (No auth required)
 * @desc   Returns safe, read-only customer data for public view page
 */
const getCustomerByToken = asyncHandler(async (req, res) => {
  const { linkParam } = req.params;

  if (!linkParam || !linkParam.includes('-')) {
    return sendError(res, 'Invalid link format.', 400);
  }

  const [customerId, token] = linkParam.split('-');

  // Find only non-deleted customers matching both ID and token
  const customer = await Customer.findOne({ customerId, secureToken: token, isDeleted: false }).lean();
  if (!customer) {
    return sendError(res, 'No account found for this link. It may have expired or been revoked.', 404);
  }

  const loan = await Loan.findOne({ customerId: customer._id }).lean();
  if (!loan) {
    return sendError(res, 'No active loan found for this account.', 404);
  }

  // Add computed monthly interest virtual
  loan.monthlyInterest = parseFloat(((loan.remainingPrincipal * loan.interestRate) / 100).toFixed(2));

  // Get payment history (all payments for public view)
  const payments = await Payment.find({ loanId: loan._id, isDeleted: false })
    .sort({ date: -1 })
    .lean();

  const schedule = generatePaymentSchedule(loan, payments);

  // Get payment status
  let paymentStatus = null;
  if (loan.status === LOAN_STATUS.ACTIVE) {
    paymentStatus = getPaymentStatusForLoan(loan, payments);
  }

  // Build safe response — NO internal IDs exposed
  const response = {
    customer: {
      fullName: customer.fullName,
      mobileNumber: customer.mobileNumber,
      address: customer.address || '',
    },
    loan: {
      loanAmount: loan.loanAmount,
      remainingPrincipal: loan.remainingPrincipal,
      interestRate: loan.interestRate,
      monthlyInterest: loan.monthlyInterest,
      monthlyDueDay: loan.monthlyDueDay,
      loanStartDate: loan.loanStartDate,
      status: loan.status,
      closedAt: loan.closedAt,
      totalInterestPaid: loan.totalInterestPaid,
      totalPrincipalPaid: loan.totalPrincipalPaid,
    },
    paymentStatus,
    recentPayments: schedule.map((p) => ({
      date: p.date,
      totalAmount: p.totalAmount,
      interestPaid: p.interestPaid,
      principalPaid: p.principalPaid,
      remainingPrincipalAfter: p.remainingPrincipalAfter,
      remainingPrincipal: p.remainingPrincipal,
      remarks: p.remarks || '',
      status: p.status || '',
      isVirtual: p.isVirtual || false,
    })),
  };

  return sendSuccess(res, response, 'Account information retrieved.');
});

module.exports = { getCustomerByToken };
