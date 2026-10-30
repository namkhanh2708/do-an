import { Activity, CheckCircle2, Clock3, WifiOff, Zap } from 'lucide-react';
import type { Incident, MonitorStatus, Report } from '../types/monitor';
import type { TimeRange } from '../types/app';
import { formatDuration, formatPercent, statusLabel } from '../utils/format';

// Nhãn trạng thái dùng chung trong bảng và báo cáo.
export function StatusBadge({ status }: { status: MonitorStatus }) {
  const Icon = status === 'UP' ? CheckCircle2 : status === 'DOWN' ? WifiOff : status === 'SLOW' ? Zap : Clock3;
  return (
    <span className={tw(`status-badge status-${status.toLowerCase()}`)}>
      <Icon size={13} />
      {statusLabel(status)}
    </span>
  );
}

// Biểu đồ thời gian phản hồi theo khoảng thời gian được chọn.
export function PerformanceChart({ data, range }: { data: Report['series']; range: TimeRange }) {
  const values = data
    .filter((point) => point.averageResponseTimeMs !== null)
    .map((point) => point.averageResponseTimeMs as number);

  if (!values.length) {
    return (
      <div className={tw("chart-empty")}>
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
    <div className={tw("chart-wrap")}>
      <svg className={tw("line-chart")} viewBox="0 0 580 220" role="img" aria-label="Biểu đồ thời gian phản hồi">
        {[0, 1, 2, 3].map((step) => {
          const y = 38 + step * 50;
          const label = Math.round(max - (step / 3) * (max - min));
          return (
            <g key={step}>
              <line x1="46" x2="558" y1={y} y2={y} className={tw("chart-gridline")} />
              <text x="0" y={y + 4} className={tw("chart-axis-label")}>{label} ms</text>
            </g>
          );
        })}
        {area && <polygon points={area} className={tw("chart-area")} />}
        {line && <polyline points={line} className={tw("chart-line")} />}
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="3.5" className={tw("chart-point")} />
        ))}
        {[0, Math.floor((data.length - 1) / 2), data.length - 1]
          .filter((index, position, indexes) => data.length > 1 && indexes.indexOf(index) === position)
          .map((index) => {
            const x = 46 + (index / Math.max(1, data.length - 1)) * 510;
            const label = new Intl.DateTimeFormat('vi-VN', range === '1d'
              ? { hour: '2-digit', minute: '2-digit' }
              : { day: '2-digit', month: '2-digit' }).format(new Date(data[index].timestamp));
            const anchor = index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle';
            return <text key={index} x={x} y="211" textAnchor={anchor} className={tw("chart-axis-label")}>{label}</text>;
          })}
      </svg>
      <div className={tw("chart-footnote")}>
        <span><i className={tw("legend-dot legend-blue")} /> Thời gian phản hồi trung bình</span>
        <span>{points.length} mốc dữ liệu</span>
      </div>
    </div>
  );
}

export interface OutageSelection {
  incidentIds: string[];
}

export function IncidentLogPanel({
  incidents,
  onSelect,
}: {
  incidents: Incident[];
  onSelect: (selection: OutageSelection) => void;
}) {
  const orderedIncidents = [...incidents]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  return (
    <div className={tw('incident-log-panel')}>
      {orderedIncidents.length === 0 ? (
        <div className={tw('incident-log-empty')}>
          <WifiOff size={20} />
          <span>Hiện không có website đang gặp sự cố.</span>
        </div>
      ) : (
      <div className={tw('incident-log-list')} role="list" aria-label="Lịch sử website gặp sự cố">
        {orderedIncidents.map((incident) => {
          const startedAt = new Date(incident.startedAt);
          const endedAt = incident.resolvedAt ? new Date(incident.resolvedAt) : new Date();
          const isOpen = incident.status === 'OPEN';
          const durationMs = incident.durationMs ?? endedAt.getTime() - startedAt.getTime();
          return (
            <div key={incident.id} role="listitem">
              <button
                type="button"
                className={tw(`incident-log-item ${isOpen ? 'incident-log-open' : 'incident-log-resolved'}`)}
                onClick={() => onSelect({ incidentIds: [incident.id] })}
                aria-label={`${incident.monitorName}, ${isOpen ? 'đang sập' : 'đã khôi phục'}, bắt đầu ${dateFormat.format(startedAt)}${incident.resolvedAt ? `, khôi phục ${dateFormat.format(endedAt)}` : ''}. Mở lịch sử sự cố`}
              >
                <span className={tw(`incident-log-indicator ${isOpen ? 'incident-log-indicator-open' : 'incident-log-indicator-resolved'}`)} />
                <span className={tw('incident-log-main')}>
                  <strong>{incident.monitorName}</strong>
                  <small>Bắt đầu · {dateFormat.format(startedAt)}</small>
                  {incident.resolvedAt && <small>Khôi phục · {dateFormat.format(endedAt)}</small>}
                </span>
                <span className={tw(`incident-log-status ${isOpen ? 'incident-log-status-open' : 'incident-log-status-resolved'}`)}>
                  {isOpen ? 'ĐANG SẬP' : 'ĐÃ KHÔI PHỤC'}
                </span>
                <span className={tw('incident-log-duration')}>{formatDuration(durationMs)}</span>
                <span className={tw('incident-log-arrow')} aria-hidden="true">›</span>
              </button>
            </div>
          );
        })}
      </div>
      )}
      <div className={tw('chart-footnote')}>
        <span><i className={tw('legend-dot legend-red')} /> Sự cố đang diễn ra</span>
        <span><i className={tw('legend-dot legend-green')} /> Đã khôi phục · Chọn một mục để xem lịch sử</span>
      </div>
    </div>
  );
}

