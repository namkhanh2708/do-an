import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeIncidentWithAI, isAiDiagnosisEnabled, translateDiagnosisToEnglish } from './ai-diagnosis.js';

test('AI is disabled when no Groq API key is configured', () => {
  const originalKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    assert.equal(isAiDiagnosisEnabled(), false);
  } finally {
    if (originalKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalKey;
  }
});

test('AI diagnosis parses structured output and sends only the hostname', async () => {
  const originalKey = process.env.GROQ_API_KEY;
  const originalModel = process.env.GROQ_MODEL;
  const originalFetch = globalThis.fetch;
  let requestBody;
  process.env.GROQ_API_KEY = 'test-key';
  process.env.GROQ_MODEL = 'test-model';
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify({
      output: [{
        content: [{
          type: 'output_text',
          text: JSON.stringify({
            possibleCauses: ['  Reverse proxy không phản hồi  '],
            recommendedActions: [' Kiểm tra log reverse proxy '],
            confidenceNote: 'Cần kiểm tra log để xác nhận.',
          }),
        }],
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const diagnosis = await analyzeIncidentWithAI({
      monitor: { name: 'Example site', url: 'https://example.com/status?token=private' },
      check: { status: 'DOWN', httpStatus: 502, responseTimeMs: 200, error: '', checkedAt: new Date() },
      recentChecks: [],
    });

    assert.deepEqual(diagnosis, {
      possibleCauses: ['Reverse proxy không phản hồi'],
      recommendedActions: ['Kiểm tra log reverse proxy'],
      confidenceNote: 'Cần kiểm tra log để xác nhận.',
      source: 'ai',
    });
    assert.equal(requestBody.model, 'test-model');
    const systemPrompt = requestBody.input[0].content;
    assert.match(systemPrompt, /toàn bộ nội dung.*bằng tiếng Việt/);
    assert.match(systemPrompt, /possibleCauses.*recommendedActions.*confidenceNote/);
    const prompt = requestBody.input[1].content;
    assert.match(prompt, /example\.com/);
    assert.doesNotMatch(prompt, /private|token=/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GROQ_MODEL;
    else process.env.GROQ_MODEL = originalModel;
  }
});

test('AI diagnosis retries Groq JSON generation failures before giving up', async () => {
  const originalKey = process.env.GROQ_API_KEY;
  const originalFetch = globalThis.fetch;
  let attempts = 0;
  process.env.GROQ_API_KEY = 'test-key';
  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts < 3) {
      return new Response(JSON.stringify({
        error: { message: 'Failed to generate JSON. Please adjust your prompt.' },
      }), { status: 400, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      output: [{
        content: [{
          type: 'output_text',
          text: JSON.stringify({
            possibleCauses: ['Có thể backend chưa phản hồi.'],
            recommendedActions: ['Kiểm tra log backend.'],
            confidenceNote: 'Cần đối chiếu log để xác nhận.',
          }),
        }],
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const diagnosis = await analyzeIncidentWithAI({
      monitor: { name: 'Example site', url: 'https://example.com' },
      check: { status: 'DOWN', httpStatus: 502, responseTimeMs: 200, error: '', checkedAt: new Date() },
      recentChecks: [],
    });

    assert.equal(attempts, 3);
    assert.equal(diagnosis.source, 'ai');
    assert.deepEqual(diagnosis.possibleCauses, ['Có thể backend chưa phản hồi.']);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalKey;
  }
});

test('diagnosis translation returns structured English fields', async () => {
  const originalKey = process.env.GROQ_API_KEY;
  const originalModel = process.env.GROQ_MODEL;
  const originalFetch = globalThis.fetch;
  let requestBody;
  process.env.GROQ_API_KEY = 'test-key';
  process.env.GROQ_MODEL = 'test-model';
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    assert.equal(options.headers.authorization, 'Bearer test-key');
    return new Response(JSON.stringify({
      output: [{
        content: [{
          type: 'output_text',
          text: JSON.stringify({
            evidence: ['Received HTTP 503.'],
            possibleCauses: ['The backend service may be unavailable.'],
            recommendedActions: ['Check backend service logs.'],
            confidenceNote: 'Confirm using server logs.',
          }),
        }],
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const translation = await translateDiagnosisToEnglish({
      evidence: ['Nhận được HTTP 503.'],
      possibleCauses: ['Backend có thể chưa sẵn sàng.'],
      recommendedActions: ['Kiểm tra log backend.'],
      confidenceNote: 'Cần xác nhận bằng log máy chủ.',
    });

    assert.deepEqual(translation, {
      evidence: ['Received HTTP 503.'],
      possibleCauses: ['The backend service may be unavailable.'],
      recommendedActions: ['Check backend service logs.'],
      confidenceNote: 'Confirm using server logs.',
    });
    assert.equal(requestBody.model, 'test-model');
    assert.match(requestBody.input[0].content, /Translate.*Vietnamese to English/);
    assert.match(requestBody.input[1].content, /Nhận được HTTP 503/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GROQ_MODEL;
    else process.env.GROQ_MODEL = originalModel;
  }
});
