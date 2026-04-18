import { Router } from "express";
import { randomUUID } from "crypto";
import { db } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";
import { callOpenRouter } from "../services/openrouter.js";

const router = Router();
router.use(requireAuth);

// GET /api/reviews
router.get("/", (req, res) => {
  try {
    const rows = db.prepare(
      "SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC"
    ).all(req.user.id);

    const reviews = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      code: r.code,
      language: r.language,
      filename: r.filename,
      score: r.score,
      summary: r.summary,
      issues: JSON.parse(r.issues),
      performance: JSON.parse(r.performance),
      best_practices: JSON.parse(r.best_practices),
      created_at: new Date(r.created_at * 1000).toISOString(),
    }));

    res.json(reviews);
  } catch (err) {
    console.error("GET /reviews error:", err);
    res.status(500).json({ error: "Failed to fetch reviews." });
  }
});

// POST /api/reviews/review  — send code → OpenRouter → save → return feedback
router.post("/review", async (req, res) => {
  try {
    const { code, language = "javascript", filename = "" } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: "Please paste some code to review." });
    }

    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY is not set. Add it to your .env file."
      });
    }

    console.log(`🔍 Reviewing ${language} code (${code.length} chars) for user ${req.user.email}`);

    const { systemPrompt, userPrompt } = buildPrompt(code, language, filename);

    // Call OpenRouter with automatic model fallback
    const rawText = await callOpenRouter(systemPrompt, userPrompt);

    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    let feedback;
    try {
      feedback = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse AI JSON:", cleaned.slice(0, 200));
      return res.status(502).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }

    // Validate and normalize
    feedback.score = typeof feedback.score === "number"
      ? Math.min(10, Math.max(0, feedback.score))
      : 5;
    feedback.summary = feedback.summary || "No summary provided.";
    feedback.issues = Array.isArray(feedback.issues) ? feedback.issues : [];
    feedback.performance = Array.isArray(feedback.performance) ? feedback.performance : [];
    feedback.bestPractices = Array.isArray(feedback.bestPractices) ? feedback.bestPractices : [];

    // Save to DB
    const reviewId = randomUUID();
    db.prepare(`
      INSERT INTO reviews
        (id, user_id, code, language, filename, score, summary, issues, performance, best_practices)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reviewId,
      req.user.id,
      code,
      language,
      filename,
      feedback.score,
      feedback.summary,
      JSON.stringify(feedback.issues),
      JSON.stringify(feedback.performance),
      JSON.stringify(feedback.bestPractices),
    );

    console.log(`✅ Review saved (id: ${reviewId}, score: ${feedback.score})`);

    res.json({ feedback, reviewId });

  } catch (err) {
    console.error("Review route error:", err);
    res.status(500).json({ error: err.message || "Review failed. Please try again." });
  }
});

// DELETE /api/reviews/:id
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const row = db.prepare("SELECT id FROM reviews WHERE id = ? AND user_id = ?").get(id, req.user.id);
    if (!row) return res.status(404).json({ error: "Review not found." });
    db.prepare("DELETE FROM reviews WHERE id = ?").run(id);
    res.json({ message: "Deleted." });
  } catch (err) {
    res.status(500).json({ error: "Delete failed." });
  }
});

// ── Prompt builder ────────────────────────────────────────────
function buildPrompt(code, language, filename) {
  const systemPrompt = `You are an expert code reviewer. Analyze code and return structured feedback as JSON.

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no explanation outside the JSON.

Required JSON structure:
{
  "score": <number from 1.0 to 10.0>,
  "summary": "<one clear paragraph describing the overall code quality>",
  "issues": [
    {
      "type": "<error|warning|info>",
      "title": "<short title>",
      "description": "<what is wrong and how to fix it>"
    }
  ],
  "performance": [
    {
      "title": "<performance tip title>",
      "description": "<explanation of the performance tip>"
    }
  ],
  "bestPractices": [
    {
      "title": "<best practice title>",
      "description": "<explanation>"
    }
  ]
}

Scoring guide:
- 8.0-10.0: Clean, well-structured, production-ready code
- 6.0-7.9: Decent but needs some improvements
- 4.0-5.9: Several issues, needs significant work
- 1.0-3.9: Poor quality, major problems

Rules:
- issues: 0 to 5 items (only real problems, not nitpicks)
- performance: 1 to 3 items
- bestPractices: 2 to 4 items
- Be specific, educational, and constructive`;

  const userPrompt = `Review the following ${language} code${filename ? ` from file "${filename}"` : ""}:

\`\`\`${language}
${code}
\`\`\``;

  return { systemPrompt, userPrompt };
}

export default router;
