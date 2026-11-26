
// RISE Recipe Matcher - Fast Recipe Generation API
// Vercel Serverless Function (CommonJS)

const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb"
    }
  }
};

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    console.error("GEMINI_API_KEY missing");

    return res.status(500).json({
      error: "GEMINI_API_KEY missing in Vercel settings"
    });
  }

  try {
    const { ingredients, lang = "en" } = req.body || {};

    if (!ingredients ||
        (Array.isArray(ingredients) && ingredients.length === 0)) {
      return res.status(400).json({
        error: "Ingredients are required"
      });
    }

    const ingredientText = Array.isArray(ingredients)
      ? ingredients.join(", ")
      : String(ingredients);

    if (!ingredientText.trim()) {
      return res.status(400).json({
        error: "Please add valid ingredients"
      });
    }

    const prompt = lang === "hi"
      ? `इन सामग्री से एक आसान और व्यावहारिक भारतीय रेसिपी बनाओ: ${ingredientText}।

केवल JSON लौटाओ:
{
  "id": "unique-short-id",
  "name": "English recipe name",
  "hindi": "हिंदी नाम",
  "ingredients": ["ingredient 1"],
  "steps": ["step 1", "step 2"]
}

Recipe का नाम English में और Hindi नाम हिंदी में हो। Steps हिंदी में हों।`
      : `Create one simple, practical recipe using these ingredients: ${ingredientText}.

Return only JSON:
{
  "id": "unique-short-id",
  "name": "Recipe name",
  "hindi": "Hindi recipe name",
  "ingredients": ["ingredient 1"],
  "steps": ["step 1", "step 2"]
}

Keep instructions clear and practical.`;

    const model = "gemini-3.5-flash-lite";

    const apiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
        maxOutputTokens: 1000
      }
    };

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 25000);

    let response;
    let data;

    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      data = await response.json().catch(() => ({}));

    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const status = response.status;

      const message =
        data?.error?.message || "Gemini recipe generation failed";

      console.error(
        "Recipe Gemini API error:",
        status,
        message
      );

      if (status === 429) {
        return res.status(429).json({
          error: "AI request limit reached. Please try again later."
        });
      }

      if ([500, 502, 503, 504].includes(status)) {
        return res.status(503).json({
          error: "AI service is busy. Please try again shortly."
        });
      }

      if ([401, 403].includes(status)) {
        return res.status(status).json({
          error: "Gemini API key rejected. Check Vercel settings."
        });
      }

      if (status === 404) {
        return res.status(502).json({
          error: "Gemini model is unavailable for this project."
        });
      }

      return res.status(502).json({
        error: "Gemini recipe generation failed."
      });
    }

    const responseText =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim() || "";

    if (!responseText) {
      console.error(
        "Recipe API empty response:",
        JSON.stringify(data)
      );

      return res.status(502).json({
        error: "Gemini returned an empty recipe."
      });
    }

    let recipe;

    try {
      recipe = JSON.parse(responseText);
    } catch (error) {
      console.error(
        "Recipe JSON parsing error:",
        responseText
      );

      return res.status(502).json({
        error: "Invalid recipe response from AI."
      });
    }

    if (
      !recipe.name ||
      !Array.isArray(recipe.ingredients) ||
      !Array.isArray(recipe.steps)
    ) {
      console.error(
        "Invalid recipe structure:",
        JSON.stringify(recipe)
      );

      return res.status(502).json({
        error: "AI returned an incomplete recipe."
      });
    }

    recipe.id = recipe.id || `ai-${Date.now()}`;

    return res.status(200).json(recipe);

  } catch (error) {

    if (error?.name === "AbortError") {
      console.error("Recipe API timed out after 25 seconds");

      return res.status(504).json({
        error: "Recipe generation took too long. Please try again."
      });
    }

    console.error(
      "Recipe API error:",
      error?.message || error
    );

    return res.status(500).json({
      error: "Unable to generate recipe."
    });
  }
}

module.exports = handler;
module.exports.config = config;
