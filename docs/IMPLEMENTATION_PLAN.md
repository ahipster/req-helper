# One-Week PoC Implementation Plan

## Goal

Deliver one complete collaborative vertical slice that can be exercised aggressively during the following war-room week.

The priority is learning whether the requirements-orchestration model works in practice, not platform completeness.

## P0 definition

By end of week, one seeded signal must support:

1. create a Delivery Subject;
2. clarify outcome/problem;
3. identify/confirm perspectives;
4. assign multiple humans;
5. open independent participant drill threads;
6. persist answers in Firestore;
7. use OpenCode to extract contributions and synthesize requirements;
8. detect gaps/conflicts/assumptions;
9. route follow-up/verification tasks;
10. show realtime changes to other logged-in users;
11. link enterprise knowledge and proposed diffs;
12. split requirements into work packages;
13. generate acceptance criteria and eval definitions;
14. compute deterministic readiness;
15. export final JSON/Markdown package;
16. expose agent/domain traces in a war-room view.

## Day 1 — GCP/domain spine

### Deliverables
- Next.js/TypeScript project bootstrap;
- Firebase Admin + browser Firestore configuration;
- Firestore emulator/local configuration where feasible;
- core Zod/domain schemas;
- Firestore repository layer;
- Delivery Subject API;
- Perspective, Assignment, Task and Requirement models;
- append-only Event collection;
- readiness evaluator skeleton;
- seed loader.

### Acceptance
- create/read Delivery Subject;
- original signal preserved;
- add perspectives/assignments;
- create requirement with provenance;
- every important mutation writes audit event;
- domain tests run.

## Day 2 — Realtime multi-user UX

### Deliverables
- app shell/navigation;
- My Work;
- New Signal;
- Delivery Overview;
- 3-pane Drill Workspace;
- Requirements view;
- assistant-ui conversation surface;
- identity/persona mechanism;
- Firestore listeners for subject summary, tasks, requirements and blockers.

### Acceptance
- two browser sessions/users can view the same Delivery Subject;
- each sees only relevant work by default;
- update by one participant appears live in the other view;
- structured Delivery Subject state is visible outside chat;
- client cannot directly bypass protected domain mutation rules.

## Day 3 — OpenCode harness

### Deliverables
- AgentHarness interface;
- OpenCode adapter using `@opencode-ai/sdk`;
- AgentThread persistence;
- thread key: deliverySubject + perspective + participant;
- session recreation from Firestore context;
- one-active-run-per-thread lease;
- Vertex provider configuration;
- structured output validation;
- agentRun trace persistence.

### Acceptance
- independent users can run separate OpenCode threads concurrently;
- same thread rejects/queues concurrent prompt attempts;
- lost OpenCode session can be recreated;
- one human answer can create multiple validated contributions;
- invalid AI output cannot mutate authoritative state.

## Day 4 — Convergence loops

### Deliverables
- contribution verification flow;
- requirement synthesis/revision commands;
- gaps, assumptions, conflicts and decisions;
- targeted follow-up routing;
- Bigger Picture view;
- "I don't know" and "ask someone" actions;
- rerun/idempotency handling.

### Acceptance
- non-owner knowledge is preserved but unverified;
- owner can verify/reject/amend;
- contradiction creates explicit Conflict;
- decision requires human owner;
- reruns do not duplicate requirements blindly;
- stale AI commands are rejected or retried when domain revision changed.

## Day 5 — Enterprise context + package split

### Deliverables
- KnowledgeProvider contract;
- SeedKnowledgeProvider;
- optional one real adapter;
- knowledge link UI;
- proposed diffs;
- impact analysis;
- work-package split;
- dependencies.

### Acceptance
- linked references keep source metadata;
- AI impacts never overwrite source systems;
- requirements can span multiple areas;
- dependencies remain visible.

## Day 6 — Acceptance, evals, readiness, exports

### Deliverables
- acceptance criteria generation;
- eval definition generation;
- deterministic readiness complete;
- Readiness screen;
- work-package detail;
- Final Package;
- JSON + Markdown export.

### Acceptance
- blocking conflict/gap prevents READY;
- missing required perspective owner prevents READY;
- critical requirement without AC blocks READY;
- export is constructed from Firestore domain state, not a final free-form prompt;
- reverse traceability works.

