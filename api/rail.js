// Vercel Serverless Function — Israel Railways API Proxy
// Solves CORS: Browser → this function → rail-api.rail.co.il → back to browser

const API_BASE = 'https://rail-api.rail.co.il/rjpa/api/v1';
const API_KEY = process.env.RAIL_API_KEY || '5e64d66cf03f4547bcac5de2de06b566';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { endpoint, ...params } = req.method === 'GET' ? req.query : req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    // Only allow specific endpoints
    const allowedEndpoints = ['timetable/searchTrain'];
    if (!allowedEndpoints.includes(endpoint)) {
      return res.status(400).json({ error: 'Invalid endpoint' });
    }

    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ocp-apim-subscription-key': API_KEY,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: 'API error',
        status: response.status,
        detail: text,
      });
    }

    const data = await response.json();
    // Cache for 60 seconds on Vercel edge
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}
