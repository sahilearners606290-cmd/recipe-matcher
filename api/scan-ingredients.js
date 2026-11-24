// Vercel serverless function (CommonJS)
const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "GEMINI_API_KEY missing in Vercel settings" });

  try {
    const { image, lang = "en" } = req.body || {};
    if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const match = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: "Use JPG, PNG, or WEBP image" });

    const mimeType = match[1] === "jpg" ? "image/jpeg" : `image/${match[1]}`;
    const prompt = lang === "hi"
      ? "इस तस्वीर में स्पष्ट रूप से दिखाई देने वाली खाने की सामग्री पहचानो। केवल सामग्री के नाम की JSON array लौटाओ, जैसे [\"टमाटर\",\"प्याज\"]। कोई अनुमानित या छिपी सामग्री न जोड़ो।"
      : "Identify clearly visible food ingredients in this photo. Return only a JSON array of ingredient names, e.g. [\"tomato\",\"onion\"]. Do not add hidden or guessed ingredients.";

    const apiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" + encodeURIComponent(key),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: match[2] } }
          ] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
      }
    );

    const payload = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error("Gemini scan API error:", payload);
      return res.status(apiResponse.status).json({
        error: payload?.error?.message || "Gemini scan failed"
      });
    }

    const responseText = payload?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "").join("").trim() || "";

    let ingredients;
    try { ingredients = JSON.parse(responseText || "[]"); }
    catch { ingredients = []; }

    if (!Array.isArray(ingredients)) {
      ingredients = Array.isArray(ingredients?.ingredients) ? ingredients.ingredients : [];
    }
    ingredients = ingredients.map(item => String(item).trim()).filter(Boolean).slice(0, 30);
    return res.status(200).json({ ingredients });
  } catch (error) {
    console.error("Scan endpoint error:", error);
    return res.status(500).json({ error: "Unable to scan image" });
  }
}

module.exports = handler;
module.exports.config = config;
