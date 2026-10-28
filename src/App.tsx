import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  type LucideIcon,
  LayoutDashboard,
  MonitorCheck,
} from 'lucide-react';
import { api } from './api';
import AppShell from './components/AppShell';
import AuthScreen from './components/AuthScreen';
import { DeleteMonitorDialog, HistoryDialog, MonitorDialog } from './components/monitor-management';
import PageContent from './views/PageContent';
import type { Page, TimeRange } from './types/app';
import type { ApiHealth, Incident, Monitor, MonitorInput, Report } from './types/monitor';
import { formatMs, statusLabel } from './utils/format';
import { emptyReport } from './utils/report';

const legacySessionStorageKey = 'uptime-watch-session';
const legacyAccountsStorageKey = 'uptime-watch-accounts';

// Điều phối phiên đăng nhập, dữ liệu và các thao tác chính của dashboard.
export default function App() {
  // Khởi tạo trạng thái phiên đăng nhập trong bộ nhớ ứng dụng.
  const [authenticatedUser, setAuthenticatedUser] = useState('');
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
  const [deleteMonitorTarget, setDeleteMonitorTarget] = useState<Monitor | null>(null);
  const [deletingMonitorId, setDeletingMonitorId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Tải và đồng bộ dữ liệu sức khỏe, website, báo cáo và sự cố.
  const refresh = useCallback(async (quiet = false) => {
    if (!authenticatedUser) return;
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
  }, [authenticatedUser, range, monitorFilter]);

  // Xóa phiên giả và tài khoản lưu dạng văn bản thuần từ phiên bản demo cũ.
  useEffect(() => {
    window.localStorage.removeItem(legacySessionStorageKey);
    window.localStorage.removeItem(legacyAccountsStorageKey);
  }, []);

  useEffect(() => { if (authenticatedUser) void refresh(); }, [authenticatedUser, refresh]);
  useEffect(() => {
    if (!authenticatedUser) return;
    const timer = window.setInterval(() => { void refresh(true); }, 30_000);
    return () => window.clearInterval(timer);
  }, [authenticatedUser, refresh]);
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

  // Thêm website mới hoặc lưu cấu hình website hiện có.
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

  // Bật hoặc tạm dừng giám sát website.
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

  // Xác nhận xóa website và làm mới dữ liệu liên quan.
  async function confirmDeleteMonitor() {
    if (!deleteMonitorTarget) return;
    const monitor = deleteMonitorTarget;
    setDeletingMonitorId(monitor.id);
    setDeleteError('');
    try {
      await api.deleteMonitor(monitor.id);
      setDeleteMonitorTarget(null);
      setNotice('Đã xóa website và lịch sử liên quan.');
      if (monitorFilter === monitor.id) setMonitorFilter('');
      await refresh(true);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Không thể xóa website.');
    } finally {
      setDeletingMonitorId(null);
    }
  }

  // Lưu người dùng đã xác thực vào phiên trình duyệt.
  function handleAuthenticated(username: string) {
    setAuthenticatedUser(username);
  }

  // Kết thúc phiên đăng nhập hiện tại.
  function handleLogout() {
    setAuthenticatedUser('');
  }

  // Yêu cầu kiểm tra website ngay lập tức.
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

  // Mở form thêm website hoặc chỉnh sửa cấu hình.
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

  // Xuất số liệu báo cáo đang lọc thành tệp CSV.
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

  if (!authenticatedUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <AppShell
      page={page}
      range={range}
      navigation={navigation}
      activeIncidents={activeIncidents}
      enabledMonitorCount={monitors.filter((monitor) => monitor.enabled).length}
      health={health}
      mobileNavOpen={mobileNavOpen}
      refreshing={refreshing}
      apiError={apiError}
      actionError={actionError}
      notice={notice}
      username={authenticatedUser}
      onPageChange={setPage}
      onRangeChange={setRange}
      onMobileNavChange={setMobileNavOpen}
      onRefresh={() => void refresh()}
      onCreateMonitor={openCreateDialog}
      onExport={exportCsv}
      onClearActionError={() => setActionError('')}
      onClearNotice={() => setNotice('')}
      onLogout={handleLogout}
      overlay={
        <>
          {dialogOpen && (
            <MonitorDialog
              key={editingMonitor?.id ?? 'new-monitor'}
              monitor={editingMonitor}
              saving={saving}
              error={actionError}
              onClose={() => { setDialogOpen(false); setEditingMonitor(null); }}
              onSave={(input) => void saveMonitor(input)}
            />
          )}
          {deleteMonitorTarget && (
            <DeleteMonitorDialog
              monitor={deleteMonitorTarget}
              deleting={deletingMonitorId === deleteMonitorTarget.id}
              error={deleteError}
              onClose={() => { setDeleteMonitorTarget(null); setDeleteError(''); }}
              onConfirm={() => void confirmDeleteMonitor()}
            />
          )}
          {historyMonitor && <HistoryDialog monitor={historyMonitor} range={range} onClose={() => setHistoryMonitor(null)} />}
        </>
      }
    >
      <PageContent
        page={page}
        range={range}
        report={report}
        selectedReport={selectedReport}
        monitors={monitors}
        incidents={incidents}
        activeIncidents={activeIncidents}
        loading={loading}
        monitorFilter={monitorFilter}
        search={search}
        checkingId={checkingId}
        setPage={setPage}
        setMonitorFilter={setMonitorFilter}
        setSearch={setSearch}
        openCreateDialog={openCreateDialog}
        openEditDialog={openEditDialog}
        deleteMonitor={(monitor) => { setDeleteError(''); setDeleteMonitorTarget(monitor); }}
        toggleMonitor={(monitor) => void toggleMonitor(monitor)}
        checkMonitor={(monitor) => void checkMonitor(monitor)}
        setHistoryMonitor={setHistoryMonitor}
        exportCsv={exportCsv}
      />
    </AppShell>
  );
}
