export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY not found."
      });
    }

    const body = req.body || {};

    const ingredients = Array.isArray(body.ingredients)
      ? body.ingredients.join(", ")
      : (body.ingredients || "");

    const lang = body.lang || body.language || "en";

    const outputLanguage =
      lang === "hi" ? "Hindi" : "English";

    const prompt = `
You are an expert chef.

Create one recipe using only these ingredients:
${ingredients}

Return the recipe in ${outputLanguage}.

Format:

Title:
Ingredients:
Instructions:
`;

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    const rawText = await response.text();

    console.log("Gemini Response:");
    console.log(rawText);

    if (!response.ok) {
      return res.status(response.status).json({
        error: rawText
      });
    }

    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(500).json({
        error: "Invalid JSON received from Gemini."
      });
    }

    const recipe =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!recipe) {
      return res.status(500).json({
        error: "Gemini returned an empty recipe.",
        data
      });
    }

    return res.status(200).json({
      success: true,
      recipe
    });

  } catch (err) {
    console.error("Backend Error:", err);

    return res.status(500).json({
      error: err.message || "Internal server error"
    });
  }
}
  

