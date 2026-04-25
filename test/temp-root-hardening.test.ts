import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

function read(relPath: string): string {
  return readFileSync(path.join(ROOT, relPath), 'utf-8');
}

describe('portable temp-root guidance', () => {
  test('root skill uses TMP_ROOT instead of raw /tmp screenshot examples', () => {
    const content = read('SKILL.md.tmpl');
    expect(content).toContain('TMP_ROOT="${TMPDIR:-${TMP:-.gstack/tmp}}"');
    expect(content).not.toContain('$B screenshot /tmp/after-login.png');
    expect(content).not.toContain('$B snapshot -i -a -o /tmp/feature-annotated.png');
    expect(content).not.toContain('["screenshot","/tmp/result.png"]');
  });

  test('qa skill override example points to a writable temp root, not /tmp', () => {
    const content = read('qa/SKILL.md.tmpl');
    expect(content).toContain('Output to any writable path (for example .gstack/tmp/qa)');
    expect(content).not.toContain('Output to /tmp/qa');
  });

  test('qa-only override example points to a writable temp root, not /tmp', () => {
    const content = read('qa-only/SKILL.md.tmpl');
    expect(content).toContain('Output to any writable path (for example .gstack/tmp/qa)');
    expect(content).not.toContain('Output to /tmp/qa');
  });

  test('plan-design-review ideal mockup example uses TMP_ROOT', () => {
    const content = read('plan-design-review/SKILL.md.tmpl');
    expect(content).toContain('TMP_ROOT="${TMPDIR:-${TMP:-.gstack/tmp}}"');
    expect(content).toContain('--output "$TMP_ROOT/gstack-ideal-<dimension>.png"');
    expect(content).not.toContain('--output /tmp/gstack-ideal-<dimension>.png');
  });

  test('design-shotgun agent prompt uses a portable temp-root contract', () => {
    const content = read('design-shotgun/SKILL.md.tmpl');
    expect(content).toContain('TMP_ROOT_ABS=$(cd "$TMP_ROOT" && pwd)');
    expect(content).toContain('Temp output: {absolute writable temp root}/variant-{letter}.png');
    expect(content).toContain('Why temp-root then copy?');
    expect(content).not.toContain('Output: /tmp/variant-{letter}.png');
    expect(content).not.toContain('--output /tmp/variant-{letter}.png');
  });

  test('ship uses mktemp in TMP_ROOT for test and eval logs', () => {
    const content = read('ship/SKILL.md.tmpl');
    expect(content).toContain('TMP_ROOT="${TMPDIR:-${TMP:-.gstack/tmp}}"');
    expect(content).toContain('SHIP_TESTS_LOG=$(mktemp "$TMP_ROOT/ship-tests-XXXXXX.txt")');
    expect(content).toContain('SHIP_EVALS_LOG=$(mktemp "$TMP_ROOT/ship-evals-XXXXXX.txt")');
    expect(content).not.toContain('/tmp/ship_tests.txt');
    expect(content).not.toContain('/tmp/ship_vitest.txt');
    expect(content).not.toContain('/tmp/ship_evals.txt');
  });

  test('make-pdf output contract does not promise a Unix-only /tmp path', () => {
    const content = read('make-pdf/SKILL.md.tmpl');
    expect(content).toContain('stdout: .gstack/tmp/letter.pdf');
    expect(content).not.toContain('stdout: /tmp/letter.pdf');
  });

  test('README cleanup uses the shell temp root instead of hardcoded /tmp', () => {
    const content = read('README.md');
    expect(content).toContain('TMP_ROOT="${TMPDIR:-${TMP:-/tmp}}"');
    expect(content).toContain(`find "$TMP_ROOT" -maxdepth 1 -name 'gstack-*' -type f -delete 2>/dev/null`);
    expect(content).not.toContain('rm -f /tmp/gstack-* 2>/dev/null');
  });
});
