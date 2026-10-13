# Skills

engram ships six skills. In Claude Code they are copied into `.claude/skills/` and become slash commands. Other MCP clients get them as MCP prompts.

| Skill | When the agent uses it |
| --- | --- |
| `remember-decision` | A decision was made or an option rejected; "remember this", "let's go with…" |
| `recall` | "Did we…?", "where did we discuss…?", or entering an unfamiliar part of the code |
| `why-we-did-this` | "Why is X like this?", "why don't we use Y?", or before changing an established pattern |
| `avoid-past-mistakes` | Before a refactor, a migration, a dependency swap, or work on risky files |
| `project-summary` | Onboarding, "catch me up", or coming back after a break |
| `session-handoff` | "Wrap up", "save progress", or the end of a task |

## `remember-decision`

It records the decision in a fixed shape: context, decision, why, alternatives, consequences. It first checks for an earlier decision this one replaces. Alternatives that were seriously considered are saved as `rejected` decisions and linked with `rejected_because`.

## `avoid-past-mistakes`

It summarizes the plan and calls `engram_check` with the plan and files. For each warning it decides whether it applies, then either adjusts the plan or stops to ask. If something goes wrong anyway, it records a new pitfall.

## Writing your own

A skill is a folder with a `SKILL.md`:

```markdown
---
name: release-checklist
description: Before cutting a release, recall release pitfalls and principles.
---

1. Call `engram_recall` with `kinds: ["pitfall", "principle"]` and `tags: ["release"]`.
2. …
```

`$ARGUMENTS` is replaced with whatever the user typed after the command.
