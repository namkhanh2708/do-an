import { Plus } from 'lucide-react';
import { LoadingRow, PanelHeading } from '../components/dashboard-widgets';
import { MonitorTable } from '../components/monitor-management';
import type { MonitorsPageProps } from './types';
import { tw } from './tailwind';

// Quản lý danh sách website được theo dõi.
export default function MonitorsPage({
  report,
  monitors,
  loading,
  search,
  setSearch,
  openCreateDialog,
  openEditDialog,
  deleteMonitor,
  toggleMonitor,
  checkMonitor,
  setHistoryMonitor,
  checkingId,
  isAdmin,
}: MonitorsPageProps) {
  return (
    <section className={tw('panel table-panel full-table-panel')}>
      <PanelHeading
        title="Danh sách website"
        subtitle={isAdmin ? 'Quản lý URL, tần suất kiểm tra và trạng thái giám sát' : 'Trạng thái và hiệu suất các website được cấp quyền xem'}
        action={isAdmin ? <button className={tw('button button-primary')} onClick={openCreateDialog}><Plus size={15} /> Thêm website</button> : undefined}
      />
      {loading ? <LoadingRow /> : (
        <MonitorTable
          monitors={monitors}
          reportRows={report.monitors}
          search={search}
          onSearch={setSearch}
          onEdit={openEditDialog}
          onDelete={deleteMonitor}
          onToggle={toggleMonitor}
          onCheck={checkMonitor}
          onHistory={setHistoryMonitor}
          checkingId={checkingId}
          readOnly={!isAdmin}
        />
      )}
    </section>
  );
}
