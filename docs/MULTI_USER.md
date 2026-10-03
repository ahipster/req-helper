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

All threads converge through Firestore domain records. Published requirement/architecture baselines are shared read-only reference state; subject requirements/impacts are collaborative proposed state.

## Access model

A user can read subject data when they have active DeliverySubjectMembership or are ADMIN under PoC policy.

Membership answers access; PerspectiveAssignment answers authority. Global DELIVERY_LEAD capability does not grant access to all subjects.

Published ArchitectureBaseline data is signed-in reference data in the PoC. Architecture ingestion run administration is separate from subject collaboration.

## My Work across subjects

Backend maintains:

```text
users/{uid}/taskInbox/{itemId}
```

This is a non-authoritative projection. Task create/reassignment/status updates the projection; access removal cleans it up; opening an item reloads/re-authorizes authoritative task/subject state.

## What authorized users share

Depending on role/screen:

- Delivery Subject summary/scope/status;
- pinned Requirement Profile and architecture policy;
- pinned ArchitectureBaseline identity/version/fingerprint;
- relevant requirements/revisions/provenance/verifications;
- RequirementArchitectureImpacts and ArchitectureChangeProposals;
- work-package implementation targets;
- tasks/gaps/assumptions/conflicts/decisions;
- knowledge impacts/work packages/dependencies/readiness;
- recent domain activity.

They do not share one chat transcript by default.

## Thread isolation

Each interaction thread has its own participant/perspective/task, user-visible messages, OpenCode session ID/generation, run lease and `contextRevisionPresented`.

Architecture ingestion is not a participant AgentThread. It has separate ArchitectureIngestionRun state.

## Realtime behavior

Example:

```text
Alice answers Architecture task
 -> answer durable; Task ANSWERED
 -> PROCESSING
 -> OpenCode proposes RequirementArchitectureImpact:
      R-17 rev3 -> app.customer-api MODIFY
 -> backend persists PROPOSED impact
 -> Alice confirms after seeing topology/source evidence
 -> impact becomes CONFIRMED
 -> Delivery Lead/other authorized listeners see updated impact live
 -> WorkPackage can now link implementation target
 -> unsent drafts in other users' sessions remain untouched
```

Remote state updates structured context without silently replacing local unsent input.

## Architecture baseline changes while users work

A published normalized baseline is immutable, but a newer baseline may become current globally while a subject is active.

```text
DS-123 pins AB-9 v9
Architecture admin publishes AB-10 v10
 -> subject context remains explicitly pinned to AB-9
 -> application marks/reports STALE_BASELINE where current-policy rules require refresh
 -> existing impacts remain auditable but no longer satisfy readiness until reassessed
 -> users see stale warning rather than silent topology replacement
```

Do not silently replace the topology underneath an open impact-review form.

If a user is reviewing impact against AB-9 and the subject is rebased to AB-10, backend rejects the stale confirmation and UI offers refresh/review against current pinned baseline.

## Concurrency rules

### Different AgentThreads
May execute concurrently.

### Same AgentThread
One active run; Firestore lease serializes prompts.

### Same requirement/impact/change object
Concurrent proposals may exist, but commands include target revision/baseline/idempotency constraints. Before commit, re-read authoritative state and reject/recompute stale operations.

### Architecture baseline publication
Architecture admin workflows must use version/current-pointer compare-and-set so concurrent ingestion runs cannot both silently become current.

## Task states and feedback

```text
OPEN -> IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED
                     \-> WAITING_ON_OTHER -> IN_PROGRESS
```

UI distinguishes answer saved, agent processing, waiting and completed. AgentRun status remains separate.

## Requirement edits while architecture impacts exist

If requirement semantics/capability links change:

1. save a new RequirementRevision;
2. preserve prior architecture impacts for audit;
3. impacts tied to old requirement revision no longer satisfy readiness;
4. create targeted architecture-impact reassessment where policy requires;
5. show updated impacts live to other members.

Do not silently carry old impact confirmation to a new semantic requirement revision.

## Architecture impact collaboration

AI-proposed impact is collaborative proposal state, not authoritative routing.

1. model proposes impact against exact requirement revision + architecture baseline;
2. impact view shows traversal and Git source evidence;
3. appropriate OWNER/DELEGATE/system/architecture reviewer confirms/rejects/corrects;
4. confirmation is stored with actor;
5. work-package target is created only from confirmed impact where profile requires it.

`VERIFY_ONLY` remains distinct from a code-change target.

A repository/team is shown as confirmed routing only when normalized topology supports that link.

## N-party conflict collaboration

Incompatible positions are preserved, represented by Conflict with 2+ positions and participant-specific tasks. Conflict may include architecture impact/topology interpretations in addition to requirement/knowledge positions.

Shared Conflict Workspace is a view, not a shared OpenCode session.

## Authority during collaboration

- OWNER/DELEGATE may authoritatively verify assigned perspective.
- Architecture/System OWNER/DELEGATE can confirm relevant subject impact according to application authorization.
- CONTRIBUTOR input is non-authoritative until verified/confirmed.
- REVIEWER is advisory.
- ADMIN architecture baseline publishing does not automatically make that admin the subject Architecture OWNER.
- WAR_ROOM_OPERATOR diagnoses/reruns but does not gain assignment/publishing authority automatically.

## Presence / notifications

Presence is optional P1 and non-authoritative.

P0 notifications are taskInbox + live badges/counts. Future email/Teams/Slack remains out of scope.

## Reconnect/offline behavior

At minimum:

- reconnect Firestore listeners;
- show stale/offline indicators;
- do not claim mutation succeeded until backend commit confirms;
- preserve local draft text;
- re-read current object revision and requirement/architecture baseline before structured submit;
- treat taskInbox as disposable/read-only and reload authoritative state on navigation.
