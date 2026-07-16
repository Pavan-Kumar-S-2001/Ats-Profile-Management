const prisma = require('../config/db');

async function list(req, res) {
  const { type, page = '1', pageSize = '25' } = req.query;
  const take = Math.min(parseInt(pageSize, 10) || 25, 200);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
  const where = type ? { type } : {};

  const [items, total] = await Promise.all([
    prisma.syncLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.syncLog.count({ where }),
  ]);
  res.json({ items, total, page: Number(page), pageSize: take });
}

module.exports = { list };
