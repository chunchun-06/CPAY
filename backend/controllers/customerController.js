'use strict';

const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const Counter = require('../models/Counter');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendPaginated } = require('../helpers/responseHelper');
const { auditLog } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS, LOAN_STATUS } = require('../config/constants');
const { generateSecureToken, generateCustomerLink } = require('../services/tokenService');
const { getPaymentStatusForLoan } = require('../services/interestService');

/**
 * Map a customer document to a safe public response object.
 * Never expose MongoDB internal _id directly — use secureToken as identifier.
 */
const mapCustomer = (customer, loan = null, paymentStatus = null) => {
  const obj = {
    customerId: customer.customerId,
    token: customer.secureToken,
    fullName: customer.fullName,
    mobileNumber: customer.mobileNumber,
    address: customer.address || '',
    notes: customer.notes || '',
    isDeleted: customer.isDeleted,
    deletedAt: customer.deletedAt,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    publicLink: generateCustomerLink(customer.customerId, customer.secureToken, process.env.FRONTEND_URL),
  };

  if (loan) {
    obj.loan = {
      id: loan._id,
      loanAmount: loan.loanAmount,
      remainingPrincipal: loan.remainingPrincipal,
      interestRate: loan.interestRate,
      monthlyDueDay: loan.monthlyDueDay,
      monthlyInterest: loan.monthlyInterest,
      loanStartDate: loan.loanStartDate,
      status: loan.status,
      closedAt: loan.closedAt,
      totalInterestPaid: loan.totalInterestPaid,
      totalPrincipalPaid: loan.totalPrincipalPaid,
    };
  }

  if (paymentStatus) {
    obj.paymentStatus = paymentStatus;
  }

  return obj;
};

/**
 * @route  GET /api/customers
 * @access Protected
 * @desc   List all non-deleted customers with optional search and pagination
 */
const getAllCustomers = asyncHandler(async (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  // Auto-generate missing fields for backward compatibility
  const missingTokens = await Customer.find({ $or: [{ secureToken: { $exists: false } }, { secureToken: null }, { customerId: { $exists: false } }, { secureToken: { $regex: '-' } }] });
  for (const c of missingTokens) {
    let needsSave = false;
    if (!c.customerId) {
      const counter = await Counter.findByIdAndUpdate('customerId', { $inc: { seq: 1 } }, { new: true, upsert: true });
      c.customerId = 'CUST' + counter.seq.toString().padStart(4, '0');
      needsSave = true;
    }
    if (!c.secureToken || c.secureToken.includes('-')) {
      c.secureToken = generateSecureToken();
      needsSave = true;
    }
    if (needsSave) await c.save();
  }

  const filter = { isDeleted: false };

  if (search.trim()) {
    filter.$or = [
      { fullName: { $regex: search.trim(), $options: 'i' } },
      { mobileNumber: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const [customers, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Customer.countDocuments(filter),
  ]);

  const customerIds = customers.map((c) => c._id);

  // Fetch loans for all customers in one query
  const loans = await Loan.find({ customerId: { $in: customerIds } }).lean();
  const loanMap = {};
  loans.forEach((l) => {
    loanMap[l.customerId.toString()] = l;
  });

  // For each customer, get payment status
  const loanIds = loans.map((l) => l._id);
  const payments = await Payment.find({ loanId: { $in: loanIds } }).lean();
  const paymentsByLoan = {};
  payments.forEach((p) => {
    const key = p.loanId.toString();
    if (!paymentsByLoan[key]) paymentsByLoan[key] = [];
    paymentsByLoan[key].push(p);
  });

  const mapped = customers.map((c) => {
    const loan = loanMap[c._id.toString()];
    let paymentStatus = null;
    if (loan && loan.status === LOAN_STATUS.ACTIVE) {
      const loanPayments = paymentsByLoan[loan._id.toString()] || [];
      // Add virtual
      loan.monthlyInterest = parseFloat(((loan.remainingPrincipal * loan.interestRate) / 100).toFixed(2));
      paymentStatus = getPaymentStatusForLoan(loan, loanPayments);
    }
    return mapCustomer(c, loan, paymentStatus);
  });

  return sendPaginated(res, mapped, total, Number(page), Number(limit), 'Customers retrieved.');
});

/**
 * @route  GET /api/customers/deleted
 * @access Protected
 */
const getDeletedCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [customers, total] = await Promise.all([
    Customer.find({ isDeleted: true }).sort({ deletedAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Customer.countDocuments({ isDeleted: true }),
  ]);

  const mapped = customers.map((c) => mapCustomer(c));
  return sendPaginated(res, mapped, total, Number(page), Number(limit), 'Deleted customers retrieved.');
});

/**
 * @route  GET /api/customers/:id
 * @access Protected
 * @desc   Get single customer by secureToken (used as public ID)
 */
const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params; // id here is the secureToken

  const customer = await Customer.findOne({ secureToken: id }).lean();
  if (!customer) {
    return sendError(res, 'Customer not found.', 404);
  }

  const loan = await Loan.findOne({ customerId: customer._id }).lean();
  let paymentStatus = null;

  if (loan) {
    loan.monthlyInterest = parseFloat(((loan.remainingPrincipal * loan.interestRate) / 100).toFixed(2));
    if (loan.status === LOAN_STATUS.ACTIVE) {
      const payments = await Payment.find({ loanId: loan._id }).lean();
      paymentStatus = getPaymentStatusForLoan(loan, payments);
    }
  }

  return sendSuccess(res, mapCustomer(customer, loan, paymentStatus), 'Customer retrieved.');
});

