---
name: remember-decision
description: Record an architectural or product decision in engram project memory — what was decided, the alternatives, and why. Use when a decision was just made or an option was rejected, or when the user says "remember this", "let's go with", "we decided", "don't do X".
---

# Remember a decision

Capture the decision so a future session (or teammate) can understand it without this conversation.

Decision to record: $ARGUMENTS

## Steps

1. **Check for history first.** Call `engram_recall` with the topic (`include_inactive: true`). If an earlier decision on the same topic exists and this one replaces it, you will pass its id as `supersedes`.
2. **Write the decision** with `engram_remember`:
   - `kind`: `decision`
   - `title`: the decision itself, specific and searchable — "Store sessions in Postgres, not Redis", not "Session storage".
   - `content`, in this shape:
     ```
     Context: what problem forced a choice.
     Decision: what we do now.
     Why: the reasons that won.
     Alternatives: what else was considered and why it lost.
     Consequences: what this makes easier / harder; when to revisit.
     ```
   - `tags`: 1–4 lowercase topics (`auth`, `db`, `api`…).
   - `files`: the main files the decision governs, if any.
   - `importance`: 4–5 if other code depends on it, 3 otherwise.
3. **Record rejected options separately** when they were seriously considered: `kind: decision`, `status: rejected`, and link them to the chosen one with `engram_link` (`rejected_because` → the decision or pitfall that killed them). This is what makes "why didn't we use X?" answerable later.
4. **Confirm in one line** to the user: the id and title you stored.

Do not store secrets, credentials or personal data. Do not record trivial choices (naming a local variable) — only what a newcomer would otherwise get wrong.
