import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import express from 'express';
import mongoose from 'mongoose';
import { isAdmin } from './authorization.js';
import { getAcceptedRecipients } from './email-delivery.js';
import { getAlertRecipients, normalizeEmailAddress } from './email-recipients.js';
import { validatePassword, validateUsername } from './auth-validation.js';
import {
  generatePasswordResetCode,
  hashPasswordResetCode,
  passwordResetCodeMatches,
} from './password-reset.js';

const scrypt = promisify(scryptCallback);
const sessionCookie = 'uptime_session';
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const passwordResetLifetimeMs = 10 * 60 * 1000;
const passwordResetCooldownMs = 60 * 1000;
const passwordResetMaxAttempts = 5;
const sessions = new Map();

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 32 },
  usernameLower: { type: String, required: true, unique: true, index: true },
  passwordSalt: { type: String, required: true, select: false },
  passwordHash: { type: String, required: true, select: false },
  email: { type: String, default: '' },
  passwordResetCodeHash: { type: String, default: '', select: false },
  passwordResetExpiresAt: { type: Date, default: null, select: false },
  passwordResetRequestedAt: { type: Date, default: null, select: false },
  passwordResetAttempts: { type: Number, default: 0, select: false },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, 64);
  return { salt, hash: hash.toString('hex') };
}

