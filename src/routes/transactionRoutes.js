const router = require('express').Router();
const { getTransactions, getAllTransactions } = require('../controllers/transactionController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, getTransactions);
router.get('/all', adminAuth, getAllTransactions);

module.exports = router;
