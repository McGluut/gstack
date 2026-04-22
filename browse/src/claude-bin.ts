import * as fs from 'fs';
import * as path from 'path';

function stripWrappingQuotes(value: string): string {
  return value.replace(/^"(.*)"$/, '$1');
}

function isRunnableFile(candidate: string): boolean {
  try {
    const stat = fs.statSync(candidate);
    if (!stat.isFile()) return false;
    if (process.platform === 'win32') return true;
    fs.accessSync(candidate, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function getPathEnvKey(env: NodeJS.ProcessEnv): string {
  return Object.keys(env).find((key) => key.toLowerCase() === 'path') ?? 'PATH';
}

function getPathEntries(env: NodeJS.ProcessEnv): string[] {
  const key = getPathEnvKey(env);
  return (env[key] ?? env.PATH ?? '')
    .split(path.delimiter)
    .map((entry) => stripWrappingQuotes(entry.trim()))
    .filter(Boolean);
}

function getWindowsExtensions(env: NodeJS.ProcessEnv): string[] {
  const raw = env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD';
  return raw
    .split(';')
    .map((ext) => ext.trim())
    .filter(Boolean);
}

function resolveFromPath(command: string, env: NodeJS.ProcessEnv): string | null {
  const hasExplicitPath = path.isAbsolute(command) || command.includes('/') || command.includes('\\');
  if (hasExplicitPath) {
    return isRunnableFile(command) ? command : null;
  }

  const suffixes = process.platform === 'win32'
    ? [...getWindowsExtensions(env), '']
    : [''];

  for (const entry of getPathEntries(env)) {
    for (const suffix of suffixes) {
      const candidate = path.join(entry, `${command}${suffix}`);
      if (isRunnableFile(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function parseOverrideArgs(env: NodeJS.ProcessEnv): string[] {
  const raw = env.GSTACK_CLAUDE_BIN_ARGS ?? env.CLAUDE_BIN_ARGS;
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((value) => typeof value === 'string')) {
      return parsed;
    }
  } catch {
    // Fall through to the single-argument form.
  }
  return [stripWrappingQuotes(raw.trim())];
}

export interface ClaudeCommand {
  command: string;
  argsPrefix: string[];
}

export function resolveClaudeCommand(env: NodeJS.ProcessEnv = process.env): ClaudeCommand | null {
  const argsPrefix = parseOverrideArgs(env);
  const override = env.GSTACK_CLAUDE_BIN ?? env.CLAUDE_BIN;
  if (override?.trim()) {
    const candidate = stripWrappingQuotes(override.trim());
    return isRunnableFile(candidate) ? { command: candidate, argsPrefix } : null;
  }

  const command = resolveFromPath('claude', env);
  return command ? { command, argsPrefix: [] } : null;
}

export function resolveClaudeBinary(env: NodeJS.ProcessEnv = process.env): string | null {
  return resolveClaudeCommand(env)?.command ?? null;
}
