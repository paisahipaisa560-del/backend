const router = require('express').Router();
const { getSupport } = require('../controllers/supportController');

router.get('/', getSupport);

module.exports = router;
