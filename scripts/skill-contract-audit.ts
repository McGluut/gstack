#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import { discoverTemplates, discoverSkillFiles } from './discover-skills';
import { getExternalHosts } from '../hosts/index';

const ROOT = path.resolve(import.meta.dir, '..');

const PRIVATE_REPO_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /docs\/coordination-board\.md/i, label: 'docs/coordination-board.md' },
  { pattern: /SEEKING_LOG\.md/i, label: 'SEEKING_LOG.md' },
  { pattern: /RATIONAL_SUBJECT\.md/i, label: 'RATIONAL_SUBJECT.md' },
  { pattern: /VALUE_SIGNAL_LOOP\.md/i, label: 'VALUE_SIGNAL_LOOP.md' },
  { pattern: /C:\\LLM Playground\\go/i, label: 'C:\\LLM Playground\\go' },
];

export type AuditSeverity = 'error' | 'warning';

export type AuditIssue = {
  severity: AuditSeverity;
  code: string;
  message: string;
  file?: string;
};

export type AuditResult = {
  errors: AuditIssue[];
  warnings: AuditIssue[];
};

function relative(rootDir: string, filePath: string): string {
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
}

export function extractFrontmatterDescription(content: string): string {
  content = content.replace(/\r\n/g, '\n');
  const fmStart = content.indexOf('---\n');
  if (fmStart !== 0) return '';
  const fmEnd = content.indexOf('\n---', fmStart + 4);
  if (fmEnd === -1) return '';
  const frontmatter = content.slice(fmStart + 4, fmEnd);

  const lines = frontmatter.split('\n');
  let inDescription = false;
  const descriptionLines: string[] = [];

  for (const line of lines) {
    if (/^description:\s*\|?\s*$/.test(line)) {
      inDescription = true;
      continue;
    }
    if (/^description:\s*\S/.test(line)) {
      return line.replace(/^description:\s*/, '').trim();
    }
    if (inDescription) {
      if (line === '' || /^\s/.test(line)) {
        descriptionLines.push(line.replace(/^  /, ''));
      } else {
        break;
      }
    }
  }

  return descriptionLines.join('\n').trim();
}

export function extractDocumentedSlashCommands(markdown: string): Set<string> {
  const commands = new Set<string>();
  const regex = /`\/([a-z0-9-]+)`/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    commands.add(match[1]);
  }
  return commands;
}

function discoverExternalSkillFiles(rootDir: string): string[] {
  const results: string[] = [];
  for (const host of getExternalHosts()) {
    const skillsDir = path.join(rootDir, host.hostSubdir, 'skills');
    if (!fs.existsSync(skillsDir)) continue;
    for (const skillDir of fs.readdirSync(skillsDir)) {
      const skillPath = path.join(skillsDir, skillDir, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        results.push(skillPath);
      }
    }
  }
  return results.sort();
}

function createIssue(
  severity: AuditSeverity,
  code: string,
  message: string,
  file?: string,
): AuditIssue {
  return { severity, code, message, file };
}

export function auditSkillContract(rootDir = ROOT): AuditResult {
  const errors: AuditIssue[] = [];
  const warnings: AuditIssue[] = [];

  const templates = discoverTemplates(rootDir);
  const generatedSkills = discoverSkillFiles(rootDir).map(file => path.join(rootDir, file));
  const templatePaths = templates.map(({ tmpl }) => path.join(rootDir, tmpl));
  const externalSkillPaths = discoverExternalSkillFiles(rootDir);

  for (const tmplPath of templatePaths) {
    const content = fs.readFileSync(tmplPath, 'utf-8');
    const description = extractFrontmatterDescription(content);
    if (!/Use when/i.test(description)) {
      errors.push(createIssue(
        'error',
        'missing-use-when',
        'Template description must include a "Use when" invocation cue.',
        relative(rootDir, tmplPath),
      ));
    }
  }

  for (const filePath of [...templatePaths, ...generatedSkills, ...externalSkillPaths]) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const { pattern, label } of PRIVATE_REPO_PATTERNS) {
      if (pattern.test(content)) {
        errors.push(createIssue(
          'error',
          'private-repo-reference',
          `Skill surface references repo-private surface "${label}".`,
          relative(rootDir, filePath),
        ));
      }
    }
  }

  for (const filePath of externalSkillPaths) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('.claude/skills')) {
      errors.push(createIssue(
        'error',
        'external-host-claude-leakage',
        'External host skill output still references .claude/skills.',
        relative(rootDir, filePath),
      ));
    }
  }

  const skillNames = new Set(
    templates
      .map(({ tmpl }) => tmpl === 'SKILL.md.tmpl' ? null : tmpl.split('/')[0])
      .filter((name): name is string => Boolean(name)),
  );

  const docsSkillsPath = path.join(rootDir, 'docs', 'skills.md');
  if (fs.existsSync(docsSkillsPath)) {
    const documented = extractDocumentedSlashCommands(fs.readFileSync(docsSkillsPath, 'utf-8'));
    for (const skillName of [...skillNames].sort()) {
      if (!documented.has(skillName)) {
        warnings.push(createIssue(
          'warning',
          'docs-skills-missing-skill',
          `docs/skills.md does not document /${skillName}.`,
          'docs/skills.md',
        ));
      }
    }
  }

  const agentsPath = path.join(rootDir, 'AGENTS.md');
  if (fs.existsSync(agentsPath)) {
    const agentsContent = fs.readFileSync(agentsPath, 'utf-8');
    const documented = extractDocumentedSlashCommands(agentsContent);
    for (const skillName of [...skillNames].sort()) {
      if (!documented.has(skillName)) {
        warnings.push(createIssue(
          'warning',
          'agents-missing-skill',
          `AGENTS.md does not mention /${skillName}.`,
          'AGENTS.md',
        ));
      }
    }
    for (const command of documented) {
      if (!skillNames.has(command)) {
        warnings.push(createIssue(
          'warning',
          'agents-unknown-skill',
          `AGENTS.md mentions /${command}, but no matching skill template exists.`,
          'AGENTS.md',
        ));
      }
    }
    if (/<5s/i.test(agentsContent)) {
      warnings.push(createIssue(
        'warning',
        'agents-stale-runtime-claim',
        'AGENTS.md still claims `bun test` completes in <5s.',
        'AGENTS.md',
      ));
    }
  }

  return { errors, warnings };
}

function renderIssues(title: string, issues: AuditIssue[]): void {
  console.log(`  ${title}:`);
  if (issues.length === 0) {
    console.log('  ✅ none');
    return;
  }
  for (const issue of issues) {
    const location = issue.file ? ` (${issue.file})` : '';
    const icon = issue.severity === 'error' ? '❌' : '⚠️ ';
    console.log(`  ${icon} ${issue.code}${location} — ${issue.message}`);
  }
}

function main(argv: string[]): number {
  const json = argv.includes('--json');
  const summary = argv.includes('--summary');
  const result = auditSkillContract();

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    renderIssues('Skill Contract Errors', result.errors);
    renderIssues('Skill Contract Warnings', result.warnings);
  }

  if (summary && !json) {
    console.log(`  Summary: ${result.errors.length} errors, ${result.warnings.length} warnings`);
  }

  return result.errors.length > 0 ? 1 : 0;
}

if (import.meta.main) {
  process.exitCode = main(process.argv.slice(2));
}
