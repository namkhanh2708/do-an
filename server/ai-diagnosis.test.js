import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeIncidentWithAI, isAiDiagnosisEnabled } from './ai-diagnosis.js';

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
