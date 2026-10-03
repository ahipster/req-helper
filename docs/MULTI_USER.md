# Multi-User Collaboration

## Goal

Several authorized users must work on the same Delivery Subject simultaneously without sharing one agent session, losing human input, leaking cross-subject data, or silently overwriting authoritative state.

## Collaboration model

```text
Delivery Subject DS-123
  ├─ Architecture / Alice -> AgentThread A -> OpenCode session A
  ├─ Business / Bob       -> AgentThread B -> OpenCode session B
  ├─ Data / Cara          -> AgentThread C -> OpenCode session C
  └─ Delivery Lead        -> overview/readiness subscriptions
```

All threads converge through Firestore domain records.

## Access model

Realtime subject data is not globally visible to every authenticated user.

A user can read subject data when:

- they have active DeliverySubjectMembership, or
- they are ADMIN under PoC policy.

Membership answers access; PerspectiveAssignment answers authority. Global DELIVERY_LEAD capability does not grant access to all subjects.

## My Work across subjects

Do not use a browser collection-group query across authoritative `tasks` collections. Firestore rules are not post-query filters, so a cross-subject query is awkward to reconcile safely with per-subject membership.

Instead the backend maintains:

```text
users/{uid}/taskInbox/{itemId}
```

This is a non-authoritative projection containing only My Work display/routing metadata.

Lifecycle rules:

- Task create/assignment/status change updates the projection;
- reassignment removes the old assignee item and writes the new one;
- subject membership removal/deactivation deletes that subject's projected items for the user;
- browser can read only its own projection;
- opening an item reloads/re-authorizes authoritative subject/task state;
- projection may be rebuilt from authoritative tasks.

## What authorized users share

Depending on role/screen:

- Delivery Subject summary/scope/status;
- perspectives and authority coverage;
- relevant requirements/revisions/provenance/verifications;
- tasks;
- gaps/assumptions/conflicts/decisions;
- enterprise impacts;
- work packages/dependencies;
- readiness;
- recent domain activity.

They do not share one chat transcript by default.

## Thread isolation

Each interaction thread has its own participant, perspective context, current task, user-visible conversation history, OpenCode session ID/generation, Firestore run lease and `contextRevisionPresented`.

## Realtime behavior

```text
Alice answers Architecture task
 -> human answer persists; Task ANSWERED
 -> Task PROCESSING + taskInbox projection updated
 -> OpenCode proposes Requirement revision
 -> validated Firestore transaction commits revision/source/event
 -> Bob's listener receives R-17 rev 4
 -> Alice's My Work projection reflects new Task state
 -> Bob's unsent chat draft remains untouched
 -> if Business is affected, Bob receives a new authoritative Task + inbox item
```

A remote state update updates structured context without silently replacing local unsent input.

## Concurrency rules

### Different AgentThreads

May execute concurrently.

### Same AgentThread

One active harness run. Firestore lease serializes prompts.

### Same domain object

Concurrent proposals may exist, but every semantic command includes revision/idempotency constraints.

Before commit:

1. re-read authoritative state;
2. compare target/domain revision;
3. reject/recompute stale proposals;
4. if competing human positions are incompatible, preserve them and create/reopen Conflict.

Important requirements/decisions never use blind last-write-wins.

## Task concurrency and user feedback

```text
OPEN -> IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED
                     \-> WAITING_ON_OTHER -> IN_PROGRESS
```

The UI distinguishes answer saved, agent processing, waiting for another participant and completed. AgentRun status remains separate.

## Requirement edits while another user is viewing/editing

If a structured object changes remotely while another user has an edit form open:

- do not silently overwrite;
- show current remote revision vs user's base revision;
- allow refresh/reapply/cancel;
- backend rejects stale semantic writes unless explicitly reconciled.

Normal users can inspect Requirement History to understand changes.

## N-party conflict collaboration

When users provide incompatible positions:

1. preserve each Contribution/Evidence;
2. persist Conflict with 2+ structured positions;
3. create participant-specific tasks;
4. participants answer in independent AgentThreads;
5. Conflict Workspace aggregates positions/evidence live;
6. AI may neutrally summarize/options-frame;
7. named human decision owner records Decision or source correction;
8. affected requirements are reassessed.

The Conflict Workspace is a shared view, not a shared OpenCode session.

## Authority during collaboration

- OWNER/DELEGATE may authoritatively verify their assigned perspective.
- CONTRIBUTOR input is useful but non-authoritative until verified.
- REVIEWER may comment/challenge/recommend only.
- WAR_ROOM_OPERATOR may diagnose/rerun but cannot alter assignments unless also ADMIN or subject Delivery Lead.

## Presence

Optional P1 only. Presence is ephemeral UX metadata and never affects ownership/readiness.

## Notifications

P0: private in-app taskInbox projection and live badges/counts.

Future: email/Teams/Slack reminders/escalation.

## Reconnect/offline behavior

At minimum:

- reconnect Firestore listeners after transient network loss;
- show stale/offline indicator where needed;
- do not claim a mutation succeeded until backend confirms authoritative commit;
- preserve local draft text during reconnect;
- re-read current object revision before submitting a structured edit after reconnect;
- treat taskInbox as disposable/read-only and reload authoritative state on navigation.
