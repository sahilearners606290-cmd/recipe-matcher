// RISE AI nutrition estimator - Vercel Serverless Function (CommonJS)
const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "GEMINI_API_KEY missing in Vercel settings" });

  try {
    const { query = "", ingredients = "", servings = 1, lang = "en" } = req.body || {};
    if (!String(query).trim() && !String(ingredients).trim()) {
      return res.status(400).json({ error: "Food name or ingredients required" });
    }

    const count = Math.max(1, Math.min(30, Number(servings) || 1));
    const prompt = `Estimate nutrition for this food. Food: ${query}. Ingredients: ${ingredients}. Servings: ${count}. Give realistic approximate values; do not claim medical accuracy. Return ONLY JSON in this exact structure: {"food":"name","servings":${count},"perServing":{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number},"total":{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number},"note":"short estimate caveat"}. ${lang === "hi" ? "Write food and note in Hindi." : "Write food and note in English."}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    let apiResponse, data;
    try {
      const model = "gemini-3.5-flash-lite";
      apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json", maxOutputTokens: 400 }
        }),
        signal: controller.signal
      });
      data = await apiResponse.json().catch(() => ({}));
    } finally {
      clearTimeout(timeout);
    }

    if (!apiResponse.ok) {
      const message = data?.error?.message || "Gemini nutrition request failed";
      console.error("Nutrition Gemini API error:", apiResponse.status, message);
      const status = [429, 401, 403].includes(apiResponse.status) ? apiResponse.status : 502;
      return res.status(status).json({ error: message });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!text) return res.status(502).json({ error: "AI returned an empty nutrition result" });

    const result = JSON.parse(text);
    if (!result.perServing || typeof result.perServing.calories !== "number") {
      return res.status(502).json({ error: "Invalid nutrition result from AI" });
    }
    result.servings = count;
    result.note = result.note || "Approximate values; portion size and cooking oil affect results.";
    return res.status(200).json(result);
  } catch (error) {
    if (error?.name === "AbortError") {
      console.error("Nutrition API timed out after 25 seconds");
      return res.status(504).json({ error: "Nutrition calculation timed out. Please try again." });
    }
    console.error("Nutrition API error:", error?.message || error);
    return res.status(500).json({ error: "Could not calculate nutrition. Please retry." });
  }
}

module.exports = handler;
module.exports.config = config;
