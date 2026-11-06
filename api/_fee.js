// Service fee added on top of the amount the client types. Default 5%.
// Change it with SERVICE_FEE_PERCENT in Vercel (0 turns it off).
function percent() {
  const v = Number(process.env.SERVICE_FEE_PERCENT);
  return Number.isFinite(v) && v >= 0 && v <= 10 ? v : 5;
}
function totalCents(amountUsd) { return Math.round(amountUsd * (100 + percent())); }
module.exports = { percent: percent, totalCents: totalCents };
