import React, { useState, useEffect, useRef } from 'react';
import { LogEntry } from '../types/telemetry';

interface LiveLogsViewProps {
  initialLogs: LogEntry[];
  onInspectTrace: (traceId: string) => void;
  onShowToast: (title: string, msg: string, icon: string, color: string) => void;
}

export const LiveLogsView: React.FC<LiveLogsViewProps> = ({
  initialLogs,
  onInspectTrace,
  onShowToast
}) => {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [isLive, setIsLive] = useState(true);
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Simulated live log generator
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const services = ['ingress-gw', 'auth-core', 'edge-cdn', 'postgres-aurora', 'checkout-worker'];
      const levels: ('INFO' | 'WARN' | 'ERROR')[] = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];
      const selectedSvc = services[Math.floor(Math.random() * services.length)];
      const selectedLvl = levels[Math.floor(Math.random() * levels.length)];
      const ms = Math.floor(Math.random() * 80) + 5;
      const status = selectedLvl === 'ERROR' ? 504 : selectedLvl === 'WARN' ? 429 : 200;

      const randomMessages: Record<string, string> = {
        'ingress-gw': `HTTP/2 stream #${Math.floor(Math.random() * 90000)} multiplexed to downstream envoy pod in ${ms}ms`,
        'auth-core': `JWT verification cache hit for key sess:usr_${Math.floor(Math.random() * 900000)} (duration: ${Math.max(1, Math.floor(ms / 10))}ms)`,
        'edge-cdn': selectedLvl === 'ERROR'
          ? `upstream timeout to origin fra-edge-node-02: 504 Gateway Timeout (elapsed: ${ms + 250}ms)`
          : `Edge PoP Frankfurt cache lookup: HIT for asset /static/bundle_${Math.floor(Math.random() * 100)}.js`,
        'postgres-aurora': `Replica lag heartbeat sync OK (wal_lsn: 0/19${Math.floor(Math.random() * 8000)}B)`,
        'checkout-worker': `Event idemp_${Math.floor(Math.random() * 999999)} processed and committed to payment ledger in ${ms}ms`
      };

      const newLog: LogEntry = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + Math.floor(Math.random() * 900 + 100),
        level: selectedLvl,
        service: selectedSvc,
        pod: `${selectedSvc}-worker-${Math.floor(Math.random() * 8 + 1)}`,
        traceId: `TRACE-${selectedSvc.toUpperCase().slice(0, 3)}-${Math.floor(Math.random() * 89999 + 10000)}`,
        message: randomMessages[selectedSvc],
        status,
        durationMs: ms
      };

      setLogs((prev) => [...prev.slice(-150), newLog]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isLive]);

  useEffect(() => {
    if (autoScroll) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((l) => {
    if (levelFilter !== 'ALL' && l.level !== levelFilter) return false;
    if (serviceFilter !== 'ALL' && l.service !== serviceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.message.toLowerCase().includes(q) ||
        l.traceId.toLowerCase().includes(q) ||
        l.pod.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownload = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.service}] [${l.traceId}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulsesre-live-logs-${Date.now()}.log`;
    a.click();
    onShowToast('Logs Exported', 'Downloaded raw SRE logs.', 'file_download', 'text-primary');
  };

  return (
    <div className="flex flex-col w-full gap-space-md pb-space-xl">
      {/* Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl shadow-md border border-outline-variant/20">
        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="flex items-center gap-space-xs font-label-mono-sm">
            <span className="material-symbols-outlined text-primary text-[20px]">terminal</span>
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Live Ingress &amp; Pod Stream
            </span>
          </div>
          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-label-mono-sm text-on-surface-variant font-code-inline">
            BUFFER: 150 ROWS
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-space-xs flex-wrap">
          {/* Pause / Resume */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-1 px-space-sm py-1 rounded text-label-mono-sm font-label-mono-sm font-semibold transition-colors border ${
              isLive
                ? 'bg-primary-container text-on-primary-container border-primary/40'
                : 'bg-surface-container-high text-on-surface-variant border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {isLive ? 'pause' : 'play_arrow'}
            </span>
            <span>{isLive ? 'STREAMING' : 'PAUSED'}</span>
          </button>

          {/* Autoscroll */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 px-space-sm py-1 rounded text-label-mono-sm font-label-mono-sm border ${
              autoScroll
                ? 'bg-surface-container-high text-primary border-primary/30'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/20'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">vertical_align_bottom</span>
            <span>Autoscroll</span>
          </button>

          {/* Clear */}
          <button
            onClick={() => setLogs([])}
            className="flex items-center gap-1 px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-label-mono-sm border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
            <span>Clear</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-space-sm py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface text-label-mono-sm font-semibold border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container p-space-sm rounded-lg border border-outline-variant/20">
        <div className="flex items-center gap-space-xs flex-wrap">
          <span className="font-label-mono-sm text-on-surface-variant uppercase pr-1">Level:</span>
          {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-space-xs py-0.5 rounded text-label-mono-sm font-label-mono-sm font-semibold transition-all ${
                levelFilter === lvl
                  ? lvl === 'ERROR'
                    ? 'bg-error-container text-on-error-container ring-1 ring-error'
                    : lvl === 'WARN'
                    ? 'bg-tertiary-container text-on-tertiary-container ring-1 ring-tertiary'
                    : 'bg-primary-container text-on-primary-container ring-1 ring-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-space-sm flex-1 max-w-md">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-surface-container-lowest px-2 py-1 rounded text-label-mono-sm font-label-mono-sm text-on-surface border border-outline-variant/30 focus:outline-none"
          >
            <option value="ALL">All Services</option>
            <option value="edge-cdn">edge-cdn</option>
            <option value="ingress-gw">ingress-gw</option>
            <option value="auth-core">auth-core</option>
            <option value="postgres-aurora">postgres-aurora</option>
            <option value="checkout-worker">checkout-worker</option>
          </select>

          <div className="flex-1 relative flex items-center">
            <span className="material-symbols-outlined text-[14px] text-outline absolute left-2">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keyword or trace ID..."
              className="w-full bg-surface-container-lowest pl-7 pr-2 py-1 rounded text-code-inline font-code-inline text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Log Terminal Canvas */}
      <div className="w-full rounded-xl bg-[#080c14] p-space-md shadow-2xl border border-outline-variant/30 font-code-inline text-code-inline overflow-y-auto max-h-[640px] flex flex-col gap-1 select-text">
        {filteredLogs.length === 0 ? (
          <div className="p-space-xl text-center text-on-surface-variant font-body-sm">
            No telemetry logs matching current filter.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-space-sm py-0.5 px-1 rounded hover:bg-surface-container/60 transition-colors leading-relaxed ${
                log.level === 'ERROR'
                  ? 'bg-error-container/10 border-l-2 border-error'
                  : log.level === 'WARN'
                  ? 'bg-tertiary/5 border-l-2 border-tertiary'
                  : ''
              }`}
            >
              <span className="text-on-surface-variant/80 shrink-0 select-none">
                {log.timestamp}
              </span>

              <span
                className={`font-semibold shrink-0 uppercase text-[10px] px-1 rounded ${
                  log.level === 'ERROR'
                    ? 'bg-error-container text-on-error-container'
                    : log.level === 'WARN'
                    ? 'bg-tertiary-container text-on-tertiary-container'
                    : 'text-primary'
                }`}
              >
                {log.level}
              </span>

              <span className="text-secondary shrink-0 font-medium">{log.service}</span>

              <button
                onClick={() => onInspectTrace(log.traceId)}
                title="Inspect Distributed Trace"
                className="text-on-surface-variant hover:text-primary hover:underline shrink-0 text-[10px] bg-surface-container-highest px-1 rounded"
              >
                {log.traceId}
              </button>

              <span
                className={`break-all ${
                  log.level === 'ERROR'
                    ? 'text-error font-medium'
                    : log.level === 'WARN'
                    ? 'text-tertiary'
                    : 'text-on-surface'
                }`}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
