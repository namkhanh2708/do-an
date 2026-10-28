import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import express from 'express';
import mongoose from 'mongoose';

const scrypt = promisify(scryptCallback);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 32 },
  usernameLower: { type: String, required: true, unique: true, index: true },
  passwordSalt: { type: String, required: true, select: false },
  passwordHash: { type: String, required: true, select: false },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Băm mật khẩu bằng scrypt với salt ngẫu nhiên riêng cho từng tài khoản.
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

// Tạo tài khoản và xác thực đăng nhập bằng dữ liệu trong MongoDB.
export function createAuthRouter({ isMongoConnected }) {
  const router = express.Router();

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

      const { hash } = await hashPassword(password, user.passwordSalt);
      const expected = Buffer.from(user.passwordHash, 'hex');
      const actual = Buffer.from(hash, 'hex');
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        return res.status(401).json({ error: 'Tên tài khoản hoặc mật khẩu không chính xác.' });
      }

      res.json({ username: user.username });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
