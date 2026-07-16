const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/syncController');
router.use(requireAuth);
router.post('/all', ctrl.triggerAll);
router.post('/:id', ctrl.triggerOne);
router.get('/status', ctrl.status);
module.exports = router;
