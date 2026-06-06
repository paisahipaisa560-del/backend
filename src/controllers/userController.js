const { query } = require('../config/database');

const getProfile = async (req, res) => {
  try {
    const result = await query('SELECT id, full_name, email, mobile, balance, referral_code, referral_earnings, total_referrals, is_admin, created_at FROM users WHERE id = $1', [req.user.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, email, mobile } = req.body;
    if (email) {
      const existing = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
      if (existing.rows.length > 0) return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    if (mobile) {
      const existing = await query('SELECT id FROM users WHERE mobile = $1 AND id != $2', [mobile, req.user.id]);
      if (existing.rows.length > 0) return res.status(400).json({ success: false, message: 'Mobile already in use' });
    }
    const result = await query(
      'UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email), mobile = COALESCE($3, mobile), updated_at = NOW() WHERE id = $4 RETURNING id, full_name, email, mobile, balance, referral_code, created_at',
      [fullName || null, email || null, mobile || null, req.user.id]
    );
    res.json({ success: true, message: 'Profile updated', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

const getBalance = async (req, res) => {
  try {
    const result = await query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
    res.json({ success: true, data: { balance: parseFloat(result.rows[0].balance) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch balance' });
  }
};

const claimDailyBonus = async (req, res) => {
  try {
    const result = await query('SELECT last_daily_bonus, balance FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (user.last_daily_bonus) {
      const last = new Date(user.last_daily_bonus);
      const now = new Date();
      if (now - last < 86400000) {
        const nextClaim = new Date(last.getTime() + 86400000);
        return res.status(400).json({ success: false, message: `Next bonus available at ${nextClaim.toLocaleTimeString()}` });
      }
    }
    const bonus = 10;
    const oldBalance = parseFloat(user.balance);
    const newBalance = oldBalance + bonus;
    await query('UPDATE users SET balance = $1, last_daily_bonus = NOW(), daily_bonus_claimed = true WHERE id = $2', [newBalance, req.user.id]);
    await query(
      'INSERT INTO transactions (user_id, type, amount, description, balance_before, balance_after) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'daily_bonus', bonus, 'Daily bonus claimed', oldBalance, newBalance]
    );
    res.json({ success: true, message: `Daily bonus of ₹${bonus} claimed!`, data: { balance: newBalance } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to claim bonus' });
  }
};

module.exports = { getProfile, updateProfile, getBalance, claimDailyBonus };