async function passwordMatches(password, salt, expectedHash) {
  const { hash } = await hashPassword(password, salt);
  const expected = Buffer.from(expectedHash, 'hex');
  const actual = Buffer.from(hash, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function validateCredentials(body) {
  const username = validateUsername(body?.username);
  const password = validatePassword(body?.password);
  return { username, password };
}

function publicUser(user) {
  return {
    id: String(user._id),
    username: user.username,
    email: user.email ?? '',
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

export function createAuthRouter({ isMongoConnected, onUserDeleted, getMailer }) {
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
      const email = normalizeEmailAddress(req.body?.email);
      if (!email) {
        return res.status(400).json({ error: 'Vui lòng nhập địa chỉ email hợp lệ.' });
      }
      const { salt, hash } = await hashPassword(password);
      const user = await User.create({
        username,
        usernameLower: username.toLowerCase(),
        passwordSalt: salt,
        passwordHash: hash,
        email,
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

      if (!await passwordMatches(password, user.passwordSalt, user.passwordHash)) {
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

  router.post('/forgot-password', async (req, res, next) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({ error: 'MongoDB chưa kết nối. Không thể đặt lại mật khẩu lúc này.' });
      }
      const mailer = getMailer?.();
      if (!mailer) {
        return res.status(503).json({ error: 'Email chưa được cấu hình. Vui lòng liên hệ quản trị viên.' });
      }
      const email = normalizeEmailAddress(req.body?.email);
      if (!email) {
        return res.status(400).json({ error: 'Vui lòng nhập địa chỉ email hợp lệ.' });
      }

      const user = await User.findOne({ email }).select(
        '+passwordResetCodeHash +passwordResetExpiresAt +passwordResetRequestedAt +passwordResetAttempts',
      );
      if (!user || !user.isActive) {
        return res.status(404).json({ error: 'Email này chưa được đăng ký hoặc tài khoản không hoạt động.' });
      }

      const now = new Date();
      if (user.passwordResetRequestedAt &&
        now.getTime() - user.passwordResetRequestedAt.getTime() < passwordResetCooldownMs) {
        return res.json({ message: 'Nếu email thuộc tài khoản đang hoạt động, mã xác nhận sẽ được gửi.' });
      }

      const code = generatePasswordResetCode();
      user.passwordResetCodeHash = hashPasswordResetCode(code);
      user.passwordResetExpiresAt = new Date(now.getTime() + passwordResetLifetimeMs);
      user.passwordResetRequestedAt = now;
      user.passwordResetAttempts = 0;
      await user.save();

      try {
        const result = await mailer.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: 'Mã xác nhận đặt lại mật khẩu',
          text: [
            `Xin chào ${user.username},`,
            '',
            `Mã xác nhận đặt lại mật khẩu của bạn là: ${code}`,
            'Mã có hiệu lực trong 10 phút và chỉ sử dụng được một lần.',
            'Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.',
          ].join('\n'),
        });
        if (!getAcceptedRecipients(result, [user.email]).length) {
          throw Object.assign(new Error('Máy chủ email không chấp nhận địa chỉ nhận mã.'), { status: 502 });
        }
      } catch (error) {
        user.passwordResetCodeHash = '';
        user.passwordResetExpiresAt = null;
        user.passwordResetRequestedAt = null;
        user.passwordResetAttempts = 0;
        await user.save();
        throw error;
      }

      res.json({ message: 'Nếu email thuộc tài khoản đang hoạt động, mã xác nhận sẽ được gửi.' });
    } catch (error) {
      next(error);
    }
  });

  router.post('/reset-password', async (req, res, next) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({ error: 'MongoDB chưa kết nối. Không thể đặt lại mật khẩu lúc này.' });
      }
      const email = normalizeEmailAddress(req.body?.email);
      const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
      const password = validatePassword(req.body?.password);
      if (!email || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ error: 'Email hoặc mã xác nhận không hợp lệ.' });
      }

      const user = await User.findOne({ email }).select(
        '+passwordSalt +passwordHash +passwordResetCodeHash +passwordResetExpiresAt +passwordResetAttempts',
      );
      const now = new Date();
      if (!user || !user.isActive || !user.passwordResetCodeHash ||
        !user.passwordResetExpiresAt || user.passwordResetExpiresAt <= now) {
        return res.status(400).json({ error: 'Mã xác nhận không hợp lệ hoặc đã hết hạn. Hãy yêu cầu mã mới.' });
      }

      if (!passwordResetCodeMatches(code, user.passwordResetCodeHash)) {
        user.passwordResetAttempts += 1;
        if (user.passwordResetAttempts >= passwordResetMaxAttempts) {
          user.passwordResetCodeHash = '';
          user.passwordResetExpiresAt = null;
          user.passwordResetRequestedAt = null;
          user.passwordResetAttempts = 0;
          await user.save();
          return res.status(400).json({ error: 'Bạn đã nhập sai mã quá số lần cho phép. Hãy yêu cầu mã mới.' });
        }
        await user.save();
        return res.status(400).json({ error: 'Mã xác nhận không chính xác.' });
      }

      const credentials = await hashPassword(password);
      user.passwordSalt = credentials.salt;
      user.passwordHash = credentials.hash;
      user.passwordResetCodeHash = '';
      user.passwordResetExpiresAt = null;
      user.passwordResetRequestedAt = null;
      user.passwordResetAttempts = 0;
      await user.save();

      for (const [token, session] of sessions) {
        if (String(session.userId) === String(user._id)) sessions.delete(token);
      }
      res.json({ message: 'Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới.' });
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

  router.patch('/me', authenticate, async (req, res, next) => {
    try {
      const allowedFields = new Set(['username', 'email', 'currentPassword', 'password']);
      if (Object.keys(req.body ?? {}).some((key) => !allowedFields.has(key))) {
        return res.status(400).json({ error: 'Thông tin cập nhật không hợp lệ.' });
      }

      const user = await User.findById(req.user.id).select('+passwordSalt +passwordHash');
      if (!user) return res.status(401).json({ error: 'Tài khoản không còn tồn tại.' });

      if (req.body?.username !== undefined) {
        user.username = validateUsername(req.body.username);
        user.usernameLower = user.username.toLowerCase();
      }
      if (req.body?.email !== undefined) {
        user.email = normalizeEmailAddress(req.body.email);
      }

      const passwordInput = req.body?.password;
      if (passwordInput !== undefined && passwordInput !== '') {
        const password = validatePassword(passwordInput);
        const currentPassword = validatePassword(req.body?.currentPassword);
        if (!await passwordMatches(currentPassword, user.passwordSalt, user.passwordHash)) {
          return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác.' });
        }
        const credentials = await hashPassword(password);
        user.passwordSalt = credentials.salt;
        user.passwordHash = credentials.hash;
      } else if (req.body?.currentPassword !== undefined && req.body.currentPassword !== '') {
        return res.status(400).json({ error: 'Nhập mật khẩu mới để xác nhận đổi mật khẩu.' });
      }

      await user.save();
      if (passwordInput) {
        const currentToken = readSessionToken(req);
        for (const [token, session] of sessions) {
          if (String(session.userId) === String(user._id) && token !== currentToken) sessions.delete(token);
        }
      }
      res.json(publicUser(user));
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Tên tài khoản này đã được sử dụng.' });
      }
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
      const email = normalizeEmailAddress(req.body?.email);
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Vai trò phải là admin hoặc user.' });
      }

      const { salt, hash } = await hashPassword(password);
      const user = await User.create({
        username,
        usernameLower: username.toLowerCase(),
        passwordSalt: salt,
        passwordHash: hash,
        email,
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
      const username = req.body?.username === undefined ? user.username : validateUsername(req.body.username);
      const email = req.body?.email === undefined ? user.email ?? '' : normalizeEmailAddress(req.body.email);
      const passwordInput = req.body?.password;
      const password = passwordInput === undefined || passwordInput === ''
        ? null
        : validatePassword(passwordInput);
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
      user.username = username;
      user.usernameLower = username.toLowerCase();
      user.email = email;
      if (password) {
        const credentials = await hashPassword(password);
        user.passwordSalt = credentials.salt;
        user.passwordHash = credentials.hash;
      }
      await user.save();
      if (password) {
        const currentToken = readSessionToken(req);
        for (const [token, session] of sessions) {
          if (String(session.userId) === String(user._id) && token !== currentToken) sessions.delete(token);
        }
      }
      res.json(publicUser(user));
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Tên tài khoản này đã được sử dụng.' });
      }
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
    async notificationRecipients(ownerId, { includeAdmins = true, includeDefault = true } = {}) {
      const defaultEmails = includeDefault ? process.env.ALERT_EMAIL ?? '' : '';
      if (!isMongoConnected()) {
        const recipients = getAlertRecipients([], '', defaultEmails);
        if (recipients === null) throw new Error('ALERT_EMAIL có địa chỉ không hợp lệ.');
        return recipients;
      }

      const eligibleUsers = includeAdmins ? [{ role: 'admin', isActive: true }] : [];
      if (ownerId && mongoose.isValidObjectId(ownerId)) {
        eligibleUsers.push({ _id: ownerId, role: 'user', isActive: true });
      }
      const users = eligibleUsers.length
        ? await User.find({ $or: eligibleUsers }).select('email role isActive').lean()
        : [];
      const recipients = getAlertRecipients(users, ownerId, defaultEmails);
      if (recipients === null) throw new Error('Email cảnh báo trong cấu hình tài khoản hoặc ALERT_EMAIL không hợp lệ.');
      return recipients;
    },
  };
}
