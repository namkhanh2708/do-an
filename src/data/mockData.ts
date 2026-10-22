import { ServiceItem, IncidentItem, EdgeProbeNode, LogEntry, DistributedTrace } from '../types/telemetry';

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'cdn',
    name: 'European Edge CDN',
    key: 'cdn',
    region: 'eu-west-1',
    status: 'degraded',
    statusBadge: 'DEGRADED',
    statusBadgeClass: 'bg-tertiary-container/30 text-tertiary',
    desc: 'Edge ingress distribution nodes serving static assets, cache warming, and webhooks in Western Europe (Frankfurt & London).',
    meshTag: 'cdn-anycast.global // 32 PoPs active',
    pods: '32 Edge Nodes (Anycast)',
    uptime30d: '98.92%',
    p50: '18ms',
    p90: '84ms',
    p99: '310ms',
    cacheHitRatio: '84.0%',
    cacheHitDelta: '-8.2%',
    errorRate4xx: '2.14%',
    errorRate5xx: '0.04%',
    rpsThroughput: '1,890 rps',
    nodes: '32 Edge Nodes (Anycast)',
    memFootprint: '48.2 GB / 64 GB',
    sloBurn: '1.8x Rate Exceeded',
    canaryTag: 'canary:v2.41.0-rc3',
    latencyTrend: [45, 44, 43, 45, 42, 44, 40, 20, 8, 14, 32, 18, 22, 24],
    historyTicks: [
      ...Array(38).fill('primary'),
      'tertiary',
      'tertiary',
      'error',
      'tertiary',
      'tertiary',
      'tertiary',
      'tertiary'
    ]
  },
  {
    id: 'postgres',
    name: 'Primary Postgres Aurora Cluster',
    key: 'postgres',
    region: 'aurora-db-02',
    status: 'operational',
    statusBadge: 'OPERATIONAL',
    statusBadgeClass: 'bg-primary-container/20 text-primary',
    desc: 'PostgreSQL 15.4 multi-AZ database backing relational order stores, transaction ledger, and client configuration state.',
    meshTag: 'cluster-db.main // 12 nodes (Multi-AZ)',
    pods: '12 nodes (Multi-AZ)',
    uptime30d: '99.96%',
    p50: '2.1ms',
    p90: '6.8ms',
    p99: '12.4ms',
    errorRate5xx: '0.001%',
    rpsThroughput: '3,120 IOPS',
    nodes: '1 Primary, 2 Replicas (db.r6g.4xl)',
    memFootprint: '112 GB / 128 GB',
    sloBurn: 'Within 0.04x Budget',
    canaryTag: 'release:pg-v15.4-p2',
    iopsLoad: '3,120 / 4,000 IOPS (78%)',
    burstBucket: '100% full',
    engine: '15.4-aurora • Primary + 2 Read Replicas • Replication Lag: 12ms',
    latencyTrend: [24, 10, 22, 8, 20, 15, 12, 18, 14, 16],
    historyTicks: Array(45).fill('primary')
  },
  {
    id: 'webhook',
    name: 'Async Payment Webhook Worker',
    key: 'webhook',
    region: 'checkout-worker-pool-c7',
    status: 'operational',
    statusBadge: 'OPERATIONAL',
    statusBadgeClass: 'bg-primary-container/20 text-primary',
    desc: 'Kubernetes pod pool processing asynchronous Stripe, Adyen, and PayPal settlement hooks with idempotency locks.',
    meshTag: 'k8s-pod: checkout-worker-pool-c7',
    pods: '16 Replicas (Ready)',
    uptime30d: '99.98%',
    p50: '8ms',
    p90: '14ms',
    p99: '22ms',
    errorRate5xx: '0.000%',
    rpsThroughput: '240 msg/s avg',
    nodes: '16 Pods (Horizontal Pod Autoscaled)',
    memFootprint: '22.4 GB / 32 GB',
    sloBurn: 'Clean Budget (0.01x)',
    canaryTag: 'stable:v4.19.2',
    queueBacklog: 14,
    deadLetter: 0,
    latencyTrend: [24, 20, 25, 16, 22, 18, 15, 19, 12, 15, 10, 14, 8, 12, 7, 10, 8],
    historyTicks: Array(45).fill('primary')
  },
  {
    id: 'gateway',
    name: 'API Gateway Edge Ingress',
    key: 'gateway',
    region: 'us-east-1',
    status: 'operational',
    statusBadge: 'OPERATIONAL',
    statusBadgeClass: 'bg-primary-container/20 text-primary',
    desc: 'US-East-1 Envoy Ingress proxy terminating client TLS 1.3, rate-limiting, WAF evaluation, and service routing.',
    meshTag: 'ingress-gw.prod.mesh // 96 pods',
    pods: '96 pods',
    uptime30d: '99.99%',
    p50: '11ms',
    p90: '26ms',
    p99: '42ms',
    errorRate5xx: '0.001%',
    rpsThroughput: '2,410 rps',
    nodes: '24 Envoy Proxy Pods (96 cores)',
    memFootprint: '36.0 GB / 48 GB',
    sloBurn: 'Nominal 0.02x',
    canaryTag: 'release:envoy-1.28.0',
    latencyTrend: [20, 18, 22, 14, 16, 11, 14, 9, 12, 7, 10, 6, 9, 5, 6],
    historyTicks: Array(45).fill('primary')
  },
  {
    id: 'auth',
    name: 'User Authentication Service',
    key: 'auth',
    region: 'auth-core.internal',
    status: 'operational',
    statusBadge: 'OPERATIONAL',
    statusBadgeClass: 'bg-primary-container/20 text-primary',
    desc: 'Core token signing, key rotation, and OAuth2/OIDC policy evaluation engine backed by distributed Redis clusters.',
    meshTag: 'auth-core.internal // 48 pods',
    pods: '48 pods',
    uptime30d: '100.0%',
    p50: '14ms',
    p90: '38ms',
    p99: '68ms',
    errorRate5xx: '0.000%',
    rpsThroughput: '850 rps',
    nodes: '12 Micro-Pods (Go Runtime)',
    memFootprint: '14.2 GB / 24 GB',
    sloBurn: '0.00x (No Burn)',
    canaryTag: 'release:auth-v3.1.2',
    tokenVerification: '99.999%',
    latencyTrend: [16, 17, 15, 14, 16, 13, 14, 12, 15, 11],
    historyTicks: Array(45).fill('primary')
  }
];

