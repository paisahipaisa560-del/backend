const { query } = require('../config/database');

const getBankAccount = async (req, res) => {
  try {
    const result = await query('SELECT * FROM bank_accounts WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bank account' });
  }
};

const updateBankAccount = async (req, res) => {
  try {
    const { holderName, accountNumber, ifscCode, bankName, upiId } = req.body;
    if (!holderName || !accountNumber || !ifscCode || !bankName) {
      return res.status(400).json({ success: false, message: 'Holder name, account number, IFSC, and bank name are required' });
    }
    const existing = await query('SELECT id FROM bank_accounts WHERE user_id = $1', [req.user.id]);
    let result;
    if (existing.rows.length > 0) {
      result = await query(
        'UPDATE bank_accounts SET holder_name = $1, account_number = $2, ifsc_code = $3, bank_name = $4, upi_id = $5, updated_at = NOW() WHERE user_id = $6 RETURNING *',
        [holderName, accountNumber, ifscCode, bankName, upiId || null, req.user.id]
      );
    } else {
      result = await query(
        'INSERT INTO bank_accounts (user_id, holder_name, account_number, ifsc_code, bank_name, upi_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [req.user.id, holderName, accountNumber, ifscCode, bankName, upiId || null]
      );
    }
    res.json({ success: true, message: 'Bank account updated', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update bank account' });
  }
};

const deleteBankAccount = async (req, res) => {
  try {
    const result = await query('DELETE FROM bank_accounts WHERE user_id = $1 RETURNING id', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'No bank account found' });
    res.json({ success: true, message: 'Bank account deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete bank account' });
  }
};

module.exports = { getBankAccount, updateBankAccount, deleteBankAccount };
