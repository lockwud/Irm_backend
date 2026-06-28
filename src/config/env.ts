import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "development-secret",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL || "",
  // Optional AI provider values. The route works without a key by returning a
  // local Ghana lesson-note fallback, then switches to Gemini when the key is set.
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
};
