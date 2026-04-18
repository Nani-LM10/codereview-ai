import { createRequire } from "module";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from project root (works regardless of how server is started)
const envPath = join(__dirname, "../.env");
if (existsSync(envPath)) {
  const { config } = await import("dotenv");
  config({ path: envPath });
  console.log("✅ Loaded .env from:", envPath);
} else {
  console.warn("⚠️  No .env file found at:", envPath);
  console.warn("   Copy .env.example to .env and add your GEMINI_API_KEY");
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import reviewRoutes from "./routes/reviews.js";
import { initDb } from "./db/database.js";
await initDb().catch(err => {
  console.error("❌ Database initialization failed:", err);
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));

// Root route for health check/info
app.get("/", (_req, res) => {
  res.send("<h1>CodeLensAI Backend</h1><p>The backend is running successfully. Please visit the frontend at <a href='http://localhost:5173'>http://localhost:5173</a> to use the application.</p>");
});

// Log every request in dev
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    devMode: !process.env.SMTP_HOST,
    time: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log("");
    console.log("╔══════════════════════════════════════╗");
    console.log("║        CodeLensAI Backend            ║");
    console.log("╠══════════════════════════════════════╣");
    console.log(`║  Server  → http://localhost:${PORT}    ║`);
    console.log(`║  Gemini  → ${process.env.GEMINI_API_KEY ? "✅ API key loaded" : "❌ NOT SET - add to .env"}  ║`);
    console.log(`║  Mode    → ${!process.env.SMTP_HOST ? "Dev (no email needed)" : "Production"}         ║`);
    console.log("╚══════════════════════════════════════╝");
    console.log("");
  });
}

export default app;
