import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

function readTemplate(skill: string) {
  return fs.readFileSync(path.join(ROOT, skill, 'SKILL.md.tmpl'), 'utf-8');
}

describe('ops skill contracts', () => {
  for (const skill of ['document-release', 'retro', 'canary', 'benchmark', 'benchmark-models', 'setup-deploy', 'devex-review'] as const) {
    test(`${skill} template surfaces quick contract`, () => {
      const template = readTemplate(skill);
      expect(template).toContain('## Quick Contract');
      expect(template).toContain('- Prerequisites:');
      expect(template).toContain('- Outputs:');
      expect(template).toContain('- Stop when:');
      expect(template).toContain('- If unavailable:');
    });
  }
});

describe('ops skill off-the-shelf hardening', () => {
  test('document-release uses a portable PR body temp file', () => {
    const template = readTemplate('document-release');
    expect(template).toContain('PR_BODY_FILE=');
    expect(template).toContain('gh pr edit --body-file "$PR_BODY_FILE"');
    expect(template).not.toContain('/tmp/gstack-pr-body-$$.md');
  });

  test('retro uses install-root discovery helpers and portable temp output', () => {
    const template = readTemplate('retro');
    expect(template).toContain('~/.claude/skills/gstack/bin/gstack-slug');
    expect(template).toContain('~/.claude/skills/gstack/bin/gstack-global-discover');
    expect(template).toContain('TMP_ROOT="${TMPDIR:-${TMP:-.gstack/tmp}}"');
  });

  test('canary and benchmark use install-root slug helper and explicit persistence fallback', () => {
    const canary = readTemplate('canary');
    const benchmark = readTemplate('benchmark');
    expect(canary).toContain('~/.claude/skills/gstack/bin/gstack-slug');
    expect(canary).toContain('PROJECT_LOG_DIR=');
    expect(canary).toContain('dashboard log was skipped');
    expect(benchmark).toContain('~/.claude/skills/gstack/bin/gstack-slug');
    expect(benchmark).toContain('regression/trend comparisons were skipped');
  });

  test('benchmark-models uses install-root binary discovery and host-neutral judge check', () => {
    const template = readTemplate('benchmark-models');
    expect(template).toContain('BIN="~/.claude/skills/gstack/bin/gstack-model-benchmark"');
    expect(template).toContain('command -v gstack-model-benchmark');
    expect(template).toContain('command -v claude');
    expect(template).not.toContain('$HOME/.claude/.credentials.json');
  });

  test('setup-deploy and devex-review surface project-instructions and install-root review helpers', () => {
    const setupDeploy = readTemplate('setup-deploy');
    const devexReview = readTemplate('devex-review');
    expect(setupDeploy).toContain('project-instructions file (`CLAUDE.md` in this repo)');
    expect(devexReview).toContain('~/.claude/skills/gstack/bin/gstack-slug');
    expect(devexReview).toContain('~/.claude/skills/gstack/bin/gstack-review-read');
    expect(devexReview).toContain('~/.claude/skills/gstack/bin/gstack-review-log');
    expect(devexReview).toContain('.claude/skills/gstack/plan-devex-review/dx-hall-of-fame.md');
  });
});
