import type { Page, TimeRange } from '../types/app';
import type { Incident, Monitor, Report } from '../types/monitor';

export interface PageContentProps {
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
>;

export type IncidentsPageProps = Pick<
  PageContentProps,
  | 'range'
  | 'incidents'
  | 'monitors'
  | 'loading'
  | 'monitorFilter'
  | 'setMonitorFilter'
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
