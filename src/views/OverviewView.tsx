import React, { useState } from 'react';
import { NavTab, ServiceItem, IncidentItem, EdgeProbeNode } from '../types/telemetry';

interface OverviewViewProps {
  onNavigate: (tab: NavTab) => void;
  services: ServiceItem[];
  incidents: IncidentItem[];
  probes: EdgeProbeNode[];
  onSelectService: (serviceKey: string) => void;
  onSelectIncident: (incidentId: string) => void;
  onOpenRunbook: (name: string) => void;
  onOpenConsole: () => void;
  onShowToast: (title: string, msg: string, icon: string, color: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  services,
  incidents,
  probes,
  onSelectService,
  onSelectIncident,
  onOpenRunbook,
  onOpenConsole,
  onShowToast
}) => {
  const [p3Acknowledged, setP3Acknowledged] = useState(false);
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);

  // Generate 90 days of health status blocks (3 rows x 30 columns)
  // Day -70 is tertiary (BGP Flap 4m), Day -52 is error (Storage Degrade 19m), Day -2 is tertiary (Edge CDN Ongoing), rest operational
  const matrixDays = Array.from({ length: 90 }, (_, i) => {
    const dayIndex = 90 - i;
    if (dayIndex === 70) {
      return { day: dayIndex, status: 'tertiary', note: 'Day -70: 99.82% - BGP Flap (4m)' };
    }
    if (dayIndex === 52) {
      return { day: dayIndex, status: 'error', note: 'Day -52: 99.12% - Storage Degrade (19m)' };
    }
    if (dayIndex === 2) {
      return { day: dayIndex, status: 'tertiary', note: 'Day -2: 99.89% - Edge CDN (Ongoing)' };
    }
    if (dayIndex === 1) {
      return { day: dayIndex, status: 'primary', isToday: true, note: 'Today: 99.98% Healthy' };
    }
    return { day: dayIndex, status: 'primary', note: `Day -${dayIndex}: 100% Uptime` };
  });

  const handleExportPDF = () => {
    onShowToast('SLO PDF Exported', 'Downloaded: PulseSRE-SLO-Compliance-Report-Q3.pdf', 'file_download', 'text-primary');
  };

  return (
    <div className="flex flex-col w-full gap-space-lg pb-space-xl">
      {/* P3 Incident Banner & SRE Emergency Bar */}
      <div className="relative w-full overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-md border border-outline-variant/30">
        <div className={`absolute inset-y-0 left-0 w-1.5 ${p3Acknowledged ? 'bg-primary' : 'bg-tertiary'}`}></div>
        <div className="flex flex-wrap items-center justify-between gap-space-md pl-space-sm">
          <div className="flex items-center gap-space-md">
            <div className={`flex h-8 w-8 items-center justify-center rounded ${p3Acknowledged ? 'bg-primary-container text-on-primary-container' : 'bg-tertiary-container text-on-tertiary-container'} shadow-sm`}>
              <span className="material-symbols-outlined text-[18px]">
                {p3Acknowledged ? 'verified' : 'warning'}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className={`rounded ${p3Acknowledged ? 'bg-primary/20 text-primary' : 'bg-tertiary/20 text-tertiary'} px-space-xs py-0.5 font-label-mono-sm text-label-mono-sm font-semibold uppercase`}>
                  {p3Acknowledged ? 'P3 ACKNOWLEDGED' : 'P3 Minor'}
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  CDN Europe Edge elevated egress latency detected
                </span>
                <span className="rounded bg-surface-container-highest px-space-xs py-0.5 font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                  INC-8492
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Frankfurt edge proxy clusters routing through fallback node. TTFB +140ms across 4.2% regional traffic.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
              Triggered: <span className="font-semibold text-on-surface">14m ago</span>
            </span>
            <button
              onClick={() => onOpenRunbook('Cache-Purge')}
              className="flex items-center gap-space-xs rounded bg-surface-container-high px-space-sm py-space-xs font-body-sm text-body-sm font-medium text-on-surface hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-tertiary">play_circle</span>
              <span>Execute Cache-Purge Runbook</span>
            </button>
            <button
              onClick={() => {
                setP3Acknowledged(true);
                onShowToast('Incident Acknowledged', 'INC-8492 marked acknowledged by on-call commander.', 'done_all', 'text-primary');
              }}
              className={`flex items-center gap-space-xs rounded px-space-sm py-space-xs font-body-sm text-body-sm font-semibold transition-opacity ${
                p3Acknowledged
                  ? 'bg-surface-container text-primary cursor-default'
                  : 'bg-tertiary text-on-tertiary hover:opacity-90'
              }`}
            >
              <span>{p3Acknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top KPI Telemetry Strip */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-space-md">
        {/* Global Uptime */}
        <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-space-md shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant tracking-wider">
              Global Uptime (30d)
            </span>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              <span className="font-label-mono-sm text-label-mono-sm text-primary">SLO MET</span>
            </div>
          </div>
          <div className="mt-space-sm flex items-baseline gap-space-xs">
            <span className="font-metric-display text-metric-display text-on-surface tracking-tight">99.98</span>
            <span className="font-headline-sm text-headline-sm text-primary">%</span>
          </div>
          <div className="mt-space-sm flex items-center justify-between">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Target: 99.95%</span>
            <span className="rounded bg-primary/10 px-space-xs font-label-mono-sm text-label-mono-sm text-primary">+0.03% margin</span>
          </div>
        </div>

        {/* MTTR */}
        <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-space-md shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant tracking-wider">
              Avg MTTR (Rolling)
            </span>
            <span className="material-symbols-outlined text-[16px] text-primary">timer</span>
          </div>
          <div className="mt-space-sm flex items-baseline gap-space-xs">
            <span className="font-metric-display text-metric-display text-on-surface tracking-tight">4m 12s</span>
          </div>
          <div className="mt-space-sm flex items-center justify-between">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Target &lt; 15m</span>
            <span className="rounded bg-primary/10 px-space-xs font-label-mono-sm text-label-mono-sm text-primary">-18s vs prev wk</span>
          </div>
        </div>

        {/* Global Error Rate */}
        <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-space-md shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant tracking-wider">
              Error Rate (5xx)
            </span>
            <span className="rounded bg-primary/15 px-space-xs py-0.5 font-label-mono-sm text-label-mono-sm text-primary">
              UNDER SLO
            </span>
          </div>
          <div className="mt-space-sm flex items-baseline gap-space-xs">
            <span className="font-metric-display text-metric-display text-on-surface tracking-tight">0.04</span>
            <span className="font-headline-sm text-headline-sm text-primary">%</span>
          </div>
          <div className="mt-space-sm flex items-center justify-between">
            <span className="font-body-sm text-body-sm text-on-surface-variant">SLO ceiling 0.10%</span>
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">42.1k req/s</span>
          </div>
        </div>

        {/* Error Budget Remaining */}
        <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-space-md shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant tracking-wider">
              Error Budget Left
            </span>
            <span className="font-label-mono-sm text-label-mono-sm text-primary font-semibold">Q3 SAFE</span>
          </div>
          <div className="mt-space-sm flex items-baseline gap-space-xs">
            <span className="font-metric-display text-metric-display text-on-surface tracking-tight">86.4</span>
            <span className="font-headline-sm text-headline-sm text-on-surface">%</span>
          </div>
          <div className="mt-space-sm flex items-center justify-between">
            <span className="font-body-sm text-body-sm text-on-surface-variant">124 days runway</span>
            <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[86.4%]"></div>
            </div>
          </div>
        </div>

        {/* Avg Latency & P95 */}
        <div className="col-span-2 md:col-span-1 xl:col-span-1 flex flex-col justify-between rounded-xl bg-surface-container-low p-space-md shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant tracking-wider">
              Response Latency
            </span>
            <span className="font-label-mono-sm text-label-mono-sm text-tertiary">p95: 280ms</span>
          </div>
          <div className="mt-space-sm flex items-baseline gap-space-xs">
            <span className="font-metric-display text-metric-display text-on-surface tracking-tight">142</span>
            <span className="font-headline-sm text-headline-sm text-on-surface-variant">ms</span>
          </div>
          <div className="mt-space-sm flex items-center justify-between font-label-mono-sm text-label-mono-sm">
            <span className="text-on-surface-variant">p50: 84ms</span>
            <span className="text-tertiary font-semibold">p99: 420ms</span>
          </div>
        </div>
      </section>

      {/* Full-Width Interactive 90-Day Availability & Uptime Matrix */}
      <section className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-md">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-surface-container-high text-primary">
              <span className="material-symbols-outlined text-[18px]">calendar_view_month</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
                Global System Health Matrix (Last 90 Days)
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Aggregated telemetry across all active availability zones, ingress gateways, and edge nodes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-md font-label-mono-sm text-label-mono-sm flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-primary"></span>
              <span className="text-on-surface-variant">100% Operational</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-tertiary"></span>
              <span className="text-on-surface-variant">Minor Issue (&lt;10m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-error"></span>
              <span className="text-on-surface-variant">Outage (&gt;15m)</span>
            </div>
            <div className="h-4 w-px bg-surface-container-highest"></div>
            <span className="font-semibold text-primary">99.989% Overall Compliance</span>
          </div>
        </div>

        {/* 90-Day Visual Grid Blocks */}
        <div className="w-full overflow-x-auto py-space-xs">
          <div className="min-w-[840px] flex flex-col gap-1.5">
            <div className="flex justify-between text-on-surface-variant font-label-mono-sm text-label-mono-sm px-0.5">
              <span>90 days ago (Nov 18)</span>
              <span>45 days ago</span>
              <span>Today (Feb 16) - 100% Target Met</span>
            </div>

            {/* Matrix 3 Rows x 30 Cols */}
            <div className="grid grid-flow-col grid-rows-3 gap-1.5 h-16 w-full">
              {matrixDays.map((item, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredTile(item.note)}
                  onMouseLeave={() => setHoveredTile(null)}
                  className={`group relative rounded-sm cursor-pointer transition-all hover:opacity-80 ${
                    item.status === 'primary'
                      ? 'bg-primary'
                      : item.status === 'tertiary'
                      ? 'bg-tertiary'
                      : 'bg-error'
                  } ${item.isToday ? 'animate-pulse' : ''}`}
                >
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex z-30 rounded bg-surface-container-highest px-2 py-1 text-label-mono-sm font-label-mono-sm text-on-surface whitespace-nowrap shadow-lg border border-outline-variant/40">
                    {item.note}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Asymmetric Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg w-full">
        {/* LEFT COLUMN (60% -> 7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          {/* Core Infrastructure Services */}
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">dns</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Core Infrastructure Services</h3>
                <span className="rounded bg-surface-container-highest px-space-xs font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                  4 Clusters
                </span>
              </div>
              <div className="flex items-center gap-space-xs">
                <button
                  onClick={() => onNavigate('services')}
                  className="flex items-center gap-1 rounded bg-surface-container px-space-sm py-1 font-label-mono-sm text-label-mono-sm text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">filter_list</span>
                  <span>Filter All</span>
                </button>
                <button
                  onClick={() => onShowToast('Live Sync Active', 'Mesh telemetry refreshed every 5s', 'refresh', 'text-primary')}
                  className="flex items-center gap-1 rounded bg-surface-container px-space-sm py-1 font-label-mono-sm text-label-mono-sm text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  <span>Live 5s</span>
                </button>
              </div>
            </div>

            {/* Service Cards Grid */}
            <div className="flex flex-col gap-space-sm">
              {/* Item 1: API Gateway Global */}
              <div
                onClick={() => {
                  onNavigate('services');
                  onSelectService('gateway');
                }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md rounded-lg bg-surface-container p-space-md hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/10"
              >
                <div className="flex items-center gap-space-md min-w-[200px]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                        API Gateway Global
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </div>
                    <span className="font-code-inline text-code-inline text-on-surface-variant truncate">
                      ingress-gw.prod.mesh // 96 pods
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-lg w-full md:w-auto justify-between md:justify-end">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-metric-display text-headline-sm text-on-surface">32ms</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">p99</span>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm text-primary">99.99% (30d)</span>
                  </div>
                  <div className="w-24 h-8 flex items-center">
                    <svg className="w-full h-7 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 100 30">
                      <path d="M0 20 Q 15 22, 25 15 T 50 18 T 75 12 T 100 14" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M0 20 Q 15 22, 25 15 T 50 18 T 75 12 T 100 14 L 100 30 L 0 30 Z" fill="currentColor" fillOpacity="0.12" stroke="none" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="rounded bg-primary/15 px-space-xs py-0.5 font-label-mono-sm text-label-mono-sm font-semibold text-primary">
                      OPERATIONAL
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </div>
                </div>
              </div>

              {/* Item 2: Auth & Session Vault */}
              <div
                onClick={() => {
                  onNavigate('services');
                  onSelectService('auth');
                }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md rounded-lg bg-surface-container p-space-md hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/10"
              >
                <div className="flex items-center gap-space-md min-w-[200px]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                        Auth &amp; Session Vault
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </div>
                    <span className="font-code-inline text-code-inline text-on-surface-variant truncate">
                      auth-core.internal // 48 pods
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-lg w-full md:w-auto justify-between md:justify-end">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-metric-display text-headline-sm text-on-surface">18ms</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">p99</span>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm text-primary">100.0% (30d)</span>
                  </div>
                  <div className="w-24 h-8 flex items-center">
                    <svg className="w-full h-7 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 100 30">
                      <path d="M0 16 Q 20 17, 35 15 T 60 14 T 80 16 T 100 13" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M0 16 Q 20 17, 35 15 T 60 14 T 80 16 T 100 13 L 100 30 L 0 30 Z" fill="currentColor" fillOpacity="0.12" stroke="none" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="rounded bg-primary/15 px-space-xs py-0.5 font-label-mono-sm text-label-mono-sm font-semibold text-primary">
                      OPERATIONAL
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </div>
                </div>
              </div>

              {/* Item 3: Primary DB Shards */}
              <div
                onClick={() => {
                  onNavigate('services');
                  onSelectService('postgres');
                }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md rounded-lg bg-surface-container p-space-md hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/10"
              >
                <div className="flex items-center gap-space-md min-w-[200px]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[20px]">database</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                        Primary DB Shards (Cockroach)
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </div>
                    <span className="font-code-inline text-code-inline text-on-surface-variant truncate">
                      cluster-db.main // 12 nodes (Multi-AZ)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-lg w-full md:w-auto justify-between md:justify-end">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-metric-display text-headline-sm text-on-surface">58ms</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">p99</span>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm text-primary">99.95% (30d)</span>
                  </div>
                  <div className="w-24 h-8 flex items-center">
                    <svg className="w-full h-7 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 100 30">
                      <path d="M0 24 Q 25 10, 40 22 T 70 8 T 100 20" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M0 24 Q 25 10, 40 22 T 70 8 T 100 20 L 100 30 L 0 30 Z" fill="currentColor" fillOpacity="0.12" stroke="none" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="rounded bg-primary/15 px-space-xs py-0.5 font-label-mono-sm text-label-mono-sm font-semibold text-primary">
                      OPERATIONAL
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </div>
                </div>
              </div>

              {/* Item 4: Edge CDN Points-of-Presence (Degraded) */}
              <div
                onClick={() => {
                  onNavigate('services');
                  onSelectService('cdn');
                }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md rounded-lg bg-surface-container p-space-md hover:bg-surface-container-high transition-colors cursor-pointer border border-tertiary/30"
              >
                <div className="flex items-center gap-space-md min-w-[200px]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-tertiary-container text-on-tertiary-container">
                    <span className="material-symbols-outlined text-[20px]">public</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                        Edge CDN Points-of-Presence
                      </span>
                      <span className="h-2 w-2 rounded-full bg-tertiary animate-ping"></span>
                    </div>
                    <span className="font-code-inline text-code-inline text-on-surface-variant truncate">
                      cdn-anycast.global // 32 PoPs active
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-lg w-full md:w-auto justify-between md:justify-end">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-metric-display text-headline-sm text-tertiary">265ms</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-tertiary">p99</span>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm text-tertiary">98.92% (30d)</span>
                  </div>
                  <div className="w-24 h-8 flex items-center">
                    <svg className="w-full h-7 text-tertiary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 100 30">
                      <path d="M0 24 Q 15 22, 30 20 T 55 18 T 70 8 T 85 4 T 100 1" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M0 24 Q 15 22, 30 20 T 55 18 T 70 8 T 85 4 T 100 1 L 100 30 L 0 30 Z" fill="currentColor" fillOpacity="0.15" stroke="none" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="rounded bg-tertiary/20 px-space-xs py-0.5 font-label-mono-sm text-label-mono-sm font-semibold text-tertiary">
                      DEGRADED
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* E2E Latency Distribution (Consolidated Mesh) */}
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[20px]">speed</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  E2E Latency Distribution (Consolidated Mesh)
                </h3>
              </div>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">WINDOW: LAST 60 MINS</span>
            </div>

            {/* 3-Block Percentile Cluster */}
            <div className="grid grid-cols-3 gap-space-md rounded-lg bg-surface-container p-space-md">
              <div className="flex flex-col items-center justify-center p-space-sm text-center">
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">P50 Latency</span>
                <span className="font-metric-display text-headline-lg text-primary tracking-tight mt-1">
                  42<span className="text-headline-sm">ms</span>
                </span>
                <span className="font-body-sm text-body-sm text-primary flex items-center gap-0.5 mt-1">
                  <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span> -3ms (Nominal)
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-space-sm text-center border-l border-r border-outline-variant/30">
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">P90 Latency</span>
                <span className="font-metric-display text-headline-lg text-on-surface tracking-tight mt-1">
                  118<span className="text-headline-sm">ms</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-0.5 mt-1">
                  <span className="material-symbols-outlined text-[14px]">horizontal_rule</span> 0ms change
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-space-sm text-center">
                <span className="font-label-mono-sm text-label-mono-sm text-tertiary uppercase">P99 Latency</span>
                <span className="font-metric-display text-headline-lg text-tertiary tracking-tight mt-1">
                  395<span className="text-headline-sm">ms</span>
                </span>
                <span className="font-body-sm text-body-sm text-tertiary flex items-center gap-0.5 mt-1">
                  <span className="material-symbols-outlined text-[14px]">arrow_drop_up</span> +64ms (Anomaly)
                </span>
              </div>
            </div>

            {/* Latency Area Chart Visualization */}
            <div className="relative w-full h-32 rounded bg-surface-container-highest/40 overflow-hidden flex flex-col justify-end p-space-xs">
              <svg className="w-full h-24" preserveAspectRatio="none" viewBox="0 0 500 100">
                <path d="M0,80 Q75,75 150,82 T300,70 T400,20 T500,45 L500,100 L0,100 Z" fill="rgba(255, 185, 95, 0.15)" />
                <path d="M0,80 Q75,75 150,82 T300,70 T400,20 T500,45" fill="none" stroke="#ffb95f" strokeWidth="2" />
                <path d="M0,90 Q75,88 150,91 T300,89 T400,85 T500,88 L500,100 L0,100 Z" fill="rgba(78, 222, 163, 0.15)" />
                <path d="M0,90 Q75,88 150,91 T300,89 T400,85 T500,88" fill="none" stroke="#4edea3" strokeWidth="2" />
              </svg>
              <div className="flex justify-between items-center text-label-mono-sm font-label-mono-sm text-on-surface-variant px-space-xs">
                <span>15:00 UTC</span>
                <span>15:20 UTC</span>
                <span>15:40 UTC</span>
                <span className="text-on-surface font-semibold">16:00 UTC (Now)</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (40% -> 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          {/* Weekly Reliability Score Card */}
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant tracking-wider">
                Weekly SRE Index
              </span>
              <span className="rounded bg-primary-container text-on-primary-container px-space-xs font-label-mono-sm text-label-mono-sm font-bold">
                GRADE A+
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-display text-headline-lg text-primary font-bold">99.8</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface-variant">/ 100 PTS</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Calculated via MTTR, Burn Rate &amp; Synthetic probe success
                </p>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-highest"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-primary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="99.8, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="material-symbols-outlined text-[20px] text-primary absolute">verified</span>
              </div>
            </div>
          </div>

          {/* Edge Probes Summary Map & Ping Matrix */}
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">travel_explore</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Edge Probes &amp; Synthetic Heartbeats</h3>
              </div>
              <span className="font-label-mono-sm text-label-mono-sm text-primary">All Active</span>
            </div>

            {/* Mini Probe Map Visual Container */}
            <div
              className="w-full h-36 rounded-lg bg-surface-container relative overflow-hidden flex flex-col justify-end p-space-sm bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAXOdXqegCIJWKYQISCTGmRbcyHjHvNa9YP2wrkobyjbLKBS77g9efYxB5zpyBqtmyyDXxYmO-xcNYn8GqZf0n5zRYfsCQYfc4mFjx4VZzhwXYPQPfw2iMPKxGYV4eu2-O53Aw_YIR22DOzfjkTIbn9MC1iH-WKzKYWXbop5HUoLAKk5A-g1BL4z8Ai3W-InROSX2hUJkP-Y0Kxs3TjW0XBO50sp0igKXvzle0shnzjTnfsK7Y809YnZw')"
              }}
            >
              <div className="absolute inset-0 bg-surface-dim/80 backdrop-blur-[2px]"></div>
              <div className="relative z-10 flex items-center justify-between bg-surface-container-lowest/80 p-space-xs rounded backdrop-blur-md">
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface">Global Ingress Routing Matrix</span>
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Frequency: 30s</span>
              </div>
            </div>

            {/* Ping Response Times Breakdown */}
            <div className="grid grid-cols-2 gap-space-sm">
              {probes.map((p) => (
                <div key={p.id} className="rounded bg-surface-container p-space-sm flex flex-col justify-between border border-outline-variant/10">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono-md text-label-mono-md text-on-surface font-semibold">
                      {p.name.split(' ')[0]}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        p.status === 'optimal'
                          ? 'bg-primary'
                          : p.status === 'moderate'
                          ? 'bg-surface-tint'
                          : 'bg-tertiary animate-pulse'
                      }`}
                    ></span>
                  </div>
                  <div className="mt-space-xs flex items-baseline justify-between">
                    <span
                      className={`font-metric-display text-headline-sm ${
                        p.status === 'elevated' ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {p.latencyMs}ms
                    </span>
                    <span
                      className={`font-label-mono-sm text-label-mono-sm ${
                        p.lossPercent > 0 ? 'text-tertiary' : 'text-primary'
                      }`}
                    >
                      {p.lossPercent > 0 ? `${p.lossPercent}% drop` : '0% loss'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live SRE Incident Stream & Runbooks */}
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[20px]">notifications_active</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Live Incident Feed</h3>
              </div>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">AUTO-REFRESH</span>
            </div>

            <div className="flex flex-col gap-space-sm">
              {/* Incident 1 Active */}
              <div className="rounded bg-surface-container p-space-md flex flex-col gap-space-xs border-l-2 border-tertiary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="rounded bg-tertiary-container px-space-xs text-on-tertiary-container font-label-mono-sm text-label-mono-sm font-semibold">
                      P3
                    </span>
                    <span className="font-code-inline text-code-inline text-on-surface font-semibold">
                      CDN-EU-EDGE-LATENCY
                    </span>
                  </div>
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">14m ago</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Frankfurt edge proxy experiencing intermittent packet reordering via transit peer AS3356.
                </p>
                <div className="mt-space-xs flex items-center justify-between pt-space-xs">
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface">
                    Assignee: <span className="text-secondary font-semibold">@devops-oncall</span>
                  </span>
                  <button
                    onClick={() => {
                      onNavigate('incidents');
                      onSelectIncident('inc-409');
                    }}
                    className="rounded bg-surface-container-high px-space-sm py-1 font-body-sm text-body-sm text-on-surface hover:bg-surface-variant transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>

              {/* Incident 2 Resolved */}
              <div className="rounded bg-surface-container p-space-md flex flex-col gap-space-xs border-l-2 border-primary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="rounded bg-primary-container px-space-xs text-on-primary-container font-label-mono-sm text-label-mono-sm font-semibold">
                      RESOLVED
                    </span>
                    <span className="font-code-inline text-code-inline text-on-surface font-semibold">
                      DB-CONNECTION-POOL-SPIKE
                    </span>
                  </div>
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">2h 15m ago</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Primary pool saturated to 92%. Automated pod horizontal autoscaler spun up 16 extra nodes.
                </p>
                <div className="mt-space-xs flex items-center justify-between pt-space-xs">
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                    Duration: 4m 12s
                  </span>
                  <button
                    onClick={() => {
                      onNavigate('incidents');
                      onSelectIncident('inc-408');
                    }}
                    className="rounded bg-surface-container-high px-space-sm py-1 font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Post-Mortem
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="mt-space-sm pt-space-md flex items-center justify-between gap-space-sm border-t border-surface-container-highest">
              <button
                onClick={handleExportPDF}
                className="flex-1 flex items-center justify-center gap-space-xs rounded bg-surface-container px-space-sm py-space-sm font-body-sm text-body-sm text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>Export SLO PDF</span>
              </button>
              <button
                onClick={onOpenConsole}
                className="flex-1 flex items-center justify-center gap-space-xs rounded bg-primary-container px-space-sm py-space-sm font-body-sm text-body-sm font-semibold text-on-primary-container hover:bg-primary hover:text-on-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">terminal</span>
                <span>SRE Ops Console</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
