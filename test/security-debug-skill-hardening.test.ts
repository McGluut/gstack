import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

function readTemplate(skill: string) {
  return fs.readFileSync(path.join(ROOT, skill, 'SKILL.md.tmpl'), 'utf-8');
}

describe('security and debugging skill contracts', () => {
  for (const skill of ['investigate', 'cso'] as const) {
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

describe('security and debugging off-the-shelf hardening', () => {
  test('investigate uses install-root learnings helper and explicit stop boundary', () => {
    const template = readTemplate('investigate');
    expect(template).toContain('~/.claude/skills/gstack/bin/gstack-learnings-log');
    expect(template).toContain('three hypotheses fail');
  });

  test('cso surfaces project-instructions wording and optional-tool fallback', () => {
    const template = readTemplate('cso');
    expect(template).toContain('project instructions (`CLAUDE.md` when present), README, and key config files');
    expect(template).toContain('continue with the local phases and state each skipped verification surface explicitly');
  });
});
