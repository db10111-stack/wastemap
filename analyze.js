// Vercel Serverless Function: proxies recycling-analysis requests to Google's Gemini API.
// The API key lives only in Vercel's environment variables (GEMINI_API_KEY),
// never in the page's client-side code.

var GEMINI_MODEL = 'gemini-2.5-flash';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  var body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || !body.system || !body.parts) {
    res.status(400).json({ error: 'Missing system or parts' });
    return;
  }

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent';

  try {
    var response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: body.parts }],
        systemInstruction: { parts: [{ text: body.system }] },
        generationConfig: {
          maxOutputTokens: 1000,
          responseMimeType: 'application/json'
        }
      })
    });

    var data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach Gemini API', detail: String(err) });
  }
};
