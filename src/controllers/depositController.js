const { query } = require('../config/database');

const createDeposit = async (req, res) => {
  try {
    const { amount, utr } = req.body;
    const result = await query(
      'INSERT INTO deposits (user_id, amount, utr) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, amount, utr || null]
    );
    res.status(201).json({ success: true, message: 'Deposit request submitted. Awaiting approval.', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create deposit request' });
  }
};

const getUserDeposits = async (req, res) => {
  try {
    const result = await query('SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch deposits' });
  }
};

const getAllDeposits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const result = await query(
      'SELECT d.*, u.full_name, u.email, u.mobile FROM deposits d JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const countResult = await query('SELECT COUNT(*) FROM deposits');
    res.json({ success: true, data: result.rows, total: parseInt(countResult.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch deposits' });
  }
};

const approveDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const deposit = await query('SELECT * FROM deposits WHERE id = $1', [id]);
    if (deposit.rows.length === 0) return res.status(404).json({ success: false, message: 'Deposit not found' });
    if (deposit.rows[0].status !== 'pending') return res.status(400).json({ success: false, message: 'Deposit already processed' });

    const userResult = await query('SELECT balance FROM users WHERE id = $1', [deposit.rows[0].user_id]);
    const oldBalance = parseFloat(userResult.rows[0].balance);
    const amount = parseFloat(deposit.rows[0].amount);
    const newBalance = oldBalance + amount;

    await query('UPDATE deposits SET status = $1, updated_at = NOW() WHERE id = $2', ['approved', id]);
    await query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, deposit.rows[0].user_id]);
    await query(
      'INSERT INTO transactions (user_id, type, amount, description, balance_before, balance_after) VALUES ($1, $2, $3, $4, $5, $6)',
      [deposit.rows[0].user_id, 'deposit', amount, 'Deposit approved', oldBalance, newBalance]
    );
    res.json({ success: true, message: 'Deposit approved. Balance updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to approve deposit' });
  }
};

const rejectDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const deposit = await query('SELECT * FROM deposits WHERE id = $1', [id]);
    if (deposit.rows.length === 0) return res.status(404).json({ success: false, message: 'Deposit not found' });
    if (deposit.rows[0].status !== 'pending') return res.status(400).json({ success: false, message: 'Deposit already processed' });

    await query('UPDATE deposits SET status = $1, updated_at = NOW() WHERE id = $2', ['rejected', id]);
    await query(
      'INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)',
      [deposit.rows[0].user_id, 'deposit_rejected', deposit.rows[0].amount, 'Deposit rejected']
    );
    res.json({ success: true, message: 'Deposit rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reject deposit' });
  }
};

module.exports = { createDeposit, getUserDeposits, getAllDeposits, approveDeposit, rejectDeposit };
