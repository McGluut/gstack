import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

function readTemplate(skill: string) {
  return fs.readFileSync(path.join(ROOT, skill, 'SKILL.md.tmpl'), 'utf-8');
}

describe('design skill contracts', () => {
  for (const skill of ['browse', 'design-consultation', 'design-shotgun', 'design-html', 'design-review', 'open-gstack-browser', 'setup-browser-cookies', 'make-pdf'] as const) {
    test(`${skill} template surfaces quick contract`, () => {
      const template = readTemplate(skill);
      expect(template).toContain('## Quick Contract');
      expect(template).toContain('- Prerequisites:');
      expect(template).toContain('- Outputs:');
      expect(template).toContain('- Stop when:');
      expect(template).toContain('- If unavailable:');
    });
  }
});

describe('design/browser off-the-shelf hardening', () => {
  test('browse uses a portable temp root in its file-output examples', () => {
    const template = readTemplate('browse');
    expect(template).toContain('TMP_ROOT="${TMPDIR:-${TMP:-.gstack/tmp}}"');
    expect(template).toContain('$B snapshot -i -a -o "$TMP_ROOT/annotated.png"');
    expect(template).toContain('$B goto "file://$TMP_ROOT/report.html"');
    expect(template).toContain('$B goto "file://$HOME/Documents/page.html"');
    expect(template).toContain('$TMP_ROOT/hero.png');
    expect(template).not.toContain('$B snapshot -i -a -o /tmp/annotated.png');
  });

  test('core design flows use host-rewritable slug helper', () => {
    const designConsultation = readTemplate('design-consultation');
    const designShotgun = readTemplate('design-shotgun');
    const designHtml = readTemplate('design-html');
    const designReview = readTemplate('design-review');
    expect(designConsultation).toContain('"$GSTACK_BIN/gstack-slug"');
    expect(designShotgun).toContain('"$GSTACK_BIN/gstack-slug"');
    expect(designHtml).toContain('"$GSTACK_BIN/gstack-slug"');
    expect(designReview).toContain('"$GSTACK_BIN/gstack-slug"');
  });

  test('design-consultation uses a portable preview path and opener helper', () => {
    const template = readTemplate('design-consultation');
    expect(template).toContain('TMP_ROOT="${TMPDIR:-${TMP:-.gstack/tmp}}"');
    expect(template).toContain('"$GSTACK_BIN/gstack-open-url" "$PREVIEW_FILE"');
    expect(template).toContain("printf '%s\\n' \"$PREVIEW_FILE\"");
    expect(template).not.toContain('open "$PREVIEW_FILE"');
  });

  test('design family uses project-store fallbacks instead of assuming a home directory', () => {
    const designConsultation = readTemplate('design-consultation');
    const designShotgun = readTemplate('design-shotgun');
    const designHtml = readTemplate('design-html');
    const designReview = readTemplate('design-review');
    const openBrowser = readTemplate('open-gstack-browser');
    expect(designConsultation).toContain('PROJECT_STORE="${GSTACK_HOME:-${HOME:+$HOME/.gstack}}/projects/$SLUG"');
    expect(designShotgun).toContain('PROJECT_STORE="${GSTACK_HOME:-${HOME:+$HOME/.gstack}}/projects/$SLUG"');
    expect(designHtml).toContain('PROJECT_STORE="${GSTACK_HOME:-${HOME:+$HOME/.gstack}}/projects/$SLUG"');
    expect(designReview).toContain('PROJECT_STORE="${GSTACK_HOME:-${HOME:+$HOME/.gstack}}/projects/$SLUG"');
    expect(openBrowser).toContain('_PROFILE_DIR="${HOME:+$HOME/.gstack/chromium-profile}"');
    expect(designReview).toContain('REPORT_DIR="$PROJECT_STORE/designs/design-audit-$(date +%Y%m%d)"');
  });

  test('design-html uses repo-local pretext vendor path and opener helper', () => {
    const template = readTemplate('design-html');
    expect(template).toContain('$_ROOT/design-html/vendor/pretext.js');
    expect(template).toContain('"$GSTACK_BIN/gstack-open-url" "<path-to-finalized.html>"');
    expect(template).not.toContain('$_ROOT/.claude/skills/gstack/design-html/vendor/pretext.js');
  });

  test('open-gstack-browser resolves the extension from the repo root', () => {
    const template = readTemplate('open-gstack-browser');
    expect(template).toContain('$_ROOT/extension/manifest.json');
    expect(template).toContain('_EXT_PATH="$_ROOT/extension"');
    expect(template).not.toContain('.claude/skills/gstack/extension');
  });

  test('setup-browser-cookies surfaces honest fallback paths', () => {
    const template = readTemplate('setup-browser-cookies');
    expect(template).toContain('offer either direct-domain import or `$B connect` as the fallback');
    expect(template).toContain('If the command reports no supported browser or the picker URL cannot be opened');
  });

  test('make-pdf surfaces preview degradation honestly', () => {
    const template = readTemplate('make-pdf');
    expect(template).toContain('tries to open it in your browser');
    expect(template).toContain('`$GSTACK_BIN/gstack-open-url` when that helper exists');
    expect(template).toContain('equivalent temp-root path on this host');
  });

  test('generated Codex ship skill uses host-rewritable design checklist paths', () => {
    const content = fs.readFileSync(path.join(ROOT, '.agents', 'skills', 'gstack-ship', 'SKILL.md'), 'utf-8');
    expect(content).toContain('$GSTACK_ROOT/review/design-checklist.md');
    expect(content).not.toContain('.claude/skills/review/design-checklist.md');
  });
});
