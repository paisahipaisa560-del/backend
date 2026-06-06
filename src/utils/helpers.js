const crypto = require('crypto');

const generateReferralCode = () => {
  return 'PHP' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateRoundHash = (seed) => {
  return crypto.createHash('sha256').update(seed + Date.now()).digest('hex');
};

const generateCrashPoint = () => {
  const hash = crypto.createHash('sha256').update(Date.now().toString() + Math.random()).digest('hex');
  const decimal = parseInt(hash.slice(0, 13), 16) / Math.pow(16, 13);

  let crashPoint;
  const roll = Math.random();

  if (roll < 0.60) {
    crashPoint = 1 + decimal * 0.5;
  } else if (roll < 0.80) {
    crashPoint = 1.5 + decimal * 1.5;
  } else if (roll < 0.92) {
    crashPoint = 3 + decimal * 7;
  } else {
    crashPoint = 10 + decimal * 90;
  }

  return Math.floor(Math.max(1.01, crashPoint) * 100) / 100;
};

const formatAmount = (amount) => {
  return parseFloat(amount).toFixed(2);
};

module.exports = { generateReferralCode, generateOTP, generateRoundHash, generateCrashPoint, formatAmount };
