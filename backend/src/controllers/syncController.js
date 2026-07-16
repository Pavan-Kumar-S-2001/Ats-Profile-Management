const prisma = require('../config/db');
const { syncAll, syncRecruiter, isSyncInProgress } = require('../services/syncService');

async function triggerAll(req, res) {
  if (isSyncInProgress()) {
    return res.status(409).json({ error: 'A sync is already in progress' });
  }
  // Respond immediately, run in background, client polls status/logs
  res.json({ started: true });
  syncAll().catch(() => {});
}

async function triggerOne(req, res) {
  const recruiter = await prisma.recruiter.findUnique({ where: { id: req.params.id } });
  if (!recruiter) return res.status(404).json({ error: 'Recruiter not found' });
  try {
    const result = await syncRecruiter(recruiter);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function status(req, res) {
  res.json({ inProgress: isSyncInProgress() });
}

module.exports = { triggerAll, triggerOne, status };