export const INITIAL_INCIDENTS: IncidentItem[] = [
  {
    id: 'inc-409',
    key: '#INC-409',
    title: 'Elevated latency & 502 responses in EU-Central Edge Pop',
    summary: 'Upstream envoy proxy timeouts observed across HTTP worker pool cluster 04. Regional synthetic health check failure threshold breached at 14:20 UTC.',
    severity: 'P2',
    severityLabel: 'P2 DEGRADED',
    region: 'eu-central-1 (Frankfurt Edge)',
    service: 'European Edge CDN',
    serviceKey: 'cdn',
    assignee: 'Alex Chen',
    assigneeAvatar: 'AC',
    triggeredAt: '14m ago',
    elapsedSeconds: 1125,
    status: 'investigating',
    peakP99: '420ms @ 14:28 UTC',
    currentP99: '+340ms (Current)',
    baselineP99: '42ms (Historical Baseline)',
    trafficAffected: '14.2% global users',
    failedRequests10m: '1,842 errs',
    autoMitigation: 'Divert-Frankfurt-09',
    runbookOutput: [
      '> [14:26:10] rollback-service --cluster=fra-01',
      '> Pod re-deployment complete (8/8 ready)',
      '> [14:38:00] route53:shift-weight weight=0',
      '> Awaiting TTL convergence (60s remaining)'
    ],
    timeline: [
      {
        time: '14:38:12 UTC',
        title: 'Global Traffic Shift Executed',
        desc: 'Edge router DNS steering diverted 80% ingress from Frankfurt to Amsterdam (AMS-01). Frankfurt latency declining from 420ms to 95ms.',
        type: 'action'
      },
      {
        time: '14:26:40 UTC',
        title: 'Automated Canary Rollback Completed',
        desc: 'GitOps engine reverted build v2.4.2 back to stable v2.4.1.',
        type: 'system'
      },
      {
        time: '14:20:05 UTC',
        title: 'Synthetic Probe Trigger Breach',
        desc: 'Multi-region probes reported >1,450ms P99 responses and 3.4% 502 Bad Gateway responses. Alert dispatched to On-Call via PagerDuty.',
        type: 'alert'
      }
    ],
    postMortemStatus: 'none',
    acknowledged: false
  },
  {
    id: 'inc-408',
    key: '#INC-408',
    title: 'PostgreSQL read replica lag spike in us-east-2',
    summary: 'Primary pool saturated to 92%. Automated pod horizontal autoscaler spun up 16 extra nodes.',
    severity: 'RESOLVED',
    severityLabel: 'RESOLVED',
    region: 'us-east-2',
    service: 'Primary Postgres Aurora Cluster',
    serviceKey: 'postgres',
    assignee: 'Dave K.',
    assigneeAvatar: 'DK',
    triggeredAt: '2h 10m ago',
    elapsedSeconds: 692,
    status: 'resolved',
    peakP99: '180ms',
    currentP99: '12.4ms',
    baselineP99: '10ms',
    duration: '11m 32s',
    rootCause: 'aurora DB exhaustion',
    resolvedAt: 'Today 12:44 UTC',
    trafficAffected: '3.1% read queries',
    failedRequests10m: '0 errs',
    autoMitigation: 'HPA Aurora Scale',
    runbookOutput: [
      '> [12:35:10] scaling-replica --target=read-cluster-02',
      '> Replicas warmed and in sync'
    ],
    timeline: [
      {
        time: '12:44:10 UTC',
        title: 'Replication Lag Back Under 15ms',
        desc: 'Read replicas catch up with master WAL logs. Queries unblocked.',
        type: 'action'
      }
    ],
    postMortemStatus: 'published',
    acknowledged: true
  },
  {
    id: 'inc-407',
    key: '#INC-407',
    title: 'Billing Webhook ingestion throttling during payroll sync',
    summary: 'Stripe and Adyen webhooks faced 429 rate limit backoff due to sudden concurrency spike.',
    severity: 'P3',
    severityLabel: 'P3 MINOR',
    region: 'global-api',
    service: 'Async Payment Webhook Worker',
    serviceKey: 'webhook',
    assignee: 'Sarah Lin',
    assigneeAvatar: 'SL',
    triggeredAt: '4h 45m ago',
    elapsedSeconds: 495,
    status: 'resolved',
    peakP99: '85ms',
    currentP99: '22ms',
    baselineP99: '18ms',
    duration: '08m 15s',
    rootCause: 'rate-limiter misconfig',
    resolvedAt: 'Today 10:15 UTC',
    trafficAffected: '0.8% batch webhooks',
    failedRequests10m: '0 errs',
    autoMitigation: 'Dynamo Rate Adjust',
    runbookOutput: ['> [10:10:00] token-bucket:expand-limit +500/s'],
    timeline: [
      {
        time: '10:15:00 UTC',
        title: 'Token Bucket Limit Increased',
        desc: 'Ingestion rate raised safely without worker pool crash.',
        type: 'action'
      }
    ],
    postMortemStatus: 'drafted',
    acknowledged: true
  },
  {
    id: 'inc-406',
    key: '#INC-406',
    title: 'S3 Asset bucket TLS renewal edge certificate jitter',
    summary: 'Automated Let’s Encrypt edge cert renewal encountered DNS propagation latency.',
    severity: 'P3',
    severityLabel: 'P3 MINOR',
    region: 'edge-cdn',
    service: 'European Edge CDN',
    serviceKey: 'cdn',
    assignee: 'Alex Chen',
    assigneeAvatar: 'AC',
    triggeredAt: 'Yesterday 22:15',
    elapsedSeconds: 1190,
    status: 'resolved',
    peakP99: '95ms',
    currentP99: '32ms',
    baselineP99: '28ms',
    duration: '19m 50s',
    rootCause: 'DNS propagation',
    resolvedAt: 'Yesterday 22:34 UTC',
    trafficAffected: '1.2% TLS handshakes',
    failedRequests10m: '0 errs',
    autoMitigation: 'Fallback SAN Cert',
    runbookOutput: ['> [22:30:00] certbot:force-renew --sync-all-pops'],
    timeline: [
      {
        time: '22:34:00 UTC',
        title: 'Wildcard SAN Edge Cert Reloaded',
        desc: 'All 32 PoPs synchronised successfully.',
        type: 'action'
      }
    ],
    postMortemStatus: 'published',
    acknowledged: true
  }
];

