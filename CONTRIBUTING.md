# Contributing to Dewmix Hardware

Welcome. Read this once, then `CLAUDE.md`, then start shipping.

## Before your first commit

1. Read `README.md` (setup) → `SETUP.md` (what's done) → `TODO.md` (what's next).
2. Read `CLAUDE.md` — it's the engineering constitution. Every rule there is enforced in code review.
3. Read `ARCHITECTURE.md` for the big-picture reasoning behind decisions.

## Workflow

### Branches

- `main` — production-ready code, deploys when tagged
- `dev` — integration branch, all feature branches merge here first
- `feat/<name>` — new features (e.g. `feat/checkout-mpesa`)
- `fix/<name>` — bug fixes
- `chore/<name>` — refactors, dependency bumps, tooling

### Commits

Use conventional commits:

```
feat(cart): add quantity stepper
fix(auth): handle expired refresh tokens
chore(deps): bump prisma to 5.20
docs(setup): clarify M-Pesa setup
```

### Pull requests

Every PR must:

- [ ] Pass `pnpm lint`
- [ ] Pass `pnpm typecheck`
- [ ] Pass `pnpm test` (or add tests for new code)
- [ ] Tested locally in light AND dark mode (web changes)
- [ ] Tested at 360px width (web changes)
- [ ] Have a description: what changed, why, how to test
- [ ] Reference the issue or TODO item being closed

### Code review

- Review every line. Don't approve code you can't explain.
- AI-generated code is fine — but the author understands every line, and the reviewer reads every line.
- Reviewers: be specific. "This is wrong" is not feedback. "This will N+1 because…" is.

## Folder conventions (the short version)

| Goal | Where it lives |
|---|---|
| New API endpoint | `apps/api/src/modules/<feature>/` |
| New page | `apps/web/src/app/<route>/page.tsx` |
| New shared UI primitive | `apps/web/src/components/ui/` |
| New feature-specific component | `apps/web/src/components/<feature>/` |
| Database change | `packages/db/prisma/schema.prisma` |
| Shared type / Zod schema | `packages/types/src/` |
| Pure helper function | `packages/utils/src/` |

## Working with AI

This codebase is designed for AI-assisted development. The patterns:

1. **Start every feature with a plan, not code.** Ask Claude/Cursor to read `CLAUDE.md`, then to outline the implementation.
2. **One AI session per feature/PR.** Don't mix concerns.
3. **AI writes the first draft, you review every line.** If you can't explain it, don't merge it.
4. **AI generates tests alongside code.** Especially for money handling and inventory.
5. **AI does first-pass code review on your own PRs** before requesting human review.

## Definition of done

A feature is done when:
- It works end-to-end on a fresh `pnpm install && pnpm docker:up && pnpm dev`
- It has tests for the happy path and the 3 most likely failure modes
- Its module's README is updated (or created)
- The relevant section of `SETUP.md` is checked off
- `TODO.md` is updated if the work spawned new TODOs
- It's been manually tested in both themes and at mobile width

## Getting unstuck

- Tech question → check `ARCHITECTURE.md` first, ask in the team chat
- Convention question → check `CLAUDE.md`
- Pattern question (how do I add an endpoint?) → look at how `catalog/products/` did it, copy the pattern
- Business question (should we do X?) → ask the product owner

## Questions

This document evolves. If something's unclear, fix it in a PR.
