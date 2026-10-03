# One-Week PoC Implementation Plan

## Goal

Deliver one coherent multi-user vertical slice that proves Req Helper can turn an idea into an explicit, profile-compliant **change set over current requirements, knowledge and architecture**, and can explain where implementation/verification should be directed from source-grounded current topology.

## P0 definition

By end of week, one seeded signal must support:

1. create Delivery Subject and classify subject kind;
2. suggest/select/pin a published Requirement Profile version;
3. clarify problem/outcome/scope;
4. discover current requirement catalogue + knowledge candidates;
5. ingest one or more Git Markdown architecture repositories at exact commits;
6. use LLM-assisted extraction to produce an ArchiMate-inspired normalized graph;
7. deterministically reconcile/validate and publish one immutable ArchitectureBaseline;
8. pin the subject to that exact architecture baseline when profile requires it;
9. find active requirement proposals in other Delivery Subjects;
10. classify each requirement effect as CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE;
11. pin exact requirement/knowledge/architecture baselines;
12. surface duplicate/overlap/contradiction matches;
13. link capabilities;
14. run requirement-to-architecture impact analysis over bounded current topology;
15. human-confirm/reject system/component/API impacts;
16. route work packages to confirmed implementation targets and repo/team where topology provides them;
17. manage access/perspective authority;
18. run independent assistant-ui drill threads;
19. use Tool UI for known domain actions including architecture impacts/evidence;
20. use form copilot for structured drafts;
21. use constrained Generative UI for bigger-picture/current-vs-proposed/system-context views;
22. persist Contributions/Evidence/RequirementRevision/RequirementSource/Verification;
23. evaluate profile-specific typed requirement + architecture completeness rules;
24. detect/manage gaps/assumptions/N-party conflicts/decisions;
25. persist version-pinned Knowledge ProposedDiffs and ArchitectureChangeProposals;
26. define revision-aware acceptance/evals;
27. compute deterministic readiness including requirement/architecture baseline and routing checks;
28. realtime multi-user collaboration + My Work projection;
29. recover from OpenCode session loss/staleness;
30. export/serve explicit change-set package.

## Deliberate PoC limits

- **architecture source: Git Markdown only; Sparx is out of scope**;
- architecture ingestion: one/two representative repositories around the seeded scenario, not enterprise-wide migration;
- normalized model: useful ArchiMate subset + delivery extensions, not full ArchiMate metamodel/editor;
- LLM ingestion: exact-commit, source-evidence-backed extraction; no automatic source Git write-back;
- catalogue: seed/import tens or low hundreds of representative current requirements;
- matching: capability/type/source filters + model/semantic similarity sufficient for PoC; no vector DB unless needed;
- Requirement Profiles: typed rules in current schema, not arbitrary DSL/JavaScript;
- no automatic promotion from HANDED_OFF to current requirement/architecture baseline;
- Interactables only for non-authoritative scratch state.

## Day 1 — Canonical domain + baseline fixtures

### Deliverables

- canonical Requirement/current-vs-proposed schemas;
- `src/domain/architecture.ts` schemas;
- RequirementProfile + immutable versions + architecture policy;
- RequirementCatalogItem + immutable versions;
- RequirementChangeProposal / Match / QualityFinding;
- ArchitectureSource / IngestionRun / Baseline / Element / Relationship / View / Finding;
- DeliverySubjectArchitectureContext;
- RequirementArchitectureImpact / ArchitectureChangeProposal / WorkPackageImplementationTarget;
- Firestore collections/rules/helpers;
- seed API Change profile/current requirements;
- create a small representative architecture Git fixture/repository subset for Customer Verification scenario with 10–30 meaningful elements/relationships.

### Acceptance

- current requirement/architecture baselines and subject proposals are separate records;
- subject cannot mutate current baseline through normal commands;
- published profile/architecture baseline is immutable;
- every seeded architecture element/relationship can point to source repo/commit/path evidence;
- subject profile can say architecture is required or not required.

## Day 2 — Git Markdown architecture ingestion

### Deliverables

- Git source reader against approved repository access;
- exact commit resolution;
- Markdown file listing/fingerprinting/change detection;
- deterministic front matter/link hints;
- `ingest-architecture-markdown` OpenCode skill;
- schema-validated document extraction;
- deterministic reconciler:
  - stable key resolution;
  - endpoint resolution;
  - duplicate/conflicting definition findings;
  - unresolved reference findings;
  - EXPLICIT vs INFERRED evidence handling;
