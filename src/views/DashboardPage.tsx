import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  HeartPulse,
  ShieldCheck,
} from 'lucide-react';
import { IncidentRow, LoadingRow, PanelHeading, MetricCard } from '../components/dashboard-widgets';
import { PerformanceChart, UptimeChart } from '../components/charts';
import { MonitorTable } from '../components/monitor-management';
import { formatDuration, formatMs, formatPercent } from '../utils/format';
import { rangeLabels } from '../utils/report';
import type { DashboardPageProps } from './types';
import { tw } from './tailwind';

// Tổng quan uptime, hiệu suất, trạng thái website và sự cố gần đây.
export default function DashboardPage({
  range,
  report,
  monitors,
  incidents,
  activeIncidents,
  loading,
  checkingId,
  setPage,
  openEditDialog,
  deleteMonitor,
  toggleMonitor,
  checkMonitor,
  setHistoryMonitor,
  isAdmin,
}: DashboardPageProps) {
  const enabledMonitorIds = new Set(monitors.filter((monitor) => monitor.enabled).map((monitor) => monitor.id));
  const monitoredIncidents = incidents.filter((incident) => enabledMonitorIds.has(incident.monitorId));

  return (
    <>
      <section className={tw('metric-grid')}>
        <MetricCard icon={<ShieldCheck size={17} />} label="UPTIME" value={formatPercent(report.summary.uptimePercent)} note={`${report.summary.totalChecks.toLocaleString('vi-VN')} lượt kiểm tra`} color="green" />
        <MetricCard icon={<Activity size={17} />} label="PHẢN HỒI TRUNG BÌNH" value={formatMs(report.summary.averageResponseTimeMs)} note={`Trong ${rangeLabels[range].toLowerCase()}`} color="blue" />
        <MetricCard icon={<AlertTriangle size={17} />} label="SỰ CỐ" value={String(monitoredIncidents.length)} note={`${activeIncidents} sự cố website`} color="amber" />
        <MetricCard icon={<Clock3 size={17} />} label="THỜI GIAN KHÔI PHỤC TB" value={formatDuration(report.summary.meanRecoveryTimeMs)} note="Các sự cố đã xử lý" color="purple" />
      </section>

      <section className={tw('monitor-status-strip')} aria-label="Số lượng website theo trạng thái">
        <div><span className={tw('strip-total')}>{monitors.filter((monitor) => monitor.enabled).length}</span><span>website theo dõi</span></div>
        <div><i className={tw('legend-dot legend-green')} /> <b>{report.summary.up}</b> UP</div>
        <div><i className={tw('legend-dot legend-amber')} /> <b>{report.summary.slow}</b> SLOW</div>
        <div><i className={tw('legend-dot legend-red')} /> <b>{report.summary.down}</b> DOWN</div>
        <div className={tw('strip-paused')}>{monitors.filter((monitor) => !monitor.enabled).length} đã tạm dừng</div>
      </section>

      <section className={tw('chart-grid')}>
        <article className={tw('panel chart-panel')}>
          <div className={tw('panel-heading')}><div><h2>Xu hướng thời gian phản hồi</h2><p>Đơn vị mili giây · {rangeLabels[range].toLowerCase()}</p></div><span className={tw('panel-icon blue-icon')}><Activity size={17} /></span></div>
          <PerformanceChart data={report.series} range={range} />
        </article>
        <article className={tw('panel chart-panel uptime-panel')}>
          <div className={tw('panel-heading')}><div><h2>Phân bố trạng thái</h2><p>Tình trạng kiểm tra mới nhất</p></div><span className={tw('panel-icon green-icon')}><HeartPulse size={17} /></span></div>
          <UptimeChart percent={report.summary.uptimePercent} up={report.summary.up} slow={report.summary.slow} down={report.summary.down} />
        </article>
      </section>

      <section className={tw('panel table-panel')}>
        <PanelHeading title="Hiệu suất website" subtitle="Trạng thái hiện tại và số liệu của khoảng thời gian đã chọn" action={<button className={tw('text-button')} onClick={() => setPage('monitors')}>Tất cả website <ArrowRight size={15} /></button>} />
        {loading ? <LoadingRow /> : (
          <MonitorTable
            monitors={monitors}
            reportRows={report.monitors}
            onEdit={openEditDialog}
            onDelete={deleteMonitor}
            onToggle={toggleMonitor}
            onCheck={checkMonitor}
            onHistory={setHistoryMonitor}
            checkingId={checkingId}
            compact
            readOnly={!isAdmin}
          />
        )}
      </section>

      <section className={tw('panel incidents-preview')}>
        <PanelHeading title="Sự cố gần đây" subtitle="Website DOWN và thời gian khôi phục" action={<button className={tw('text-button')} onClick={() => setPage('incidents')}>Xem lịch sử <ArrowRight size={15} /></button>} />
        {monitoredIncidents.length === 0 ? <div className={tw('empty-inline')}><CheckCircle2 size={17} /> Chưa ghi nhận sự cố nào từ các website đang được giám sát trong khoảng thời gian này.</div> : monitoredIncidents.slice(0, 3).map((incident) => <IncidentRow key={incident.id} incident={incident} />)}
      </section>
    </>
  );
}
