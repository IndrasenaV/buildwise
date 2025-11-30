const mongoose = require('mongoose');

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://indravarakantham_db_user:59nDjessNT0uRv16@cluster0.uhs8toa.mongodb.net/?appName=Cluster0';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: true,
  });
  console.log('Connected to MongoDB');
}

module.exports = { connectToDatabase };


