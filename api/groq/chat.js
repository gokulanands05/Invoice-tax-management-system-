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

export default async function handler(req, res) {
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
  const model = payload.model || 'llama-3.3-70b-versatile';
  const messages = payload.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Missing messages[]' });
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
        messages,
        temperature: payload.temperature ?? 0.7,
        max_tokens: payload.max_tokens ?? 2048,
      }),
    });

    const text = await upstream.text();
    res.status(upstream.status).send(text);
  } catch (error) {
    res.status(502).json({ error: error?.message || 'Upstream request failed' });
  }
}
