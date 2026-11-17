// Cloudflare Pages Function: same-origin global counter backed by D1 (binding DB).
// POST = one new browser tab session; GET = current total.
// All clients share the same DB. No visitor IP or user identifier is stored.
const json = (value, status=200) => new Response(JSON.stringify(value), {
  status,
  headers: {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'}
});

export async function onRequest({request, env}) {
  if (!['GET', 'POST'].includes(request.method)) return json({error:'Method not allowed'},405);
  if (!env.DB) return json({error:'D1 binding DB is not configured'},503);
  // Reject cross-origin form/JS POST where browsers supply Origin.
  if (request.method === 'POST') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) return json({error:'Forbidden origin'},403);
    // Fetch Metadata helps reduce cross-site scripted/form requests.
    const site = request.headers.get('Sec-Fetch-Site');
    if (site && !['same-origin','none'].includes(site)) return json({error:'Cross-site request'},403);
  }
  try {
    if (request.method === 'POST') {
      const update = await env.DB.prepare('UPDATE visitor_counter SET total = total + 1 WHERE id = 1').run();
      if (!update.meta?.changes) return json({error:'Initialize D1 with schema.sql first'},503);
    }
    const row = await env.DB.prepare('SELECT total FROM visitor_counter WHERE id = 1').first();
    if (!row) return json({error:'Initialize D1 with schema.sql first'},503);
    return json({total:row.total});
  } catch (err) {
    console.error('Visitor counter database error',err);
    return json({error:'Counter temporarily unavailable'},503);
  }
}
