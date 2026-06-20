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
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [
    totalCustomers,
    allActiveLoans,
    allLoans,
    thisMonthPayments,
    lastMonthPayments,
    newCustomersThisMonth,
  ] = await Promise.all([
    Customer.countDocuments({ isDeleted: false }),
    Loan.find({ status: LOAN_STATUS.ACTIVE }).select('remainingPrincipal monthlyDueDay customerId interestRate loanAmount').lean(),
    Loan.find().select('totalInterestPaid').lean(),
    Payment.find({ date: { $gte: startOfThisMonth, $lte: endOfThisMonth }, isDeleted: false }).lean(),
    Payment.find({ date: { $gte: startOfLastMonth, $lte: endOfLastMonth }, isDeleted: false }).lean(),
    Customer.countDocuments({ createdAt: { $gte: startOfThisMonth, $lte: endOfThisMonth }, isDeleted: false }),
  ]);

  // Outstanding principal
  const outstandingPrincipal = allActiveLoans.reduce((sum, l) => sum + l.remainingPrincipal, 0);

  // Total Revenue Earned (Total Interest across all loans)
  const totalRevenueEarned = allLoans.reduce((sum, l) => sum + (l.totalInterestPaid || 0), 0);

  // Total Collected This Month (Interest + Principal)
  const totalCollectedThisMonth = thisMonthPayments.reduce((sum, p) => sum + p.totalAmount, 0);
  const revenueThisMonth = thisMonthPayments.reduce((sum, p) => sum + p.interestPaid, 0);
  const principalCollectedThisMonth = thisMonthPayments.reduce((sum, p) => sum + p.principalPaid, 0);
  
  // Revenue Last Month
  const revenueLastMonth = lastMonthPayments.reduce((sum, p) => sum + p.interestPaid, 0);

  // Difference %
  let revenueDifferencePercent = 0;
  if (revenueLastMonth > 0) {
    revenueDifferencePercent = ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
  } else if (revenueThisMonth > 0) {
    revenueDifferencePercent = 100;
  }

  // Pre-fetch all payments for active loans
  const loanIds = allActiveLoans.map((l) => l._id);
  const payments = await Payment.find({ loanId: { $in: loanIds }, isDeleted: false }).lean();

  const paymentsByLoan = {};
  payments.forEach((p) => {
    const key = p.loanId.toString();
    if (!paymentsByLoan[key]) paymentsByLoan[key] = [];
    paymentsByLoan[key].push(p);
  });

  let pendingInterest = 0;
  let customersPaidThisMonth = 0;
  let customersPendingThisMonth = 0;
  let overdueCustomers = 0;
  let todaysDueCustomers = 0;

  const todayStr = new Date().toISOString().split('T')[0];

  allActiveLoans.forEach((loan) => {
    const loanPayments = paymentsByLoan[loan._id.toString()] || [];
    const schedule = generatePaymentSchedule(loan, loanPayments);
    
    // Find virtual pending items
    const pendingItems = schedule.filter(p => p.isVirtual && p.status !== PAYMENT_STATUS.PAID);
    
    pendingItems.forEach(pi => {
      pendingInterest += pi.interestPaid; // expected interest
    });

    if (pendingItems.some(pi => pi.daysOverdue > 0)) {
      overdueCustomers++;
    }

    if (pendingItems.some(pi => new Date(pi.date).toISOString().split('T')[0] === todayStr)) {
      todaysDueCustomers++;
    }

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
      }
    }
  });

  return sendSuccess(
    res,
    {
      totalCustomers,
      outstandingPrincipal: parseFloat(outstandingPrincipal.toFixed(2)),
      totalRevenueEarned: parseFloat(totalRevenueEarned.toFixed(2)),
      totalCollectedThisMonth: parseFloat(totalCollectedThisMonth.toFixed(2)),
      revenueThisMonth: parseFloat(revenueThisMonth.toFixed(2)),
      principalCollectedThisMonth: parseFloat(principalCollectedThisMonth.toFixed(2)),
      revenueLastMonth: parseFloat(revenueLastMonth.toFixed(2)),
      revenueDifferencePercent: parseFloat(revenueDifferencePercent.toFixed(1)),
      newCustomersThisMonth,
      paymentsRecordedThisMonth: thisMonthPayments.length,
      pendingInterest: parseFloat(pendingInterest.toFixed(2)),
      customersPaidThisMonth,
      customersPendingThisMonth,
      overdueCustomers,
      todaysDueCustomers,
      activeCustomers: allActiveLoans.length,
    },
    'Dashboard stats retrieved.'
  );
});

/**
 * @route  GET /api/dashboard/overdue
 * @access Protected
 */
const getOverdueCustomers = asyncHandler(async (req, res) => {
  const activeLoans = await Loan.find({ status: LOAN_STATUS.ACTIVE })
    .populate('customerId', 'fullName mobileNumber secureToken isDeleted address')
    .lean();

  const loanIds = activeLoans.map((l) => l._id);
  const payments = await Payment.find({ loanId: { $in: loanIds }, isDeleted: false }).lean();

  const paymentsByLoan = {};
  payments.forEach((p) => {
    const key = p.loanId.toString();
    if (!paymentsByLoan[key]) paymentsByLoan[key] = [];
    paymentsByLoan[key].push(p);
  });

  const overdueList = [];

  activeLoans.forEach((loan) => {
    if (!loan.customerId || loan.customerId.isDeleted) return;

    const loanPayments = paymentsByLoan[loan._id.toString()] || [];
    const schedule = generatePaymentSchedule(loan, loanPayments);
    
    // A customer might have multiple overdue months. We aggregate them.
    const overdueItems = schedule.filter(p => p.isVirtual && p.daysOverdue > 0 && p.status !== PAYMENT_STATUS.PAID);

    if (overdueItems.length > 0) {
      // Find the oldest overdue date
      const oldestOverdue = overdueItems.reduce((oldest, item) => (new Date(item.date) < new Date(oldest.date) ? item : oldest), overdueItems[0]);
      
      // Sum all pending interest
      const totalPendingInterest = overdueItems.reduce((sum, item) => sum + item.interestPaid, 0);

      overdueList.push({
        id: loan._id, // use loan id as unique key
        customer: {
          token: loan.customerId.secureToken,
          fullName: loan.customerId.fullName,
          mobileNumber: loan.customerId.mobileNumber,
          address: loan.customerId.address,
        },
        loan: {
          remainingPrincipal: loan.remainingPrincipal,
          pendingInterest: totalPendingInterest,
          dueDate: oldestOverdue.date,
          daysOverdue: oldestOverdue.daysOverdue,
        },
      });
    }
  });

  // Sort: Highest days overdue first
  overdueList.sort((a, b) => b.loan.daysOverdue - a.loan.daysOverdue);

  return sendSuccess(res, overdueList, `${overdueList.length} overdue customers.`);
});

/**
 * @route  GET /api/dashboard/recent-payments
 * @access Protected
 */
const getRecentPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ isDeleted: false })
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
  getOverdueCustomers,
  getRecentPayments,
};
