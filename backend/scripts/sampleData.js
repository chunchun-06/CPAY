'use strict';

/**
 * sampleData.js — Populates the database with realistic sample data for development.
 *
 * Creates:
 *   - Admin (if missing)
 *   - 5 customers with loans
 *   - 3-8 payments per customer with varied statuses
 *
 * Usage: node scripts/sampleData.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const { LOAN_STATUS } = require('../config/constants');

const customers = [
  {
    fullName: 'Ravi Kumar Sharma',
    mobileNumber: '9876543210',
    address: '12, Gandhi Nagar, Jaipur, Rajasthan',
    notes: 'Regular payer. Known since 2020.',
    loan: { loanAmount: 50000, interestRate: 2, monthlyDueDay: 5, loanStartDate: '2024-01-05' },
  },
  {
    fullName: 'Priya Mehta',
    mobileNumber: '8765432109',
    address: '45, MG Road, Pune, Maharashtra',
    notes: 'Referred by Ravi Kumar.',
    loan: { loanAmount: 30000, interestRate: 1.5, monthlyDueDay: 10, loanStartDate: '2024-03-10' },
  },
  {
    fullName: 'Suresh Babu Naidu',
    mobileNumber: '7654321098',
    address: '8, Jubilee Hills, Hyderabad, Telangana',
    notes: 'Small business owner.',
    loan: { loanAmount: 100000, interestRate: 2.5, monthlyDueDay: 15, loanStartDate: '2023-11-15' },
  },
  {
    fullName: 'Anitha Krishnaswamy',
    mobileNumber: '6543210987',
    address: '23, Anna Nagar, Chennai, Tamil Nadu',
    notes: 'Schoolteacher. Very reliable.',
    loan: { loanAmount: 20000, interestRate: 1.8, monthlyDueDay: 20, loanStartDate: '2024-05-20' },
  },
  {
    fullName: 'Mohammad Farhan Shaikh',
    mobileNumber: '9123456780',
    address: '7, Bandra West, Mumbai, Maharashtra',
    notes: 'Tailor shop owner. Pays in cash.',
    loan: { loanAmount: 75000, interestRate: 2.2, monthlyDueDay: 25, loanStartDate: '2024-02-25' },
  },
];

const monthsBack = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected to MongoDB\n');

    // --- Ensure Admin Exists ---
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@cpay.com').toLowerCase();
    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      const hash = await bcrypt.hash('Admin@123', 12);
      admin = await Admin.create({ email: adminEmail, passwordHash: hash });
      console.log(`✅  Admin created: ${adminEmail}`);
    } else {
      console.log(`ℹ️   Admin already exists: ${adminEmail}`);
    }

    // Clear existing sample data (to allow re-running)
    const existingMobiles = customers.map((c) => c.mobileNumber);
    const existingCustomers = await Customer.find({ mobileNumber: { $in: existingMobiles } });
    if (existingCustomers.length > 0) {
      const ids = existingCustomers.map((c) => c._id);
      const loanDocs = await Loan.find({ customerId: { $in: ids } });
      const loanIds = loanDocs.map((l) => l._id);
      await Payment.deleteMany({ loanId: { $in: loanIds } });
      await Loan.deleteMany({ customerId: { $in: ids } });
      await Customer.deleteMany({ _id: { $in: ids } });
      console.log('🗑️   Cleared old sample data.\n');
    }

    for (const sample of customers) {
      const { loan: loanData, ...customerData } = sample;

      // Create customer
      const customer = await Customer.create({
        ...customerData,
        secureToken: uuidv4(),
      });

      // Create loan
      const loan = await Loan.create({
        customerId: customer._id,
        loanAmount: loanData.loanAmount,
        remainingPrincipal: loanData.loanAmount,
        interestRate: loanData.interestRate,
        monthlyDueDay: loanData.monthlyDueDay,
        loanStartDate: new Date(loanData.loanStartDate),
        status: LOAN_STATUS.ACTIVE,
      });

      // Generate 4 months of payments
      let remaining = loanData.loanAmount;
      const numPayments = 4;

      for (let i = numPayments; i >= 1; i--) {
        const interest = parseFloat(((remaining * loanData.interestRate) / 100).toFixed(2));
        const principal = parseFloat((loanData.loanAmount * 0.05).toFixed(2)); // 5% of loan as principal per month
        const total = parseFloat((interest + principal).toFixed(2));
        const newRemaining = parseFloat((remaining - principal).toFixed(2));

        const payDate = monthsBack(i);
        payDate.setDate(loanData.monthlyDueDay);

        await Payment.create({
          loanId: loan._id,
          customerId: customer._id,
          date: payDate,
          totalAmount: total,
          interestPaid: interest,
          principalPaid: principal,
          remainingPrincipalAfter: newRemaining,
          remarks: `Month ${numPayments - i + 1} payment`,
          recordedBy: adminEmail,
        });

        remaining = newRemaining;
      }

      // Update loan with accumulated totals
      const payments = await Payment.find({ loanId: loan._id });
      const totalInterestPaid = payments.reduce((s, p) => s + p.interestPaid, 0);
      const totalPrincipalPaid = payments.reduce((s, p) => s + p.principalPaid, 0);

      await Loan.findByIdAndUpdate(loan._id, {
        remainingPrincipal: remaining,
        totalInterestPaid: parseFloat(totalInterestPaid.toFixed(2)),
        totalPrincipalPaid: parseFloat(totalPrincipalPaid.toFixed(2)),
      });

      console.log(`✅  Created: ${customer.fullName}`);
      console.log(`    Token  : ${customer.secureToken}`);
      console.log(`    Loan   : ₹${loanData.loanAmount} @ ${loanData.interestRate}%`);
      console.log(`    Remaining: ₹${remaining.toFixed(2)}\n`);
    }

    console.log('🎉  Sample data created successfully!');
    console.log('\n  Run `npm run seed` to create/verify the admin account.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌  Error creating sample data:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
};

run();
