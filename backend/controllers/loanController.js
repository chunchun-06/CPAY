'use strict';

const Loan = require('../models/Loan');
const Customer = require('../models/Customer');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../helpers/responseHelper');
const { auditLog } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS, LOAN_STATUS } = require('../config/constants');

/**
 * @route  GET /api/loans/customer/:customerId
 * @access Protected
 * @desc   customerId here is secureToken
 */
const getLoanByCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params; // secureToken

  const customer = await Customer.findOne({ secureToken: customerId, isDeleted: false }).lean();
  if (!customer) {
    return sendError(res, 'Customer not found.', 404);
  }

  const loan = await Loan.findOne({ customerId: customer._id });
  if (!loan) {
    return sendError(res, 'No loan found for this customer.', 404);
  }

  return sendSuccess(res, loan, 'Loan retrieved.');
});

/**
 * @route  PUT /api/loans/:id
 * @access Protected
 * @desc   Update loan fields (interestRate, monthlyDueDay, loanStartDate, loanAmount)
 */
const updateLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { interestRate, monthlyDueDay, loanStartDate, loanAmount } = req.body;

  const loan = await Loan.findById(id);
  if (!loan) {
    return sendError(res, 'Loan not found.', 404);
  }

  if (loan.status === LOAN_STATUS.CLOSED) {
    return sendError(res, 'Cannot update a closed loan.', 400);
  }

  const updates = {};
  if (interestRate !== undefined) updates.interestRate = interestRate;
  if (monthlyDueDay !== undefined) updates.monthlyDueDay = monthlyDueDay;
  if (loanStartDate !== undefined) updates.loanStartDate = new Date(loanStartDate);
  if (loanAmount !== undefined) {
    updates.loanAmount = loanAmount;
    // Update remaining principal proportionally only if no payments have been made
    if (loan.totalPrincipalPaid === 0) {
      updates.remainingPrincipal = loanAmount;
    }
  }

  const updatedLoan = await Loan.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  await auditLog(req, AUDIT_ACTIONS.UPDATE, 'loan', id, { updates });

  return sendSuccess(res, updatedLoan, 'Loan updated successfully.');
});

/**
 * @route  PATCH /api/loans/:id/close
 * @access Protected
 */
const closeLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const loan = await Loan.findById(id);
  if (!loan) {
    return sendError(res, 'Loan not found.', 404);
  }

  if (loan.status === LOAN_STATUS.CLOSED) {
    return sendError(res, 'Loan is already closed.', 400);
  }

  loan.status = LOAN_STATUS.CLOSED;
  loan.closedAt = new Date();
  await loan.save();

  await auditLog(req, AUDIT_ACTIONS.CLOSE_LOAN, 'loan', id, {
    remainingPrincipalAtClose: loan.remainingPrincipal,
    totalInterestPaid: loan.totalInterestPaid,
  });

  return sendSuccess(res, loan, 'Loan closed successfully.');
});

module.exports = { getLoanByCustomer, updateLoan, closeLoan };
