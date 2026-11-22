// Recipe Matcher AI fallback API (compatible with app.js)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "GEMINI_API_KEY missing in Vercel settings" });
  try {
    const { ingredients, lang = "en" } = req.body || {};
    if (!ingredients) return res.status(400).json({ error: "Ingredients are required" });
    const prompt = lang === "hi"
      ? `इन सामग्री से एक आसान भारतीय रेसिपी बनाओ: ${ingredients}। केवल JSON लौटाओ: {"id":"unique-short-id","name":"English recipe name","hindi":"हिंदी नाम","ingredients":["ingredient 1"],"steps":["step 1","step 2"]}. Steps हिंदी में हों।`
      : `Create one simple practical recipe using these ingredients: ${ingredients}. Return only JSON with shape {"id":"unique-short-id","name":"Recipe name","hindi":"Hindi recipe name","ingredients":["ingredient 1"],"steps":["step 1","step 2"]}.`;
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + key, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.6, responseMimeType: "application/json" } })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Gemini recipe generation failed" });
    let recipe = JSON.parse(data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "{}");
    if (!recipe.name || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) throw new Error("Invalid recipe response");
    recipe.id = recipe.id || `ai-${Date.now()}`;
    return res.status(200).json(recipe);
  } catch (e) {
    console.error("Recipe API error:", e);
    return res.status(500).json({ error: "Unable to generate recipe" });
  }
      }