- ingestion run persistence;
- architecture ingestion findings;
- baseline publish service;
- Architecture admin/run/finding screen.

### Acceptance

- same exact source commits produce reproducible source metadata;
- model cannot publish baseline;
- every relationship endpoint resolves before publication;
- every published object has source evidence;
- inferred material relation is visibly reviewable;
- blocking unresolved/duplicate/conflicting topology prevents publication;
- changed-file ingestion can reuse unchanged normalized data only when fingerprints still match;
- one ArchitectureBaseline successfully publishes from seeded Markdown.

## Day 3 — Existing-truth discovery + architecture impact

### Deliverables

- current requirement lookup by type/capability/context/semantic query;
- active proposal lookup across open Delivery Subjects;
- RequirementMatch persistence/classification;
- CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE classification service;
- stale requirement/knowledge baseline detection/rebase flow;
- DeliverySubjectArchitectureContext pinning/stale detection;
- bounded architecture query/traversal service;
- `assess-architecture-impact` skill;
- RequirementArchitectureImpact persistence;
- architecture impact confirmation/correction;
- ArchitectureChangeProposal persistence;
- Requirement Catalogue + Change Set + Architecture Impact UIs.

### Acceptance

- likely existing requirement offered before CREATE;
- two active subjects changing same baseline surfaced;
- subject can pin exact architecture baseline version/fingerprint;
- architecture impact traces to element + source relationships/evidence;
- no repository/team is presented as confirmed merely because the model guessed it;
- requirement semantic/capability changes can reopen targeted impact analysis;
- architecture baseline advance can make subject context/impact stale.

## Day 4 — assistant-ui interaction layer + admin/profile controls

### Deliverables

- assistant-ui conversation shell;
- Tool UIs:
  - existing requirement match;
  - requirement change proposal;
  - verification/evidence;
  - architecture impact proposal/confirmation;
  - architecture source evidence;
  - architecture change proposal;
  - conflict/decision;
  - knowledge diff;
  - profile gap;
- form copilot for Scope/Requirement/Decision/WorkPackage/Profile drafts;
- constrained Generative UI vocabulary for Bigger Picture/current-vs-proposed/system context/application cooperation/implementation impact;
- Admin Requirement Profile editor/version publish including architecture policy;
- profile compare/subject upgrade preview.

### Acceptance

- Tool UI actions route through typed backend commands;
- form copilot only edits draft state until human save/publish;
- Generative UI cannot mutate architecture/requirements or emit arbitrary JS;
- architecture nodes/edges can show source evidence;
- published profile version stays immutable;
- subject pinned to v8 does not silently adopt v9.

## Day 5 — Multi-user drills, convergence and work routing

### Deliverables

- Membership/Perspective/Assignment/Task;
- private taskInbox projection;
- AgentHarness/OpenCode/Vertex;
- AgentThread lease/session generation/contextRevisionPresented;
- Contribution/Evidence extraction;
- RequirementRevision/RequirementSource service;
- revision-bound Verification;
- profile evaluation -> RequirementQualityFinding;
- gaps/assumptions/N-party conflicts/Decision;
- Knowledge ProposedDiff review;
- WorkPackage grouping;
- WorkPackageImplementationTarget linking confirmed architecture impacts;
- stale command/idempotency handling.

### Acceptance

- human answer durable before model invocation;
- OWNER/DELEGATE verification only counts for current proposal revision;
- requirement impact confirmation is human-visible and source-grounded;
- work package traces requirement -> impact -> architecture element -> repo/team when available;
- 3-party conflict persists all positions;
- duplicate rerun cannot duplicate mutations;
- lost OpenCode session FULL rehydrates profile + requirement baseline + architecture context.

## Day 6 — Acceptance / readiness / package

### Deliverables

- generalized AcceptanceCriterion/Evaluation;
- profile-required eval/acceptance rules;
- deterministic readiness including:
  - profile pinned/findings;
  - change classification;
  - stale requirement baseline;
  - unreviewed matches;
  - architecture baseline pin/current state when required;
  - stale architecture impact/change proposals;
  - confirmed impact for HIGH/CRITICAL when required;
  - trusted topology for confirmed impact when required;
  - implementation target for HIGH/CRITICAL when required;
- Final Package/JSON/Markdown/read APIs;
- reverse traceability to baseline/source commits/proposals/impacts.

### Acceptance

