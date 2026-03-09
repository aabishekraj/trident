import mongoose from "mongoose";

declare global {
  var _mongooseCache: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<mongoose.Connection> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in .env.local");
  }

  const cached = global._mongooseCache;

  // Reuse live connection
  if (cached.conn && cached.conn.readyState === 1) {
    return cached.conn;
  }

  // Reset stale/broken connection
  if (cached.conn && cached.conn.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    console.log("[MongoDB] Connecting to:", MONGODB_URI.replace(/:([^@]+)@/, ":****@"));

    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 8000,
      })
      .then((m) => {
        console.log("[MongoDB] ✅ Connected successfully");
        return m.connection;
      })
      .catch((err) => {
        console.error("[MongoDB] ❌ Connection failed:", err.message);
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}