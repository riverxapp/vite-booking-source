import { defineConfig } from "drizzle-kit";

// Outside RiverX, TURSO_* come from a gitignored .env / .env.local.
// In the RiverX workspace terminal they are already in the process env.
for (const file of [".env.local", ".env"]) {
  if (process.env.TURSO_DATABASE_URL) break;
  try {
    process.loadEnvFile(file);
  } catch {
    // File not present.
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
