// Reads a Checkout Session after the customer returns (used only when a payment method redirects).
const { stripe } = require('./_stripe');

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const id = String((req.query && req.query.session_id) || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: 'Invalid session.' });
  try {
    const s = await stripe('GET', '/checkout/sessions/' + id);
    return res.status(200).json({
      status: s.status,                 // open | complete | expired
      paymentStatus: s.payment_status,  // paid | unpaid (ACH is unpaid until it clears)
      amount: s.amount_total,
      email: (s.customer_details && s.customer_details.email) || s.customer_email || ''
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
};
