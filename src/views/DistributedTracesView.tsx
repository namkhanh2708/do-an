import React, { useState } from 'react';
import { DistributedTrace, TraceSpan } from '../types/telemetry';

interface DistributedTracesViewProps {
  traces: DistributedTrace[];
  selectedTraceId?: string;
  onSelectTraceId: (traceId: string) => void;
  onShowToast: (title: string, msg: string, icon: string, color: string) => void;
}

export const DistributedTracesView: React.FC<DistributedTracesViewProps> = ({
  traces,
  selectedTraceId,
  onSelectTraceId,
  onShowToast
}) => {
  const selectedTrace =
    traces.find((t) => t.traceId === selectedTraceId) || traces[0];

  const [selectedSpan, setSelectedSpan] = useState<TraceSpan>(selectedTrace.spans[0]);

  const totalDuration = selectedTrace.durationMs;

  const handleCopyTrace = () => {
    navigator.clipboard.writeText(selectedTrace.traceId);
    onShowToast('Copied Trace ID', `Copied ${selectedTrace.traceId} to clipboard`, 'content_copy', 'text-primary');
  };

  return (
    <div className="flex flex-col w-full gap-space-lg pb-space-xl">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl shadow-md border border-outline-variant/20">
        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="flex items-center gap-space-xs font-label-mono-sm">
            <span className="material-symbols-outlined text-secondary text-[20px]">account_tree</span>
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Distributed Trace Explorer
            </span>
          </div>
          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-label-mono-sm font-code-inline text-on-surface-variant">
            OPENTELEMETRY v1.24 W3C CONTEXT
          </span>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <span className="font-label-mono-sm text-on-surface-variant">Active Trace:</span>
          <span className="font-code-inline text-primary font-bold">{selectedTrace.traceId}</span>
          <button
            onClick={handleCopyTrace}
            className="p-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20"
            title="Copy Trace ID"
          >
            <span className="material-symbols-outlined text-[15px]">content_copy</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Trace Selector Left / Waterfall Graph Right */}
      <div className="grid grid-cols-12 gap-space-lg items-start">
        {/* Trace List (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-space-sm">
          <div className="px-1 text-label-mono-sm font-label-mono-sm uppercase text-on-surface-variant tracking-wider">
            Recent Ingress Traces ({traces.length})
          </div>

          {traces.map((tr) => {
            const isSelected = tr.traceId === selectedTrace.traceId;
            const isError = tr.status === 'error';

            return (
              <div
                key={tr.id}
                onClick={() => {
                  onSelectTraceId(tr.traceId);
                  setSelectedSpan(tr.spans[0]);
                }}
                className={`p-space-md rounded-xl bg-surface-container-low shadow-sm cursor-pointer transition-all hover:bg-surface-container border flex flex-col gap-1 ${
                  isSelected
                    ? 'ring-1 ring-primary border-primary bg-surface-container'
                    : isError
                    ? 'border-error/40'
                    : 'border-outline-variant/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-code-inline text-code-inline text-on-surface font-semibold">
                    {tr.traceId}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-label-mono-sm text-[10px] font-bold ${
                      isError
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-primary-container text-on-primary-container'
                    }`}
                  >
                    {tr.statusCode} {isError ? 'TIMEOUT' : 'OK'}
                  </span>
                </div>

                <div className="font-code-inline text-body-sm text-on-surface-variant truncate">
                  {tr.method} {tr.endpoint}
                </div>

                <div className="flex items-center justify-between text-label-mono-sm text-on-surface-variant pt-1 border-t border-surface-container-high">
                  <span>{tr.timestamp}</span>
                  <span className={`font-semibold ${isError ? 'text-error' : 'text-primary'}`}>
                    {tr.durationMs}ms ({tr.spans.length} spans)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trace Waterfall & Span Inspector (8 Cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-space-md">
          {/* Waterfall Header */}
          <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md border border-outline-variant/20 flex flex-col gap-space-md">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <div>
                <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant">
                  TRACE TIMELINE WATERFALL
                </span>
                <h3 className="font-headline-md text-headline-sm text-on-surface font-bold pt-0.5">
                  {selectedTrace.endpoint}
                </h3>
              </div>
              <div className="flex items-center gap-space-md">
                <div className="text-right">
                  <span className="font-label-mono-sm text-on-surface-variant block">TOTAL SPAN LATENCY</span>
                  <span
                    className={`font-metric-display text-headline-sm font-bold ${
                      selectedTrace.status === 'error' ? 'text-error' : 'text-primary'
                    }`}
                  >
                    {selectedTrace.durationMs}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Waterfall Graph Rows */}
            <div className="flex flex-col gap-2 pt-space-xs">
              {/* Timing Scale Axis */}
              <div className="flex justify-between text-label-mono-sm text-on-surface-variant border-b border-surface-container-high pb-1 px-1">
                <span>0ms</span>
                <span>{Math.round(totalDuration * 0.25)}ms</span>
                <span>{Math.round(totalDuration * 0.5)}ms</span>
                <span>{Math.round(totalDuration * 0.75)}ms</span>
                <span>{totalDuration}ms (End)</span>
              </div>

              {/* Spans */}
              <div className="flex flex-col gap-1.5">
                {selectedTrace.spans.map((sp) => {
                  const isSpanSelected = selectedSpan?.id === sp.id;
                  const leftPercent = (sp.startTimeMs / totalDuration) * 100;
                  const widthPercent = Math.max(3, (sp.durationMs / totalDuration) * 100);

                  return (
                    <div
                      key={sp.id}
                      onClick={() => setSelectedSpan(sp)}
                      className={`p-space-xs rounded bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer border ${
                        isSpanSelected
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-outline-variant/10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-body-sm font-body-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              sp.status === 'error'
                                ? 'bg-error'
                                : sp.status === 'warn'
                                ? 'bg-tertiary'
                                : 'bg-primary'
                            }`}
                          ></span>
                          <span className="font-semibold text-on-surface">{sp.service}</span>
                          <span className="font-code-inline text-on-surface-variant text-[11px]">
                            {sp.operation}
                          </span>
                        </div>
                        <span
                          className={`font-label-mono-sm font-bold ${
                            sp.status === 'error' ? 'text-error' : 'text-on-surface'
                          }`}
                        >
                          {sp.durationMs}ms
                        </span>
                      </div>

                      {/* Bar Track */}
                      <div className="w-full bg-surface-container-lowest h-3 rounded relative overflow-hidden">
                        <div
                          className={`absolute top-0 bottom-0 rounded ${
                            sp.status === 'error'
                              ? 'bg-error shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                              : sp.status === 'warn'
                              ? 'bg-tertiary'
                              : 'bg-primary shadow-[0_0_8px_rgba(78,222,163,0.3)]'
                          }`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Span Details Drawer / Inspector */}
          {selectedSpan && (
            <div className="p-space-md rounded-xl bg-surface-container-low shadow-md border border-outline-variant/20 flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant">
                  Span Telemetry Inspector: {selectedSpan.operation}
                </span>
                <span
                  className={`px-space-xs py-0.5 rounded font-label-mono-sm font-bold ${
                    selectedSpan.status === 'error'
                      ? 'bg-error-container text-on-error-container'
                      : 'bg-primary-container text-on-primary-container'
                  }`}
                >
                  HTTP {selectedSpan.httpStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm bg-surface-container p-space-sm rounded-lg border border-outline-variant/20">
                <div className="flex flex-col">
                  <span className="font-label-mono-sm text-on-surface-variant">SERVICE</span>
                  <span className="font-code-inline text-on-surface font-semibold">{selectedSpan.service}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-mono-sm text-on-surface-variant">START OFFSET</span>
                  <span className="font-code-inline text-on-surface">{selectedSpan.startTimeMs}ms</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-mono-sm text-on-surface-variant">EXECUTION TIME</span>
                  <span
                    className={`font-code-inline font-bold ${
                      selectedSpan.status === 'error' ? 'text-error' : 'text-primary'
                    }`}
                  >
                    {selectedSpan.durationMs}ms
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-mono-sm text-on-surface-variant">STATUS</span>
                  <span className="font-label-mono-sm text-on-surface uppercase font-bold">
                    {selectedSpan.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Tags / Metadata */}
              <div className="flex flex-col gap-1">
                <span className="font-label-mono-sm text-on-surface-variant uppercase">
                  Span Attributes &amp; Payloads:
                </span>
                <div className="bg-surface-container-lowest p-space-sm rounded border border-outline-variant/20 font-code-inline text-[11px] flex flex-col gap-1">
                  {Object.entries(selectedSpan.tags).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-secondary font-semibold">{k}:</span>
                      <span className={v.includes('error') || v.includes('504') ? 'text-error' : 'text-on-surface'}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
