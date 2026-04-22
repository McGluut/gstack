import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { resolveBash } from './helpers/bash';

const ROOT = path.resolve(import.meta.dir, '..');
const BIN = path.join(ROOT, 'bin');
const BASH = resolveBash();
const SLOW_CLI_TIMEOUT = process.platform === 'win32' ? 15000 : 10000;

let tmpDir: string;
let slugDir: string;

function run(input: string, opts: { expectFail?: boolean } = {}): { stdout: string; exitCode: number } {
  const result = spawnSync(BASH, [path.join(BIN, 'gstack-review-log'), input], {
    cwd: ROOT,
    env: { ...process.env, GSTACK_HOME: tmpDir },
    encoding: 'utf-8',
    timeout: SLOW_CLI_TIMEOUT,
  });
  const stdout = (result.stdout ?? '').trim();
  const stderr = (result.stderr ?? '').trim();
  const exitCode = result.status ?? 1;
  if (exitCode !== 0 && !opts.expectFail) {
    throw new Error(stderr || stdout || `gstack-review-log failed (${exitCode})`);
  }
  return { stdout: opts.expectFail ? stderr : stdout, exitCode };
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-revlog-'));
  // gstack-review-log uses gstack-slug which needs a git repo — create the projects dir
  // with a predictable slug by pre-creating the directory structure
  slugDir = path.join(tmpDir, 'projects');
  fs.mkdirSync(slugDir, { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('gstack-review-log', () => {
  test('appends valid JSON to review JSONL file', () => {
    const input = '{"skill":"plan-eng-review","status":"clean"}';
    const result = run(input);
    expect(result.exitCode).toBe(0);

    // Find the JSONL file that was written
    const projectDirs = fs.readdirSync(slugDir);
    expect(projectDirs.length).toBeGreaterThan(0);
    const projectDir = path.join(slugDir, projectDirs[0]);
    const jsonlFiles = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));
    expect(jsonlFiles.length).toBeGreaterThan(0);

    const content = fs.readFileSync(path.join(projectDir, jsonlFiles[0]), 'utf-8').trim();
    const parsed = JSON.parse(content);
    expect(parsed.skill).toBe('plan-eng-review');
    expect(parsed.status).toBe('clean');
  });

  test('rejects non-JSON input with non-zero exit code', () => {
    const result = run('not json at all', { expectFail: true });
    expect(result.exitCode).not.toBe(0);

    // Verify nothing was written
    const projectDirs = fs.readdirSync(slugDir);
    if (projectDirs.length > 0) {
      const projectDir = path.join(slugDir, projectDirs[0]);
      const jsonlFiles = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));
      if (jsonlFiles.length > 0) {
        const content = fs.readFileSync(path.join(projectDir, jsonlFiles[0]), 'utf-8').trim();
        expect(content).toBe('');
      }
    }
  });
});
