# Skills

engram ships six skills. In Claude Code they are installed into `.claude/skills/` and become slash commands; for every other MCP client they are exposed as MCP prompts.

| Skill | When the agent uses it |
| --- | --- |
| `remember-decision` | A decision was made or an option rejected; "remember this", "let's go with…" |
| `recall` | "Did we…?", "where did we discuss…?", entering an unfamiliar area |
| `why-we-did-this` | "Why is X like this?", "why don't we use Y?", before changing an established pattern |
| `avoid-past-mistakes` | Before refactors, migrations, dependency swaps, risky files |
| `project-summary` | Onboarding, "catch me up", after a break |
| `session-handoff` | "Wrap up", "save progress", end of a task |

## Example: `remember-decision`

Records a decision in a fixed shape — *Context · Decision · Why · Alternatives · Consequences* — checks for an earlier decision to supersede, and records seriously considered alternatives as `rejected` decisions linked with `rejected_because`.

## Example: `avoid-past-mistakes`

Summarizes the plan, calls `engram_check` with the plan and files, decides for each warning whether it applies, adjusts the plan or stops to ask, and records new pitfalls if something bites anyway.

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

`$ARGUMENTS` is replaced with what the user typed after the command.
