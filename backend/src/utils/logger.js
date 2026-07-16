const prisma = require('../config/db');

async function log(type, message, recruiterId = null) {
  try {
    console.log(`[${type}] ${message}`);
    await prisma.syncLog.create({
      data: { type, message, recruiterId: recruiterId || undefined },
    });
  } catch (err) {
    console.error('Failed to persist log entry:', err.message);
  }
}

module.exports = { log };
