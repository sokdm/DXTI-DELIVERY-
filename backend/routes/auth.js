const express = require('express');
const router = express.Router();
const { login, getMe, setupAdmin } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/login', login);
router.post('/setup', setupAdmin);
router.get('/me', auth, getMe);

module.exports = router;
