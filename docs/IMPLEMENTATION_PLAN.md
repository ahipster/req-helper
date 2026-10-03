# One-Week PoC Implementation Plan

## Goal

Deliver one coherent multi-user vertical slice that can survive aggressive war-room testing without ambiguity in authority, state, provenance or session recovery.

## P0 definition

By end of week, one seeded signal must support:

1. create Delivery Subject from natural language + source links/uploads;
2. clarify problem/outcome/scope/constraints/success measures;
3. manage subject membership/access;
4. identify/confirm required perspectives;
5. assign OWNER/DELEGATE/CONTRIBUTOR/REVIEWER;
6. run independent participant chat/drill threads;
7. persist human answers before AI processing;
8. extract Contributions/Evidence;
9. create Requirement + RequirementRevision + RequirementSource;
10. create revision-bound Verification;
11. detect/manage gaps, assumptions and N-party conflicts;
12. asynchronously gather conflict positions and record human Decision;
13. link KnowledgeReferences and ProposedDiffs;
14. split into targeted WorkPackages;
15. define requirement/package/subject acceptance criteria and evals;
16. compute deterministic readiness;
17. show realtime changes to other authorized users;
18. recover from OpenCode session loss/staleness;
19. expose normal-user requirement history;
20. expose JSON/Markdown export and read-only package APIs;
21. expose war-room run/context diagnostics.

## Day 1 — Canonical domain + Firestore spine

### Deliverables

- Next.js/TypeScript bootstrap;
- Firebase Admin/browser config + emulator;
- canonical Zod schemas from `src/domain/schemas.ts`;
- Firestore repository layer;
- DeliverySubject CRUD with `revision`;
- SourceArtifact metadata/GCS-or-link abstraction;
- Membership, Perspective, Assignment, Task;
- Requirement, RequirementRevision, RequirementSource;
- Evidence, Verification;
- Event collection;
- readiness evaluator/tests;
- seed loader.

### Acceptance

- `initialSignal` immutable;
- scope fields persist;
- subject access and perspective authority are distinct;
- all material mutations increment subject revision and append event;
- manual requirement edit creates revision and invalidates old-revision readiness verification;
- tests compile/pass.

## Day 2 — Multi-user UX + admin

### Deliverables

- My Work;
- New Signal + Clarify Scope;
- Delivery Overview;
- member/assignment management;
- Admin Users/Roles/Perspective templates;
- 3-pane Drill Workspace;
- Requirements + History drawer;
- Firestore listeners scoped to authorized data.

### Acceptance

- two users on same subject receive live structured updates;
- a non-member cannot read subject data;
- a WAR_ROOM_OPERATOR without Delivery Lead/Admin rights cannot change assignments;
- reviewer UI is visibly advisory;
- remote update does not erase unsent chat draft;
- stale edit warning appears when current object revision changed.

## Day 3 — OpenCode harness + task lifecycle

### Deliverables

- AgentHarness/OpenCode adapter;
- one logical AgentThread per subject + perspective + participant;
- session generation + lease;
- `contextRevisionPresented` semantics;
- Vertex provider config;
- ContextEnvelope builder;
- user-visible message persistence;
- task state machine:
  `OPEN -> IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED`;
- AgentRun traces.

### Acceptance

- human answer is durable before model call;
- model failure leaves retriable human work;
- lost session recreates and FULL hydrates;
- same thread cannot run twice concurrently;
- independent threads can run concurrently;
- same-run `domainRevisionAtEnd` is not falsely written as context presented.

## Day 4 — Convergence, provenance and conflict mechanics

### Deliverables

- Contribution/Evidence extraction;
- requirement synthesis/revision service;
- provenance service (`RequirementSource`);
- revision-bound Verification flow;
- gap/assumption flow;
- N-party Conflict positions;
- async conflict workspace/tasks;
- Decision recording;
- rerun/idempotency/stale-command handling.

### Acceptance

- non-owner contribution retained but not authoritative;
- OWNER/DELEGATE can verify current revision;
- Reviewer cannot satisfy authoritative verification;
- requirement change makes old verification ineligible;
- 3-party conflict represented without pairwise hacks;
- duplicate rerun cannot duplicate domain mutation;
- stale command rejected/recomputed.

## Day 5 — Enterprise context + downstream work split

### Deliverables

- KnowledgeProvider + seed adapter + optional real adapter;
- KnowledgeReference UI;
- ProposedDiff lifecycle/verification;
- impact analysis;
- WorkPackage target area/team/coordinator;
- dependencies;
- conflict/impact links.

### Acceptance

