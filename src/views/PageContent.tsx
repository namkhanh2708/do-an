import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  HeartPulse,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { IncidentRow, LoadingRow, PanelHeading, MetricCard } from '../components/dashboard-widgets';
import { PerformanceChart, StatusBadge, UptimeChart } from '../components/charts';
import { MonitorTable } from '../components/monitor-management';
import type { Page, TimeRange } from '../types/app';
import type { Incident, Monitor, Report } from '../types/monitor';
import { formatDuration, formatMs, formatPercent } from '../utils/format';
import { rangeLabels } from '../utils/report';

interface PageContentProps {
  page: Page;
  range: TimeRange;
  report: Report;
  selectedReport: Report;
  monitors: Monitor[];
  incidents: Incident[];
  activeIncidents: number;
  loading: boolean;
  monitorFilter: string;
  search: string;
  checkingId: string | null;
  setPage: (page: Page) => void;
  setMonitorFilter: (monitorId: string) => void;
  setSearch: (query: string) => void;
  openCreateDialog: () => void;
  openEditDialog: (monitor: Monitor) => void;
  deleteMonitor: (monitor: Monitor) => void;
  toggleMonitor: (monitor: Monitor) => void;
  checkMonitor: (monitor: Monitor) => void;
  setHistoryMonitor: (monitor: Monitor) => void;
  exportCsv: () => void;
}

