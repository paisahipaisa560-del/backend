const router = require('express').Router();
const { createWithdrawal, getUserWithdrawals, getAllWithdrawals, approveWithdrawal, rejectWithdrawal } = require('../controllers/withdrawController');
const { auth, adminAuth } = require('../middleware/auth');
const { validateWithdraw } = require('../middleware/validate');

router.post('/', auth, validateWithdraw, createWithdrawal);
router.get('/', auth, getUserWithdrawals);
router.get('/all', adminAuth, getAllWithdrawals);
router.put('/:id/approve', adminAuth, approveWithdrawal);
router.put('/:id/reject', adminAuth, rejectWithdrawal);

module.exports = router;
