const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');

dotenv.config();

async function removeDemoUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const demoEmails = [
      'admin@hms.com',
      'doctor@hms.com',
      'receptionist@hms.com',
      'patient@hms.com',
      'sarah@hms.com',
      'jane@hms.com',
      'bob@hms.com'
    ];

    // Find user IDs to clean up referenced collections
    const users = await User.find({ email: { $in: demoEmails } });
    const userIds = users.map(u => u._id);

    const doctorResult = await Doctor.deleteMany({ userId: { $in: userIds } });
    const patientResult = await Patient.deleteMany({ userId: { $in: userIds } });
    const result = await User.deleteMany({ email: { $in: demoEmails } });
    
    console.log(`Successfully removed ${result.deletedCount} demo users from the database.`);
    console.log(`Successfully removed ${doctorResult.deletedCount} associated doctor profiles.`);
    console.log(`Successfully removed ${patientResult.deletedCount} associated patient profiles.`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to remove demo users:', error.message);
    process.exit(1);
  }
}

removeDemoUsers();
