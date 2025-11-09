import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import { INVOICES_COLLECTION } from './types';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_CONNECTION_STRING;
const DB_NAME = 'vosWashDB';

if (!MONGODB_URI) {
  throw new Error('MONGODB_CONNECTION_STRING is not defined in environment variables.');
}

const client = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let dbInstance: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (dbInstance) return dbInstance;

  try {
    await client.connect();
    dbInstance = client.db(DB_NAME);
    console.log('✅ Successfully connected to MongoDB!');
    
    // Ensure necessary indexes are created for fast lookups
    await dbInstance.collection(INVOICES_COLLECTION).createIndex({ invoiceNumber: 1 }, { unique: true });
    console.log(`✅ Index created on ${INVOICES_COLLECTION}.invoiceNumber`);

    return dbInstance;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

export function getDb(): Db {
  if (!dbInstance) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return dbInstance;
}
