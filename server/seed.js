const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Bed = require('./models/Bed');
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');
const Bill = require('./models/Bill');
const Employee = require('./models/Employee');
const Ward = require('./models/Ward');
const PharmacyStock = require('./models/PharmacyStock');
const LabReport = require('./models/LabReport');

dotenv.config();

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hms');
    console.log('Connected.');

    // Clear existing data to ensure a clean seed
    console.log('Clearing database collections...');
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Bed.deleteMany({});
    await Appointment.deleteMany({});
    await Prescription.deleteMany({});
    await Bill.deleteMany({});
    await Employee.deleteMany({});
    await Ward.deleteMany({});
    await PharmacyStock.deleteMany({});
    await LabReport.deleteMany({});

    console.log('Seeding users and role documents...');

    // 1. Create Admins
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@hms.com',
      password: 'admin123',
      role: 'admin'
    });

    // 2. Create Receptionists (Employee mapped)
    const receptionistUser = await User.create({
      name: 'Rina Patel',
      email: 'receptionist@hms.com',
      password: 'receptionist123',
      role: 'receptionist'
    });
    const receptionistEmployee = await Employee.create({
      userId: receptionistUser._id,
      name: receptionistUser.name,
      designation: 'Receptionist',
      phone: '555-0150',
      salary: 30000,
      shift: 'Day'
    });

    // 3. Create Nurses (Employee mapped)
    const nurseUser = await User.create({
      name: 'Nancy Nurse',
      email: 'nurse@hms.com',
      password: 'nurse123',
      role: 'nurse'
    });
    const nurseEmployee = await Employee.create({
      userId: nurseUser._id,
      name: nurseUser.name,
      designation: 'Nurse',
      phone: '555-0160',
      salary: 45000,
      shift: 'Day'
    });

    // 4. Create Pharmacists (Employee mapped)
    const pharmacistUser = await User.create({
      name: 'Phil Pharmacist',
      email: 'pharmacist@hms.com',
      password: 'pharmacist123',
      role: 'pharmacist'
    });
    const pharmacistEmployee = await Employee.create({
      userId: pharmacistUser._id,
      name: pharmacistUser.name,
      designation: 'Pharmacist',
      phone: '555-0170',
      salary: 50000,
      shift: 'Day'
    });

    // 5. Create Lab Technicians (Employee mapped)
    const labTechUser = await User.create({
      name: 'Larry Tech',
      email: 'labtech@hms.com',
      password: 'labtech123',
      role: 'lab_technician'
    });
    const labTechEmployee = await Employee.create({
      userId: labTechUser._id,
      name: labTechUser.name,
      designation: 'Lab Technician',
      phone: '555-0180',
      salary: 40000,
      shift: 'Night'
    });

    // 6. Create Doctors
    const docUser1 = await User.create({
      name: 'Dr. Maya Chen',
      email: 'doctor@hms.com',
      password: 'doctor123',
      role: 'doctor'
    });
    const doctor1 = await Doctor.create({
      userId: docUser1._id,
      name: docUser1.name,
      specialization: 'General Medicine',
      phone: '555-0101'
    });

    const docUser2 = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'sarah@hms.com',
      password: 'doctor123',
      role: 'doctor'
    });
    const doctor2 = await Doctor.create({
      userId: docUser2._id,
      name: docUser2.name,
      specialization: 'Cardiology',
      phone: '555-0102'
    });

    // 7. Create Patients
    const patUser1 = await User.create({
      name: 'John Doe',
      email: 'patient@hms.com',
      password: 'patient123',
      role: 'patient'
    });
    const patient1 = await Patient.create({
      userId: patUser1._id,
      name: patUser1.name,
      age: 32,
      gender: 'Male',
      phone: '555-0199'
    });

    const patUser2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@hms.com',
      password: 'patient123',
      role: 'patient'
    });
    const patient2 = await Patient.create({
      userId: patUser2._id,
      name: patUser2.name,
      age: 28,
      gender: 'Female',
      phone: '555-0188'
    });

    const patUser3 = await User.create({
      name: 'Bob Johnson',
      email: 'bob@hms.com',
      password: 'patient123',
      role: 'patient'
    });
    const patient3 = await Patient.create({
      userId: patUser3._id,
      name: patUser3.name,
      age: 45,
      gender: 'Male',
      phone: '555-0177'
    });

    // 8. Create Wards
    console.log('Seeding Wards...');
    await Ward.create({ name: 'Ward A', type: 'General', totalBeds: 5 });
    await Ward.create({ name: 'Ward B', type: 'ICU', totalBeds: 5 });

    // 9. Create Beds
    console.log('Seeding Beds...');
    await Bed.create({ bedNumber: '101', ward: 'Ward A', status: 'Available' });
    await Bed.create({ bedNumber: '102', ward: 'Ward A', status: 'Occupied', patientId: patient1._id });
    await Bed.create({ bedNumber: '103', ward: 'Ward A', status: 'Maintenance' });
    await Bed.create({ bedNumber: '201', ward: 'Ward B', status: 'Available' });
    await Bed.create({ bedNumber: '202', ward: 'Ward B', status: 'Occupied', patientId: patient2._id });

    // 10. Seeding Pharmacy Stock
    console.log('Seeding pharmacy stock...');
    await PharmacyStock.create({
      name: 'Paracetamol 650mg',
      batchNumber: 'BATCH-PCM-01',
      expiryDate: new Date('2027-12-31'),
      quantity: 500,
      unitPrice: 0.10,
      supplier: 'Medix Pharma'
    });
    await PharmacyStock.create({
      name: 'Amoxicillin 500mg',
      batchNumber: 'BATCH-AMX-02',
      expiryDate: new Date('2026-09-30'),
      quantity: 200,
      unitPrice: 0.35,
      supplier: 'BioLabs Corp'
    });
    await PharmacyStock.create({
      name: 'Insulin Glargine 100U',
      batchNumber: 'BATCH-INS-03',
      expiryDate: new Date('2026-08-15'),
      quantity: 12,
      unitPrice: 25.00,
      supplier: 'Biochem Labs'
    });

    // Helper for local date string in YYYY-MM-DD
    const todayStr = new Date().toLocaleDateString('en-CA');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('en-CA');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');

    // 11. Create Appointments
    console.log('Seeding appointments...');
    const appt1 = await Appointment.create({
      patientId: patient1._id,
      doctorId: doctor1._id,
      date: todayStr,
      reason: 'Annual Physical Checkup',
      status: 'Pending'
    });

    const appt2 = await Appointment.create({
      patientId: patient2._id,
      doctorId: doctor2._id,
      date: todayStr,
      reason: 'Heart palpitation check',
      status: 'Approved'
    });

    const appt3 = await Appointment.create({
      patientId: patient3._id,
      doctorId: doctor1._id,
      date: yesterdayStr,
      reason: 'Persistent seasonal cough',
      status: 'Completed'
    });

    const appt4 = await Appointment.create({
      patientId: patient1._id,
      doctorId: doctor2._id,
      date: tomorrowStr,
      reason: 'Follow-up ECG consultation',
      status: 'Approved'
    });

    // 12. Create Lab Reports
    console.log('Seeding lab reports...');
    await LabReport.create({
      patientId: patient1._id,
      doctorId: doctor1._id,
      testName: 'Complete Blood Count (CBC)',
      category: 'Blood',
      status: 'Ordered'
    });
    await LabReport.create({
      patientId: patient2._id,
      doctorId: doctor2._id,
      testName: 'ECG Report',
      category: 'ECG',
      results: 'Normal sinus rhythm, heart rate 72 bpm.',
      status: 'Completed'
    });

    // 13. Create Prescriptions
    console.log('Seeding prescriptions...');
    await Prescription.create({
      doctorId: doctor1._id,
      patientId: patient3._id,
      appointmentId: appt3._id,
      medicines: 'Amoxicillin 500mg - 3 times daily - 7 days\nParacetamol 650mg - as needed for fever',
      notes: 'Take antibiotics after meals. Complete the full 7-day course. Rest well and hydrate.'
    });

    // 14. Create Bills
    console.log('Seeding bills...');
    await Bill.create({ patientId: patient1._id, amount: 250, status: 'Unpaid' });
    await Bill.create({ patientId: patient2._id, amount: 150, status: 'Paid' });
    await Bill.create({ patientId: patient3._id, amount: 120, status: 'Paid' });

    console.log('🎉 Seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();
