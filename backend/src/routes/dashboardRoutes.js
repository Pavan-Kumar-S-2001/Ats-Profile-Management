const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');
router.get('/public', ctrl.publicSummary); // no auth - landing page
router.get('/admin', requireAuth, ctrl.adminSummary);
module.exports = router;
