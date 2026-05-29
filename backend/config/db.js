import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

function ensureDatabaseName(uri, defaultDb) {
  if (!uri) {
    return uri;
  }

  const [base, query] = uri.split('?');
  if (base.match(/\/[^/]+$/)) {
    return uri;
  }

  const fixedBase = base.endsWith('/') ? `${base}${defaultDb}` : `${base}/${defaultDb}`;
  return query ? `${fixedBase}?${query}` : fixedBase;
}

const rawMongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const MONGO_URI = ensureDatabaseName(rawMongoUri, 'document-dashboard');

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB connected to ${MONGO_URI}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
