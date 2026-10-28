import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import express from 'express';
import mongoose from 'mongoose';
import { isAdmin } from './authorization.js';

const scrypt = promisify(scryptCallback);
const sessionCookie = 'uptime_session';
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const sessions = new Map();

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 32 },
  usernameLower: { type: String, required: true, unique: true, index: true },
  passwordSalt: { type: String, required: true, select: false },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, 64);
  return { salt, hash: hash.toString('hex') };
}

function validateCredentials(body) {
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
    throw Object.assign(new Error('Tên tài khoản cần từ 3–32 ký tự, chỉ gồm chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.'), { status: 400 });
  }
  if (password.length < 6 || password.length > 128) {
    throw Object.assign(new Error('Mật khẩu cần có từ 6 đến 128 ký tự.'), { status: 400 });
  }

  return { username, password };
}

function publicUser(user) {
  return {
    id: String(user._id),
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function readSessionToken(req) {
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`));
  return cookie ? cookie.slice(sessionCookie.length + 1) : '';
}

function setSessionCookie(res, token, maxAge) {
  const attributes = [
    `${sessionCookie}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === 'production') attributes.push('Secure');
  res.setHeader('Set-Cookie', attributes.join('; '));
}

export function createAuthRouter({ isMongoConnected, onUserDeleted }) {
  const router = express.Router();

  async function authenticate(req, res, next) {
    const token = readSessionToken(req);
    const session = sessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      if (token) sessions.delete(token);
      setSessionCookie(res, '', 0);
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    }

    try {
      const user = await User.findById(session.userId);
      if (!user || !user.isActive) {
        sessions.delete(token);
        setSessionCookie(res, '', 0);
        return res.status(401).json({ error: 'Tài khoản không còn hoạt động. Vui lòng đăng nhập lại.' });
      }
      req.user = { id: String(user._id), username: user.username, role: user.role };
      next();
    } catch (error) {
      next(error);
    }
  }

  function requireAdmin(req, res, next) {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện chức năng này.' });
    }
    next();
  }

  router.post('/register', async (req, res, next) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({ error: 'MongoDB chưa kết nối. Không thể tạo tài khoản lúc này.' });
      }

      const { username, password } = validateCredentials(req.body);
      const { salt, hash } = await hashPassword(password);
      const user = await User.create({
        username,
        usernameLower: username.toLowerCase(),
        passwordSalt: salt,
        passwordHash: hash,
        role: 'user',
        isActive: true,
      });

      res.status(201).json({ username: user.username });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Tên tài khoản này đã được sử dụng.' });
      }
      next(error);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({ error: 'MongoDB chưa kết nối. Không thể đăng nhập lúc này.' });
      }

      const { username, password } = validateCredentials(req.body);
      const user = await User.findOne({ usernameLower: username.toLowerCase() })
        .select('+passwordSalt +passwordHash');
      if (!user) return res.status(401).json({ error: 'Tên tài khoản hoặc mật khẩu không chính xác.' });
      if (!user.isActive) return res.status(403).json({ error: 'Tài khoản đã bị khóa. Hãy liên hệ quản trị viên.' });

      const { hash } = await hashPassword(password, user.passwordSalt);
      const expected = Buffer.from(user.passwordHash, 'hex');
      const actual = Buffer.from(hash, 'hex');
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        return res.status(401).json({ error: 'Tên tài khoản hoặc mật khẩu không chính xác.' });
      }

      const token = randomBytes(32).toString('hex');
      for (const [activeToken, session] of sessions) {
        if (session.expiresAt <= Date.now()) sessions.delete(activeToken);
      }
      sessions.set(token, { userId: user._id, expiresAt: Date.now() + sessionLifetimeMs });
      setSessionCookie(res, token, Math.floor(sessionLifetimeMs / 1000));
      res.json(publicUser(user));
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', (req, res) => {
    const token = readSessionToken(req);
    if (token) sessions.delete(token);
    setSessionCookie(res, '', 0);
    res.status(204).end();
  });

  router.get('/me', authenticate, async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(401).json({ error: 'Tài khoản không còn tồn tại.' });
      res.json(publicUser(user));
    } catch (error) {
      next(error);
    }
  });

  router.use('/admin', authenticate, requireAdmin);

  router.get('/admin/users', async (_req, res, next) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.json(users.map(publicUser));
    } catch (error) {
      next(error);
    }
  });

  router.post('/admin/users', async (req, res, next) => {
    try {
      const { username, password } = validateCredentials(req.body);
      const role = req.body?.role ?? 'user';
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Vai trò phải là admin hoặc user.' });
      }

      const { salt, hash } = await hashPassword(password);
      const user = await User.create({
        username,
        usernameLower: username.toLowerCase(),
        passwordSalt: salt,
        passwordHash: hash,
        role,
        isActive: true,
      });
      res.status(201).json(publicUser(user));
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Tên tài khoản này đã được sử dụng.' });
      }
      next(error);
    }
  });

  router.patch('/admin/users/:id', async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
      }
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });

      const role = req.body?.role ?? user.role;
      const isActive = req.body?.isActive ?? user.isActive;
      if (!['admin', 'user'].includes(role) || typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'Vai trò hoặc trạng thái tài khoản không hợp lệ.' });
      }
      if (String(user._id) === req.user.id && (role !== 'admin' || !isActive)) {
        return res.status(400).json({ error: 'Không thể tự hạ quyền hoặc khóa tài khoản đang đăng nhập.' });
      }
      if (user.role === 'admin' && user.isActive && (role !== 'admin' || !isActive)) {
        const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true });
        if (activeAdmins <= 1) {
          return res.status(400).json({ error: 'Không thể hạ quyền hoặc khóa quản trị viên hoạt động cuối cùng.' });
        }
      }

      user.role = role;
      user.isActive = isActive;
      await user.save();
      res.json(publicUser(user));
    } catch (error) {
      next(error);
    }
  });

  router.delete('/admin/users/:id', async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
      }
      if (req.params.id === req.user.id) {
        return res.status(400).json({ error: 'Không thể xóa tài khoản đang đăng nhập.' });
      }
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });

      if (user.role === 'admin' && user.isActive) {
        const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true });
        if (activeAdmins <= 1) {
          return res.status(400).json({ error: 'Không thể xóa quản trị viên hoạt động cuối cùng.' });
        }
      }

      if (onUserDeleted) await onUserDeleted(String(user._id));
      await User.deleteOne({ _id: user._id });
      for (const [token, session] of sessions) {
        if (String(session.userId) === String(user._id)) sessions.delete(token);
      }
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return {
    router,
    authenticate,
    requireAdmin,
    async bootstrapAdmin() {
      await User.updateMany({ role: { $exists: false } }, { $set: { role: 'user' } });
      await User.updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } });
      const { ADMIN_USERNAME: username, ADMIN_PASSWORD: password } = process.env;
      if (!username && !password) {
        console.warn('[auth] Chưa cấu hình ADMIN_USERNAME/ADMIN_PASSWORD; hãy cấu hình để tạo Admin đầu tiên.');
        return;
      }
      if (!username || !password) {
        throw new Error('Cần cấu hình cả ADMIN_USERNAME và ADMIN_PASSWORD để khởi tạo Admin.');
      }

      const credentials = validateCredentials({ username, password });
      const existing = await User.findOne({ usernameLower: credentials.username.toLowerCase() });
      if (existing) {
        if (existing.role !== 'admin') {
          throw new Error('ADMIN_USERNAME đã thuộc tài khoản User. Hãy chọn username Admin chưa được đăng ký.');
        }
        return;
      }

      const { salt, hash } = await hashPassword(credentials.password);
      await User.create({
        username: credentials.username,
        usernameLower: credentials.username.toLowerCase(),
        passwordSalt: salt,
        passwordHash: hash,
        role: 'admin',
        isActive: true,
      });
      console.info(`[auth] Đã khởi tạo tài khoản Admin "${credentials.username}".`);
    },
    async isAssignableOwner(userId) {
      if (!mongoose.isValidObjectId(userId)) return false;
      return Boolean(await User.exists({ _id: userId, role: 'user', isActive: true }));
    },
  };
}
