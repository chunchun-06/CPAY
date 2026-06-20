'use strict';

const { PAYMENT_STATUS } = require('../config/constants');

/**
 * Dynamically generate a timeline of payments including actual payments and pending/overdue virtual payments.
 * @param {Object} loan 
 * @param {Array} actualPayments 
 */
const generatePaymentSchedule = (loan, actualPayments) => {
  const schedule = [];
  const start = new Date(loan.loanStartDate);
  const now = new Date();
  
  // Set the start date to the first due date (next month from start date)
  let currentDueMonth = start.getMonth() + 1;
  let currentDueYear = start.getFullYear();

  // If the due day is greater than days in month, JS date naturally wraps, but we should handle it cleanly by using Date constructor
  let currentDate = new Date(currentDueYear, currentDueMonth, loan.monthlyDueDay);

  // We need to keep track of the remaining principal at the time to calculate interest
  let runningPrincipal = loan.loanAmount;

  // Clone actual payments and sort ascending
  const sortedPayments = [...actualPayments].sort((a, b) => new Date(a.date) - new Date(b.date));

  let pIndex = 0;

  // We iterate up to the current month + 1 (to show the upcoming payment)
  const endLimit = new Date(now.getFullYear(), now.getMonth() + 1, loan.monthlyDueDay);

  while (currentDate <= endLimit) {
    // 1. Process all actual payments that happened BEFORE this due date
    while (pIndex < sortedPayments.length) {
      const payment = sortedPayments[pIndex];
      const pDate = new Date(payment.date);
      
      // If payment was made before or exactly on this due date, and we haven't passed it
      if (pDate <= currentDate) {
        schedule.push({
          ...payment,
          isVirtual: false,
          status: PAYMENT_STATUS.PAID
        });
        runningPrincipal = payment.remainingPrincipalAfter;
        pIndex++;
      } else {
        break; // Payment belongs to a future period
      }
    }

    // 2. Determine if this specific due month was paid.
    // In our simplified logic, if the user made ANY payment that covers this month, we consider it paid?
    // Actually, lenders look at the total interest paid vs expected.
    // But the simplest rule requested by user: if they didn't make a payment in this exact month, it's pending.
    // Let's check if there is an actual payment IN THIS MONTH and YEAR.
    const hasPaymentThisMonth = sortedPayments.some(p => {
      const d = new Date(p.date);
      return d.getFullYear() === currentDueYear && d.getMonth() === currentDueMonth;
    });

    if (!hasPaymentThisMonth) {
      const expectedInterest = parseFloat(((runningPrincipal * loan.interestRate) / 100).toFixed(2));
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cDate = new Date(currentDate);
      cDate.setHours(0, 0, 0, 0);

      let status;
      let daysOverdue = 0;

      if (cDate > today) {
        status = PAYMENT_STATUS.UPCOMING;
      } else if (cDate.getTime() === today.getTime()) {
        status = PAYMENT_STATUS.DUE_TODAY;
      } else {
        status = PAYMENT_STATUS.PENDING;
        daysOverdue = Math.floor((today - cDate) / (1000 * 60 * 60 * 24));
      }
      
      schedule.push({
        _id: `virtual_${currentDueYear}_${currentDueMonth}`,
        date: new Date(currentDate),
        interestPaid: expectedInterest, // Expected amount to pay
        principalPaid: 0,
        totalAmount: expectedInterest,
        remainingPrincipalAfter: runningPrincipal,
        remainingPrincipal: runningPrincipal,
        status: status,
        isVirtual: true,
        daysOverdue: daysOverdue
      });
    }

    // Move to next month
    currentDueMonth++;
    if (currentDueMonth > 11) {
      currentDueMonth = 0;
      currentDueYear++;
    }
    currentDate = new Date(currentDueYear, currentDueMonth, loan.monthlyDueDay);
  }

  // Push any remaining actual payments (e.g. paid in advance)
  while (pIndex < sortedPayments.length) {
    schedule.push({
      ...sortedPayments[pIndex],
      isVirtual: false,
      status: PAYMENT_STATUS.PAID
    });
    pIndex++;
  }

  // Return sorted descending (newest first)
  return schedule.sort((a, b) => new Date(b.date) - new Date(a.date));
};

module.exports = { generatePaymentSchedule };
