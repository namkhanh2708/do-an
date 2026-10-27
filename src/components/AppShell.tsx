import type { ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  HeartPulse,
  LoaderCircle,
  Menu,
  Plus,
  RefreshCw,
  WifiOff,
  LogOut,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ApiHealth } from '../types/monitor';
import type { Page, TimeRange } from '../types/app';
import { rangeLabels } from '../utils/report';
import { CircleHelpIcon } from './dashboard-widgets';

interface NavigationItem {
  id: Page;
  label: string;
  icon: LucideIcon;
}

interface AppShellProps {
  page: Page;
  range: TimeRange;
  navigation: NavigationItem[];
  activeIncidents: number;
  enabledMonitorCount: number;
  health: ApiHealth | null;
  mobileNavOpen: boolean;
  refreshing: boolean;
  apiError: string;
  actionError: string;
  notice: string;
  username: string;
  onPageChange: (page: Page) => void;
  onRangeChange: (range: TimeRange) => void;
  onMobileNavChange: (isOpen: boolean) => void;
  onRefresh: () => void;
  onCreateMonitor: () => void;
  onExport: () => void;
  onClearActionError: () => void;
  onClearNotice: () => void;
  onLogout: () => void;
  children: ReactNode;
  overlay?: ReactNode;
}

const pageDetails: Record<Page, { eyebrow: string; title: string; subtitle: string }> = {
  dashboard: {
    eyebrow: 'TỔNG QUAN HỆ THỐNG',
    title: 'Dashboard',
    subtitle: 'Tình trạng website và hiệu suất trong nháy mắt.',
  },
  monitors: {
    eyebrow: 'QUẢN LÝ GIÁM SÁT',
    title: 'Website giám sát',
    subtitle: 'Thêm URL, đặt ngưỡng cảnh báo và kiểm soát lịch kiểm tra.',
  },
  incidents: {
    eyebrow: 'THEO DÕI SỰ CỐ',
    title: 'Lịch sử sự cố',
    subtitle: 'Theo dõi thời điểm website gián đoạn và phục hồi.',
  },
  reports: {
    eyebrow: 'PHÂN TÍCH HIỆU SUẤT',
    title: 'Báo cáo phân tích',
    subtitle: 'Uptime, thời gian phản hồi và thống kê theo từng website.',
  },
};

