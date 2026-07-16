const prisma = require('../config/db');
const graph = require('../services/graphService');

const SETTINGS_KEYS = ['MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET', 'MS_DRIVE_ID', 'MS_PARENT_FOLDER', 'SYNC_INTERVAL_MINUTES'];

async function getSettings(req, res) {
  const rows = await prisma.appSetting.findMany({ where: { key: { in: SETTINGS_KEYS } } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  // Mask secret
  const result = SETTINGS_KEYS.reduce((acc, key) => {
    acc[key] = map[key] ?? process.env[key] ?? '';
    return acc;
  }, {});
  if (result.MS_CLIENT_SECRET) result.MS_CLIENT_SECRET = '••••••••';
  res.json(result);
}

async function saveSettings(req, res) {
  const updates = req.body;
  for (const key of SETTINGS_KEYS) {
    if (updates[key] !== undefined && updates[key] !== '••••••••') {
      await prisma.appSetting.upsert({
        where: { key },
        create: { key, value: String(updates[key]) },
        update: { value: String(updates[key]) },
      });
      process.env[key] = String(updates[key]); // apply immediately for this running instance
    }
  }
  res.json({ ok: true });
}

async function testConnection(req, res) {
  try {
    const result = await graph.testConnection();
    res.json(result);
  } catch (err) {
    res.status(400).json({ ok: false, error: err.publicMessage || err.message });
  }
}

module.exports = { getSettings, saveSettings, testConnection };
