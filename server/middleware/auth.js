import { db } from "../db/database.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7);

  try {
    const session = db
      .prepare("SELECT s.*, u.id as uid, u.email, u.name, u.email_verified FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > ?")
      .get(token, Date.now());

    if (!session) {
      return res.status(401).json({ error: "Session expired or invalid" });
    }

    req.user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      emailVerified: !!session.email_verified,
    };
    req.token = token;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Auth check failed" });
  }
}
