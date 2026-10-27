import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, LoaderCircle, Server, WifiOff } from 'lucide-react';
import type { Incident } from '../types/monitor';
import { formatDate, formatDuration } from '../utils/format';

export function MetricCard({ icon, label, value, note, color }: { icon: ReactNode; label: string; value: string; note: string; color: string }) {
  return (
    <article className={tw('metric-card')}>
      <div className={tw("metric-heading")}><span>{label}</span><span className={tw(`metric-icon ${color}-icon`)}>{icon}</span></div>
      <strong className={tw(`metric-value metric-value-${color}`)}>{value}</strong>
      <span className={tw("metric-note")}>{note}</span>
    </article>
  );
}

export function PanelHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <div className={tw("panel-heading panel-heading-bordered")}><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>;
}

export function IncidentRow({ incident, detailed = false }: { incident: Incident; detailed?: boolean }) {
  return (
    <article className={tw(`incident-row ${detailed ? 'incident-row-detailed' : ''}`)}>
      <span className={tw(`incident-icon ${incident.status === 'OPEN' ? 'incident-open' : 'incident-resolved'}`)}>{incident.status === 'OPEN' ? <WifiOff size={17} /> : <CheckCircle2 size={17} />}</span>
      <div className={tw("incident-content")}>
        <div className={tw("incident-title-line")}><strong>{incident.monitorName}</strong><span className={tw(`incident-state ${incident.status === 'OPEN' ? 'state-open' : 'state-resolved'}`)}>{incident.status === 'OPEN' ? 'ĐANG DIỄN RA' : 'ĐÃ KHÔI PHỤC'}</span></div>
        <a className={tw("monitor-url")} href={incident.monitorUrl} target="_blank" rel="noreferrer">{incident.monitorUrl}<ExternalLink size={11} /></a>
        {detailed && <p className={tw("incident-detail")}>{incident.status === 'OPEN' ? 'Website hiện vẫn không phản hồi.' : `Thời gian gián đoạn: ${formatDuration(incident.durationMs)}.`}</p>}
      </div>
      <div className={tw("incident-times")}><span><AlertTriangle size={13} /> Bắt đầu {formatDate(incident.startedAt)}</span><span>{incident.resolvedAt ? `Khôi phục ${formatDate(incident.resolvedAt)}` : `Đang gián đoạn · ${formatDuration(Date.now() - new Date(incident.startedAt).getTime())}`}</span></div>
    </article>
  );
}

export function LoadingRow() {
  return <div className={tw("loading-row")}><LoaderCircle size={18} className={tw("spin")} /> Đang tải dữ liệu…</div>;
}

export function CircleHelpIcon() {
  return <Server size={16} />;
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
  'metric-heading': 'flex items-center justify-between gap-2 font-mono text-[9px] tracking-[.055em] text-[#a8b6c9] max-[640px]:items-start max-[640px]:text-[8px] max-[640px]:leading-[1.5]',
  'metric-icon': 'grid size-[29px] shrink-0 place-items-center rounded-[7px] bg-[#243548] max-[640px]:size-[25px] [&_svg]:max-[640px]:w-[14px]',
  'green-icon': 'text-[#45cf91]',
  'blue-icon': 'text-[#61a8ff]',
  'amber-icon': 'text-[#f3c24f]',
  'purple-icon': 'text-[#b5a5ff]',
  'metric-value': 'mt-2 block text-2xl font-bold tracking-[-0.6px] text-[#eef3fa] max-[1100px]:text-[21px] max-[640px]:text-[19px]',
  'metric-note': 'mt-[3px] block text-[10px] text-[#9baabd] max-[640px]:text-[9px]',
  'panel-heading': 'flex min-h-[34px] items-start justify-between gap-[15px] [&_h2]:mb-0 [&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:tracking-[-0.15px] [&_h2]:text-[#edf2f9] [&_p]:mb-0 [&_p]:mt-1 [&_p]:text-[10px] [&_p]:text-[#97a6bb] max-[640px]:[&_h2]:text-[12px]',
  'panel-icon': 'grid size-[29px] shrink-0 place-items-center rounded-[7px] bg-[#243548]',
  'panel-heading-bordered': 'items-center border-b border-[#304055] px-[18px] pb-[15px] pt-[17px] [&_button]:min-h-[33px] max-[640px]:px-3 max-[640px]:pb-3 max-[640px]:pt-[14px] max-[640px]:[&>.button]:px-2 max-[640px]:[&>.button]:text-[9px] max-[640px]:[&>.text-button]:text-[9px]',
  'monitor-url': 'mt-1 inline-flex max-w-[260px] items-center gap-[5px] overflow-hidden text-[10px] text-ellipsis text-[#91a1b5] no-underline hover:text-[#71b9f5] [&_svg]:shrink-0',
  'loading-row': 'flex min-h-[150px] items-center justify-center gap-[10px] text-[12px] text-[#a0b0c3]',
  'incident-row': 'flex items-center gap-3 border-t border-[#2d3a4d] px-[18px] py-[14px] max-[640px]:items-start max-[640px]:p-3',
  'incident-row-detailed': 'px-[19px] py-[17px]',
  'incident-icon': 'grid size-[34px] shrink-0 place-items-center rounded-lg',
  'incident-open': 'bg-[#442b35] text-[#ff9299]',
  'incident-resolved': 'bg-[#203b34] text-[#5cdda4]',
  'incident-content': 'min-w-0 flex-1',
  'incident-title-line': 'flex items-center gap-[9px] max-[640px]:items-start max-[640px]:flex-col max-[640px]:gap-[5px] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:text-[11px] [&_strong]:text-[#e2eaf3] max-[640px]:[&_strong]:max-w-[175px]',
  'incident-state': 'rounded px-[5px] py-[3px] font-mono text-[8px]',
  'state-open': 'bg-[#482f37] text-[#ffa0a5]',
  'state-resolved': 'bg-[#203d34] text-[#72dfa9]',
  'incident-times': 'grid min-w-[185px] justify-items-end gap-[5px] text-right text-[9px] text-[#9aa9bc] max-[640px]:min-w-0 max-[640px]:text-[8px] [&_span:first-child]:flex [&_span:first-child]:items-center [&_span:first-child]:gap-1 max-[640px]:[&_span:first-child_svg]:hidden',
  'incident-detail': 'mt-[7px] text-[10px] text-[#aab7c8]',
};
