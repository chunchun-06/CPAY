require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');

async function deleteAll() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB. Deleting all customers, loans, and payments...');

    // Hard delete for complete verification as requested
    await Customer.deleteMany({});
    await Loan.deleteMany({});
    await Payment.deleteMany({});

    console.log('Successfully deleted all records. DB is now completely empty.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

deleteAll();
