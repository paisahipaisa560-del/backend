const router = require('express').Router();
const { getGameState, placeBet, cashOut, getBetHistory, getGameHistory } = require('../controllers/gameController');
const { auth } = require('../middleware/auth');
const { validateGameBet } = require('../middleware/validate');

router.get('/state', auth, getGameState);
router.post('/bet', auth, validateGameBet, placeBet);
router.post('/cashout', auth, cashOut);
router.get('/history', auth, getBetHistory);
router.get('/rounds', auth, getGameHistory);

module.exports = router;
