---
name: avoid-past-mistakes
description: Check a planned change against engram's recorded pitfalls and previously rejected approaches before implementing it. Use before non-trivial changes, refactors, dependency swaps, migrations, or when touching files that have bitten the team before.
---

# Avoid past mistakes

Plan: $ARGUMENTS

## Steps

1. Summarize the plan in one or two sentences and list the files you expect to touch.
2. Call `engram_check` with `plan` and `files`.
3. For every warning returned:
   - Decide whether it really applies to this plan (explain in one line).
   - If it applies, adjust the plan to avoid it, or stop and ask the user if avoiding it is not possible.
   - If a warning is about a **rejected** approach and the plan reintroduces it, say so explicitly and quote the reason it was rejected. Proceed only if the user confirms circumstances changed — then record the reversal with `engram_remember` using `supersedes`.
4. If nothing applies, say "No known pitfalls for this change" and continue.
5. After implementing, if something bit you anyway, record it with `engram_remember` (`kind: pitfall`): what happened, why, how to avoid it, and the files involved.
