// One-off: generate a password-reset link for a given email WITHOUT sending email.
// Stores the token hash + 1-hour expiry on the user (same as /api/forgot-password),
// and prints the reset URL so you can open it and set a new password yourself.
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/user');

const EMAIL = process.argv[2] || 'vyshnavi21@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4300';

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const user = await User.findOne({ email: EMAIL });
    if (!user) {
      console.log(`No user found with email ${EMAIL}`);
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    console.log(`\nReset link for ${EMAIL} (valid 1 hour):\n`);
    console.log(`${FRONTEND_URL}/reset-password?token=${rawToken}\n`);
  } finally {
    await mongoose.disconnect();
  }
})().catch(e => { console.error('Failed:', e.message); process.exit(1); });
