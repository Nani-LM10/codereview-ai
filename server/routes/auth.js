import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomUUID, randomBytes } from "crypto";
import { db } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.js";

const router = Router();

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const VERIFICATION_TTL = 24 * 60 * 60 * 1000; // 24 hours

// In dev mode (no SMTP set), skip email verification entirely
const DEV_MODE = !process.env.SMTP_HOST;

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = randomUUID();
    const verificationToken = randomBytes(32).toString("hex");
    const verificationExpires = Date.now() + VERIFICATION_TTL;

    // In dev mode: auto-verify so users can log in immediately
    const emailVerified = DEV_MODE ? 1 : 0;

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, email_verified, verification_token, verification_expires)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, email.toLowerCase(), passwordHash, name.trim(), emailVerified, verificationToken, verificationExpires);

    if (!DEV_MODE) {
      // Only try to send email if SMTP is configured
      try {
        await sendVerificationEmail(email, name, verificationToken);
      } catch (emailErr) {
        console.error("Failed to send verification email:", emailErr.message);
      }
      return res.status(201).json({
        message: "Account created! Please check your email to verify your account.",
      });
    }

    // Dev mode: account ready immediately
    console.log(`✅ Account created (dev mode, auto-verified): ${email}`);
    res.status(201).json({
      message: "Account created! You can now sign in.",
      devMode: true,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Failed to create account." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Only block unverified users in production (SMTP configured)
    if (!user.email_verified && !DEV_MODE) {
      return res.status(403).json({
        error: "Please verify your email before signing in.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const sessionToken = randomBytes(48).toString("hex");
    const sessionId = randomUUID();
    const expiresAt = Date.now() + SESSION_TTL;

    db.prepare("INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)")
      .run(sessionId, user.id, sessionToken, expiresAt);

    res.json({
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: !!user.email_verified,
        createdAt: new Date(user.created_at * 1000).toISOString(),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed." });
  }
});

// POST /api/auth/verify-email
router.post("/verify-email", (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required." });

    const user = db.prepare(
      "SELECT * FROM users WHERE verification_token = ? AND verification_expires > ?"
    ).get(token, Date.now());

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification link." });
    }

    db.prepare(
      "UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?"
    ).run(user.id);

    res.json({ message: "Email verified! You can now sign in." });
  } catch (err) {
    res.status(500).json({ error: "Verification failed." });
  }
});

// POST /api/auth/resend-verification
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    if (DEV_MODE) {
      return res.json({ message: "Dev mode: email verification is not required." });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
    if (!user || user.email_verified) {
      return res.json({ message: "If that email exists and is unverified, we sent a new link." });
    }

    const verificationToken = randomBytes(32).toString("hex");
    const verificationExpires = Date.now() + VERIFICATION_TTL;

    db.prepare("UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?")
      .run(verificationToken, verificationExpires, user.id);

    await sendVerificationEmail(user.email, user.name, verificationToken);
    res.json({ message: "Verification email sent!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send verification email." });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get((email || "").toLowerCase());

    if (user && !DEV_MODE) {
      const resetToken = randomBytes(32).toString("hex");
      const resetExpires = Date.now() + 60 * 60 * 1000;
      db.prepare("UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?")
        .run(resetToken, resetExpires, user.id);
      await sendPasswordResetEmail(user.email, user.name, resetToken).catch(console.error);
    }

    res.json({ message: "If that email exists, we sent a password reset link." });
  } catch (err) {
    res.status(500).json({ error: "Failed to process request." });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token and password are required." });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

    const user = db.prepare(
      "SELECT * FROM users WHERE reset_token = ? AND reset_expires > ?"
    ).get(token, Date.now());

    if (!user) return res.status(400).json({ error: "Invalid or expired reset link." });

    const passwordHash = await bcrypt.hash(password, 12);
    db.prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?")
      .run(passwordHash, user.id);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);

    res.json({ message: "Password reset successfully." });
  } catch (err) {
    res.status(500).json({ error: "Reset failed." });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT id, email, name, email_verified, created_at FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found." });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: !!user.email_verified,
    createdAt: new Date(user.created_at * 1000).toISOString(),
  });
});

// POST /api/auth/signout
router.post("/signout", requireAuth, (req, res) => {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(req.token);
  res.json({ message: "Signed out." });
});

export default router;
