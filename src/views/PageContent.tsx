import { useState } from 'react';
import DashboardPage from './DashboardPage';
import IncidentsPage from './IncidentsPage';
import MonitorsPage from './MonitorsPage';
import ReportsPage from './ReportsPage';
import type { PageContentProps } from './types';

// Điều phối nội dung theo màn hình đang chọn.
export default function PageContent(props: PageContentProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  switch (props.page) {
    case 'dashboard':
      return <DashboardPage {...props} />;
    case 'monitors':
      return <MonitorsPage {...props} />;
    case 'incidents':
      return <IncidentsPage {...props} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />;
    case 'reports':
      return <ReportsPage {...props} />;
  }
}
