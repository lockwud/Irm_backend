import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "development-secret",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL || "",
  // Gemini lesson-note assistant configuration. The API intentionally returns a
  // setup error when the key is missing instead of using a local fallback.
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
};
