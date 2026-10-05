---
name: session-handoff
description: Close the current working session in engram with a summary the next session can resume from, and save any decisions or pitfalls that came up. Use at the end of a task, before a break, or when the user says "wrap up", "save progress", "we'll continue tomorrow".
---

# Session handoff

Notes from the user (optional): $ARGUMENTS

## Steps

1. Look back over this session. Collect:
   - decisions made or options rejected,
   - pitfalls hit (anything that took more than one attempt),
   - principles the user stated,
   - work left unfinished and the next concrete step.
2. Store anything not yet in memory with `engram_remember` (one memory per item; use `supersedes` when replacing an older decision).
3. Call `engram_session_end` with a summary in this shape:
   ```
   Done: what changed (files / features).
   Decided: ids of decisions recorded.
   Open: what is unfinished or broken.
   Next: the first thing to do next time.
   ```
4. Tell the user, in two or three lines, what you saved.
