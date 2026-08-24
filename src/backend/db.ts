import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env["MONGODB_URI"] || "mongodb://127.0.0.1:27017/unani_hospital";
const MONGODB_DB_NAME = process.env["MONGODB_DB_NAME"] || "unani_hospital";

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

export async function connectToDatabase(): Promise<{ client: MongoClient | null; db: Db | null; isConnected: boolean }> {
  if (isConnected && client && db) {
    return { client, db, isConnected };
  }

  try {
    const clientOptions = {
      connectTimeoutMS: 2500,
      serverSelectionTimeoutMS: 2500,
    };
    
    client = new MongoClient(MONGODB_URI, clientOptions);
    await client.connect();
    db = client.db(MONGODB_DB_NAME);
    isConnected = true;
    console.log("Connected to MongoDB successfully at:", MONGODB_URI);
    return { client, db, isConnected };
  } catch (error) {
    console.warn("MongoDB connection failed. Operating in Local Offline Fallback mode. Error:", (error as Error).message);
    client = null;
    db = null;
    isConnected = false;
    return { client: null, db: null, isConnected: false };
  }
}
