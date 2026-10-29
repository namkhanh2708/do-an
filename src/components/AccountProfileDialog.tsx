import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, UserRound, X } from 'lucide-react';
import type { Account } from '../types/monitor';

interface AccountProfileDialogProps {
  account: Account;
  onClose: () => void;
  onSave: (changes: { username: string; email: string; currentPassword?: string; password?: string }) => Promise<Account>;
}

export default function AccountProfileDialog({ account, onClose, onSave }: AccountProfileDialogProps) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(account.username);
  const [email, setEmail] = useState(account.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        username,
        email,
        ...(password ? { currentPassword, password } : {}),
      });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể cập nhật thông tin tài khoản.');
    } finally {
      setSaving(false);
    }
  }

  const createdAt = new Date(account.createdAt);

  return (
    <div className={tw('profile-backdrop')} onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section className={tw('profile-dialog')} role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div className={tw('profile-heading')}>
          <div className={tw('profile-heading-icon')}><UserRound size={18} /></div>
          <div className="min-w-0 flex-1">
            <h2 id="profile-title">Thông tin tài khoản</h2>
            <p>Xem và cập nhật thông tin cá nhân của bạn.</p>
          </div>
          <button type="button" className={tw('profile-close')} aria-label="Đóng" disabled={saving} onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        {editing ? (
          <form className={tw('profile-form')} onSubmit={(event) => void submit(event)}>
            <label>
              Tên tài khoản
              <input
                autoComplete="username"
                required
                minLength={3}
                maxLength={32}
                pattern="[a-zA-Z0-9._-]{3,32}"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
              <small>Từ 3–32 ký tự; chỉ gồm chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.</small>
            </label>
            <label>
              Gmail
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </label>
            <div className={tw('password-section')}>
              <div className={tw('password-section-title')}><KeyRound size={14} /> Đổi mật khẩu <span>(không bắt buộc)</span></div>
              <label>
                Mật khẩu hiện tại
                <input
                  type="password"
                  autoComplete="current-password"
                  minLength={password ? 6 : undefined}
                  maxLength={128}
                  required={Boolean(password)}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Cần nhập nếu đổi mật khẩu"
                />
              </label>
              <label>
                Mật khẩu mới
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Để trống nếu không đổi"
                />
              </label>
              <small>Mật khẩu mới cần từ 6 đến 128 ký tự.</small>
            </div>
            {error && <p className={tw('profile-error')} role="alert">{error}</p>}
            <div className={tw('profile-actions')}>
              <button type="button" className={tw('profile-button profile-button-secondary')} disabled={saving} onClick={() => { setEditing(false); setError(''); setCurrentPassword(''); setPassword(''); }}>
                Hủy
              </button>
              <button type="submit" className={tw('profile-button profile-button-primary')} disabled={saving}>
                {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <dl className={tw('profile-details')}>
              <div><dt>Tên tài khoản</dt><dd>{account.username}</dd></div>
              <div><dt>Gmail</dt><dd>{account.email || 'Chưa cập nhật'}</dd></div>
              <div><dt>Vai trò</dt><dd>{account.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</dd></div>
              <div><dt>Trạng thái</dt><dd><span className={tw(`profile-status ${account.isActive ? 'profile-status-active' : 'profile-status-disabled'}`)}>{account.isActive ? 'Đang hoạt động' : 'Đã khóa'}</span></dd></div>
              <div><dt>Ngày tạo</dt><dd>{Number.isNaN(createdAt.getTime()) ? 'Không xác định' : createdAt.toLocaleString('vi-VN')}</dd></div>
            </dl>
            {error && <p className={tw('profile-error')} role="alert">{error}</p>}
            <div className={tw('profile-actions')}>
              <button type="button" className={tw('profile-button profile-button-secondary')} onClick={onClose}>Đóng</button>
              <button type="button" className={tw('profile-button profile-button-primary')} onClick={() => { setUsername(account.username); setEmail(account.email); setEditing(true); }}>
                Chỉnh sửa thông tin
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function tw(classNames: string) {
  return classNames
    .split(/\s+/)
    .filter(Boolean)
    .map((className) => profileClasses[className] ?? className)
    .join(' ');
}

const profileClasses: Record<string, string> = {
  'profile-backdrop': 'fixed inset-0 z-50 grid place-items-center bg-[#080d16b8] p-4 backdrop-blur-[4px]',
  'profile-dialog': 'w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl border border-[#344257] bg-[#1c293a] text-[#e6edf8] shadow-[0_24px_80px_#060b1480]',
  'profile-heading': 'flex items-center gap-3 border-b border-[#344257] px-5 py-4',
  'profile-heading-icon': 'grid size-9 shrink-0 place-items-center rounded-lg bg-[#203c3c] text-[#5fdda6]',
  'profile-close': 'grid size-8 shrink-0 place-items-center rounded-md border border-[#344257] bg-[#202d3f] text-[#a8b6c9] hover:text-white disabled:opacity-50',
  'profile-form': 'grid gap-4 p-5 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[11px] [&_label]:font-semibold [&_label]:text-[#c9d3e0] [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-[#3a4b60] [&_input]:bg-[#121e2e] [&_input]:px-3 [&_input]:text-[12px] [&_input]:text-[#e7edf6] [&_input]:outline-none [&_input:focus]:border-[#46a9df] [&_input]:placeholder:text-[#78899e] [&_small]:text-[10px] [&_small]:font-normal [&_small]:text-[#97a6bb]',
  'password-section': 'grid gap-3 rounded-lg border border-[#344257] bg-[#172333] p-3',
  'password-section-title': 'flex items-center gap-1.5 text-[11px] font-semibold text-[#dce5f0] [&_svg]:text-[#8ea5c0] [&_span]:font-normal [&_span]:text-[#91a1b5]',
  'profile-details': 'm-0 grid gap-0 px-5 py-2 [&>div]:grid [&>div]:grid-cols-[130px_1fr] [&>div]:gap-3 [&>div]:border-b [&>div]:border-[#2b394c] [&>div]:py-3 last:[&>div]:border-0 [&_dt]:text-[11px] [&_dt]:text-[#91a1b5] [&_dd]:m-0 [&_dd]:break-words [&_dd]:text-[12px] [&_dd]:text-[#e6edf8] max-[420px]:[&>div]:grid-cols-[100px_1fr]',
  'profile-status': 'inline-flex w-fit rounded-full px-2 py-1 text-[10px] font-medium',
  'profile-status-active': 'bg-[#203c35] text-[#5fdda6]',
  'profile-status-disabled': 'bg-[#412a33] text-[#ff9299]',
  'profile-error': 'mx-5 rounded-md border border-[#744047] bg-[#341f2a] px-3 py-2 text-[11px] text-[#ffc7ca]',
  'profile-actions': 'flex justify-end gap-2 border-t border-[#344257] bg-[#172333] px-5 py-4',
  'profile-button': 'inline-flex min-h-8 items-center justify-center rounded-md px-3 py-1.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-55',
  'profile-button-primary': 'border border-transparent bg-[#0f9f93] text-white hover:brightness-110',
  'profile-button-secondary': 'border border-[#35445a] bg-[#202d3f] text-[#dae3ef] hover:bg-[#29394d]',
};
