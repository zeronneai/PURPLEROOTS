// Returns the publishable key (safe to expose) so the page never hardcodes it.
module.exports = function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
};
