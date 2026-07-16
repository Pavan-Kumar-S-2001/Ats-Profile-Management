const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/settingsController');
router.use(requireAuth);
router.get('/', ctrl.getSettings);
router.put('/', ctrl.saveSettings);
router.post('/test-connection', ctrl.testConnection);
module.exports = router;
