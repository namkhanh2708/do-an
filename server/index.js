import 'dotenv/config';

import { promises as dns } from 'node:dns';
import { isIP } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cron from 'node-cron';
import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { diagnoseCheck } from './diagnosis.js';
import { analyzeIncidentWithAI, isAiDiagnosisEnabled } from './ai-diagnosis.js';
import { createAuthRouter } from './auth.js';
import { canViewMonitor, isAdmin, visibleMonitors } from './authorization.js';
import { getAcceptedRecipients, getPendingRecipients } from './email-delivery.js';
import { assertMonitorRedirectAllowed, isAllowedLocalIPv4, isLocalMonitorUrl } from './monitor-url-policy.js';
import { isMonitorAlertEnabled } from './notification-policy.js';
import { buildSmtpTransportOptions } from './smtp-config.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const memory = { monitors: [], checks: [], incidents: [] };
let storageMode = 'memory';
let mailer;
const activeChecks = new Map();
const deletingMonitors = new Set();
const aiDiagnosisAttemptedMonitors = new Set();
// Dem so lan SLOW lien tiep theo tung monitor (reset ve 0 khi site UP hoac DOWN)
const slowConsecutiveCounts = new Map();

const monitorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  url: { type: String, required: true, trim: true, maxlength: 2048 },
  enabled: { type: Boolean, default: true },
  intervalSeconds: { type: Number, default: 60 },
  slowThresholdMs: { type: Number, default: 1000 },
  ownerId: { type: String, default: '' },
  status: { type: String, enum: ['UP', 'DOWN', 'SLOW', 'UNKNOWN'], default: 'UNKNOWN' },
  lastCheckedAt: { type: Date, default: null },
  lastResponseTimeMs: { type: Number, default: null },
  lastHttpStatus: { type: Number, default: null },
  lastError: { type: String, default: '' },
}, { timestamps: true });

const checkSchema = new mongoose.Schema({
  monitorId: { type: String, required: true, index: true },
  status: { type: String, enum: ['UP', 'DOWN', 'SLOW'], required: true },
  responseTimeMs: { type: Number, default: null },
  httpStatus: { type: Number, default: null },
  error: { type: String, default: '' },
  diagnosis: { type: mongoose.Schema.Types.Mixed, default: null },
  checkedAt: { type: Date, default: Date.now, index: true },
});

const incidentSchema = new mongoose.Schema({
  monitorId: { type: String, required: true, index: true },
  monitorName: { type: String, required: true },
  monitorUrl: { type: String, required: true },
  startedAt: { type: Date, default: Date.now, index: true },
  resolvedAt: { type: Date, default: null },
  status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
  durationMs: { type: Number, default: null },
  diagnosis: { type: mongoose.Schema.Types.Mixed, default: null },
});

const Monitor = mongoose.model('Monitor', monitorSchema);
const Check = mongoose.model('Check', checkSchema);
const Incident = mongoose.model('Incident', incidentSchema);

async function releaseUserMonitors(userId) {
  if (storageMode === 'mongodb') {
    await Monitor.updateMany({ ownerId: userId }, { $set: { ownerId: '' } });
    return;
  }
  for (const monitor of memory.monitors) {
    if (monitor.ownerId === userId) monitor.ownerId = '';
  }
}

const serialize = (value) => {
  const record = value?.toObject ? value.toObject() : value;
  return record ? { ...record, id: String(record._id ?? record.id), _id: undefined, __v: undefined } : null;
};

function isPrivateAddress(address) {
  const normalized = address.toLowerCase();
  if (isIP(normalized) === 4) {
    const octets = normalized.split('.').map(Number);
    const [a, b] = octets;
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168)) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && octets[2] === 100) ||
      (a === 203 && b === 0 && octets[2] === 113);
  }
  return normalized === '::' || normalized === '::1' ||
    normalized.startsWith('fc') || normalized.startsWith('fd') ||
    normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
    normalized.startsWith('fea') || normalized.startsWith('feb') ||
    normalized.startsWith('ff') || normalized.startsWith('::ffff:');
}

