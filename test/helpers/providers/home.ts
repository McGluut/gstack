import * as os from 'os';

export function resolveHomeDir(): string {
  for (const candidate of [process.env.HOME, process.env.USERPROFILE]) {
    if (candidate && candidate.trim()) return candidate;
  }
  return os.homedir();
}
