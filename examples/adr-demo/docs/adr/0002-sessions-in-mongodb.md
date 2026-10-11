---
status: rejected
---
# 2. Store sessions in MongoDB

## Context and Problem Statement

Redis failover dropped all sessions; we looked for a durable alternative.

## Decision Outcome

Rejected: no transactions spanning sessions and the orders table, and a second database to operate.