async function validateMonitorUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('URL không hợp lệ.');
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Chỉ chấp nhận URL HTTP/HTTPS công khai, không chứa thông tin đăng nhập.');
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!hostname) {
    throw new Error('URL không có tên máy chủ hợp lệ.');
  }

  if (hostname === 'localhost' || (isIP(hostname) === 4 && isAllowedLocalIPv4(hostname))) {
    return url;
  }
  if (hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new Error('Địa chỉ local chỉ hỗ trợ localhost hoặc IP IPv4 riêng trực tiếp.');
  }

  const addresses = isIP(hostname) ? [{ address: hostname }] : await dns.lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Tên miền phải phân giải đến địa chỉ IP công khai.');
  }
  return url;
}

async function listMonitors() {
  return storageMode === 'mongodb'
    ? (await Monitor.find().sort({ createdAt: -1 })).map(serialize)
    : [...memory.monitors].sort((a, b) => b.createdAt - a.createdAt);
}

async function getMonitor(id) {
  if (storageMode === 'mongodb') {
    if (!mongoose.isValidObjectId(id)) return null;
    return serialize(await Monitor.findById(id));
  }
  return memory.monitors.find((monitor) => monitor.id === id) ?? null;
}

async function createMonitor(data) {
  if (storageMode === 'mongodb') return serialize(await Monitor.create(data));
  const now = new Date();
  const monitor = {
    ...data,
    id: crypto.randomUUID(),
    status: 'UNKNOWN',
    lastCheckedAt: null,
    lastResponseTimeMs: null,
    lastHttpStatus: null,
    lastError: '',
    createdAt: now,
    updatedAt: now,
  };
  memory.monitors.push(monitor);
  return monitor;
}

async function updateMonitor(id, changes) {
  if (storageMode === 'mongodb') {
    if (!mongoose.isValidObjectId(id)) return null;
    return serialize(await Monitor.findByIdAndUpdate(id, changes, { new: true, runValidators: true }));
  }
  const monitor = memory.monitors.find((item) => item.id === id);
  if (!monitor) return null;
  Object.assign(monitor, changes, { updatedAt: new Date() });
  return monitor;
}

async function renameIncidentMonitor(monitorId, name) {
  if (storageMode === 'mongodb') {
    await Incident.updateMany({ monitorId }, { $set: { monitorName: name } });
    return;
  }
  for (const incident of memory.incidents) {
    if (incident.monitorId === monitorId) incident.monitorName = name;
  }
}

async function deleteMonitor(id) {
  if (deletingMonitors.has(id)) return false;
  deletingMonitors.add(id);
  try {
    const pendingCheck = activeChecks.get(id);
    if (pendingCheck) await pendingCheck;
    if (storageMode === 'mongodb') {
      if (!mongoose.isValidObjectId(id)) return false;
      const deleted = await Monitor.findByIdAndDelete(id);
      if (!deleted) return false;
      await Promise.all([Check.deleteMany({ monitorId: id }), Incident.deleteMany({ monitorId: id })]);
      return true;
    }
    const existing = memory.monitors.length;
    memory.monitors = memory.monitors.filter((item) => item.id !== id);
    memory.checks = memory.checks.filter((item) => item.monitorId !== id);
    memory.incidents = memory.incidents.filter((item) => item.monitorId !== id);
    return memory.monitors.length !== existing;
  } finally {
    deletingMonitors.delete(id);
    aiDiagnosisAttemptedMonitors.delete(id);
  }
}

async function saveCheck(data) {
  if (storageMode === 'mongodb') return serialize(await Check.create(data));
  const check = { ...data, id: crypto.randomUUID() };
  memory.checks.push(check);
  return check;
}

async function updateCheckDiagnosis(check, diagnosis) {
  if (storageMode === 'mongodb') {
    await Check.findByIdAndUpdate(check.id, { diagnosis });
    return;
  }
  const savedCheck = memory.checks.find((item) => item.id === check.id);
  if (!savedCheck) throw new Error('Không tìm thấy lượt kiểm tra cần cập nhật chẩn đoán.');
  savedCheck.diagnosis = diagnosis;
}

async function checksFor({ monitorId, monitorIds, since, limit = 1000 } = {}) {
  if (storageMode === 'mongodb') {
    const filter = {};
    if (monitorId) filter.monitorId = monitorId;
    else if (monitorIds) filter.monitorId = { $in: monitorIds };
    if (since) filter.checkedAt = { $gte: since };
    const query = Check.find(filter).sort({ checkedAt: -1 });
    if (limit) query.limit(limit);
    return (await query).map(serialize);
  }
  const results = memory.checks
    .filter((item) => (!monitorId || item.monitorId === monitorId) &&
      (!monitorIds || monitorIds.includes(item.monitorId)) && (!since || item.checkedAt >= since))
    .sort((a, b) => b.checkedAt - a.checkedAt);
  return limit ? results.slice(0, limit) : results;
}

