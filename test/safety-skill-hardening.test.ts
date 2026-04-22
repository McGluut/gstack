import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

function readTemplate(skill: string) {
  return fs.readFileSync(path.join(ROOT, skill, 'SKILL.md.tmpl'), 'utf-8');
}

const CONTROL_SKILLS = [
  'careful',
  'freeze',
  'guard',
  'unfreeze',
  'context-save',
  'context-restore',
] as const;

const REQUIRED_CONTRACT_LINES = [
  '- Prerequisites:',
  '- Outputs:',
  '- Stop when:',
  '- If unavailable:',
];

describe('safety/context skill contracts', () => {
  for (const skill of CONTROL_SKILLS) {
    test(`${skill} template surfaces prerequisites, outputs, stop conditions, and fallback`, () => {
      const template = readTemplate(skill);
      expect(template).toContain('## Quick Contract');
      for (const line of REQUIRED_CONTRACT_LINES) {
        expect(template).toContain(line);
      }
    });
  }
});

describe('safety/context off-the-shelf hardening', () => {
  test('careful, freeze, guard, and unfreeze use a portable state-root fallback for analytics', () => {
    for (const skill of ['careful', 'freeze', 'guard', 'unfreeze'] as const) {
      const template = readTemplate(skill);
      expect(template).toContain('STATE_ROOT="${CLAUDE_PLUGIN_DATA:-${GSTACK_HOME:-${HOME:+$HOME/.gstack}}}"');
      expect(template).toContain('[ -n "$STATE_ROOT" ] || STATE_ROOT=".gstack"');
      expect(template).toContain('"$STATE_ROOT/analytics/skill-usage.jsonl"');
      expect(template).not.toContain('~/.gstack/analytics/skill-usage.jsonl');
    }
  });

  test('freeze, guard, and unfreeze use a portable state-root fallback for the freeze boundary', () => {
    for (const skill of ['freeze', 'guard', 'unfreeze'] as const) {
      const template = readTemplate(skill);
      expect(template).toContain('STATE_DIR="${CLAUDE_PLUGIN_DATA:-${GSTACK_HOME:-${HOME:+$HOME/.gstack}}}"');
      expect(template).toContain('[ -n "$STATE_DIR" ] || STATE_DIR=".gstack"');
      expect(template).not.toContain('STATE_DIR="${CLAUDE_PLUGIN_DATA:-$HOME/.gstack}"');
    }
  });

  test('context save and restore use a portable gstack state-root fallback for checkpoints', () => {
    for (const skill of ['context-save', 'context-restore'] as const) {
      const template = readTemplate(skill);
      expect(template).toContain('GSTACK_STATE_ROOT="${GSTACK_HOME:-${CLAUDE_PLUGIN_DATA:-${HOME:+$HOME/.gstack}}}"');
      expect(template).toContain('[ -n "$GSTACK_STATE_ROOT" ] || GSTACK_STATE_ROOT=".gstack"');
      expect(template).toContain('CHECKPOINT_DIR="$GSTACK_STATE_ROOT/projects/$SLUG/checkpoints"');
      expect(template).not.toContain('CHECKPOINT_DIR="${GSTACK_HOME:-$HOME/.gstack}/projects/$SLUG/checkpoints"');
    }
  });
});
