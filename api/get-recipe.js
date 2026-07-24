export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key missing in Vercel Environment Variables" });
    }

    const prompt = `You are an expert chef. Create 1 recipe using some or all of these ingredients: ${ingredients}. Respond ONLY with a valid JSON object matching this exact structure, without any markdown or backticks:
    {
      "RecipeName": "Recipe Title",
      "Ingredients": ["Ingredient 1", "Ingredient 2"],
      "Steps": ["Step 1 description", "Step 2 description"]
    }`;

    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(googleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API Error Response:", errorData);
      return res.status(500).json({ error: "Gemini API failed to respond" });
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    
    // Markdown formatting remove karne ke liye
    const cleanJsonString = rawText.replace(/```json|```/g, "").trim();
    const recipeData = JSON.parse(cleanJsonString);

    return res.status(200).json(recipeData);

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || "Failed to process recipe" });
  }
}
