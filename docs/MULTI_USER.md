# Multi-User Collaboration

## Goal

Several users must be able to work on the same Delivery Subject simultaneously without sharing one agent session or overwriting each other's authoritative contributions.

## Collaboration model

```text
Delivery Subject DS-123
  ├─ Architecture / Alice -> AgentThread A -> OpenCode session A
  ├─ Business / Bob       -> AgentThread B -> OpenCode session B
  ├─ Data / Cara          -> AgentThread C -> OpenCode session C
  └─ Delivery Lead        -> overview/readiness subscriptions
```

All threads converge through Firestore domain records.

## What users share

Users share live views of:
- Delivery Subject summary/status;
- relevant requirements;
- perspective coverage;
- tasks and assignments;
- gaps/conflicts/decisions;
- enterprise impacts;
- readiness;
- recent domain activity.

They do not need to share one chat transcript.

## What remains private/isolated by default

Each drill thread has its own:
- participant;
- perspective context;
- current task;
- conversation history;
- OpenCode session ID;
- run lease.

A user may explicitly open the bigger picture or other perspectives, subject to authorization.

## Realtime behavior

When a validated mutation is committed to Firestore, relevant listeners update automatically.

Example:

```text
Alice answers Architecture task
  -> API persists answer
  -> OpenCode extracts contribution
  -> Requirement R-17 is revised
  -> Firestore transaction commits revision + event
  -> Bob's UI sees changed requirement
  -> Bob's agent can receive a new follow-up task if Business is affected
```

## Concurrency rules

### Different threads

May execute concurrently.

### Same thread

Only one active harness run. Firestore lease prevents duplicate concurrent prompts.

### Same domain object

AI-generated commands that depend on a previous revision include an expected revision/idempotency key. The application re-reads current state before commit.

If stale:
- reject and recompute, or
- require human resolution if semantic conflict exists.

Do not blindly last-write-wins important requirements/decisions.

## Presence

Presence indicators are optional P1. They are not required for correctness.

If implemented, presence is ephemeral UI metadata such as:
- Alice is viewing Architecture;
- Bob is answering Business task;
- Cara's agent run is processing.

Presence must not determine ownership/readiness.

## Notifications

P0: in-app task inbox and live badges/counts.

Future:
- email/Teams/Slack notifications;
- reminders/escalation;
- owner SLA tracking.

## Authorization

Realtime does not mean globally visible.

PoC may use broad authenticated read access for selected testers, but production should enforce Delivery Subject/team membership and sensitive-perspective policies. The server remains authoritative for mutations even if browsers have direct realtime read access.

## Conflict between human inputs

If two humans provide incompatible knowledge, preserve both contributions and create/refresh a Conflict object. Do not let an LLM silently choose one.

Formal ownership influences who can verify/decide, but does not erase useful non-owner contributions.

## UI expectations

Every screen should tolerate live changes while open.

At minimum:
- use stable document IDs;
- render updated state without resetting the current chat input;
- show small "updated by X" / recent-activity cues where useful;
- when an item being edited changes remotely, surface that fact rather than silently overwriting;
- reconnect Firestore listeners after transient network loss.
