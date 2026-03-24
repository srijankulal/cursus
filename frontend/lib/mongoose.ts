import 'server-only';
import mongoose from 'mongoose';

const { MONGODB_URI, MONGODB_DB_NAME } = process.env;

if (!MONGODB_URI) {
throw new Error('Please define MONGODB_URI in your environment variables.');
}

if (!MONGODB_DB_NAME) {
throw new Error('Please define MONGODB_DB_NAME in your environment variables.');
}

type MongooseCache = {
conn: typeof mongoose | null;
promise: Promise<typeof mongoose> | null;
};

declare global {
var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? {
conn: null,
promise: null,
};

if (!global._mongooseCache) {
global._mongooseCache = cached;
}

export async function connectToDatabase() {
if (cached.conn) {
return cached.conn;
}

if (!cached.promise) {
cached.promise = mongoose.connect(MONGODB_URI, {
dbName: MONGODB_DB_NAME,
bufferCommands: false,
});
}

cached.conn = await cached.promise;
return cached.conn;
}