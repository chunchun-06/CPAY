'use strict';

const mongoose = require('mongoose');
const { LOAN_STATUS } = require('../config/constants');

const loanSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    loanAmount: {
      type: Number,
      required: [true, 'Loan amount is required'],
      min: [1, 'Loan amount must be greater than 0'],
    },
    remainingPrincipal: {
      type: Number,
      required: [true, 'Remaining principal is required'],
      min: [0, 'Remaining principal cannot be negative'],
    },
    interestRate: {
      type: Number,
      required: [true, 'Interest rate is required'],
      min: [0.1, 'Interest rate must be at least 0.1%'],
      max: [100, 'Interest rate cannot exceed 100%'],
    },
    monthlyDueDay: {
      type: Number,
      required: [true, 'Monthly due day is required'],
      min: [1, 'Due day must be between 1 and 31'],
      max: [31, 'Due day must be between 1 and 31'],
    },
    loanStartDate: {
      type: Date,
      required: [true, 'Loan start date is required'],
    },
    status: {
      type: String,
      enum: Object.values(LOAN_STATUS),
      default: LOAN_STATUS.ACTIVE,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    totalInterestPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrincipalPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual: computed monthly interest based on remaining principal and rate.
 */
loanSchema.virtual('monthlyInterest').get(function () {
  return parseFloat(((this.remainingPrincipal * this.interestRate) / 100).toFixed(2));
});

loanSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
