import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend global namespace to store cached mongoose connection
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

const currentCache = cached;

/**
 * Connects to MongoDB using a cached singleton connection pattern.
 * This prevents creating multiple concurrent connections during fast-refresh in development
 * and works efficiently in Vercel's serverless environment.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (currentCache.conn) {
    return currentCache.conn;
  }

  if (!currentCache.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Initiating new MongoDB connection...');
    currentCache.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((m) => {
        console.log('MongoDB connected successfully.');
        return m;
      })
      .catch((error) => {
        console.error('MongoDB connection failure:', error);
        currentCache.promise = null; // Clear cached promise on failure to allow retry
        throw error;
      });
  }

  try {
    currentCache.conn = await currentCache.promise;
  } catch (error) {
    currentCache.promise = null;
    throw error;
  }

  return currentCache.conn;
}
