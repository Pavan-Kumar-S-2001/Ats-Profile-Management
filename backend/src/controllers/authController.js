const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const prisma = require('../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { log } = require('../utils/logger');

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) {
    await log('Auth', `Failed login attempt for username "${username}"`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    await log('Auth', `Failed login attempt for username "${username}"`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = signAccessToken(admin);
  const refreshToken = signRefreshToken(admin);
  const decoded = verifyRefreshToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      id: uuid(),
      token: refreshToken,
      adminId: admin.id,
      expiresAt: new Date(decoded.exp * 1000),
    },
  });

  await log('Auth', `Admin "${username}" logged in`);

  res.json({
    accessToken,
    refreshToken,
    admin: { id: admin.id, username: admin.username },
  });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token is invalid or expired' });
    }

    const admin = await prisma.admin.findUnique({ where: { id: payload.sub } });
    if (!admin) return res.status(401).json({ error: 'Admin not found' });

    const newAccessToken = signAccessToken(admin);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }
  res.json({ ok: true });
}

module.exports = { login, refresh, logout };
