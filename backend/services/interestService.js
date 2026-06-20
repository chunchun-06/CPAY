'use strict';

const { PAYMENT_STATUS } = require('../config/constants');
const { getNextDueDate, getCurrentMonthPayment, getDaysOverdue } = require('../helpers/dateHelper');
const { generatePaymentSchedule } = require('../helpers/paymentScheduleHelper');

/**
 * Calculate monthly interest amount.
 * @param {number} remainingPrincipal
 * @param {number} interestRate - Percentage e.g. 2 means 2%
 * @returns {number} Monthly interest amount rounded to 2 decimals
 */
const calculateMonthlyInterest = (remainingPrincipal, interestRate) => {
  return parseFloat(((remainingPrincipal * interestRate) / 100).toFixed(2));
};

/**
 * Update loan's remaining principal after a payment.
 * @param {Object} loan - Mongoose Loan document
 * @param {number} principalPaid - Amount of principal paid this payment
 * @returns {number} New remaining principal
 */
const updateLoanAfterPayment = (loan, principalPaid) => {
  const newRemainingPrincipal = parseFloat(
    (loan.remainingPrincipal - principalPaid).toFixed(2)
  );
  return Math.max(0, newRemainingPrincipal);
};

/**
 * Get comprehensive payment status for a loan.
 * @param {Object} loan - Mongoose Loan document
 * @param {Array} payments - All payments for this loan
 * @returns {{
 *   status: string,
 *   nextDueDate: Date,
 *   monthlyInterest: number,
 *   daysOverdue: number,
 *   isPaid: boolean,
 *   isOverdue: boolean
 * }}
 */
const getPaymentStatusForLoan = (loan, payments) => {
  const schedule = generatePaymentSchedule(loan, payments);
  
  // Find any pending payments
  const pendingPayments = schedule.filter(p => p.status === PAYMENT_STATUS.PENDING);
  const isOverdue = pendingPayments.length > 0;
  
  // Find next upcoming
  const upcoming = schedule.find(p => p.status === PAYMENT_STATUS.UPCOMING);
  const nextDueDate = upcoming ? upcoming.date : getNextDueDate(loan.loanStartDate, loan.monthlyDueDay);
  
  // Current monthly interest based on remaining principal
  const monthlyInterest = calculateMonthlyInterest(loan.remainingPrincipal, loan.interestRate);
  
  let status = PAYMENT_STATUS.UPCOMING;
  let daysOverdue = 0;

  if (isOverdue) {
    status = PAYMENT_STATUS.PENDING;
    // Get oldest pending
    const oldest = pendingPayments[pendingPayments.length - 1];
    daysOverdue = oldest.daysOverdue || 0;
  } else if (schedule.find(p => p.status === PAYMENT_STATUS.DUE_TODAY)) {
    status = PAYMENT_STATUS.DUE_TODAY;
  } else if (schedule.length > 0 && schedule[0].status === PAYMENT_STATUS.PAID) {
    // If the most recent schedule item is paid
    const now = new Date();
    const dDate = new Date(now.getFullYear(), now.getMonth(), loan.monthlyDueDay);
    const pDate = new Date(schedule[0].date);
    if (pDate.getFullYear() === now.getFullYear() && pDate.getMonth() === now.getMonth()) {
      status = PAYMENT_STATUS.PAID;
    }
  }

  return {
    status,
    nextDueDate,
    monthlyInterest,
    daysOverdue,
    isPaid: status === PAYMENT_STATUS.PAID,
    isOverdue
  };
};

module.exports = {
  calculateMonthlyInterest,
  updateLoanAfterPayment,
  getPaymentStatusForLoan,
};
