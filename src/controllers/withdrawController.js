const { query } = require('../config/database');

const createWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const minW = parseFloat(process.env.MIN_WITHDRAWAL) || 100;
    const maxW = parseFloat(process.env.MAX_WITHDRAWAL) || 100000;
    if (amount < minW) return res.status(400).json({ success: false, message: `Minimum withdrawal is ₹${minW}` });
    if (amount > maxW) return res.status(400).json({ success: false, message: `Maximum withdrawal is ₹${maxW}` });

    const userResult = await query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
    const balance = parseFloat(userResult.rows[0].balance);
    if (balance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    const bankResult = await query('SELECT id FROM bank_accounts WHERE user_id = $1', [req.user.id]);
    if (bankResult.rows.length === 0) return res.status(400).json({ success: false, message: 'Please add bank account first' });

    const oldBalance = balance;
    const newBalance = balance - amount;
    await query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, req.user.id]);

    const result = await query(
      'INSERT INTO withdrawals (user_id, amount, status) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, amount, 'pending']
    );
    await query(
      'INSERT INTO transactions (user_id, type, amount, description, balance_before, balance_after) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'withdrawal', amount, 'Withdrawal request submitted', oldBalance, newBalance]
    );
    res.status(201).json({ success: true, message: 'Withdrawal request submitted. Awaiting approval.', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create withdrawal request' });
  }
};

const getUserWithdrawals = async (req, res) => {
  try {
    const result = await query('SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals' });
  }
};

const getAllWithdrawals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT w.*, u.full_name, u.email, u.mobile,
              b.holder_name, b.account_number, b.ifsc_code, b.bank_name, b.upi_id
       FROM withdrawals w
       JOIN users u ON w.user_id = u.id
       LEFT JOIN bank_accounts b ON b.user_id = u.id
       ORDER BY w.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await query('SELECT COUNT(*) FROM withdrawals');
    res.json({ success: true, data: result.rows, total: parseInt(countResult.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals' });
  }
};

const approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await query('SELECT * FROM withdrawals WHERE id = $1', [id]);
    if (withdrawal.rows.length === 0) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    if (withdrawal.rows[0].status !== 'pending') return res.status(400).json({ success: false, message: 'Withdrawal already processed' });

    await query('UPDATE withdrawals SET status = $1, updated_at = NOW() WHERE id = $2', ['approved', id]);
    await query(
      'INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)',
      [withdrawal.rows[0].user_id, 'withdrawal_approved', withdrawal.rows[0].amount, 'Withdrawal approved']
    );
    res.json({ success: true, message: 'Withdrawal approved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to approve withdrawal' });
  }
};

const rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await query('SELECT * FROM withdrawals WHERE id = $1', [id]);
    if (withdrawal.rows.length === 0) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    if (withdrawal.rows[0].status !== 'pending') return res.status(400).json({ success: false, message: 'Withdrawal already processed' });

    const amount = parseFloat(withdrawal.rows[0].amount);
    const userResult = await query('SELECT balance FROM users WHERE id = $1', [withdrawal.rows[0].user_id]);
    const oldBalance = parseFloat(userResult.rows[0].balance);
    const newBalance = oldBalance + amount;

    await query('UPDATE withdrawals SET status = $1, updated_at = NOW() WHERE id = $2', ['rejected', id]);
    await query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, withdrawal.rows[0].user_id]);
    await query(
      'INSERT INTO transactions (user_id, type, amount, description, balance_before, balance_after) VALUES ($1, $2, $3, $4, $5, $6)',
      [withdrawal.rows[0].user_id, 'withdrawal_rejected', amount, 'Withdrawal rejected - refunded', oldBalance, newBalance]
    );
    res.json({ success: true, message: 'Withdrawal rejected. Balance refunded.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reject withdrawal' });
  }
};

module.exports = { createWithdrawal, getUserWithdrawals, getAllWithdrawals, approveWithdrawal, rejectWithdrawal };
