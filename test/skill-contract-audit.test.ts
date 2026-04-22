import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  auditSkillContract,
  extractDocumentedSlashCommands,
  extractFrontmatterDescription,
} from '../scripts/skill-contract-audit';

function withFixture(files: Record<string, string>, run: (rootDir: string) => void): void {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-skill-contract-'));
  try {
    for (const [relativePath, content] of Object.entries(files)) {
      const filePath = path.join(rootDir, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
    }
    run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
}

describe('skill-contract-audit helpers', () => {
  test('extractFrontmatterDescription reads block descriptions', () => {
    const description = extractFrontmatterDescription(`---
name: alpha
description: |
  Use when alpha work is needed.
  Proactively suggest it.
---
body
`);
    expect(description).toContain('Use when alpha work is needed.');
    expect(description).toContain('Proactively suggest it.');
  });

  test('extractDocumentedSlashCommands parses backticked slash commands', () => {
    expect(extractDocumentedSlashCommands('Use `/alpha`, `/beta`, and [`/gamma`](#gamma).')).toEqual(
      new Set(['alpha', 'beta', 'gamma']),
    );
  });
});

describe('auditSkillContract', () => {
  test('flags private repo references as errors', () => {
    withFixture({
      'alpha/SKILL.md.tmpl': `---
name: alpha
description: |
  Use when alpha work is needed.
---
See docs/coordination-board.md before proceeding.
`,
      'alpha/SKILL.md': `---
name: alpha
description: |
  Use when alpha work is needed.
---
body
`,
      'docs/skills.md': 'Use `/alpha`.',
      'AGENTS.md': 'Use `/alpha`.',
    }, (rootDir) => {
      const result = auditSkillContract(rootDir);
      expect(result.errors.some(issue => issue.code === 'private-repo-reference')).toBe(true);
    });
  });

  test('flags missing "Use when" descriptions as errors', () => {
    withFixture({
      'alpha/SKILL.md.tmpl': `---
name: alpha
description: |
  Alpha work only.
---
body
`,
      'alpha/SKILL.md': `---
name: alpha
description: |
  Use when alpha work is needed.
---
body
`,
      'docs/skills.md': 'Use `/alpha`.',
      'AGENTS.md': 'Use `/alpha`.',
    }, (rootDir) => {
      const result = auditSkillContract(rootDir);
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'missing-use-when',
        file: 'alpha/SKILL.md.tmpl',
      }));
    });
  });

  test('surfaces docs inventory drift as warnings', () => {
    withFixture({
      'alpha/SKILL.md.tmpl': `---
name: alpha
description: |
  Use when alpha work is needed.
---
body
`,
      'alpha/SKILL.md': `---
name: alpha
description: |
  Use when alpha work is needed.
---
body
`,
      'beta/SKILL.md.tmpl': `---
name: beta
description: |
  Use when beta work is needed.
---
body
`,
      'beta/SKILL.md': `---
name: beta
description: |
  Use when beta work is needed.
---
body
`,
      'docs/skills.md': 'Use `/alpha`.',
      'AGENTS.md': 'Use `/alpha` and `/debug`.\n\nbun test                 # run tests (free, <5s)\n',
    }, (rootDir) => {
      const result = auditSkillContract(rootDir);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContainEqual(expect.objectContaining({
        code: 'docs-skills-missing-skill',
        message: 'docs/skills.md does not document /beta.',
      }));
      expect(result.warnings).toContainEqual(expect.objectContaining({
        code: 'agents-unknown-skill',
        message: 'AGENTS.md mentions /debug, but no matching skill template exists.',
      }));
      expect(result.warnings).toContainEqual(expect.objectContaining({
        code: 'agents-stale-runtime-claim',
      }));
    });
  });

  test('flags external host Claude-path leakage as an error', () => {
    withFixture({
      'alpha/SKILL.md.tmpl': `---
name: alpha
description: |
  Use when alpha work is needed.
---
body
`,
      'alpha/SKILL.md': `---
name: alpha
description: |
  Use when alpha work is needed.
---
body
`,
      '.agents/skills/gstack-alpha/SKILL.md': 'Install from ~/.claude/skills/gstack.',
      'docs/skills.md': 'Use `/alpha`.',
      'AGENTS.md': 'Use `/alpha`.',
    }, (rootDir) => {
      const result = auditSkillContract(rootDir);
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'external-host-claude-leakage',
        file: '.agents/skills/gstack-alpha/SKILL.md',
      }));
    });
  });

  test('current repo has no hard audit errors', () => {
    const rootDir = path.resolve(import.meta.dir, '..');
    const result = auditSkillContract(rootDir);
    expect(result.errors).toEqual([]);
  }, 30_000);
});