- profile not requiring architecture does not fail architecture checks;
- profile requiring architecture blocks without pinned baseline;
- confirmed impact cannot rely on disallowed NEEDS_REVIEW topology;
- stale architecture context/impact blocks READY when architecture required;
- package identifies exact architecture baseline/source commits and confirmed implementation targets;
- package never implies HANDED_OFF == current baseline/source Git promoted.

## Day 7 — GCP + war-room hardening

### Deliverables

- Cloud Run/Firestore/Vertex deployment config;
- approved Git source access/configuration;
- requirement catalogue/profile seed/import utilities;
- war-room traces with profile/requirement/architecture baseline metadata;
- architecture ingestion run/finding diagnostics;
- simultaneous-user tests;
- stale requirement/architecture baseline tests;
- profile upgrade/session recovery tests;
- realistic seeded scenario end-to-end;
- known limitations.

### Acceptance

- CI typecheck/tests green;
- two users work independently and see structured changes live;
- non-member cannot read subject;
- architecture source credentials are backend-only;
- baseline ingestion can be rerun/recovered;
- current requirement catalogue and architecture baselines remain unchanged through READY/HANDED_OFF;
- subject package reconstructs entirely from persisted domain state.

## Canonical rules coding agents must not reinterpret

1. Firestore is the system of record for PoC domain state.
2. Requirement Catalogue CURRENT and Delivery Subject PROPOSED are different concepts.
3. Git Markdown is the only P0 architecture source; do not add Sparx work.
4. Source Git remains authoritative; normalized architecture is derived.
5. LLM extraction must retain source evidence and EXPLICIT/INFERRED mode.
6. Model never publishes ArchitectureBaseline or silently merges ambiguous systems.
7. Published ArchitectureBaseline is immutable and exact-commit/fingerprint pinned.
8. Requirement-to-system routing must use normalized current topology, not free-form guessing.
9. Every subject requirement is contextualized by RequirementChangeProposal.
10. MODIFY/SUPERSEDE/RETIRE/NO_CHANGE pin exact baseline version.
11. CREATE requires existing-requirement/active-proposal search when profile says so.
12. Blocking unreviewed duplicate/contradiction match prevents READY.
13. Subject pins profile version; upgrades are explicit.
14. Architecture completeness is profile-controlled.
15. RequirementArchitectureImpact is both requirement-revision and architecture-baseline specific.
16. `VERIFY_ONLY` is not a code-change target.
17. WorkPackageImplementationTarget references confirmed impact; repo/team links are only present when topology supports them.
18. ArchitectureChangeProposal is future state; no Git write-back in P0.
19. Tool UI/form copilot/generative UI never bypass backend commands.
20. `contextRevisionPresented` means what OpenCode actually saw.
21. Membership controls access; PerspectiveAssignment controls authority.
22. Verification/acceptance/evals are proposal-revision specific.
23. Conflicts are N-party.
24. `blocking=true` unresolved means NOT_READY.
25. My Work taskInbox is a rebuildable read projection only.

## P0 backlog

- [ ] requirement profile/version + architecture policy
- [ ] requirement catalogue/version + seed current requirements
- [ ] ArchitectureSource / ingestion / baseline schemas
- [ ] Git Markdown source reader
- [ ] exact commit/file fingerprinting
- [ ] ingest-architecture-markdown skill
- [ ] deterministic architecture reconciler/findings
- [ ] Architecture baseline publish service
- [ ] Architecture Admin/current baseline UI
- [ ] subject profile + architecture baseline pinning
- [ ] current requirement retrieval
- [ ] active proposal collision retrieval
- [ ] requirement change proposals/matches
- [ ] stale requirement/knowledge/architecture baseline handling
- [ ] bounded architecture query/traversal
- [ ] assess-architecture-impact skill
- [ ] RequirementArchitectureImpact confirmation UI
- [ ] ArchitectureChangeProposal UI
- [ ] WorkPackageImplementationTarget routing
- [ ] capability links
- [ ] typed profile details + evaluator/findings
- [ ] Change Set/current-vs-proposed UI
- [ ] assistant-ui Tool UI toolkit
- [ ] form copilot surfaces
- [ ] constrained Generative UI vocabulary
- [ ] admin Requirement Profile editor/versioning
- [ ] membership/perspectives/tasks/taskInbox
- [ ] OpenCode/Vertex harness + recovery
- [ ] contribution/evidence/revision/source/verification
- [ ] gaps/assumptions/conflicts/decisions
- [ ] Knowledge ProposedDiffs
- [ ] WorkPackages/dependencies
- [ ] acceptance/evals
- [ ] readiness
- [ ] package/export APIs
- [ ] war-room + GCP hardening
