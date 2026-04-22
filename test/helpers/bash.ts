import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import * as path from 'path';

export function resolveBash(): string {
  const whichCmd = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(whichCmd, ['bash'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 5000,
  });
  const bash = result.stdout?.split(/\r?\n/).find(Boolean)?.trim();
  if (bash) return bash;

  if (process.platform === 'win32') {
    const candidates = [
      path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Git', 'bin', 'bash.exe'),
      path.join(process.env.ProgramFiles ?? '', 'Git', 'bin', 'bash.exe'),
      path.join(process.env['ProgramFiles(x86)'] ?? '', 'Git', 'bin', 'bash.exe'),
    ].filter(Boolean);

    const discovered = candidates.find(candidate => existsSync(candidate));
    if (discovered) return discovered;
  }

  throw new Error('bash not found on PATH');
}