export default function PageContent(props: PageContentProps) {
  const {
    page,
    range,
    report,
    selectedReport,
    monitors,
    incidents,
    activeIncidents,
    loading,
    monitorFilter,
    search,
    checkingId,
    setPage,
    setMonitorFilter,
    setSearch,
    openCreateDialog,
    openEditDialog,
    deleteMonitor,
    toggleMonitor,
    checkMonitor,
    setHistoryMonitor,
    exportCsv,
  } = props;

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  const openIncidents = incidents.filter((incident) => incident.status === 'OPEN');
  const resolvedIncidents = incidents.filter((incident) => incident.status === 'RESOLVED');

  const filteredIncidents = incidents.filter((incident) => {
    if (statusFilter === 'OPEN' && incident.status !== 'OPEN') return false;
    if (statusFilter === 'RESOLVED' && incident.status !== 'RESOLVED') return false;
    if (monitorFilter && incident.monitorId !== monitorFilter) return false;
    return true;
  });

  return (
    <>
      {page === 'dashboard' && (
            <>
              <section className={tw("metric-grid")}>
                <MetricCard icon={<ShieldCheck size={17} />} label="UPTIME" value={formatPercent(report.summary.uptimePercent)} note={`${report.summary.totalChecks.toLocaleString('vi-VN')} lượt kiểm tra`} color="green" />
                <MetricCard icon={<Activity size={17} />} label="PHẢN HỒI TRUNG BÌNH" value={formatMs(report.summary.averageResponseTimeMs)} note={`Trong ${rangeLabels[range].toLowerCase()}`} color="blue" />
                <MetricCard icon={<AlertTriangle size={17} />} label="SỰ CỐ" value={String(report.summary.incidentCount)} note={`${activeIncidents} sự cố đang mở`} color="amber" />
                <MetricCard icon={<Clock3 size={17} />} label="THỜI GIAN KHÔI PHỤC TB" value={formatDuration(report.summary.meanRecoveryTimeMs)} note="Các sự cố đã xử lý" color="purple" />
              </section>

              <section className={tw("monitor-status-strip")} aria-label="Số lượng website theo trạng thái">
                <div><span className={tw("strip-total")}>{monitors.filter((monitor) => monitor.enabled).length}</span><span>website theo dõi</span></div>
                <div><i className={tw("legend-dot legend-green")} /> <b>{report.summary.up}</b> UP</div>
                <div><i className={tw("legend-dot legend-amber")} /> <b>{report.summary.slow}</b> SLOW</div>
                <div><i className={tw("legend-dot legend-red")} /> <b>{report.summary.down}</b> DOWN</div>
                <div className={tw("strip-paused")}>{monitors.filter((monitor) => !monitor.enabled).length} đã tạm dừng</div>
              </section>

              <section className={tw("chart-grid")}>
                <article className={tw("panel chart-panel")}>
                  <div className={tw("panel-heading")}><div><h2>Xu hướng thời gian phản hồi</h2><p>Đơn vị mili giây · {rangeLabels[range].toLowerCase()}</p></div><span className={tw("panel-icon blue-icon")}><Activity size={17} /></span></div>
                  <PerformanceChart data={report.series} range={range} />
                </article>
                <article className={tw("panel chart-panel uptime-panel")}>
                  <div className={tw("panel-heading")}><div><h2>Phân bố trạng thái</h2><p>Tình trạng kiểm tra mới nhất</p></div><span className={tw("panel-icon green-icon")}><HeartPulse size={17} /></span></div>
                  <UptimeChart percent={report.summary.uptimePercent} up={report.summary.up} slow={report.summary.slow} down={report.summary.down} />
                </article>
              </section>

              <section className={tw("panel table-panel")}>
                <PanelHeading title="Hiệu suất website" subtitle="Trạng thái hiện tại và số liệu của khoảng thời gian đã chọn" action={<button className={tw("text-button")} onClick={() => setPage('monitors')}>Tất cả website <ArrowRight size={15} /></button>} />
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

              <section className={tw("panel incidents-preview")}>
                <PanelHeading title="Sự cố gần đây" subtitle="Website DOWN và thời gian khôi phục" action={<button className={tw("text-button")} onClick={() => setPage('incidents')}>Xem lịch sử <ArrowRight size={15} /></button>} />
                {incidents.length === 0 ? <div className={tw("empty-inline")}><CheckCircle2 size={17} /> Chưa ghi nhận sự cố nào trong khoảng thời gian này.</div> : incidents.slice(0, 3).map((incident) => <IncidentRow key={incident.id} incident={incident} />)}
              </section>
            </>
          )}

          {page === 'monitors' && (
            <section className={tw("panel table-panel full-table-panel")}>
              <PanelHeading title="Danh sách website" subtitle="Quản lý URL, tần suất kiểm tra và trạng thái giám sát" action={<button className={tw("button button-primary")} onClick={openCreateDialog}><Plus size={15} /> Thêm website</button>} />
              {loading ? <LoadingRow /> : <MonitorTable monitors={monitors} reportRows={report.monitors} search={search} onSearch={setSearch} onEdit={openEditDialog} onDelete={(monitor) => void deleteMonitor(monitor)} onToggle={(monitor) => void toggleMonitor(monitor)} onCheck={(monitor) => void checkMonitor(monitor)} onHistory={setHistoryMonitor} checkingId={checkingId} />}
            </section>
          )}

          {page === 'incidents' && (
            <section className={tw("panel incidents-panel")}>
              <div className={tw("incidents-header-wrap")}>
                <PanelHeading
                  title="Nhật ký gián đoạn"
                  subtitle={`${incidents.length} sự cố trong ${rangeLabels[range].toLowerCase()}`}
                  action={
                    monitors.length > 0 && (
                      <div className={tw("incidents-filter-group")}>
                        <label className={tw("range-select incidents-select")}>
                          <Search size={14} />
                          <select
                            aria-label="Lọc theo website"
                            value={monitorFilter}
                            onChange={(event) => setMonitorFilter(event.target.value)}
                          >
                            <option value="">Tất cả website ({monitors.length})</option>
                            {monitors.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    )
                  }
                />

                {incidents.length > 0 && (
                  <div className={tw("incidents-tabs-bar")}>
                    <div className={tw("incidents-tabs")}>
                      <button
                        type="button"
                        className={tw(`incident-tab ${statusFilter === 'ALL' ? 'tab-active' : ''}`)}
                        onClick={() => setStatusFilter('ALL')}
                      >
                        Tất cả <span className={tw("tab-count")}>{incidents.length}</span>
                      </button>
                      <button
                        type="button"
                        className={tw(`incident-tab ${statusFilter === 'OPEN' ? 'tab-active tab-active-open' : ''}`)}
                        onClick={() => setStatusFilter('OPEN')}
                      >
                        <span className={tw("status-tab-dot dot-open")} />
                        Đang diễn ra <span className={tw("tab-count count-open")}>{openIncidents.length}</span>
                      </button>
                      <button
                        type="button"
                        className={tw(`incident-tab ${statusFilter === 'RESOLVED' ? 'tab-active tab-active-resolved' : ''}`)}
                        onClick={() => setStatusFilter('RESOLVED')}
                      >
                        <span className={tw("status-tab-dot dot-resolved")} />
                        Đã khôi phục <span className={tw("tab-count")}>{resolvedIncidents.length}</span>
                      </button>
                    </div>

                    {monitorFilter && (
                      <button
                        type="button"
                        className={tw("incident-filter-clear")}
                        onClick={() => setMonitorFilter('')}
                      >
                        Xóa lọc website
                      </button>
                    )}
                  </div>
                )}
              </div>

              {loading ? (
                <LoadingRow />
              ) : filteredIncidents.length === 0 ? (
                <div className={tw("empty-state incident-empty")}>
                  <CheckCircle2 size={30} />
                  <h3>
                    {incidents.length === 0
                      ? 'Không có sự cố'
                      : 'Không có sự cố phù hợp với bộ lọc'}
                  </h3>
                  <p>
                    {incidents.length === 0
                      ? 'Các website đang được theo dõi chưa ghi nhận trạng thái DOWN trong khoảng thời gian này.'
                      : 'Thử chuyển tab trạng thái hoặc chọn website khác để xem danh sách sự cố.'}
                  </p>
                </div>
              ) : (
                <div className={tw("incidents-list")}>
                  {filteredIncidents.map((incident) => (
                    <IncidentRow key={incident.id} incident={incident} detailed />
                  ))}
                </div>
              )}
            </section>
          )}

          {page === 'reports' && (
            <>
              <div className={tw("report-filter-row")}>
                <label className={tw("range-select")}><Search size={15} /><select aria-label="Lọc website" value={monitorFilter} onChange={(event) => setMonitorFilter(event.target.value)}><option value="">Tất cả website</option>{monitors.map((monitor) => <option key={monitor.id} value={monitor.id}>{monitor.name}</option>)}</select></label>
                <button className={tw("button button-secondary")} onClick={exportCsv}><Download size={15} /> Xuất báo cáo CSV</button>
              </div>
              <section className={tw("metric-grid report-metrics")}>
                <MetricCard icon={<ShieldCheck size={17} />} label="UPTIME" value={formatPercent(report.summary.uptimePercent)} note={rangeLabels[range]} color="green" />
                <MetricCard icon={<Activity size={17} />} label="PHẢN HỒI TRUNG BÌNH" value={formatMs(report.summary.averageResponseTimeMs)} note={`${report.summary.totalChecks} lượt kiểm tra`} color="blue" />
                <MetricCard icon={<AlertTriangle size={17} />} label="SỰ CỐ" value={String(report.summary.incidentCount)} note="Trong khoảng đã chọn" color="amber" />
                <MetricCard icon={<Clock3 size={17} />} label="THỜI GIAN KHÔI PHỤC TB" value={formatDuration(report.summary.meanRecoveryTimeMs)} note="Các sự cố đã xử lý" color="purple" />
              </section>
              <section className={tw("panel chart-panel report-chart")}>
                <div className={tw("panel-heading")}><div><h2>Thời gian phản hồi theo thời gian</h2><p>Chỉ tính các lượt kiểm tra phản hồi thành công</p></div></div>
                <PerformanceChart data={report.series} range={range} />
              </section>
              <section className={tw("panel table-panel")}>
                <PanelHeading title="Hiệu suất từng website" subtitle="Thống kê uptime, độ trễ và sự cố" />
                {selectedReport.monitors.length === 0 ? <div className={tw("empty-state table-empty")}><BarChart3 size={28} /><h3>Chưa có dữ liệu báo cáo</h3><p>Thêm website và đợi các lượt kiểm tra để xem báo cáo.</p></div> : (
                  <div className={tw("table-scroll")}><table><thead><tr><th>WEBSITE</th><th>UPTIME</th><th>PHẢN HỒI TB</th><th>TRẠNG THÁI</th><th>KIỂM TRA</th><th>SỰ CỐ</th></tr></thead><tbody>{selectedReport.monitors.map((monitor) => <tr key={monitor.id}><td><strong>{monitor.name}</strong><a className={tw("monitor-url")} href={monitor.url} target="_blank" rel="noreferrer">{monitor.url}<ExternalLink size={11} /></a></td><td className={tw("uptime-cell")}>{formatPercent(monitor.uptimePercent)}</td><td className={tw("number-cell")}>{formatMs(monitor.averageResponseTimeMs)}</td><td><StatusBadge status={monitor.status} /></td><td>{monitor.checks.toLocaleString('vi-VN')}</td><td>{monitor.incidents}</td></tr>)}</tbody></table></div>
                )}
              </section>
            </>
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
  'button-secondary': 'border-[#35445a] bg-[#202d3f] text-[#dae3ef]',
  'range-select': 'inline-flex min-h-9 items-center gap-2 rounded-[7px] border border-[#34445a] bg-[#1b293b] px-[10px] text-[#aab8ca] max-[640px]:min-h-[34px] [&_select]:max-w-[155px] [&_select]:cursor-pointer [&_select]:border-0 [&_select]:bg-transparent [&_select]:text-[11px] [&_select]:text-[#dfe7f2] [&_option]:bg-[#1b293b]',
  'metric-grid': 'mb-[17px] grid grid-cols-4 gap-[14px] max-[1100px]:gap-[10px] max-[640px]:mb-3 max-[640px]:grid-cols-2 max-[640px]:gap-[9px]',
  'metric-value-green': 'text-[#45cf91]',
  'metric-value-blue': 'text-[#61a8ff]',
  'metric-value-amber': 'text-[#f3c24f]',
  'metric-value-purple': '',
  'green-icon': 'text-[#45cf91]',
  'blue-icon': 'text-[#61a8ff]',
  'monitor-status-strip': 'my-[17px] -mt-1 flex min-h-[47px] items-center gap-[25px] rounded-[7px] border border-[#2c3b4e] bg-[#182536] px-[15px] text-[10px] text-[#aab7c8] max-[640px]:my-[13px] max-[640px]:-mt-0.5 max-[640px]:min-h-[43px] max-[640px]:gap-3 max-[640px]:overflow-x-auto max-[640px]:whitespace-nowrap max-[640px]:px-[10px] [&>div]:flex [&>div]:items-center [&>div]:gap-[7px] [&_b]:font-mono [&_b]:font-medium [&_b]:text-[#e0e8f2]',
  'strip-total': 'font-mono text-[15px] font-semibold text-[#eef4fb]',
  'strip-paused': 'ml-auto text-[#8292a6] max-[640px]:hidden',
  'chart-grid': 'mb-[17px] grid grid-cols-[1.1fr_1fr] gap-4 max-[850px]:grid-cols-1 max-[640px]:mb-3 max-[640px]:gap-[11px]',
  'chart-panel': 'min-h-[293px] p-[17px_18px_13px] max-[850px]:min-h-[270px] max-[640px]:min-h-[248px] max-[640px]:p-[14px_12px_10px]',
  'panel-heading': 'flex min-h-[34px] items-start justify-between gap-[15px] [&_h2]:mb-0 [&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:tracking-[-0.15px] [&_h2]:text-[#edf2f9] [&_p]:mb-0 [&_p]:mt-1 [&_p]:text-[10px] [&_p]:text-[#97a6bb] max-[640px]:[&_h2]:text-[12px]',
  'panel-icon': 'grid size-[29px] shrink-0 place-items-center rounded-[7px] bg-[#243548]',
  'legend-dot': 'inline-block size-2 shrink-0 rounded-full',
  'legend-green': 'bg-[#45cf91]',
  'legend-amber': 'bg-[#f3c24f]',
  'legend-red': 'bg-[#fb6e75]',
  'uptime-panel': 'flex flex-col',
  'table-panel': 'mb-[17px] overflow-hidden',
  'text-button': 'inline-flex items-center gap-[6px] border-0 bg-transparent text-[11px] text-[#64aeef] hover:text-[#9ccfff]',
  'table-scroll': 'w-full overflow-x-auto max-[640px]:[&_th]:px-[11px] max-[640px]:[&_th]:py-[10px] max-[640px]:[&_th]:text-[8px] max-[640px]:[&_td]:px-[11px] max-[640px]:[&_td]:py-[10px] max-[640px]:[&_td]:text-[10px] [&_td_strong]:block [&_td_strong]:text-[11px] [&_td_strong]:font-semibold [&_td_strong]:text-[#e5ebf4]',
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
  'number-cell': 'font-mono text-[10px]',
  'uptime-cell': 'font-mono text-[10px] text-[#45cf91]',
  'empty-state': 'flex min-h-[210px] flex-col items-center justify-center p-6 text-center text-[#8394a9] [&>svg]:text-[#63768d] [&_h3]:mb-[5px] [&_h3]:mt-[13px] [&_h3]:text-[13px] [&_h3]:text-[#dce5f0] [&_p]:mb-0 [&_p]:max-w-[350px] [&_p]:text-[11px] [&_p]:leading-[1.6] [&_p]:text-[#94a4b8]',
  'table-empty': 'min-h-[185px]',
  'full-table-panel': 'min-h-[300px]',
  'incidents-preview': 'mb-[17px] overflow-hidden rounded-lg border border-[#2c3b4e] bg-[#1c293a]',
  'incidents-panel': 'mb-[17px] overflow-hidden rounded-lg border border-[#2c3b4e] bg-[#1c293a]',
  'empty-inline': 'flex items-center gap-2 px-[18px] py-[17px] text-[11px] text-[#9fb2c5] [&_svg]:text-[#45cf91]',
  'incident-empty': 'min-h-[250px] [&>svg]:text-[#45cf91]',
  'report-filter-row': 'mb-[15px] mt-[-5px] flex justify-end gap-[10px] max-[640px]:justify-between max-[640px]:[&_button]:min-h-[34px] max-[640px]:[&_button]:px-2 max-[640px]:[&_button]:text-[10px]',
  'report-metrics': 'mt-0',
  'report-chart': 'mb-[17px]',

  // Incidents panel specific layout classes
  'incidents-header-wrap': 'border-b border-[#2c3b4e]',
  'incidents-filter-group': 'flex items-center gap-2',
  'incidents-select': 'max-[640px]:w-full',
  'incidents-tabs-bar': 'flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-[#172333]/90 border-t border-[#26374a] max-[640px]:p-3',
  'incidents-tabs': 'flex items-center gap-1.5 overflow-x-auto whitespace-nowrap',
  'incident-tab': 'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium text-[#9cb0c6] hover:bg-[#202f43] hover:text-[#e2eaf4] transition-colors border-0 bg-transparent cursor-pointer',
  'tab-active': 'bg-[#22354c] text-[#ffffff] shadow-sm',
  'tab-active-open': 'bg-[#3b232a] text-[#ffa0a5]',
  'tab-active-resolved': 'bg-[#19372e] text-[#63e2a9]',
  'tab-count': 'rounded-full bg-[#131f2d] px-1.5 py-0.5 font-mono text-[9px] text-[#8fa2b8]',
  'count-open': 'bg-[#50232b] text-[#ff9299]',
  'status-tab-dot': 'size-2 rounded-full inline-block shrink-0',
  'dot-open': 'bg-[#ff9299]',
  'dot-resolved': 'bg-[#45cf91]',
  'incident-filter-clear': 'text-[11px] text-[#61a8ff] hover:underline bg-transparent border-0 cursor-pointer p-0',
  'incidents-list': 'flex flex-col',
};
