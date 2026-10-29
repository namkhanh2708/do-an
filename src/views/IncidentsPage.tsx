import { CheckCircle2, Search } from 'lucide-react';
import { IncidentRow, LoadingRow, PanelHeading } from '../components/dashboard-widgets';
import type { IncidentsPageProps } from './types';
import { rangeLabels } from '../utils/report';
import { tw } from './tailwind';

// Lọc và xem chi tiết các sự cố theo trạng thái hoặc website.
export default function IncidentsPage({
  range,
  incidents,
  monitors,
  loading,
  monitorFilter,
  setMonitorFilter,
  statusFilter,
  setStatusFilter,
  incidentSelection,
  setIncidentSelection,
}: IncidentsPageProps) {
  const timeFilteredIncidents = incidentSelection
    ? incidents.filter((incident) => {
      return incidentSelection.incidentIds.includes(incident.id);
    })
    : incidents;
  const openIncidents = timeFilteredIncidents.filter((incident) => incident.status === 'OPEN');
  const resolvedIncidents = timeFilteredIncidents.filter((incident) => incident.status === 'RESOLVED');
  const filteredIncidents = timeFilteredIncidents.filter((incident) => {
    if (statusFilter === 'OPEN' && incident.status !== 'OPEN') return false;
    if (statusFilter === 'RESOLVED' && incident.status !== 'RESOLVED') return false;
    if (monitorFilter && incident.monitorId !== monitorFilter) return false;
    return true;
  });

  return (
    <section className={tw('panel incidents-panel')}>
      <div className={tw('incidents-header-wrap')}>
        <PanelHeading
          title="Nhật ký gián đoạn"
          subtitle={incidentSelection
            ? `${timeFilteredIncidents.length} bản ghi sự cố được chọn`
            : `${incidents.length} sự cố trong ${rangeLabels[range].toLowerCase()}`}
          action={
            monitors.length > 0 && (
              <div className={tw('incidents-filter-group')}>
                <label className={tw('range-select incidents-select')}>
                  <Search size={14} />
                  <select aria-label="Lọc theo website" value={monitorFilter} onChange={(event) => setMonitorFilter(event.target.value)}>
                    <option value="">Tất cả website ({monitors.length})</option>
                    {monitors.map((monitor) => <option key={monitor.id} value={monitor.id}>{monitor.name}</option>)}
                  </select>
                </label>
              </div>
            )
          }
        />

        {(timeFilteredIncidents.length > 0 || incidentSelection) && (
          <div className={tw('incidents-tabs-bar')}>
            <div className={tw('incidents-tabs')}>
              <button type="button" className={tw(`incident-tab ${statusFilter === 'ALL' ? 'tab-active' : ''}`)} onClick={() => setStatusFilter('ALL')}>
                Tất cả <span className={tw('tab-count')}>{timeFilteredIncidents.length}</span>
              </button>
              <button type="button" className={tw(`incident-tab ${statusFilter === 'OPEN' ? 'tab-active tab-active-open' : ''}`)} onClick={() => setStatusFilter('OPEN')}>
                <span className={tw('status-tab-dot dot-open')} />
                Đang diễn ra <span className={tw('tab-count count-open')}>{openIncidents.length}</span>
              </button>
              <button type="button" className={tw(`incident-tab ${statusFilter === 'RESOLVED' ? 'tab-active tab-active-resolved' : ''}`)} onClick={() => setStatusFilter('RESOLVED')}>
                <span className={tw('status-tab-dot dot-resolved')} />
                Đã khôi phục <span className={tw('tab-count')}>{resolvedIncidents.length}</span>
              </button>
            </div>
            {monitorFilter && (
              <button type="button" className={tw('incident-filter-clear')} onClick={() => setMonitorFilter('')}>
                Xóa lọc website
              </button>
            )}
            {incidentSelection && (
              <button type="button" className={tw('incident-filter-clear')} onClick={() => setIncidentSelection(null)}>
                Xóa lọc theo biểu đồ
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingRow />
      ) : filteredIncidents.length === 0 ? (
        <div className={tw('empty-state incident-empty')}>
          <CheckCircle2 size={30} />
          <h3>{incidentSelection && timeFilteredIncidents.length === 0 ? 'Không có sự cố tại mốc này' : incidents.length === 0 ? 'Không có sự cố' : 'Không có sự cố phù hợp với bộ lọc'}</h3>
          <p>
            {incidents.length === 0
              ? 'Các website đang được theo dõi chưa ghi nhận trạng thái DOWN trong khoảng thời gian này.'
              : 'Thử chuyển tab trạng thái hoặc chọn website khác để xem danh sách sự cố.'}
          </p>
        </div>
      ) : (
        <div className={tw('incidents-list')}>
          {filteredIncidents.map((incident) => <IncidentRow key={incident.id} incident={incident} detailed />)}
        </div>
      )}
    </section>
  );
}
