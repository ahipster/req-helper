# One-Week PoC Implementation Plan

## Goal

Deliver one complete vertical slice that can be exercised aggressively in the following war-room week.

The priority is **learning whether the requirements-orchestration model works in practice**, not platform completeness.

## P0 definition

By end of week, one seeded real-world signal must be able to:

1. create a Delivery Subject;
2. clarify outcome/problem;
3. identify/confirm perspectives;
4. assign humans;
5. generate targeted drill questions;
6. capture human answers and extract contributions;
7. synthesize/update structured requirements;
8. detect gaps/conflicts/assumptions;
9. route follow-up/verification tasks;
10. link enterprise knowledge and proposed diffs;
11. split requirements into work packages;
12. generate acceptance criteria and eval definitions;
13. compute deterministic readiness;
14. export final JSON/Markdown package;
15. expose orchestration traces in a war-room view.

## Day 1 — Domain spine

### Deliverables
- project bootstrap;
- PostgreSQL connection/migrations;
- core schemas/entities;
- repository layer;
- Delivery Subject API;
- Perspective model;
- Requirement model with revisions/sources;
- append-only domain event table;
- readiness evaluator skeleton;
- seed data loader.

### Acceptance
- can create/read Delivery Subject;
- original signal is immutable;
- can add perspectives/assignments;
- can create requirement with provenance;
- every mutation writes audit event;
- domain tests run locally.

## Day 2 — UX shell + task model

### Deliverables
- application shell/navigation;
- My Work screen;
- New Signal screen;
- Delivery Overview;
- Drill Workspace 3-pane shell;
- Requirements view;
- Task model/API;
- simple mocked identity picker if real SSO is not trivial;
- streaming chat surface via assistant-ui or equivalent.

### Acceptance
- seeded users can switch roles;
- each user sees only assigned/related tasks by default;
- Delivery Subject remains visible as structured context outside chat;
- human response is persisted independently from model output.

## Day 3 — First agentic loop

### Deliverables
- ModelGateway interface + one configured provider;
- prompt/version infrastructure;
- LangGraph or equivalent graph with:
  - plan_drill;
  - ask_human interrupt;
  - extract_contributions;
  - synthesize_requirements;
  - assess_gaps_conflicts;
- Zod schemas for every AI output;
- orchestration run/step trace persistence.

### Acceptance
- graph can stop waiting for human and resume;
- one human answer can produce multiple contributions;
- contributions retain raw source linkage;
- proposed requirements validate before persistence;
- invalid structured output retries/fails visibly;
- graph loops to another drill when information is missing.

## Day 4 — Multi-perspective convergence

### Deliverables
- perspective proposal/confirmation;
- contribution verification flow;
- gap/assumption/conflict records;
- conflict/decision screen;
- cross-perspective synthesis;
- targeted follow-up routing;
- "I don't know" and "ask someone" actions;
- Bigger Picture view.

### Acceptance
- non-owner contribution is preserved but remains unverified;
- owner can verify/reject/amend;
- contradiction creates explicit Conflict object;
- decision requires named human owner;
- new evidence can reopen affected requirement/perspective.

## Day 5 — Enterprise context + work-package split

### Deliverables
- KnowledgeProvider contract;
- SeedKnowledgeProvider;
- optional one real adapter if trivial in environment;
- knowledge search/link UI;
- proposed diff records/rendering;
- impact analysis node;
- work-package split node/service;
- dependency records.

### Acceptance
- Delivery Subject links to representative enterprise artifacts;
- each reference shows source metadata;
- proposed impacts never overwrite source artifact;
- requirements can split across multiple areas;
- cross-area dependencies remain visible.

## Day 6 — Acceptance, evals, readiness, package

### Deliverables
- acceptance-criteria generator/service;
- eval-definition generator/service;
- readiness evaluator completed;
- Readiness screen;
- work-package detail;
- final package view;
- JSON + Markdown export.

