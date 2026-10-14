const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby9fLZLgUbMLj61rS3Sb1ANeNuFSl_-U6skJK1G1XCbojSsPbdbNmCtTyuACotDJCvR/exec';
export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ ok: false, error: 'Method Not Allowed' });
  try {
    const upstream = await fetch(APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: typeof request.body === 'string' ? request.body : JSON.stringify(request.body || {}) });
    const body = await upstream.text();
    response.status(upstream.status).setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    return response.send(body);
  } catch (error) { return response.status(502).json({ ok: false, error: error instanceof Error ? error.message : 'Proxy request failed.' }); }
}
