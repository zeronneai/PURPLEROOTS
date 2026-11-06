// Creates a one-time PaymentIntent for the amount the client typed (minimum $750).
// The card / Apple Pay / Google Pay / bank (ACH) fields live inside our own form (Stripe Payment Element),
// so the customer never leaves purpleroots.agency/payment.
const { stripe } = require('./_stripe');
const fee = require('./_fee');

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
    // Minimum is 750. For a quick live test you can set PAYMENT_MIN_USD=1 in Vercel, then remove it.
    const min = Math.max(1, Number(process.env.PAYMENT_MIN_USD) || 750);

    const msg = lang === 'es'
      ? { name: 'Escribe tu nombre.', biz: 'Escribe el nombre de tu negocio.', email: 'Escribe un correo válido.', min: 'Escribe un monto válido.', max: 'Para montos mayores a $100,000 contáctanos.' }
      : { name: 'Please enter your name.', biz: 'Please enter your business name.', email: 'Please enter a valid email.', min: 'Please enter a valid amount.', max: 'For amounts over $100,000 please contact us.' };
    if (!name) return res.status(400).json({ error: msg.name });
    if (!business) return res.status(400).json({ error: msg.biz });
    if (!EMAIL_RX.test(email)) return res.status(400).json({ error: msg.email });
    if (!(amount >= min)) return res.status(400).json({ error: msg.min });
    if (amount > MAX_USD) return res.status(400).json({ error: msg.max });

    const total = fee.totalCents(amount);            // amount + service fee, in cents
    const feeCents = total - Math.round(amount * 100);
    const meta = { amount_before_fee: amount.toFixed(2), service_fee: (feeCents / 100).toFixed(2), service_fee_percent: String(fee.percent()), client_name: name, business: business, email: email, memo: memo, lang: lang, source: 'purpleroots.agency/payment' };
    const pi = await stripe('POST', '/payment_intents', {
      amount: total,
      currency: 'usd',
      automatic_payment_methods: { enabled: 'true' },
      receipt_email: email,
      description: 'Purple Roots payment: ' + business + ' (' + name + ')' + (memo ? ' | ' + memo : '') + ' | $' + amount.toFixed(2) + ' + ' + fee.percent() + '% service fee',
      metadata: meta
    });
    return res.status(200).json({ clientSecret: pi.client_secret });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
  }
};
