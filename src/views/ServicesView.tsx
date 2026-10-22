import React, { useState } from 'react';
import { NavTab, ServiceItem } from '../types/telemetry';

interface ServicesViewProps {
  onNavigate: (tab: NavTab) => void;
  services: ServiceItem[];
  selectedServiceKey: string;
  onSelectService: (serviceKey: string) => void;
  onOpenRunbook: (name: string) => void;
  onOpenConsole: (target?: string) => void;
  onShowToast: (title: string, msg: string, icon: string, color: string) => void;
  onInspectTrace: (traceId: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  onNavigate,
  services,
  selectedServiceKey,
  onSelectService,
  onOpenRunbook,
  onOpenConsole,
  onShowToast,
  onInspectTrace
}) => {
  const [filterType, setFilterType] = useState<'all' | 'operational' | 'degraded' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('Production (All Regions)');
  const [envMenuOpen, setEnvMenuOpen] = useState(false);
  const [probing, setProbing] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceRegion, setNewServiceRegion] = useState('us-east-1');

  const selectedService =
    services.find((s) => s.key === selectedServiceKey) || services[0];

  const handleProbe = () => {
    setProbing(true);
    setTimeout(() => {
      setProbing(false);
      onShowToast(
        'Probe Complete',
        'Synthetic HTTP/2 & gRPC checks passed for 17/18 endpoints. EU-West-1 degraded.',
        'done_all',
        'text-primary'
      );
    }, 1200);
  };

  const handleRestartWorker = (e: React.MouseEvent, nodeName: string) => {
    e.stopPropagation();
    onShowToast(
      'Graceful Restart Dispatched',
      `Sent SIGTERM to ${nodeName}. Spawning replacement pod with clean connection cache.`,
      'refresh',
      'text-tertiary'
    );
  };

  const filteredServices = services.filter((s) => {
    const matchesFilter = filterType === 'all' || s.status === filterType;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.region.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      s.meshTag.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full gap-space-lg pb-space-xl">
      {/* Top Command Ribbon & Filter Bar */}
      <div className="flex flex-col gap-space-md bg-surface-container-low p-space-lg rounded-xl shadow-md relative overflow-hidden border border-outline-variant/20">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
        <div className="flex flex-wrap items-center justify-between gap-space-md relative z-10">
          <div className="flex items-center gap-space-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-mono-sm text-label-mono-sm text-primary uppercase tracking-widest">
                  Global Telemetry Mesh
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Services Catalog &amp; Health Registry
              </h2>
            </div>
            <div className="hidden xl:flex items-center gap-space-xs bg-surface-container-high px-space-md py-space-xs rounded-lg text-on-surface-variant font-label-mono-sm text-label-mono-sm">
              <span className="text-on-surface font-semibold">18 Microservices</span>
              <span className="text-outline">/</span>
              <span>5 Regions</span>
              <span className="text-outline">/</span>
              <span className="text-primary font-semibold">Auto-Sync 10s</span>
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-space-sm flex-wrap">
            {/* Env dropdown */}
            <div className="relative">
              <button
                onClick={() => setEnvMenuOpen(!envMenuOpen)}
                className="flex items-center gap-space-sm px-space-md py-space-xs rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-mono-md text-label-mono-md transition-colors border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-primary text-[16px]">domain</span>
                <span>{selectedEnv}</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>

              {envMenuOpen && (
                <div className="absolute right-0 mt-space-xs w-60 rounded bg-surface-container-highest shadow-xl z-30 p-space-xs flex flex-col gap-space-xs border border-outline-variant/40">
                  {['Production (All Regions)', 'Staging-Canary US-East', 'EU-Edge Direct CDN'].map((env) => (
                    <button
                      key={env}
                      onClick={() => {
                        setSelectedEnv(env);
                        setEnvMenuOpen(false);
                        onShowToast('Environment Switched', `Mesh telemetry shifted to ${env}`, 'swap_horiz', 'text-primary');
                      }}
                      className={`text-left px-space-sm py-space-xs rounded text-body-sm font-body-sm flex items-center justify-between ${
                        selectedEnv === env
                          ? 'bg-primary-container text-on-primary-container font-semibold'
                          : 'text-on-surface hover:bg-surface-variant'
                      }`}
                    >
                      <span>{env}</span>
                      {selectedEnv === env && (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Run synthetic probe */}
            <button
              onClick={handleProbe}
              disabled={probing}
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm font-medium transition-colors border border-outline-variant/30"
            >
              <span className={`material-symbols-outlined text-[16px] text-tertiary ${probing ? 'animate-spin' : ''}`}>
                troubleshoot
              </span>
              <span>{probing ? 'Probing 18 Services...' : 'Run Synthetic Probe'}</span>
            </button>

            {/* Register Service */}
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:bg-primary-fixed transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">library_add</span>
              <span>Register Service</span>
            </button>
          </div>
        </div>

        {/* Filter chips + Search input */}
        <div className="flex flex-wrap items-center justify-between gap-space-md pt-space-xs relative z-10">
          <div className="flex items-center gap-space-xs flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-space-md py-space-xs rounded-full font-label-mono-sm text-label-mono-sm transition-all ${
                filterType === 'all'
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Services (18)
            </button>
            <button
              onClick={() => setFilterType('operational')}
              className={`px-space-md py-space-xs rounded-full font-label-mono-sm text-label-mono-sm transition-all flex items-center gap-space-xs ${
                filterType === 'operational'
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>Operational (17)</span>
            </button>
            <button
              onClick={() => setFilterType('degraded')}
              className={`px-space-md py-space-xs rounded-full font-label-mono-sm text-label-mono-sm transition-all flex items-center gap-space-xs ${
                filterType === 'degraded'
                  ? 'bg-tertiary-container text-on-tertiary-container font-semibold shadow-sm'
                  : 'bg-surface-container text-tertiary hover:bg-surface-container-high'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              <span>Degraded (1)</span>
            </button>
            <button
              onClick={() => setFilterType('critical')}
              className={`px-space-md py-space-xs rounded-full font-label-mono-sm text-label-mono-sm transition-all flex items-center gap-space-xs ${
                filterType === 'critical'
                  ? 'bg-error-container text-on-error-container font-semibold shadow-sm'
                  : 'bg-surface-container text-outline hover:text-on-surface'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              <span>Critical (0)</span>
            </button>
          </div>

          <div className="flex items-center gap-space-sm bg-surface-container px-space-md py-space-xs rounded-lg w-full md:w-80 shadow-inner border border-outline-variant/30">
            <span className="material-symbols-outlined text-outline text-[16px]">filter_alt</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by service, pod, tag..."
              className="bg-transparent border-0 outline-none text-on-surface font-code-inline text-code-inline w-full placeholder:text-on-surface-variant/60"
            />
            <kbd className="px-space-xs rounded bg-surface-container-highest text-label-mono-sm font-label-mono-sm text-on-surface-variant">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Main Viewport: Split Layout (Services Grid & Details Drawer) */}
      <div className="grid grid-cols-12 gap-space-lg items-start">
        {/* Services Stream List */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-space-md">
          {filteredServices.map((svc) => {
            const isSelected = svc.key === selectedServiceKey;
            const isDegraded = svc.status === 'degraded';

            return (
              <div
                key={svc.id}
                onClick={() => onSelectService(svc.key)}
                className={`bg-surface-container-low rounded-xl p-space-lg shadow-md cursor-pointer hover:bg-surface-container transition-all relative overflow-hidden group border ${
                  isSelected
                    ? 'ring-1 ring-primary border-primary'
                    : isDegraded
                    ? 'border-tertiary/40'
                    : 'border-outline-variant/20'
                }`}
              >
                {/* Status border indicator */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isDegraded ? 'bg-tertiary' : 'bg-primary'
                  }`}
                ></div>

                <div className="flex flex-col gap-space-md">
                  <div className="flex flex-wrap items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md min-w-[200px]">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isDegraded
                            ? 'bg-tertiary-container/30 text-tertiary'
                            : 'bg-surface-container-high text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[24px]">
                          {svc.key === 'cdn'
                            ? 'public'
                            : svc.key === 'postgres'
                            ? 'database'
                            : svc.key === 'webhook'
                            ? 'payments'
                            : svc.key === 'gateway'
                            ? 'router'
                            : 'verified_user'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-sm flex-wrap">
                          <span
                            className={`font-headline-sm text-headline-sm text-on-surface transition-colors ${
                              isDegraded ? 'group-hover:text-tertiary' : 'group-hover:text-primary'
                            }`}
                          >
                            {svc.name}
                          </span>
                          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest font-code-inline text-code-inline text-on-surface-variant">
                            {svc.region}
                          </span>
                          <span
                            className={`px-space-xs py-0.5 rounded font-label-mono-sm text-label-mono-sm font-bold flex items-center gap-1 ${
                              isDegraded
                                ? 'bg-tertiary-container/20 text-tertiary'
                                : 'bg-primary-container/20 text-primary'
                            }`}
                          >
                            {isDegraded && (
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>
                            )}
                            {svc.statusBadge}
                          </span>
                        </div>
                        <div className="flex items-center gap-space-sm text-label-mono-sm font-label-mono-sm text-on-surface-variant pt-space-xs flex-wrap">
                          {svc.key === 'cdn' ? (
                            <>
                              <span>Routing: Geo-DNS Anycast</span>
                              <span>•</span>
                              <span className="text-error font-semibold">4xx Spike Active</span>
                              <span>•</span>
                              <span>Canary v2.41.0-rc3 (15% traffic)</span>
                            </>
                          ) : svc.key === 'postgres' ? (
                            <>
                              <span>Engine: 15.4-aurora</span>
                              <span>•</span>
                              <span>Primary + 2 Read Replicas</span>
                              <span>•</span>
                              <span className="text-primary font-medium">Replication Lag: 12ms</span>
                            </>
                          ) : svc.key === 'webhook' ? (
                            <>
                              <span>Namespace: payments-prod</span>
                              <span>•</span>
                              <span>Replicas: 16/16 Ready</span>
                              <span>•</span>
                              <span className="text-primary font-semibold">0 DLQ Drops</span>
                            </>
                          ) : svc.key === 'gateway' ? (
                            <>
                              <span>Routing Protocol: HTTP/2 &amp; gRPC</span>
                              <span>•</span>
                              <span>SSL Termination: TLS 1.3</span>
                              <span>•</span>
                              <span className="text-primary font-semibold">P99: 42ms</span>
                            </>
                          ) : (
                            <>
                              <span>Auth Mechanism: RS256 JWT &amp; OIDC</span>
                              <span>•</span>
                              <span>Session Cache: Redis Cluster 01</span>
                              <span>•</span>
                              <span className="text-primary font-semibold">
                                Auth State Clean (0 Key Rotations Pending)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Degraded quick buttons vs normal chevron */}
                    {isDegraded ? (
                      <div className="flex items-center gap-space-xs" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            onInspectTrace('TRACE-EU-94827');
                            onNavigate('traces');
                          }}
                          className="px-space-sm py-space-xs rounded bg-surface-container-high hover:bg-surface-bright text-tertiary font-body-sm text-body-sm flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">alt_route</span>
                          <span>View Trace</span>
                        </button>
                        <button
                          onClick={(e) => handleRestartWorker(e, 'eu-edge-node-04')}
                          className="px-space-sm py-space-xs rounded bg-tertiary text-on-tertiary font-body-sm text-body-sm font-semibold hover:bg-tertiary-fixed transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                          <span>Restart Edge Worker</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-space-lg">
                        <div className="text-right">
                          <div className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                            UPTIME (30D)
                          </div>
                          <div className="font-metric-display-mobile text-metric-display-mobile text-on-surface">
                            {svc.uptime30d}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">
                          chevron_right
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Micro Metas or Progress Rows */}
                  {svc.key === 'cdn' ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm bg-surface-container p-space-sm rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">UPTIME (30D)</span>
                          <span className="font-metric-display-mobile text-metric-display-mobile text-tertiary">98.92%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">CACHE HIT RATIO</span>
                          <div className="flex items-baseline gap-space-xs">
                            <span className="font-metric-display-mobile text-metric-display-mobile text-on-surface">84.0%</span>
                            <span className="font-label-mono-sm text-label-mono-sm text-error">-8.2%</span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">4XX ERROR RATE</span>
                          <div className="flex items-baseline gap-space-xs">
                            <span className="font-metric-display-mobile text-metric-display-mobile text-error">2.14%</span>
                            <span className="font-label-mono-sm text-label-mono-sm text-error">▲ +1.9%</span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">P99 ORIGIN LATENCY</span>
                          <span className="font-metric-display-mobile text-metric-display-mobile text-tertiary">310ms</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-space-xs">
                        <div className="flex items-center justify-between text-label-mono-sm font-label-mono-sm text-on-surface-variant">
                          <span>Edge Origin Latency Anomaly Spike (Last 15m)</span>
                          <span className="text-tertiary font-semibold">Anomaly Threshold Exceeded: +210ms</span>
                        </div>
                        <div className="h-16 w-full bg-surface-container-lowest rounded overflow-hidden relative p-1 flex items-end">
                          <svg className="w-full h-full text-tertiary" fill="none" preserveAspectRatio="none" viewBox="0 0 500 50">
                            <path d="M0 45 L40 44 L80 43 L120 45 L160 42 L200 44 L240 40 L280 20 L320 8 L360 14 L400 32 L440 18 L480 22 L500 24" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                            <path d="M0 45 L40 44 L80 43 L120 45 L160 42 L200 44 L240 40 L280 20 L320 8 L360 14 L400 32 L440 18 L480 22 L500 24 L500 50 L0 50 Z" fill="currentColor" fillOpacity="0.12" />
                            <line x1="0" y1="20" x2="500" y2="20" stroke="#ffb4ab" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                          </svg>
                        </div>
                      </div>
                    </>
                  ) : svc.key === 'postgres' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md bg-surface-container p-space-md rounded-lg">
                      <div className="flex flex-col gap-space-xs">
                        <div className="flex justify-between items-center font-label-mono-sm text-label-mono-sm">
                          <span className="text-on-surface-variant">IOPS CAPACITY LOAD (PROVISIONED)</span>
                          <span className="text-on-surface font-semibold">3,120 / 4,000 IOPS (78%)</span>
                        </div>
                        <div className="w-full bg-surface-container-highest h-2 rounded overflow-hidden">
                          <div className="bg-primary h-full w-[78%]"></div>
                        </div>
                        <div className="flex justify-between text-label-mono-sm font-label-mono-sm text-on-surface-variant">
                          <span>Burst Bucket: 100% full</span>
                          <span className="text-primary">Headroom Normal</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-space-xs">
                        <div className="flex justify-between items-center font-label-mono-sm text-label-mono-sm">
                          <span className="text-on-surface-variant">BUFFER CACHE HIT &amp; DISK THROUGHPUT</span>
                          <span className="text-on-surface font-semibold">99.82% Hit | 148 MB/s</span>
                        </div>
                        <div className="w-full bg-surface-container-highest h-2 rounded overflow-hidden">
                          <div className="bg-primary h-full w-[94%]"></div>
                        </div>
                        <div className="flex justify-between text-label-mono-sm font-label-mono-sm text-on-surface-variant">
                          <span>Freeable Memory: 18.4 GB</span>
                          <span>Deadlocks: 0</span>
                        </div>
                      </div>
                    </div>
                  ) : svc.key === 'webhook' ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center bg-surface-container p-space-md rounded-lg">
                      <div className="md:col-span-4 flex items-center justify-around text-center border-r-0 md:border-r border-outline-variant/30">
                        <div className="flex flex-col">
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">QUEUE BACKLOG</span>
                          <span className="font-metric-display-mobile text-metric-display-mobile text-on-surface">
                            14 <span className="font-label-mono-sm text-label-mono-sm text-outline">items</span>
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">DEAD-LETTER</span>
                          <span className="font-metric-display-mobile text-metric-display-mobile text-primary">
                            0 <span className="font-label-mono-sm text-label-mono-sm text-outline">err</span>
                          </span>
                        </div>
                      </div>
                      <div className="md:col-span-8 flex flex-col gap-space-xs">
                        <div className="flex justify-between items-center font-label-mono-sm text-label-mono-sm">
                          <span className="text-on-surface-variant">CONSUMER RATE TELEMETRY (240 MSG/S AVG)</span>
                          <span className="text-primary font-semibold">Stable Processing</span>
                        </div>
                        <div className="h-10 w-full bg-surface-container-lowest rounded overflow-hidden flex items-end p-1">
                          <svg className="w-full h-full text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 400 30">
                            <path d="M0 24 L25 20 L50 25 L75 16 L100 22 L125 18 L150 15 L175 19 L200 12 L225 15 L250 10 L275 14 L300 8 L325 12 L350 7 L375 10 L400 8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                            <path d="M0 24 L25 20 L50 25 L75 16 L100 22 L125 18 L150 15 L175 19 L200 12 L225 15 L250 10 L275 14 L300 8 L325 12 L350 7 L375 10 L400 8 L400 30 L0 30 Z" fill="currentColor" fillOpacity="0.1" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : svc.key === 'gateway' ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center bg-surface-container p-space-md rounded-lg">
                      <div className="md:col-span-5 flex items-center justify-between px-space-sm">
                        <div className="flex flex-col">
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">LATENCY PERCENTILE (P99)</span>
                          <span className="font-metric-display-mobile text-metric-display-mobile text-primary">42ms</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">TOTAL THROUGHPUT</span>
                          <span className="font-metric-display-mobile text-metric-display-mobile text-on-surface">
                            2,410 <span className="font-label-mono-sm text-label-mono-sm text-outline">rps</span>
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">5XX ERRORS</span>
                          <span className="font-metric-display-mobile text-metric-display-mobile text-primary">0.001%</span>
                        </div>
                      </div>
                      <div className="md:col-span-7 flex flex-col gap-space-xs">
                        <div className="flex justify-between items-center font-label-mono-sm text-label-mono-sm">
                          <span className="text-on-surface-variant">EDGE INGRESS RPS SPARKLINE (PEAK: 3.1K RPS)</span>
                          <span className="text-on-surface-variant">TLS Handshake: 4ms</span>
                        </div>
                        <div className="h-10 w-full bg-surface-container-lowest rounded overflow-hidden flex items-end p-1">
                          <svg className="w-full h-full text-secondary" fill="none" preserveAspectRatio="none" viewBox="0 0 400 30">
                            <path d="M0 20 L30 18 L60 22 L90 14 L120 16 L150 11 L180 14 L210 9 L240 12 L270 7 L300 10 L330 6 L360 9 L380 5 L400 6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                            <path d="M0 20 L30 18 L60 22 L90 14 L120 16 L150 11 L180 14 L210 9 L240 12 L270 7 L300 10 L330 6 L360 9 L380 5 L400 6 L400 30 L0 30 Z" fill="currentColor" fillOpacity="0.12" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm bg-surface-container p-space-sm rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">P99 LATENCY</span>
                        <span className="font-metric-display-mobile text-metric-display-mobile text-on-surface">68ms</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">REQUEST VOLUME</span>
                        <span className="font-metric-display-mobile text-metric-display-mobile text-on-surface">
                          850 <span className="font-label-mono-sm text-label-mono-sm text-outline">rps</span>
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">TOKEN VERIFICATION</span>
                        <span className="font-metric-display-mobile text-metric-display-mobile text-primary">99.999%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">CANARY STATUS</span>
                        <span className="font-metric-display-mobile text-metric-display-mobile text-secondary">
                          v3.1.2 <span className="font-label-mono-sm text-label-mono-sm text-on-secondary-container">100%</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Telemetry Panel / Service Inspector Drawer */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-space-md sticky top-16">
          <div className="bg-surface-container-low rounded-xl p-space-lg shadow-md flex flex-col gap-space-md relative overflow-hidden border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-primary">high_res</span>
                <span>Inspector Preview</span>
              </div>
              <span className={`px-space-xs py-0.5 rounded font-label-mono-sm text-label-mono-sm font-semibold ${selectedService.statusBadgeClass}`}>
                {selectedService.statusBadge}
              </span>
            </div>

            <div className="flex flex-col gap-space-xs">
              <h3 className="font-headline-md text-headline-md text-on-surface">
                {selectedService.name}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {selectedService.desc}
              </p>
            </div>

            {/* Latency Percentile Cluster */}
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">
                Latency Percentile Cluster
              </span>
              <div className="grid grid-cols-3 bg-surface-container rounded-lg p-space-sm text-center border border-outline-variant/20">
                <div className="flex flex-col border-r border-outline-variant/30 pr-space-xs">
                  <span className="font-metric-display-mobile text-metric-display-mobile text-on-surface">
                    {selectedService.p50}
                  </span>
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">P50 MEDIAN</span>
                </div>
                <div className="flex flex-col border-r border-outline-variant/30 px-space-xs">
                  <span className="font-metric-display-mobile text-metric-display-mobile text-on-surface">
                    {selectedService.p90}
                  </span>
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">P90 PEAK</span>
                </div>
                <div className="flex flex-col pl-space-xs">
                  <span
                    className={`font-metric-display-mobile text-metric-display-mobile ${
                      selectedService.status === 'degraded' ? 'text-tertiary' : 'text-primary'
                    }`}
                  >
                    {selectedService.p99}
                  </span>
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">P99 SPIKE</span>
                </div>
              </div>
            </div>

            {/* Discrete 45-Tick Uptime Bar Strip Component */}
            <div className="flex flex-col gap-space-xs">
              <div className="flex justify-between items-center font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                <span>45-INTERVAL STATUS HISTORY</span>
                <span
                  className={`font-semibold ${
                    selectedService.status === 'degraded' ? 'text-tertiary' : 'text-primary'
                  }`}
                >
                  {selectedService.uptime30d}
                </span>
              </div>
              <div className="flex items-center gap-[2px] h-6 bg-surface-container-highest/40 p-1 rounded overflow-hidden">
                {selectedService.historyTicks.map((tick, i) => (
                  <span
                    key={i}
                    className={`w-[3px] h-full rounded-xs ${
                      tick === 'primary'
                        ? 'bg-primary'
                        : tick === 'tertiary'
                        ? 'bg-tertiary'
                        : 'bg-error'
                    } ${i === selectedService.historyTicks.length - 1 && selectedService.status === 'degraded' ? 'animate-pulse' : ''}`}
                  ></span>
                ))}
              </div>
            </div>

            {/* Infrastructure & Canary Details */}
            <div className="flex flex-col gap-space-xs pt-space-xs">
              <div className="flex items-center justify-between text-body-sm font-body-sm py-1 border-b border-surface-variant">
                <span className="text-on-surface-variant">Deployment Tag</span>
                <span className="font-code-inline text-code-inline text-tertiary bg-surface-container-high px-space-xs rounded">
                  {selectedService.canaryTag}
                </span>
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm py-1 border-b border-surface-variant">
                <span className="text-on-surface-variant">Cluster Allocation</span>
                <span className="font-code-inline text-code-inline text-on-surface">
                  {selectedService.nodes}
                </span>
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm py-1 border-b border-surface-variant">
                <span className="text-on-surface-variant">Memory Footprint</span>
                <span className="font-code-inline text-code-inline text-on-surface">
                  {selectedService.memFootprint}
                </span>
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm py-1">
                <span className="text-on-surface-variant">SLO Target Burn</span>
                <span
                  className={`font-code-inline text-code-inline font-semibold ${
                    selectedService.status === 'degraded' ? 'text-error' : 'text-primary'
                  }`}
                >
                  {selectedService.sloBurn}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-space-xs pt-space-xs">
              <button
                onClick={() => onOpenConsole(selectedService.key)}
                className="w-full py-space-xs rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm font-medium transition-colors flex items-center justify-center gap-1 border border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-[16px]">terminal</span>
                <span>CLI Debugger</span>
              </button>
              <button
                onClick={() => onOpenRunbook(selectedService.key === 'cdn' ? 'Cache-Purge' : 'Diagnostic')}
                className="w-full py-space-xs rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm font-medium transition-colors flex items-center justify-center gap-1 border border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                <span>Runbook</span>
              </button>
            </div>
          </div>

          {/* Quick Cluster Resource Usage Summary Widget */}
          <div className="bg-surface-container-low rounded-xl p-space-lg shadow-md flex flex-col gap-space-md border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">
                EKS Node Fleet Consumption
              </span>
              <span className="font-label-mono-sm text-label-mono-sm text-primary">Normal Pool</span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex justify-between text-label-mono-sm font-label-mono-sm">
                <span className="text-on-surface-variant">CPU Core Allocation (48 Cores)</span>
                <span className="text-on-surface font-semibold">64.2%</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1.5 rounded overflow-hidden">
                <div className="bg-primary h-full w-[64%]"></div>
              </div>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex justify-between text-label-mono-sm font-label-mono-sm">
                <span className="text-on-surface-variant">Memory Allocation (192 GB)</span>
                <span className="text-on-surface font-semibold">76.8%</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1.5 rounded overflow-hidden">
                <div className="bg-secondary h-full w-[76%]"></div>
              </div>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex justify-between text-label-mono-sm font-label-mono-sm">
                <span className="text-on-surface-variant">Pod Eviction Risk</span>
                <span className="text-primary font-semibold">0.00% Zero Pressure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Register Service Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-surface-container-low rounded-xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-space-md py-space-sm bg-surface-container border-b border-surface-container-high">
              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Register New Mesh Microservice
              </span>
              <button
                onClick={() => setRegisterModalOpen(false)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-space-md flex flex-col gap-space-md">
              <div className="flex flex-col gap-1">
                <label className="font-label-mono-sm text-on-surface-variant uppercase">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Recommendations Engine V2"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="px-space-md py-space-xs rounded bg-surface-container text-on-surface font-body-sm text-body-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-mono-sm text-on-surface-variant uppercase">Primary Region</label>
                <select
                  value={newServiceRegion}
                  onChange={(e) => setNewServiceRegion(e.target.value)}
                  className="px-space-md py-space-xs rounded bg-surface-container text-on-surface font-body-sm text-body-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
                >
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="us-west-2">us-west-2 (Oregon)</option>
                  <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                  <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-space-xs pt-space-xs border-t border-surface-container-high">
                <button
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-space-md py-space-xs rounded bg-surface-container-high text-on-surface text-body-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newServiceName) {
                      onShowToast('Service Registered', `${newServiceName} registered in telemetry mesh registry.`, 'library_add', 'text-primary');
                      setRegisterModalOpen(false);
                      setNewServiceName('');
                    }
                  }}
                  className="px-space-md py-space-xs rounded bg-primary text-on-primary font-semibold text-body-sm"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