## Day 7 — GCP + war-room hardening

### Deliverables
- Cloud Run container/config;
- Firestore rules/indexes reviewed;
- workload identity / ADC config for Vertex/OpenCode;
- War Room screen;
- run/event diagnostics;
- realistic seed personas;
- E2E smoke scenario;
- metrics instrumentation;
- documented known limitations.

### Acceptance
- operator distinguishes waiting-human vs harness/model/domain failure;
- OpenCode restart/session loss is recoverable;
- two or more simultaneous users complete independent drills;
- seeded scenario completes end-to-end;
- deployment has no dependency on local PostgreSQL/LangGraph state.

## Firestore-specific rules

1. Do not put growing arrays of requirements/messages/events on the Delivery Subject document.
2. Use subcollections for growing data.
3. Use transactions for read-modify-write invariants.
4. Use deterministic IDs/idempotency keys for AI proposals where practical.
5. Add composite indexes only for real queries used by the UI.
6. Avoid broad realtime subscriptions; subscribe to relevant slices.
7. Keep large source documents outside Firestore and store reference/summary metadata.
8. Keep a `revision` field on the Delivery Subject and/or affected records for stale-command detection.
9. Store human text and AI outputs separately from authoritative normalized records when needed for audit.
10. Security Rules protect browser access; server-side commands remain authoritative.

## OpenCode-specific rules

1. OpenCode is an executor, not system of record.
2. One active run per AgentThread.
3. Session IDs are recoverable metadata.
4. Context is reconstructed from Firestore on every meaningful run.
5. Tools exposed to OpenCode are allowlisted.
6. Structured output is schema-validated before application commands.
7. Store run metadata for replay/debugging, not hidden chain-of-thought.

## Deliberate shortcuts

### Knowledge
Use 20–100 representative artifacts.

### Identity
Use enterprise SSO only if trivial; otherwise Firebase/Identity Platform or named personas for the PoC.

### Notifications
In-app task inbox only.

### Search
Start with deterministic/Firestore queries and source adapters. Add semantic retrieval only when a concrete failure proves need.

### Orchestration
No LangGraph. Persist tasks/state and use ordinary application control flow around OpenCode.

### Infrastructure
Cloud Run + Firestore + OpenCode + Vertex AI. Avoid additional infrastructure unless required.

### Diffs
Structured data + readable rendering. No authoritative reconciliation/write-back yet.

## P0 backlog

- [ ] Firestore config/emulator
- [ ] DeliverySubject CRUD
- [ ] Perspective + assignment
- [ ] Task inbox
- [ ] realtime subscriptions
- [ ] Drill Workspace
- [ ] assistant-ui integration
- [ ] AgentHarness
- [ ] OpenCode adapter
- [ ] Vertex provider config
- [ ] AgentThread/session mapping
- [ ] thread lease/concurrency guard
- [ ] contribution extraction
- [ ] contribution verification
- [ ] requirement synthesis/revisions
- [ ] provenance
- [ ] gaps/assumptions/conflicts/decisions
- [ ] knowledge adapter + seed provider
- [ ] proposed diffs
- [ ] work packages/dependencies
- [ ] acceptance criteria
- [ ] eval definitions
- [ ] deterministic readiness
- [ ] package export
- [ ] agent/domain event traces
- [ ] war-room view
- [ ] demo seed
- [ ] Firestore rules/indexes
- [ ] Cloud Run deployment
- [ ] core tests

## P1 only after vertical slice

- semantic retrieval/embeddings;
- real MCP enterprise adapter;
- richer diff UI;
- notifications;
- reusable prompt/eval dataset;
- drill quality analytics;
- package approval workflow.

## Future

- authoritative reconciliation into enterprise repositories;
- downstream SDLC MCP/API automation;
- production enterprise SSO/RBAC;
- alternative durable workflow engine only if a concrete scaling/governance need appears;
- relational/event warehouse projection if analytics or cross-subject joins outgrow Firestore.

## Coding-agent instruction

Every day must end with a runnable vertical path. If an external dependency is unavailable, keep the domain contract and use a seed/mock adapter rather than blocking the entire slice.
