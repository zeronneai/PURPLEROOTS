// Shared helper for the Stripe REST API (no npm packages needed).
// Keys live only in Vercel > Settings > Environment Variables:
//   STRIPE_SECRET_KEY       sk_live_... (or sk_test_... for testing)
//   STRIPE_PUBLISHABLE_KEY  pk_live_... (or pk_test_...)
const API_VERSION = '2026-03-25.dahlia';

function encode(obj, prefix, out) {
  out = out || [];
  Object.keys(obj).forEach(function (k) {
    const v = obj[k];
    if (v === undefined || v === null || v === '') return;
    const key = prefix ? prefix + '[' + k + ']' : k;
    if (typeof v === 'object') encode(v, key, out);
    else out.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(v)));
  });
  return out.join('&');
}

async function stripe(method, path, params) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw Object.assign(new Error('Payments are not configured yet.'), { status: 500 });
  const res = await fetch('https://api.stripe.com/v1' + path, {
    method: method,
    headers: {
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': API_VERSION
    },
    body: method === 'GET' ? undefined : encode(params || {})
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Stripe error', res.status, data && data.error && data.error.message);
    throw Object.assign(new Error((data.error && data.error.message) || 'Stripe error'), { status: 502 });
  }
  return data;
}

module.exports = { stripe: stripe };
