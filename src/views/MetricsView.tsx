import React, { useState, useEffect } from 'react';
import { EdgeProbeNode } from '../types/telemetry';

interface MetricsViewProps {
  probes: EdgeProbeNode[];
  onOpenNewAlert: () => void;
  onOpenRunbook: (name: string) => void;
  onShowToast: (title: string, msg: string, icon: string, color: string) => void;
}

export const MetricsView: React.FC<MetricsViewProps> = ({
  probes,
  onOpenNewAlert,
  onOpenRunbook,
  onShowToast
}) => {
  const [timeWindow, setTimeWindow] = useState('24H');
  const [isStreaming, setIsStreaming] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; time: string; p99: number; p90: number; p50: number } | null>({
    x: 680,
    y: 60,
    time: '18:42:00 UTC (Spike Analysis)',
    p99: 310,
    p90: 125,
    p50: 48
  });

  // Dynamic live metric fluctuation simulation when streaming
  const [trafficRpm, setTrafficRpm] = useState(14280);
  const [medianLatency, setMedianLatency] = useState(64);
  const [clusterDropdownOpen, setClusterDropdownOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState('k8s-prod-useast1-mesh');

  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setTrafficRpm((prev) => prev + Math.floor(Math.random() * 21) - 10);
      setMedianLatency((prev) => Math.max(58, Math.min(72, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 5000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const toggleStream = () => {
    const next = !isStreaming;
    setIsStreaming(next);
    onShowToast(
      next ? 'Live Stream Resumed' : 'Live Stream Paused',
      next ? 'Auto-refreshing metrics every 5s' : 'Static telemetry snapshot frozen',
      next ? 'play_arrow' : 'pause',
      next ? 'text-primary' : 'text-on-surface-variant'
    );
  };

  const handleExportTelemetry = () => {
    onShowToast('Telemetry Exported', 'Downloaded: mesh-telemetry-dump-24h.json', 'file_download', 'text-primary');
  };

  return (
    <div className="flex flex-col w-full pb-space-xl">
      {/* Interactive Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-space-md py-space-sm mb-space-md bg-surface-container-low px-space-md rounded-xl shadow-md border border-outline-variant/20">
        <div className="flex items-center flex-wrap gap-space-sm">
          {/* Time Window Tabs */}
          <div className="flex items-center bg-surface-container-highest p-space-xs rounded-lg text-label-mono-sm font-label-mono-sm border border-outline-variant/20">
            {['1H', '6H', '24H', '7D', '30D', 'CUSTOM'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeWindow(t)}
                className={`px-space-sm py-space-xs rounded transition-colors ${
                  timeWindow === t
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Live Stream Pill */}
          <button
            onClick={toggleStream}
            className={`flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-label-mono-sm font-label-mono-sm shadow-sm hover:bg-surface-container-high transition-colors border border-outline-variant/20 ${
              isStreaming ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isStreaming && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isStreaming ? 'bg-primary' : 'bg-outline'
                }`}
              ></span>
            </span>
            <span className="font-semibold tracking-wider">
              {isStreaming ? 'LIVE 5s' : 'PAUSED'}
            </span>
          </button>

          {/* Region Cluster Dropdown */}
          <div className="relative inline-block">
            <button
              onClick={() => setClusterDropdownOpen(!clusterDropdownOpen)}
              className="flex items-center gap-space-xs bg-surface-container-highest px-space-md py-space-xs rounded text-body-sm font-body-sm text-on-surface cursor-pointer hover:bg-surface-bright transition-colors border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">hub</span>
              <span className="font-label-mono-md text-label-mono-md">{selectedCluster}</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                expand_more
              </span>
            </button>

            {clusterDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 rounded bg-surface-container-highest shadow-xl z-30 p-1 flex flex-col gap-0.5 border border-outline-variant/40">
                {['k8s-prod-useast1-mesh', 'k8s-prod-uswest2-mesh', 'k8s-prod-eucentral1-mesh'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedCluster(c);
                      setClusterDropdownOpen(false);
                      onShowToast('Cluster Changed', `Telemetry filtered by ${c}`, 'hub', 'text-primary');
                    }}
                    className={`text-left px-space-sm py-space-xs rounded text-body-sm font-body-sm flex items-center justify-between ${
                      selectedCluster === c
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    <span>{c}</span>
                    {selectedCluster === c && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-space-sm">
          <button
            onClick={handleExportTelemetry}
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-high hover:bg-surface-bright text-on-surface text-body-sm font-body-sm transition-colors shadow-sm border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[15px]">file_download</span>
            <span>Export Telemetry</span>
          </button>
          <button
            onClick={onOpenNewAlert}
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary text-body-sm font-body-sm font-semibold transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">notifications_active</span>
            <span>Set SLO Alert</span>
          </button>
        </div>
      </div>

      {/* Row 1: Error Budget Burn Rate & Depletion Runway */}
      <div className="mb-space-md p-space-lg bg-surface-container-low rounded-xl shadow-md relative overflow-hidden border border-outline-variant/20">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-lg relative z-10">
          {/* Metrics & Status Header */}
          <div className="flex flex-col gap-space-xs max-w-sm">
            <div className="flex items-center gap-space-sm">
              <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-label-mono-sm font-label-mono-sm uppercase text-on-surface-variant tracking-wider">
                SLO Policy Target: 99.95%
              </span>
              <span className="flex items-center gap-1 text-primary text-label-mono-sm font-label-mono-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                NOMINAL CONSUMPTION
              </span>
            </div>
            <div className="flex items-baseline gap-space-sm">
              <span className="font-metric-display text-metric-display text-on-surface">
                0.42<span className="text-primary text-headline-md font-headline-md font-normal">x</span>
              </span>
              <span className="text-body-sm font-body-sm text-on-surface-variant">
                Burn Rate Velocity (1h window)
              </span>
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Current trend leaves error budget intact for{' '}
              <span className="text-primary font-semibold">124 days</span> without breaching SLA guarantee window.
            </p>
          </div>

          {/* Multi-stage Burn Meter */}
          <div className="flex-1 max-w-2xl flex flex-col gap-space-xs">
            <div className="flex justify-between items-center text-label-mono-sm font-label-mono-sm text-on-surface-variant mb-space-xs flex-wrap gap-1">
              <span className="text-primary">0.1x PRISTINE</span>
              <span className="text-on-surface font-semibold bg-surface-container px-space-xs rounded">
                CURRENT: 0.42x
              </span>
              <span className="text-tertiary">1.0x EXHAUSTION LIMIT</span>
              <span className="text-error font-semibold">&gt; 2.0x CRITICAL P1</span>
            </div>
            <div className="relative w-full h-3 bg-surface-container-highest rounded-full overflow-hidden flex">
              <div className="h-full bg-primary" style={{ width: '25%' }}></div>
              <div className="h-full bg-surface-tint" style={{ width: '17%' }}></div>
              <div className="h-full bg-surface-container-high" style={{ width: '8%' }}></div>
              <div className="h-full bg-tertiary/40" style={{ width: '25%' }}></div>
              <div className="h-full bg-error-container/40" style={{ width: '25%' }}></div>
              <div className="absolute top-0 bottom-0 left-[21%] w-1 bg-inverse-surface shadow-md"></div>
            </div>
            <div className="flex justify-between items-center text-label-mono-sm font-label-mono-sm text-on-surface-variant mt-space-xs">
              <span>0.00% consumed / hr</span>
              <span>
                Rolling 30-Day Allocation:{' '}
                <strong className="text-on-surface font-label-mono-sm">94.8% Remaining</strong>
              </span>
            </div>
          </div>

          {/* Forecast Box */}
          <div className="flex items-center gap-space-md border-t md:border-t-0 md:border-l border-surface-variant pt-space-md md:pt-0 md:pl-space-lg">
            <div className="flex flex-col text-right md:text-left">
              <span className="text-label-mono-sm font-label-mono-sm text-on-surface-variant uppercase">
                Incident Forecast
              </span>
              <span className="text-headline-sm font-headline-sm text-primary">0% Risk</span>
              <span className="text-label-mono-sm font-label-mono-sm text-on-surface-variant">
                Burn window stable
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Golden Signals 4-Card KPI Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-md">
        {/* 1. Traffic */}
        <div className="p-space-lg bg-surface-container-low rounded-xl shadow-md flex flex-col justify-between hover:bg-surface-container transition-colors border border-outline-variant/20">
          <div className="flex items-center justify-between text-label-mono-sm font-label-mono-sm text-on-surface-variant mb-space-xs">
            <span className="uppercase tracking-wider">Traffic Rate</span>
            <span className="flex items-center gap-space-xs text-primary bg-primary/10 px-space-xs py-0.5 rounded font-semibold">
              <span className="material-symbols-outlined text-[13px]">trending_up</span>+8.2%
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-metric-display text-metric-display text-on-surface">
                {trafficRpm.toLocaleString()}
              </span>
              <span className="text-label-mono-sm font-label-mono-sm text-on-surface-variant">RPM</span>
            </div>
            <span className="text-body-sm font-body-sm text-on-surface-variant">vs 13,200 avg baseline</span>
          </div>
          <div className="mt-space-md flex items-end gap-1 h-8">
            <div className="flex-1 bg-surface-container-highest hover:bg-primary transition-colors h-[45%] rounded-t-sm"></div>
            <div className="flex-1 bg-surface-container-highest hover:bg-primary transition-colors h-[55%] rounded-t-sm"></div>
            <div className="flex-1 bg-surface-container-highest hover:bg-primary transition-colors h-[40%] rounded-t-sm"></div>
            <div className="flex-1 bg-surface-container-highest hover:bg-primary transition-colors h-[70%] rounded-t-sm"></div>
            <div className="flex-1 bg-surface-container-highest hover:bg-primary transition-colors h-[65%] rounded-t-sm"></div>
            <div className="flex-1 bg-surface-container-highest hover:bg-primary transition-colors h-[85%] rounded-t-sm"></div>
            <div className="flex-1 bg-surface-container-highest hover:bg-primary transition-colors h-[75%] rounded-t-sm"></div>
            <div className="flex-1 bg-primary h-[95%] rounded-t-sm"></div>
            <div className="flex-1 bg-primary h-[100%] rounded-t-sm"></div>
          </div>
        </div>

        {/* 2. Error Rate */}
        <div className="p-space-lg bg-surface-container-low rounded-xl shadow-md flex flex-col justify-between hover:bg-surface-container transition-colors border border-outline-variant/20">
          <div className="flex items-center justify-between text-label-mono-sm font-label-mono-sm text-on-surface-variant mb-space-xs">
            <span className="uppercase tracking-wider">Errors (5xx)</span>
            <span className="flex items-center gap-space-xs text-primary bg-primary/10 px-space-xs py-0.5 rounded font-semibold">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>PASS
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-metric-display text-metric-display text-primary">0.02</span>
              <span className="text-label-mono-sm font-label-mono-sm text-on-surface-variant">%</span>
            </div>
            <span className="text-body-sm font-body-sm text-on-surface-variant">Strict SLA Target &lt; 0.10%</span>
          </div>
          <div className="mt-space-md flex flex-col gap-1">
            <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[20%]"></div>
            </div>
            <div className="flex justify-between text-label-mono-sm font-label-mono-sm text-on-surface-variant">
              <span>2.8 err/min</span>
              <span>Threshold 14.2/min</span>
            </div>
          </div>
        </div>

        {/* 3. Median Latency */}
        <div className="p-space-lg bg-surface-container-low rounded-xl shadow-md flex flex-col justify-between hover:bg-surface-container transition-colors border border-outline-variant/20">
          <div className="flex items-center justify-between text-label-mono-sm font-label-mono-sm text-on-surface-variant mb-space-xs">
            <span className="uppercase tracking-wider">Median Latency</span>
            <span className="flex items-center gap-space-xs text-primary bg-primary/10 px-space-xs py-0.5 rounded font-semibold">
              <span className="material-symbols-outlined text-[13px]">schedule</span>IN SLA
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-metric-display text-metric-display text-on-surface">
                {medianLatency}
              </span>
              <span className="text-label-mono-sm font-label-mono-sm text-on-surface-variant">ms P50</span>
            </div>
            <span className="text-body-sm font-body-sm text-on-surface-variant">Global weighted average</span>
          </div>
          <div className="mt-space-md h-8 flex items-end">
            <svg className="w-full h-8 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path
                className="text-surface-tint"
                d="M0,22 Q15,10 30,18 T60,12 T80,16 T100,6"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
              <circle className="fill-primary" cx="100" cy="6" r="3" />
            </svg>
          </div>
        </div>

        {/* 4. Saturation */}
        <div className="p-space-lg bg-surface-container-low rounded-xl shadow-md flex flex-col justify-between hover:bg-surface-container transition-colors border border-outline-variant/20">
          <div className="flex items-center justify-between text-label-mono-sm font-label-mono-sm text-on-surface-variant mb-space-xs">
            <span className="uppercase tracking-wider">Saturation</span>
            <span className="text-label-mono-sm font-label-mono-sm text-secondary bg-secondary-container/20 px-space-xs py-0.5 rounded font-semibold">
              48 PODS
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-metric-display text-metric-display text-on-surface">
                42<span className="text-headline-sm font-headline-sm font-normal text-on-surface-variant">%</span> / 61
                <span className="text-headline-sm font-headline-sm font-normal text-on-surface-variant">%</span>
              </span>
            </div>
            <span className="text-body-sm font-body-sm text-on-surface-variant">CPU vs RAM allocation</span>
          </div>
          <div className="mt-space-md flex flex-col gap-1.5">
            <div className="flex items-center gap-space-xs">
              <span className="text-label-mono-sm font-label-mono-sm text-on-surface-variant w-7">CPU</span>
              <div className="flex-1 bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[42%]"></div>
              </div>
              <span className="text-label-mono-sm font-label-mono-sm text-on-surface w-6 text-right">42%</span>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="text-label-mono-sm font-label-mono-sm text-on-surface-variant w-7">RAM</span>
              <div className="flex-1 bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                <div className="bg-tertiary h-full w-[61%]"></div>
              </div>
              <span className="text-label-mono-sm font-label-mono-sm text-on-surface w-6 text-right">61%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Response Time Spectrum & Latency Distribution Chart */}
      <div className="mb-space-md p-space-lg bg-surface-container-low rounded-xl shadow-md border border-outline-variant/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[18px]">stacked_line_chart</span>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Response Time Spectrum &amp; Percentile Latencies
              </h2>
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Continuous multi-line telemetry over 24 hours with anomaly threshold tracking
            </p>
          </div>

          {/* Percentile KPI Badges */}
          <div className="flex items-center gap-space-md flex-wrap">
            <div className="flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container rounded-lg border border-outline-variant/10">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
              <span className="text-label-mono-sm font-label-mono-sm text-on-surface-variant uppercase">P50 FAST:</span>
              <span className="text-label-mono-md font-label-mono-md font-semibold text-primary">48ms</span>
            </div>
            <div className="flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container rounded-lg border border-outline-variant/10">
              <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span>
              <span className="text-label-mono-sm font-label-mono-sm text-on-surface-variant uppercase">P90 GUARD:</span>
              <span className="text-label-mono-md font-label-mono-md font-semibold text-secondary">125ms</span>
            </div>
            <div className="flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container rounded-lg border border-outline-variant/10">
              <span className="w-2 h-2 rounded-full bg-tertiary inline-block"></span>
              <span className="text-label-mono-sm font-label-mono-sm text-on-surface-variant uppercase">P99 TAIL:</span>
              <span className="text-label-mono-md font-label-mono-md font-semibold text-tertiary">310ms</span>
            </div>
          </div>
        </div>

        {/* Interactive Continuous SVG Chart Area */}
        <div
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = Math.max(0, Math.min(1000, ((e.clientX - rect.left) / rect.width) * 1000));
            setHoveredPoint({
              x: relX,
              y: 60,
              time: '18:42:00 UTC (Dynamic Sample)',
              p99: Math.round(280 + Math.sin(relX / 50) * 40),
              p90: Math.round(115 + Math.cos(relX / 40) * 15),
              p50: Math.round(45 + Math.sin(relX / 70) * 6)
            });
          }}
          className="relative w-full h-64 bg-surface-container-lowest/70 rounded-lg p-space-md flex flex-col justify-between overflow-hidden border border-outline-variant/20 cursor-crosshair"
        >
          {/* Background Grid lines */}
          <div className="absolute inset-x-space-md inset-y-space-md flex flex-col justify-between pointer-events-none opacity-20">
            <div className="w-full h-px bg-on-surface-variant"></div>
            <div className="w-full h-px bg-on-surface-variant"></div>
            <div className="w-full h-px bg-on-surface-variant"></div>
            <div className="w-full h-px bg-on-surface-variant"></div>
          </div>

          <svg className="absolute inset-0 w-full h-full p-space-md overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 240">
            <defs>
              <linearGradient id="p50Grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4edea3" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4edea3" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* P99 Tail (Amber) */}
            <path
              d="M0,80 C120,70 180,95 300,75 C450,55 520,110 680,60 C800,20 880,75 1000,45"
              fill="none"
              stroke="#ffb95f"
              strokeDasharray="4 2"
              strokeWidth="2.5"
            />
            {/* P90 Guard (Periwinkle) */}
            <path
              d="M0,140 C140,135 220,150 350,138 C500,120 580,165 720,130 C840,95 910,125 1000,110"
              fill="none"
              stroke="#c0c1ff"
              strokeWidth="2"
            />
            {/* P50 Median (Mint) Filled */}
            <path
              d="M0,200 C150,195 240,205 380,190 C520,180 600,210 750,185 C850,165 920,180 1000,170 L1000,240 L0,240 Z"
              fill="url(#p50Grad)"
            />
            <path
              d="M0,200 C150,195 240,205 380,190 C520,180 600,210 750,185 C850,165 920,180 1000,170"
              fill="none"
              stroke="#4edea3"
              strokeWidth="2.5"
            />
            {/* Target Threshold Baseline Reference */}
            <line x1="0" x2="1000" y1="35" y2="35" stroke="#ffb4ab" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
            <text x="990" y="30" fill="#ffb4ab" fontSize="11" fontFamily="JetBrains Mono" textAnchor="end" opacity="0.85">
              SLA THRESHOLD P99: 400ms
            </text>

            {/* Hover marker */}
            {hoveredPoint && (
              <g transform={`translate(${hoveredPoint.x}, ${hoveredPoint.y})`}>
                <line x1="0" x2="0" y1="-50" y2="180" stroke="#bbcabf" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
                <circle cx="0" cy="0" r="5" fill="#ffb95f" stroke="#0f131c" strokeWidth="2" />
              </g>
            )}
          </svg>

          {/* Interactive Hover Marker Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute z-20 bg-surface-container-high px-space-sm py-space-xs rounded shadow-xl text-label-mono-sm font-label-mono-sm pointer-events-none border border-outline-variant/30"
              style={{ left: `${Math.min(75, Math.max(10, (hoveredPoint.x / 1000) * 100 - 10))}%`, top: '16px' }}
            >
              <div className="text-on-surface-variant">{hoveredPoint.time}</div>
              <div className="text-tertiary font-semibold">P99: {hoveredPoint.p99}ms</div>
              <div className="text-secondary font-semibold">P90: {hoveredPoint.p90}ms</div>
              <div className="text-primary font-semibold">P50: {hoveredPoint.p50}ms</div>
            </div>
          )}

          {/* X-Axis Timestamps */}
          <div className="w-full flex justify-between items-center text-label-mono-sm font-label-mono-sm text-on-surface-variant relative z-10 pt-space-xl">
            <span>-24h (Yesterday)</span>
            <span>-18h</span>
            <span>-12h</span>
            <span>-6h</span>
            <span>-3h</span>
            <span>-1h</span>
            <span className="text-primary font-semibold">Now (UTC)</span>
          </div>
        </div>
      </div>

      {/* Row 4: Two Split Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
        {/* Left Column: Edge Probes & Synthetic Monitoring */}
        <div className="p-space-lg bg-surface-container-low rounded-xl shadow-md flex flex-col justify-between border border-outline-variant/20">
          <div>
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[18px]">public</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Edge Probes &amp; Synthetic Anycast
                </h3>
              </div>
              <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-label-mono-sm font-label-mono-sm text-primary uppercase font-semibold">
                All 4 POPs Online
              </span>
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-space-md">
              Synthetic blackbox ping across distributed ingress edge proxies with TLS handshakes.
            </p>

            <div className="flex flex-col gap-space-sm">
              {probes.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-space-sm bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors border border-outline-variant/10"
                >
                  <div className="flex items-center gap-space-sm">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                        p.status === 'optimal'
                          ? 'bg-primary'
                          : p.status === 'moderate'
                          ? 'bg-surface-tint'
                          : 'bg-tertiary'
                      }`}
                    ></span>
                    <div>
                      <span className="font-label-mono-md text-label-mono-md text-on-surface font-semibold">
                        {p.name}
                      </span>
                      <span className="block text-code-inline font-code-inline text-on-surface-variant">
                        {p.node} • Anycast Weight {p.weight}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-label-mono-md text-label-mono-md font-semibold ${
                        p.status === 'elevated'
                          ? 'text-tertiary'
                          : p.status === 'moderate'
                          ? 'text-surface-tint'
                          : 'text-primary'
                      }`}
                    >
                      {p.latencyMs}ms
                    </span>
                    <span className="block text-label-mono-sm font-label-mono-sm text-on-surface-variant uppercase">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-space-md pt-space-sm border-t border-surface-variant flex items-center justify-between text-label-mono-sm font-label-mono-sm text-on-surface-variant">
            <span>
              Global DNS TTL: <strong className="text-on-surface">30s</strong>
            </span>
            <span>
              Synthetic Success: <strong className="text-primary">99.994%</strong>
            </span>
          </div>
        </div>

        {/* Right Column: Runbook Automation & SLO Alert Policies */}
        <div className="p-space-lg bg-surface-container-low rounded-xl shadow-md flex flex-col justify-between border border-outline-variant/20">
          <div>
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[18px]">terminal</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Automated Runbooks &amp; SLO Guardrails
                </h3>
              </div>
              <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-label-mono-sm font-label-mono-sm text-on-surface-variant font-semibold">
                ENGINE V3.4
              </span>
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-space-md">
              Active automated remediation hooks triggered by golden signal threshold deviations.
            </p>

            <div className="flex flex-col gap-space-sm">
              {/* Action Item 1 */}
              <div className="p-space-sm bg-surface-container rounded-lg flex items-start gap-space-sm border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">
                  check_circle
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm font-body-sm font-semibold text-on-surface">
                      HPA Horizontal Scale-Out: +6 Replicas
                    </span>
                    <span className="text-code-inline font-code-inline text-on-surface-variant">
                      04m ago
                    </span>
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    Trigger: Traffic surged past 14,000 RPM. Node pool autoscaled smoothly.
                  </p>
                  <div className="mt-space-xs flex items-center gap-space-xs">
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-label-mono-sm font-label-mono-sm text-on-surface-variant">
                      cluster-mesh-worker-4b
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-primary-container text-on-primary-container text-label-mono-sm font-label-mono-sm font-semibold">
                      AUTO-RESOLVED
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Item 2 */}
              <div className="p-space-sm bg-surface-container rounded-lg flex items-start gap-space-sm border border-outline-variant/10">
                <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5">
                  published_with_changes
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm font-body-sm font-semibold text-on-surface">
                      BGP Subsea Reroute: ap-southeast-1
                    </span>
                    <span className="text-code-inline font-code-inline text-on-surface-variant">
                      32m ago
                    </span>
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    Shifted 40% ingress traffic to Osaka Edge to circumvent cable latency jitter.
                  </p>
                  <div className="mt-space-xs flex items-center gap-space-xs">
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-label-mono-sm font-label-mono-sm text-on-surface-variant">
                      policy-bgp-singapore
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container text-label-mono-sm font-label-mono-sm font-semibold">
                      ACTIVE EXECUTION
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Item 3 */}
              <div className="p-space-sm bg-surface-container rounded-lg flex items-start gap-space-sm border border-outline-variant/10">
                <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">
                  policy
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm font-body-sm font-semibold text-on-surface">
                      SLO Policy: P99 Tail Latency Alarm
                    </span>
                    <span className="text-code-inline font-code-inline text-on-surface-variant">
                      Standing Guard
                    </span>
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    Alert threshold: P99 &gt; 350ms for 5m. Escalation target: SRE On-Call Tier 1.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button Area */}
          <div className="mt-space-md pt-space-sm border-t border-surface-variant flex items-center justify-between">
            <span className="text-label-mono-sm font-label-mono-sm text-on-surface-variant">
              2 Hooks Active • Zero Escalations
            </span>
            <button
              onClick={() => onOpenRunbook('Diagnostic')}
              className="flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container-high hover:bg-surface-bright text-on-surface text-body-sm font-body-sm transition-colors border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-[15px]">manage_history</span>
              <span>Audit Policy Config</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
