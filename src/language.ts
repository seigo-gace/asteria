import { codedError } from './errors.js';

export function canonicalLanguage(value: unknown, field: 'target_language' | 'source_language'): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw codedError(field === 'target_language' ? 'TARGET_LANGUAGE_REQUIRED' : 'SOURCE_LANGUAGE_INVALID', `${field} must be a valid BCP 47 language tag.`, false, 400);
  }
  try {
    const tags = Intl.getCanonicalLocales(value.trim());
    if (tags.length !== 1) throw new Error('invalid language tag');
    return tags[0]!;
  } catch {
    throw codedError(field === 'target_language' ? 'TARGET_LANGUAGE_INVALID' : 'SOURCE_LANGUAGE_INVALID', `${field} must be a valid BCP 47 language tag.`, false, 400);
  }
}

export function sameLanguage(left: string, right: string): boolean {
  try {
    const a = canonicalLanguage(left, 'source_language').toLowerCase();
    const b = canonicalLanguage(right, 'source_language').toLowerCase();
    if (a === b) return true;
    return a.split('-')[0] === b.split('-')[0];
  } catch {
    return false;
  }
}
