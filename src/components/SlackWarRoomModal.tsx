import React, { useState } from 'react';

interface SlackWarRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
}

interface Message {
  id: string;
  user: string;
  avatar: string;
  time: string;
  text: string;
  isBot?: boolean;
}

export const SlackWarRoomModal: React.FC<SlackWarRoomModalProps> = ({
  isOpen,
  onClose,
  channelName
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      user: 'PagerDuty Bot',
      avatar: 'PD',
      time: '14:20:05',
      text: '🚨 [CRITICAL ALERT] Elevated latency & 502 responses in EU-Central Edge Pop (#INC-409) assigned to @alex-chen (L2 Escalation).',
      isBot: true
    },
    {
      id: 'm2',
      user: 'Alex Chen',
      avatar: 'AC',
      time: '14:21:30',
      text: 'Acknowledging incident. Inspecting transit peer AS3356 in Frankfurt. P99 origin latency is spiking to 420ms.'
    },
    {
      id: 'm3',
      user: 'Dave K.',
      avatar: 'DK',
      time: '14:24:15',
      text: 'I checked Cockroach DB primary shards in Frankfurt. Replica lag is clean. Looks like upstream envoy packet drops.'
    },
    {
      id: 'm4',
      user: 'GitOps Bot',
      avatar: 'GO',
      time: '14:26:40',
      text: '⚡ [AUTOPILOT] Automated Canary Rollback Completed. Build v2.4.2 reverted to stable v2.4.1.',
      isBot: true
    },
    {
      id: 'm5',
      user: 'Sarah Lin',
      avatar: 'SL',
      time: '14:35:10',
      text: 'Triggering Route53 weighted traffic shift to Amsterdam (AMS-01) to bypass the congested Frankfurt transit route.'
    },
    {
      id: 'm6',
      user: 'Alex Chen',
      avatar: 'AC',
      time: '14:38:12',
      text: 'Traffic shift confirmed. Frankfurt edge latency is dropping back towards 95ms. Monitoring synthetic health checks.'
    }
  ]);
  const [inputVal, setInputVal] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputVal.trim()) return;
    const newMsg: Message = {
      id: 'm-' + Date.now(),
      user: 'You (SRE Responder)',
      avatar: 'ME',
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      text: inputVal.trim()
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputVal('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-surface-container-low rounded-xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col h-[580px] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-space-md py-space-sm bg-surface-container border-b border-surface-container-high">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-secondary text-[20px]">forum</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {channelName}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-tertiary-container text-on-tertiary-container font-label-mono-sm text-[10px] font-bold">
                  ACTIVE WAR ROOM
                </span>
              </div>
              <span className="font-body-sm text-on-surface-variant text-[11px]">
                5 responders active · PagerDuty synced · Audio channel open
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-space-md overflow-y-auto flex flex-col gap-space-md bg-surface-container-lowest">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-space-sm">
              <div
                className={`w-7 h-7 rounded shrink-0 flex items-center justify-center font-bold text-[11px] ${
                  m.isBot
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-primary/20 text-primary border border-primary/30'
                }`}
              >
                {m.avatar}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-headline-sm text-body-sm font-semibold text-on-surface">
                    {m.user}
                  </span>
                  <span className="font-label-mono-sm text-[10px] text-on-surface-variant">
                    {m.time}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface pt-0.5 break-words">
                  {m.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input prompt */}
        <div className="p-space-sm bg-surface-container border-t border-surface-container-high flex items-center gap-space-xs">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Post update or run command (e.g. /incident status)..."
            className="flex-1 px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface font-body-sm text-body-sm border border-outline-variant/30 focus:border-secondary focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="px-space-md py-space-xs rounded bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary font-body-sm text-body-sm font-semibold transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
