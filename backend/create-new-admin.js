const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'wsdmpresh@gmail.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin already exists. Updating password...');
      existingAdmin.password = 'Wisdomfx22a';
      await existingAdmin.save();
      console.log('✅ Password updated successfully!');
    } else {
      // Create new admin
      const admin = await Admin.create({
        name: 'System Administrator',
        email: 'wsdmpresh@gmail.com',
        password: 'Wisdomfx22a',
        role: 'superadmin'
      });
      console.log('✅ Admin created successfully!');
    }
    
    console.log('');
    console.log('📧 Login Credentials:');
    console.log('   Email: wsdmpresh@gmail.com');
    console.log('   Password: Wisdomfx22a');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
