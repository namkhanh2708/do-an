import type { ReactNode } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  HelpCircle,
  LoaderCircle,
  Server,
  Sparkles,
  WifiOff,
  Wrench,
} from 'lucide-react';
import type { Diagnosis, Incident } from '../types/monitor';
import { formatDate, formatDuration } from '../utils/format';

// Thẻ chỉ số dùng ở Dashboard và Báo cáo.
export function MetricCard({ icon, label, value, note, color }: { icon: ReactNode; label: string; value: string; note: string; color: string }) {
  return (
    <article className={tw('metric-card')}>
      <div className={tw("metric-heading")}><span>{label}</span><span className={tw(`metric-icon ${color}-icon`)}>{icon}</span></div>
      <strong className={tw(`metric-value metric-value-${color}`)}>{value}</strong>
      <span className={tw("metric-note")}>{note}</span>
    </article>
  );
}

// Tiêu đề chuẩn hóa cho các khu vực nội dung.
export function PanelHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <div className={tw("panel-heading panel-heading-bordered")}><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>;
}

// Hiển thị bằng chứng, nguyên nhân và hướng xử lý sự cố.
export function DiagnosisPanel({
  diagnosis,
  compact = false,
}: {
  diagnosis?: Diagnosis | null;
  compact?: boolean;
}) {
  return (
    <section
      className={tw(`diagnosis-panel ${compact ? 'diagnosis-panel-compact' : ''}`)}
      aria-label="Phân tích dấu hiệu sự cố"
    >
      <div className={tw("diagnosis-title-bar")}>
        <div className={tw("diagnosis-title-group")}>
          <Sparkles size={14} className={tw("diagnosis-sparkle-icon")} />
          <h3>Phân tích nguyên nhân sự cố · Incident Diagnosis</h3>
        </div>
        <span className={tw("diagnosis-badge")}>Tự động chẩn đoán</span>
      </div>

      {!diagnosis ? (
        <div className={tw("diagnosis-empty-box")}>
          <AlertCircle size={15} />
          <p>Chưa có dữ liệu chẩn đoán chi tiết cho lần kiểm tra này.</p>
        </div>
      ) : (
        <div className={tw(compact ? "diagnosis-grid-compact" : "diagnosis-grid")}>
          {/* Box 1: Dấu hiệu đã quan sát */}
          <div className={tw("diagnosis-box")}>
            <div className={tw("diagnosis-box-header")}>
              <Eye size={13} className={tw("text-[#61a8ff] shrink-0")} />
              <h4>Dấu hiệu đã quan sát · Evidence</h4>
            </div>
            <ul className={tw("diagnosis-list")}>
              {diagnosis.evidence.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Box 2: Nguyên nhân có thể */}
          <div className={tw("diagnosis-box")}>
            <div className={tw("diagnosis-box-header")}>
              <HelpCircle size={13} className={tw("text-[#f3c24f] shrink-0")} />
              <h4>Nguyên nhân có thể · Suspected</h4>
            </div>
            <ul className={tw("diagnosis-list")}>
              {diagnosis.possibleCauses.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ul>
            {diagnosis.confidenceNote && (
              <p className={tw("diagnosis-note")}>{diagnosis.confidenceNote}</p>
            )}
          </div>

          {/* Box 3: Hướng khắc phục đề xuất */}
          <div className={tw("diagnosis-box")}>
            <div className={tw("diagnosis-box-header")}>
              <Wrench size={13} className={tw("text-[#45cf91] shrink-0")} />
              <h4>Hướng xử lý đề xuất · Actions</h4>
            </div>
            <ol className={tw("diagnosis-ordered-list")}>
              {diagnosis.recommendedActions.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

// Tóm tắt một sự cố đang mở hoặc đã được khôi phục.
export function IncidentRow({ incident, detailed = false }: { incident: Incident; detailed?: boolean }) {
  const isOpen = incident.status === 'OPEN';
  const duration = incident.durationMs != null
    ? formatDuration(incident.durationMs)
    : formatDuration(Date.now() - new Date(incident.startedAt).getTime());

  return (
    <article
      className={tw(
        `incident-row ${detailed ? 'incident-row-detailed' : ''} ${isOpen ? 'incident-row-open' : 'incident-row-resolved'}`
      )}
    >
      <div className={tw("incident-main")}>
        <span className={tw(`incident-icon ${isOpen ? 'incident-open' : 'incident-resolved'}`)}>
          {isOpen ? <WifiOff size={18} /> : <CheckCircle2 size={18} />}
        </span>

        <div className={tw("incident-content")}>
          <div className={tw("incident-title-line")}>
            <strong className={tw("incident-name")}>{incident.monitorName}</strong>
            <span className={tw(`incident-state ${isOpen ? 'state-open' : 'state-resolved'}`)}>
              {isOpen ? 'ĐANG DIỄN RA' : 'ĐÃ KHÔI PHỤC'}
            </span>
          </div>

          <a className={tw("monitor-url")} href={incident.monitorUrl} target="_blank" rel="noreferrer">
            <span>{incident.monitorUrl}</span>
            <ExternalLink size={11} />
          </a>

          {detailed && (
            <p className={tw(`incident-detail ${isOpen ? 'detail-open' : 'detail-resolved'}`)}>
              {isOpen ? (
                <>Website hiện vẫn chưa phản hồi · Đang gián đoạn {duration}</>
              ) : (
                <>Thời gian gián đoạn: <strong>{duration}</strong></>
              )}
            </p>
          )}
        </div>

        <div className={tw("incident-times")}>
          <div className={tw("incident-time-entry")}>
            <AlertTriangle size={13} className={tw("time-icon-alert")} />
            <span>Bắt đầu {formatDate(incident.startedAt)}</span>
          </div>
          <div className={tw("incident-time-entry")}>
            {isOpen ? (
              <WifiOff size={13} className={tw("time-icon-open")} />
            ) : (
              <CheckCircle2 size={13} className={tw("time-icon-resolved")} />
            )}
            <span className={tw(isOpen ? "time-text-open" : "time-text-resolved")}>
              {incident.resolvedAt
                ? `Khôi phục ${formatDate(incident.resolvedAt)}`
                : `Đang gián đoạn · ${duration}`}
            </span>
          </div>
        </div>
      </div>

      {detailed && <DiagnosisPanel diagnosis={incident.diagnosis} />}
    </article>
  );
}

// Trạng thái chờ dữ liệu của các bảng.
export function LoadingRow() {
  return <div className={tw("loading-row")}><LoaderCircle size={18} className={tw("spin")} /> Đang tải dữ liệu…</div>;
}

// Biểu tượng trợ giúp về trạng thái hệ thống.
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
  'monitor-url': 'mt-1 inline-flex max-w-full items-center gap-[6px] overflow-hidden text-[11px] text-[#8fa1b6] no-underline hover:text-[#61a8ff] [&_span]:truncate [&_svg]:shrink-0',
  'loading-row': 'flex min-h-[150px] items-center justify-center gap-[10px] text-[12px] text-[#a0b0c3]',

  // Incident row layout and styling
  'incident-row': 'flex w-full flex-col border-t border-[#2d3a4d] px-[18px] py-[15px] transition-colors hover:bg-[#1f2d3f]/40',
  'incident-row-detailed': 'p-[20px] max-[640px]:p-[14px]',
  'incident-row-open': 'bg-[#291a21]/20 border-l-[3px] border-l-[#ff9299]',
  'incident-row-resolved': 'border-l-[3px] border-l-transparent',
  'incident-main': 'flex w-full items-start justify-between gap-4 max-[720px]:flex-col max-[720px]:gap-3',
  'incident-icon': 'grid size-[36px] shrink-0 place-items-center rounded-lg max-[640px]:size-[32px]',
  'incident-open': 'bg-[#442b35] text-[#ff9299] border border-[#ff9299]/30 shadow-sm',
  'incident-resolved': 'bg-[#203b34] text-[#5cdda4] border border-[#5cdda4]/30 shadow-sm',
  'incident-content': 'min-w-0 flex-1 max-[720px]:w-full',
  'incident-title-line': 'flex flex-wrap items-center gap-2 max-[640px]:gap-1.5',
  'incident-name': 'text-[13px] font-semibold text-[#edf2f9] tracking-tight max-[640px]:text-[12px]',
  'incident-state': 'inline-flex items-center rounded px-[7px] py-[2px] font-mono text-[9px] font-medium tracking-wide uppercase',
  'state-open': 'bg-[#482f37] text-[#ffa0a5] border border-[#ffa0a5]/30',
  'state-resolved': 'bg-[#203d34] text-[#72dfa9] border border-[#72dfa9]/30',
  'incident-detail': 'mt-2 text-[11px] leading-relaxed',
  'detail-open': 'text-[#ff9299] font-medium',
  'detail-resolved': 'text-[#aab7c8] [&_strong]:font-semibold [&_strong]:text-[#e2eaf4]',
  'incident-times': 'flex flex-col items-end gap-1.5 shrink-0 text-right text-[11px] text-[#9aa9bc] max-[720px]:w-full max-[720px]:items-start max-[720px]:text-left max-[720px]:pt-2 max-[720px]:border-t max-[720px]:border-[#2c3b4e]/60',
  'incident-time-entry': 'inline-flex items-center gap-1.5 font-mono text-[10px] text-[#9aa9bc]',
  'time-icon-alert': 'text-[#f3c24f] shrink-0',
  'time-icon-open': 'text-[#ff9299] shrink-0',
  'time-icon-resolved': 'text-[#5cdda4] shrink-0',
  'time-text-open': 'text-[#ffa0a5] font-semibold',
  'time-text-resolved': 'text-[#9aa9bc]',

  // Diagnosis panel styling
  'diagnosis-panel': 'mt-4 w-full rounded-xl border border-[#2e3f55] bg-[#142132] p-4 text-left max-[640px]:mt-3 max-[640px]:p-3',
  'diagnosis-panel-compact': 'mt-2.5 p-3 text-[10px]',
  'diagnosis-title-bar': 'flex items-center justify-between gap-3 border-b border-[#28374a] pb-2.5 mb-3 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-1.5',
  'diagnosis-title-group': 'flex items-center gap-2 [&_h3]:m-0 [&_h3]:text-[12px] [&_h3]:font-semibold [&_h3]:text-[#e2eaf4]',
  'diagnosis-sparkle-icon': 'text-[#61a8ff] shrink-0',
  'diagnosis-badge': 'rounded-full bg-[#1e2f46] border border-[#354862] px-2.5 py-0.5 font-mono text-[9px] text-[#9bb0c7]',
  'diagnosis-empty-box': 'flex items-center gap-2 py-2 text-[11px] text-[#8fa0b5] [&_svg]:text-[#61a8ff] [&_p]:m-0',
  'diagnosis-grid': 'grid grid-cols-1 min-[850px]:grid-cols-3 gap-3.5',
  'diagnosis-grid-compact': 'grid grid-cols-1 gap-2.5',
  'diagnosis-box': 'flex flex-col rounded-lg border border-[#2b3a4e] bg-[#172538] p-3 text-[11px] leading-relaxed text-[#c3d0df]',
  'diagnosis-box-header': 'flex items-center gap-2 border-b border-[#243447] pb-2 mb-2 [&_h4]:m-0 [&_h4]:text-[11px] [&_h4]:font-semibold [&_h4]:text-[#dce5f1]',
  'diagnosis-list': 'm-0 list-disc space-y-1 pl-4 text-[10.5px] text-[#b5c4d6] leading-normal',
  'diagnosis-note': 'mt-2.5 border-t border-[#243447] pt-2 text-[10px] italic text-[#90a2b8] m-0',
  'diagnosis-ordered-list': 'm-0 list-decimal space-y-1 pl-4 text-[10.5px] text-[#b5c4d6] leading-normal',
};
