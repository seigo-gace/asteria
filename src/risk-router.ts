export type RiskClass = 'simple' | 'complex' | 'high-risk' | 'ambiguous';

export type RiskSignal =
  | 'multi_segment'
  | 'multiline'
  | 'mixed_script'
  | 'negation'
  | 'condition'
  | 'exception'
  | 'modality'
  | 'quantity_or_protected_value'
  | 'reference_context'
  | 'explicit_ambiguity';

export type RiskProfile = {
  riskClass: RiskClass;
  signals: readonly RiskSignal[];
  codePoints: number;
  segments: number;
  scripts: readonly string[];
  requiresFocusedMeaningAcquisition: boolean;
  requiresContextSelection: boolean;
};

type ProtectedInspector = (source: string) => { count: number; unprotectedText: string };

const NEGATION = /\b(?:no|not|never|neither|nor|without|nicht|kein(?:e|en|er|es)?|ne\s+pas|jamais|no|nunca|não|nunca|siyo|hapana)\b|(?:ない|ません|禁止|不可|不得|禁止|아니|않|못)|(?:لا|ليس|لن|لم)/iu;
const CONDITION = /\b(?:if|unless|provided\s+that|when|whenever|only\s+if|falls|wenn|sofern|si|cuando|se|caso|ikiwa)\b|(?:もし|場合|限り|なら|当|如果|若|只要|경우|면)|(?:إذا|إن|عند)/iu;
const EXCEPTION = /\b(?:except|exception|unless|apart\s+from|excepté|sauf|excepto|salvo|exceto|isipokuwa)\b|(?:例外|除く|除き|ただし|但し|除了|除外|제외)|(?:إلا|باستثناء)/iu;
const MODALITY = /\b(?:must|must\s+not|may|may\s+not|should|required|optional|permitted|prohibited|muss|darf|soll|doit|peut|debe|puede|deve|pode|lazima|ruhusa)\b|(?:必須|必要|べき|してよい|してはならない|可能|必须|应|可以|不得|해야|가능)|(?:يجب|ينبغي|يجوز|ممنوع)/iu;
const REFERENCE = /\b(?:this|that|these|those|it|they|them|he|she|former|latter|above|below|aforementioned|same|previous|following|owner|referent|pronoun)\b|(?:これ|それ|あれ|この|その|彼|彼女|同上|前者|後者|上記|下記|当該|所有者|主体)|(?:这|该|上述|下述|其|それぞれ|그|해당|상기)|(?:هذا|هذه|ذلك|تلك|المذكور)/iu;
const AMBIGUITY = /\b(?:ambiguous|ambiguity|unclear|unknown|unspecified|undetermined|uncertain|could\s+refer|not\s+clear|mehrdeutig|unklar|ambigu|incertain|ambiguo|incierto|ambíguo|incerto|haijulikani)\b|(?:曖昧|不明|未確定|特定できない|不詳|不清楚|不明确|模糊|불명확|모호|غير\s+واضح|غامض)/iu;

function scripts(source: string): string[] {
  const found = new Set<string>();
  for (const ch of source) {
    if (/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u.test(ch)) found.add('cjk');
    else if (/\p{Script=Hangul}/u.test(ch)) found.add('hangul');
    else if (/\p{Script=Arabic}/u.test(ch)) found.add('arabic');
    else if (/\p{Script=Hebrew}/u.test(ch)) found.add('hebrew');
    else if (/\p{Script=Cyrillic}/u.test(ch)) found.add('cyrillic');
    else if (/\p{Script=Devanagari}/u.test(ch)) found.add('devanagari');
    else if (/\p{Script=Thai}/u.test(ch)) found.add('thai');
    else if (/\p{Script=Latin}/u.test(ch)) found.add('latin');
  }
  return [...found].sort();
}

export function classifyTranslationRisk(bodies: readonly string[], inspectProtected: ProtectedInspector): RiskProfile {
  const source = bodies.join('\n');
  const inspected = inspectProtected(source);
  const clean = inspected.unprotectedText;
  const foundScripts = scripts(clean);
  const signals = new Set<RiskSignal>();

  if (bodies.length > 1) signals.add('multi_segment');
  if (source.includes('\n')) signals.add('multiline');
  if (foundScripts.length > 1) signals.add('mixed_script');
  if (NEGATION.test(clean)) signals.add('negation');
  if (CONDITION.test(clean)) signals.add('condition');
  if (EXCEPTION.test(clean)) signals.add('exception');
  if (MODALITY.test(clean)) signals.add('modality');
  if (inspected.count > 0) signals.add('quantity_or_protected_value');
  if (REFERENCE.test(clean)) signals.add('reference_context');
  if (AMBIGUITY.test(clean)) signals.add('explicit_ambiguity');

  let riskClass: RiskClass = 'simple';
  if (signals.has('explicit_ambiguity')) riskClass = 'ambiguous';
  else if ([...signals].some((signal) => ['negation', 'condition', 'exception', 'modality', 'quantity_or_protected_value'].includes(signal))) riskClass = 'high-risk';
  else if (signals.size > 0) riskClass = 'complex';

  return {
    riskClass,
    signals: [...signals],
    codePoints: [...source].length,
    segments: bodies.length,
    scripts: foundScripts,
    requiresFocusedMeaningAcquisition: riskClass === 'high-risk' || riskClass === 'ambiguous',
    requiresContextSelection: bodies.length > 1 && signals.has('reference_context')
  };
}

export function riskGuidance(profile: RiskProfile): string {
  if (!profile.requiresFocusedMeaningAcquisition) return '';
  return [
    `RISK_CLASS=${profile.riskClass}`,
    `RISK_SIGNALS=${profile.signals.join(',') || 'none'}`,
    'Risk signals are attention hints only, not facts about meaning.',
    'Preserve the exact scope of negation, conditions, exceptions, modality, quantities, references, and unresolved ambiguity when present.',
    'Do not infer a missing subject, referent, condition, or exception from the risk label.'
  ].join('\n');
}
