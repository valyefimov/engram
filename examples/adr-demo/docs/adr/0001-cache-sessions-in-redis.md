# 1. Cache sessions in Redis

## Status

Superseded by ADR-0003

## Context

Login latency is dominated by the session lookup in Postgres.

## Decision

Store sessions in Redis with a 30-day TTL.

## Consequences

One more service to run. Sessions are lost if Redis loses data.
