import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

const PLANNING_FAMILY = [
  'autoplan',
  'office-hours',
  'pair-agent',
  'plan-ceo-review',
  'plan-design-review',
  'plan-devex-review',
  'plan-eng-review',
  'plan-tune',
  'learn',
] as const;

const REQUIRED_CONTRACT_LINES = [
  '- Prerequisites:',
  '- Outputs:',
  '- Stop when:',
  '- If unavailable:',
];

describe('planning family quick contract', () => {
  for (const skill of PLANNING_FAMILY) {
    test(`${skill} template surfaces prerequisites, outputs, stop conditions, and fallback`, () => {
      const template = fs.readFileSync(path.join(ROOT, skill, 'SKILL.md.tmpl'), 'utf-8');
      expect(template).toContain('## Quick Contract');
      for (const line of REQUIRED_CONTRACT_LINES) {
        expect(template).toContain(line);
      }
    });
  }
});

describe('planning family portability contracts', () => {
  test('office-hours uses a branch-safe stem, portable state-root docs, and a helper-or-print opener contract', () => {
    const template = fs.readFileSync(path.join(ROOT, 'office-hours', 'SKILL.md.tmpl'), 'utf-8');
    expect(template).toContain('branch-safe stem from `gstack-slug`');
    expect(template).toContain('_BRANCH_STEM="${BRANCH:?gstack-slug did not provide BRANCH}"');
    expect(template).toContain('${GSTACK_HOME:-$HOME/.gstack}/projects/');
    expect(template).toContain('$GSTACK_BIN/gstack-open-url');
    expect(template).toContain('otherwise print the URL plainly');
  });

  test('plan-design-review points board fallback through the cross-platform opener helper', () => {
    const template = fs.readFileSync(path.join(ROOT, 'plan-design-review', 'SKILL.md.tmpl'), 'utf-8');
    expect(template).toContain('gstack-open-url <board-url>');
    expect(template).toContain('cross-platform opener helper');
  });

  test('plan-tune and learn surface Bun preflight before Bun-backed snippets', () => {
    const planTune = fs.readFileSync(path.join(ROOT, 'plan-tune', 'SKILL.md.tmpl'), 'utf-8');
    const learn = fs.readFileSync(path.join(ROOT, 'learn', 'SKILL.md.tmpl'), 'utf-8');
    const preflight = 'command -v bun >/dev/null 2>&1 && echo "BUN_READY" || echo "BUN_MISSING"';
    expect(planTune).toContain('## Runtime Preflight');
    expect(planTune).toContain(preflight);
    expect(learn).toContain('## Runtime Preflight');
    expect(learn).toContain(preflight);
  });

  test('pair-agent stops early when remote prerequisites are missing', () => {
    const template = fs.readFileSync(path.join(ROOT, 'pair-agent', 'SKILL.md.tmpl'), 'utf-8');
    expect(template).toContain('Do not promise a remote instruction block until ngrok status is known.');
    expect(template).toContain('stop after naming the exact prerequisite gap');
    expect(template).toContain('${OPENCLAW_HOME:-$HOME/.openclaw}/skills/gstack/browse-remote.json');
    expect(template).toContain('${CODEX_HOME:-$HOME/.codex}/skills/gstack/browse-remote.json');
    expect(template).toContain('${CURSOR_HOME:-$HOME/.cursor}/skills/gstack/browse-remote.json');
  });
});
