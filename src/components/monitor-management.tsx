import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, Check, ExternalLink, Globe2, History, LoaderCircle, Pause, Pencil, Play, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { api } from '../api';
import type { Account, HealthCheck, Monitor, MonitorInput, MonitorStatus, Report } from '../types/monitor';
import type { TimeRange } from '../types/app';
import { formatDate, formatMs, formatPercent, statusLabel } from '../utils/format';
import { rangeLabels } from '../utils/report';
import { StatusBadge } from './charts';
import { DiagnosisPanel } from './dashboard-widgets';

// Tạo mới hoặc chỉnh sửa cấu hình giám sát website.
export function MonitorDialog({
  monitor,
  users,
  saving,
  error,
  onClose,
  onSave,
}: {
  monitor: Monitor | null;
  users: Account[];
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (input: MonitorInput) => void;
}) {
  const [name, setName] = useState(monitor?.name ?? '');
  const [url, setUrl] = useState(monitor?.url ?? '');
  const [intervalSeconds, setIntervalSeconds] = useState(monitor?.intervalSeconds ?? 60);
  const [slowThresholdMs, setSlowThresholdMs] = useState(monitor?.slowThresholdMs ?? 1000);
  const [ownerId, setOwnerId] = useState(monitor?.ownerId ?? '');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ name: name.trim(), url: url.trim(), enabled: monitor?.enabled ?? true, intervalSeconds, slowThresholdMs, ownerId });
  }

  return (
    <div className={tw("modal-backdrop")} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={tw("dialog")} role="dialog" aria-modal="true" aria-labelledby="monitor-dialog-title">
        <div className={tw("dialog-heading")}>
          <div>
            <p className={tw("eyebrow")}>CẤU HÌNH GIÁM SÁT</p>
            <h2 id="monitor-dialog-title">{monitor ? 'Chỉnh sửa website' : 'Thêm website mới'}</h2>
          </div>
          <button className={tw("icon-button")} type="button" aria-label="Đóng" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div className={tw("inline-error dialog-error")}><AlertTriangle size={15} />{error}</div>}
        <form onSubmit={submit} className={tw("monitor-form")}>
          <label>
            Tên website
            <input autoFocus required maxLength={80} placeholder="Ví dụ: Trang chủ công ty" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            URL cần theo dõi
            <input required type="url" placeholder="https://example.com" value={url} onChange={(event) => setUrl(event.target.value)} />
            <small>Hỗ trợ HTTP/HTTPS công khai, localhost hoặc IP IPv4 riêng (mạng LAN). Địa chỉ local được truy cập từ máy chạy backend.</small>
          </label>
          <div className={tw("form-grid")}>
            <label>
              Tần suất kiểm tra
              <select value={intervalSeconds} onChange={(event) => setIntervalSeconds(Number(event.target.value))}>
                <option value={60}>Mỗi 1 phút</option>
                <option value={300}>Mỗi 5 phút</option>
                <option value={900}>Mỗi 15 phút</option>
              </select>
            </label>
            <label>
              Ngưỡng phản hồi chậm
              <span className={tw("input-with-unit")}>
                <input type="number" min={100} max={30000} step={100} value={slowThresholdMs} onChange={(event) => setSlowThresholdMs(Number(event.target.value))} required />
                <span>ms</span>
              </span>
            </label>
          </div>
          <label>
            Cho phép User theo dõi
            <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
              <option value="">Chỉ Admin xem được</option>
              {users.filter((user) => user.role === 'user' && user.isActive).map((user) => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
            <small>User được gán mới xem được website, lịch sử và báo cáo liên quan.</small>
          </label>
          <div className={tw("dialog-actions")}>
            <button type="button" className={tw("button button-quiet")} onClick={onClose}>Hủy</button>
            <button type="submit" className={tw("button button-primary px-3 py-1 text-[10px] whitespace-nowrap")} disabled={saving}>
              {saving ? <LoaderCircle size={14} className={tw("spin")} /> : <Check size={14} />}
              {monitor ? 'Lưu thay đổi' : 'Thêm website'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// Hiển thị lịch sử kiểm tra và chẩn đoán của website.
export function HistoryDialog({
  monitor,
  range,
  onClose,
}: {
  monitor: Monitor;
  range: TimeRange;
  onClose: () => void;
}) {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.checks(monitor.id, range)
      .then((result) => { if (active) setChecks(result); })
      .catch((reason: Error) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [monitor.id, range]);

  return (
    <div className={tw("modal-backdrop")} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={tw("dialog history-dialog")} role="dialog" aria-modal="true" aria-labelledby="history-dialog-title">
        <div className={tw("dialog-heading")}>
          <div>
            <p className={tw("eyebrow")}>LỊCH SỬ KIỂM TRA · {rangeLabels[range]}</p>
            <h2 id="history-dialog-title">{monitor.name}</h2>
            <a className={tw("monitor-url")} href={monitor.url} target="_blank" rel="noreferrer">{monitor.url}<ExternalLink size={12} /></a>
          </div>
          <button className={tw("icon-button")} type="button" aria-label="Đóng" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div className={tw("inline-error")}>{error}</div>}
        {loading ? <div className={tw("loading-row")}><LoaderCircle className={tw("spin")} size={18} /> Đang tải lịch sử…</div> :
          checks.length === 0 ? <div className={tw("empty-state compact-empty")}><History size={24} /><p>Chưa có lần kiểm tra nào trong khoảng thời gian này.</p></div> : (
            <div className={tw("table-scroll history-table")}>
              <table>
                <thead><tr><th>Thời điểm</th><th>Trạng thái</th><th>HTTP</th><th>Phản hồi</th><th>Chi tiết</th></tr></thead>
                <tbody>
                  {checks.map((check) => (
                    <tr key={check.id}>
                      <td>{formatDate(check.checkedAt)}</td>
                      <td><StatusBadge status={check.status} /></td>
                      <td>{check.httpStatus ?? '—'}</td>
                      <td>{formatMs(check.responseTimeMs)}</td>
                      <td className={tw(check.diagnosis ? 'check-error-diagnosis' : 'check-error')}>
                        {check.error || '—'}
                        {check.diagnosis && <DiagnosisPanel diagnosis={check.diagnosis} compact />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </div>
  );
}

// Xác nhận trước khi xóa website và dữ liệu liên quan.
export function DeleteMonitorDialog({
  monitor,
  deleting,
  error,
  onClose,
  onConfirm,
}: {
  monitor: Monitor;
  deleting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className={tw("modal-backdrop")} onMouseDown={(event) => event.target === event.currentTarget && !deleting && onClose()}>
      <section className={tw("dialog delete-dialog")} role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description">
        <div className={tw("delete-warning-icon")}><AlertTriangle size={21} /></div>
        <h2 id="delete-dialog-title">Bạn có chắc chắn không?</h2>
        <p id="delete-dialog-description">
          Bạn sắp xóa <strong>{monitor.name}</strong>. Website và toàn bộ lịch sử theo dõi (các lần kiểm tra và sự cố liên quan) sẽ bị xóa vĩnh viễn.
        </p>
        {error && <div className={tw("inline-error dialog-error")}><AlertTriangle size={15} />{error}</div>}
        <div className={tw("dialog-actions delete-dialog-actions")}>
          <button type="button" className={tw("button button-quiet delete-cancel-button")} disabled={deleting} onClick={onClose}>Hủy</button>
          <button type="button" className={tw("button button-delete inline-flex min-h-8 items-center justify-center gap-1.5 rounded-[7px] border border-transparent px-3 py-1 text-[10px] font-semibold whitespace-nowrap transition-[filter,background]")} disabled={deleting} onClick={onConfirm}>
            {deleting ? <LoaderCircle size={14} className={tw("spin")} /> : <Trash2 size={14} />}
            {deleting ? 'Đang xóa…' : 'Xóa website và lịch sử'}
          </button>
        </div>
      </section>
    </div>
  );
}

// Bảng website với tìm kiếm và các thao tác quản lý.
export function MonitorTable({
  monitors,
  reportRows,
  search,
  onSearch,
  onEdit,
  onDelete,
  onToggle,
  onCheck,
  onHistory,
  checkingId,
  compact = false,
  readOnly = false,
}: {
  monitors: Monitor[];
  reportRows: Report['monitors'];
  search?: string;
  onSearch?: (value: string) => void;
  onEdit: (monitor: Monitor) => void;
  onDelete: (monitor: Monitor) => void;
  onToggle: (monitor: Monitor) => void;
  onCheck: (monitor: Monitor) => void;
  onHistory: (monitor: Monitor) => void;
  checkingId: string | null;
  compact?: boolean;
  readOnly?: boolean;
}) {
  const filtered = monitors.filter((monitor) => {
    const query = search?.trim().toLowerCase();
    return !query || monitor.name.toLowerCase().includes(query) || monitor.url.toLowerCase().includes(query);
  });
  const rows = new Map(reportRows.map((row) => [row.id, row]));

  return (
    <>
      {onSearch && (
        <div className={tw("table-toolbar")}>
          <div className={tw("search-field")}><Search size={16} /><input aria-label="Tìm website" placeholder="Tìm theo tên hoặc URL…" value={search} onChange={(event) => onSearch(event.target.value)} /></div>
          <span>{filtered.length} website</span>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className={tw("empty-state table-empty")}>
          <Globe2 size={28} />
          <h3>{monitors.length ? 'Không tìm thấy website' : 'Chưa có website nào được theo dõi'}</h3>
          <p>{monitors.length ? 'Thử từ khóa khác.' : 'Thêm URL công khai đầu tiên để bắt đầu theo dõi uptime và thời gian phản hồi.'}</p>
        </div>
      ) : (
        <div className={tw("table-scroll")}>
          <table>
            <thead><tr>
              <th>WEBSITE</th><th>TRẠNG THÁI</th><th>UPTIME</th><th>PHẢN HỒI</th>
              {!compact && <th>LẦN KIỂM TRA CUỐI</th>}
              {!readOnly && <th>HÀNH ĐỘNG</th>}
            </tr></thead>
            <tbody>
              {filtered.map((monitor) => {
                const stats = rows.get(monitor.id);
                return (
                  <tr key={monitor.id}>
                    <td>
                      <div className={tw("monitor-name-cell")}>
                        <span className={tw(`monitor-favicon favicon-${monitor.status.toLowerCase()}`)}><Globe2 size={15} /></span>
                        <span><strong>{monitor.name}</strong><a className={tw("monitor-url")} href={monitor.url} target="_blank" rel="noreferrer">{monitor.url}<ExternalLink size={11} /></a></span>
                      </div>
                    </td>
                    <td><div className={tw("status-cell")}><StatusBadge status={monitor.enabled ? monitor.status : 'UNKNOWN'} />{!monitor.enabled && <span className={tw("paused-label")}>Đã tắt</span>}</div></td>
                    <td className={tw("number-cell")}>{formatPercent(stats?.uptimePercent ?? null)}</td>
                    <td className={tw("number-cell")}>{formatMs(monitor.lastResponseTimeMs ?? stats?.averageResponseTimeMs)}</td>
                    {!compact && <td className={tw("date-cell")}>{formatDate(monitor.lastCheckedAt)}</td>}
                    {!readOnly && <td>
                      <div className={tw("row-actions")}>
                        <button className={tw("icon-button small")} title="Kiểm tra ngay" aria-label={`Kiểm tra ${monitor.name}`} disabled={checkingId === monitor.id || !monitor.enabled} onClick={() => onCheck(monitor)}>
                          {checkingId === monitor.id ? <LoaderCircle size={15} className={tw("spin")} /> : <RefreshCw size={15} />}
                        </button>
                        <button className={tw("icon-button small")} title="Lịch sử" aria-label={`Xem lịch sử ${monitor.name}`} onClick={() => onHistory(monitor)}><History size={15} /></button>
                        <button className={tw("icon-button small")} title="Chỉnh sửa" aria-label={`Chỉnh sửa ${monitor.name}`} onClick={() => onEdit(monitor)}><Pencil size={15} /></button>
                        <button className={tw("icon-button small")} title={monitor.enabled ? 'Tạm dừng' : 'Bật giám sát'} aria-label={monitor.enabled ? `Tạm dừng ${monitor.name}` : `Bật ${monitor.name}`} onClick={() => onToggle(monitor)}>{monitor.enabled ? <Pause size={15} /> : <Play size={15} />}</button>
                        <button className={tw("icon-button small icon-danger")} title="Xóa website" aria-label={`Xóa ${monitor.name}`} onClick={() => onDelete(monitor)}><Trash2 size={15} /></button>
                      </div>
                    </td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
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
  'button-primary': 'bg-[#0f9f93] text-white',
  'button-delete': 'bg-[#b6404c] text-white hover:bg-[#cf4d59]',
  'button-quiet': 'border-[#344156] bg-transparent text-[#c0cad8]',
  'icon-button': 'inline-grid size-[34px] shrink-0 place-items-center rounded-[7px] border border-transparent bg-transparent text-[#a8b6c9] transition-colors hover:bg-[#2a394d] hover:text-white disabled:cursor-not-allowed disabled:opacity-55',
  'icon-danger': 'hover:bg-[#482d39] hover:text-[#ff9198]',
  'inline-error': 'mb-4 flex items-center gap-2.5 rounded-[7px] border border-[#744047] bg-[#341f2a] px-[13px] py-[11px] text-[12px] text-[#ffc7ca] [&_button]:ml-auto [&_button]:grid [&_button]:size-6 [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-inherit',
  'dialog-error': 'mb-[15px] mt-[-5px]',
  'table-scroll': 'w-full overflow-x-auto max-[640px]:[&_th]:px-[11px] max-[640px]:[&_th]:py-[10px] max-[640px]:[&_th]:text-[8px] max-[640px]:[&_td]:px-[11px] max-[640px]:[&_td]:py-[10px] max-[640px]:[&_td]:text-[10px] [&_td_strong]:block [&_td_strong]:text-[11px] [&_td_strong]:font-semibold [&_td_strong]:text-[#e5ebf4]',
  'monitor-name-cell': 'flex min-w-[185px] items-center gap-[10px]',
  'monitor-favicon': 'grid size-[31px] shrink-0 place-items-center rounded-lg border border-[#405167] bg-[#25374a] text-[#9cb5ca]',
  'favicon-up': 'border-[#33745b] bg-[#203c35] text-[#45cf91]',
  'favicon-down': 'border-[#76464e] bg-[#412b34] text-[#fb6e75]',
  'favicon-slow': 'border-[#77633f] bg-[#40372b] text-[#f3c24f]',
  'favicon-unknown': '',
  'monitor-url': 'mt-1 inline-flex max-w-[260px] items-center gap-[5px] overflow-hidden text-[10px] text-ellipsis text-[#91a1b5] no-underline hover:text-[#71b9f5] [&_svg]:shrink-0',
  'status-badge': 'inline-flex items-center gap-[5px] rounded-[5px] border px-[7px] py-[5px] text-[10px]',
  'status-up': 'border-[#2c634f] bg-[#1f3a34] text-[#5fdda6]',
  'status-down': 'border-[#74424a] bg-[#412a33] text-[#ff9299]',
  'status-slow': 'border-[#73603c] bg-[#3e3728] text-[#f2cd68]',
  'status-unknown': 'border-[#425166] bg-[#2a3747] text-[#aebacc]',
  'status-cell': 'flex items-center gap-[7px]',
  'paused-label': 'text-[10px] text-[#8292a7]',
  'number-cell': 'font-mono text-[10px]',
  'date-cell': 'text-[10px] text-[#a0aec0]',
  'row-actions': 'flex gap-px',
  'table-toolbar': 'flex items-center justify-between border-b border-[#304055] px-[17px] py-3 text-[10px] text-[#9baabd] max-[640px]:px-3 max-[640px]:py-[10px]',
  'search-field': 'flex min-w-[min(320px,70vw)] items-center gap-2 rounded-md border border-[#34445a] bg-[#182536] px-[10px] py-2 text-[#91a2b5] [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-[11px] [&_input]:text-[#e6edf8] [&_input]:outline-none [&_input::placeholder]:text-[#8191a5]',
  'empty-state': 'flex min-h-[210px] flex-col items-center justify-center p-6 text-center text-[#8394a9] [&>svg]:text-[#63768d] [&_h3]:mb-[5px] [&_h3]:mt-[13px] [&_h3]:text-[13px] [&_h3]:text-[#dce5f0] [&_p]:mb-0 [&_p]:max-w-[350px] [&_p]:text-[11px] [&_p]:leading-[1.6] [&_p]:text-[#94a4b8]',
  'table-empty': 'min-h-[185px]',
  'compact-empty': 'min-h-[170px]',
  'loading-row': 'flex min-h-[150px] items-center justify-center gap-[10px] text-[12px] text-[#a0b0c3]',
  'modal-backdrop': 'fixed inset-0 z-50 grid place-items-center bg-[#080d16b8] p-5 backdrop-blur-[4px]',
  dialog: 'w-full max-w-[650px] max-h-[90vh] overflow-y-auto rounded-xl border border-[#344257] bg-[#1c293a] p-6 text-[#e6edf8] shadow-[0_24px_80px_#060b1480] max-[640px]:p-4',
  'history-dialog': 'max-w-[890px]',
  'delete-dialog': 'w-full max-w-[450px] rounded-xl border border-[#74424a] bg-[#1c293a] p-6 text-center text-[#e6edf8] shadow-[0_24px_80px_#060b1480] [&_h2]:mb-2 [&_h2]:text-[18px] [&_h2]:text-[#f0f4fa] [&_p]:mb-5 [&_p]:text-[12px] [&_p]:leading-[1.7] [&_p]:text-[#c2ccda] [&_p_strong]:text-white]',
  'delete-warning-icon': 'mx-auto mb-4 grid size-11 place-items-center rounded-full border border-[#74424a] bg-[#412a33] text-[#ff9299]',
  'dialog-heading': 'mb-5 flex items-start justify-between gap-[15px] [&_h2]:mb-0 [&_h2]:text-[18px] [&_h2]:text-[#f0f4fa] [&_.eyebrow]:mb-[7px]',
  'monitor-form': 'grid gap-[15px] [&_label]:grid [&_label]:gap-[7px] [&_label]:text-[11px] [&_label]:font-semibold [&_label]:text-[#c9d3e0] [&_input]:min-h-[39px] [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-[#3a4b60] [&_input]:bg-[#121e2e] [&_input]:px-[11px] [&_input]:text-[12px] [&_input]:text-[#e7edf6] [&_input]:outline-none [&_input]:placeholder:text-[#78899e] [&_input:focus]:border-[#46a9df] [&_select]:min-h-[39px] [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-[#3a4b60] [&_select]:bg-[#121e2e] [&_select]:px-[11px] [&_select]:text-[12px] [&_select]:text-[#e7edf6] [&_select]:outline-none [&_select:focus]:border-[#46a9df] [&_small]:text-[10px] [&_small]:font-normal [&_small]:text-[#93a3b7]',
  'form-grid': 'grid grid-cols-2 gap-3 max-[640px]:grid-cols-1',
  'input-with-unit': 'relative [&_input]:pr-[38px] [&>span]:absolute [&>span]:right-[11px] [&>span]:top-1/2 [&>span]:-translate-y-1/2 [&>span]:text-[10px] [&>span]:font-normal [&>span]:text-[#93a3b7]',
  'dialog-actions': 'mt-1 flex justify-end gap-2',
  'delete-dialog-actions': 'mt-2 gap-4',
  'delete-cancel-button': 'min-w-[82px] border border-[#526176] bg-[#253448] px-4 text-[#f0f4fa] hover:bg-[#304158]',
  'history-table': 'max-h-[54vh] max-[640px]:-mx-[17px] max-[640px]:w-[calc(100%+34px)] [&_th]:px-3 [&_th]:py-[10px] [&_td]:px-3 [&_td]:py-[10px]',
  'check-error': 'max-w-[230px] overflow-hidden text-ellipsis text-[#a6b4c6]',
  'check-error-diagnosis': 'min-w-[250px] max-w-[390px] whitespace-normal text-[#a6b4c6]',
};
