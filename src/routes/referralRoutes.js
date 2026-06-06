const router = require('express').Router();
const { getReferralInfo, getReferralTeam, getLeaderboard } = require('../controllers/referralController');
const { auth } = require('../middleware/auth');

router.get('/info', auth, getReferralInfo);
router.get('/team', auth, getReferralTeam);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
