#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

const ROOT = path.resolve(import.meta.dir, '..');
const TEST_ROOTS = ['browse/test', 'test', 'make-pdf/test'] as const;
const TEST_FILE_REGEX = /\.test\.(?:[cm]?[jt]s|tsx|jsx)$/;
const IGNORED_FREE_TESTS = [
  /^browse\/test\/security-review-fullstack\.test\.ts$/,
  /^test\/skill-e2e-.*\.test\.ts$/,
  /^test\/skill-llm-eval\.test\.ts$/,
  /^test\/skill-routing-e2e\.test\.ts$/,
  /^test\/codex-e2e\.test\.ts$/,
  /^test\/gemini-e2e\.test\.ts$/,
] as const;

export const DEFAULT_SHARD_COUNT = 20;
export const FREE_TEST_TIMEOUT_MS = 10_000;

export function normalizeRelativePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export function isFreeTestFile(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);
  if (!TEST_FILE_REGEX.test(normalized)) return false;
  return !IGNORED_FREE_TESTS.some(pattern => pattern.test(normalized));
}

function walkTestFiles(dirPath: string): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTestFiles(fullPath));
      continue;
    }
    if (TEST_FILE_REGEX.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

export function collectFreeTestFiles(rootDir = ROOT): string[] {
  const discovered = new Set<string>();
  for (const testRoot of TEST_ROOTS) {
    const absoluteRoot = path.join(rootDir, testRoot);
    if (!fs.existsSync(absoluteRoot)) continue;
    for (const fullPath of walkTestFiles(absoluteRoot)) {
      const relativePath = normalizeRelativePath(path.relative(rootDir, fullPath));
      if (isFreeTestFile(relativePath)) {
        discovered.add(relativePath);
      }
    }
  }
  return [...discovered].sort();
}

export function stableHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function assignFilesToShards(files: string[], shardCount: number): string[][] {
  if (!Number.isInteger(shardCount) || shardCount <= 0) {
    throw new Error(`Shard count must be a positive integer. Received: ${shardCount}`);
  }

  const shards = Array.from({ length: shardCount }, () => [] as string[]);
  for (const file of files) {
    const shardIndex = stableHash(file) % shardCount;
    shards[shardIndex].push(file);
  }

  return shards
    .map(filesInShard => filesInShard.sort())
    .filter(filesInShard => filesInShard.length > 0);
}

export function buildShardArgs(files: string[]): string[] {
  return ['test', ...files, '--max-concurrency=1', `--timeout=${FREE_TEST_TIMEOUT_MS}`];
}

type CliOptions = {
  dryRun: boolean;
  listOnly: boolean;
  shardCount: number;
  shardIndex: number | null;
};

function parseCliOptions(argv: string[]): CliOptions {
  let dryRun = false;
  let listOnly = false;
  let shardCount = DEFAULT_SHARD_COUNT;
  let shardIndex: number | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--list') {
      listOnly = true;
      continue;
    }
    if (arg === '--shards') {
      const value = argv[index + 1];
      if (!value) throw new Error('Missing value for --shards');
      shardCount = Number.parseInt(value, 10);
      index += 1;
      continue;
    }
    if (arg === '--shard') {
      const value = argv[index + 1];
      if (!value) throw new Error('Missing value for --shard');
      shardIndex = Number.parseInt(value, 10);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { dryRun, listOnly, shardCount, shardIndex };
}

function formatShardSummary(shards: string[][]): string[] {
  return shards.map((files, index) => {
    const preview = files.slice(0, 3).join(', ');
    const suffix = files.length > 3 ? ', ...' : '';
    return `Shard ${index + 1}/${shards.length}: ${files.length} files${preview ? ` -> ${preview}${suffix}` : ''}`;
  });
}

function runShard(files: string[], shardNumber: number, totalShards: number): number {
  const header = `[test:free] shard ${shardNumber}/${totalShards} (${files.length} files)`;
  console.log(header);
  const result = spawnSync(process.execPath, buildShardArgs(files), {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`${header} failed with exit code ${result.status ?? 1}`);
  }
  return result.status ?? 1;
}

function main(): number {
  const options = parseCliOptions(process.argv.slice(2));
  const files = collectFreeTestFiles();
  if (files.length === 0) {
    throw new Error('No free test files were discovered.');
  }

  const shards = assignFilesToShards(files, options.shardCount);
  if (options.listOnly || options.dryRun) {
    console.log(`Discovered ${files.length} free test files across ${shards.length} shards.`);
    for (const line of formatShardSummary(shards)) {
      console.log(line);
    }
    return 0;
  }

  if (options.shardIndex !== null) {
    if (!Number.isInteger(options.shardIndex) || options.shardIndex < 1 || options.shardIndex > shards.length) {
      throw new Error(`--shard must be between 1 and ${shards.length}. Received: ${options.shardIndex}`);
    }
    return runShard(shards[options.shardIndex - 1], options.shardIndex, shards.length);
  }

  for (let index = 0; index < shards.length; index += 1) {
    const exitCode = runShard(shards[index], index + 1, shards.length);
    if (exitCode !== 0) return exitCode;
  }

  return 0;
}

if (import.meta.main) {
  process.exitCode = main();
}
