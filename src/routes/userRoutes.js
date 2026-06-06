const router = require('express').Router();
const { getProfile, updateProfile, getBalance, claimDailyBonus } = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/balance', auth, getBalance);
router.post('/daily-bonus', auth, claimDailyBonus);

module.exports = router;