- source metadata/version preserved;
- large source documents not stored directly in Firestore;
- ProposedDiff never writes back to source system;
- each populated work package has targetAreaRef;
- unresolved `blocking=true` dependency blocks READY even when owned.

## Day 6 — Acceptance, evals, readiness, handoff

### Deliverables

- generalized AcceptanceCriterion target type;
- generalized Evaluation target type;
- deterministic readiness complete;
- Readiness screen;
- Final Package;
- JSON + Markdown export;
- read-only package/work-package APIs;
- reverse traceability.

### Acceptance

- all required perspectives must be confirmed and owned;
- current-revision verification/provenance enforced;
- blocking gaps/conflicts/assumptions/dependencies/tasks block READY;
- package acceptance can span multiple requirements;
- package API is generated from persisted state, not one final free-form prompt.

## Day 7 — GCP + war-room hardening

### Deliverables

- Cloud Run config;
- Firestore rules/index review;
- workload identity/ADC for OpenCode→Vertex;
- GCS/source-artifact config if uploads used;
- War Room screen;
- run/context/session diagnostics;
- realistic seeded personas and 3-party conflict;
- E2E smoke/recovery tests;
- known limitations.

### Acceptance

- war-room operator can distinguish MODEL/PROMPT/CONTEXT/KNOWLEDGE/WORKFLOW/DOMAIN_MODEL/UX/OWNERSHIP/CONCURRENCY;
- OpenCode restart/session deletion recovers;
- another user's state change refreshes stale session context;
- two+ simultaneous users complete independent drills;
- seed scenario reaches package generation after blockers are resolved.

## Canonical rules coding agents must not reinterpret

1. Firestore is system of record.
2. `contextRevisionPresented` means what OpenCode actually saw, not latest domain state.
3. Membership controls subject access; assignment controls perspective authority.
4. Reviewer is advisory.
5. Requiredness belongs to Perspective, not Assignment.
6. Task enum/state machine is exactly the canonical schema.
7. Conflict is N-party.
8. Requirement provenance is first-class RequirementSource.
9. Verification is immutable/current-revision specific.
10. Human and AI requirement edits use the same revision service.
11. `blocking=true` dependency must be resolved before READY.
12. WorkPackage target implementation area is separate from human coordinator.
13. Acceptance/evals can target Requirement, WorkPackage or DeliverySubject.
14. `priority` is urgency; `criticality` is consequence-if-wrong.
15. large source files live outside Firestore.

## Firestore-specific rules

- small aggregate root document;
- growing/history/relations in subcollections;
- transactions for invariant-sensitive writes;
- deterministic IDs/idempotency keys for AI mutations;
- narrow realtime subscriptions;
- membership-aware security rules;
- append-only events for meaningful mutations.

## OpenCode-specific rules

- executor, not system of record;
- one active run per AgentThread;
- session ID recoverable metadata;
- full bounded hydration whenever shared revision changed in P0;
- allowlisted tools only;
- schema-validated output before commands;
- no hidden chain-of-thought persistence.

## P0 backlog

- [ ] canonical schemas/state machines
- [ ] Firestore config/emulator
- [ ] DeliverySubject + scope/revision
- [ ] SourceArtifact/GCS-or-link
- [ ] Membership/access
- [ ] Perspective + assignment
- [ ] Admin UI
- [ ] Task inbox/state machine
- [ ] realtime subscriptions/security rules
- [ ] Drill Workspace
- [ ] assistant-ui integration
- [ ] AgentHarness/OpenCode/Vertex
- [ ] AgentThread/session generation/lease
- [ ] contextRevisionPresented
- [ ] Contribution/Evidence
- [ ] RequirementRevision/RequirementSource
- [ ] Verification
- [ ] gaps/assumptions
- [ ] N-party conflicts/decisions
- [ ] KnowledgeProvider/ProposedDiff
- [ ] WorkPackages/target area/dependencies
- [ ] generalized acceptance/evals
- [ ] deterministic readiness
- [ ] requirement history
- [ ] package export/read APIs
- [ ] war-room traces
- [ ] recovery/idempotency/concurrency tests
- [ ] Cloud Run deployment

## P1 only after vertical slice

- true delta context hydration;
- semantic retrieval/embeddings;
- notifications/escalation;
- real enterprise directory sync;
- richer diff visualizations;
- approval workflow;
- analytics warehouse projection.

## Coding-agent instruction

Every day ends with a runnable vertical path. When docs and code disagree, `src/domain/schemas.ts` + `docs/DOMAIN_MODEL.md` are canonical; fix the conflicting artifact rather than inventing a third interpretation.
