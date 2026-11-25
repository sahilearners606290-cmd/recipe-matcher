
// Vercel Serverless Function - CommonJS

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
      /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/
    );

    if (!match) {
      return res.status(400).json({
        error: "Use JPG, PNG, or WEBP image"
      });
    }

    const mimeType =
      match[1] === "jpg"
        ? "image/jpeg"
        : `image/${match[1]}`;

    const prompt = lang === "hi"
      ? "इस तस्वीर में साफ दिखाई देने वाली खाने की सामग्री पहचानो। केवल सामग्री के नाम की JSON array लौटाओ, जैसे [\"टमाटर\",\"प्याज\"]। छिपी हुई सामग्री का अनुमान मत लगाओ।"
      : "Identify clearly visible food ingredients in this image. Return only a JSON array of ingredient names, like [\"tomato\",\"onion\"]. Do not guess hidden ingredients.";

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: match[2]
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    };

    const model = "gemini-3.8-flash";

    const apiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

    let payload = null;
    let lastError = "";

    // Retry temporary API errors up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const apiResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(45000)
        });

        payload = await apiResponse.json();

        if (apiResponse.ok) {
          break;
        }

        lastError =
          payload?.error?.message || "Gemini API request failed";

        const retryable = [
          429, 500, 502, 503, 504
        ].includes(apiResponse.status);

        if (!retryable || attempt === 3) {
          console.error("Gemini scan error:", lastError);

          return res.status(apiResponse.status).json({
            error: lastError
          });
        }

      } catch (error) {
        lastError = error.message || "Network error";

        console.error(
          `Scan attempt ${attempt} failed:`,
          lastError
        );

        if (attempt === 3) {
          return res.status(503).json({
            error: "Gemini service is temporarily unavailable. Please try again."
          });
        }
      }

      // Wait before retrying
      await new Promise(resolve =>
        setTimeout(resolve, attempt * 1500)
      );
    }

    const responseText =
      payload?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim() || "";

    if (!responseText) {
      return res.status(502).json({
        error: "Gemini returned an empty response"
      });
    }

    let ingredients;

    try {
      ingredients = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        error: "Invalid response from Gemini"
      });
    }

    if (!Array.isArray(ingredients)) {
      ingredients = Array.isArray(ingredients?.ingredients)
        ? ingredients.ingredients
        : [];
    }

    ingredients = ingredients
      .map(item => String(item).trim())
      .filter(Boolean)
      .slice(0, 30);

    return res.status(200).json({
      ingredients
    });

  } catch (error) {
    console.error("Scan endpoint error:", error);

    return res.status(500).json({
      error: "Unable to scan image"
    });
  }
}

module.exports = handler;
module.exports.config = config;
