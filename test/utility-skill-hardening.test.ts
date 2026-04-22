import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

function readTemplate(skill: string) {
  return fs.readFileSync(path.join(ROOT, skill, 'SKILL.md.tmpl'), 'utf-8');
}

const UTILITY_SKILLS = ['codex', 'health', 'gstack-upgrade'] as const;
const REQUIRED_CONTRACT_LINES = [
  '- Prerequisites:',
  '- Outputs:',
  '- Stop when:',
  '- If unavailable:',
];

describe('utility skill contracts', () => {
  for (const skill of UTILITY_SKILLS) {
    test(`${skill} template surfaces prerequisites, outputs, stop conditions, and fallback`, () => {
      const template = readTemplate(skill);
      expect(template).toContain('## Quick Contract');
      for (const line of REQUIRED_CONTRACT_LINES) {
        expect(template).toContain(line);
      }
    });
  }
});

describe('utility skill off-the-shelf hardening', () => {
  test('codex resolves helper roots and portable temp paths before JSONL-backed runs', () => {
    const template = readTemplate('codex');
    expect(template).toContain('GSTACK_BIN_DIR="./bin"');
    expect(template).toContain('PLAN_ROOT="${GSTACK_PLAN_DIR:-${CLAUDE_PLANS_DIR:-${HOME:+$HOME/.claude/plans}}}"');
    expect(template).toContain('TMP_ROOT="${TMPDIR:-${TMP:-.gstack/tmp}}"');
    expect(template).toContain('TMPERR=$(mktemp "$TMP_ROOT/codex-err-XXXXXX.txt")');
    expect(template).toContain('TMPRESP=$(mktemp "$TMP_ROOT/codex-resp-XXXXXX.txt")');
    expect(template).toContain('_gstack_codex_timeout_wrapper() { local _duration="$1"; shift; "$@"; }');
    expect(template).not.toContain('TMPERR=$(mktemp /tmp/codex-err-XXXXXX.txt)');
    expect(template).not.toContain('TMPRESP=$(mktemp /tmp/codex-resp-XXXXXX.txt)');
  });

  test('health uses a portable state-root fallback for history and trend persistence', () => {
    const template = readTemplate('health');
    expect(template).toContain('GSTACK_STATE_ROOT="${GSTACK_HOME:-${CLAUDE_PLUGIN_DATA:-${HOME:+$HOME/.gstack}}}"');
    expect(template).toContain('[ -n "$GSTACK_STATE_ROOT" ] || GSTACK_STATE_ROOT=".gstack"');
    expect(template).toContain('HISTORY_FILE="$GSTACK_STATE_ROOT/projects/$SLUG/health-history.jsonl"');
    expect(template).toContain('skip history and trend persistence');
    expect(template).not.toContain('~/.gstack/projects/$SLUG/health-history.jsonl');
  });

  test('gstack-upgrade resolves helper paths and portable state/temp roots before destructive steps', () => {
    const template = readTemplate('gstack-upgrade');
    expect(template).toContain('GSTACK_CONFIG_BIN="${GSTACK_BIN_DIR:+$GSTACK_BIN_DIR/gstack-config}"');
    expect(template).toContain('GSTACK_UPDATE_CHECK_BIN="${GSTACK_BIN_DIR:+$GSTACK_BIN_DIR/gstack-update-check}"');
    expect(template).toContain('GSTACK_STATE_ROOT="${GSTACK_STATE_DIR:-${GSTACK_HOME:-${HOME:+$HOME/.gstack}}}"');
    expect(template).toContain('TMP_ROOT="${TMPDIR:-${TMP:-$GSTACK_STATE_ROOT/tmp}}"');
    expect(template).toContain('TMP_DIR=$(mktemp -d "$TMP_ROOT/gstack-upgrade-XXXXXX")');
    expect(template).toContain('ERROR: setup failed after replacing the install. Restored the previous install.');
    expect(template).not.toContain('~/.claude/skills/gstack/bin/gstack-config');
    expect(template).not.toContain('~/.claude/skills/gstack/bin/gstack-update-check');
  });
});
