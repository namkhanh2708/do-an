import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  type LucideIcon,
  Globe2,
  HeartPulse,
  History,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  MonitorCheck,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Trash2,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { api } from './api';
import type {
  ApiHealth,
  HealthCheck,
  Incident,
  Monitor,
  MonitorInput,
  MonitorStatus,
  Report,
} from './types/monitor';

type Page = 'dashboard' | 'monitors' | 'incidents' | 'reports';
type TimeRange = '1d' | '7d' | '30d';

const emptyReport: Report = {
  summary: {
    totalMonitors: 0,
    up: 0,
    slow: 0,
    down: 0,
    uptimePercent: null,
    averageResponseTimeMs: null,
    totalChecks: 0,
    incidentCount: 0,
    meanRecoveryTimeMs: null,
  },
  series: [],
  monitors: [],
};

const rangeLabels: Record<TimeRange, string> = {
  '1d': '24 giờ qua',
  '7d': '7 ngày qua',
  '30d': '30 ngày qua',
};

function formatMs(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : `${Math.round(value)} ms`;
}

function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : `${value.toFixed(3)}%`;
}

function formatDate(value: string | null | undefined) {
  return value
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : 'Chưa kiểm tra';
}

function formatDuration(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  if (value < 60_000) return `${Math.max(1, Math.round(value / 1000))} giây`;
  if (value < 3_600_000) return `${Math.floor(value / 60_000)} phút`;
  const hours = Math.floor(value / 3_600_000);
  const minutes = Math.floor((value % 3_600_000) / 60_000);
  return `${hours} giờ ${minutes} phút`;
}

function statusLabel(status: MonitorStatus) {
  return { UP: 'Đang hoạt động', DOWN: 'Mất kết nối', SLOW: 'Phản hồi chậm', UNKNOWN: 'Chưa có dữ liệu' }[status];
}

function StatusBadge({ status }: { status: MonitorStatus }) {
  const Icon = status === 'UP' ? CheckCircle2 : status === 'DOWN' ? WifiOff : status === 'SLOW' ? Zap : Clock3;
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <Icon size={13} />
      {statusLabel(status)}
    </span>
  );
}

function PerformanceChart({ data, range }: { data: Report['series']; range: TimeRange }) {
  const values = data
    .filter((point) => point.averageResponseTimeMs !== null)
    .map((point) => point.averageResponseTimeMs as number);

  if (!values.length) {
    return (
      <div className="chart-empty">
        <Activity size={22} />
        <span>Chưa có dữ liệu phản hồi trong khoảng thời gian này.</span>
      </div>
    );
  }

  const min = Math.max(0, Math.floor(Math.min(...values) / 10) * 10 - 10);
  const max = Math.max(min + 20, Math.ceil(Math.max(...values) / 10) * 10 + 10);
  const points = data
    .map((point, index) => {
      if (point.averageResponseTimeMs === null) return null;
      const x = 46 + (index / Math.max(1, data.length - 1)) * 510;
      const y = 188 - ((point.averageResponseTimeMs - min) / (max - min)) * 150;
      return { x, y };
    })
    .filter((point): point is { x: number; y: number } => point !== null);
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = points.length ? `${points[0].x},188 ${line} ${points[points.length - 1].x},188` : '';

  return (
    <div className="chart-wrap">
      <svg className="line-chart" viewBox="0 0 580 220" role="img" aria-label="Biểu đồ thời gian phản hồi">
        {[0, 1, 2, 3].map((step) => {
          const y = 38 + step * 50;
          const label = Math.round(max - (step / 3) * (max - min));
          return (
            <g key={step}>
              <line x1="46" x2="558" y1={y} y2={y} className="chart-gridline" />
              <text x="0" y={y + 4} className="chart-axis-label">{label} ms</text>
            </g>
          );
        })}
        {area && <polygon points={area} className="chart-area" />}
        {line && <polyline points={line} className="chart-line" />}
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="3.5" className="chart-point" />
        ))}
        {[0, Math.floor((data.length - 1) / 2), data.length - 1]
          .filter((index, position, indexes) => data.length > 1 && indexes.indexOf(index) === position)
          .map((index) => {
            const x = 46 + (index / Math.max(1, data.length - 1)) * 510;
            const label = new Intl.DateTimeFormat('vi-VN', range === '1d'
              ? { hour: '2-digit', minute: '2-digit' }
              : { day: '2-digit', month: '2-digit' }).format(new Date(data[index].timestamp));
            const anchor = index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle';
            return <text key={index} x={x} y="211" textAnchor={anchor} className="chart-axis-label">{label}</text>;
          })}
      </svg>
      <div className="chart-footnote">
        <span><i className="legend-dot legend-blue" /> Thời gian phản hồi trung bình</span>
        <span>{points.length} mốc dữ liệu</span>
      </div>
    </div>
  );
}