export const INITIAL_PROBES: EdgeProbeNode[] = [
  {
    id: 'iad',
    name: 'US-East (Virginia)',
    region: 'us-east-1',
    node: 'iad-edge-node-01',
    weight: 100,
    latencyMs: 19,
    lossPercent: 0,
    status: 'optimal',
    notes: 'Anycast Weight 100'
  },
  {
    id: 'pdx',
    name: 'US-West (Oregon)',
    region: 'us-west-2',
    node: 'pdx-edge-node-03',
    weight: 100,
    latencyMs: 34,
    lossPercent: 0,
    status: 'optimal',
    notes: 'Anycast Weight 100'
  },
  {
    id: 'fra',
    name: 'EU-West (Frankfurt)',
    region: 'eu-central-1',
    node: 'fra-edge-node-02',
    weight: 85,
    latencyMs: 142,
    lossPercent: 0.4,
    status: 'elevated',
    notes: 'Subsea reroute / fallback node'
  },
  {
    id: 'sin',
    name: 'AP-South (Singapore)',
    region: 'ap-southeast-1',
    node: 'sin-edge-node-04',
    weight: 90,
    latencyMs: 88,
    lossPercent: 0,
    status: 'optimal',
    notes: 'Direct transit peer AS3356'
  }
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '16:04:12.891',
    level: 'ERROR',
    service: 'edge-cdn',
    pod: 'fra-edge-node-02',
    traceId: 'TRACE-EU-94827',
    message: 'upstream request timeout to origin gateway ingress-gw.prod.mesh: HTTP 504 Gateway Timeout (elapsed: 1420ms)',
    status: 504,
    durationMs: 1420
  },
  {
    id: 'log-2',
    timestamp: '16:04:11.204',
    level: 'WARN',
    service: 'edge-cdn',
    pod: 'fra-edge-node-02',
    traceId: 'TRACE-EU-94828',
    message: 'TCP retry count exceeded threshold (3 retries) on peer transit AS3356; routing through fallback AMS-01',
    status: 499,
    durationMs: 620
  },
  {
    id: 'log-3',
    timestamp: '16:04:09.912',
    level: 'INFO',
    service: 'ingress-gw',
    pod: 'ingress-gw-prod-7f99b',
    traceId: 'TRACE-US-10294',
    message: 'POST /v2/checkout/execute - 200 OK - client_ip=172.56.21.90 - tls=1.3 - auth_sub=usr_88291a - 42ms',
    status: 200,
    durationMs: 42
  },
  {
    id: 'log-4',
    timestamp: '16:04:08.411',
    level: 'INFO',
    service: 'auth-core',
    pod: 'auth-cluster-core-89c',
    traceId: 'TRACE-US-10294',
    message: 'RS256 JWT validated with Redis token session cache hit [key: sess:usr_88291a] in 1.4ms',
    status: 200,
    durationMs: 1
  },
  {
    id: 'log-5',
    timestamp: '16:04:05.110',
    level: 'WARN',
    service: 'checkout-worker',
    pod: 'checkout-worker-pool-c7',
    traceId: 'TRACE-US-10291',
    message: 'HPA autoscaler: target CPU threshold 60% reached (current: 64.2%). Requesting +6 worker pods from EKS scheduler.',
    status: 200,
    durationMs: 12
  },
  {
    id: 'log-6',
    timestamp: '16:04:02.040',
    level: 'INFO',
    service: 'postgres-aurora',
    pod: 'aurora-db-02-rep1',
    traceId: 'TRACE-DB-40192',
    message: 'checkpoint complete: wrote 4210 buffers (8.2MB); WAL log sync lag at 12ms nominal',
    status: 200,
    durationMs: 8
  },
  {
    id: 'log-7',
    timestamp: '16:03:59.882',
    level: 'ERROR',
    service: 'edge-cdn',
    pod: 'fra-edge-node-02',
    traceId: 'TRACE-EU-94825',
    message: 'TLS Handshake Alert: packet reordering detected on ingress eth0 from client 84.112.9.22; reset sent',
    status: 502,
    durationMs: 310
  }
];

