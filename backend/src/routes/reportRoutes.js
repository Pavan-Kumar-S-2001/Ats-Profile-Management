const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/reportsController');
router.use(requireAuth);
router.get('/excel', ctrl.excelReport);
router.get('/pdf', ctrl.pdfReport);
module.exports = router;
