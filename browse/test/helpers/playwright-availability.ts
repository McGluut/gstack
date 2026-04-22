import { spawnSync } from 'child_process';
import * as fs from 'fs';
import { chromium } from 'playwright';

const PROBE_SOURCE = `
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
await browser.close();
`;

let cachedLaunchability: boolean | null = null;

export function isChromiumLaunchable(): boolean {
  if (cachedLaunchability !== null) return cachedLaunchability;

  try {
    const executablePath = chromium.executablePath();
    if (!executablePath || !fs.existsSync(executablePath)) {
      cachedLaunchability = false;
      return cachedLaunchability;
    }
  } catch {
    cachedLaunchability = false;
    return cachedLaunchability;
  }

  try {
    const probe = spawnSync(process.execPath, ['-'], {
      input: PROBE_SOURCE,
      encoding: 'utf8',
      env: process.env,
      timeout: 10000,
      windowsHide: true,
    });
    cachedLaunchability = probe.status === 0;
    return cachedLaunchability;
  } catch {
    cachedLaunchability = false;
    return cachedLaunchability;
  }
}
