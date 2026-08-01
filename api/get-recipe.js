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
        error: "GEMINI_API_KEY is missing."
      });
    }

    const { ingredients, lang, language } = req.body;

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({
        error: "Ingredients are required."
      });
    }

    const selectedLanguage = lang || language || "en";

    const ingredientList = Array.isArray(ingredients)
      ? ingredients.join(", ")
      : ingredients;

    const prompt = `
You are an expert chef.

Create a delicious recipe using ONLY these ingredients:

${ingredientList}

Language:
${selectedLanguage === "hi" ? "Hindi" : "English"}

Return in this format:

Recipe Name

Ingredients

Instructions

Cooking Tips
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
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
      }
    );

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
  
  