async function openIncidentFor(monitorId) {
  if (storageMode === 'mongodb') return serialize(await Incident.findOne({ monitorId, status: 'OPEN' }));
  return memory.incidents.find((item) => item.monitorId === monitorId && item.status === 'OPEN') ?? null;
}

async function startIncident(monitor, diagnosis) {
  const incident = {
    monitorId: monitor.id,
    monitorName: monitor.name,
    monitorUrl: monitor.url,
    startedAt: new Date(),
    resolvedAt: null,
    status: 'OPEN',
    durationMs: null,
    diagnosis,
  };
  if (storageMode === 'mongodb') return serialize(await Incident.create(incident));
  const stored = { ...incident, id: crypto.randomUUID() };
  memory.incidents.push(stored);
  return stored;
}

async function updateIncidentDiagnosis(incident, diagnosis) {
  if (storageMode === 'mongodb') {
    await Incident.findByIdAndUpdate(incident.id, { diagnosis });
    return;
  }
  incident.diagnosis = diagnosis;
}

async function resolveIncident(incident) {
  const resolvedAt = new Date();
  const changes = {
    status: 'RESOLVED',
    resolvedAt,
    durationMs: resolvedAt.getTime() - new Date(incident.startedAt).getTime(),
  };
  if (storageMode === 'mongodb') {
    await Incident.findByIdAndUpdate(incident.id, changes);
    aiDiagnosisAttemptedMonitors.delete(incident.monitorId);
    return;
  }
  Object.assign(incident, changes);
  aiDiagnosisAttemptedMonitors.delete(incident.monitorId);
}

async function resolveOpenIncidentsFor(monitorId) {
  const openIncidents = storageMode === 'mongodb'
    ? (await Incident.find({ monitorId, status: 'OPEN' })).map(serialize)
    : memory.incidents.filter((incident) => incident.monitorId === monitorId && incident.status === 'OPEN');
  await Promise.all(openIncidents.map(resolveIncident));
  return openIncidents.length > 0;
}

async function incidentsFor({ monitorId, monitorIds, since, limit = 1000 } = {}) {
  if (storageMode === 'mongodb') {
    const filter = {};
    if (monitorId) filter.monitorId = monitorId;
    else if (monitorIds) filter.monitorId = { $in: monitorIds };
    if (since) filter.$or = [{ startedAt: { $gte: since } }, { resolvedAt: { $gte: since } }, { status: 'OPEN' }];
    return (await Incident.find(filter).sort({ startedAt: -1 }).limit(limit)).map(serialize);
  }
  return memory.incidents
    .filter((item) => (!monitorId || item.monitorId === monitorId) &&
      (!monitorIds || monitorIds.includes(item.monitorId)) &&
      (!since || item.startedAt >= since || item.resolvedAt >= since || item.status === 'OPEN'))
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, limit);
}

function validateMonitorInput(body, current = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : current.name;
  const url = typeof body.url === 'string' ? body.url.trim() : current.url;
  const ownerId = typeof body.ownerId === 'string' ? body.ownerId.trim() : current.ownerId ?? '';
  const intervalSeconds = body.intervalSeconds ?? current.intervalSeconds ?? 60;
  const slowThresholdMs = body.slowThresholdMs ?? current.slowThresholdMs ?? 1000;
  const enabled = body.enabled ?? current.enabled ?? true;

  if (!name || name.length > 80) throw Object.assign(new Error('Tên website bắt buộc và tối đa 80 ký tự.'), { status: 400 });
  if (!url || url.length > 2048) throw Object.assign(new Error('URL website bắt buộc và tối đa 2048 ký tự.'), { status: 400 });
  if (![60, 300, 900].includes(Number(intervalSeconds))) throw Object.assign(new Error('Chu kỳ kiểm tra phải là 1, 5 hoặc 15 phút.'), { status: 400 });
  if (!Number.isInteger(Number(slowThresholdMs)) || Number(slowThresholdMs) < 100 || Number(slowThresholdMs) > 30000) {
    throw Object.assign(new Error('Ngưỡng SLOW phải từ 100 đến 30000 ms.'), { status: 400 });
  }
  if (typeof enabled !== 'boolean') throw Object.assign(new Error('Trạng thái giám sát không hợp lệ.'), { status: 400 });
  if (ownerId && !mongoose.isValidObjectId(ownerId)) {
    throw Object.assign(new Error('Tài khoản được gán không hợp lệ.'), { status: 400 });
  }
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw Object.assign(new Error('URL không hợp lệ.'), { status: 400 });
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
    throw Object.assign(new Error('Chỉ chấp nhận URL HTTP/HTTPS, không chứa thông tin đăng nhập.'), { status: 400 });
  }
  return {
    name,
    url: parsedUrl.toString(),
    intervalSeconds: Number(intervalSeconds),
    slowThresholdMs: Number(slowThresholdMs),
    ownerId,
    enabled,
  };
}

