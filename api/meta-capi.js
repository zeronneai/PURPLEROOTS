// Meta Conversions API: sends each website lead to Meta from the server, alongside the browser pixel.
// The browser and this function share the same event_id, so Meta counts the lead once.
// Needs the env var META_CAPI_TOKEN (Vercel > Settings > Environment Variables). Without it, it does nothing.
const crypto = require('crypto');

const PIXEL_ID = '1699397478369874';
const API_VERSION = 'v21.0';
const ALLOWED_HOSTS = /(^|\.)purpleroots\.agency$|\.vercel\.app$|^localhost$/;

const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');
const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const hostOf = (u) => { try { return new URL(u).hostname; } catch (e) { return ''; } };

function phone(v) {
  let d = str(v, 40).replace(/\D/g, '');
  if (d.length === 10) d = '1' + d;            // US numbers without country code
  return d.length >= 8 ? d : '';
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }

  const url = str(b.url, 500);
  const origin = hostOf(req.headers.origin || '') || hostOf(req.headers.referer || '');
  if (!ALLOWED_HOSTS.test(hostOf(url)) || (origin && !ALLOWED_HOSTS.test(origin))) {
    return res.status(403).json({ ok: false });
  }

  const eventId = str(b.event_id, 80);
  if (!/^lead_[\w-]{6,70}$/.test(eventId)) return res.status(400).json({ ok: false });

  const token = process.env.META_CAPI_TOKEN;
  if (!token) return res.status(200).json({ ok: true, sent: false, reason: 'no token' });

  const user = {};
  const email = str(b.email, 200).toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) user.em = [sha(email)];
  const ph = phone(b.phone);
  if (ph) user.ph = [sha(ph)];
  const parts = str(b.name, 120).toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length) user.fn = [sha(parts[0])];
  if (parts.length > 1) user.ln = [sha(parts[parts.length - 1])];
  const fbp = str(b.fbp, 120); if (/^fb\.\d\.\d+\.\d+$/.test(fbp)) user.fbp = fbp;
  const fbc = str(b.fbc, 400); if (/^fb\.\d\.\d+\..+$/.test(fbc)) user.fbc = fbc;
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (ip) user.client_ip_address = ip;
  const ua = str(req.headers['user-agent'] || '', 500);
  if (ua) user.client_user_agent = ua;

  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: url,
      user_data: user,
      custom_data: { content_name: str(b.content_name, 40) || 'form' }
    }]
  };
  // Test Events code from Events Manager (not a secret); test events never count in campaigns
  const test = str(b.test_event_code, 20) || process.env.META_CAPI_TEST_CODE || '';
  if (/^TEST\w{1,16}$/.test(test)) payload.test_event_code = test;

  try {
    const r = await fetch(`https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('meta-capi error', r.status, j && j.error && j.error.message);
      return res.status(200).json({ ok: false, sent: false });
    }
    return res.status(200).json({ ok: true, sent: true, received: j.events_received || 0 });
  } catch (e) {
    console.error('meta-capi fetch failed', e && e.message);
    return res.status(200).json({ ok: false, sent: false });
  }
};