export default function AppShell({
  page,
  range,
  navigation,
  activeIncidents,
  enabledMonitorCount,
  health,
  mobileNavOpen,
  refreshing,
  apiError,
  actionError,
  notice,
  username,
  onPageChange,
  onRangeChange,
  onMobileNavChange,
  onRefresh,
  onCreateMonitor,
  onExport,
  onClearActionError,
  onClearNotice,
  onLogout,
  children,
  overlay,
}: AppShellProps) {
  const details = pageDetails[page];

  return (
    <div className={tw('app-shell')}>
      <aside className={tw(`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`)}>
        <a className={tw('brand')} href="#" onClick={(event) => { event.preventDefault(); onPageChange('dashboard'); }}>
          <span className={tw('brand-mark')}><HeartPulse size={22} /></span>
          <span><strong>Uptime Watch</strong><small>Website Reliability</small></span>
        </a>
        <div className={tw('sidebar-section')}>
          <span className={tw('sidebar-label')}>GIÁM SÁT</span>
          <nav>
            {navigation.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={tw(`nav-item ${page === id ? 'nav-active' : ''}`)}
                onClick={() => { onPageChange(id); onMobileNavChange(false); }}
              >
                <Icon size={17} />
                <span>{label}</span>
                {id === 'incidents' && activeIncidents > 0 && <span className={tw('nav-count')}>{activeIncidents}</span>}
              </button>
            ))}
          </nav>
        </div>
        <div className={tw('sidebar-bottom')}>
          <div className={tw('system-card')}>
            <div className={tw('system-title')}>
              <span className={tw(`system-dot ${health?.storage === 'mongodb' ? 'system-dot-ok' : ''}`)} />
              {health?.storage === 'mongodb' ? 'Hệ thống sẵn sàng' : 'Chế độ RAM'}
            </div>
            <p>{health?.storage === 'mongodb' ? 'MongoDB đã kết nối' : 'Dữ liệu mất khi khởi động lại'}</p>
            <div className={tw('system-caption')}><span>Thông báo email</span><b>{health?.email ? 'Đã bật' : 'Chưa cấu hình'}</b></div>
          </div>
          <div className={tw('user-card')}>
            <span className={tw('user-avatar')}>{username.slice(0, 1).toUpperCase()}</span>
            <span className={tw('user-name')}><small>Đang đăng nhập</small><strong>{username}</strong></span>
            <button className={tw('icon-button logout-button')} type="button" title="Đăng xuất" aria-label="Đăng xuất" onClick={onLogout}>
              <LogOut size={15} />
            </button>
          </div>
          <span className={tw('sidebar-version')}>Version 1.1.0</span>
        </div>
      </aside>
      {mobileNavOpen && (
        <button
          className={tw('mobile-backdrop')}
          aria-label="Đóng menu"
          onClick={() => onMobileNavChange(false)}
        />
      )}

      <main className={tw('main-area')}>
        <header className={tw('topbar')}>
          <button className={tw('icon-button mobile-menu')} aria-label="Mở menu" onClick={() => onMobileNavChange(true)}>
            <Menu size={19} />
          </button>
          <div className={tw('breadcrumb')}>
            <span>Uptime Watch</span>
            <span className={tw('breadcrumb-divider')}>/</span>
            <strong>{navigation.find((item) => item.id === page)?.label}</strong>
          </div>
          <div className={tw('topbar-actions')}>
            <span className={tw('live-indicator')}><i /> LIVE</span>
            <button className={tw('icon-button top-refresh')} title="Làm mới dữ liệu" onClick={onRefresh} disabled={refreshing}>
              {refreshing ? <LoaderCircle className={tw('spin')} size={17} /> : <RefreshCw size={17} />}
            </button>
            <button className={tw('button button-primary top-add')} onClick={onCreateMonitor}>
              <Plus size={16} /> Thêm website
            </button>
          </div>
        </header>

        <div className={tw('page-content')}>
          {apiError && (
            <div className={tw('connection-banner')}>
              <WifiOff size={17} />
              <span><strong>Không kết nối được backend.</strong> {apiError} Hãy chạy <code>npm run dev</code> để khởi động cả giao diện và API.</span>
            </div>
          )}
          {health?.storage === 'memory' && (
            <div className={tw('storage-banner')}>
              <CircleHelpIcon /> MongoDB chưa kết nối — dữ liệu hiện lưu tạm trong bộ nhớ và sẽ mất khi máy chủ khởi động lại.
            </div>
          )}
          {actionError && (
            <div className={tw('inline-error')}>
              <AlertTriangle size={16} />{actionError}
              <button aria-label="Đóng thông báo" onClick={onClearActionError}><X size={15} /></button>
            </div>
          )}
          {notice && (
            <div className={tw('toast-message')}>
              <CheckCircle2 size={16} />{notice}
              <button aria-label="Đóng thông báo" onClick={onClearNotice}><X size={15} /></button>
            </div>
          )}

          <div className={tw('page-heading')}>
            <div>
              <p className={tw('eyebrow')}>{details.eyebrow}</p>
              <h1>{details.title}</h1>
              <p className={tw('page-subtitle')}>{details.subtitle}</p>
            </div>
            <div className={tw('heading-actions')}>
              <label className={tw('range-select')}>
                <Clock3 size={15} />
                <select
                  aria-label="Khoảng thời gian"
                  value={range}
                  onChange={(event) => onRangeChange(event.target.value as TimeRange)}
                >
                  {Object.entries(rangeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>
              {(page === 'reports' || page === 'dashboard') && (
                <button className={tw('button button-secondary export-button')} onClick={onExport}>
                  <Download size={15} /> Xuất CSV
                </button>
              )}
            </div>
          </div>

          {children}
          <footer className={tw('page-footer')}>
            <span>Uptime Watch</span>
            <span>Đang theo dõi {enabledMonitorCount} website · Tự làm mới mỗi 30 giây</span>
          </footer>
        </div>
      </main>
      {overlay}
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
  'app-shell': 'min-h-screen',
  sidebar: 'fixed inset-y-0 left-0 z-20 flex w-[244px] flex-col border-r border-[#2b394c] bg-[#1c293a] max-[1100px]:w-[218px] max-[850px]:z-[31] max-[850px]:w-[244px] max-[850px]:-translate-x-full max-[850px]:transition-transform max-[850px]:duration-200',
  'sidebar-open': 'max-[850px]:translate-x-0',
  brand: 'flex h-[82px] shrink-0 items-center gap-3 border-b border-[#314054] px-5 text-[#e6edf8] no-underline [&_strong]:block [&_strong]:text-[16px] [&_strong]:tracking-[-0.3px] [&_small]:mt-0.5 [&_small]:block [&_small]:text-[11px] [&_small]:text-[#a4b1c4]',
  'brand-mark': 'grid size-[37px] shrink-0 place-items-center rounded-[11px] bg-[#0d9c8d] text-white',
  'sidebar-section': 'px-[11px] pt-[31px] [&_nav]:grid [&_nav]:gap-1',
  'sidebar-label': 'mb-[11px] block px-[14px] font-mono text-[10px] font-medium tracking-[.08em] text-[#8fa1b7]',
  eyebrow: 'mb-[7px] font-mono text-[10px] font-medium tracking-[.08em] text-[#8fa1b7]',
  'nav-item': 'flex min-h-[42px] items-center gap-[11px] rounded-[7px] border-0 bg-transparent px-[13px] text-left text-[13px] text-[#aebacd] transition-colors duration-150 hover:bg-[#29394d] hover:text-white',
  'nav-active': 'bg-[#0e9f93] font-semibold text-white hover:bg-[#0e9f93] hover:text-white',
  'nav-count': 'ml-auto grid h-[19px] min-w-[19px] place-items-center rounded-full bg-[#a83646] font-mono text-[10px] text-white',
  'sidebar-bottom': 'mt-auto px-[14px] pb-[19px] pt-[15px]',
  'system-card': 'rounded-lg border border-[#344257] bg-[#182435] p-[13px] [&_p]:mb-3 [&_p]:ml-[14px] [&_p]:mt-[7px] [&_p]:text-[10px] [&_p]:text-[#9caabe]',
  'system-title': 'flex items-center gap-[7px] text-[11px] font-semibold text-[#f2f5fa]',
  'system-dot': 'size-[7px] rounded-full bg-[#f3c24f]',
  'system-dot-ok': 'bg-[#45cf91] shadow-[0_0_10px_#45cf9166]',
  'system-caption': 'flex justify-between border-t border-[#2c394b] pt-[9px] text-[10px] text-[#9caabe] [&_b]:font-medium [&_b]:text-[#d5deeb]',
  'user-card': 'mt-3 flex items-center gap-2 rounded-lg border border-[#344257] bg-[#182435] p-2',
  'user-avatar': 'grid size-8 shrink-0 place-items-center rounded-full bg-[#0e9f93] text-xs font-semibold text-white',
  'user-name': 'grid min-w-0 flex-1 [&_small]:text-[9px] [&_small]:text-[#91a1b5] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:text-[11px] [&_strong]:text-[#e7edf6]',
  'logout-button': 'size-[30px] hover:bg-[#482d39] hover:text-[#ff9198]',
  'sidebar-version': 'block px-[2px] pt-[17px] text-center font-mono text-[9px] tracking-[.045em] text-[#73839a]',
  'mobile-backdrop': '!hidden max-[850px]:fixed max-[850px]:inset-0 max-[850px]:z-[30] max-[850px]:!block max-[850px]:border-0 max-[850px]:bg-[#070b13a8]',
  'main-area': 'ml-[244px] min-h-screen max-[1100px]:ml-[218px] max-[850px]:ml-0',
  topbar: 'sticky top-0 z-10 flex h-[66px] items-center justify-between border-b border-[#273447] bg-[rgb(16_24_39_/_94%)] px-[30px] backdrop-blur-[12px] min-[1500px]:px-10 max-[1100px]:px-[21px] max-[850px]:justify-start max-[850px]:gap-2 max-[640px]:h-[58px] max-[640px]:px-[13px]',
  'icon-button': 'inline-grid size-[34px] shrink-0 place-items-center rounded-[7px] border border-transparent bg-transparent text-[#a8b6c9] transition-colors hover:bg-[#2a394d] hover:text-white disabled:cursor-not-allowed disabled:opacity-55',
  'mobile-menu': '!hidden max-[850px]:mr-1 max-[850px]:!inline-grid',
  breadcrumb: 'flex items-center gap-[11px] text-[12px] text-[#93a2b7] max-[640px]:gap-[7px] max-[640px]:text-[10px] [&_strong]:font-medium [&_strong]:text-[#e7edf6]',
  'breadcrumb-divider': 'text-[#56657a]',
  'topbar-actions': 'flex items-center gap-3 max-[850px]:ml-auto max-[640px]:gap-[6px]',
  'live-indicator': 'flex items-center gap-[7px] font-mono text-[10px] text-[#b5c1d0] [&_i]:block [&_i]:size-[7px] [&_i]:rounded-full [&_i]:bg-[#45cf91] [&_i]:shadow-[0_0_10px_#45cf9166] max-[640px]:hidden',
  'top-refresh': 'border-[#304055]',
  spin: 'animate-[spin_.9s_linear_infinite]',
  button: 'inline-flex min-h-9 items-center justify-center gap-2 rounded-[7px] border border-transparent px-[13px] text-[12px] font-semibold transition-[filter,background] duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55',
  'button-primary': 'bg-[#0f9f93] text-white',
  'button-secondary': 'border-[#35445a] bg-[#202d3f] text-[#dae3ef]',
  'top-add': 'max-[640px]:min-h-[33px] max-[640px]:px-[9px] max-[640px]:text-[10px] [&_svg]:max-[640px]:w-[14px]',
  'page-content': 'mx-auto max-w-[1580px] px-[30px] pb-6 pt-[29px] min-[1500px]:px-10 max-[1100px]:px-[21px] max-[640px]:px-[13px] max-[640px]:pb-[18px] max-[640px]:pt-[22px]',
  'connection-banner': 'mb-4 flex items-center gap-2.5 rounded-[7px] border border-[#744047] bg-[#341f2a] px-[13px] py-[11px] text-[12px] text-[#ffc7ca] [&_code]:text-white',
  'storage-banner': 'mb-4 flex items-center gap-2.5 rounded-[7px] border border-[#775f34] bg-[#302b22] px-[13px] py-[11px] text-[12px] text-[#efcf8a]',
  'inline-error': 'mb-4 flex items-center gap-2.5 rounded-[7px] border border-[#744047] bg-[#341f2a] px-[13px] py-[11px] text-[12px] text-[#ffc7ca] [&_button]:ml-auto [&_button]:grid [&_button]:size-6 [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-inherit',
  'toast-message': 'mb-4 flex items-center gap-2.5 rounded-[7px] border border-[#286449] bg-[#1b342d] px-[13px] py-[11px] text-[12px] text-[#b4f1d0] [&_button]:ml-auto [&_button]:grid [&_button]:size-6 [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-inherit',
  'page-heading': 'mb-[22px] flex items-end justify-between gap-5 max-[640px]:mb-[15px] max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-3',
  'page-subtitle': 'mb-0 mt-[6px] text-[12px] text-[#9cabc0]',
  'heading-actions': 'flex items-center gap-3 pb-px max-[640px]:w-full max-[640px]:justify-between',
  'range-select': 'inline-flex min-h-9 items-center gap-2 rounded-[7px] border border-[#34445a] bg-[#1b293b] px-[10px] text-[#aab8ca] max-[640px]:min-h-[34px] [&_select]:max-w-[155px] [&_select]:cursor-pointer [&_select]:border-0 [&_select]:bg-transparent [&_select]:text-[11px] [&_select]:text-[#dfe7f2] [&_option]:bg-[#1b293b]',
  'export-button': 'min-w-[104px]',
  'page-footer': 'flex justify-between gap-[15px] px-[2px] pb-[3px] pt-[10px] text-[9px] text-[#77889c] max-[640px]:flex-col max-[640px]:gap-[5px] [&_span:first-child]:font-semibold [&_span:first-child]:text-[#96a5b8]',
};
