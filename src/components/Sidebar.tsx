import React from 'react';
import { NavTab } from '../types/telemetry';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeIncidentCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeIncidentCount,
  mobileOpen,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: 'grid_view' },
    { id: 'services' as NavTab, label: 'Services', icon: 'hub' },
    {
      id: 'incidents' as NavTab,
      label: 'Incidents',
      icon: 'warning',
      badge: activeIncidentCount > 0 ? activeIncidentCount : undefined
    },
    { id: 'metrics' as NavTab, label: 'Metrics', icon: 'show_chart' }
  ];

  const obsItems = [
    { id: 'logs' as NavTab, label: 'Live Logs', icon: 'terminal' },
    { id: 'traces' as NavTab, label: 'Distributed Traces', icon: 'account_tree' },
    { id: 'slo-tracking' as NavTab, label: 'SLOs & Error Budgets', icon: 'task_alt' }
  ];

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-surface-dim/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-14 bottom-0 w-64 bg-surface-container-lowest z-40 flex flex-col justify-between py-space-lg px-space-md shadow-[1px_0_12px_rgba(0,0,0,0.15)] border-r border-surface-container-high/60 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-space-lg">
          {/* Navigation Section */}
          <div className="flex flex-col gap-space-xs">
            <div className="px-space-sm pb-space-xs">
              <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant tracking-wider">
                Navigation
              </span>
            </div>
            <nav className="flex flex-col gap-space-xs">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center justify-between px-space-md py-space-sm rounded transition-colors text-left ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-[18px]">
                        {item.icon}
                      </span>
                      <span className="font-body-md text-body-md">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`px-space-xs rounded font-label-mono-sm text-label-mono-sm font-semibold ${
                          isActive
                            ? 'bg-error text-on-primary'
                            : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Observability Section */}
          <div className="flex flex-col gap-space-xs">
            <div className="px-space-sm pb-space-xs pt-space-xs">
              <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant tracking-wider">
                Observability
              </span>
            </div>
            <nav className="flex flex-col gap-space-xs">
              {obsItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-space-sm px-space-md py-space-sm rounded transition-colors text-left ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {item.icon}
                    </span>
                    <span className="font-body-md text-body-md">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Global Uptime & Mesh Status Footer */}
        <div className="p-space-md rounded bg-surface-container-low flex flex-col gap-space-xs border border-outline-variant/20">
          <div className="flex items-center justify-between text-label-mono-sm font-label-mono-sm text-on-surface-variant">
            <span>GLOBAL UPTIME</span>
            <span className="text-primary font-semibold">99.982%</span>
          </div>
          <div className="w-full bg-surface-container-highest h-1 rounded overflow-hidden">
            <div className="bg-primary h-full w-[99.9%]"></div>
          </div>
          <div className="flex justify-between items-center text-label-mono-sm font-label-mono-sm text-on-surface-variant pt-space-xs">
            <span>Mesh Status</span>
            <span className="text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              Healthy
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
