import type { Diagnosis } from '../types/monitor';
import { request } from './client';

type DiagnosisTranslation = Pick<
  Diagnosis,
  'evidence' | 'possibleCauses' | 'recommendedActions' | 'confidenceNote'
>;

const translationCache = new Map<string, Promise<DiagnosisTranslation>>();

export function translateDiagnosis(diagnosis: Diagnosis): Promise<DiagnosisTranslation> {
  const content = {
    evidence: diagnosis.evidence,
    possibleCauses: diagnosis.possibleCauses,
    recommendedActions: diagnosis.recommendedActions,
    confidenceNote: diagnosis.confidenceNote,
  };
  const key = JSON.stringify(content);
  const cached = translationCache.get(key);
  if (cached) return cached;

  const translation = request<DiagnosisTranslation>('/api/diagnosis/translate', {
    method: 'POST',
    body: JSON.stringify(content),
  });
  translationCache.set(key, translation);
  if (translationCache.size > 100) {
    const oldestKey = translationCache.keys().next().value;
    if (oldestKey) translationCache.delete(oldestKey);
  }
  void translation.catch(() => {
    if (translationCache.get(key) === translation) translationCache.delete(key);
  });
  return translation;
}