/**
 * @route  POST /api/customers
 * @access Protected
 * @desc   Create a new customer and their associated loan
 */
const   createCustomer = asyncHandler(async (req, res) => {
  const {
    fullName,
    mobileNumber,
    address,
    notes,
    loanAmount,
    interestRate,
    monthlyDueDay,
    loanStartDate,
  } = req.body;

  // Check for duplicate mobile
  const existing = await Customer.findOne({ mobileNumber: mobileNumber.trim(), isDeleted: false });
  if (existing) {
    return sendError(res, 'A customer with this mobile number already exists.', 409);
  }

  try {
    const counter = await Counter.findByIdAndUpdate(
      'customerId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const customerId = 'CUST' + counter.seq.toString().padStart(4, '0');

    const customer = await Customer.create({
      customerId,
      fullName,
      mobileNumber,
      address,
      notes,
      secureToken: generateSecureToken(),
    });

    // Create associated loan
    const loan = await Loan.create({
      customerId: customer._id,
      loanAmount,
      remainingPrincipal: loanAmount,
      interestRate,
      monthlyDueDay,
      loanStartDate: new Date(loanStartDate),
      status: LOAN_STATUS.ACTIVE,
    });



    // Audit log
    await auditLog(req, AUDIT_ACTIONS.CREATE, 'customer', customer.secureToken, {
      fullName,
      mobileNumber,
      loanAmount,
    });

    // Add virtual
    loan.monthlyInterest = parseFloat(((loan.remainingPrincipal * loan.interestRate) / 100).toFixed(2));

    return sendSuccess(
      res,
      mapCustomer(customer.toObject(), loan.toObject(), null),
      'Customer and loan created successfully.',
      201
    );
  } catch (error) {
    if (customer && customer._id) await Customer.findByIdAndDelete(customer._id);
    throw error;
  }
});

/**
 * @route  PUT /api/customers/:id
 * @access Protected
 */
const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params; // secureToken
  const { fullName, mobileNumber, address, notes } = req.body;

  const customer = await Customer.findOne({ secureToken: id, isDeleted: false });
  if (!customer) {
    return sendError(res, 'Customer not found.', 404);
  }

  const updates = {};
  if (fullName !== undefined) updates.fullName = fullName;
  if (mobileNumber !== undefined) updates.mobileNumber = mobileNumber;
  if (address !== undefined) updates.address = address;
  if (notes !== undefined) updates.notes = notes;

  const updated = await Customer.findByIdAndUpdate(customer._id, updates, {
    new: true,
    runValidators: true,
  }).lean();

  await auditLog(req, AUDIT_ACTIONS.UPDATE, 'customer', id, { updates });

  return sendSuccess(res, mapCustomer(updated), 'Customer updated successfully.');
});

/**
 * @route  DELETE /api/customers/:id
 * @access Protected
 * @desc   Soft delete
 */
const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await Customer.findOne({ secureToken: id, isDeleted: false });
  if (!customer) {
    return sendError(res, 'Customer not found.', 404);
  }

  customer.isDeleted = true;
  customer.deletedAt = new Date();
  await customer.save();

  await auditLog(req, AUDIT_ACTIONS.DELETE, 'customer', id, { fullName: customer.fullName });

  return sendSuccess(res, null, 'Customer deleted successfully.');
});

/**
 * @route  PATCH /api/customers/:id/restore
 * @access Protected
 */
const restoreCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await Customer.findOne({ secureToken: id, isDeleted: true });
  if (!customer) {
    return sendError(res, 'Deleted customer not found.', 404);
  }

  customer.isDeleted = false;
  customer.deletedAt = null;
  await customer.save();

  await auditLog(req, AUDIT_ACTIONS.RESTORE, 'customer', id, { fullName: customer.fullName });

  return sendSuccess(res, mapCustomer(customer.toObject()), 'Customer restored successfully.');
});

/**
 * @route  POST /api/customers/:id/regenerate-token
 * @access Protected
 */
const regenerateToken = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await Customer.findOne({ secureToken: id, isDeleted: false });
  if (!customer) {
    return sendError(res, 'Customer not found.', 404);
  }

  const oldToken = customer.secureToken;
  const newToken = generateSecureToken();
  customer.secureToken = newToken;
  await customer.save();

  await auditLog(req, AUDIT_ACTIONS.GENERATE_TOKEN, 'customer', newToken, {
    oldToken,
    newToken,
    customerId: customer.customerId,
    fullName: customer.fullName,
  });

  return sendSuccess(
    res,
    {
      token: newToken,
      publicLink: generateCustomerLink(customer.customerId, newToken, process.env.FRONTEND_URL),
    },
    'Secure token regenerated. Old link is now invalid.'
  );
});

module.exports = {
  getAllCustomers,
  getDeletedCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
  regenerateToken,
};
