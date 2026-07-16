const ExcelJS = require('exceljs');
const prisma = require('../config/db');

function buildWhere(query) {
  const { search = '', status, recruiterId } = query;
  return {
    AND: [
      search
        ? {
            OR: [
              { candidateName: { contains: search } },
              { fileName: { contains: search } },
            ],
          }
        : {},
      status ? { processingStatus: status } : {},
      recruiterId ? { recruiterId } : {},
      { deletedFromSource: false },
    ],
  };
}

async function list(req, res) {
  const { page = '1', pageSize = '10', sortBy = 'uploadDate', sortDir = 'desc' } = req.query;
  const take = Math.min(parseInt(pageSize, 10) || 10, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
  const where = buildWhere(req.query);

  const [items, total] = await Promise.all([
    prisma.resume.findMany({
      where,
      include: { recruiter: { select: { name: true } } },
      orderBy: { [sortBy]: sortDir === 'asc' ? 'asc' : 'desc' },
      skip,
      take,
    }),
    prisma.resume.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pageSize: take });
}

async function exportCsv(req, res) {
  const where = buildWhere(req.query);
  const items = await prisma.resume.findMany({
    where,
    include: { recruiter: { select: { name: true } } },
    orderBy: { uploadDate: 'desc' },
  });

  const header = 'Candidate Name,File Name,Recruiter,Upload Date,Status,File Size (KB),Pages,OneDrive Link\n';
  const rows = items
    .map((r) =>
      [
        csvEscape(r.candidateName || ''),
        csvEscape(r.fileName),
        csvEscape(r.recruiter.name),
        r.uploadDate.toISOString(),
        r.processingStatus,
        Math.round(r.fileSizeBytes / 1024),
        r.pageCount ?? '',
        csvEscape(r.oneDriveWebUrl || ''),
      ].join(',')
    )
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="resumes.csv"');
  res.send(header + rows);
}

function csvEscape(value) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function exportExcel(req, res) {
  const where = buildWhere(req.query);
  const items = await prisma.resume.findMany({
    where,
    include: { recruiter: { select: { name: true } } },
    orderBy: { uploadDate: 'desc' },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Resumes');
  sheet.columns = [
    { header: 'Candidate Name', key: 'candidateName', width: 25 },
    { header: 'File Name', key: 'fileName', width: 30 },
    { header: 'Recruiter', key: 'recruiter', width: 20 },
    { header: 'Upload Date', key: 'uploadDate', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'File Size (KB)', key: 'size', width: 15 },
    { header: 'Pages', key: 'pages', width: 10 },
    { header: 'OneDrive Link', key: 'link', width: 40 },
  ];
  sheet.getRow(1).font = { bold: true };

  items.forEach((r) => {
    sheet.addRow({
      candidateName: r.candidateName || '',
      fileName: r.fileName,
      recruiter: r.recruiter.name,
      uploadDate: r.uploadDate.toISOString().slice(0, 10),
      status: r.processingStatus,
      size: Math.round(r.fileSizeBytes / 1024),
      pages: r.pageCount ?? '',
      link: r.oneDriveWebUrl || '',
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="resumes.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { list, exportCsv, exportExcel };
