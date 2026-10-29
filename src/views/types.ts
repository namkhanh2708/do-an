import type { Page, TimeRange } from '../types/app';
import type { Account, Incident, Monitor, Report, UserRole } from '../types/monitor';
import type { OutageSelection } from '../components/charts';

export interface PageContentProps {
  page: Page;
  range: TimeRange;
  report: Report;
  selectedReport: Report;
  monitors: Monitor[];
  incidents: Incident[];
  activeIncidents: number;
  isAdmin: boolean;
  accounts: Account[];
  currentAccountId: string;
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
  onAccountCreate: (username: string, password: string, role: UserRole, email: string) => Promise<void>;
  onAccountUpdate: (id: string, changes: { username?: string; password?: string; role?: UserRole; isActive?: boolean; email?: string }) => Promise<void>;
  onAccountDelete: (id: string) => Promise<void>;
  onMonitorAssignmentsChange: (userId: string, monitorIds: string[]) => Promise<void>;
  incidentSelection: OutageSelection | null;
  setIncidentSelection: (selection: OutageSelection | null) => void;
  onOutageSelect: (selection: OutageSelection) => void;
}

export type DashboardPageProps = Pick<
  PageContentProps,
  | 'range'
  | 'report'
  | 'monitors'
  | 'incidents'
  | 'activeIncidents'
  | 'loading'
  | 'checkingId'
  | 'setPage'
  | 'openEditDialog'
  | 'deleteMonitor'
  | 'toggleMonitor'
  | 'checkMonitor'
  | 'setHistoryMonitor'
  | 'onOutageSelect'
  | 'isAdmin'
>;

export type MonitorsPageProps = Pick<
  PageContentProps,
  | 'report'
  | 'monitors'
  | 'loading'
  | 'search'
  | 'setSearch'
  | 'openCreateDialog'
  | 'openEditDialog'
  | 'deleteMonitor'
  | 'toggleMonitor'
  | 'checkMonitor'
  | 'setHistoryMonitor'
  | 'checkingId'
  | 'isAdmin'
>;

export type UsersPageProps = Pick<
  PageContentProps,
  | 'accounts'
  | 'monitors'
  | 'isAdmin'
  | 'currentAccountId'
  | 'onAccountCreate'
  | 'onAccountUpdate'
  | 'onAccountDelete'
  | 'onMonitorAssignmentsChange'
>;

export type IncidentsPageProps = Pick<
  PageContentProps,
  | 'range'
  | 'incidents'
  | 'monitors'
  | 'loading'
  | 'monitorFilter'
  | 'setMonitorFilter'
  | 'incidentSelection'
  | 'setIncidentSelection'
> & {
  statusFilter: 'ALL' | 'OPEN' | 'RESOLVED';
  setStatusFilter: (status: 'ALL' | 'OPEN' | 'RESOLVED') => void;
};

export type ReportsPageProps = Pick<
  PageContentProps,
  | 'range'
  | 'report'
  | 'selectedReport'
  | 'monitors'
  | 'monitorFilter'
  | 'setMonitorFilter'
  | 'exportCsv'
>;
