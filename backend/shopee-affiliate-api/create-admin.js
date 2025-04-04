require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('./src/models/user'); // Adjust the path if necessary
const { connectDB } = require('./src/config/database');

async function createAdminUser() {
  let connection;
  try {
    // Connect to the MySQL database
    connection = await connectDB();
    console.log('Connected to MySQL');

    // Check if an admin user already exists
    const existingAdmin = await User.findByUsername(process.env.ADMIN_USERNAME || 'admin');
    if (existingAdmin && existingAdmin.role === 'admin') {
      console.log('Admin user already exists. Exiting script.');
      return;
    }

    // Define admin user details
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminName = process.env.ADMIN_NAME || 'Administrator';

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create the admin user
    const newAdmin = await User.create({
      username: adminUsername,
      password: hashedPassword,
      email: adminEmail,
      name: adminName,
      role: 'admin',
      createdAt: new Date()
    });

    console.log('Admin user created successfully!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close the connection
    if (connection) {
      try {
        await connection.end();
        console.log('Disconnected from MySQL');
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
    }
  }
}

createAdminUser();
