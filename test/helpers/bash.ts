import { spawnSync } from 'child_process';

export function resolveBash(): string {
  const whichCmd = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(whichCmd, ['bash'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 5000,
  });
  const bash = result.stdout?.split(/\r?\n/).find(Boolean)?.trim();
  if (!bash) throw new Error('bash not found on PATH');
  return bash;
}
