import { useEffect, useState, type FormEvent } from 'react';
import { Check, LockKeyhole, Plus, Trash2, UnlockKeyhole, Users, X } from 'lucide-react';
import type { Account, UserRole } from '../types/monitor';
import type { UsersPageProps } from './types';
import { tw } from './tailwind';

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [assignmentUser, setAssignmentUser] = useState<Account | null>(null);
  const [assignedMonitorIds, setAssignedMonitorIds] = useState<string[]>([]);
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

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
      await onAccountCreate(username.trim(), password, role);
      setUsername('');
      setPassword('');
      setRole('user');
      setNotice('Đã tạo tài khoản.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tạo tài khoản.');
    } finally {
      setBusy(false);
    }
  }

  async function updateAccount(id: string, changes: { role?: UserRole; isActive?: boolean }) {
    setError('');
    setNotice('');
    try {
      await onAccountUpdate(id, changes);
      setNotice('Đã cập nhật tài khoản.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật tài khoản.');
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
      setNotice(`Đã cập nhật website được gán cho ${assignmentUser.username}.`);
      setAssignmentUser(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật website được gán.');
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
      setNotice(`Đã xóa tài khoản ${deleteTarget.username}.`);
      setDeleteTarget(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể xóa tài khoản.');
    } finally {
      setDeleteBusy(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <section className={tw('panel table-panel full-table-panel')}>
      <div className={tw('users-heading')}>
        <div><h2>Quản lý tài khoản</h2><p>Xem tài khoản, thay đổi vai trò và khóa hoặc mở khóa người dùng.</p></div>
      </div>
      {error && <div className={tw('users-error')} role="alert">{error}</div>}
      {notice && <div className={tw('users-notice')} role="status">{notice}</div>}

      <form className={tw('user-create-form')} onSubmit={(event) => void createAccount(event)}>
        <label>Tên tài khoản
          <input required minLength={3} maxLength={32} autoComplete="off" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Tên tài khoản mới" />
        </label>
        <label>Mật khẩu tạm thời
          <input required minLength={6} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ít nhất 6 ký tự" />
        </label>
        <label>Vai trò ban đầu
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button className={tw('button button-primary user-create-submit')} type="submit" disabled={busy}><Plus size={13} /> Tạo tài khoản</button>
      </form>

      <div className={tw('users-table-scroll')}>
        <table>
          <thead><tr><th>TÀI KHOẢN</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>NGÀY TẠO</th><th>HÀNH ĐỘNG</th></tr></thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td><strong>{account.username}</strong></td>
                <td>
                  <select
                    aria-label={`Vai trò của ${account.username}`}
                    value={account.role}
                    disabled={account.id === currentAccountId}
                    onChange={(event) => void updateAccount(account.id, { role: event.target.value as UserRole })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td><span className={tw(account.isActive ? 'user-status user-status-active' : 'user-status user-status-locked')}>{account.isActive ? 'Đang hoạt động' : 'Đã khóa'}</span></td>
                <td>{new Date(account.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div className={tw('user-actions')}>
                    {account.role === 'user' && (
                      <button
                        className={tw('button button-secondary user-action-button')}
                        type="button"
                        disabled={!account.isActive}
                        onClick={() => setAssignmentUser(account)}
                      >
                        <Users size={14} /> Gán website
                      </button>
                    )}
                    <button
                      className={tw(account.isActive ? 'button user-action-button user-action-lock' : 'button user-action-button user-action-unlock')}
                      type="button"
                      disabled={account.id === currentAccountId}
                      onClick={() => void updateAccount(account.id, { isActive: !account.isActive })}
                    >
                      {account.isActive ? <LockKeyhole size={14} /> : <UnlockKeyhole size={14} />}
                      {account.isActive ? ' Khóa' : ' Mở khóa'}
                    </button>
                    <button
                      className={tw('button user-action-button user-action-delete')}
                      type="button"
                      disabled={account.id === currentAccountId}
                      onClick={() => setDeleteTarget(account)}
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                    {account.id === currentAccountId && <span className={tw('current-account-label')}>Bạn</span>}
                  </div>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && <tr><td colSpan={5}><div className={tw('users-empty')}><Users size={20} />Chưa có tài khoản.</div></td></tr>}
          </tbody>
        </table>
      </div>
      {assignmentUser && (
        <div className={tw('assignment-backdrop')} onMouseDown={(event) => event.target === event.currentTarget && !assignmentBusy && setAssignmentUser(null)}>
          <section className={tw('assignment-dialog')} role="dialog" aria-modal="true" aria-labelledby="assignment-dialog-title">
            <div className={tw('assignment-heading')}>
              <div><h2 id="assignment-dialog-title">Gán website cho {assignmentUser.username}</h2><p>User chỉ xem được những website được chọn tại đây.</p></div>
              <button type="button" className={tw('assignment-close')} aria-label="Đóng" disabled={assignmentBusy} onClick={() => setAssignmentUser(null)}><X size={18} /></button>
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
                        ? ` · Hiện gán cho ${accounts.find((account) => account.id === monitor.ownerId)?.username ?? 'User khác'}`
                        : ''}</small>
                    </span>
                  </label>
                ))}
                {monitors.length === 0 && <p className={tw('assignment-empty')}>Chưa có website nào để gán.</p>}
              </div>
              <div className={tw('assignment-actions')}>
                <button type="button" className={tw('button button-secondary')} disabled={assignmentBusy} onClick={() => setAssignmentUser(null)}>Hủy</button>
                <button type="submit" className={tw('button button-primary')} disabled={assignmentBusy}>
                  <Check size={14} />{assignmentBusy ? 'Đang lưu…' : 'Lưu phân quyền'}
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
                <h2 id="delete-user-title">Xóa tài khoản {deleteTarget.username}?</h2>
                <p id="delete-user-description">Tài khoản và các phiên đăng nhập sẽ bị xóa. Website đang gán cho tài khoản này sẽ được giữ lại nhưng không còn User nào được cấp quyền xem.</p>
              </div>
              <button type="button" className={tw('assignment-close')} aria-label="Đóng" disabled={deleteBusy} onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            <div className={tw('assignment-actions')}>
              <button type="button" className={tw('button button-secondary')} disabled={deleteBusy} onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button type="button" className={tw('button user-action-button user-action-delete')} disabled={deleteBusy} onClick={() => void deleteAccount()}>
                <Trash2 size={14} />{deleteBusy ? 'Đang xóa…' : 'Xóa tài khoản'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
