const { query } = require('../config/database');

const getGameState = async (req, res) => {
  try {
    const engine = req.app.locals.gameEngine;
    const state = engine.getState();
    const userBetKeys = engine.userBets.get(req.user.id) || [];
    const userBets = userBetKeys.map(k => engine.activeBets.get(k)).filter(Boolean);

    // fetch recent bet history in same call
    const historyResult = await query(
      'SELECT b.*, gr.crash_multiplier FROM bets b LEFT JOIN game_rounds gr ON b.round_id = gr.id WHERE b.user_id = $1 ORDER BY b.created_at DESC LIMIT 10',
      [req.user.id]
    );

    res.json({ success: true, data: { ...state, userBets, recentBets: historyResult.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get game state' });
  }
};

const placeBet = async (req, res) => {
  try {
    const { amount, autoCashoutAt } = req.body;
    const engine = req.app.locals.gameEngine;
    const result = await engine.placeBet(req.user.id, amount, autoCashoutAt || null);
    res.json({ success: true, message: 'Bet placed!', data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const cashOut = async (req, res) => {
  try {
    const { betId } = req.body;
    const engine = req.app.locals.gameEngine;
    const result = await engine.cashOut(req.user.id, betId || null);
    res.json({ success: true, message: `Cashed out at ${result.cashoutMultiplier}x!`, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getBetHistory = async (req, res) => {
  try {
    const result = await query(
      'SELECT b.*, gr.crash_multiplier FROM bets b LEFT JOIN game_rounds gr ON b.round_id = gr.id WHERE b.user_id = $1 ORDER BY b.created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bet history' });
  }
};

const getGameHistory = async (req, res) => {
  try {
    const result = await query('SELECT * FROM game_rounds ORDER BY created_at DESC LIMIT 50');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch game history' });
  }
};

module.exports = { getGameState, placeBet, cashOut, getBetHistory, getGameHistory };
