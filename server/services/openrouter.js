// ── OpenRouter AI Service ──────────────────────────────────────
// Tries each model in order. Falls back to the next if a model
// fails (non-2xx, empty response, or network error).

const MODELS = [
  "deepseek/deepseek-chat-v3-0324",   // primary (cheap & fast)
  "anthropic/claude-3-haiku",         // fallback 1
  "openai/gpt-4o-mini",               // fallback 2
];

const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Call OpenRouter with automatic model fallback.
 * @param {string} systemPrompt  – system role message
 * @param {string} userPrompt    – user role message
 * @returns {Promise<string>}    – raw text content from the model
 */
export async function callOpenRouter(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to your .env file."
    );
  }

  let lastError = null;

  for (const model of MODELS) {
    try {
      console.log(`🤖 Trying model: ${model}`);

      const res = await fetch(OPENROUTER_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:5173",   // required by OpenRouter
          "X-Title": "CodeLensAI",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: userPrompt   },
          ],
          temperature: 0.2,
          max_tokens: 2048,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = errBody?.error?.message || `HTTP ${res.status}`;
        console.warn(`⚠️  Model ${model} failed: ${msg}`);
        lastError = new Error(`${model}: ${msg}`);
        continue; // try next model
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";

      if (!text.trim()) {
        console.warn(`⚠️  Model ${model} returned empty content.`);
        lastError = new Error(`${model}: empty response`);
        continue; // try next model
      }

      console.log(`✅ Got response from ${model} (${text.length} chars)`);
      return text;

    } catch (err) {
      console.warn(`⚠️  Model ${model} threw an error: ${err.message}`);
      lastError = err;
      // try next model
    }
  }

  // All models failed
  throw new Error(
    `All OpenRouter models failed. Last error: ${lastError?.message}`
  );
}
