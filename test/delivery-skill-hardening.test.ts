import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

function readTemplate(skill: string) {
  return fs.readFileSync(path.join(ROOT, skill, 'SKILL.md.tmpl'), 'utf-8');
}

describe('delivery skill contracts', () => {
  for (const skill of ['review', 'ship', 'qa', 'qa-only', 'land-and-deploy', 'gstack-upgrade'] as const) {
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

describe('delivery skill off-the-shelf hardening', () => {
  test('context-save template contains no merge conflict markers', () => {
    const template = readTemplate('context-save');
    expect(template).not.toContain('<<<<<<<');
    expect(template).not.toContain('=======');
    expect(template).not.toContain('>>>>>>>');
  });

  test('review and ship use host-rewritable review surfaces', () => {
    const review = readTemplate('review');
    const ship = readTemplate('ship');
    expect(review).toContain('${GSTACK_ROOT:-$HOME/.claude/skills/gstack}/review/checklist.md');
    expect(review).toContain('${GSTACK_ROOT:-$HOME/.claude/skills/gstack}/review/greptile-triage.md');
    expect(review).toContain('"$GSTACK_BIN/gstack-review-log"');
    expect(ship).toContain('${GSTACK_ROOT:-$HOME/.claude/skills/gstack}/review/checklist.md');
    expect(ship).toContain('${GSTACK_ROOT:-$HOME/.claude/skills/gstack}/review/greptile-triage.md');
    expect(ship).toContain('${GSTACK_ROOT:-$HOME/.claude/skills/gstack}/review/TODOS-format.md');
    expect(ship).toContain('${GSTACK_ROOT:-$HOME/.claude/skills/gstack}/document-release/SKILL.md');
    expect(ship).toContain('"$GSTACK_BIN/gstack-review-log"');
    expect(ship).toContain('"$GSTACK_BIN/gstack-diff-scope"');
    expect(ship).toContain('${GSTACK_HOME:-$HOME/.gstack}/projects/$SLUG/$BRANCH-reviews.jsonl');
  });

  test('land-and-deploy uses install-root review and diff helpers', () => {
    const template = readTemplate('land-and-deploy');
    expect(template).toContain('"$GSTACK_BIN/gstack-review-read"');
    expect(template).toContain('${GSTACK_ROOT:-$HOME/.claude/skills/gstack}/review/checklist.md');
    expect(template).toContain('"$GSTACK_BIN/gstack-diff-scope"');
    expect(template).toContain('PROJECT_STORE="${GSTACK_HOME:-$HOME/.gstack}/projects/$SLUG"');
    expect(template).toContain('"${GSTACK_HOME:-$HOME/.gstack}/evals"/*-e2e-*');
  });

  test('qa templates make project-scoped persistence optional and explicit', () => {
    const qa = readTemplate('qa');
    const qaOnly = readTemplate('qa-only');
    expect(qa).toContain('project-scoped artifact was skipped');
    expect(qaOnly).toContain('project-scoped artifact was skipped');
    expect(qa).toContain('${GSTACK_HOME:-$HOME/.gstack}/projects/{slug}/{user}-{branch}-test-outcome-{datetime}.md');
    expect(qaOnly).toContain('${GSTACK_HOME:-$HOME/.gstack}/projects/{slug}/{user}-{branch}-test-outcome-{datetime}.md');
    expect(qa).toContain('Output to any writable path');
    expect(qaOnly).toContain('Output to any writable path');
  });

  test('gstack-upgrade guards dirty installs and uses remote default branch detection', () => {
    const template = readTemplate('gstack-upgrade');
    expect(template).toContain('install directory has local changes');
    expect(template).toContain('git symbolic-ref refs/remotes/origin/HEAD');
    expect(template).toContain('git reset --hard "origin/$DEFAULT_BRANCH"');
  });
});
