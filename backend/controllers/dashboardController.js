'use strict';

const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../helpers/responseHelper');
const { LOAN_STATUS, PAYMENT_STATUS } = require('../config/constants');
const { generatePaymentSchedule } = require('../helpers/paymentScheduleHelper');

/**
 * @route  GET /api/dashboard/stats
 * @access Protected
 */
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    totalCustomers,
    allActiveLoans,
    monthlyPayments,
  ] = await Promise.all([
    Customer.countDocuments({ isDeleted: false }),
    Loan.find({ status: LOAN_STATUS.ACTIVE }).select('remainingPrincipal monthlyDueDay customerId interestRate loanAmount').lean(),
    Payment.find({ date: { $gte: startOfMonth, $lte: endOfMonth } })
      .select('loanId interestPaid')
      .lean(),
  ]);

  // Outstanding principal
  const outstandingPrincipal = allActiveLoans.reduce(
    (sum, l) => sum + l.remainingPrincipal,
    0
  );

  // Interest collected this month
  const interestCollectedThisMonth = monthlyPayments.reduce(
    (sum, p) => sum + p.interestPaid,
    0
  );

  const loanIds = allActiveLoans.map((l) => l._id);
  const payments = await Payment.find({ loanId: { $in: loanIds } }).select('loanId date').lean();

  const paymentsByLoan = {};
  payments.forEach((p) => {
    const key = p.loanId.toString();
    if (!paymentsByLoan[key]) paymentsByLoan[key] = [];
    paymentsByLoan[key].push(p);
  });

  let pendingInterest = 0;
  let customersPaidThisMonth = 0;
  let customersPendingThisMonth = 0;

  allActiveLoans.forEach((loan) => {
    const loanPayments = paymentsByLoan[loan._id.toString()] || [];
    const schedule = generatePaymentSchedule(loan, loanPayments);
    
    // Find the schedule item for the current month
    const thisMonthItem = schedule.find(p => {
      const d = new Date(p.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    if (thisMonthItem) {
      if (thisMonthItem.status === PAYMENT_STATUS.PAID || !thisMonthItem.isVirtual) {
        customersPaidThisMonth++;
      } else {
        customersPendingThisMonth++;
        pendingInterest += thisMonthItem.interestPaid; // expected interest
      }
    }
  });

  return sendSuccess(
    res,
    {
      totalCustomers,
      outstandingPrincipal: parseFloat(outstandingPrincipal.toFixed(2)),
      pendingInterest: parseFloat(pendingInterest.toFixed(2)),
      interestCollectedThisMonth: parseFloat(interestCollectedThisMonth.toFixed(2)),
      customersPaidThisMonth,
      activeCustomers: allActiveLoans.length,
      customersPendingThisMonth,
    },
    'Dashboard stats retrieved.'
  );
});

/**
 * @route  GET /api/dashboard/monthly-pending
 * @access Protected
 * @desc   Customers where this month's payment is pending/overdue
 */
const getMonthlyPendingCustomers = asyncHandler(async (req, res) => {
  const now = new Date();

  const activeLoans = await Loan.find({ status: LOAN_STATUS.ACTIVE })
    .populate('customerId', 'fullName mobileNumber secureToken isDeleted address')
    .lean();

  const loanIds = activeLoans.map((l) => l._id);
  const payments = await Payment.find({ loanId: { $in: loanIds } })
    .select('loanId date')
    .lean();

  const paymentsByLoan = {};
  payments.forEach((p) => {
    const key = p.loanId.toString();
    if (!paymentsByLoan[key]) paymentsByLoan[key] = [];
    paymentsByLoan[key].push(p);
  });

  const pendingList = [];

  activeLoans.forEach((loan) => {
    if (!loan.customerId || loan.customerId.isDeleted) return;

    const loanPayments = paymentsByLoan[loan._id.toString()] || [];
    const schedule = generatePaymentSchedule(loan, loanPayments);
    
    const thisMonthItem = schedule.find(p => {
      const d = new Date(p.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    if (thisMonthItem && thisMonthItem.status !== PAYMENT_STATUS.PAID && thisMonthItem.isVirtual) {
      pendingList.push({
        id: thisMonthItem._id || thisMonthItem.id,
        customer: {
          token: loan.customerId.secureToken,
          fullName: loan.customerId.fullName,
          mobileNumber: loan.customerId.mobileNumber,
          address: loan.customerId.address,
        },
        loan: {
          id: loan._id,
          remainingPrincipal: thisMonthItem.remainingPrincipal,
          monthlyInterest: thisMonthItem.interestPaid,
          monthlyDueDay: loan.monthlyDueDay,
          daysOverdue: thisMonthItem.daysOverdue,
          dueDate: thisMonthItem.date,
          status: thisMonthItem.status
        },
      });
    }
  });

  // Sort: Overdue first (by daysOverdue desc), then due soonest
  pendingList.sort((a, b) => {
    if (a.loan.daysOverdue > 0 || b.loan.daysOverdue > 0) {
      return b.loan.daysOverdue - a.loan.daysOverdue;
    }
    return new Date(a.loan.dueDate) - new Date(b.loan.dueDate);
  });

  return sendSuccess(res, pendingList, `${pendingList.length} pending customer(s) this month.`);
});

/**
 * @route  GET /api/dashboard/recent-payments
 * @access Protected
 */
const getRecentPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate({
      path: 'customerId',
      select: 'fullName mobileNumber secureToken',
    })
    .lean();

  const data = payments.map((p) => ({
    id: p._id,
    date: p.date,
    totalAmount: p.totalAmount,
    interestPaid: p.interestPaid,
    principalPaid: p.principalPaid,
    remainingPrincipalAfter: p.remainingPrincipalAfter,
    remarks: p.remarks,
    recordedBy: p.recordedBy,
    customer: p.customerId
      ? {
          token: p.customerId.secureToken,
          fullName: p.customerId.fullName,
          mobileNumber: p.customerId.mobileNumber,
        }
      : null,
  }));

  return sendSuccess(res, data, 'Recent payments retrieved.');
});

module.exports = {
  getStats,
  getMonthlyPendingCustomers,
  getRecentPayments,
};
