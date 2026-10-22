import React, { useState } from 'react';
import { NavTab } from '../types/telemetry';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeP2Count: number;
  onOpenCommandPalette: () => void;
  onOpenNewAlert: () => void;
  onOpenTuneSettings: () => void;
  onOpenNotifications: () => void;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  onToggleSidebarMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectTab,
  activeP2Count,
  onOpenCommandPalette,
  onOpenNewAlert,
  onOpenTuneSettings,
  onOpenNotifications,
  selectedRegion,
  onSelectRegion,
  onToggleSidebarMobile
}) => {
  const [regionMenuOpen, setRegionMenuOpen] = useState(false);

  const regions = [
    { label: 'PROD / US-EAST-1', code: 'us-east-1' },
    { label: 'PROD / US-WEST-2', code: 'us-west-2' },
    { label: 'PROD / EU-CENTRAL-1', code: 'eu-central-1' },
    { label: 'PROD / AP-SOUTH-1', code: 'ap-south-1' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-surface-container-lowest/90 backdrop-blur-xl z-50 flex items-center justify-between px-margin-desktop shadow-[0_1px_8px_rgba(0,0,0,0.2)] border-b border-surface-container-high/60">
      {/* Left cluster */}
      <div className="flex items-center gap-space-lg">
        {/* Mobile menu button */}
        <button
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
          aria-label="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        {/* PulseSRE Logo */}
        <div
          onClick={() => onSelectTab('overview')}
          className="flex items-center gap-space-sm cursor-pointer select-none"
        >
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(78,222,163,0.3)]">
            <span className="material-symbols-outlined text-on-primary text-[16px]">monitoring</span>
          </div>
          <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface font-bold">
            Pulse<span className="text-primary">SRE</span>
          </span>
        </div>

        <div className="h-4 w-px bg-surface-variant hidden sm:block"></div>

        {/* Environment / Region selector dropdown */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setRegionMenuOpen(!regionMenuOpen)}
            className="flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container-low text-on-surface-variant text-label-mono-sm font-label-mono-sm hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[14px] text-primary">dns</span>
            <span className="font-semibold text-on-surface">{selectedRegion}</span>
            <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
          </button>

          {regionMenuOpen && (
            <div className="absolute left-0 mt-1 w-52 rounded bg-surface-container-highest shadow-xl z-50 p-1 flex flex-col gap-0.5 border border-outline-variant/40">
              {regions.map((r) => (
                <button
                  key={r.code}
                  onClick={() => {
                    onSelectRegion(r.label);
                    setRegionMenuOpen(false);
                  }}
                  className={`text-left px-space-sm py-space-xs rounded text-body-sm font-body-sm flex items-center justify-between ${
                    selectedRegion === r.label
                      ? 'bg-primary-container text-on-primary-container font-semibold'
                      : 'text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  <span>{r.label}</span>
                  {selectedRegion === r.label && (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 1 ACTIVE P2 Pill */}
        {activeP2Count > 0 && (
          <button
            onClick={() => onSelectTab('incidents')}
            className="flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-error-container text-on-error-container text-label-mono-sm font-label-mono-sm hover:brightness-110 transition-all cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.25)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
            <span>{activeP2Count} ACTIVE P2</span>
          </button>
        )}
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-space-md">
        {/* Search Bar / Cmd+K */}
        <div
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-space-sm px-space-md py-space-xs rounded bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors border border-outline-variant/30"
        >
          <span className="material-symbols-outlined text-[16px]">search</span>
          <span className="font-code-inline text-code-inline text-on-surface-variant">
            Search services, logs, queries...
          </span>
          <kbd className="px-space-xs rounded bg-surface-container text-label-mono-sm font-label-mono-sm text-on-surface-variant border border-surface-container-highest">
            ⌘K
          </kbd>
        </div>

        {/* P99 Telemetry Pill */}
        <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container-low text-label-mono-sm font-label-mono-sm border border-outline-variant/20">
          <span className="material-symbols-outlined text-[14px] text-tertiary">speed</span>
          <span className="text-on-surface-variant">P99:</span>
          <span className="text-tertiary font-semibold">42ms</span>
        </div>

        {/* + New Alert Button */}
        <button
          onClick={onOpenNewAlert}
          className="flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-primary-container text-on-primary-container font-body-sm text-body-sm font-medium hover:bg-primary hover:text-on-primary transition-all shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span className="hidden sm:inline">New Alert</span>
        </button>

        {/* Notification Bell */}
        <div className="flex items-center gap-space-xs">
          <button
            onClick={onOpenNotifications}
            className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors relative"
            title="Operational Alerts"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary"></span>
          </button>

          {/* Tune / Settings */}
          <button
            onClick={onOpenTuneSettings}
            className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            title="Telemetry Preferences"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </div>

        {/* User avatar */}
        <div
          className="relative group cursor-pointer"
          title="On-Call SRE Commander: @alex-chen"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-[0_0_8px_rgba(78,222,163,0.3)]">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface-container-lowest"></span>
        </div>
      </div>
    </header>
  );
};
