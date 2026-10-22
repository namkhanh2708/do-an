import React, { useState, useEffect } from 'react';
import { IncidentItem } from '../types/telemetry';

interface IncidentsViewProps {
  incidents: IncidentItem[];
  selectedIncidentId: string;
  onSelectIncident: (id: string) => void;
  onOpenWarRoom: (channelName: string) => void;
  onOpenRunbook: (name: string) => void;
  onOpenPostMortem: (incident: IncidentItem) => void;
  onShowToast: (title: string, msg: string, icon: string, color: string) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  onOpenWarRoom,
  onOpenRunbook,
  onOpenPostMortem,
  onShowToast
}) => {
  const [filterTab, setFilterTab] = useState<'active' | 'past7' | 'all'>('active');
  const [searchFilter, setSearchFilter] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(1125); // 18m 45s
  const [p1Escalated, setP1Escalated] = useState(false);
  const [acknowledgedIncidents, setAcknowledgedIncidents] = useState<Record<string, boolean>>({
    'inc-408': true,
    'inc-407': true,
    'inc-406': true
  });

  // Ticking live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const selectedIncident =
    incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  const handleToggleAck = (incId: string) => {
    const next = !acknowledgedIncidents[incId];
    setAcknowledgedIncidents((prev) => ({ ...prev, [incId]: next }));
    if (next) {
      onShowToast('Incident Acknowledged', `${selectedIncident.key} acknowledged by @you. PagerDuty timer suspended.`, 'done_all', 'text-primary');
    }
  };

  const handleEscalate = () => {
    const confirmed = window.confirm(
      'Declare P1 Escalation? This will invoke the global VP / Engineering Leadership on-call pager tree.'
    );
    if (confirmed) {
      setP1Escalated(true);
      onShowToast(
        'P1 Escalation Declared',
        'Global SRE emergency response tree triggered. PagerDuty P1 dispatched.',
        'emergency',
        'text-error'
      );
    }
  };

  const handleDownloadCSV = () => {
    const csvContent =
      'Incident,Key,Severity,Duration,RootCause,ResolvedAt,Status\n' +
      incidents
        .map(
          (i) =>
            `"${i.title}","${i.key}","${i.severity}","${i.duration || 'N/A'}","${i.rootCause || 'N/A'}","${i.resolvedAt || 'Active'}","${i.status}"`
        )
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PulseSRE-Incidents-Audit-Report.csv';
    a.click();
    onShowToast('CSV Exported', 'Downloaded incident retrospective log.', 'file_download', 'text-primary');
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (filterTab === 'active' && inc.status === 'resolved') return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.key.toLowerCase().includes(q) ||
        inc.region.toLowerCase().includes(q) ||
        inc.assignee.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-space-xl">
      {/* Command Header & Operational Telemetry Pill Strip */}
      <div className="flex flex-wrap items-center justify-between gap-space-md pb-space-lg">
        <div className="flex items-center gap-space-md flex-wrap">
          <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-high shadow-sm border border-outline-variant/30">
            <span className={`w-2 h-2 rounded-full ${p1Escalated ? 'bg-error animate-ping' : 'bg-tertiary animate-ping'}`}></span>
            <span className={`font-label-mono-md text-label-mono-md uppercase tracking-wider font-semibold ${p1Escalated ? 'text-error' : 'text-tertiary'}`}>
              {p1Escalated ? 'P1 CRITICAL ESCALATION ACTIVE' : 'Incident Command Active'}
            </span>
          </div>
          <div className="flex items-center gap-space-xs font-code-inline text-code-inline text-on-surface-variant">
            <span>RUNBOOK PIPELINE:</span>
            <span className="text-primary font-medium">READY [AUTO-TIER-1]</span>
          </div>
        </div>

        <div className="flex items-center gap-space-md font-label-mono-sm text-label-mono-sm flex-wrap">
          <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-low shadow-sm border border-outline-variant/20">
            <span className="text-on-surface-variant">MTTR (LAST 30D):</span>
            <span className="text-on-surface font-semibold">14m 12s</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-low shadow-sm border border-outline-variant/20">
            <span className="text-on-surface-variant">SLO BUDGET CONSUMPTION:</span>
            <span className="text-error font-semibold">1.82% / 24h</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-low shadow-sm border border-outline-variant/20">
            <span className="text-on-surface-variant">ON-CALL COMMANDER:</span>
            <span className="text-primary font-semibold">@alex-chen (L2 Escalation)</span>
          </div>
        </div>
      </div>

      {/* Dual-Pane Split Command Center */}
      <div className="grid grid-cols-12 gap-space-lg items-start">
        {/* LEFT PANE: 40% (col-span-5) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-space-md">
          {/* Top Stream Filters Card */}
          <div className="p-space-md rounded bg-surface-container-low shadow-md flex flex-col gap-space-md border border-outline-variant/20">
            {/* Status View Selector Tabs */}
            <div className="grid grid-cols-3 gap-space-xs p-space-xs rounded bg-surface-container-lowest border border-outline-variant/20">
              <button
                onClick={() => setFilterTab('active')}
                className={`px-space-sm py-space-xs rounded font-label-mono-sm text-label-mono-sm font-semibold flex items-center justify-center gap-space-xs transition-colors ${
                  filterTab === 'active'
                    ? 'bg-surface-container-high text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>ACTIVE</span>
                <span className="px-1.5 py-0.5 rounded bg-tertiary text-on-tertiary font-bold text-[9px]">
                  1
                </span>
              </button>
              <button
                onClick={() => setFilterTab('past7')}
                className={`px-space-sm py-space-xs rounded font-label-mono-sm text-label-mono-sm font-semibold flex items-center justify-center gap-space-xs transition-colors ${
                  filterTab === 'past7'
                    ? 'bg-surface-container-high text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>PAST 7D</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-bold text-[9px]">
                  8
                </span>
              </button>
              <button
                onClick={() => setFilterTab('all')}
                className={`px-space-sm py-space-xs rounded font-label-mono-sm text-label-mono-sm font-semibold flex items-center justify-center transition-colors ${
                  filterTab === 'all'
                    ? 'bg-surface-container-high text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>ALL ALERTS</span>
              </button>
            </div>

            {/* Filter Metrics Bar */}
            <div className="grid grid-cols-3 gap-space-xs text-center font-label-mono-sm text-label-mono-sm">
              <div className="p-space-xs rounded bg-surface-container flex flex-col gap-0.5 border border-outline-variant/10">
                <span className="text-tertiary font-metric-display text-headline-sm">1</span>
                <span className="text-on-surface-variant uppercase text-[9px]">Investigating</span>
              </div>
              <div className="p-space-xs rounded bg-surface-container flex flex-col gap-0.5 border border-outline-variant/10">
                <span className="text-primary font-metric-display text-headline-sm">3</span>
                <span className="text-on-surface-variant uppercase text-[9px]">Resolved Today</span>
              </div>
              <div className="p-space-xs rounded bg-surface-container flex flex-col gap-0.5 border border-outline-variant/10">
                <span className="text-on-surface-variant font-metric-display text-headline-sm">0</span>
                <span className="text-on-surface-variant uppercase text-[9px]">P1 Critical</span>
              </div>
            </div>

            {/* Filter Bar Search Input */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[16px]">
                filter_list
              </span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by region, tag, or lead..."
                className="w-full bg-surface-container-lowest text-on-surface pl-9 pr-4 py-1.5 rounded font-code-inline text-code-inline placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-outline-variant/30"
              />
            </div>
          </div>

          {/* Incidents Feed List */}
          <div className="flex flex-col gap-space-sm">
            {filteredIncidents.map((inc) => {
              const isSelected = inc.id === selectedIncident.id;
              const isResolved = inc.status === 'resolved';

              return (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident(inc.id)}
                  className={`p-space-md rounded bg-surface-container shadow-sm relative overflow-hidden cursor-pointer transition-all hover:bg-surface-container-high group border ${
                    isSelected
                      ? 'ring-1 ring-primary border-primary'
                      : 'border-outline-variant/20'
                  }`}
                >
                  {/* Left Accent Bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      isResolved
                        ? 'bg-primary'
                        : inc.severity === 'P2'
                        ? 'bg-tertiary'
                        : 'bg-secondary'
                    }`}
                  ></div>

                  <div className="flex items-start justify-between gap-space-sm pl-space-xs">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-space-xs flex-wrap">
                        <span
                          className={`px-space-xs py-0.5 rounded font-label-mono-sm text-label-mono-sm font-bold uppercase tracking-wider ${
                            isResolved
                              ? 'bg-surface-container-highest text-primary'
                              : inc.severity === 'P2'
                              ? 'bg-tertiary-container text-on-tertiary-container'
                              : 'bg-surface-container-highest text-secondary'
                          }`}
                        >
                          {inc.severityLabel}
                        </span>
                        <span className="font-code-inline text-code-inline text-on-surface-variant">
                          {inc.key}
                        </span>
                        {!isResolved && (
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>
                        )}
                        {isResolved && (
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                            {inc.triggeredAt}
                          </span>
                        )}
                      </div>
                      <h3
                        className={`font-headline-sm text-body-lg text-on-surface font-semibold truncate transition-colors ${
                          !isResolved ? 'group-hover:text-tertiary' : 'group-hover:text-primary'
                        }`}
                      >
                        {inc.title}
                      </h3>
                      <div className="flex items-center gap-space-md font-label-mono-sm text-label-mono-sm text-on-surface-variant pt-1 flex-wrap">
                        {!isResolved ? (
                          <span className="flex items-center gap-1 text-tertiary font-semibold">
                            <span className="material-symbols-outlined text-[14px]">timer</span>
                            <span>{formatElapsed(secondsElapsed)}</span>
                          </span>
                        ) : (
                          <span>Duration: {inc.duration}</span>
                        )}
                        <span>{inc.region}</span>
                        <span className="text-on-surface font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-primary">person</span>{' '}
                          {inc.assignee}
                        </span>
                      </div>
                    </div>

                    {!isResolved ? (
                      <button className="px-space-sm py-space-xs rounded bg-surface-container-highest text-on-surface group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors font-label-mono-sm text-label-mono-sm font-semibold shrink-0">
                        TRIAGE
                      </button>
                    ) : (
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        check_circle
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Telemetry Service Mini-Map Card */}
          <div className="p-space-md rounded bg-surface-container-low shadow-sm flex flex-col gap-space-sm border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant tracking-wider">
                REGIONAL EDGE STATUS MATRIX
              </span>
              <span className="font-code-inline text-code-inline text-primary">
                ALL OTHER 14 POPS NOMINAL
              </span>
            </div>
            <div className="grid grid-cols-4 gap-space-xs font-label-mono-sm text-label-mono-sm text-center">
              <div className="p-space-xs rounded bg-surface-container flex flex-col items-center">
                <span className="text-on-surface font-semibold">IAD-1</span>
                <span className="text-primary text-[10px]">18ms</span>
              </div>
              <div className="p-space-xs rounded bg-surface-container flex flex-col items-center">
                <span className="text-on-surface font-semibold">SFO-2</span>
                <span className="text-primary text-[10px]">22ms</span>
              </div>
              <div className="p-space-xs rounded bg-surface-container-high shadow-inner flex flex-col items-center border border-tertiary/40">
                <span className="text-tertiary font-bold">FRA-1</span>
                <span className="text-tertiary text-[10px] animate-pulse">410ms</span>
              </div>
              <div className="p-space-xs rounded bg-surface-container flex flex-col items-center">
                <span className="text-on-surface font-semibold">NRT-1</span>
                <span className="text-primary text-[10px]">68ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: 60% (col-span-7) Active Incident Investigation Workbench */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-space-md">
          <div className="p-space-lg rounded bg-surface-container shadow-md flex flex-col gap-space-md border border-outline-variant/20">
            {/* Severity & Region Badging Row */}
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span
                  className={`px-space-sm py-1 rounded font-label-mono-md text-label-mono-md font-bold uppercase tracking-wider ${
                    p1Escalated
                      ? 'bg-error-container text-on-error-container'
                      : selectedIncident.status === 'resolved'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-tertiary-container text-on-tertiary-container'
                  }`}
                >
                  {p1Escalated ? 'P1 CRITICAL' : selectedIncident.severityLabel}
                </span>
                <span className="px-space-sm py-1 rounded bg-surface-container-high text-on-surface font-code-inline text-code-inline">
                  {selectedIncident.region}
                </span>
                {selectedIncident.status !== 'resolved' && (
                  <span className="px-space-sm py-1 rounded bg-surface-container-low text-tertiary font-label-mono-sm text-label-mono-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
                    Active for {formatElapsed(secondsElapsed)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                  INCIDENT COMMANDER:
                </span>
                <div className="flex items-center gap-1 px-space-xs py-0.5 rounded bg-surface-container-highest text-on-surface font-body-sm text-body-sm font-semibold">
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[10px] text-on-primary font-bold">
                    {selectedIncident.assigneeAvatar || 'AC'}
                  </div>
                  {selectedIncident.assignee} (SRE Lead)
                </div>
              </div>
            </div>

            {/* Incident Headline */}
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                {selectedIncident.title}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant pt-1">
                {selectedIncident.summary}
              </p>
            </div>

            {/* Live Telemetry Waveform Card */}
            <div className="p-space-md rounded bg-surface-container-low shadow-sm flex flex-col gap-space-sm border border-outline-variant/20">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-space-md flex-wrap">
                  <div className="flex items-center gap-1 font-label-mono-sm text-label-mono-sm text-on-surface font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-error">trending_up</span>
                    <span>P99 LATENCY WAVEFORM (ms)</span>
                  </div>
                  <div className="flex items-center gap-space-xs font-label-mono-sm text-label-mono-sm">
                    <span className="w-2.5 h-0.5 bg-tertiary inline-block"></span>
                    <span className="text-tertiary">Current (+340ms)</span>
                    <span className="w-2.5 h-0.5 bg-outline inline-block ml-2"></span>
                    <span className="text-on-surface-variant">Historical Baseline (42ms)</span>
                  </div>
                </div>
                <span className="font-code-inline text-code-inline text-tertiary font-semibold">
                  {selectedIncident.peakP99}
                </span>
              </div>

              {/* Inline SVG Latency Waveform Graph */}
              <div className="relative w-full h-36 bg-surface-container-lowest rounded p-2 overflow-hidden flex flex-col justify-end border border-outline-variant/10">
                <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
                  <div className="border-b border-outline-variant w-full"></div>
                  <div className="border-b border-outline-variant w-full"></div>
                  <div className="border-b border-outline-variant w-full"></div>
                </div>
                <svg className="w-full h-28 overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 100">
                  <defs>
                    <linearGradient id="latencyGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#ffb95f" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#ffb95f" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Historical Baseline Line */}
                  <path
                    d="M 0,82 Q 100,81 200,83 T 350,81 T 500,82"
                    fill="none"
                    stroke="#86948a"
                    strokeDasharray="3,3"
                    strokeWidth="1.5"
                  />
                  {/* Latency Spike Waveform */}
                  <path
                    d="M 0,82 L 120,80 L 180,75 L 230,22 L 260,12 L 310,18 L 350,38 L 410,48 L 500,52 L 500,100 L 0,100 Z"
                    fill="url(#latencyGrad)"
                  />
                  <path
                    d="M 0,82 L 120,80 L 180,75 L 230,22 L 260,12 L 310,18 L 350,38 L 410,48 L 500,52"
                    fill="none"
                    stroke="#ffb95f"
                    strokeWidth="2.5"
                  />
                  <circle cx="260" cy="12" r="4" fill="#ffb4ab" className="animate-pulse" />
                </svg>
                <div className="flex justify-between items-center text-[10px] font-label-mono-sm text-on-surface-variant pt-1 px-1">
                  <span>14:15 UTC (Nominal)</span>
                  <span>14:20 Synthetic Alarm</span>
                  <span>14:26 Auto-Rollback</span>
                  <span className="text-tertiary">14:38 Shift Complete</span>
                  <span>NOW</span>
                </div>
              </div>
            </div>

            {/* Real-Time Incident Event Timeline */}
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant tracking-wider">
                  REAL-TIME EVENT TIMELINE
                </span>
                <span className="font-code-inline text-code-inline text-on-surface-variant">
                  {selectedIncident.timeline.length} EVENTS LOGGED
                </span>
              </div>
              <div className="flex flex-col gap-space-xs">
                {selectedIncident.timeline.map((evt, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-space-sm p-space-sm rounded bg-surface-container-low shadow-sm border border-outline-variant/10"
                  >
                    <span className="font-code-inline text-code-inline text-primary font-semibold whitespace-nowrap">
                      {evt.time}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        evt.type === 'action'
                          ? 'bg-primary'
                          : evt.type === 'system'
                          ? 'bg-secondary'
                          : 'bg-tertiary'
                      }`}
                    ></div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-body-md text-body-md text-on-surface font-semibold">
                        {evt.title}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {evt.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fast Triage Command Bar */}
            <div className="pt-space-xs flex flex-wrap items-center gap-space-sm">
              <button
                onClick={() => handleToggleAck(selectedIncident.id)}
                className={`px-space-md py-space-sm rounded font-body-sm text-body-sm font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                  acknowledgedIncidents[selectedIncident.id]
                    ? 'bg-surface-container-highest text-primary border border-primary/30'
                    : 'bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {acknowledgedIncidents[selectedIncident.id] ? 'done_all' : 'verified'}
                </span>
                <span>
                  {acknowledgedIncidents[selectedIncident.id]
                    ? 'Acknowledged by @you'
                    : 'Acknowledge Incident'}
                </span>
              </button>

              <button
                onClick={() => onOpenWarRoom('#inc-409')}
                className="px-space-md py-space-sm rounded bg-surface-container-high text-on-surface hover:bg-surface-bright transition-all font-body-sm text-body-sm font-semibold flex items-center gap-1.5 shadow-sm border border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">forum</span>
                <span>Open Slack War Room #inc-409</span>
              </button>

              <button
                onClick={handleEscalate}
                disabled={p1Escalated}
                className={`px-space-md py-space-sm rounded font-body-sm text-body-sm font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                  p1Escalated
                    ? 'bg-error text-on-error opacity-75 cursor-not-allowed'
                    : 'bg-error-container text-on-error-container hover:bg-error hover:text-on-error'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">emergency</span>
                <span>{p1Escalated ? 'P1 Escalated' : 'Declare P1 Escalation'}</span>
              </button>

              <button
                onClick={() => onOpenRunbook('Cache-Purge')}
                className="px-space-md py-space-sm rounded bg-surface-container-highest text-primary hover:bg-surface-bright transition-all font-body-sm text-body-sm font-semibold flex items-center gap-1.5 ml-auto shadow-sm border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                <span>Execute Mitigation Runbook</span>
              </button>
            </div>
          </div>

          {/* Live Incident Context & Service Topology */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            {/* Service Map Node Context */}
            <div className="p-space-md rounded bg-surface-container-low shadow-sm flex flex-col gap-space-sm border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant">
                  BLAST RADIUS ESTIMATE
                </span>
                <span className="font-code-inline text-code-inline text-tertiary">
                  TIER-1 DEGRADED
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-label-mono-sm text-label-mono-sm">
                  <span className="text-on-surface">Traffic Ingress Affected:</span>
                  <span className="text-tertiary font-bold">{selectedIncident.trafficAffected}</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1.5 rounded overflow-hidden">
                  <div className="bg-tertiary h-full w-[14.2%]"></div>
                </div>
                <div className="flex items-center justify-between font-label-mono-sm text-label-mono-sm pt-1">
                  <span className="text-on-surface">Failed Requests (Last 10m):</span>
                  <span className="text-error font-bold">{selectedIncident.failedRequests10m}</span>
                </div>
                <div className="flex items-center justify-between font-label-mono-sm text-label-mono-sm">
                  <span className="text-on-surface">Auto-Mitigation Run:</span>
                  <span className="text-primary font-bold">{selectedIncident.autoMitigation}</span>
                </div>
              </div>
            </div>

            {/* Runbook Execution Log Output */}
            <div className="p-space-md rounded bg-surface-container-low shadow-sm flex flex-col gap-space-sm border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant">
                  RUNBOOK TELEMETRY LOG
                </span>
                <span className="font-code-inline text-code-inline text-primary">EXIT 0</span>
              </div>
              <div className="p-space-xs rounded bg-surface-container-lowest font-code-inline text-code-inline text-on-surface-variant flex flex-col gap-1 overflow-x-auto border border-outline-variant/20">
                {selectedIncident.runbookOutput.map((out, idx) => (
                  <p
                    key={idx}
                    className={
                      out.includes('ready')
                        ? 'text-on-surface'
                        : out.includes('shift')
                        ? 'text-tertiary'
                        : 'text-primary'
                    }
                  >
                    {out}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Resolved Incidents Archive Table */}
      <div className="mt-space-xl p-space-lg rounded bg-surface-container shadow-md flex flex-col gap-space-md border border-outline-variant/20">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Resolved Incidents Archive &amp; Post-Mortems
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Historical incident audit logs, resolution lead times, and post-mortem review status.
            </p>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <button
              onClick={handleDownloadCSV}
              className="px-space-sm py-space-xs rounded bg-surface-container-high text-on-surface hover:bg-surface-bright transition-colors font-body-sm text-body-sm font-medium flex items-center gap-1 shadow-sm border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Download Incident CSV Report</span>
            </button>
            <button
              onClick={() => onOpenPostMortem(selectedIncident)}
              className="px-space-sm py-space-xs rounded bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-colors font-body-sm text-body-sm font-medium flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">post_add</span>
              <span>Draft New Post-Mortem</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest text-on-surface-variant font-label-mono-sm text-label-mono-sm uppercase tracking-wider">
                <th className="py-space-sm px-space-md rounded-l">Incident / Key</th>
                <th className="py-space-sm px-space-md">Severity</th>
                <th className="py-space-sm px-space-md">Duration (TTR)</th>
                <th className="py-space-sm px-space-md">Root Cause Category</th>
                <th className="py-space-sm px-space-md">Resolved At</th>
                <th className="py-space-sm px-space-md">Post-Mortem Status</th>
                <th className="py-space-sm px-space-md rounded-r text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-0 text-on-surface">
              {incidents
                .filter((i) => i.status === 'resolved')
                .map((inc) => (
                  <tr key={inc.id} className="hover:bg-surface-container-high transition-colors">
                    <td className="py-space-md px-space-md font-medium">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-semibold">{inc.title}</span>
                        <span className="font-code-inline text-code-inline text-on-surface-variant">
                          {inc.key} · {inc.serviceKey}
                        </span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-secondary font-label-mono-sm text-label-mono-sm font-bold uppercase">
                        {inc.severityLabel}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md font-label-mono-sm text-label-mono-sm">
                      {inc.duration}
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="px-space-xs py-0.5 rounded bg-surface-container-lowest text-tertiary font-code-inline text-code-inline border border-outline-variant/20">
                        {inc.rootCause}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                      {inc.resolvedAt}
                    </td>
                    <td className="py-space-md px-space-md">
                      {inc.postMortemStatus === 'published' ? (
                        <span className="px-space-xs py-0.5 rounded bg-primary-container text-on-primary-container font-label-mono-sm text-label-mono-sm font-bold flex items-center gap-1 w-max">
                          <span className="material-symbols-outlined text-[12px]">check</span> PM PUBLISHED
                        </span>
                      ) : (
                        <span className="px-space-xs py-0.5 rounded bg-tertiary-container text-on-tertiary-container font-label-mono-sm text-label-mono-sm font-bold flex items-center gap-1 w-max">
                          <span className="material-symbols-outlined text-[12px]">edit</span> PM DRAFTED
                        </span>
                      )}
                    </td>
                    <td className="py-space-md px-space-md text-right">
                      <button
                        onClick={() => onOpenPostMortem(inc)}
                        className={`font-code-inline text-code-inline hover:underline ${
                          inc.postMortemStatus === 'published' ? 'text-primary' : 'text-tertiary'
                        }`}
                      >
                        {inc.postMortemStatus === 'published' ? 'View PM →' : 'Edit Draft →'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
