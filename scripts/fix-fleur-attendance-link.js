const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
  const Users = mongoose.connection.collection('users');
  const Attendance = mongoose.connection.collection('attendances');

  const userRes = await Users.updateOne(
    { email: 'test123@yopmail.com' },
    { $set: { employeeId: 'EMP1780652714854' } }
  );

  const attRes = await Attendance.updateMany(
    { employeeId: 'EMP1764669581512' },
    { $set: { employeeId: 'EMP1780652714854' } }
  );

  console.log('User updated:', userRes.modifiedCount);
  console.log('Attendance migrated:', attRes.modifiedCount);

  const fleur = await Attendance.find({ employeeId: 'EMP1780652714854' }).sort({ date: -1 }).toArray();
  console.log('Fleur records now:', fleur.length);
  fleur.forEach((record) => console.log(record.date, record.status));

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
