# 3. Keep sessions in Postgres

## Status

Accepted. Supersedes ADR-0001.

## Context

A Redis failover logged every user out. The original latency problem was a missing index.

## Decision

Sessions live in Postgres (`sessions` table, indexed by token hash) with an hourly cleanup job.

## Consequences

One less moving part. Session writes share transactions with the rest of the data.
