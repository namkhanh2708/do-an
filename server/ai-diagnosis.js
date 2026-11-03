const diagnosisSchema = {
  type: 'object',
  properties: {
    possibleCauses: { type: 'array', items: { type: 'string' } },
    recommendedActions: { type: 'array', items: { type: 'string' } },
    confidenceNote: { type: 'string' },
  },
  required: ['possibleCauses', 'recommendedActions', 'confidenceNote'],
  additionalProperties: false,
};

const diagnosisTranslationSchema = {
  type: 'object',
  properties: {
    evidence: { type: 'array', items: { type: 'string' } },
    possibleCauses: { type: 'array', items: { type: 'string' } },
    recommendedActions: { type: 'array', items: { type: 'string' } },
    confidenceNote: { type: 'string' },
  },
  required: ['evidence', 'possibleCauses', 'recommendedActions', 'confidenceNote'],
  additionalProperties: false,
};

export function isAiDiagnosisEnabled() {
  return Boolean(process.env.GROQ_API_KEY);
}

function parseDiagnosisOutput(body) {
  const outputText = body?.output
    ?.flatMap((item) => item.content || [])
    .find((item) => item.type === 'output_text')?.text;
  if (!outputText) throw new Error('AI không trả về nội dung phân tích.');

  const result = JSON.parse(outputText);
  if (!Array.isArray(result.evidence) ||
    !result.evidence.every((item) => typeof item === 'string') ||
    !Array.isArray(result.possibleCauses) ||
    !result.possibleCauses.every((item) => typeof item === 'string') ||
    !Array.isArray(result.recommendedActions) ||
    !result.recommendedActions.every((item) => typeof item === 'string') ||
    typeof result.confidenceNote !== 'string') {
    throw new Error('Kết quả dịch AI không đúng cấu trúc.');
  }
  return {
    evidence: result.evidence.map((item) => item.trim()).filter(Boolean).slice(0, 6),
    possibleCauses: result.possibleCauses.map((item) => item.trim()).filter(Boolean).slice(0, 5),
    recommendedActions: result.recommendedActions.map((item) => item.trim()).filter(Boolean).slice(0, 6),
    confidenceNote: result.confidenceNote.trim(),
  };
}

async function fetchWithDiagnosisRetries(url, options) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (response.ok || attempt === 3) return response;

      const body = await response.clone().json().catch(() => null);
      const message = body?.error?.message || '';
      const retryable = response.status === 429 ||
        response.status >= 500 ||
        /failed to generate json/i.test(message);
      if (!retryable) return response;
      lastError = new Error(message || `Groq API trả về HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
      if (attempt === 3) throw error;
    } finally {
      clearTimeout(timeout);
    }

    await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
  }
  throw lastError;
}

export async function translateDiagnosisToEnglish(diagnosis) {
  if (!isAiDiagnosisEnabled()) {
    throw new Error('Dịch AI chưa được cấu hình.');
  }

  const response = await fetchWithDiagnosisRetries('https://api.groq.com/openai/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      store: false,
      max_output_tokens: 900,
      input: [
        {
          role: 'system',
          content: 'Translate the provided website incident diagnosis from Vietnamese to English. Preserve the meaning and uncertainty exactly; do not add, remove, or infer facts or recommendations. Keep technical terms, protocol names, service names, status codes, measurements, URLs, and numbers unchanged. Return every field in English.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            evidence: diagnosis.evidence,
            possibleCauses: diagnosis.possibleCauses,
            recommendedActions: diagnosis.recommendedActions,
            confidenceNote: diagnosis.confidenceNote,
          }),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'incident_diagnosis_translation',
          strict: true,
          schema: diagnosisTranslationSchema,
        },
      },
    }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error?.message || `Groq API trả về HTTP ${response.status}.`);
  }
  return parseDiagnosisOutput(body);
}

export async function analyzeIncidentWithAI({ monitor, check, recentChecks }) {
  if (!isAiDiagnosisEnabled()) return null;

  const hostname = new URL(monitor.url).hostname;
  try {
    const response = await fetchWithDiagnosisRetries('https://api.groq.com/openai/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
        store: false,
        max_output_tokens: 700,
        input: [
          {
            role: 'system',
            content: 'Bạn là chuyên gia SRE. Phân tích sự cố website chỉ từ dữ liệu được cung cấp. Viết toàn bộ nội dung trong possibleCauses, recommendedActions và confidenceNote bằng tiếng Việt; chỉ giữ nguyên các thuật ngữ kỹ thuật, tên giao thức, mã lỗi và tên dịch vụ khi cần thiết. Không khẳng định nguyên nhân nếu chưa đủ bằng chứng; đưa ra các bước khắc phục cụ thể, an toàn, ưu tiên kiểm tra trước khi thay đổi hệ thống.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              website: { name: monitor.name, hostname },
              currentCheck: {
                status: check.status,
                httpStatus: check.httpStatus,
                responseTimeMs: check.responseTimeMs,
                error: check.error,
                checkedAt: check.checkedAt,
              },
              recentChecks: recentChecks.map((item) => ({
                status: item.status,
                httpStatus: item.httpStatus,
                responseTimeMs: item.responseTimeMs,
                error: item.error,
                checkedAt: item.checkedAt,
              })),
            }),
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'incident_diagnosis',
            strict: true,
            schema: diagnosisSchema,
          },
        },
      }),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.error?.message || `Groq API trả về HTTP ${response.status}.`);
    }
    const outputText = body?.output
      ?.flatMap((item) => item.content || [])
      .find((item) => item.type === 'output_text')?.text;
    if (!outputText) throw new Error('AI không trả về nội dung phân tích.');

    const result = JSON.parse(outputText);
    if (!Array.isArray(result.possibleCauses) ||
      !result.possibleCauses.every((item) => typeof item === 'string') ||
      !Array.isArray(result.recommendedActions) ||
      !result.recommendedActions.every((item) => typeof item === 'string') ||
      typeof result.confidenceNote !== 'string') {
      throw new Error('Kết quả phân tích AI không đúng cấu trúc.');
    }
    return {
      possibleCauses: result.possibleCauses.map((item) => item.trim()).filter(Boolean).slice(0, 5),
      recommendedActions: result.recommendedActions.map((item) => item.trim()).filter(Boolean).slice(0, 6),
      confidenceNote: result.confidenceNote,
      source: 'ai',
    };
  } catch (error) {
    console.error('[ai-diagnosis] Không thể phân tích sự cố:', error.message);
    return null;
  }
}