import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI! || 'mongodb+srv://ravipraeclarum:jt0dX6gXMiCICDgU@cluster0.4dtn8.mongodb.net/hrms?retryWrites=true&w=majority';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
declare global {
  var mongoose: any;
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {

  console.log('MONGODB_URI', MONGODB_URI);
  if (cached.conn) {
    console.log('cached.conn', cached.conn);
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('mongoose', mongoose);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
