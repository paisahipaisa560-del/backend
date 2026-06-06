const { query } = require('../config/database');

const getSupport = async (req, res) => {
  try {
    const result = await query('SELECT telegram, whatsapp FROM support_settings LIMIT 1');
    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows[0] });
    } else {
      res.json({ success: true, data: { telegram: '', whatsapp: '' } });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch support settings' });
  }
};

const updateSupport = async (req, res) => {
  try {
    const { telegram, whatsapp } = req.body;
    await query(
      'INSERT INTO support_settings (id, telegram, whatsapp) VALUES (1, $1, $2) ON CONFLICT (id) DO UPDATE SET telegram = EXCLUDED.telegram, whatsapp = EXCLUDED.whatsapp',
      [telegram || '', whatsapp || '']
    );
    res.json({ success: true, message: 'Support settings updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update support settings' });
  }
};

module.exports = { getSupport, updateSupport };
