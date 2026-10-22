import React, { useState } from 'react';

interface SLOsViewProps {
  onOpenNewAlert: () => void;
  onShowToast: (title: string, msg: string, icon: string, color: string) => void;
}

export const SLOsView: React.FC<SLOsViewProps> = ({
  onOpenNewAlert,
  onShowToast
}) => {
  const [slos, setSlos] = useState([
    {
      id: 'slo-1',
      name: 'Global Mesh Availability',
      target: '99.950%',
      current: '99.982%',
      margin: '+0.032%',
      period: '30-day rolling',
      burnRate: '0.42x',
      budgetRemaining: '86.4%',
      status: 'met',
      service: 'All Core Services'
    },
    {
      id: 'slo-2',
      name: 'European Edge Ingress P99 Latency (<200ms)',
      target: '99.000%',
      current: '98.920%',
      margin: '-0.080%',
      period: '7-day rolling',
      burnRate: '1.80x',
      budgetRemaining: '12.1%',
      status: 'breached',
      service: 'European Edge CDN'
    },
    {
      id: 'slo-3',
      name: 'User Authentication Token Signing Success',
      target: '99.990%',
      current: '100.000%',
      margin: '+0.010%',
      period: '30-day rolling',
      burnRate: '0.00x',
      budgetRemaining: '100.0%',
      status: 'met',
      service: 'User Authentication Service'
    },
    {
      id: 'slo-4',
      name: 'Payment Webhook Delivery within 2s',
      target: '99.900%',
      current: '99.980%',
      margin: '+0.080%',
      period: '30-day rolling',
      burnRate: '0.01x',
      budgetRemaining: '96.2%',
      status: 'met',
      service: 'Async Payment Webhook'
    }
  ]);

  const handleExportAudit = () => {
    onShowToast('Audit Report Exported', 'Downloaded: PulseSRE-SLO-Quarterly-Audit-2026.pdf', 'file_download', 'text-primary');
  };

  return (
    <div className="flex flex-col w-full gap-space-lg pb-space-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl shadow-md border border-outline-variant/20">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary text-[20px]">task_alt</span>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Service Level Objectives (SLOs) &amp; Error Budgets
            </h2>
            <p className="font-body-sm text-on-surface-variant">
              Multi-window multi-burn-rate policy enforcement, budget burn velocity, and SLA defense
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-xs flex-wrap">
          <button
            onClick={handleExportAudit}
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-high hover:bg-surface-bright text-on-surface text-body-sm font-body-sm transition-colors border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[15px]">file_download</span>
            <span>Export Audit PDF</span>
          </button>
          <button
            onClick={onOpenNewAlert}
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary text-body-sm font-body-sm font-semibold transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add_alert</span>
            <span>Define SLO</span>
          </button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <span className="font-label-mono-sm text-on-surface-variant uppercase">OVERALL SLO COMPLIANCE</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-metric-display text-headline-lg text-primary">99.982%</span>
            <span className="font-label-mono-sm text-primary">+0.032% Margin</span>
          </div>
          <span className="text-body-sm text-on-surface-variant mt-1">3/4 SLO Policies Met</span>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <span className="font-label-mono-sm text-on-surface-variant uppercase">AGGREGATE BURN VELOCITY</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-metric-display text-headline-lg text-on-surface">0.42x</span>
            <span className="font-label-mono-sm text-primary">Nominal</span>
          </div>
          <span className="text-body-sm text-on-surface-variant mt-1">Runway: 124 Days without breach</span>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <span className="font-label-mono-sm text-on-surface-variant uppercase">ACTIVE BURN BREACHES</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-metric-display text-headline-lg text-tertiary">1 Alert</span>
            <span className="font-label-mono-sm text-tertiary">1.8x Rate</span>
          </div>
          <span className="text-body-sm text-on-surface-variant mt-1">European Edge CDN origin timeout</span>
        </div>
      </div>

      {/* SLO Table */}
      <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md border border-outline-variant/20 flex flex-col gap-space-md">
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
          Active Service Level Objectives
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest text-on-surface-variant font-label-mono-sm text-label-mono-sm uppercase tracking-wider">
                <th className="py-space-sm px-space-md rounded-l">SLO Policy Name</th>
                <th className="py-space-sm px-space-md">Target</th>
                <th className="py-space-sm px-space-md">Current SLI</th>
                <th className="py-space-sm px-space-md">Error Budget Left</th>
                <th className="py-space-sm px-space-md">Burn Velocity</th>
                <th className="py-space-sm px-space-md rounded-r text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-0 text-on-surface">
              {slos.map((s) => (
                <tr key={s.id} className="hover:bg-surface-container transition-colors">
                  <td className="py-space-md px-space-md font-medium">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-semibold">{s.name}</span>
                      <span className="font-code-inline text-on-surface-variant text-[11px]">
                        {s.service} · {s.period}
                      </span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md font-label-mono-sm text-on-surface-variant">
                    {s.target}
                  </td>
                  <td className="py-space-md px-space-md font-label-mono-sm">
                    <span className={s.status === 'breached' ? 'text-error font-bold' : 'text-primary font-bold'}>
                      {s.current}
                    </span>{' '}
                    <span className="text-[10px] text-on-surface-variant">({s.margin})</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-2">
                      <span className="font-label-mono-sm text-on-surface font-semibold w-12">
                        {s.budgetRemaining}
                      </span>
                      <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className={`h-full ${s.status === 'breached' ? 'bg-error' : 'bg-primary'}`}
                          style={{ width: s.budgetRemaining }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md font-label-mono-sm">
                    <span className={s.status === 'breached' ? 'text-error font-bold' : 'text-on-surface'}>
                      {s.burnRate}
                    </span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <span
                      className={`px-space-xs py-0.5 rounded font-label-mono-sm text-[10px] font-bold ${
                        s.status === 'met'
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-tertiary-container text-on-tertiary-container'
                      }`}
                    >
                      {s.status === 'met' ? 'SLO MET' : 'BUDGET BURN'}
                    </span>
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
