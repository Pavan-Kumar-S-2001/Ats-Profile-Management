const prisma = require('../config/db');

async function list(req, res) {
  const {
    page = '1',
    pageSize = '10',
    search = '',
    status,
    sortBy = 'createdDate',
    sortDir = 'desc',
  } = req.query;

  const take = Math.min(parseInt(pageSize, 10) || 10, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { department: { contains: search } },
            ],
          }
        : {},
      status ? { status } : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.recruiter.findMany({
      where,
      orderBy: { [sortBy]: sortDir === 'asc' ? 'asc' : 'desc' },
      skip,
      take,
    }),
    prisma.recruiter.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pageSize: take });
}

async function getOne(req, res) {
  const recruiter = await prisma.recruiter.findUnique({
    where: { id: req.params.id },
    include: { resumes: { orderBy: { uploadDate: 'desc' }, take: 20 } },
  });
  if (!recruiter) return res.status(404).json({ error: 'Recruiter not found' });
  res.json(recruiter);
}

async function create(req, res) {
  const { name, email, department, oneDriveFolderName, folderPath, status } = req.body;
  if (!name || !email || !oneDriveFolderName || !folderPath) {
    return res.status(400).json({ error: 'name, email, oneDriveFolderName, and folderPath are required' });
  }
  const recruiter = await prisma.recruiter.create({
    data: { name, email, department, oneDriveFolderName, folderPath, status: status || 'Active' },
  });
  res.status(201).json(recruiter);
}

async function update(req, res) {
  const { name, email, department, oneDriveFolderName, folderPath, status } = req.body;
  try {
    const recruiter = await prisma.recruiter.update({
      where: { id: req.params.id },
      data: { name, email, department, oneDriveFolderName, folderPath, status },
    });
    res.json(recruiter);
  } catch (err) {
    res.status(404).json({ error: 'Recruiter not found' });
  }
}

async function remove(req, res) {
  try {
    await prisma.recruiter.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: 'Recruiter not found' });
  }
}

module.exports = { list, getOne, create, update, remove };
