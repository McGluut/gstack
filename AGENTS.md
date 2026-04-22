# gstack - AI Engineering Workflow

gstack is a collection of `SKILL.md` files that give AI agents structured roles for
software development. Each skill is a specialist: CEO reviewer, eng manager,
designer, QA lead, release engineer, debugger, and more.

## Fork Purpose

This repo is the portable fork of upstream `gstack`.

- Original workflow and methodology credit stays with Garry Tan's `gstack`; this fork claims the portability hardening and distribution contract.
- Treat it as a productized distribution, not a maintainer-local workflow dump.
- Infer behavior from explicit prerequisites, outputs, stop conditions, and degrade paths before falling back to maintainer lore.
- When install or update flows mention a canonical remote, prefer this fork's repo surface.
- If a helper binary, browser capability, model integration, or writable state root is unavailable, stop or degrade honestly instead of pretending the happy path exists.

## Off-the-Shelf Contract

- Assume nothing outside this repo. Do not rely on private maintainer context, maintainer-home paths, or one host's default workflow.
- Prefer repo-local helpers and documented commands over inferred local setup.
- If a browser, model, helper binary, or writable state root is unavailable, degrade explicitly and say what is missing.
- Treat live-fire, periodic, or environment-heavy lanes as opt-in. The default promise is the free verification lane.
- Use `bun test` as the stable default verification entrypoint. Use `bun run test:monolithic` only when debugging the legacy Bun runner behavior directly.

## Input Contract

If you are filing feedback or preparing a patch for this fork, optimize for behavioral delta.

- Name the exact skill, command, or doc surface that failed.
- State the host, runtime, OS, shell, and install mode.
- Say which assumption the repo invited you to make.
- Say whether the failure was a path assumption, missing prerequisite, unclear stop condition, routing ambiguity, or dishonest degradation.
- Prefer a small repro over a long narrative.
- If you are proposing text, prefer wording that would have prevented the wrong inference for both a human and an agent.

Low-signal feedback:
- "doesn't work"
- "confusing"
- "better UX please"

High-signal feedback:
- "`/pair-agent` on Windows Git Bash assumed daemon readiness within 15s; the repo promise should either widen the readiness budget or document the slower startup path."

## Available skills

Skills install into host-specific skill directories after setup. Invoke them by name, for example
`/office-hours`. `docs/skills.md` is the deep-dive reference for the full
inventory.

| Skill | What it does |
|-------|--------------|
| `/office-hours` | Start here. Reframes your product idea before you write code. |
| `/plan-ceo-review` | CEO-level review: find the 10-star product in the request. |
| `/plan-eng-review` | Lock architecture, data flow, edge cases, and tests. |
| `/plan-design-review` | Rate each design dimension 0-10 and fix the plan to get there. |
| `/plan-devex-review` | Review developer-facing APIs, CLIs, SDKs, docs, and onboarding before implementation. |
| `/plan-tune` | Tune when gstack should ask follow-up questions and when it should stop. |
| `/design-consultation` | Build a complete design system from scratch. |
| `/design-shotgun` | Generate and compare multiple design directions in the browser. |
| `/design-html` | Turn approved designs into production-ready HTML and CSS. |
| `/review` | Pre-landing PR review. Finds bugs that pass CI but break in prod. |
| `/investigate` | Systematic root-cause debugging. No fixes without investigation. |
| `/design-review` | Design audit plus fix loop with atomic commits. |
| `/devex-review` | Live developer experience audit: test the onboarding and measure friction. |
| `/qa` | Open a real browser, find bugs, fix them, and re-verify. |
| `/qa-only` | Same as `/qa` but report only, with no code changes. |
| `/autoplan` | Run the review pipeline automatically and surface only the final decisions. |
| `/codex` | Get an independent OpenAI Codex review, challenge, or consultation. |
| `/ship` | Run tests, review, push, and open a PR. |
| `/land-and-deploy` | Merge, wait for deploy, and verify production health. |
| `/canary` | Monitor deployed pages for regressions after shipping. |
| `/benchmark` | Baseline page performance before and after changes. |
| `/benchmark-models` | Compare Claude, GPT, and Gemini on the same skill prompt. |
| `/cso` | Run an OWASP plus STRIDE security audit. |
| `/document-release` | Update all docs to match what you just shipped. |
| `/retro` | Weekly retro with per-person breakdowns and shipping streaks. |
| `/learn` | Review, search, prune, and export project learnings. |
| `/context-save` | Save current work state so a later session can resume cleanly. |
| `/context-restore` | Restore the latest saved work state across branches or handoffs. |
| `/health` | Run the code-quality dashboard across the project's checks. |
| `/make-pdf` | Convert markdown into a publication-quality PDF. |
| `/browse` | Headless browser with real Chromium, real clicks, and screenshots. |
| `/open-gstack-browser` | Launch the headed GStack Browser with the sidebar agent. |
| `/setup-browser-cookies` | Import cookies from your real browser for authenticated testing. |
| `/pair-agent` | Share your browser with another AI agent using scoped access. |
| `/setup-deploy` | Detect deploy commands and production health checks for `/land-and-deploy`. |
| `/careful` | Warn before destructive commands like `rm -rf`, `DROP TABLE`, or force-push. |
| `/freeze` | Lock edits to one directory. Hard block, not just a warning. |
| `/guard` | Activate both `/careful` and `/freeze` at once. |
| `/unfreeze` | Remove directory edit restrictions. |
| `/gstack-upgrade` | Update gstack to the latest version. |

## Build commands

```bash
bun install              # install dependencies
bun test                 # run the default free test lane
bun run build            # generate docs + compile binaries
bun run gen:skill-docs   # regenerate SKILL.md files from templates
bun run skill:audit      # audit the public skill contract
bun run skill:check      # generated outputs + skill contract
```

## Key conventions

- `SKILL.md` files are generated from `.tmpl` templates. Edit the template, not the output.
- Run `bun run gen:skill-docs --host codex` to regenerate Codex-specific output.
- The browse binary provides headless browser access. Use `$B <command>` in skills.
- Safety skills (`careful`, `freeze`, `guard`) use inline advisory prose. Confirm before destructive operations.
