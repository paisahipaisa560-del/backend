const router = require('express').Router();
const { createDeposit, getUserDeposits, getAllDeposits, approveDeposit, rejectDeposit } = require('../controllers/depositController');
const { auth, adminAuth } = require('../middleware/auth');
const { validateDeposit } = require('../middleware/validate');

router.post('/', auth, validateDeposit, createDeposit);
router.get('/', auth, getUserDeposits);
router.get('/all', adminAuth, getAllDeposits);
router.put('/:id/approve', adminAuth, approveDeposit);
router.put('/:id/reject', adminAuth, rejectDeposit);

module.exports = router;