function UptimeChart({ percent, up, slow, down }: { percent: number | null; up: number; slow: number; down: number }) {
  const value = percent ?? 0;
  const circumference = 2 * Math.PI * 66;
  const dash = circumference * Math.min(100, Math.max(0, value)) / 100;
  return (
    <div className="uptime-chart">
      <svg viewBox="0 0 180 180" role="img" aria-label={`Uptime ${formatPercent(percent)}`}>
        <circle cx="90" cy="90" r="66" className="donut-track" />
        {percent !== null && (
          <circle
            cx="90"
            cy="90"
            r="66"
            className="donut-value"
            strokeDasharray={`${dash} ${circumference}`}
            transform="rotate(-90 90 90)"
          />
        )}
        <text x="90" y="86" className="donut-percent">{percent === null ? '—' : `${value.toFixed(1)}%`}</text>
        <text x="90" y="107" className="donut-caption">UPTIME</text>
      </svg>
      <div className="uptime-legend">
        <span><i className="legend-dot legend-green" /> UP <b>{up}</b></span>
        <span><i className="legend-dot legend-amber" /> Chậm <b>{slow}</b></span>
        <span><i className="legend-dot legend-red" /> DOWN <b>{down}</b></span>
      </div>
    </div>
  );
}

function MonitorDialog({
  monitor,
  saving,
  error,
  onClose,
  onSave,
}: {
  monitor: Monitor | null;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (input: MonitorInput) => void;
}) {
  const [name, setName] = useState(monitor?.name ?? '');
  const [url, setUrl] = useState(monitor?.url ?? '');
  const [intervalSeconds, setIntervalSeconds] = useState(monitor?.intervalSeconds ?? 60);
  const [slowThresholdMs, setSlowThresholdMs] = useState(monitor?.slowThresholdMs ?? 1000);
  const [notificationEmail, setNotificationEmail] = useState(monitor?.notificationEmail ?? '');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ name: name.trim(), url: url.trim(), enabled: monitor?.enabled ?? true, intervalSeconds, slowThresholdMs, notificationEmail: notificationEmail.trim() });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="monitor-dialog-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">CẤU HÌNH GIÁM SÁT</p>
            <h2 id="monitor-dialog-title">{monitor ? 'Chỉnh sửa website' : 'Thêm website mới'}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Đóng" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div className="inline-error dialog-error"><AlertTriangle size={15} />{error}</div>}
        <form onSubmit={submit} className="monitor-form">
          <label>
            Tên website
            <input autoFocus required maxLength={80} placeholder="Ví dụ: Trang chủ công ty" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            URL cần theo dõi
            <input required type="url" placeholder="https://example.com" value={url} onChange={(event) => setUrl(event.target.value)} />
            <small>Chỉ hỗ trợ địa chỉ HTTP/HTTPS công khai.</small>
          </label>
          <div className="form-grid">
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
              <span className="input-with-unit">
                <input type="number" min={100} max={30000} step={100} value={slowThresholdMs} onChange={(event) => setSlowThresholdMs(Number(event.target.value))} required />
                <span>ms</span>
              </span>
            </label>
          </div>
          <label>
            Email nhận cảnh báo (tùy chọn)
            <input type="email" placeholder="admin@example.com" value={notificationEmail} onChange={(event) => setNotificationEmail(event.target.value)} />
            <small>Nhận email khi website DOWN và khi đã khôi phục.</small>
          </label>
          <div className="dialog-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>Hủy</button>
            <button type="submit" className="button button-primary" disabled={saving}>
              {saving ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}
              {monitor ? 'Lưu thay đổi' : 'Thêm website'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function HistoryDialog({
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
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog history-dialog" role="dialog" aria-modal="true" aria-labelledby="history-dialog-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">LỊCH SỬ KIỂM TRA · {rangeLabels[range]}</p>
            <h2 id="history-dialog-title">{monitor.name}</h2>
            <a className="monitor-url" href={monitor.url} target="_blank" rel="noreferrer">{monitor.url}<ExternalLink size={12} /></a>
          </div>
          <button className="icon-button" type="button" aria-label="Đóng" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div className="inline-error">{error}</div>}
        {loading ? <div className="loading-row"><LoaderCircle className="spin" size={18} /> Đang tải lịch sử…</div> :
          checks.length === 0 ? <div className="empty-state compact-empty"><History size={24} /><p>Chưa có lần kiểm tra nào trong khoảng thời gian này.</p></div> : (
            <div className="table-scroll history-table">
              <table>
                <thead><tr><th>Thời điểm</th><th>Trạng thái</th><th>HTTP</th><th>Phản hồi</th><th>Chi tiết</th></tr></thead>
                <tbody>
                  {checks.map((check) => (
                    <tr key={check.id}>
                      <td>{formatDate(check.checkedAt)}</td>
                      <td><StatusBadge status={check.status} /></td>
                      <td>{check.httpStatus ?? '—'}</td>
                      <td>{formatMs(check.responseTimeMs)}</td>
                      <td className="check-error">{check.error || '—'}</td>
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

function MonitorTable({
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
}) {
  const filtered = monitors.filter((monitor) => {
    const query = search?.trim().toLowerCase();
    return !query || monitor.name.toLowerCase().includes(query) || monitor.url.toLowerCase().includes(query);
  });
  const rows = new Map(reportRows.map((row) => [row.id, row]));

  return (
    <>
      {onSearch && (
        <div className="table-toolbar">
          <div className="search-field"><Search size={16} /><input aria-label="Tìm website" placeholder="Tìm theo tên hoặc URL…" value={search} onChange={(event) => onSearch(event.target.value)} /></div>
          <span>{filtered.length} website</span>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="empty-state table-empty">
          <Globe2 size={28} />
          <h3>{monitors.length ? 'Không tìm thấy website' : 'Chưa có website nào được theo dõi'}</h3>
          <p>{monitors.length ? 'Thử từ khóa khác.' : 'Thêm URL công khai đầu tiên để bắt đầu theo dõi uptime và thời gian phản hồi.'}</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead><tr>
              <th>WEBSITE</th><th>TRẠNG THÁI</th><th>UPTIME</th><th>PHẢN HỒI</th>
              {!compact && <th>LẦN KIỂM TRA CUỐI</th>}
              <th>HÀNH ĐỘNG</th>
            </tr></thead>
            <tbody>
              {filtered.map((monitor) => {
                const stats = rows.get(monitor.id);
                return (
                  <tr key={monitor.id}>
                    <td>
                      <div className="monitor-name-cell">
                        <span className={`monitor-favicon favicon-${monitor.status.toLowerCase()}`}><Globe2 size={15} /></span>
                        <span><strong>{monitor.name}</strong><a className="monitor-url" href={monitor.url} target="_blank" rel="noreferrer">{monitor.url}<ExternalLink size={11} /></a></span>
                      </div>
                    </td>
                    <td><div className="status-cell"><StatusBadge status={monitor.enabled ? monitor.status : 'UNKNOWN'} />{!monitor.enabled && <span className="paused-label">Đã tắt</span>}</div></td>
                    <td className="number-cell">{formatPercent(stats?.uptimePercent ?? null)}</td>
                    <td className="number-cell">{formatMs(monitor.lastResponseTimeMs ?? stats?.averageResponseTimeMs)}</td>
                    {!compact && <td className="date-cell">{formatDate(monitor.lastCheckedAt)}</td>}
                    <td>
                      <div className="row-actions">
                        <button className="icon-button small" title="Kiểm tra ngay" aria-label={`Kiểm tra ${monitor.name}`} disabled={checkingId === monitor.id || !monitor.enabled} onClick={() => onCheck(monitor)}>
                          {checkingId === monitor.id ? <LoaderCircle size={15} className="spin" /> : <RefreshCw size={15} />}
                        </button>
                        <button className="icon-button small" title="Lịch sử" aria-label={`Xem lịch sử ${monitor.name}`} onClick={() => onHistory(monitor)}><History size={15} /></button>
                        <button className="icon-button small" title="Chỉnh sửa" aria-label={`Chỉnh sửa ${monitor.name}`} onClick={() => onEdit(monitor)}><Pencil size={15} /></button>
                        <button className="icon-button small" title={monitor.enabled ? 'Tạm dừng' : 'Bật giám sát'} aria-label={monitor.enabled ? `Tạm dừng ${monitor.name}` : `Bật ${monitor.name}`} onClick={() => onToggle(monitor)}>{monitor.enabled ? <Pause size={15} /> : <Play size={15} />}</button>
                        <button className="icon-button small icon-danger" title="Xóa website" aria-label={`Xóa ${monitor.name}`} onClick={() => onDelete(monitor)}><Trash2 size={15} /></button>
                      </div>
                    </td>
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

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [range, setRange] = useState<TimeRange>('7d');
  const [monitorFilter, setMonitorFilter] = useState('');
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [report, setReport] = useState<Report>(emptyReport);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [historyMonitor, setHistoryMonitor] = useState<Monitor | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const [nextHealth, nextMonitors, nextReport, nextIncidents] = await Promise.all([
        api.health(),
        api.monitors(),
        api.report(range, monitorFilter || undefined),
        api.incidents(range),
      ]);
      setHealth(nextHealth);
      setMonitors(nextMonitors);
      setReport(nextReport);
      setIncidents(nextIncidents);
      setApiError('');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
      if (!quiet) setRefreshing(false);
    }
  }, [range, monitorFilter]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const timer = window.setInterval(() => { void refresh(true); }, 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectedReport = useMemo(() => {
    if (!monitorFilter) return report;
    return {
      ...report,
      monitors: report.monitors.filter((monitor) => monitor.id === monitorFilter),
    };
  }, [monitorFilter, report]);

  async function saveMonitor(input: MonitorInput) {
    setSaving(true);
    setActionError('');
    try {
      if (editingMonitor) await api.updateMonitor(editingMonitor.id, input);
      else {
        const created = await api.createMonitor(input);
        await api.checkNow(created.id);
      }
      setDialogOpen(false);
      setEditingMonitor(null);
      setNotice(editingMonitor ? 'Đã cập nhật website.' : 'Đã thêm website và hoàn tất lần kiểm tra đầu tiên.');
      await refresh(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể lưu website.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleMonitor(monitor: Monitor) {
    try {
      await api.updateMonitor(monitor.id, {
        name: monitor.name,
        url: monitor.url,
        enabled: !monitor.enabled,
        intervalSeconds: monitor.intervalSeconds,
        slowThresholdMs: monitor.slowThresholdMs,
        notificationEmail: monitor.notificationEmail,
      });
      setNotice(monitor.enabled ? 'Đã tạm dừng giám sát.' : 'Đã bật lại giám sát.');
      await refresh(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể cập nhật website.');
    }
  }

  async function deleteMonitor(monitor: Monitor) {
    if (!window.confirm(`Xóa "${monitor.name}" cùng toàn bộ lịch sử kiểm tra và sự cố?`)) return;
    try {
      await api.deleteMonitor(monitor.id);
      setNotice('Đã xóa website và lịch sử liên quan.');
      if (monitorFilter === monitor.id) setMonitorFilter('');
      await refresh(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể xóa website.');
    }
  }

  async function checkMonitor(monitor: Monitor) {
    setCheckingId(monitor.id);
    setActionError('');
    try {
      const result = await api.checkNow(monitor.id);
      setNotice(`${monitor.name}: ${statusLabel(result.check.status)}${result.check.responseTimeMs === null ? '' : ` · ${formatMs(result.check.responseTimeMs)}`}`);
      await refresh(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể kiểm tra website.');
    } finally {
      setCheckingId(null);
    }
  }

  function openCreateDialog() {
    setActionError('');
    setEditingMonitor(null);
    setDialogOpen(true);
  }

  function openEditDialog(monitor: Monitor) {
    setActionError('');
    setEditingMonitor(monitor);
    setDialogOpen(true);
  }

  function exportCsv() {
    const csvCell = (value: string) => {
      const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
      return `"${safeValue.replaceAll('"', '""')}"`;
    };
    const rows = [
      ['Tên website', 'URL', 'Trạng thái', 'Uptime (%)', 'Phản hồi trung bình (ms)', 'Số lần kiểm tra', 'Số sự cố'],
      ...selectedReport.monitors.map((monitor) => [
        monitor.name,
        monitor.url,
        statusLabel(monitor.status),
        monitor.uptimePercent?.toFixed(3) ?? '',
        monitor.averageResponseTimeMs?.toFixed(1) ?? '',
        String(monitor.checks),
        String(monitor.incidents),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.href = url;
    link.download = `uptime-report-${range}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const navigation: { id: Page; label: string; icon: LucideIcon }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'monitors', label: 'Website giám sát', icon: MonitorCheck },
    { id: 'incidents', label: 'Lịch sử sự cố', icon: AlertTriangle },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
  ];
  const activeIncidents = incidents.filter((incident) => incident.status === 'OPEN').length;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage('dashboard'); }}>
          <span className="brand-mark"><HeartPulse size={22} /></span>
          <span><strong>Uptime Watch</strong><small>Website Reliability</small></span>
        </a>
        <div className="sidebar-section">
          <span className="sidebar-label">GIÁM SÁT</span>
          <nav>
            {navigation.map(({ id, label, icon: Icon }) => (
              <button key={id} className={`nav-item ${page === id ? 'nav-active' : ''}`} onClick={() => { setPage(id); setMobileNavOpen(false); }}>
                <Icon size={17} />
                <span>{label}</span>
                {id === 'incidents' && activeIncidents > 0 && <span className="nav-count">{activeIncidents}</span>}
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className={`system-card ${health?.storage === 'mongodb' ? 'system-ok' : ''}`}>
            <div className="system-title"><span className="system-dot" /> {health?.storage === 'mongodb' ? 'Hệ thống sẵn sàng' : 'Chế độ RAM'}</div>
            <p>{health?.storage === 'mongodb' ? 'MongoDB đã kết nối' : 'Dữ liệu mất khi khởi động lại'}</p>
            <div className="system-caption"><span>Thông báo email</span><b>{health?.email ? 'Đã bật' : 'Chưa cấu hình'}</b></div>
          </div>
          <span className="sidebar-version">Version 1.1.0</span>
        </div>
      </aside>
      {mobileNavOpen && <button className="mobile-backdrop" aria-label="Đóng menu" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Mở menu" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button>
          <div className="breadcrumb"><span>Uptime Watch</span><span className="breadcrumb-divider">/</span><strong>{navigation.find((item) => item.id === page)?.label}</strong></div>
          <div className="topbar-actions">
            <span className="live-indicator"><i /> LIVE</span>
            <button className="icon-button top-refresh" title="Làm mới dữ liệu" onClick={() => void refresh()} disabled={refreshing}>{refreshing ? <LoaderCircle className="spin" size={17} /> : <RefreshCw size={17} />}</button>
            <button className="button button-primary top-add" onClick={openCreateDialog}><Plus size={16} /> Thêm website</button>
          </div>
        </header>

        <div className="page-content">
          {apiError && <div className="connection-banner"><WifiOff size={17} /><span><strong>Không kết nối được backend.</strong> {apiError} Hãy chạy <code>npm run dev</code> để khởi động cả giao diện và API.</span></div>}
          {health?.storage === 'memory' && <div className="storage-banner"><CircleHelpIcon /> MongoDB chưa kết nối — dữ liệu hiện lưu tạm trong bộ nhớ và sẽ mất khi máy chủ khởi động lại.</div>}
          {actionError && <div className="inline-error"><AlertTriangle size={16} />{actionError}<button aria-label="Đóng thông báo" onClick={() => setActionError('')}><X size={15} /></button></div>}
          {notice && <div className="toast-message"><CheckCircle2 size={16} />{notice}<button aria-label="Đóng thông báo" onClick={() => setNotice('')}><X size={15} /></button></div>}

          <div className="page-heading">
            <div>
              <p className="eyebrow">{page === 'dashboard' ? 'TỔNG QUAN HỆ THỐNG' : page === 'monitors' ? 'QUẢN LÝ GIÁM SÁT' : page === 'incidents' ? 'THEO DÕI SỰ CỐ' : 'PHÂN TÍCH HIỆU SUẤT'}</p>
              <h1>{page === 'dashboard' ? 'Dashboard' : page === 'monitors' ? 'Website giám sát' : page === 'incidents' ? 'Lịch sử sự cố' : 'Báo cáo phân tích'}</h1>
              <p className="page-subtitle">{page === 'dashboard' ? 'Tình trạng website và hiệu suất trong nháy mắt.' : page === 'monitors' ? 'Thêm URL, đặt ngưỡng cảnh báo và kiểm soát lịch kiểm tra.' : page === 'incidents' ? 'Theo dõi thời điểm website gián đoạn và phục hồi.' : 'Uptime, thời gian phản hồi và thống kê theo từng website.'}</p>
            </div>
            <div className="heading-actions">
              <label className="range-select"><Clock3 size={15} /><select aria-label="Khoảng thời gian" value={range} onChange={(event) => setRange(event.target.value as TimeRange)}>{Object.entries(rangeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
              {(page === 'reports' || page === 'dashboard') && <button className="button button-secondary export-button" onClick={exportCsv}><Download size={15} /> Xuất CSV</button>}
            </div>
          </div>

          {page === 'dashboard' && (
            <>
              <section className="metric-grid">
                <MetricCard icon={<ShieldCheck size={17} />} label="UPTIME" value={formatPercent(report.summary.uptimePercent)} note={`${report.summary.totalChecks.toLocaleString('vi-VN')} lượt kiểm tra`} color="green" />
                <MetricCard icon={<Activity size={17} />} label="PHẢN HỒI TRUNG BÌNH" value={formatMs(report.summary.averageResponseTimeMs)} note={`Trong ${rangeLabels[range].toLowerCase()}`} color="blue" />
                <MetricCard icon={<AlertTriangle size={17} />} label="SỰ CỐ" value={String(report.summary.incidentCount)} note={`${activeIncidents} sự cố đang mở`} color="amber" />
                <MetricCard icon={<Clock3 size={17} />} label="THỜI GIAN KHÔI PHỤC TB" value={formatDuration(report.summary.meanRecoveryTimeMs)} note="Các sự cố đã xử lý" color="purple" />
              </section>

              <section className="monitor-status-strip" aria-label="Số lượng website theo trạng thái">
                <div><span className="strip-total">{monitors.filter((monitor) => monitor.enabled).length}</span><span>website theo dõi</span></div>
                <div><i className="legend-dot legend-green" /> <b>{report.summary.up}</b> UP</div>
                <div><i className="legend-dot legend-amber" /> <b>{report.summary.slow}</b> SLOW</div>
                <div><i className="legend-dot legend-red" /> <b>{report.summary.down}</b> DOWN</div>
                <div className="strip-paused">{monitors.filter((monitor) => !monitor.enabled).length} đã tạm dừng</div>
              </section>

              <section className="chart-grid">
                <article className="panel chart-panel">
                  <div className="panel-heading"><div><h2>Xu hướng thời gian phản hồi</h2><p>Đơn vị mili giây · {rangeLabels[range].toLowerCase()}</p></div><span className="panel-icon blue-icon"><Activity size={17} /></span></div>
                  <PerformanceChart data={report.series} range={range} />
                </article>
                <article className="panel chart-panel uptime-panel">
                  <div className="panel-heading"><div><h2>Phân bố trạng thái</h2><p>Tình trạng kiểm tra mới nhất</p></div><span className="panel-icon green-icon"><HeartPulse size={17} /></span></div>
                  <UptimeChart percent={report.summary.uptimePercent} up={report.summary.up} slow={report.summary.slow} down={report.summary.down} />
                </article>
              </section>

              <section className="panel table-panel">
                <PanelHeading title="Hiệu suất website" subtitle="Trạng thái hiện tại và số liệu của khoảng thời gian đã chọn" action={<button className="text-button" onClick={() => setPage('monitors')}>Tất cả website <ArrowRight size={15} /></button>} />
                {loading ? <LoadingRow /> : (
                  <MonitorTable
                    monitors={monitors}
                    reportRows={report.monitors}
                    onEdit={openEditDialog}
                    onDelete={(monitor) => void deleteMonitor(monitor)}
                    onToggle={(monitor) => void toggleMonitor(monitor)}
                    onCheck={(monitor) => void checkMonitor(monitor)}
                    onHistory={setHistoryMonitor}
                    checkingId={checkingId}
                    compact
                  />
                )}
              </section>

              <section className="panel incidents-preview">
                <PanelHeading title="Sự cố gần đây" subtitle="Website DOWN và thời gian khôi phục" action={<button className="text-button" onClick={() => setPage('incidents')}>Xem lịch sử <ArrowRight size={15} /></button>} />
                {incidents.length === 0 ? <div className="empty-inline"><CheckCircle2 size={17} /> Chưa ghi nhận sự cố nào trong khoảng thời gian này.</div> : incidents.slice(0, 3).map((incident) => <IncidentRow key={incident.id} incident={incident} />)}
              </section>
            </>
          )}

          {page === 'monitors' && (
            <section className="panel table-panel full-table-panel">
              <PanelHeading title="Danh sách website" subtitle="Quản lý URL, tần suất kiểm tra và trạng thái giám sát" action={<button className="button button-primary" onClick={openCreateDialog}><Plus size={15} /> Thêm website</button>} />
              {loading ? <LoadingRow /> : <MonitorTable monitors={monitors} reportRows={report.monitors} search={search} onSearch={setSearch} onEdit={openEditDialog} onDelete={(monitor) => void deleteMonitor(monitor)} onToggle={(monitor) => void toggleMonitor(monitor)} onCheck={(monitor) => void checkMonitor(monitor)} onHistory={setHistoryMonitor} checkingId={checkingId} />}
            </section>
          )}

          {page === 'incidents' && (
            <section className="panel incidents-panel">
              <PanelHeading title="Nhật ký gián đoạn" subtitle={`${incidents.length} sự cố trong ${rangeLabels[range].toLowerCase()}`} />
              {loading ? <LoadingRow /> : incidents.length === 0 ? <div className="empty-state incident-empty"><CheckCircle2 size={30} /><h3>Không có sự cố</h3><p>Các website đang được theo dõi chưa ghi nhận trạng thái DOWN trong khoảng thời gian này.</p></div> : incidents.map((incident) => <IncidentRow key={incident.id} incident={incident} detailed />)}
            </section>
          )}

          {page === 'reports' && (
            <>
              <div className="report-filter-row">
                <label className="range-select"><Search size={15} /><select aria-label="Lọc website" value={monitorFilter} onChange={(event) => setMonitorFilter(event.target.value)}><option value="">Tất cả website</option>{monitors.map((monitor) => <option key={monitor.id} value={monitor.id}>{monitor.name}</option>)}</select></label>
                <button className="button button-secondary" onClick={exportCsv}><Download size={15} /> Xuất báo cáo CSV</button>
              </div>
              <section className="metric-grid report-metrics">
                <MetricCard icon={<ShieldCheck size={17} />} label="UPTIME" value={formatPercent(report.summary.uptimePercent)} note={rangeLabels[range]} color="green" />
                <MetricCard icon={<Activity size={17} />} label="PHẢN HỒI TRUNG BÌNH" value={formatMs(report.summary.averageResponseTimeMs)} note={`${report.summary.totalChecks} lượt kiểm tra`} color="blue" />
                <MetricCard icon={<AlertTriangle size={17} />} label="SỰ CỐ" value={String(report.summary.incidentCount)} note="Trong khoảng đã chọn" color="amber" />
                <MetricCard icon={<Clock3 size={17} />} label="THỜI GIAN KHÔI PHỤC TB" value={formatDuration(report.summary.meanRecoveryTimeMs)} note="Các sự cố đã xử lý" color="purple" />
              </section>
              <section className="panel chart-panel report-chart">
                <div className="panel-heading"><div><h2>Thời gian phản hồi theo thời gian</h2><p>Chỉ tính các lượt kiểm tra phản hồi thành công</p></div></div>
                <PerformanceChart data={report.series} range={range} />
              </section>
              <section className="panel table-panel">
                <PanelHeading title="Hiệu suất từng website" subtitle="Thống kê uptime, độ trễ và sự cố" />
                {selectedReport.monitors.length === 0 ? <div className="empty-state table-empty"><BarChart3 size={28} /><h3>Chưa có dữ liệu báo cáo</h3><p>Thêm website và đợi các lượt kiểm tra để xem báo cáo.</p></div> : (
                  <div className="table-scroll"><table><thead><tr><th>WEBSITE</th><th>UPTIME</th><th>PHẢN HỒI TB</th><th>TRẠNG THÁI</th><th>KIỂM TRA</th><th>SỰ CỐ</th></tr></thead><tbody>{selectedReport.monitors.map((monitor) => <tr key={monitor.id}><td><strong>{monitor.name}</strong><a className="monitor-url" href={monitor.url} target="_blank" rel="noreferrer">{monitor.url}<ExternalLink size={11} /></a></td><td className="uptime-cell">{formatPercent(monitor.uptimePercent)}</td><td className="number-cell">{formatMs(monitor.averageResponseTimeMs)}</td><td><StatusBadge status={monitor.status} /></td><td>{monitor.checks.toLocaleString('vi-VN')}</td><td>{monitor.incidents}</td></tr>)}</tbody></table></div>
                )}
              </section>
            </>
          )}

          <footer className="page-footer"><span>Uptime Watch</span><span>Đang theo dõi {monitors.filter((monitor) => monitor.enabled).length} website · Tự làm mới mỗi 30 giây</span></footer>
        </div>
      </main>
      {dialogOpen && <MonitorDialog key={editingMonitor?.id ?? 'new-monitor'} monitor={editingMonitor} saving={saving} error={actionError} onClose={() => { setDialogOpen(false); setEditingMonitor(null); }} onSave={(input) => void saveMonitor(input)} />}
      {historyMonitor && <HistoryDialog monitor={historyMonitor} range={range} onClose={() => setHistoryMonitor(null)} />}
    </div>
  );
}

function MetricCard({ icon, label, value, note, color }: { icon: ReactNode; label: string; value: string; note: string; color: string }) {
  return (
    <article className={`metric-card metric-${color}`}>
      <div className="metric-heading"><span>{label}</span><span className={`metric-icon ${color}-icon`}>{icon}</span></div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
    </article>
  );
}

function PanelHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <div className="panel-heading panel-heading-bordered"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>;
}

function IncidentRow({ incident, detailed = false }: { incident: Incident; detailed?: boolean }) {
  return (
    <article className={`incident-row ${detailed ? 'incident-row-detailed' : ''}`}>
      <span className={`incident-icon ${incident.status === 'OPEN' ? 'incident-open' : 'incident-resolved'}`}>{incident.status === 'OPEN' ? <WifiOff size={17} /> : <CheckCircle2 size={17} />}</span>
      <div className="incident-content">
        <div className="incident-title-line"><strong>{incident.monitorName}</strong><span className={`incident-state ${incident.status === 'OPEN' ? 'state-open' : 'state-resolved'}`}>{incident.status === 'OPEN' ? 'ĐANG DIỄN RA' : 'ĐÃ KHÔI PHỤC'}</span></div>
        <a className="monitor-url" href={incident.monitorUrl} target="_blank" rel="noreferrer">{incident.monitorUrl}<ExternalLink size={11} /></a>
        {detailed && <p className="incident-detail">{incident.status === 'OPEN' ? 'Website hiện vẫn không phản hồi.' : `Thời gian gián đoạn: ${formatDuration(incident.durationMs)}.`}</p>}
      </div>
      <div className="incident-times"><span><AlertTriangle size={13} /> Bắt đầu {formatDate(incident.startedAt)}</span><span>{incident.resolvedAt ? `Khôi phục ${formatDate(incident.resolvedAt)}` : `Đang gián đoạn · ${formatDuration(Date.now() - new Date(incident.startedAt).getTime())}`}</span></div>
    </article>
  );
}

function LoadingRow() {
  return <div className="loading-row"><LoaderCircle size={18} className="spin" /> Đang tải dữ liệu…</div>;
}

function CircleHelpIcon() {
  return <Server size={16} />;
}
