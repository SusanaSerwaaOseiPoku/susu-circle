import mongoose from "mongoose";

export default async function connectDB(uri = process.env.MONGO_URI) {
  const connectionUri = typeof uri === "string" ? uri.trim() : "";
  if (!connectionUri) {
    throw new Error(
      "MONGO_URI is not set. Add your MongoDB Atlas connection string to .env.",
    );
  }

  const connection = await mongoose.connect(connectionUri);
  console.info(`Connected to MongoDB (${connection.connection.host})`);
  return connection;
}
