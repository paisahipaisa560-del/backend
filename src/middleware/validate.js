const validateRegister = (req, res, next) => {
  const { fullName, email, mobile, password, confirmPassword } = req.body;
  const errors = [];
  if (!fullName || fullName.trim().length < 2) errors.push('Full name is required (min 2 chars)');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
  if (!mobile || !/^\d{10,15}$/.test(mobile)) errors.push('Valid mobile number is required');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
  if (password !== confirmPassword) errors.push('Passwords do not match');
  if (errors.length > 0) return res.status(400).json({ success: false, message: errors.join('. ') });
  next();
};

const validateDeposit = (req, res, next) => {
  const { amount } = req.body;
  if (!amount || amount < 100) return res.status(400).json({ success: false, message: 'Minimum deposit is ₹100' });
  if (amount > 1000000) return res.status(400).json({ success: false, message: 'Maximum deposit is 10,00,000' });
  next();
};

const validateWithdraw = (req, res, next) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
  const min = parseFloat(process.env.MIN_WITHDRAWAL) || 100;
  const max = parseFloat(process.env.MAX_WITHDRAWAL) || 100000;
  if (amount < min) return res.status(400).json({ success: false, message: `Minimum withdrawal is ₹${min}` });
  if (amount > max) return res.status(400).json({ success: false, message: `Maximum withdrawal is ₹${max}` });
  next();
};

const validateGameBet = (req, res, next) => {
  const { amount } = req.body;
  if (!amount || amount < 100) return res.status(400).json({ success: false, message: 'Minimum bet is ₹100' });
  if (amount > 100000) return res.status(400).json({ success: false, message: 'Maximum bet is ₹1,00,000' });
  next();
};

module.exports = { validateRegister, validateDeposit, validateWithdraw, validateGameBet };
