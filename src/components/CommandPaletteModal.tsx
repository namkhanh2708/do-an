import React, { useState, useEffect } from 'react';
import { NavTab, ServiceItem, IncidentItem } from '../types/telemetry';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  services: ServiceItem[];
  incidents: IncidentItem[];
  onSelectService: (serviceKey: string) => void;
  onSelectIncident: (incidentId: string) => void;
  onOpenRunbook: (name: string) => void;
  onOpenConsole: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  services,
  incidents,
  onSelectService,
  onSelectIncident,
  onOpenRunbook,
  onOpenConsole
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.region.toLowerCase().includes(q) ||
      s.key.toLowerCase().includes(q)
  );

  const filteredIncidents = incidents.filter(
    (i) =>
      i.title.toLowerCase().includes(q) ||
      i.key.toLowerCase().includes(q) ||
      i.region.toLowerCase().includes(q)
  );

  const navigationCommands = [
    { label: 'Go to Overview Dashboard', icon: 'grid_view', tab: 'overview' as NavTab },
    { label: 'Go to Services Registry', icon: 'hub', tab: 'services' as NavTab },
    { label: 'Go to Incident Command Center', icon: 'warning', tab: 'incidents' as NavTab },
    { label: 'Go to Real-Time Metrics & Golden Signals', icon: 'show_chart', tab: 'metrics' as NavTab },
    { label: 'Go to Live Ingress & Pod Logs', icon: 'terminal', tab: 'logs' as NavTab },
    { label: 'Go to Distributed Tracing', icon: 'account_tree', tab: 'traces' as NavTab },
    { label: 'Go to SLO Tracking & Error Budgets', icon: 'task_alt', tab: 'slo-tracking' as NavTab }
  ].filter((c) => c.label.toLowerCase().includes(q));

  const runbookCommands = [
    { label: 'Execute Cache-Purge Runbook (CDN Europe)', runbook: 'Cache-Purge' },
    { label: 'Execute BGP Subsea Reroute: ap-southeast-1', runbook: 'BGP Reroute' },
    { label: 'Automated Canary Rollback to stable v2.4.1', runbook: 'Canary Rollback' },
    { label: 'HPA Scale-Out +6 Pods', runbook: 'HPA Scale' }
  ].filter((r) => r.label.toLowerCase().includes(q));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-surface-dim/80 backdrop-blur-md">
      <div
        className="w-full max-w-2xl bg-surface-container-low rounded-xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-space-sm px-space-md py-space-sm border-b border-surface-container-high bg-surface-container">
          <span className="material-symbols-outlined text-[20px] text-primary">search</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a service, incident, runbook, or command..."
            className="w-full bg-transparent border-0 outline-none text-on-surface font-code-inline text-body-md placeholder:text-on-surface-variant/60"
          />
          <kbd className="px-space-xs rounded bg-surface-container-highest text-label-mono-sm font-label-mono-sm text-on-surface-variant">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-space-sm flex flex-col gap-space-xs divide-y divide-surface-container-high/40">
          {/* SRE Console Quick Action */}
          <div className="pb-1">
            <button
              onClick={() => {
                onOpenConsole();
                onClose();
              }}
              className="w-full flex items-center justify-between px-space-md py-space-xs rounded hover:bg-surface-container text-left text-on-surface transition-colors"
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[18px]">terminal</span>
                <span className="font-body-md text-primary font-semibold">Open Interactive SRE Ops Console (kubectl / curl / dig)</span>
              </div>
              <span className="font-code-inline text-[10px] text-on-surface-variant">CLI</span>
            </button>
          </div>

          {/* Navigation Section */}
          {navigationCommands.length > 0 && (
            <div className="pt-2">
              <span className="px-space-md font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase tracking-wider">
                Navigation
              </span>
              <div className="mt-1 flex flex-col gap-0.5">
                {navigationCommands.map((cmd) => (
                  <button
                    key={cmd.tab}
                    onClick={() => {
                      onNavigate(cmd.tab);
                      onClose();
                    }}
                    className="w-full flex items-center gap-space-sm px-space-md py-space-xs rounded hover:bg-surface-container text-left text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      {cmd.icon}
                    </span>
                    <span className="font-body-md">{cmd.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Services Section */}
          {filteredServices.length > 0 && (
            <div className="pt-2">
              <span className="px-space-md font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase tracking-wider">
                Services ({filteredServices.length})
              </span>
              <div className="mt-1 flex flex-col gap-0.5">
                {filteredServices.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => {
                      onNavigate('services');
                      onSelectService(svc.key);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-space-md py-space-xs rounded hover:bg-surface-container text-left text-on-surface transition-colors"
                  >
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-[18px] text-primary">hub</span>
                      <span className="font-body-md font-semibold">{svc.name}</span>
                      <span className="font-code-inline text-code-inline text-on-surface-variant">
                        {svc.region}
                      </span>
                    </div>
                    <span
                      className={`font-label-mono-sm px-1.5 py-0.5 rounded ${
                        svc.status === 'operational'
                          ? 'bg-primary-container/20 text-primary'
                          : 'bg-tertiary-container/30 text-tertiary'
                      }`}
                    >
                      {svc.statusBadge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Incidents Section */}
          {filteredIncidents.length > 0 && (
            <div className="pt-2">
              <span className="px-space-md font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase tracking-wider">
                Incidents ({filteredIncidents.length})
              </span>
              <div className="mt-1 flex flex-col gap-0.5">
                {filteredIncidents.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => {
                      onNavigate('incidents');
                      onSelectIncident(inc.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-space-md py-space-xs rounded hover:bg-surface-container text-left text-on-surface transition-colors"
                  >
                    <div className="flex items-center gap-space-sm min-w-0">
                      <span className="material-symbols-outlined text-[18px] text-tertiary">warning</span>
                      <span className="font-code-inline font-bold text-on-surface-variant">{inc.key}</span>
                      <span className="font-body-md truncate">{inc.title}</span>
                    </div>
                    <span
                      className={`font-label-mono-sm px-1.5 py-0.5 rounded ${
                        inc.severity === 'P2'
                          ? 'bg-tertiary-container/30 text-tertiary'
                          : inc.severity === 'RESOLVED'
                          ? 'bg-primary-container/20 text-primary'
                          : 'bg-surface-container-highest text-secondary'
                      }`}
                    >
                      {inc.severityLabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Runbooks Section */}
          {runbookCommands.length > 0 && (
            <div className="pt-2">
              <span className="px-space-md font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase tracking-wider">
                Automated Runbooks
              </span>
              <div className="mt-1 flex flex-col gap-0.5">
                {runbookCommands.map((rb) => (
                  <button
                    key={rb.runbook}
                    onClick={() => {
                      onOpenRunbook(rb.runbook);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-space-md py-space-xs rounded hover:bg-surface-container text-left text-on-surface transition-colors"
                  >
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-[18px] text-tertiary">play_circle</span>
                      <span className="font-body-md">{rb.label}</span>
                    </div>
                    <span className="font-code-inline text-[10px] text-tertiary">EXECUTE</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {navigationCommands.length === 0 &&
            filteredServices.length === 0 &&
            filteredIncidents.length === 0 &&
            runbookCommands.length === 0 && (
              <div className="p-space-lg text-center text-on-surface-variant font-body-sm">
                No matching telemetry resources found for "{query}".
              </div>
            )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-space-md py-space-xs bg-surface-container-lowest text-label-mono-sm font-label-mono-sm text-on-surface-variant border-t border-surface-container-high">
          <span>Navigate with arrows or click</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
