const prisma = require('../config/db');

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return x;
}
function startOfMonth(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  return x;
}

/**
 * Public, no-auth summary shown on the landing page.
 */
async function publicSummary(req, res) {
  const [totalRecruiters, totalResumes, totalProcessed, pending, today, week, month, lastSyncLog, recentRecruiters] =
    await Promise.all([
      prisma.recruiter.count(),
      prisma.resume.count({ where: { deletedFromSource: false } }),
      prisma.resume.count({ where: { processingStatus: 'Processed', deletedFromSource: false } }),
      prisma.resume.count({ where: { processingStatus: 'Pending', deletedFromSource: false } }),
      prisma.resume.count({ where: { uploadDate: { gte: startOfDay() }, deletedFromSource: false } }),
      prisma.resume.count({ where: { uploadDate: { gte: startOfWeek() }, deletedFromSource: false } }),
      prisma.resume.count({ where: { uploadDate: { gte: startOfMonth() }, deletedFromSource: false } }),
      prisma.syncLog.findFirst({ where: { type: 'Sync' }, orderBy: { createdAt: 'desc' } }),
      prisma.recruiter.findMany({ orderBy: { lastUpload: 'desc' }, take: 5, where: { lastUpload: { not: null } } }),
    ]);

  res.json({
    totalRecruiters,
    totalResumes,
    totalProcessed,
    pendingProcessing: pending,
    todayUploads: today,
    weekUploads: week,
    monthUploads: month,
    lastSyncTime: lastSyncLog ? lastSyncLog.createdAt : null,
    recentRecruiters,
  });
}

/**
 * Full admin dashboard payload including chart data.
 */
async function adminSummary(req, res) {
  const [
    totalRecruiters,
    totalResumes,
    totalProcessed,
    pending,
    failed,
    duplicates,
    recruiters,
    latestUploads,
  ] = await Promise.all([
    prisma.recruiter.count(),
    prisma.resume.count({ where: { deletedFromSource: false } }),
    prisma.resume.count({ where: { processingStatus: 'Processed', deletedFromSource: false } }),
    prisma.resume.count({ where: { processingStatus: 'Pending', deletedFromSource: false } }),
    prisma.resume.count({ where: { processingStatus: 'Failed', deletedFromSource: false } }),
    prisma.resume.count({ where: { isDuplicate: true, deletedFromSource: false } }),
    prisma.recruiter.findMany(),
    prisma.resume.findMany({
      where: { deletedFromSource: false },
      include: { recruiter: { select: { name: true } } },
      orderBy: { uploadDate: 'desc' },
      take: 10,
    }),
  ]);

  const storageUsedBytes = await prisma.resume.aggregate({
    _sum: { fileSizeBytes: true },
    where: { deletedFromSource: false },
  });

  const topRecruiter = [...recruiters].sort((a, b) => b.uploadCount - a.uploadCount)[0] || null;
  const avgUploads = recruiters.length
    ? recruiters.reduce((sum, r) => sum + r.uploadCount, 0) / recruiters.length
    : 0;
  const inactiveRecruiters = recruiters.filter((r) => r.status === 'Inactive').length;

  // Recruiter comparison (upload counts)
  const recruiterComparison = recruiters
    .map((r) => ({ name: r.name, uploads: r.uploadCount }))
    .sort((a, b) => b.uploads - a.uploads)
    .slice(0, 10);

  // Monthly trend for last 6 months
  const monthlyTrend = await getMonthlyTrend();

  res.json({
    totalRecruiters,
    totalUploadedPdfs: totalResumes,
    totalProcessed,
    pending,
    failed,
    duplicates,
    storageUsedBytes: storageUsedBytes._sum.fileSizeBytes || 0,
    latestUploads,
    recentRecruiters: [...recruiters].sort((a, b) => (b.lastUpload || 0) - (a.lastUpload || 0)).slice(0, 5),
    topRecruiter: topRecruiter ? { name: topRecruiter.name, uploads: topRecruiter.uploadCount } : null,
    averageUploads: Number(avgUploads.toFixed(1)),
    inactiveRecruiters,
    successRate: totalResumes ? Number(((totalProcessed / totalResumes) * 100).toFixed(1)) : 0,
    charts: {
      monthlyTrend,
      recruiterComparison,
      processingStatus: [
        { name: 'Processed', value: totalProcessed },
        { name: 'Pending', value: pending },
        { name: 'Failed', value: failed },
      ],
    },
  });
}

async function getMonthlyTrend() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = await prisma.resume.count({
      where: { uploadDate: { gte: start, lt: end }, deletedFromSource: false },
    });
    months.push({ month: start.toLocaleString('default', { month: 'short', year: '2-digit' }), uploads: count });
  }
  return months;
}

module.exports = { publicSummary, adminSummary };
