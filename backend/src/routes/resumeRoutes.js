const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/resumesController');
router.use(requireAuth);
router.get('/', ctrl.list);
router.get('/export/csv', ctrl.exportCsv);
router.get('/export/excel', ctrl.exportExcel);
module.exports = router;
