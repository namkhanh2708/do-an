import React, { useState } from 'react';

interface NewAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAlert: (alertData: {
    name: string;
    target: string;
    metric: string;
    threshold: string;
    severity: string;
    window: string;
  }) => void;
}

export const NewAlertModal: React.FC<NewAlertModalProps> = ({
  isOpen,
  onClose,
  onSaveAlert
}) => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('European Edge CDN');
  const [metric, setMetric] = useState('P99 Latency');
  const [threshold, setThreshold] = useState('350ms');
  const [windowTime, setWindowTime] = useState('5m');
  const [severity, setSeverity] = useState('P2');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAlert({
      name: name || `${target} - ${metric} Spike Alert`,
      target,
      metric,
      threshold,
      severity,
      window: windowTime
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-surface-container-low rounded-xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-space-md py-space-sm bg-surface-container border-b border-surface-container-high">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[20px]">add_alert</span>
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Configure New SLO / Metric Alert
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-space-md flex flex-col gap-space-md">
          <div className="flex flex-col gap-1">
            <label className="font-label-mono-sm text-on-surface-variant uppercase">Alert Name</label>
            <input
              type="text"
              placeholder="e.g. Frankfurt Ingress P99 Latency Breach"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-space-md py-space-xs rounded bg-surface-container text-on-surface font-body-sm text-body-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1">
              <label className="font-label-mono-sm text-on-surface-variant uppercase">Target Service</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="px-space-md py-space-xs rounded bg-surface-container text-on-surface font-body-sm text-body-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
              >
                <option value="European Edge CDN">European Edge CDN</option>
                <option value="API Gateway Global">API Gateway Global</option>
                <option value="Primary Postgres Aurora">Primary Postgres Aurora</option>
                <option value="Async Payment Webhook">Async Payment Webhook</option>
                <option value="User Authentication Service">User Authentication Service</option>
                <option value="Global Consolidated Mesh">Global Consolidated Mesh</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-mono-sm text-on-surface-variant uppercase">Telemetry Signal</label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="px-space-md py-space-xs rounded bg-surface-container text-on-surface font-body-sm text-body-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
              >
                <option value="P99 Latency">P99 Latency (&gt; threshold)</option>
                <option value="Error Rate 5xx">5xx Error Rate (&gt; % threshold)</option>
                <option value="Burn Rate Velocity">Burn Rate Velocity (&gt; 1.0x)</option>
                <option value="CPU Core Saturation">CPU Saturation (&gt; 80%)</option>
                <option value="Synthetic Probe Loss">Synthetic Probe Loss (&gt; 0%)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1">
              <label className="font-label-mono-sm text-on-surface-variant uppercase">Threshold Value</label>
              <input
                type="text"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="e.g. 350ms or 0.10%"
                className="px-space-md py-space-xs rounded bg-surface-container text-on-surface font-body-sm text-body-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-mono-sm text-on-surface-variant uppercase">Breach Duration Window</label>
              <select
                value={windowTime}
                onChange={(e) => setWindowTime(e.target.value)}
                className="px-space-md py-space-xs rounded bg-surface-container text-on-surface font-body-sm text-body-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
              >
                <option value="1m">1 minute continuous</option>
                <option value="5m">5 minutes continuous</option>
                <option value="15m">15 minutes continuous</option>
                <option value="1h">1 hour rolling window</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-mono-sm text-on-surface-variant uppercase">Severity Assignment</label>
            <div className="grid grid-cols-3 gap-space-xs">
              {(['P1', 'P2', 'P3'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSeverity(lvl)}
                  className={`py-1.5 rounded font-label-mono-sm text-label-mono-sm font-bold uppercase transition-all ${
                    severity === lvl
                      ? lvl === 'P1'
                        ? 'bg-error-container text-on-error-container ring-1 ring-error'
                        : lvl === 'P2'
                        ? 'bg-tertiary-container text-on-tertiary-container ring-1 ring-tertiary'
                        : 'bg-primary-container text-on-primary-container ring-1 ring-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {lvl} {lvl === 'P1' ? 'CRITICAL' : lvl === 'P2' ? 'DEGRADED' : 'MINOR'}
                </button>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div className="flex flex-col gap-1 pt-1">
            <span className="font-label-mono-sm text-on-surface-variant uppercase">Escalation Channels</span>
            <div className="flex items-center gap-space-md text-body-sm text-on-surface-variant">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-primary" />
                <span>PagerDuty On-Call</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-primary" />
                <span>#incidents Slack War Room</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-space-xs pt-space-xs border-t border-surface-container-high">
            <button
              type="button"
              onClick={onClose}
              className="px-space-md py-space-xs rounded bg-surface-container-high hover:bg-surface-bright text-on-surface text-body-sm font-body-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-space-md py-space-xs rounded bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary font-body-sm text-body-sm font-semibold transition-colors"
            >
              Save Alert Guardrail
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