### Acceptance
- critical requirements without ACs block readiness;
- open blocking conflicts/gaps block readiness;
- missing critical perspective ownership blocks readiness;
- package export is generated from persisted domain state, not from one LLM prompt;
- reverse traceability works from package item to source evidence.

## Day 7 — War-room hardening

### Deliverables
- War Room screen;
- trace replay/rerun hooks where safe;
- failure categorization;
- prompt/config version display;
- realistic seed scenario and scripted personas;
- E2E smoke path;
- instrumentation for PoC metrics;
- Docker/container/local setup docs;
- known limitations list.

### Acceptance
- operator can see whether a stuck run is waiting for human vs failed;
- model/schema/tool errors are visible;
- rerunning analysis does not duplicate domain objects blindly;
- seeded scenario can complete end-to-end;
- one command or documented minimal sequence starts the PoC.

## War-room week operating model

Do not treat observed failures as "prompt problems" by default.

Classify every failure:

```text
MODEL        model capability/reliability
PROMPT       unclear/incorrect instruction
CONTEXT      wrong amount/selection/structure of context
KNOWLEDGE    missing/stale/incorrect enterprise source
WORKFLOW     wrong sequencing/routing/wait behavior
DOMAIN_MODEL missing/incorrect business concept or invariant
UX           user cannot understand/perform the task efficiently
OWNERSHIP    wrong/missing authoritative human
```

For each war-room session record:
- scenario/run ID;
- failure category;
- observed symptom;
- root-cause hypothesis;
- change made;
- expected effect;
- result after rerun;
- whether the change should survive PoC.

## Deliberate shortcuts

### Knowledge
Use 20–100 representative artifacts. Do not integrate every repository.

### Identity
Use existing SSO only if already simple; otherwise mock named personas/roles clearly.

### Notifications
In-app task inbox only.

### Search
Start with PostgreSQL text search or deterministic seed lookup. Add embeddings only when a concrete retrieval failure proves the need.

### Orchestration
One bounded LangGraph. Do not build a generic orchestration platform.

### Infrastructure
One deployable app + PostgreSQL. Avoid microservices.

### Diffs
Structured JSON + readable rendering. No reconciliation/write-back yet.

## Implementation backlog

### P0 — must complete
- [ ] DeliverySubject CRUD
- [ ] Perspective + assignment
- [ ] Task inbox
- [ ] Drill workspace
- [ ] ModelGateway
- [ ] plan_drill node
- [ ] human interrupt/resume
- [ ] contribution extraction
- [ ] contribution verification
- [ ] requirement synthesis/revisions
- [ ] provenance links
- [ ] gaps
- [ ] assumptions
- [ ] conflicts
- [ ] decisions
- [ ] knowledge adapter + seed provider
- [ ] proposed diffs
- [ ] work packages
- [ ] dependencies
- [ ] acceptance criteria
- [ ] eval definitions
- [ ] deterministic readiness
- [ ] package export
- [ ] orchestration trace persistence
- [ ] war-room view
- [ ] demo seed
- [ ] core tests

### P1 — only after vertical slice works
- [ ] semantic retrieval/embeddings
- [ ] one real MCP enterprise adapter
- [ ] richer requirement diff UI
- [ ] parallel perspective orchestration optimization
- [ ] package approval workflow
- [ ] basic notification integration
- [ ] reusable prompt-eval dataset
- [ ] per-perspective drill quality analytics

### Future
- [ ] authoritative reconciliation into enterprise repositories
- [ ] downstream SDLC MCP/API handoff automation
- [ ] enterprise SSO/RBAC hardening
- [ ] Camunda/Temporal migration if durable enterprise orchestration requires it
- [ ] full portfolio-level dependency graph
- [ ] organizational learning/reuse across Delivery Subjects

## Coding-agent instruction

Do not wait for every screen or integration to be perfect before wiring the vertical slice. Every day should end with a runnable path that extends the previous day's path. If a dependency is unavailable, implement the adapter interface and a seed/mock implementation so the end-to-end flow remains testable.