export const INITIAL_TRACES: DistributedTrace[] = [
  {
    id: 'trace-1',
    traceId: 'TRACE-EU-94827',
    endpoint: 'GET /api/v2/catalog/inventory?region=eu',
    method: 'GET',
    timestamp: '16:04:12 UTC',
    durationMs: 1420,
    status: 'error',
    statusCode: 504,
    spans: [
      {
        id: 'sp-1',
        service: 'European Edge CDN',
        operation: 'cdn.ingress.route',
        startTimeMs: 0,
        durationMs: 1420,
        status: 'error',
        httpStatus: 504,
        tags: { 'edge.node': 'fra-edge-node-02', 'client.country': 'DE', 'cache.status': 'MISS' }
      },
      {
        id: 'sp-2',
        service: 'API Gateway Global',
        operation: 'envoy.proxy.forward',
        startTimeMs: 15,
        durationMs: 1395,
        status: 'error',
        httpStatus: 504,
        tags: { 'upstream.cluster': 'catalog-service-eu', 'timeout': '1000ms' }
      },
      {
        id: 'sp-3',
        service: 'Auth & Session Vault',
        operation: 'jwt.authenticate',
        startTimeMs: 18,
        durationMs: 4,
        status: 'ok',
        httpStatus: 200,
        tags: { 'auth.type': 'RS256', 'cache.hit': 'true' }
      },
      {
        id: 'sp-4',
        service: 'Primary DB Shards (Cockroach)',
        operation: 'sql.query.catalog_items',
        startTimeMs: 25,
        durationMs: 1380,
        status: 'error',
        httpStatus: 504,
        tags: { 'db.statement': 'SELECT * FROM inventory WHERE region = ?', 'pool.state': 'SATURATED_92%' }
      }
    ]
  },
  {
    id: 'trace-2',
    traceId: 'TRACE-US-10294',
    endpoint: 'POST /v2/checkout/execute',
    method: 'POST',
    timestamp: '16:04:09 UTC',
    durationMs: 42,
    status: 'ok',
    statusCode: 200,
    spans: [
      {
        id: 'sp-21',
        service: 'API Gateway Global',
        operation: 'envoy.ingress',
        startTimeMs: 0,
        durationMs: 42,
        status: 'ok',
        httpStatus: 200,
        tags: { 'http.status': '200', 'tls.version': '1.3' }
      },
      {
        id: 'sp-22',
        service: 'Auth & Session Vault',
        operation: 'jwt.verify',
        startTimeMs: 3,
        durationMs: 2,
        status: 'ok',
        httpStatus: 200,
        tags: { 'token.sub': 'usr_88291a' }
      },
      {
        id: 'sp-23',
        service: 'Async Payment Webhook',
        operation: 'worker.enqueue',
        startTimeMs: 6,
        durationMs: 12,
        status: 'ok',
        httpStatus: 200,
        tags: { 'queue.depth': '14', 'idempotency.key': 'idemp_99182a' }
      },
      {
        id: 'sp-24',
        service: 'Primary Postgres Aurora',
        operation: 'db.commit_tx',
        startTimeMs: 19,
        durationMs: 21,
        status: 'ok',
        httpStatus: 200,
        tags: { 'tx.isolation': 'READ_COMMITTED', 'rows_affected': '1' }
      }
    ]
  }
];
