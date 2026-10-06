import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const script = path.resolve('scripts/service-benchmark.py');
const corpus = path.resolve('benchmarks/japanese-ab-corpus.v1.jsonl');
const schema = path.resolve('benchmarks/japanese-ab-corpus.schema.json');

function validate(corpusPath: string, runLabel: 'baseline' | 'adapted' = 'baseline') {
  return spawnSync('python3', [script, corpusPath, '--validate-only', '--run-label', runLabel], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

function parseLines(stdout: string): Record<string, unknown>[] {
  return stdout.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as Record<string, unknown>);
}

function withMutatedFirstRow(mutator: (row: Record<string, unknown>) => void, run: (file: string) => void) {
  const dir = mkdtempSync(path.join(tmpdir(), 'asteria-benchmark-contract-'));
  try {
    const rows = readFileSync(corpus, 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line) as Record<string, unknown>);
    const first = rows[0];
    if (!first) throw new Error('canonical Japanese A/B corpus must contain at least one row');
    mutator(first);
    const file = path.join(dir, 'mutated.jsonl');
    writeFileSync(file, rows.map((row) => JSON.stringify(row)).join('\n') + '\n', 'utf8');
    run(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('Japanese A/B corpus and schema declare non-authoritative v1 contract', () => {
  const schemaDocument = JSON.parse(readFileSync(schema, 'utf8')) as {
    additionalProperties?: boolean;
    properties?: Record<string, { const?: string }>;
  };
  assert.equal(schemaDocument.additionalProperties, false);
  assert.equal(schemaDocument.properties?.benchmark_schema?.const, 'asteria-japanese-ab-v1');
  assert.equal(schemaDocument.properties?.review_status?.const, 'SEED_NOT_ACCEPTANCE_AUTHORITY');

  const result = validate(corpus);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /"status": "CORPUS_VALIDATION_PASS"/);
});

test('baseline/adapted labels do not change translation input semantics', () => {
  const baseline = validate(corpus, 'baseline');
  const adapted = validate(corpus, 'adapted');
  assert.equal(baseline.status, 0, baseline.stdout + baseline.stderr);
  assert.equal(adapted.status, 0, adapted.stdout + adapted.stderr);

  const bindings = (stdout: string) => parseLines(stdout)
    .filter((row) => row.status === 'CORPUS_VALID')
    .map((row) => row.input_binding_sha256);
  assert.deepEqual(bindings(baseline.stdout), bindings(adapted.stdout));
  assert.ok(bindings(baseline.stdout).length > 0);
});

test('corpus validation rejects accidental authoritative review labels', () => {
  withMutatedFirstRow((row) => { row.review_status = 'ACCEPTANCE_AUTHORITY'; }, (file) => {
    const result = validate(file);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /review_status_must_remain_non_authoritative/);
  });
});

test('corpus validation rejects generated reference translation authority fields', () => {
  withMutatedFirstRow((row) => { row.reference_translation = 'This must never become benchmark authority.'; }, (file) => {
    const result = validate(file);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /forbidden_authority_fields:reference_translation/);
  });
});

test('corpus validation rejects malformed semantic risk metadata', () => {
  withMutatedFirstRow((row) => { row.semantic_risks = []; }, (file) => {
    const result = validate(file);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /semantic_risks_invalid/);
  });
});
