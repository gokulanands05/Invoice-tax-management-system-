function readBody(req) {
  const body = req.body;
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server not configured: GROQ_API_KEY missing' });
    return;
  }

  const payload = readBody(req) || {};
  const imageBase64 = payload.imageBase64;
  const mimeType = payload.mimeType;
  const prompt = payload.prompt;
  const model = payload.model || 'llama-3.2-90b-vision-preview';

  if (!imageBase64 || !mimeType || !prompt) {
    res.status(400).json({ error: 'Missing imageBase64, mimeType, or prompt' });
    return;
  }

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    const text = await upstream.text();
    res.status(upstream.status).send(text);
  } catch (error) {
    res.status(502).json({ error: error?.message || 'Upstream request failed' });
  }
};