// Biểu đồ tỷ lệ uptime và phân bố trạng thái kiểm tra.
export function UptimeChart({ percent, up, slow, down }: { percent: number | null; up: number; slow: number; down: number }) {
  const value = percent ?? 0;
  const circumference = 2 * Math.PI * 66;
  const dash = circumference * Math.min(100, Math.max(0, value)) / 100;
  return (
    <div className={tw("uptime-chart")}>
      <svg viewBox="0 0 180 180" role="img" aria-label={`Uptime ${formatPercent(percent)}`}>
        <circle cx="90" cy="90" r="66" className={tw("donut-track")} />
        {percent !== null && (
          <circle
            cx="90"
            cy="90"
            r="66"
            className={tw("donut-value")}
            strokeDasharray={`${dash} ${circumference}`}
            transform="rotate(-90 90 90)"
          />
        )}
        <text x="90" y="86" className={tw("donut-percent")}>{percent === null ? '—' : `${value.toFixed(1)}%`}</text>
        <text x="90" y="107" className={tw("donut-caption")}>UPTIME</text>
      </svg>
      <div className={tw("uptime-legend")}>
        <span><i className={tw("legend-dot legend-green")} /> UP <b>{up}</b></span>
        <span><i className={tw("legend-dot legend-amber")} /> Chậm <b>{slow}</b></span>
        <span><i className={tw("legend-dot legend-red")} /> DOWN <b>{down}</b></span>
      </div>
    </div>
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
  'metric-value-green': 'text-[#45cf91]',
  'metric-value-blue': 'text-[#61a8ff]',
  'metric-value-amber': 'text-[#f3c24f]',
  'metric-value-purple': '',
  'chart-wrap': 'mt-[15px] rounded-[7px] bg-[#263749] px-[9px] py-[7px] pb-[6px] max-[640px]:mt-3 max-[640px]:px-[5px]',
  'line-chart': 'block h-[188px] w-full overflow-visible max-[640px]:h-[166px]',
  'chart-gridline': 'stroke-[#3b4b5d] stroke [stroke-dasharray:3_4]',
  'chart-axis-label': 'fill-[#90a0b2] font-mono text-[9px]',
  'chart-line': 'fill-none stroke-[#31a8ed] [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.8]',
  'chart-area': 'fill-[#159bd31b]',
  'chart-point': 'fill-[#36b5fa] stroke-[#263749] [stroke-width:2]',
  'incident-log-panel': 'mt-[15px] overflow-hidden rounded-[9px] border border-[#304257] bg-[linear-gradient(145deg,#172536,#1d2c3d)] p-[10px]',
  'incident-log-list': 'grid max-h-[250px] gap-1.5 overflow-y-auto rounded-md pr-1 scrollbar-thin scrollbar-thumb-[#43556b] scrollbar-track-transparent',
  'incident-log-item': 'group flex w-full items-center gap-2.5 rounded-md border border-[#314257] bg-[#1a2a3c] px-3 py-2.5 text-left transition-[background,border-color] hover:border-[#536a82] hover:bg-[#24374b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#61a8ff]',
  'incident-log-open': 'border-l-2 border-l-[#fb6e75]',
  'incident-log-resolved': 'border-l-2 border-l-[#45cf91]',
  'incident-log-indicator': 'size-2.5 shrink-0 rounded-full',
  'incident-log-indicator-open': 'bg-[#fb6e75] shadow-[0_0_10px_#fb6e7570]',
  'incident-log-indicator-resolved': 'bg-[#45cf91]',
  'incident-log-main': 'grid min-w-0 flex-1 gap-1 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[11px] [&_strong]:font-semibold [&_strong]:text-[#e7edf6] [&_small]:text-[9px] [&_small]:text-[#97a8bc]',
  'incident-log-status': 'shrink-0 rounded-full px-2 py-1 text-[8px] font-semibold tracking-[.03em] max-[500px]:hidden',
  'incident-log-status-open': 'bg-[#472832] text-[#ff9da3]',
  'incident-log-status-resolved': 'bg-[#203c35] text-[#68e0a9]',
  'incident-log-duration': 'shrink-0 font-mono text-[9px] text-[#b2bfd0] max-[420px]:hidden',
  'incident-log-arrow': 'shrink-0 text-[20px] leading-none text-[#8193a9] transition-transform group-hover:translate-x-0.5 group-hover:text-white',
  'incident-log-empty': 'flex min-h-[150px] items-center justify-center gap-2 text-center text-[11px] text-[#93a4b8] [&_svg]:shrink-0 [&_svg]:text-[#77889d]',
  'chart-footnote': 'flex justify-between px-[10px] pb-[6px] pt-[8px] text-[9px] text-[#9baabe] [&_span:first-child]:flex [&_span:first-child]:items-center [&_span:first-child]:gap-[6px]',
  'legend-dot': 'inline-block size-2 shrink-0 rounded-full',
  'legend-blue': 'bg-[#34aef1]',
  'legend-green': 'bg-[#45cf91]',
  'legend-amber': 'bg-[#f3c24f]',
  'legend-red': 'bg-[#fb6e75]',
  'uptime-chart': 'mt-[5px] flex min-h-[215px] flex-1 flex-col items-center justify-center gap-px rounded-[7px] bg-[#263749] max-[640px]:min-h-[185px] [&_svg]:size-[171px] [&_svg]:overflow-visible [&_svg]:max-[640px]:size-[148px]',
  'donut-track': 'fill-none stroke-[#394b5e] [stroke-width:18]',
  'donut-value': 'fill-none stroke-[#14b889] [stroke-linecap:round] [stroke-width:18]',
  'donut-percent': 'fill-[#e9f2fa] text-[22px] font-bold [text-anchor:middle]',
  'donut-caption': 'fill-[#9aaabc] font-mono text-[8px] tracking-[.1em] [text-anchor:middle]',
  'uptime-legend': 'flex justify-center gap-[17px] px-[5px] pb-[10px] text-[9px] text-[#a3b0c1] max-[640px]:gap-[11px] max-[640px]:text-[8px] [&_span]:flex [&_span]:items-center [&_span]:gap-[5px] [&_b]:font-mono [&_b]:font-medium [&_b]:text-[#e1e8f1]',
  'chart-empty': 'flex min-h-[220px] flex-col items-center justify-center gap-3 text-center text-[11px] text-[#93a4b8] [&_svg]:text-[#77889d]',
  'favicon-up': 'border-[#33745b] bg-[#203c35] text-[#45cf91]',
  'favicon-down': 'border-[#76464e] bg-[#412b34] text-[#fb6e75]',
  'favicon-slow': 'border-[#77633f] bg-[#40372b] text-[#f3c24f]',
  'favicon-unknown': '',
  'status-badge': 'inline-flex items-center gap-[5px] rounded-[5px] border px-[7px] py-[5px] text-[10px]',
  'status-up': 'border-[#2c634f] bg-[#1f3a34] text-[#5fdda6]',
  'status-down': 'border-[#74424a] bg-[#412a33] text-[#ff9299]',
  'status-slow': 'border-[#73603c] bg-[#3e3728] text-[#f2cd68]',
  'status-unknown': 'border-[#425166] bg-[#2a3747] text-[#aebacc]',
  'status-cell': 'flex items-center gap-[7px]',
};
