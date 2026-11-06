// Creates an embedded Stripe Checkout Session for a one-time payment.
// The client chooses the amount (minimum $750). Card, Apple Pay, Google Pay and
// bank transfer (ACH) show up based on what is turned on in the Stripe Dashboard.
const { stripe } = require('./_stripe');

const MIN_USD = 750;
const MAX_USD = 100000;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const clean = (s, n) => String(s || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (b.website) return res.status(400).json({ error: 'Invalid request.' }); // honeypot

    const lang = b.lang === 'es' ? 'es' : 'en';
    const name = clean(b.name, 80);
    const business = clean(b.business, 100);
    const email = clean(b.email, 120).toLowerCase();
    const memo = clean(b.memo, 140);
    const amount = Math.round(parseFloat(String(b.amount).replace(/[^0-9.]/g, '')) * 100) / 100;

    const msg = lang === 'es'
      ? { name: 'Escribe tu nombre.', biz: 'Escribe el nombre de tu negocio.', email: 'Escribe un correo válido.', min: 'Escribe un monto válido.', max: 'Para montos mayores a $100,000 contáctanos.' }
      : { name: 'Please enter your name.', biz: 'Please enter your business name.', email: 'Please enter a valid email.', min: 'Please enter a valid amount.', max: 'For amounts over $100,000 please contact us.' };
    if (!name) return res.status(400).json({ error: msg.name });
    if (!business) return res.status(400).json({ error: msg.biz });
    if (!EMAIL_RX.test(email)) return res.status(400).json({ error: msg.email });
    if (!(amount >= MIN_USD)) return res.status(400).json({ error: msg.min });
    if (amount > MAX_USD) return res.status(400).json({ error: msg.max });

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const base = (process.env.SITE_URL || ('https://' + host)).replace(/\/$/, '');
    const page = lang === 'es' ? '/es/pago' : '/payment';
    const label = business ? business + ' (' + name + ')' : name;
    const meta = { client_name: name, business: business, email: email, memo: memo, lang: lang, source: 'purpleroots.agency/payment' };

    const session = await stripe('POST', '/checkout/sessions', {
      ui_mode: 'embedded_page',
      mode: 'payment',
      submit_type: 'pay',
      locale: lang,
      customer_email: email,
      customer_creation: 'always',
      line_items: { 0: { quantity: 1, price_data: { currency: 'usd', unit_amount: Math.round(amount * 100),
        product_data: { name: 'Purple Roots Agency', description: memo || (lang === 'es' ? 'Pago de servicios' : 'Payment for services') } } } },
      payment_intent_data: { description: 'Purple Roots payment: ' + label + (memo ? ' | ' + memo : ''), metadata: meta },
      metadata: meta,
      redirect_on_completion: 'if_required',
      return_url: base + page + '?session_id={CHECKOUT_SESSION_ID}'
    });
    return res.status(200).json({ clientSecret: session.client_secret });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
  }
};
