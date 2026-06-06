const { query } = require('../config/database');

const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const type = req.query.type;
    let sql = 'SELECT * FROM transactions WHERE user_id = $1';
    let params = [req.user.id];
    if (type && type !== 'all') {
      sql += ' AND type = $2';
      params.push(type);
    }
    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) FROM transactions WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, data: result.rows, total: parseInt(countResult.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const result = await query(
      'SELECT t.*, u.full_name, u.email FROM transactions t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const countResult = await query('SELECT COUNT(*) FROM transactions');
    res.json({ success: true, data: result.rows, total: parseInt(countResult.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

module.exports = { getTransactions, getAllTransactions };
