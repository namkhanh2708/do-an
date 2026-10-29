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

export function isAiDiagnosisEnabled() {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function analyzeIncidentWithAI({ monitor, check, recentChecks }) {
  if (!isAiDiagnosisEnabled()) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const hostname = new URL(monitor.url).hostname;
  try {
    const response = await fetch('https://api.groq.com/openai/v1/responses', {
      method: 'POST',
      signal: controller.signal,
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
            content: 'Bạn là chuyên gia SRE. Phân tích sự cố website chỉ từ dữ liệu được cung cấp. Không khẳng định nguyên nhân nếu chưa đủ bằng chứng; đưa ra các bước khắc phục cụ thể, an toàn, ưu tiên kiểm tra trước khi thay đổi hệ thống. Trả lời bằng tiếng Việt.',
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
  } finally {
    clearTimeout(timeout);
  }
}