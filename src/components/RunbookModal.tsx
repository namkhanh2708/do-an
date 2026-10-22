import React, { useState, useEffect } from 'react';

interface RunbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  runbookName: string;
  onRunbookComplete?: (name: string) => void;
}

export const RunbookModal: React.FC<RunbookModalProps> = ({
  isOpen,
  onClose,
  runbookName,
  onRunbookComplete
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const scriptSteps: Record<string, { step: string; command: string; output: string }[]> = {
    'Cache-Purge': [
      { step: 'Init', command: 'runbook-agent init --target=eu-west-1 --scope=edge-cdn', output: '[INFO] Initialized SRE runbook agent session. Token validated.' },
      { step: 'Pre-flight Check', command: 'check-transit-peers --asn=AS3356', output: '[WARN] Transit AS3356 packet jitter confirmed at 14.8%. Fallback node available.' },
      { step: 'Purge Edge Cache', command: 'fastly-purge --all-surrogate-keys --tag=inventory-eu', output: '[OK] Dispatched soft purge to 32 PoPs. Invalidation receipt: PURGE_998124.' },
      { step: 'DNS Traffic Shift', command: 'route53:shift-weight --from=fra-01 --to=ams-01 --weight=80', output: '[OK] Diverted 80% ingress from Frankfurt (FRA-01) to Amsterdam (AMS-01).' },
      { step: 'Verify Synthetic Probe', command: 'probe-http --url=https://cdn-anycast.global/healthz --count=10', output: '[OK] Synthetic probes 10/10 OK. P99 latency recovered from 420ms -> 92ms.' }
    ],
    'Canary Rollback': [
      { step: 'Check GitOps State', command: 'argocd app get ingress-cdn-canary', output: '[INFO] Current image tag: canary:v2.41.0-rc3. Error rate threshold 2.0% breached.' },
      { step: 'Revert Deployment', command: 'kubectl rollout undo deployment/cdn-ingress-worker -n ingress-mesh', output: '[OK] deployment.apps/cdn-ingress-worker rolled back to revision 41 (v2.4.1 stable).' },
      { step: 'Verify Pod Readiness', command: 'kubectl rollout status deployment/cdn-ingress-worker -w', output: '[OK] 32/32 pods healthy and serving traffic. 0 evictions.' }
    ],
    'default': [
      { step: 'Init Diagnostic', command: 'sre-diagnostic-check --all-clusters', output: '[INFO] Scanning node pools and ingress gateways...' },
      { step: 'Mitigation Hook', command: 'apply-slo-guardrail --level=tier-1', output: '[OK] Policy applied: expanded ingress buffer pool.' },
      { step: 'Health Verification', command: 'mesh-health-audit', output: '[OK] All 18 microservices returned healthy status.' }
    ]
  };

  const currentScript = scriptSteps[runbookName] || scriptSteps['default'];

  useEffect(() => {
    if (isOpen) {
      setLogs(['> Ready to execute runbook: ' + runbookName, '> Press "Start Automated Execution" to run pipeline.']);
      setCurrentStep(0);
      setIsRunning(false);
      setIsCompleted(false);
    }
  }, [isOpen, runbookName]);

  const handleStart = () => {
    setIsRunning(true);
    setLogs(['> [PIPELINE INITIALIZED] Executing playbook: ' + runbookName + '...']);

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < currentScript.length) {
        const item = currentScript[stepIdx];
        setLogs((prev) => [
          ...prev,
          `\n> [STEP ${stepIdx + 1}/${currentScript.length}] ${item.step}`,
          `$ ${item.command}`,
          item.output
        ]);
        setCurrentStep(stepIdx + 1);
        stepIdx++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        setIsCompleted(true);
        setLogs((prev) => [
          ...prev,
          '\n================================================',
          '✓ [SUCCESS] Playbook completed with Exit Code 0.',
          '✓ Telemetry verified. SLI burn rate normalized.',
          '================================================'
        ]);
        if (onRunbookComplete) {
          onRunbookComplete(runbookName);
        }
      }
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-space-md py-space-sm bg-surface-container border-b border-surface-container-high">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-tertiary text-[20px]">play_circle</span>
            <div>
              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Runbook: {runbookName}
              </span>
              <span className="block font-code-inline text-[11px] text-on-surface-variant">
                ENGINE V3.4 // SRE AUTOMATED MITIGATION PIPELINE
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-between px-space-md py-2 bg-surface-container-low border-b border-surface-container-high gap-2 overflow-x-auto text-label-mono-sm font-label-mono-sm">
          {currentScript.map((s, idx) => (
            <div
              key={s.step}
              className={`flex items-center gap-1 px-2 py-1 rounded whitespace-nowrap ${
                idx < currentStep
                  ? 'bg-primary/10 text-primary font-semibold'
                  : idx === currentStep && isRunning
                  ? 'bg-tertiary/20 text-tertiary animate-pulse font-bold'
                  : 'text-on-surface-variant bg-surface-container'
              }`}
            >
              <span>{idx + 1}.</span>
              <span>{s.step}</span>
              {idx < currentStep && <span className="material-symbols-outlined text-[12px]">check</span>}
            </div>
          ))}
        </div>

        {/* Terminal Screen */}
        <div className="flex-1 p-space-md bg-[#0a0e17] overflow-y-auto font-code-inline text-code-inline text-on-surface flex flex-col gap-1 min-h-[260px] max-h-[420px]">
          {logs.map((line, idx) => {
            const isCommand = line.startsWith('$');
            const isStep = line.includes('[STEP');
            const isSuccess = line.includes('[SUCCESS]') || line.includes('[OK]');
            const isWarn = line.includes('[WARN]');

            return (
              <div
                key={idx}
                className={`${
                  isCommand
                    ? 'text-primary font-semibold'
                    : isStep
                    ? 'text-tertiary font-bold mt-1'
                    : isSuccess
                    ? 'text-primary'
                    : isWarn
                    ? 'text-tertiary'
                    : 'text-on-surface-variant'
                }`}
              >
                {line}
              </div>
            );
          })}
          {isRunning && (
            <div className="flex items-center gap-1 text-primary animate-pulse pt-2">
              <span className="inline-block w-2 h-4 bg-primary"></span>
              <span>Executing step {currentStep + 1}...</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between px-space-md py-space-sm bg-surface-container border-t border-surface-container-high">
          <div className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
            Status: {isCompleted ? (
              <span className="text-primary font-bold">COMPLETED (EXIT 0)</span>
            ) : isRunning ? (
              <span className="text-tertiary font-bold">RUNNING...</span>
            ) : (
              <span>READY</span>
            )}
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              onClick={onClose}
              className="px-space-md py-space-xs rounded bg-surface-container-high hover:bg-surface-bright text-on-surface text-body-sm font-body-sm"
            >
              {isCompleted ? 'Close' : 'Cancel'}
            </button>
            {!isCompleted ? (
              <button
                onClick={handleStart}
                disabled={isRunning}
                className="px-space-md py-space-xs rounded bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary font-body-sm text-body-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                <span>{isRunning ? 'Executing...' : 'Start Automated Execution'}</span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="px-space-md py-space-xs rounded bg-surface-container-high hover:bg-surface-bright text-primary font-body-sm text-body-sm font-semibold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Rerun Pipeline</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
