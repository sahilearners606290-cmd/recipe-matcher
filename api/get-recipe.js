export default async function handler(req, res) {
  // Allow CORS
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
    const { ingredients, lang, language } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key missing in Vercel settings" });
    }

    const selectedLang = lang || language || 'en';
    const ingList = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients;
    const userLanguage = selectedLang === 'hi' ? 'Hindi' : 'English';

    const promptText = `You are an expert chef. Create a simple step-by-step recipe using these ingredients: ${ingList}. Output Language: ${userLanguage}. Include Title, Ingredients, and Instructions.`;

    // Updated Active Gemini API Endpoint URL
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let response = await fetch(googleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }]
      })
    });

    // Fallback URL agar 2.5 response me issue ho
    if (!response.ok) {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });
    }

    if (!response.ok) {
  const errorData = await response.text();

  console.error("Gemini API Error Response:", errorData);

  return res.status(response.status).json({
    error: errorData
  });
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return res.status(200).json({ recipe: data.candidates[0].content.parts[0].text });
    } else {
      return res.status(500).json({ error: "Failed to parse recipe from Gemini" });
    }

  } catch (error) {
    console.error("Backend Gateway Exception:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
