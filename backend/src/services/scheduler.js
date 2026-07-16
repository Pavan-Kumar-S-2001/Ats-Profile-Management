const cron = require('node-cron');
const { syncAll } = require('./syncService');
const { log } = require('../utils/logger');

function startScheduler() {
  const minutes = parseInt(process.env.SYNC_INTERVAL_MINUTES || '15', 10);
  const expression = `*/${minutes} * * * *`;

  cron.schedule(expression, async () => {
    await log('Sync', `Scheduled sync starting (every ${minutes}m)`);
    try {
      await syncAll();
    } catch (err) {
      await log('Error', `Scheduled sync crashed: ${err.message}`);
    }
  });

  console.log(`Background sync scheduled every ${minutes} minute(s)`);
}

module.exports = { startScheduler };
