const { query } = require('../config/database');

const getReferralInfo = async (req, res) => {
  try {
    const userResult = await query(
      'SELECT referral_code, referral_earnings, total_referrals FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userResult.rows[0];
    const countResult = await query('SELECT COUNT(*) FROM referrals WHERE parent_id = $1', [req.user.id]);
    const earningsResult = await query('SELECT COALESCE(SUM(bonus), 0) as total FROM referrals WHERE parent_id = $1', [req.user.id]);
    res.json({
      success: true,
      data: {
        referralCode: user.referral_code,
        referralEarnings: parseFloat(user.referral_earnings),
        totalReferrals: parseInt(user.total_referrals),
        totalEarnings: parseFloat(earningsResult.rows[0].total)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch referral info' });
  }
};

const getReferralTeam = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.full_name, u.created_at as join_date, r.bonus as earnings_generated
       FROM referrals r JOIN users u ON r.child_id = u.id
       WHERE r.parent_id = $1 ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch referral team' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const result = await query(
      'SELECT full_name, total_referrals, referral_earnings FROM users WHERE total_referrals > 0 ORDER BY total_referrals DESC, referral_earnings DESC LIMIT 20'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
};

module.exports = { getReferralInfo, getReferralTeam, getLeaderboard };
