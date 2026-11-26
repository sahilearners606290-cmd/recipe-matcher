
// RISE Recipe Matcher - Fast AI Ingredient Scanner
// Vercel Serverless Function (CommonJS)

const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb"
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
    return res.status(500).json({
      error: "GEMINI_API_KEY missing in Vercel settings"
    });
  }

  try {
    const { image, lang = "en" } = req.body || {};

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        error: "Image data is required"
      });
    }

    const match = image.match(
      /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/
    );

    if (!match) {
      return res.status(400).json({
        error: "Use JPG, PNG, or WEBP image"
      });
    }

    const mimeType = match[1] === "jpg"
      ? "image/jpeg"
      : `image/${match[1]}`;

    const base64Data = match[2].replace(/\s/g, "");

    if (base64Data.length > 4500000) {
      return res.status(413).json({
        error: "Image too large. Choose a smaller photo."
      });
    }

    const prompt = lang === "hi"
      ? "इस तस्वीर में साफ दिखाई देने वाली खाने की सामग्री पहचानो। केवल नामों की JSON array लौटाओ, जैसे [\"टमाटर\",\"प्याज\"]। छिपी सामग्री का अनुमान मत लगाओ।"
      : "Identify clearly visible food ingredients in this image. Return only a JSON array of names, like [\"tomato\",\"onion\"]. Do not guess hidden ingredients.";

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        maxOutputTokens: 256
      }
    };

    // Fast model for image identification
    const model = "gemini-3.5-flash-lite";

    const apiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Only one request - no unnecessary retries
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 25000);

    let apiResponse;
    let payload;

    try {
      apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      payload = await apiResponse.json().catch(() => ({}));

    } finally {
      clearTimeout(timeoutId);
    }

    if (!apiResponse.ok) {
      const status = apiResponse.status;

      const message =
        payload?.error?.message || "Gemini API failed";

      console.error(
        "Gemini scan API error:",
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
          error: "API key rejected. Check GEMINI_API_KEY in Vercel."
        });
      }

      if (status === 404) {
        return res.status(502).json({
          error: "Gemini model is unavailable for this project."
        });
      }

      return res.status(502).json({
        error: "Gemini could not process this image."
      });
    }

    const responseText =
      payload?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim() || "";

    if (!responseText) {
      return res.status(502).json({
        error: "Gemini returned an empty response."
      });
    }

    let ingredients;

    try {
      const parsed = JSON.parse(responseText);

      ingredients = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.ingredients)
          ? parsed.ingredients
          : [];

    } catch {
      return res.status(502).json({
        error: "Invalid response from Gemini."
      });
    }

    ingredients = ingredients
      .filter(item => typeof item === "string")
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 30);

    return res.status(200).json({
      ingredients
    });

  } catch (error) {

    if (error?.name === "AbortError") {
      console.error("Scanner timed out");

      return res.status(504).json({
        error: "Scanning took too long. Try a smaller photo."
      });
    }

    console.error(
      "Scan endpoint error:",
      error?.message || error
    );

    return res.status(500).json({
      error: "Unable to scan image. Please try again."
    });
  }
}

module.exports = handler;
module.exports.config = config;
