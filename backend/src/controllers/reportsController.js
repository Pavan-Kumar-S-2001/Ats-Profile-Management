const ExcelJS = require('exceljs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const prisma = require('../config/db');

function rangeFor(period) {
  const now = new Date();
  if (period === 'weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return { start, end: now };
  }
  if (period === 'monthly') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  }
  if (period === 'yearly') {
    return { start: new Date(now.getFullYear(), 0, 1), end: now };
  }
  return { start: new Date(0), end: now };
}

async function buildReportData(req) {
  const { period = 'monthly', recruiterId } = req.query;
  const { start, end } = rangeFor(period);

  const where = {
    uploadDate: { gte: start, lte: end },
    deletedFromSource: false,
    ...(recruiterId ? { recruiterId } : {}),
  };

  const resumes = await prisma.resume.findMany({
    where,
    include: { recruiter: { select: { name: true } } },
    orderBy: { uploadDate: 'desc' },
  });

  const byRecruiter = {};
  for (const r of resumes) {
    const key = r.recruiter.name;
    byRecruiter[key] = (byRecruiter[key] || 0) + 1;
  }

  return { period, start, end, resumes, byRecruiter, total: resumes.length };
}

async function excelReport(req, res) {
  const data = await buildReportData(req);
  const workbook = new ExcelJS.Workbook();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['Report Period', data.period]);
  summarySheet.addRow(['From', data.start.toISOString().slice(0, 10)]);
  summarySheet.addRow(['To', data.end.toISOString().slice(0, 10)]);
  summarySheet.addRow(['Total Resumes', data.total]);
  summarySheet.addRow([]);
  summarySheet.addRow(['Recruiter', 'Upload Count']).font = { bold: true };
  Object.entries(data.byRecruiter).forEach(([name, count]) => summarySheet.addRow([name, count]));

  const detailSheet = workbook.addWorksheet('Details');
  detailSheet.columns = [
    { header: 'Candidate Name', key: 'candidateName', width: 25 },
    { header: 'Recruiter', key: 'recruiter', width: 20 },
    { header: 'Upload Date', key: 'uploadDate', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
  ];
  detailSheet.getRow(1).font = { bold: true };
  data.resumes.forEach((r) =>
    detailSheet.addRow({
      candidateName: r.candidateName || '',
      recruiter: r.recruiter.name,
      uploadDate: r.uploadDate.toISOString().slice(0, 10),
      status: r.processingStatus,
    })
  );

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="report-${data.period}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

async function pdfReport(req, res) {
  const data = await buildReportData(req);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  let y = 800;

  const writeLine = (text, size = 11, useFont = font) => {
    if (y < 50) {
      page = doc.addPage([595, 842]);
      y = 800;
    }
    page.drawText(text, { x: 50, y, size, font: useFont, color: rgb(0.1, 0.1, 0.1) });
    y -= size + 8;
  };

  writeLine(`ATS Resume Report - ${data.period.toUpperCase()}`, 18, bold);
  writeLine(`Period: ${data.start.toISOString().slice(0, 10)} to ${data.end.toISOString().slice(0, 10)}`);
  writeLine(`Total Resumes: ${data.total}`);
  y -= 10;
  writeLine('Uploads by Recruiter', 13, bold);
  Object.entries(data.byRecruiter).forEach(([name, count]) => writeLine(`${name}: ${count}`));

  const bytes = await doc.save();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report-${data.period}.pdf"`);
  res.send(Buffer.from(bytes));
}

module.exports = { excelReport, pdfReport };
