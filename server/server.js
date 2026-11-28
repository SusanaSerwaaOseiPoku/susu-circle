import "dotenv/config";
import { fileURLToPath } from "node:url";
import app, { createApp, getCorsOptions, getHealthPayload } from "./app.js";
import connectDB from "./config/db.js";

const PORT = Number(process.env.PORT) || 3001;

export { app, createApp, getCorsOptions, getHealthPayload };

export async function startServer() {
  await connectDB();
  return app.listen(PORT, () => {
    console.info(`Susu Circle API listening on port ${PORT}`);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer().catch((error) => {
    console.error("Failed to start Susu Circle API:", error.message);
    process.exit(1);
  });
}
