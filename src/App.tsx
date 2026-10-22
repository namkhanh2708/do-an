/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavTab, IncidentItem } from './types/telemetry';
import {
  INITIAL_SERVICES,
  INITIAL_INCIDENTS,
  INITIAL_PROBES,
  INITIAL_LOGS,
  INITIAL_TRACES
} from './data/mockData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Toast, ToastData } from './components/Toast';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { RunbookModal } from './components/RunbookModal';
import { SreConsoleModal } from './components/SreConsoleModal';
import { SlackWarRoomModal } from './components/SlackWarRoomModal';
import { PostMortemModal } from './components/PostMortemModal';
import { NewAlertModal } from './components/NewAlertModal';
import { OverviewView } from './views/OverviewView';
import { ServicesView } from './views/ServicesView';
import { IncidentsView } from './views/IncidentsView';
import { MetricsView } from './views/MetricsView';
import { LiveLogsView } from './views/LiveLogsView';
import { DistributedTracesView } from './views/DistributedTracesView';
import { SLOsView } from './views/SLOsView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [services] = useState(INITIAL_SERVICES);
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [probes] = useState(INITIAL_PROBES);
  const [logs] = useState(INITIAL_LOGS);
  const [traces] = useState(INITIAL_TRACES);

  const [selectedServiceKey, setSelectedServiceKey] = useState('cdn');
  const [selectedIncidentId, setSelectedIncidentId] = useState('inc-409');
  const [selectedTraceId, setSelectedTraceId] = useState('TRACE-EU-94827');
  const [selectedRegion, setSelectedRegion] = useState('PROD / US-EAST-1');

  // Modals state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [runbookOpen, setRunbookOpen] = useState(false);
  const [activeRunbookName, setActiveRunbookName] = useState('Cache-Purge');
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleTarget, setConsoleTarget] = useState<string | undefined>();
  const [warRoomOpen, setWarRoomOpen] = useState(false);
  const [activeWarRoomChannel, setActiveWarRoomChannel] = useState('#inc-409');
  const [postMortemOpen, setPostMortemOpen] = useState(false);
  const [postMortemIncident, setPostMortemIncident] = useState<IncidentItem | null>(null);
  const [newAlertOpen, setNewAlertOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [tuneSettingsOpen, setTuneSettingsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(5);

  // Toasts
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (title: string, message: string, icon: string, iconColor: string) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { id, title, message, icon, iconColor }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcut for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openRunbook = (name: string) => {
    setActiveRunbookName(name);
    setRunbookOpen(true);
  };

  const openConsole = (target?: string) => {
    setConsoleTarget(target);
    setConsoleOpen(true);
  };

  const openWarRoom = (channel: string) => {
    setActiveWarRoomChannel(channel);
    setWarRoomOpen(true);
  };

  const openPostMortem = (inc: IncidentItem) => {
    setPostMortemIncident(inc);
    setPostMortemOpen(true);
  };

  const handleInspectTrace = (traceId: string) => {
    setSelectedTraceId(traceId);
    setCurrentTab('traces');
  };

  const handleRunbookComplete = (name: string) => {
    addToast(
      'Runbook Execution Succeeded',
      `Runbook "${name}" exited with status 0. Ingress latency normalized.`,
      'verified',
      'text-primary'
    );
  };

  const handleSaveAlert = (alertData: {
    name: string;
    target: string;
    metric: string;
    threshold: string;
    severity: string;
    window: string;
  }) => {
    addToast(
      'Alert Guardrail Activated',
      `Policy "${alertData.name}" monitoring ${alertData.target} (${alertData.metric} > ${alertData.threshold})`,
      'add_alert',
      'text-primary'
    );
  };

  const activeP2Count = incidents.filter(
    (i) => i.severity === 'P2' && i.status !== 'resolved'
  ).length;

  return (
    <div className="bg-[#0f131c] min-h-screen text-[#dfe2ef] font-body-md antialiased select-none">
      {/* Top Navigation Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeP2Count={activeP2Count}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenNewAlert={() => setNewAlertOpen(true)}
        onOpenTuneSettings={() => setTuneSettingsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
        onToggleSidebarMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeIncidentCount={activeP2Count}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main View Area */}
      <div className="lg:pl-64">
        <main className="relative w-full pt-14 bg-[#0f131c] min-h-screen px-margin-desktop py-space-lg">
          {currentTab === 'overview' && (
            <OverviewView
              onNavigate={setCurrentTab}
              services={services}
              incidents={incidents}
              probes={probes}
              onSelectService={setSelectedServiceKey}
              onSelectIncident={setSelectedIncidentId}
              onOpenRunbook={openRunbook}
              onOpenConsole={openConsole}
              onShowToast={addToast}
            />
          )}

          {currentTab === 'services' && (
            <ServicesView
              onNavigate={setCurrentTab}
              services={services}
              selectedServiceKey={selectedServiceKey}
              onSelectService={setSelectedServiceKey}
              onOpenRunbook={openRunbook}
              onOpenConsole={openConsole}
              onShowToast={addToast}
              onInspectTrace={handleInspectTrace}
            />
          )}

          {currentTab === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
              onOpenWarRoom={openWarRoom}
              onOpenRunbook={openRunbook}
              onOpenPostMortem={openPostMortem}
              onShowToast={addToast}
            />
          )}

          {currentTab === 'metrics' && (
            <MetricsView
              probes={probes}
              onOpenNewAlert={() => setNewAlertOpen(true)}
              onOpenRunbook={openRunbook}
              onShowToast={addToast}
            />
          )}

          {currentTab === 'logs' && (
            <LiveLogsView
              initialLogs={logs}
              onInspectTrace={handleInspectTrace}
              onShowToast={addToast}
            />
          )}

          {currentTab === 'traces' && (
            <DistributedTracesView
              traces={traces}
              selectedTraceId={selectedTraceId}
              onSelectTraceId={setSelectedTraceId}
              onShowToast={addToast}
            />
          )}

          {currentTab === 'slo-tracking' && (
            <SLOsView
              onOpenNewAlert={() => setNewAlertOpen(true)}
              onShowToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Global Modals & Interactive Overlays */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={setCurrentTab}
        services={services}
        incidents={incidents}
        onSelectService={setSelectedServiceKey}
        onSelectIncident={setSelectedIncidentId}
        onOpenRunbook={openRunbook}
        onOpenConsole={openConsole}
      />

      <RunbookModal
        isOpen={runbookOpen}
        onClose={() => setRunbookOpen(false)}
        runbookName={activeRunbookName}
        onRunbookComplete={handleRunbookComplete}
      />

      <SreConsoleModal
        isOpen={consoleOpen}
        onClose={() => setConsoleOpen(false)}
        initialTarget={consoleTarget}
      />

      <SlackWarRoomModal
        isOpen={warRoomOpen}
        onClose={() => setWarRoomOpen(false)}
        channelName={activeWarRoomChannel}
      />

      <PostMortemModal
        isOpen={postMortemOpen}
        onClose={() => setPostMortemOpen(false)}
        incident={postMortemIncident}
      />

      <NewAlertModal
        isOpen={newAlertOpen}
        onClose={() => setNewAlertOpen(false)}
        onSaveAlert={handleSaveAlert}
      />

      {/* Notifications Drawer */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-14 p-4 bg-surface-dim/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface-container-low rounded-xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-space-md py-space-sm bg-surface-container border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs font-semibold text-on-surface">
                <span className="material-symbols-outlined text-primary text-[18px]">notifications</span>
                <span>Operational Alerts (3)</span>
              </div>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="p-space-sm flex flex-col gap-space-xs divide-y divide-surface-container-high/40 max-h-96 overflow-y-auto">
              <div
                onClick={() => {
                  setCurrentTab('incidents');
                  setSelectedIncidentId('inc-409');
                  setNotificationsOpen(false);
                }}
                className="p-space-sm rounded hover:bg-surface-container cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] font-label-mono-sm">
                  <span className="text-tertiary font-bold">P2 DEGRADED</span>
                  <span className="text-on-surface-variant">14m ago</span>
                </div>
                <p className="text-body-sm font-semibold text-on-surface pt-1">
                  CDN Europe Edge elevated egress latency detected
                </p>
                <span className="text-on-surface-variant text-[11px]">
                  TTFB +140ms on Frankfurt edge nodes.
                </span>
              </div>

              <div
                onClick={() => {
                  setCurrentTab('metrics');
                  setNotificationsOpen(false);
                }}
                className="p-space-sm rounded hover:bg-surface-container cursor-pointer transition-colors pt-2"
              >
                <div className="flex items-center justify-between text-[11px] font-label-mono-sm">
                  <span className="text-secondary font-bold">HPA AUTOSCALE</span>
                  <span className="text-on-surface-variant">4m ago</span>
                </div>
                <p className="text-body-sm font-semibold text-on-surface pt-1">
                  Node Pool Scaled +6 Replicas
                </p>
                <span className="text-on-surface-variant text-[11px]">
                  checkout-worker pool CPU reached 64.2%.
                </span>
              </div>

              <div
                onClick={() => {
                  setCurrentTab('incidents');
                  setSelectedIncidentId('inc-408');
                  setNotificationsOpen(false);
                }}
                className="p-space-sm rounded hover:bg-surface-container cursor-pointer transition-colors pt-2"
              >
                <div className="flex items-center justify-between text-[11px] font-label-mono-sm">
                  <span className="text-primary font-bold">RESOLVED</span>
                  <span className="text-on-surface-variant">2h ago</span>
                </div>
                <p className="text-body-sm font-semibold text-on-surface pt-1">
                  PostgreSQL read replica lag spike in us-east-2
                </p>
                <span className="text-on-surface-variant text-[11px]">
                  WAL sync lag normalized to 12ms.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tune Settings Drawer */}
      {tuneSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-14 p-4 bg-surface-dim/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface-container-low rounded-xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-space-md py-space-sm bg-surface-container border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs font-semibold text-on-surface">
                <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
                <span>Telemetry Preferences</span>
              </div>
              <button
                onClick={() => setTuneSettingsOpen(false)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="p-space-md flex flex-col gap-space-md">
              <div className="flex items-center justify-between text-body-sm">
                <div>
                  <span className="font-semibold text-on-surface block">Audible SRE Alarms</span>
                  <span className="text-[11px] text-on-surface-variant">Play chime on P1/P2 alert</span>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="accent-primary w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1 text-body-sm">
                <span className="font-semibold text-on-surface">Auto-Refresh Cadence</span>
                <div className="grid grid-cols-3 gap-2 pt-1 font-label-mono-sm">
                  {[2, 5, 10].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setAutoRefreshInterval(sec)}
                      className={`py-1 rounded text-center border ${
                        autoRefreshInterval === sec
                          ? 'bg-primary-container text-on-primary-container border-primary font-bold'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant/20 hover:text-on-surface'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-body-sm pt-2 border-t border-surface-container-high">
                <div>
                  <span className="font-semibold text-on-surface block">Display Mode</span>
                  <span className="text-[11px] text-on-surface-variant">High-Contrast Deep Obsidian</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container font-label-mono-sm text-primary font-semibold">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