/**
 * Gửi email cảnh báo.
 * type: 'down'       - Website xuống lần này (gửi mỗi lần DOWN)
 *       'slow'       - SLOW liên tiếp đủ ngưỡng (count = số lần đầy)
 *       'recovered'  - Đã khôi phục từ DOWN
 */
async function sendAlertEmail(monitor, type, checkedAt, {
  diagnosis = null,
  responseTimeMs = null,
  slowCount = 0,
  recipientsOverride = null,
} = {}) {
  let subject, headerLines;
  if (type === 'down') {
    subject = `[Sự cố] ${monitor.name} đang DOWN`;
    headerLines = [
      `Website: ${monitor.name}`,
      `URL: ${monitor.url}`,
      `Trạng thái: DOWN`,
      `Thời điểm: ${new Date(checkedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
    ];
  } else if (type === 'slow') {
    subject = `[Cảnh báo chậm] ${monitor.name} phản hồi chậm ${slowCount} lần liên tiếp`;
    headerLines = [
      `Website: ${monitor.name}`,
      `URL: ${monitor.url}`,
      `Trạng thái: SLOW (chậm) - ${slowCount} lần liên tiếp`,
      `Thời điểm: ${new Date(checkedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
      ...(responseTimeMs !== null ? [`Thời gian phản hồi: ${responseTimeMs} ms (ngưỡng: ${monitor.slowThresholdMs} ms)`] : []),
    ];
  } else {
    subject = `[Đã khôi phục] ${monitor.name} đang hoạt động`;
    headerLines = [
      `Website: ${monitor.name}`,
      `URL: ${monitor.url}`,
      `Trạng thái: ĐÃ KHÔI PHỤC`,
      `Thời điểm: ${new Date(checkedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
    ];
  }

  const diagLines = diagnosis ? [
    '',
    'Dấu hiệu đã ghi nhận:',
    ...diagnosis.evidence.map((item) => `- ${item}`),
    '',
    'Nguyên nhân có thể :',
    ...diagnosis.possibleCauses.map((item) => `- ${item}`),
    '',
    'Hướng kiểm tra/khắc phục:',
    ...diagnosis.recommendedActions.map((item, index) => `${index + 1}. ${item}`),
    '',
    diagnosis.confidenceNote,
  ] : [];

  const text = [...headerLines, ...diagLines].join('\n');
  try {
    const currentMonitor = await getMonitor(monitor.id);
    if (!isMonitorAlertEnabled(currentMonitor)) {
      console.info(`[alert] Bỏ qua email (${type}) cho website đang tạm dừng "${monitor.name}".`);
      return [];
    }
    const recipients = getPendingRecipients(recipientsOverride ?? await auth.notificationRecipients(monitor.ownerId));
    if (!recipients.length) {
      if (!recipientsOverride) {
        console.warn(`[alert] Chưa có email cấu hình cho Admin hoặc User được gán website "${monitor.name}".`);
      }
      return [];
    }
    if (!mailer) {
      console.warn(`[alert] Chưa cấu hình SMTP; không gửi được email cho "${monitor.name}".`);
      return [];
    }
    const result = await mailer.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: recipients, subject, text });
    const acceptedRecipients = getAcceptedRecipients(result, recipients);
    if (acceptedRecipients.length) {
      console.info(`[alert] SMTP chấp nhận email (${type}) cho "${monitor.name}" (${acceptedRecipients.length}/${recipients.length} người nhận).`);
    }
    if (acceptedRecipients.length !== recipients.length) {
      console.warn(`[alert] SMTP chỉ chấp nhận ${acceptedRecipients.length}/${recipients.length} email (${type}) cho "${monitor.name}".`);
    }
    return acceptedRecipients;
  } catch (error) {
    console.error(`[alert] Gửi email cho "${monitor.name}" thất bại.`, {
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
    });
    return [];
  }
}

async function performCheck(id) {
  if (deletingMonitors.has(id)) throw Object.assign(new Error('Không tìm thấy website.'), { status: 404 });
  if (activeChecks.has(id)) return activeChecks.get(id);
  const operation = (async () => {
    const monitor = await getMonitor(id);
    if (!monitor) throw Object.assign(new Error('Không tìm thấy website.'), { status: 404 });

    const startedAt = Date.now();
    let httpStatus = null;
    let errorMessage = '';
    let responseTimeMs = null;
    let status = 'DOWN';
    try {
      let target = await validateMonitorUrl(monitor.url);
      const initialTarget = target;
      let response;
      for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
        response = await fetch(target, {
          method: 'GET',
          redirect: 'manual',
          signal: AbortSignal.timeout(10000),
          headers: { 'user-agent': 'WebsiteReliabilityDashboard/1.0', range: 'bytes=0-0' },
        });
        if (response.status < 300 || response.status >= 400 || !response.headers.get('location')) break;
        if (redirectCount === 5) throw new Error('Website chuyển hướng quá 5 lần.');
        const nextTarget = await validateMonitorUrl(new URL(response.headers.get('location'), target).toString());
        assertMonitorRedirectAllowed(initialTarget, nextTarget);
        await response.body?.cancel();
        target = nextTarget;
      }
      responseTimeMs = Date.now() - startedAt;
      httpStatus = response.status;
      status = httpStatus >= 400 ? 'DOWN' : responseTimeMs > monitor.slowThresholdMs ? 'SLOW' : 'UP';
      await response.body?.cancel();
    } catch (error) {
      responseTimeMs = Date.now() - startedAt;
      errorMessage = error.name === 'TimeoutError' || error.name === 'AbortError'
        ? 'Hết thời gian chờ (10 giây).'
        : error.message || 'Không thể kết nối website.';
      status = 'DOWN';
    }

    const checkedAt = new Date();
    const previousStatus = monitor.status;
    const updated = await updateMonitor(id, {
      status,
      lastCheckedAt: checkedAt,
      lastResponseTimeMs: responseTimeMs,
      lastHttpStatus: httpStatus,
      lastError: errorMessage,
    });
    const recentChecks = await checksFor({ monitorId: id, limit: 4 });
    const checkData = { monitorId: id, status, responseTimeMs, httpStatus, error: errorMessage, checkedAt };
    let diagnosis = diagnoseCheck(checkData, [checkData, ...recentChecks], monitor.slowThresholdMs);
    const check = await saveCheck({ ...checkData, diagnosis });

    // --- Xữ lý cảnh báo & quản lý sự cố ---
    if (status === 'DOWN') {
      // Reset bộ đếm SLOW khi DOWN
      slowConsecutiveCounts.set(id, 0);
      // Mỗi lượt kiểm tra DOWN được lưu thành một sự cố riêng, kể cả khi đã có sự cố đang mở.
      const incident = await startIncident(updated, diagnosis);
      await sendAlertEmail(updated, 'down', checkedAt, { diagnosis });

      if (!aiDiagnosisAttemptedMonitors.has(id)) {
        aiDiagnosisAttemptedMonitors.add(id);
        const aiDiagnosis = await analyzeIncidentWithAI({
          monitor: updated,
          check: checkData,
          recentChecks: [checkData, ...recentChecks],
        });
        if (aiDiagnosis) {
          diagnosis = { ...diagnosis, ...aiDiagnosis, evidence: diagnosis.evidence };
          await updateIncidentDiagnosis(incident, diagnosis);
          await updateCheckDiagnosis(check, diagnosis);
        }
      }
    } else if (status === 'SLOW') {
      // Đếm số lần SLOW liên tiếp
      const prev = slowConsecutiveCounts.get(id) ?? 0;
      const next = prev + 1;
      slowConsecutiveCounts.set(id, next);
      if (next >= 3 && next % 3 === 0) {
        // Phân tích AI và gửi cảnh báo sau mỗi 3 lượt SLOW liên tiếp.
        const aiDiagnosis = await analyzeIncidentWithAI({
          monitor: updated,
          check: checkData,
          recentChecks: [checkData, ...recentChecks],
        });
        if (aiDiagnosis) {
          diagnosis = { ...diagnosis, ...aiDiagnosis, evidence: diagnosis.evidence };
          await updateCheckDiagnosis(check, diagnosis);
        }
        await sendAlertEmail(updated, 'slow', checkedAt, { diagnosis, responseTimeMs, slowCount: next });
      }
      // Nếu trước đó đang DOWN, đóng sự cố và gửi email khôi phục
      if (previousStatus === 'DOWN') {
        await resolveOpenIncidentsFor(id);
        await sendAlertEmail(updated, 'recovered', checkedAt);
      }
    } else {
      // UP: reset bộ đếm SLOW
      slowConsecutiveCounts.set(id, 0);
      // Nếu trước đó đang DOWN, đóng sự cố và gửi email khôi phục
      if (previousStatus === 'DOWN') {
        await resolveOpenIncidentsFor(id);
        await sendAlertEmail(updated, 'recovered', checkedAt);
      }
    }
    return { monitor: updated, check };
  })();
  activeChecks.set(id, operation);
  try {
    return await operation;
  } finally {
    activeChecks.delete(id);
  }
}

async function retryOpenIncidentAlerts() {
  const openIncidents = storageMode === 'mongodb'
    ? (await Incident.find({ status: 'OPEN' }).select('monitorId')).map((incident) => incident.monitorId)
    : memory.incidents.filter((incident) => incident.status === 'OPEN').map((incident) => incident.monitorId);
  const monitorIds = [...new Set(openIncidents)];
  const activeMonitors = (await Promise.all(monitorIds.map(getMonitor)))
    .filter(isMonitorAlertEnabled);
  await Promise.allSettled(activeMonitors.map(async (monitor) => {
    try {
      await performCheck(monitor.id);
    } catch (error) {
      console.error(`[alert] Không thể thử lại cảnh báo sự cố đang mở cho website ${monitor.id}:`, error);
    }
  }));
}

function rangeStart(value) {
  const days = value === '30d' ? 30 : value === '7d' ? 7 : 1;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
const auth = createAuthRouter({
  isMongoConnected: () => storageMode === 'mongodb',
  onUserDeleted: releaseUserMonitors,
});
app.use('/api/auth', auth.router);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    storage: storageMode,
    email: Boolean(mailer),
    ai: isAiDiagnosisEnabled(),
  });
});

app.use('/api', auth.authenticate);

app.get('/api/monitors', async (req, res, next) => {
  try {
    const monitors = await listMonitors();
    res.json(visibleMonitors(req.user, monitors));
  } catch (error) {
    next(error);
  }
});

app.post('/api/monitors', auth.requireAdmin, async (req, res, next) => {
  try {
    const data = validateMonitorInput(req.body);
    if (data.ownerId && !await auth.isAssignableOwner(data.ownerId)) {
      return res.status(400).json({ error: 'Chỉ có thể gán website cho tài khoản User đang hoạt động.' });
    }
    await validateMonitorUrl(data.url);
    const monitor = await createMonitor(data);
    res.status(201).json(monitor);
    void performCheck(monitor.id).catch((error) => console.error('[monitor] Kiểm tra lần đầu thất bại:', error));
  } catch (error) {
    if (error.message?.includes('URL') || error.message?.includes('địa chỉ') || error.message?.includes('Tên miền')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

app.patch('/api/monitors/:id', auth.requireAdmin, async (req, res, next) => {
  try {
    const current = await getMonitor(req.params.id);
    if (!current) return res.status(404).json({ error: 'Không tìm thấy website.' });
    const changes = validateMonitorInput(req.body, current);
    if (changes.ownerId && !await auth.isAssignableOwner(changes.ownerId)) {
      return res.status(400).json({ error: 'Chỉ có thể gán website cho tài khoản User đang hoạt động.' });
    }
    if (changes.url !== current.url) await validateMonitorUrl(changes.url);
    const monitor = await updateMonitor(req.params.id, changes);
    if (changes.name !== current.name) await renameIncidentMonitor(monitor.id, changes.name);
    res.json(monitor);
    if (changes.ownerId && changes.ownerId !== current.ownerId && current.status === 'DOWN') {
      void (async () => {
        const incident = await openIncidentFor(monitor.id);
        if (!incident) return;
        const recipients = await auth.notificationRecipients(changes.ownerId, {
          includeAdmins: false,
          includeDefault: false,
        });
        if (recipients.length) {
          await sendAlertEmail(monitor, 'down', current.lastCheckedAt ?? new Date(), {
            diagnosis: incident.diagnosis,
            recipientsOverride: recipients,
          });
        }
      })().catch((error) => console.error(`[alert] Không thể gửi thông báo cho User mới được gán vào "${monitor.name}":`, error));
    }
    if (monitor.enabled && (!current.enabled || changes.url !== current.url)) {
      void performCheck(monitor.id).catch((error) => console.error('[monitor] Kiểm tra website thất bại:', error));
    }
  } catch (error) {
    if (error.message?.includes('URL') || error.message?.includes('địa chỉ') || error.message?.includes('Tên miền')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

app.delete('/api/monitors/:id', auth.requireAdmin, async (req, res, next) => {
  try {
    if (!await deleteMonitor(req.params.id)) return res.status(404).json({ error: 'Không tìm thấy website.' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post('/api/monitors/:id/check', auth.requireAdmin, async (req, res, next) => {
  try {
    res.json(await performCheck(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.get('/api/monitors/:id/checks', async (req, res, next) => {
  try {
    const monitor = await getMonitor(req.params.id);
    if (!canViewMonitor(req.user, monitor)) {
      return res.status(404).json({ error: 'Không tìm thấy website.' });
    }
    res.json(await checksFor({ monitorId: req.params.id, since: rangeStart(req.query.range), limit: 1000 }));
  } catch (error) {
    next(error);
  }
});

app.get('/api/incidents', async (req, res, next) => {
  try {
    const monitorId = req.query.monitorId || undefined;
    if (monitorId && !isAdmin(req.user)) {
      const monitor = await getMonitor(monitorId);
      if (!canViewMonitor(req.user, monitor)) {
        return res.status(404).json({ error: 'Không tìm thấy website.' });
      }
    }
    const monitorIds = isAdmin(req.user)
      ? undefined
      : (await listMonitors()).filter((monitor) => monitor.ownerId === req.user.id).map((monitor) => monitor.id);
    res.json(await incidentsFor({ monitorId, monitorIds, since: rangeStart(req.query.range) }));
  } catch (error) {
    next(error);
  }
});

app.get('/api/reports', async (req, res, next) => {
  try {
    const since = rangeStart(req.query.range);
    const monitorId = req.query.monitorId || undefined;
    const userMonitors = visibleMonitors(req.user, await listMonitors());
    if (monitorId && !userMonitors.some((monitor) => monitor.id === monitorId)) {
      return res.status(404).json({ error: 'Không tìm thấy website.' });
    }
    const monitorIds = isAdmin(req.user) ? undefined : userMonitors.map((monitor) => monitor.id);
    const [monitors, checks, incidents] = await Promise.all([
      Promise.resolve(userMonitors),
      checksFor({ monitorId, monitorIds, since, limit: null }),
      incidentsFor({ monitorId, monitorIds, since, limit: 1000 }),
    ]);
    const selectedMonitors = monitors.filter((monitor) => !monitorId || monitor.id === monitorId);
    const buckets = new Map();
    const bucketSize = req.query.range === '30d' || req.query.range === '7d' ? 60 * 60 * 1000 : 15 * 60 * 1000;
    for (const check of [...checks].reverse()) {
      const date = new Date(check.checkedAt);
      const key = new Date(Math.floor(date.getTime() / bucketSize) * bucketSize).toISOString();
      const bucket = buckets.get(key) ?? { timestamp: key, total: 0, responseTotal: 0, responseCount: 0 };
      bucket.total += 1;
      if (check.responseTimeMs !== null && check.responseTimeMs !== undefined && check.status !== 'DOWN') {
        bucket.responseTotal += check.responseTimeMs;
        bucket.responseCount += 1;
      }
      buckets.set(key, bucket);
    }
    const responseTimes = checks
      .filter((check) => check.status !== 'DOWN' && check.responseTimeMs !== null)
      .map((check) => check.responseTimeMs);
    const total = checks.length;
    const up = checks.filter((check) => check.status !== 'DOWN').length;

    res.json({
      summary: {
        totalMonitors: selectedMonitors.filter((monitor) => monitor.enabled).length,
        up: selectedMonitors.filter((monitor) => monitor.enabled && monitor.status === 'UP').length,
        slow: selectedMonitors.filter((monitor) => monitor.enabled && monitor.status === 'SLOW').length,
        down: selectedMonitors.filter((monitor) => monitor.enabled && monitor.status === 'DOWN').length,
        uptimePercent: total ? (up / total) * 100 : null,
        averageResponseTimeMs: responseTimes.length
          ? responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length
          : null,
        totalChecks: total,
        incidentCount: incidents.length,
        meanRecoveryTimeMs: (() => {
          const recovered = incidents.filter((incident) => incident.durationMs !== null);
          return recovered.length
            ? recovered.reduce((sum, incident) => sum + incident.durationMs, 0) / recovered.length
            : null;
        })(),
      },
      series: [...buckets.values()].map((bucket) => ({
        timestamp: bucket.timestamp,
        averageResponseTimeMs: bucket.responseCount ? bucket.responseTotal / bucket.responseCount : null,
      })),
      monitors: await Promise.all(selectedMonitors.map(async (monitor) => {
        const monitorChecks = checks.filter((check) => check.monitorId === monitor.id);
        const available = monitorChecks.filter((check) => check.status !== 'DOWN');
        const latencies = available.filter((check) => check.responseTimeMs !== null).map((check) => check.responseTimeMs);
        const monitorIncidents = incidents.filter((incident) => incident.monitorId === monitor.id);
        return {
          ...monitor,
          uptimePercent: monitorChecks.length ? (available.length / monitorChecks.length) * 100 : null,
          averageResponseTimeMs: latencies.length
            ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length
            : null,
          checks: monitorChecks.length,
          incidents: monitorIncidents.length,
        };
      })),
    });
  } catch (error) {
    next(error);
  }
});

const distDir = path.join(rootDir, 'dist');
app.use(express.static(distDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distDir, 'index.html'), (error) => {
    if (error) next(error);
  });
});

app.use((error, _req, res, _next) => {
  console.error('[api] Lỗi xử lý yêu cầu:', error);
  if (res.headersSent) return;
  res.status(error.status || (error.name === 'ValidationError' ? 400 : 500)).json({
    error: error.status && error.status < 500 ? error.message : 'Có lỗi máy chủ. Kiểm tra nhật ký backend để biết chi tiết.',
  });
});

async function runScheduledChecks() {
  const due = (await listMonitors()).filter((monitor) =>
    monitor.enabled &&
    (!monitor.lastCheckedAt || Date.now() - new Date(monitor.lastCheckedAt).getTime() >= monitor.intervalSeconds * 1000));
  await Promise.allSettled(due.map((monitor) =>
    performCheck(monitor.id).catch((error) => console.error(`[monitor] Kiểm tra "${monitor.name}" thất bại:`, error))));
}

async function start() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      storageMode = 'mongodb';
      console.info('[storage] Đã kết nối MongoDB.');
    } catch (error) {
      console.error('[storage] Không thể kết nối MongoDB; đang chạy chế độ RAM, dữ liệu sẽ mất khi khởi động lại:', error.message);
    }
  } else {
    console.warn('[storage] Chưa cấu hình MONGODB_URI; đang chạy chế độ RAM, dữ liệu sẽ mất khi khởi động lại.');
  }

  if (storageMode === 'mongodb') await auth.bootstrapAdmin();

  if (process.env.SMTP_HOST) {
    mailer = nodemailer.createTransport(buildSmtpTransportOptions(process.env));
  } else {
    console.warn('[alert] Chưa cấu hình SMTP_HOST; email cảnh báo đang tắt.');
  }

  app.listen(port, '0.0.0.0', () => console.info(`[server] API sẵn sàng tại http://localhost:${port}`));
  void retryOpenIncidentAlerts().catch((error) => console.error('[alert] Không thể thử lại các cảnh báo đang mở:', error));
  cron.schedule('* * * * *', () => {
    void runScheduledChecks().catch((error) => console.error('[monitor] Lịch kiểm tra thất bại:', error));
  });
  void runScheduledChecks().catch((error) => console.error('[monitor] Kiểm tra khởi động thất bại:', error));
}

start().catch(async (error) => {
  console.error('[server] Không thể khởi động máy chủ:', error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
