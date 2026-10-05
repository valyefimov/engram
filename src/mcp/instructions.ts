/**
 * Sent to the client in the MCP `initialize` response. This is what makes
 * "use engram" enough: the agent learns when to read and when to write.
 */
export const SERVER_INSTRUCTIONS = `Engram is this project's long-term memory: decisions, pitfalls, principles and past sessions, stored locally and shared through git.

When to READ:
- At the start of a task call engram_session_start with the goal. It returns a compact context pack: principles, relevant decisions, known pitfalls and where the last session stopped.
- Before proposing an approach or touching risky code call engram_check with the plan (and files). If it reports a pitfall or a previously rejected approach, tell the user.
- When asked "why is X like this?" or "did we discuss Y?" call engram_why or engram_recall before answering. Prefer recorded history over guessing.

When to WRITE (do it without being asked, briefly tell the user what you stored):
- A decision was made or an option was rejected → engram_remember kind=decision (status=rejected for rejected options) with the reasoning in content.
- Something broke in a non-obvious way, or a fix took several attempts → kind=pitfall: what happened, why, how to avoid it.
- The user states a rule or preference for the codebase → kind=principle.
- A decision replaces an earlier one → pass supersedes=<old id> so the history is kept.
- At the end of meaningful work call engram_session_end with a short summary: what changed, what is unfinished, what to do next.

Write memories for a future reader with no context: specific, self-contained, with the reason. Do not store secrets, credentials or personal data. Do not store what is obvious from the code itself.`;
