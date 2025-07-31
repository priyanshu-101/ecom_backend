const { db } = require('./firebase');

const connectDB = async () => {
  try {
    await db.settings({ ignoreUndefinedProperties: true });
    console.log('Connected to Firebase Firestore');
  } catch (error) {
    console.error('Firebase connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
