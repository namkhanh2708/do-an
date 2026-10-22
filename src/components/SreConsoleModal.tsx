import React, { useState, useRef, useEffect } from 'react';

interface SreConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: string;
}

export const SreConsoleModal: React.FC<SreConsoleModalProps> = ({
  isOpen,
  onClose,
  initialTarget
}) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([
    'PulseSRE Mesh Interactive Shell v4.19 (x86_64-pc-linux-gnu)',
    'Connected to cluster: k8s-prod-useast1-mesh (context: admin@prod)',
    'Type "help" for a list of available diagnostic commands.',
    ''
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTarget) {
        setHistory((prev) => [
          ...prev,
          `> Context focused on target node: ${initialTarget}`,
          `$ kubectl get pods -l app=${initialTarget} -o wide`
        ]);
        executeCommand(`kubectl get pods -l app=${initialTarget}`);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialTarget]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    const newOutput: string[] = [`$ ${cmd}`];

    if (!trimmed) {
      setHistory((prev) => [...prev, '$ ']);
      return;
    }

    if (trimmed === 'help') {
      newOutput.push(
        'Available SRE diagnostic commands:',
        '  kubectl get pods [-n prod]    List active cluster pods & readiness',
        '  kubectl get nodes              Inspect EKS node fleet resource load',
        '  kubectl describe pod <name>    View event logs & restart counters',
        '  curl -I <url>                  Inspect ingress HTTP/2 & TLS handshake',
        '  ping -c 4 <host>               Synthetic blackbox ICMP latency check',
        '  dig <domain>                   Inspect DNS Anycast geo-routing records',
        '  top                            Show live CPU & Memory load by worker',
        '  clear                          Clear current terminal output',
        '  exit                           Close SRE Ops Console session'
      );
    } else if (trimmed === 'clear') {
      setHistory([]);
      return;
    } else if (trimmed === 'exit') {
      onClose();
      return;
    } else if (trimmed.startsWith('kubectl get pods')) {
      newOutput.push(
        'NAME                                      READY   STATUS    RESTARTS   AGE     IP            NODE',
        'ingress-gw-prod-7f99b-x821               1/1     Running   0          4d2h    10.240.2.14   ip-10-240-2-1',
        'ingress-gw-prod-7f99b-m902               1/1     Running   0          4d2h    10.240.2.15   ip-10-240-2-2',
        'auth-cluster-core-89c-a1                 1/1     Running   0          12d     10.240.3.44   ip-10-240-3-1',
        'checkout-worker-pool-c7-98ka             1/1     Running   0          6h      10.240.4.12   ip-10-240-4-1',
        'checkout-worker-pool-c7-21nb             1/1     Running   0          6h      10.240.4.13   ip-10-240-4-2',
        'aurora-db-02-primary                     1/1     Running   0          45d     10.240.1.10   db-r6g-master',
        'edge-cdn-proxy-fra-02                    1/1     Degraded  2 (14m)    1d      10.240.9.88   edge-node-fra'
      );
    } else if (trimmed.startsWith('kubectl get nodes')) {
      newOutput.push(
        'NAME              STATUS   ROLES    AGE   VERSION   CPU%    MEM%',
        'ip-10-240-2-1     Ready    worker   45d   v1.28.3   62.1%   74.2%',
        'ip-10-240-2-2     Ready    worker   45d   v1.28.3   66.4%   78.9%',
        'ip-10-240-3-1     Ready    worker   45d   v1.28.3   42.0%   51.3%',
        'ip-10-240-4-1     Ready    worker   45d   v1.28.3   68.5%   80.1%',
        'edge-node-fra     Ready    edge     12d   v1.28.3   89.2%   84.6% [ANOMALY]'
      );
    } else if (trimmed.startsWith('curl')) {
      newOutput.push(
        'HTTP/2 200 OK',
        'server: envoy-proxy/1.28.0',
        'date: Wed, 21 Oct 2026 19:08:24 GMT',
        'content-type: application/json; charset=utf-8',
        'x-envoy-upstream-service-time: 4ms',
        'x-pulsesre-trace-id: TRACE-US-10294',
        'strict-transport-security: max-age=31536000; includeSubDomains',
        '{"status":"healthy","version":"2.4.1","cluster":"useast1-mesh","uptime_ratio":0.99982}'
      );
    } else if (trimmed.startsWith('ping')) {
      newOutput.push(
        'PING cdn-anycast.global (142.250.190.46) 56(84) bytes of data.',
        '64 bytes from fra-anycast (142.250.190.46): icmp_seq=1 ttl=56 time=18.4 ms',
        '64 bytes from fra-anycast (142.250.190.46): icmp_seq=2 ttl=56 time=19.1 ms',
        '64 bytes from fra-anycast (142.250.190.46): icmp_seq=3 ttl=56 time=18.8 ms',
        '64 bytes from fra-anycast (142.250.190.46): icmp_seq=4 ttl=56 time=18.2 ms',
        '--- cdn-anycast.global ping statistics ---',
        '4 packets transmitted, 4 received, 0% packet loss, time 3004ms',
        'rtt min/avg/max/mdev = 18.214/18.625/19.102/0.342 ms'
      );
    } else if (trimmed.startsWith('dig')) {
      newOutput.push(
        '; <<>> DiG 9.18.18-0ubuntu0.22.04.1-Ubuntu <<>> cdn-anycast.global',
        ';; Got answer:',
        ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 48192',
        ';; flags: qr rd ra; QUERY: 1, ANSWER: 3, AUTHORITY: 0, ADDITIONAL: 1',
        ';; ANSWER SECTION:',
        'cdn-anycast.global.  30  IN  A  142.250.190.46 (Primary Anycast)',
        'cdn-anycast.global.  30  IN  A  142.250.190.47 (Failover Geo-IP)',
        'cdn-anycast.global.  30  IN  A  142.250.190.48 (Secondary Ingress)',
        ';; Query time: 8 msec',
        ';; SERVER: 10.240.0.2#53(10.240.0.2)'
      );
    } else if (trimmed === 'top') {
      newOutput.push(
        'top - 19:10:02 up 45 days, 3 users,  load average: 1.84, 1.42, 1.10',
        'Tasks: 142 total,   2 running, 140 sleeping,   0 stopped,   0 zombie',
        '%Cpu(s): 24.1 us,  4.2 sy,  0.0 ni, 69.8 id,  1.2 wa,  0.0 hi,  0.7 si',
        'MiB Mem :  64412.8 total,  16210.4 free,  48202.4 used (74.8%)',
        '',
        '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
        ' 1042 envoy     20   0 12.4g  4.1g  124m S  42.4   6.4  84:12.19 envoy',
        ' 2891 postgres  20   0 32.1g 18.4g  512m S  22.1  28.6 312:45.02 postgres',
        ' 8912 node      20   0  4.2g  1.8g   92m S  14.8   2.8  19:04.11 checkout-worker'
      );
    } else {
      newOutput.push(
        `bash: ${cmd}: command not found. Type "help" for a list of available SRE diagnostic tools.`
      );
    }

    setHistory((prev) => [...prev, ...newOutput]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(command);
      setCommand('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-space-md py-space-xs bg-surface-container border-b border-surface-container-high">
          <div className="flex items-center gap-space-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-error inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-tertiary inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
            </div>
            <span className="font-code-inline text-code-inline text-on-surface font-semibold pl-2">
              sre-ops-console // k8s-prod-useast1-mesh [admin]
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistory([])}
              className="text-on-surface-variant hover:text-on-surface text-[12px] font-code-inline px-2 py-0.5 rounded hover:bg-surface-container-high"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="flex-1 p-space-md bg-[#090d16] overflow-y-auto font-code-inline text-code-inline text-on-surface select-text cursor-text"
        >
          {history.map((line, idx) => {
            const isCommand = line.startsWith('$');
            const isError = line.includes('command not found') || line.includes('[ANOMALY]');
            const isOk = line.includes('HTTP/2 200 OK') || line.includes('Ready');

            return (
              <div
                key={idx}
                className={`whitespace-pre-wrap ${
                  isCommand
                    ? 'text-primary font-bold'
                    : isError
                    ? 'text-error'
                    : isOk
                    ? 'text-on-surface'
                    : 'text-on-surface-variant'
                }`}
              >
                {line}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Command Input Prompt */}
        <div className="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-low border-t border-surface-container-high">
          <span className="text-primary font-code-inline font-bold select-none">$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type kubectl, ping, curl, top, or help..."
            className="flex-1 bg-transparent border-0 outline-none text-on-surface font-code-inline text-code-inline placeholder:text-on-surface-variant/40"
          />
          <button
            onClick={() => {
              executeCommand(command);
              setCommand('');
            }}
            className="px-2 py-1 rounded bg-primary-container text-on-primary-container text-label-mono-sm font-label-mono-sm font-semibold hover:bg-primary"
          >
            Run
          </button>
        </div>
      </div>
    </div>
  );
};
