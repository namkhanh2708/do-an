import React, { useState } from 'react';
import { IncidentItem } from '../types/telemetry';

interface PostMortemModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: IncidentItem | null;
  onSave?: (pmData: unknown) => void;
}

export const PostMortemModal: React.FC<PostMortemModalProps> = ({
  isOpen,
  onClose,
  incident
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !incident) return null;

  const markdownContent = `# SRE Post-Mortem: ${incident.title}
**Incident ID**: ${incident.key}
**Severity**: ${incident.severityLabel}
**Time to Resolution (TTR)**: ${incident.duration || '18m 45s'}
**Affected Region**: ${incident.region}
**Lead Investigator**: ${incident.assignee}

## 1. Executive Summary
During peak operational window, ${incident.summary}
This triggered the regional synthetic health check alarm and initiated automated fallback procedures.

## 2. Impact Analysis
- **Traffic Ingress Affected**: ${incident.trafficAffected}
- **Failed Requests (10m)**: ${incident.failedRequests10m}
- **SLO Error Budget Burned**: 0.42x hourly burn rate (recovered safely)
- **Customer Experience**: Elevated TTFB observed (+140ms average, 420ms peak on Frankfurt PoP)

## 3. Root Cause Analysis (5 Whys)
1. **Why did P99 origin latency spike?** Transit peer AS3356 in Western Europe experienced packet reordering and congestion.
2. **Why was traffic sent through AS3356?** Default BGP weighting prioritized Frankfurt tier-1 transit without dynamic jitter feedback.
3. **Why didn't automated failover happen instantly?** Health check hysteresis was set to 5m to avoid route flaps.
4. **Why was canary v2.41.0-rc3 affected?** New HTTP/2 multiplexing profile exposed buffer pool constraints during high packet reordering.
5. **Root Cause**: Ingress BGP route flapping coupled with canary transport layer buffer sizing.

## 4. Preventative Action Items
- [x] Automated Canary Rollback to stable v2.4.1 (GitOps engine completed).
- [ ] Implement synthetic jitter scoring in Anycast DNS health checks (Owner: @alex-chen).
- [ ] Expand worker pool socket buffers for HTTP/2 multiplexing (Owner: @dave-k).
- [ ] Add sub-60s BGP route-flap damping policy to Cloudflare/Fastly ingress (Owner: @sarah-lin).
`;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-surface-container-low rounded-xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-space-md py-space-sm bg-surface-container border-b border-surface-container-high">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[20px]">assignment</span>
            <div>
              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Post-Mortem: {incident.key}
              </span>
              <span className="block font-code-inline text-[11px] text-on-surface-variant">
                BLAMELESS ROOT CAUSE ANALYSIS & RETROSPECTIVE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => setActiveTab(activeTab === 'view' ? 'edit' : 'view')}
              className="px-space-sm py-1 rounded bg-surface-container-high text-on-surface hover:bg-surface-bright text-body-sm font-body-sm transition-colors"
            >
              {activeTab === 'view' ? 'Edit Mode' : 'Preview Mode'}
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="px-space-sm py-1 rounded bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary text-body-sm font-body-sm font-semibold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">content_copy</span>
              <span>{copied ? 'Copied MD!' : 'Copy MD'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-space-lg overflow-y-auto flex flex-col gap-space-md text-on-surface">
          {activeTab === 'view' ? (
            <>
              {/* Executive Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm bg-surface-container p-space-sm rounded-lg border border-outline-variant/20">
                <div className="flex flex-col">
                  <span className="font-label-mono-sm text-on-surface-variant uppercase">Incident Severity</span>
                  <span className="font-label-mono-md text-tertiary font-bold">{incident.severityLabel}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-mono-sm text-on-surface-variant uppercase">Time to Resolution</span>
                  <span className="font-metric-display-mobile text-on-surface">{incident.duration || '18m 45s'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-mono-sm text-on-surface-variant uppercase">Peak Latency</span>
                  <span className="font-metric-display-mobile text-tertiary">{incident.peakP99}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-mono-sm text-on-surface-variant uppercase">Affected Users</span>
                  <span className="font-label-mono-md text-primary font-bold">{incident.trafficAffected}</span>
                </div>
              </div>

              {/* Summary */}
              <div className="flex flex-col gap-1">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">1. Executive Summary</h3>
                <p className="font-body-sm text-on-surface-variant leading-relaxed">
                  {incident.summary} Regional synthetic probes detected origin latency breaches exceeding the SLA threshold at 14:20 UTC. The on-call commander executed an automated canary rollback and initiated DNS traffic steering towards Amsterdam (AMS-01), mitigating user impact in under 19 minutes.
                </p>
              </div>

              {/* 5 Whys Root Cause */}
              <div className="flex flex-col gap-2">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">2. Root Cause (5 Whys)</h3>
                <div className="bg-surface-container p-space-md rounded-lg flex flex-col gap-2 border border-outline-variant/20 font-body-sm text-body-sm">
                  <div>
                    <span className="text-primary font-bold">Why 1: </span>
                    <span className="text-on-surface">Why did European edge origin latency spike to 420ms?</span>
                    <p className="text-on-surface-variant pl-4">Transit peer AS3356 in Frankfurt experienced 14.8% packet reordering.</p>
                  </div>
                  <div>
                    <span className="text-primary font-bold">Why 2: </span>
                    <span className="text-on-surface">Why was ingress traffic routed through AS3356?</span>
                    <p className="text-on-surface-variant pl-4">Anycast BGP weight was statically set to 100 without real-time jitter penalties.</p>
                  </div>
                  <div>
                    <span className="text-primary font-bold">Why 3: </span>
                    <span className="text-on-surface">Why didn't auto-divert trigger immediately?</span>
                    <p className="text-on-surface-variant pl-4">Hysteresis timer of 5 minutes delayed automated DNS weight shift.</p>
                  </div>
                  <div>
                    <span className="text-primary font-bold">Why 4: </span>
                    <span className="text-on-surface">Why did canary v2.41.0-rc3 exacerbate the issue?</span>
                    <p className="text-on-surface-variant pl-4">The new HTTP/2 multiplexing configuration lacked adequate buffer backpressure.</p>
                  </div>
                  <div>
                    <span className="text-primary font-bold">Why 5 (Root Cause): </span>
                    <span className="text-tertiary font-bold">Static BGP Anycast routing weights in Europe coupled with premature canary buffer sizing.</span>
                  </div>
                </div>
              </div>

              {/* Action items */}
              <div className="flex flex-col gap-2">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">3. Corrective Action Items</h3>
                <div className="flex flex-col gap-1.5 font-body-sm text-body-sm">
                  <div className="flex items-center gap-2 p-2 rounded bg-surface-container">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_box</span>
                    <span className="line-through text-on-surface-variant">Revert canary v2.41.0-rc3 back to v2.4.1</span>
                    <span className="ml-auto font-label-mono-sm text-primary font-bold">DONE</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-surface-container">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">check_box_outline_blank</span>
                    <span className="text-on-surface">Deploy dynamic jitter-based Anycast BGP route scoring</span>
                    <span className="ml-auto font-label-mono-sm text-on-surface-variant">Owner: @alex-chen</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-surface-container">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">check_box_outline_blank</span>
                    <span className="text-on-surface">Increase TCP worker socket buffers for Frankfurt edge cluster</span>
                    <span className="ml-auto font-label-mono-sm text-on-surface-variant">Owner: @dave-k</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <textarea
              defaultValue={markdownContent}
              className="w-full h-96 p-space-md rounded bg-surface-container-lowest font-code-inline text-code-inline text-on-surface border border-outline-variant/30 focus:border-primary focus:outline-none"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-space-md py-space-sm bg-surface-container border-t border-surface-container-high">
          <span className="font-label-mono-sm text-label-mono-sm text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            SRE Blameless Retrospective Standard v2.1
          </span>
          <button
            onClick={onClose}
            className="px-space-md py-space-xs rounded bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary font-body-sm text-body-sm font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
