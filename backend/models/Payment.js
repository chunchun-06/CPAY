'use strict';

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: [true, 'Loan ID is required'],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Payment date is required'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total payment amount is required'],
      min: [0.01, 'Payment amount must be positive'],
    },
    interestPaid: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Interest paid cannot be negative'],
    },
    principalPaid: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Principal paid cannot be negative'],
    },
    remainingPrincipalAfter: {
      type: Number,
      required: [true, 'Remaining principal after payment is required'],
      min: [0, 'Remaining principal cannot be negative'],
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },
    recordedBy: {
      type: String,
      default: 'admin',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedBy: String,
  },
  {
    timestamps: true,
  }
);

paymentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
