---
name: project-summary
description: Give an up-to-date overview of the project from engram memory — principles, key decisions, pitfalls, hotspots and recent sessions. Use when onboarding someone, starting work after a break, or when the user asks "what's the state of the project?" or "catch me up".
---

# Project summary

Focus (optional): $ARGUMENTS

## Steps

1. Call `engram_summary` (use `detail: "full"` if the user wants depth or is onboarding).
2. If a focus area was given, also call `engram_context` with it as `task` to pull the relevant decisions and pitfalls.
3. Present it as a briefing, not a dump:
   - **What this project is** (one or two sentences — from facts/README if memory lacks it).
   - **Rules of the road:** principles that every change must respect.
   - **Architecture in decisions:** the 5–8 decisions that shape the code, one line each, with ids.
   - **Watch out for:** pitfalls and hotspots.
   - **Where we left off:** the last sessions and any unfinished work they mention.
4. End with gaps you noticed (e.g. "no decisions recorded about deployment") and offer to fill them.
