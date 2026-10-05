---
name: why-we-did-this
description: Explain the historical reasoning behind how something in the project works, using engram's decision timeline — what was decided, what it replaced, what was rejected and why. Use for "why is X like this?", "why don't we use Y?", "who decided…", or before changing an established pattern.
---

# Why we did this

Subject: $ARGUMENTS

## Steps

1. Call `engram_why` with the subject as `topic`. It returns a chronological timeline of decisions (✅ active, ↩️ superseded, ❌ rejected) with their reasons, plus related pitfalls.
2. If the timeline is empty, fall back to `engram_recall` with `include_inactive: true`, then to the code and `git log` for the relevant files.
3. Tell the story briefly, in order:
   - **Today:** what we do and the core reason.
   - **How we got here:** earlier approaches and why they were replaced.
   - **Roads not taken:** rejected options and what killed them.
   - **Scars:** pitfalls that shaped the decision.
4. If the user is about to change this, point out which of those reasons still apply and whether the change would reintroduce a rejected approach.
5. Cite memory ids. If you had to reconstruct the history from git or code, say so — and offer to save it with `engram_remember` so the next person does not have to.
