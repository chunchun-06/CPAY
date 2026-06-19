'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      unique: true,
      index: true,
      sparse: true, // sparse allows nulls temporarily if migration is happening
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    secureToken: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Mask internal _id — always present but not in public API responses
customerSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
