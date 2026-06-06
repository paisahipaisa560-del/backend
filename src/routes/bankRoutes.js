const router = require('express').Router();
const { getBankAccount, updateBankAccount, deleteBankAccount } = require('../controllers/bankController');
const { auth } = require('../middleware/auth');

router.get('/account', auth, getBankAccount);
router.put('/account', auth, updateBankAccount);
router.delete('/account', auth, deleteBankAccount);

module.exports = router;
