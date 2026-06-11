require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/UserModel');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URL);

  const existing = await User.findOne({ email: 'suryasekar626@gmail.com' });
  if (existing) {
    existing.role = 'admin';
    existing.password = 'Surya@123';
    existing.isVerified = true;
    await existing.save();
    console.log('✅ Admin credentials updated');
  } else {
    await User.create({
      firstname: 'Surya',
      lastname: 'Sekar',
      email: 'suryasekar626@gmail.com',
      password: 'Surya@123',
      role: 'admin',
      isVerified: true,
    });
    console.log('✅ Admin user created');
  }

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
