import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock3,
  Download,
  ExternalLink,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { MetricCard, PanelHeading } from '../components/dashboard-widgets';
import { PerformanceChart, StatusBadge } from '../components/charts';
import { formatDuration, formatMs, formatPercent } from '../utils/format';
import { rangeLabels } from '../utils/report';
import type { ReportsPageProps } from './types';
import { tw } from './tailwind';
import { useLanguage } from '../i18n';

// Xem thống kê theo khoảng thời gian và xuất báo cáo CSV.
export default function ReportsPage({
  range,
  report,
  selectedReport,
  monitors,
  monitorFilter,
  setMonitorFilter,
  exportCsv,
}: ReportsPageProps) {
  const { t, language } = useLanguage();
  return (
    <>
      <div className={tw('report-filter-row')}>
        <label className={tw('range-select')}>
          <Search size={15} />
          <select aria-label={t('Lọc website')} value={monitorFilter} onChange={(event) => setMonitorFilter(event.target.value)}>
            <option value="">{t('Tất cả website')}</option>
            {monitors.map((monitor) => <option key={monitor.id} value={monitor.id}>{monitor.name}</option>)}
          </select>
        </label>
        <button className={tw('button button-secondary')} onClick={exportCsv}><Download size={15} /> {t('Xuất báo cáo CSV')}</button>
      </div>

      <section className={tw('metric-grid report-metrics')}>
        <MetricCard icon={<ShieldCheck size={17} />} label={t('UPTIME')} value={formatPercent(report.summary.uptimePercent)} note={t(rangeLabels[range])} color="green" />
        <MetricCard icon={<Activity size={17} />} label={t('PHẢN HỒI TRUNG BÌNH')} value={formatMs(report.summary.averageResponseTimeMs)} note={`${report.summary.totalChecks.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} ${t('lượt kiểm tra')}`} color="blue" />
        <MetricCard icon={<AlertTriangle size={17} />} label={t('SỰ CỐ')} value={String(report.summary.incidentCount)} note={t('Trong khoảng đã chọn')} color="amber" />
        <MetricCard icon={<Clock3 size={17} />} label={t('THỜI GIAN KHÔI PHỤC TB')} value={formatDuration(report.summary.meanRecoveryTimeMs, language)} note={t('Các sự cố đã xử lý')} color="purple" />
      </section>

      <section className={tw('panel chart-panel report-chart')}>
        <div className={tw('panel-heading')}><div><h2>{t('Thời gian phản hồi theo thời gian')}</h2><p>{t('Chỉ tính các lượt kiểm tra phản hồi thành công')}</p></div></div>
        <PerformanceChart data={report.series} range={range} />
      </section>

      <section className={tw('panel table-panel')}>
        <PanelHeading title={t('Hiệu suất từng website')} subtitle={t('Thống kê uptime, độ trễ và sự cố')} />
        {selectedReport.monitors.length === 0 ? (
          <div className={tw('empty-state table-empty')}>
            <BarChart3 size={28} />
            <h3>{t('Chưa có dữ liệu báo cáo')}</h3>
            <p>{t('Thêm website và đợi các lượt kiểm tra để xem báo cáo.')}</p>
          </div>
        ) : (
          <div className={tw('table-scroll')}>
            <table>
              <thead><tr><th>{t('WEBSITE')}</th><th>UPTIME</th><th>{t('PHẢN HỒI TB')}</th><th>{t('TRẠNG THÁI')}</th><th>{t('KIỂM TRA')}</th><th>{t('SỰ CỐ')}</th></tr></thead>
              <tbody>
                {selectedReport.monitors.map((monitor) => (
                  <tr key={monitor.id}>
                    <td><strong>{monitor.name}</strong><a className={tw('monitor-url')} href={monitor.url} target="_blank" rel="noreferrer">{monitor.url}<ExternalLink size={11} /></a></td>
                    <td className={tw('uptime-cell')}>{formatPercent(monitor.uptimePercent)}</td>
                    <td className={tw('number-cell')}>{formatMs(monitor.averageResponseTimeMs)}</td>
                    <td><StatusBadge status={monitor.status} /></td>
                    <td>{monitor.checks.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</td>
                    <td>{monitor.incidents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
