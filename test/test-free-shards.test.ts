import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_SHARD_COUNT,
  FREE_TEST_TIMEOUT_MS,
  assignFilesToShards,
  buildShardArgs,
  collectFreeTestFiles,
  isFreeTestFile,
  normalizeRelativePath,
} from '../scripts/test-free-shards';

describe('test-free-shards', () => {
  test('classifies free tests and excludes eval lanes', () => {
    expect(isFreeTestFile('test/analytics.test.ts')).toBe(true);
    expect(isFreeTestFile('browse/test/sidebar-ux.test.ts')).toBe(true);
    expect(isFreeTestFile('make-pdf/test/render.test.ts')).toBe(true);
    expect(isFreeTestFile('browse/test/security-review-fullstack.test.ts')).toBe(false);
    expect(isFreeTestFile('test/skill-e2e-review.test.ts')).toBe(false);
    expect(isFreeTestFile('test/skill-llm-eval.test.ts')).toBe(false);
    expect(isFreeTestFile('test/skill-routing-e2e.test.ts')).toBe(false);
    expect(isFreeTestFile('test/codex-e2e.test.ts')).toBe(false);
    expect(isFreeTestFile('test/gemini-e2e.test.ts')).toBe(false);
  });

  test('collects normalized, unique, sorted free test files from the repo tree', () => {
    const files = collectFreeTestFiles();
    expect(files.length).toBeGreaterThan(0);
    expect(files).toEqual([...files].sort());
    expect(new Set(files).size).toBe(files.length);
    expect(files).toContain('browse/test/sidebar-ux.test.ts');
    expect(files).toContain('make-pdf/test/render.test.ts');
    expect(files).toContain('test/gen-skill-docs.test.ts');
    expect(files).not.toContain('browse/test/security-review-fullstack.test.ts');
    expect(files).not.toContain('test/skill-e2e-review.test.ts');
    expect(files.every(file => !file.includes('\\'))).toBe(true);
  });

  test('assigns every free test file to exactly one deterministic shard', () => {
    const files = collectFreeTestFiles();
    const firstPass = assignFilesToShards(files, DEFAULT_SHARD_COUNT);
    const secondPass = assignFilesToShards(files, DEFAULT_SHARD_COUNT);

    expect(firstPass).toEqual(secondPass);

    const flattened = firstPass.flat();
    expect(flattened.length).toBe(files.length);
    expect(new Set(flattened).size).toBe(files.length);
    expect(flattened.sort()).toEqual([...files].sort());
  });

  test('normalizes Windows-style separators', () => {
    expect(normalizeRelativePath('browse\\test\\snapshot.test.ts')).toBe('browse/test/snapshot.test.ts');
  });

  test('uses an explicit per-test timeout for shard runs', () => {
    expect(FREE_TEST_TIMEOUT_MS).toBe(10_000);
    expect(buildShardArgs(['test/example.test.ts'])).toEqual([
      'test',
      'test/example.test.ts',
      '--max-concurrency=1',
      '--timeout=10000',
    ]);
  });
});
