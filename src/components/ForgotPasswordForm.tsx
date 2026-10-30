import { useState, type FormEvent } from 'react';
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { api } from '../api';

type ResetStep = 'email' | 'code' | 'complete';

export default function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.requestPasswordReset(email.trim());
      setStep('code');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể gửi mã xác nhận.');
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setSubmitting(true);
    try {
      await api.resetPassword(email.trim(), code.trim(), password);
      setStep('complete');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể đặt lại mật khẩu.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={tw('reset-form')} aria-live="polite">
      {step === 'complete' ? (
        <div className={tw('reset-complete')}>
          <ShieldCheck size={26} />
          <strong>Đặt lại mật khẩu thành công</strong>
          <p>Hãy đăng nhập bằng mật khẩu mới.</p>
          <button type="button" className={tw('auth-submit')} onClick={onBack}>
            <ArrowLeft size={15} /> Quay lại đăng nhập
          </button>
        </div>
      ) : (
        <>
          {error && <div className={tw('auth-error')} role="alert">{error}</div>}
          {step === 'email' ? (
            <form className={tw('auth-form')} onSubmit={requestCode}>
              <p className={tw('reset-help')}>Nhập email đã đăng ký. Nếu email thuộc tài khoản đang hoạt động, mã xác nhận 6 số sẽ được gửi đến bạn.</p>
              <label>
                Email
                <input autoComplete="email" required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              </label>
              <button className={tw('auth-submit')} type="submit" disabled={submitting}>
                <Mail size={15} /> {submitting ? 'Đang gửi mã…' : 'Gửi mã xác nhận'}
              </button>
            </form>
          ) : (
            <form className={tw('auth-form')} onSubmit={resetPassword}>
              <p className={tw('reset-help')}>Nhập mã 6 số vừa gửi đến email (mã có hiệu lực trong 10 phút).</p>
              <label>
                Mã xác nhận
                <input required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" />
              </label>
              <label>
                Mật khẩu mới
                <input required type="password" autoComplete="new-password" minLength={6} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ít nhất 6 ký tự" />
              </label>
              <label>
                Xác nhận mật khẩu mới
                <input required type="password" autoComplete="new-password" minLength={6} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu mới" />
              </label>
              <button className={tw('auth-submit')} type="submit" disabled={submitting}>
                <KeyRound size={15} /> {submitting ? 'Đang cập nhật…' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}
          <button type="button" className={tw('reset-back')} onClick={onBack}>
            <ArrowLeft size={14} /> Quay lại đăng nhập
          </button>
        </>
      )}
    </section>
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
  'reset-form': 'grid gap-4',
  'reset-help': 'mb-0 text-[11px] leading-[1.6] text-[#9caabe]',
  'reset-back': 'inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md border-0 bg-transparent text-[10px] text-[#9caabe] hover:text-[#e6edf8]',
  'reset-complete': 'grid justify-items-center gap-3 py-4 text-center text-[12px] text-[#b4f1d0] [&_svg]:text-[#45cf91] [&_p]:mb-1 [&_p]:text-[11px] [&_p]:text-[#9caabe]',
  'auth-form': 'grid gap-4 [&_label]:grid [&_label]:gap-2 [&_label]:text-[11px] [&_label]:font-semibold [&_label]:text-[#c9d3e0] [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-[#3a4b60] [&_input]:bg-[#121e2e] [&_input]:px-3 [&_input]:text-[12px] [&_input]:text-[#e7edf6] [&_input]:outline-none [&_input]:placeholder:text-[#78899e] [&_input:focus]:border-[#46a9df]',
  'auth-submit': 'mt-1 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border-0 bg-[#0f9f93] px-3 py-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#11afa1] disabled:cursor-not-allowed disabled:opacity-55',
  'auth-error': 'mb-4 rounded-md border border-[#744047] bg-[#341f2a] px-3 py-2.5 text-[11px] leading-[1.5] text-[#ffc7ca]',
};
