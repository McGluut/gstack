import { describe, test, expect } from 'bun:test';
import * as path from 'path';
import { resolveClaudeBinary, resolveClaudeCommand } from '../src/claude-bin';

const FIXTURE_DIR = path.resolve(import.meta.dir, 'fixtures', 'mock-claude');
const FIXTURE_BIN = process.platform === 'win32'
  ? path.join(FIXTURE_DIR, 'claude.cmd')
  : path.join(FIXTURE_DIR, 'claude');
const PATH_ENV_KEY = process.platform === 'win32' ? 'Path' : 'PATH';

describe('resolveClaudeBinary', () => {
  test('prefers explicit GSTACK_CLAUDE_BIN override', () => {
    expect(resolveClaudeBinary({
      [PATH_ENV_KEY]: '',
      GSTACK_CLAUDE_BIN: FIXTURE_BIN,
    } as NodeJS.ProcessEnv)).toBe(FIXTURE_BIN);
  });

  test('resolves claude from PATH entries', () => {
    const resolved = resolveClaudeBinary({
      [PATH_ENV_KEY]: FIXTURE_DIR,
    } as NodeJS.ProcessEnv);
    expect(resolved?.toLowerCase()).toBe(FIXTURE_BIN.toLowerCase());
  });

  test('returns null when claude cannot be found', () => {
    expect(resolveClaudeBinary({
      [PATH_ENV_KEY]: import.meta.dir,
    } as NodeJS.ProcessEnv)).toBeNull();
  });

  test('supports explicit command prefixes via GSTACK_CLAUDE_BIN_ARGS', () => {
    expect(resolveClaudeCommand({
      GSTACK_CLAUDE_BIN: process.execPath,
      GSTACK_CLAUDE_BIN_ARGS: JSON.stringify([FIXTURE_BIN]),
    } as NodeJS.ProcessEnv)).toEqual({
      command: process.execPath,
      argsPrefix: [FIXTURE_BIN],
    });
  });
});
