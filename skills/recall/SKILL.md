---
name: recall
description: Search engram project memory for everything known about a topic — decisions, pitfalls, principles, past discussions and sessions. Use when the user asks "did we…", "where did we discuss…", "what do we know about…", or before working in an unfamiliar area of the codebase.
---

# Recall

Topic: $ARGUMENTS

## Steps

1. Call `engram_recall` with the topic as `query`. If the topic maps to a directory or file, also pass `files`.
2. If the results are thin, try once more with synonyms or the narrower technical term (e.g. "login" → "auth session jwt"), and with `include_inactive: true` to surface rejected and superseded history.
3. For the 1–3 most relevant hits, call `engram_get` to read them in full, and `engram_related` if their links look important.
4. Answer the user from what memory says:
   - Lead with the current state (active decisions and principles).
   - Then the history that matters (what was replaced or rejected, and why).
   - Cite memory ids in backticks so they can be looked up.
   - Clearly separate what memory records from what you infer from the code.
5. If memory has nothing, say so plainly — do not invent history. Offer to record what you learn from the code.
