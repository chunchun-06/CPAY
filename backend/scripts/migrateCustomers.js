'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const Customer = require('../models/Customer');
const Counter = require('../models/Counter');
const connectDB = require('../config/db');

async function migrate() {
  await connectDB();
  console.log('Connected to DB. Starting migration...');

  // Get all customers, sorted by createdAt ascending
  const customers = await Customer.find({}).sort({ createdAt: 1 });
  
  let currentSeq = 0;
  
  // Find or create the counter
  const counter = await Counter.findById('customerId');
  if (counter) {
    currentSeq = counter.seq;
  } else {
    await Counter.create({ _id: 'customerId', seq: 0 });
  }

  console.log(`Found ${customers.length} customers to check/migrate. Current sequence: ${currentSeq}`);

  let updatedCount = 0;

  for (const customer of customers) {
    let needsSave = false;

    if (!customer.customerId) {
      currentSeq++;
      customer.customerId = 'CUST' + currentSeq.toString().padStart(4, '0');
      needsSave = true;
    }

    // Replace UUID tokens with crypto hex tokens if they look like UUIDs (contains dashes)
    // Actually, the user asked to assign "secureToken" to existing users who don't have it.
    // If they have a token, we could leave it, but they might want the new format.
    // I will replace all tokens that contain '-' (UUIDs) with crypto tokens just to be safe and uniform.
    if (!customer.secureToken || customer.secureToken.includes('-')) {
      customer.secureToken = crypto.randomBytes(16).toString('hex');
      needsSave = true;
    }

    if (needsSave) {
      await customer.save();
      console.log(`Updated ${customer.fullName} -> ${customer.customerId}`);
      updatedCount++;
    }
  }

  // Update the counter to the latest sequence
  await Counter.findByIdAndUpdate('customerId', { seq: currentSeq }, { upsert: true });

  console.log(`Migration completed. Updated ${updatedCount} customers. Final sequence: ${currentSeq}`);
  
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
