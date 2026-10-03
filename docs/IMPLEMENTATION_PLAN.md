# One-Week PoC Implementation Plan

## Goal

Deliver one complete collaborative vertical slice that can be exercised aggressively during the following war-room week.

The priority is learning whether the requirements-orchestration model works in practice, not platform completeness.

## P0 definition

By end of week, one seeded signal must support:

1. create a Delivery Subject;
2. configure PoC users/global roles/perspective templates through Admin UI;
3. clarify outcome/problem;
4. identify/confirm perspectives;
5. assign multiple humans with explicit OWNER/DELEGATE/CONTRIBUTOR/REVIEWER relationships;
6. open independent participant drill threads;
7. persist answers and user-visible thread history in Firestore;
8. use OpenCode to extract contributions and synthesize requirements;
9. refresh OpenCode context from Firestore whenever shared domain state advances;
10. recreate lost OpenCode sessions without losing product state;
11. detect gaps/conflicts/assumptions;
12. route follow-up/verification tasks;
13. show realtime changes to other logged-in users;
14. link enterprise knowledge and proposed diffs;
15. split requirements into work packages;
16. generate acceptance criteria and eval definitions;
17. compute deterministic readiness;
18. export final JSON/Markdown package;
19. expose agent/domain traces in a war-room view.

## Day 1 — GCP/domain spine + configuration

### Deliverables
- Next.js/TypeScript project bootstrap;
- Firebase Admin + browser Firestore configuration;
- Firestore emulator/local configuration where feasible;
- core Zod/domain schemas;
- `UserProfile`, `RoleTemplate`, `PerspectiveTemplate` schemas;
- Firestore repository layer;
- Delivery Subject API;
- Perspective, Assignment, Task and Requirement models;
- append-only Event collection;
- readiness evaluator skeleton;
- seed loader;
- minimal `/admin` route and configuration APIs.

### Acceptance
- create/read Delivery Subject;
- original signal preserved;
- admin can create/edit/deactivate PoC user profiles without raw Firestore editing;
- global roles remain separate from Delivery Subject assignment relationships;
- add perspectives/assignments;
- create requirement with provenance;
- every important mutation writes audit event;
- domain tests run.

## Day 2 — Admin/assignment UX + realtime multi-user UX

### Deliverables
- Admin overview;
- Users/User Detail;
- Role Templates;
- Perspective Catalogue;
- Delivery Subject Assignment screen;
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
- Delivery Lead can assign OWNER/DELEGATE/CONTRIBUTOR/REVIEWER explicitly;
- expertise hints can suggest people but never establish authority automatically;
- required perspective with only CONTRIBUTOR/REVIEWER remains unowned;
- two browser sessions/users can view the same Delivery Subject;
- each sees only relevant work by default;
- update by one participant appears live in the other view;
- structured Delivery Subject state is visible outside chat;
- client cannot directly bypass protected domain mutation rules.

## Day 3 — OpenCode harness + state synchronization

### Deliverables
- AgentHarness interface;
- OpenCode adapter using `@opencode-ai/sdk`;
- AgentThread persistence;
- thread key: deliverySubject + perspective + participant;
- `opencodeSessionId`, `sessionGeneration`, `lastContextRevision`;
- one-active-run-per-thread lease;
- Vertex provider configuration;
- structured output validation;
- agentRun trace persistence;
- ContextEnvelope builder from Firestore;
- session existence check/recreation;
- full hydration on new/recreated session;
- context refresh whenever Delivery Subject revision differs from thread `lastContextRevision`;
- user-visible message persistence independent of OpenCode local state.

### Acceptance
- independent users can run separate OpenCode threads concurrently;
- same thread rejects/queues concurrent prompt attempts;
- lost OpenCode session can be recreated;
- UI thread history still renders after OpenCode session deletion;
- recreated session receives enough Firestore context to continue;
- another user's domain change is supplied to an old thread on its next run;
- one human answer can create multiple validated contributions;
- invalid AI output cannot mutate authoritative state;
- no local OpenCode database replication is required.

Read `docs/OPENCODE_STATE_SYNC.md` as the implementation contract.

## Day 4 — Convergence loops

### Deliverables
- contribution verification flow;
- requirement synthesis/revision commands;
- idempotency keys for AI commands;
- expected domain/object revisions on mutation proposals;
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
- stale AI commands are rejected or retried when domain revision changed;
- semantic collision from parallel threads cannot silently last-write-wins.

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
- expertise hint/global role alone cannot satisfy ownership readiness;
- critical requirement without AC blocks READY;
- export is constructed from Firestore domain state, not a final free-form prompt;
- reverse traceability works.

