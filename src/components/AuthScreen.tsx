import { useState, type FormEvent } from 'react';
import { AlertTriangle, HeartPulse, LogIn, UserPlus } from 'lucide-react';
import { api } from '../api';

type AuthMode = 'login' | 'register';

// Màn hình đăng nhập và đăng ký tài khoản qua backend.
export default function AuthScreen({ onAuthenticated }: { onAuthenticated: (username: string) => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Chuyển giữa biểu mẫu đăng nhập và đăng ký.
  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
    setNotice('');
    setPassword('');
    setConfirmPassword('');
  }

  // Gửi thông tin đăng ký hoặc đăng nhập tới máy chủ.
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    const normalizedUsername = username.trim();

    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(normalizedUsername)) {
      setError('Tên tài khoản cần từ 3–32 ký tự, chỉ gồm chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.');
      return;
    }
    if (password.length < 6 || password.length > 128) {
      setError('Mật khẩu cần có từ 6 đến 128 ký tự.');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'register') {
        await api.register(normalizedUsername, password);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setMode('login');
        setNotice('Tạo tài khoản thành công. Hãy đăng nhập bằng tài khoản vừa tạo.');
      } else {
        const account = await api.login(normalizedUsername, password);
        onAuthenticated(account.username);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể kết nối máy chủ xác thực.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={tw('auth-page')}>
      <section className={tw('auth-card')} aria-labelledby="auth-title">
        <div className={tw('auth-brand')}>
          <span className={tw('auth-brand-mark')}><HeartPulse size={23} /></span>
          <span><strong>Uptime Watch</strong><small>Website Reliability</small></span>
        </div>
        <p className={tw('auth-eyebrow')}>KHU VỰC QUẢN TRỊ</p>
        <h1 id="auth-title">{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
        <p className={tw('auth-subtitle')}>{mode === 'login' ? 'Đăng nhập để tiếp tục theo dõi website của bạn.' : 'Tạo tài khoản để sử dụng dashboard.'}</p>

        <div className={tw('auth-tabs')} role="tablist" aria-label="Tài khoản">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={tw(mode === 'login' ? 'auth-tab auth-tab-active' : 'auth-tab')} onClick={() => changeMode('login')}>
            Đăng nhập
          </button>
          <button type="button" role="tab" aria-selected={mode === 'register'} className={tw(mode === 'register' ? 'auth-tab auth-tab-active' : 'auth-tab')} onClick={() => changeMode('register')}>
            Đăng ký
          </button>
        </div>

        {error && <div className={tw('auth-error')} role="alert"><AlertTriangle size={15} />{error}</div>}
        {notice && <div className={tw('auth-notice')} role="status">{notice}</div>}

        <form className={tw('auth-form')} onSubmit={submit} autoComplete="off">
          <label>
            Tên tài khoản
            <input autoComplete="username" required maxLength={32} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Nhập tên tài khoản" />
          </label>
          <label>
            Mật khẩu
            <input autoComplete={mode === 'login' ? 'current-password' : 'off'} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" />
          </label>
          {mode === 'register' && (
            <label>
              Xác nhận mật khẩu
              <input autoComplete="off" required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu" />
            </label>
          )}
          <button className={tw('auth-submit')} type="submit" disabled={submitting}>
            {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
            {submitting ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className={tw('auth-disclaimer')}>Tài khoản được lưu trên MongoDB; mật khẩu được băm trước khi lưu. MongoDB cần được kết nối để đăng ký và đăng nhập.</p>
      </section>
    </main>
  );
}

function tw(classNames: string) {
  return classNames
    .split(/\s+/)
    .filter(Boolean)
    .map((className) => tailwindClasses[className] ?? className)
    .join(' ');
}

const tailwindClasses: Record<string, string> = {
  'auth-page': 'grid min-h-screen place-items-center bg-[#101827] px-4 py-8',
  'auth-card': 'w-full max-w-[420px] rounded-xl border border-[#2d3a4d] bg-[#1c293a] p-8 shadow-[0_24px_80px_#060b1480] max-[480px]:p-5',
  'auth-brand': 'mb-8 flex items-center gap-3 text-[#e6edf8] [&_strong]:block [&_strong]:text-[16px] [&_small]:text-[11px] [&_small]:text-[#a4b1c4]',
  'auth-brand-mark': 'grid size-10 place-items-center rounded-[11px] bg-[#0d9c8d] text-white',
  'auth-eyebrow': 'mb-2 font-mono text-[10px] tracking-[.08em] text-[#8fa1b7]',
  'auth-subtitle': 'mb-5 text-[12px] leading-[1.6] text-[#9caabe]',
  'auth-tabs': 'mb-5 grid grid-cols-2 rounded-lg border border-[#344257] bg-[#182435] p-1',
  'auth-tab': 'min-h-9 rounded-md border-0 bg-transparent text-[12px] text-[#9caabe]',
  'auth-tab-active': 'bg-[#2a394d] font-semibold text-[#e6edf8]',
  'auth-form': 'grid gap-4 [&_label]:grid [&_label]:gap-2 [&_label]:text-[11px] [&_label]:font-semibold [&_label]:text-[#c9d3e0] [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-[#3a4b60] [&_input]:bg-[#121e2e] [&_input]:px-3 [&_input]:text-[12px] [&_input]:text-[#e7edf6] [&_input]:outline-none [&_input]:placeholder:text-[#78899e] [&_input:focus]:border-[#46a9df]',
  'auth-submit': 'mt-1 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border-0 bg-[#0f9f93] text-[12px] font-semibold text-white transition-colors hover:bg-[#11afa1]',
  'auth-error': 'mb-4 flex items-start gap-2 rounded-md border border-[#744047] bg-[#341f2a] px-3 py-2.5 text-[11px] leading-[1.5] text-[#ffc7ca]',
  'auth-notice': 'mb-4 rounded-md border border-[#286449] bg-[#1b342d] px-3 py-2.5 text-[11px] text-[#b4f1d0]',
  'auth-disclaimer': 'mb-0 mt-4 text-[10px] leading-[1.6] text-[#8292a7]',
};
