'use strict';

/**
 * seedAdmin.js — Seeds the initial admin user into MongoDB.
 *
 * Usage:
 *   node scripts/seedAdmin.js              # Uses env defaults (Admin@123)
 *   node scripts/seedAdmin.js myPassword   # Uses custom password
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const run = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌  MONGODB_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅  Connected to MongoDB');

    const email = (process.env.ADMIN_EMAIL || 'admin@cpay.com').toLowerCase().trim();
    const plainPassword = process.argv[2] || 'admin123';

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log(`ℹ️   Admin already exists: ${email}`);
      console.log('    To reset, manually remove the document and re-run.');
      await mongoose.disconnect();
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(plainPassword, salt);

    const admin = await Admin.create({ email, passwordHash });

    console.log('🎉  Admin created successfully!');
    console.log(`    Email   : ${admin.email}`);
    console.log(`    Password: ${plainPassword}`);
    console.log(`    Hash    : ${passwordHash}`);
    console.log('\n  Add this hash to your .env as ADMIN_PASSWORD_HASH (for reference only)');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌  Error seeding admin:', err.message);
    process.exit(1);
  }
};

run();