## Day 7 — GCP + war-room + recovery hardening

### Deliverables
- Cloud Run container/config;
- Firestore rules/indexes reviewed;
- workload identity / ADC config for Vertex/OpenCode;
- War Room screen;
- run/event diagnostics;
- hydration/session-generation diagnostics;
- realistic seed personas;
- E2E smoke scenario;
- metrics instrumentation;
- documented known limitations;
- OpenCode restart/session-loss recovery test.

### Acceptance
- operator distinguishes waiting-human vs harness/model/domain failure;
- OpenCode restart/session loss is recoverable;
- user-visible conversation remains available after OpenCode local state loss;
- stale context is detectable from run metadata;
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
11. Keep global configuration in `users`, `roleTemplates`, and `perspectiveTemplates` root collections.
12. Delivery Subject authority is always represented by explicit assignments, not inferred from templates.

## OpenCode-specific rules

1. OpenCode is an executor, not system of record.
2. One active run per AgentThread.
3. Session IDs are recoverable metadata.
4. Persist `sessionGeneration` and `lastContextRevision`.
5. Context is reconstructed/refreshed from Firestore on every meaningful run.
6. On session loss, recreate and full hydrate.
7. Conversation history needed by users is stored in Firestore.
8. Do not copy/synchronize OpenCode local disk/database wholesale to Firestore.
9. Tools exposed to OpenCode are allowlisted.
10. Structured output is schema-validated before application commands.
11. Store run metadata for replay/debugging, not hidden chain-of-thought.
12. Commands carry idempotency key and revision expectations when they mutate shared state.

See `docs/OPENCODE_STATE_SYNC.md`.

## Deliberate shortcuts

### Knowledge
Use 20–100 representative artifacts.

### Identity/admin
Use enterprise SSO only if trivial; otherwise Firebase/Identity Platform or named personas for the PoC. Build the small Req Helper Admin UI regardless so roles/templates/assignments are visible and editable without raw database changes.

Do not implement SCIM, HR synchronization, nested groups or enterprise IAM policy language in P0.

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
- [ ] UserProfile + global roles
- [ ] RoleTemplate CRUD
- [ ] PerspectiveTemplate CRUD
- [ ] Admin overview/users/roles/perspectives UI
- [ ] Perspective + assignment
- [ ] Delivery Subject assignment UI
- [ ] Task inbox
- [ ] realtime subscriptions
- [ ] Drill Workspace
- [ ] assistant-ui integration
- [ ] AgentHarness
- [ ] OpenCode adapter
- [ ] Vertex provider config
- [ ] AgentThread/session mapping
- [ ] `sessionGeneration`
- [ ] `lastContextRevision`
- [ ] thread lease/concurrency guard
- [ ] ContextEnvelope builder
- [ ] full hydration/session recreation
- [ ] stale-context refresh
- [ ] Firestore user-visible message history
- [ ] contribution extraction
- [ ] contribution verification
- [ ] requirement synthesis/revisions
- [ ] AI command idempotency/revision guard
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
- [ ] hydration/session diagnostics in war-room view
- [ ] demo seed
- [ ] Firestore rules/indexes
- [ ] Cloud Run deployment
- [ ] OpenCode-loss recovery E2E test
- [ ] core tests

## Required sync/concurrency tests

- [ ] OpenCode session deletion does not lose domain state
- [ ] user-visible conversation history survives OpenCode restart
- [ ] recreated session can continue from full Firestore hydration
- [ ] external user change reaches old thread on next run
- [ ] duplicate retry does not duplicate requirement mutation
- [ ] stale mutation is rejected/recomputed
- [ ] two independent threads execute concurrently
- [ ] same-thread parallel execution is blocked by lease
- [ ] expertise hint does not grant authoritative verification

## P1 only after vertical slice

- semantic retrieval/embeddings;
- true context-delta hydration optimization;
- real MCP enterprise adapter;
- richer diff UI;
- notifications;
- reusable prompt/eval dataset;
- drill quality analytics;
- package approval workflow;
- presence indicators.

## Future

- authoritative reconciliation into enterprise repositories;
- downstream SDLC MCP/API automation;
- production enterprise SSO/RBAC/SCIM;
- alternative durable workflow engine only if a concrete scaling/governance need appears;
- relational/event warehouse projection if analytics or cross-subject joins outgrow Firestore.

## Coding-agent instruction

Every day must end with a runnable vertical path. If an external dependency is unavailable, keep the domain contract and use a seed/mock adapter rather than blocking the entire slice.
