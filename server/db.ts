import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const PORT = Number(process.env.MONGO_PORT ?? 27017);
const URI = process.env.MONGODB_URI ?? `mongodb://127.0.0.1:${PORT}/saku`;

let memory: { stop: () => Promise<boolean>; getUri: () => string } | null = null;

export async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!process.env.MONGODB_URI) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const dbPath = path.join(process.cwd(), "data", "mongo");
    fs.mkdirSync(dbPath, { recursive: true });
    memory = await MongoMemoryServer.create({
      instance: {
        port: PORT,
        dbName: "saku",
        dbPath,
        storageEngine: "wiredTiger",
      },
    });
    await mongoose.connect(memory.getUri());
    return mongoose.connection;
  }

  await mongoose.connect(URI);
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memory) await memory.stop();
}
