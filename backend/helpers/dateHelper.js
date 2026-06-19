'use strict';

const { PAYMENT_STATUS } = require('../config/constants');

/**
 * Given a loan start date and monthlyDueDay, calculate the next due date.
 * @param {Date} loanStartDate
 * @param {number} monthlyDueDay - Day of month (1-31)
 * @returns {Date}
 */
const getNextDueDate = (loanStartDate, monthlyDueDay) => {
  const now = new Date();
  const startDate = new Date(loanStartDate);

  // Start from the month of the loan or current month, whichever is later
  let candidate = new Date(
    Math.max(startDate.getFullYear(), now.getFullYear()),
    now.getMonth(),
    monthlyDueDay
  );

  // If this month's due date is in the past or today, move to next month
  if (candidate <= now) {
    candidate = new Date(now.getFullYear(), now.getMonth() + 1, monthlyDueDay);
  }

  // Handle months with fewer days (e.g. Feb 30 => Mar 2)
  // By setting day > month's max, JS auto-overflows, which is acceptable
  return candidate;
};

/**
 * Determine if payment was made for the current month for a given loan.
 * @param {Array} payments - Array of Payment documents
 * @returns {Object|null} The current month's payment or null
 */
const getCurrentMonthPayment = (payments) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  return (
    payments.find((p) => {
      const payDate = new Date(p.date);
      return payDate.getFullYear() === currentYear && payDate.getMonth() === currentMonth;
    }) || null
  );
};

/**
 * Returns payment status for a loan: 'paid', 'pending', or 'upcoming'
 * @param {Object} loan - Loan document
 * @param {Array} payments - All payments for this loan
 * @returns {string} PAYMENT_STATUS value
 */
const getPaymentStatus = (loan, payments) => {
  const { monthlyDueDay, loanStartDate } = loan;
  const now = new Date();

  // Build this month's due date
  const dueDate = new Date(now.getFullYear(), now.getMonth(), monthlyDueDay);

  // Check if current month is before loan started
  if (new Date(loanStartDate) > dueDate) {
    return PAYMENT_STATUS.UPCOMING;
  }

  // Check if payment was made this month
  const currentPayment = getCurrentMonthPayment(payments);
  if (currentPayment) {
    return PAYMENT_STATUS.PAID;
  }

  // Due date has passed without payment
  if (now > dueDate) {
    return PAYMENT_STATUS.PENDING;
  }

  return PAYMENT_STATUS.UPCOMING;
};

/**
 * Check if a given date is overdue (in the past).
 * @param {Date} dueDate
 * @returns {boolean}
 */
const isOverdue = (dueDate) => {
  return new Date() > new Date(dueDate);
};

/**
 * Format a date to a readable string: "June 19, 2026"
 * @param {Date|string} date
 * @returns {string}
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Calculate the number of days a payment is overdue.
 * @param {number} monthlyDueDay
 * @returns {number} Days overdue (0 if not overdue)
 */
const getDaysOverdue = (monthlyDueDay) => {
  const now = new Date();
  const dueDate = new Date(now.getFullYear(), now.getMonth(), monthlyDueDay);
  if (now <= dueDate) return 0;
  const diffMs = now - dueDate;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

module.exports = {
  getNextDueDate,
  getPaymentStatus,
  getCurrentMonthPayment,
  isOverdue,
  formatDate,
  getDaysOverdue,
};
