// Returns the publishable key (safe to expose) and the service fee so the page never hardcodes them.
const fee = require('./_fee');
module.exports = function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '', feePercent: fee.percent() });
};
