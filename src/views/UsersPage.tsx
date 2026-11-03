import { useEffect, useState, type FormEvent } from 'react';
import { Check, LockKeyhole, Pencil, Plus, Trash2, UnlockKeyhole, Users, X } from 'lucide-react';
import type { Account, UserRole } from '../types/monitor';
import type { UsersPageProps } from './types';
import { tw } from './tailwind';
import { useLanguage } from '../i18n';

export default function UsersPage({
  accounts,
  monitors,
  isAdmin,
  currentAccountId,
  onAccountCreate,
  onAccountUpdate,
  onAccountDelete,
  onMonitorAssignmentsChange,
}: UsersPageProps) {
  const { t, language } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [assignmentUser, setAssignmentUser] = useState<Account | null>(null);
  const [assignedMonitorIds, setAssignedMonitorIds] = useState<string[]>([]);
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingUsername, setEditingUsername] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  useEffect(() => {
    if (assignmentUser) {
      setAssignedMonitorIds(monitors.filter((monitor) => monitor.ownerId === assignmentUser.id).map((monitor) => monitor.id));
    }
  }, [assignmentUser, monitors]);

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await onAccountCreate(username.trim(), password, role, email.trim());
      setUsername('');
      setPassword('');
      setEmail('');
      setRole('user');
      setNotice(t('Đã tạo tài khoản.'));
    } catch (reason) {
      setError(reason instanceof Error ? t(reason.message) : t('Không thể tạo tài khoản.'));
    } finally {
      setBusy(false);
    }
  }

  async function updateAccount(id: string, changes: { role?: UserRole; isActive?: boolean; email?: string }) {
    setError('');
    setNotice('');
    try {
      await onAccountUpdate(id, changes);
      setNotice(t('Đã cập nhật tài khoản.'));
    } catch (reason) {
      setError(reason instanceof Error ? t(reason.message) : t('Không thể cập nhật tài khoản.'));
    }
  }

  async function saveAccountDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAccount) return;
    setEditBusy(true);
    setError('');
    setNotice('');
    try {
      await onAccountUpdate(editingAccount.id, {
        username: editingUsername.trim(),
        email: editingEmail.trim(),
        ...(editingPassword ? { password: editingPassword } : {}),
      });
      setNotice(`${t('Đã cập nhật tài khoản')} ${editingUsername.trim()}.`);
      setEditingAccount(null);
      setEditingPassword('');
    } catch (reason) {
      setError(reason instanceof Error ? t(reason.message) : t('Không thể cập nhật tài khoản.'));
    } finally {
      setEditBusy(false);
    }
  }

  async function saveAssignments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assignmentUser) return;
    setAssignmentBusy(true);
    setError('');
    setNotice('');
    try {
      await onMonitorAssignmentsChange(assignmentUser.id, assignedMonitorIds);
      setNotice(`${t('Đã cập nhật website được gán cho')} ${assignmentUser.username}.`);
      setAssignmentUser(null);
    } catch (reason) {
      setError(reason instanceof Error ? t(reason.message) : t('Không thể cập nhật website được gán.'));
    } finally {
      setAssignmentBusy(false);
    }
  }

  function toggleMonitorAssignment(monitorId: string) {
    setAssignedMonitorIds((current) => current.includes(monitorId)
      ? current.filter((id) => id !== monitorId)
      : [...current, monitorId]);
  }

  async function deleteAccount() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setError('');
    setNotice('');
    try {
      await onAccountDelete(deleteTarget.id);
      setNotice(`${t('Đã xóa tài khoản')} ${deleteTarget.username}.`);
      setDeleteTarget(null);
    } catch (reason) {
      setError(reason instanceof Error ? t(reason.message) : t('Không thể xóa tài khoản.'));
    } finally {
      setDeleteBusy(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <section className={tw('panel table-panel full-table-panel')}>
      <div className={tw('users-heading')}>
        <div><h2>{t('Quản lý tài khoản')}</h2><p>{t('Sửa tên đăng nhập, Gmail, mật khẩu; quản lý quyền và trạng thái. Admin nhận cảnh báo mọi website, User nhận cảnh báo website được gán.')}</p></div>
      </div>
      {error && <div className={tw('users-error')} role="alert">{error}</div>}
      {notice && <div className={tw('users-notice')} role="status">{notice}</div>}

      <form className={tw('user-create-form')} onSubmit={(event) => void createAccount(event)}>
        <label>{t('Tên tài khoản')}
          <input required minLength={3} maxLength={32} autoComplete="off" value={username} onChange={(event) => setUsername(event.target.value)} placeholder={t('Tên tài khoản mới')} />
        </label>
        <label>{t('Mật khẩu tạm thời')}
          <input required minLength={6} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('Ít nhất 6 ký tự')} />
        </label>
        <label>{t('Gmail nhận cảnh báo (tùy chọn)')}
          <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@example.com" />
        </label>
        <label>{t('Vai trò ban đầu')}
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button className={tw('button button-primary user-create-submit')} type="submit" disabled={busy}><Plus size={13} /> {t('Tạo tài khoản')}</button>
      </form>

      <div className={tw('users-table-scroll')}>
        <table>
          <thead><tr><th>{t('TÀI KHOẢN')}</th><th>{t('GMAIL')}</th><th>{t('VAI TRÒ')}</th><th>{t('TRẠNG THÁI')}</th><th>{t('NGÀY TẠO')}</th><th>{t('HÀNH ĐỘNG')}</th></tr></thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td><strong>{account.username}</strong></td>
                <td>{account.email || t('Chưa cấu hình')}</td>
                <td>
                  <select
                    aria-label={`${t('Vai trò')} ${account.username}`}
                    value={account.role}
                    disabled={account.id === currentAccountId}
                    onChange={(event) => void updateAccount(account.id, { role: event.target.value as UserRole })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td><span className={tw(account.isActive ? 'user-status user-status-active' : 'user-status user-status-locked')}>{t(account.isActive ? 'Đang hoạt động' : 'Đã khóa')}</span></td>
                <td>{new Date(account.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}</td>
                <td>
                  <div className={tw('user-actions')}>
                    <button
                      className={tw('button button-secondary user-action-button')}
                      type="button"
                      onClick={() => {
                        setEditingAccount(account);
                        setEditingUsername(account.username);
                        setEditingEmail(account.email);
                        setEditingPassword('');
                      }}
                    >
                      <Pencil size={14} /> {t('Sửa tài khoản')}
                    </button>
                    {account.role === 'user' && (
                      <button
                        className={tw('button button-secondary user-action-button')}
                        type="button"
                        disabled={!account.isActive}
                        onClick={() => setAssignmentUser(account)}
                      >
                        <Users size={14} /> {t('Gán website')}
                      </button>
                    )}
                    <button
                      className={tw(account.isActive ? 'button user-action-button user-action-lock' : 'button user-action-button user-action-unlock')}
                      type="button"
                      disabled={account.id === currentAccountId}
                      onClick={() => void updateAccount(account.id, { isActive: !account.isActive })}
                    >
                      {account.isActive ? <LockKeyhole size={14} /> : <UnlockKeyhole size={14} />}
                      {t(account.isActive ? 'Khóa' : 'Mở khóa')}
                    </button>
                    <button
                      className={tw('button user-action-button user-action-delete')}
                      type="button"
                      disabled={account.id === currentAccountId}
                      onClick={() => setDeleteTarget(account)}
                    >
                      <Trash2 size={14} /> {t('Xóa')}
                    </button>
                    {account.id === currentAccountId && <span className={tw('current-account-label')}>{t('Bạn')}</span>}
                  </div>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && <tr><td colSpan={6}><div className={tw('users-empty')}><Users size={20} />{t('Chưa có tài khoản.')}</div></td></tr>}
          </tbody>
        </table>
      </div>
      {editingAccount && (
        <div className={tw('assignment-backdrop')} onMouseDown={(event) => event.target === event.currentTarget && !editBusy && setEditingAccount(null)}>
          <section className={tw('assignment-dialog')} role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
            <div className={tw('assignment-heading')}>
              <div><h2 id="edit-user-title">{t('Sửa tài khoản ·')} {editingAccount.username}</h2><p>{t(editingAccount.role === 'admin' ? 'Admin sẽ nhận cảnh báo của tất cả website.' : 'User sẽ nhận cảnh báo của các website được gán.')}</p></div>
              <button type="button" className={tw('assignment-close')} aria-label={t('Đóng')} disabled={editBusy} onClick={() => setEditingAccount(null)}><X size={18} /></button>
            </div>
            <form onSubmit={(event) => void saveAccountDetails(event)}>
              <label className={tw('user-email-edit-label')}>{t('Tên đăng nhập')}
                <input type="text" autoFocus autoComplete="username" required minLength={3} maxLength={32} pattern="[a-zA-Z0-9._-]{3,32}" value={editingUsername} onChange={(event) => setEditingUsername(event.target.value)} />
                <small>{t('3–32 ký tự: chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.')}</small>
              </label>
              <label className={tw('user-email-edit-label')}>{t('Gmail nhận cảnh báo')}
                <input type="email" autoComplete="email" value={editingEmail} onChange={(event) => setEditingEmail(event.target.value)} placeholder="user@example.com" />
                <small>{t(editingAccount.role === 'admin' ? 'Admin nhận cảnh báo của mọi website.' : 'User nhận cảnh báo của các website được gán.')}</small>
              </label>
              <label className={tw('user-email-edit-label')}>{t('Mật khẩu mới (không bắt buộc)')}
                <input type="password" autoComplete="new-password" minLength={6} maxLength={128} value={editingPassword} onChange={(event) => setEditingPassword(event.target.value)} placeholder={t('Để trống để giữ nguyên mật khẩu')} />
                <small>{t('Nếu đặt mật khẩu mới, các phiên đăng nhập khác của tài khoản sẽ bị đăng xuất.')}</small>
              </label>
              <div className={tw('assignment-actions')}>
                <button type="button" className={tw('button button-secondary')} disabled={editBusy} onClick={() => setEditingAccount(null)}>{t('Hủy')}</button>
                <button type="submit" className={tw('button button-primary')} disabled={editBusy}>
                  <Check size={14} />{t(editBusy ? 'Đang lưu…' : 'Lưu thay đổi')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {assignmentUser && (
        <div className={tw('assignment-backdrop')} onMouseDown={(event) => event.target === event.currentTarget && !assignmentBusy && setAssignmentUser(null)}>
          <section className={tw('assignment-dialog')} role="dialog" aria-modal="true" aria-labelledby="assignment-dialog-title">
            <div className={tw('assignment-heading')}>
              <div><h2 id="assignment-dialog-title">{t('Gán website cho')} {assignmentUser.username}</h2><p>{t('User chỉ xem được những website được chọn tại đây.')}</p></div>
              <button type="button" className={tw('assignment-close')} aria-label={t('Đóng')} disabled={assignmentBusy} onClick={() => setAssignmentUser(null)}><X size={18} /></button>
            </div>
            <form onSubmit={(event) => void saveAssignments(event)}>
              <div className={tw('assignment-list')}>
                {monitors.map((monitor) => (
                  <label key={monitor.id} className={tw('assignment-option')}>
                    <input
                      type="checkbox"
                      checked={assignedMonitorIds.includes(monitor.id)}
                      onChange={() => toggleMonitorAssignment(monitor.id)}
                    />
                    <span>
                      <strong>{monitor.name}</strong>
                      <small>{monitor.url}{monitor.ownerId && monitor.ownerId !== assignmentUser.id
                        ? ` · ${t('Hiện gán cho')} ${accounts.find((account) => account.id === monitor.ownerId)?.username ?? t('User khác')}`
                        : ''}</small>
                    </span>
                  </label>
                ))}
                {monitors.length === 0 && <p className={tw('assignment-empty')}>{t('Chưa có website nào để gán.')}</p>}
              </div>
              <div className={tw('assignment-actions')}>
                <button type="button" className={tw('button button-secondary')} disabled={assignmentBusy} onClick={() => setAssignmentUser(null)}>{t('Hủy')}</button>
                <button type="submit" className={tw('button button-primary')} disabled={assignmentBusy}>
                  <Check size={14} />{t(assignmentBusy ? 'Đang lưu…' : 'Lưu phân quyền')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {deleteTarget && (
        <div className={tw('assignment-backdrop')} onMouseDown={(event) => event.target === event.currentTarget && !deleteBusy && setDeleteTarget(null)}>
          <section className={tw('assignment-dialog delete-user-dialog')} role="alertdialog" aria-modal="true" aria-labelledby="delete-user-title" aria-describedby="delete-user-description">
            <div className={tw('assignment-heading')}>
              <div>
                <h2 id="delete-user-title">{t('Xóa tài khoản')} {deleteTarget.username}?</h2>
                <p id="delete-user-description">{t('Tài khoản và các phiên đăng nhập sẽ bị xóa. Website đang gán cho tài khoản này sẽ được giữ lại nhưng không còn User nào được cấp quyền xem.')}</p>
              </div>
              <button type="button" className={tw('assignment-close')} aria-label={t('Đóng')} disabled={deleteBusy} onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className={tw('assignment-actions')}>
              <button type="button" className={tw('button button-secondary')} disabled={deleteBusy} onClick={() => setDeleteTarget(null)}>{t('Hủy')}</button>
              <button type="button" className={tw('button user-action-button user-action-delete')} disabled={deleteBusy} onClick={() => void deleteAccount()}>
                <Trash2 size={14} />{t(deleteBusy ? 'Đang xóa…' : 'Xóa tài khoản')}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
