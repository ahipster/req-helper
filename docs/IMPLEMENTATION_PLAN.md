# One-Week PoC Implementation Plan

## Goal

Deliver one coherent multi-user vertical slice that proves Req Helper can turn an idea into an explicit, profile-compliant **change set over current requirements/knowledge**, not a flat pile of newly generated requirements.

## P0 definition

By end of week, one seeded signal must support:

1. create Delivery Subject and classify subject kind;
2. suggest/select/pin a published Requirement Profile version;
3. clarify problem/outcome/scope;
4. discover current requirement catalogue + knowledge candidates;
5. find active proposals in other Delivery Subjects;
6. classify each requirement effect as CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE;
7. pin exact baseline requirement/source versions;
8. surface duplicate/overlap/contradiction matches;
9. link capabilities;
10. manage access/perspective authority;
11. run independent assistant-ui drill threads;
12. use Tool UI for known domain actions;
13. use form copilot for structured drafts;
14. use constrained Generative UI for bigger-picture/current-vs-proposed views;
15. persist Contributions/Evidence/RequirementRevision/RequirementSource/Verification;
16. evaluate profile-specific typed detail/completeness rules;
17. detect/manage gaps/assumptions/N-party conflicts/decisions;
18. persist version-pinned Knowledge ProposedDiffs;
19. split changes into targeted WorkPackages;
20. define revision-aware acceptance/evals;
21. compute deterministic readiness including profile/baseline collision checks;
22. realtime multi-user collaboration + My Work projection;
23. recover from OpenCode session loss/staleness;
24. export/serve explicit change-set package.

## Deliberate PoC limits

- catalogue: seed/import tens or low hundreds of representative current requirements, not enterprise-wide migration;
- matching: capability/type/source filters + model/semantic similarity sufficient for PoC; no dedicated vector DB unless needed;
- Requirement Profiles: typed rules in current schema, not arbitrary DSL/JavaScript;
- no automatic promotion from HANDED_OFF to current catalogue;
- external knowledge remains references/diffs, no write-back;
- Interactables may be demoed only for non-authoritative scratch state.

## Day 1 — Baseline + profile domain spine

### Deliverables

- canonical Zod schemas;
- RequirementProfile + immutable RequirementProfileVersion;
- RequirementCatalogItem + immutable versions;
- DeliverySubject subjectKind + pinned profile version;
- RequirementChangeProposal;
- RequirementMatch;
- RequirementQualityFinding;
- capabilityRefs + typed requirement detail values;
- Firestore collections/rules/indexes/helpers;
- seed API Change profile and seeded requirement catalogue.

### Acceptance

- current catalogue and proposed subject requirements are separate records;
- subject cannot mutate catalogue through normal requirement command path;
- MODIFY pins exact baseline ID/version;
- published profile version is immutable;
- subject pins exact profile version.

## Day 2 — Discovery / current-vs-proposed mechanics

### Deliverables

- current requirement lookup by type/capability/context/semantic query;
- active proposal lookup across open Delivery Subjects;
- match persistence/classification;
- CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE classification service;
- stale baseline detection/rebase flow;
- KnowledgeReference version/fingerprint + stale ProposedDiff detection;
- Requirement Catalogue read UI;
- Change Set list/detail UI.

### Acceptance

- likely existing requirement is offered before CREATE;
- user can explicitly dismiss a false match with rationale;
- two active subjects changing same baseline are surfaced;
- baseline advance marks proposal stale;
- UI always labels CURRENT versus PROPOSED.

## Day 3 — assistant-ui interaction layer + admin profiles

### Deliverables

- assistant-ui conversation shell;
- Tool UIs:
  - existing requirement match;
  - requirement change proposal;
  - verification;
  - evidence;
  - conflict position;
  - decision;
  - knowledge diff;
  - profile gap;
- form-copilot behavior for Scope/Requirement/Decision/WorkPackage/Profile editors;
- constrained Generative UI component vocabulary for Bigger Picture/change summaries;
- Admin Requirement Profile list/editor/version publish;
- profile compare/subject upgrade preview.

### Acceptance

- Tool UI action routes through normal application command;
- form copilot only edits draft state until human save/publish;
- Generative UI cannot emit arbitrary HTML/JS or bypass commands;
- published profile v8 stays unchanged while v9 draft is edited;
- subject pinned to v8 does not silently adopt v9.

## Day 4 — Multi-user drills, provenance, verification

### Deliverables

- Membership/Perspective/Assignment/Task;
- private `users/{uid}/taskInbox` projection;
- AgentHarness/OpenCode/Vertex;
- AgentThread lease/session generation/contextRevisionPresented;
- Contribution/Evidence extraction;
- RequirementRevision/RequirementSource service;
- revision-bound Verification;
- profile evaluation -> RequirementQualityFinding;
- current-vs-proposed side panel.

### Acceptance

- human answer durable before model invocation;
- non-owner contribution retained but not authoritative;
- OWNER/DELEGATE verification only counts for current proposal revision;
- profile missing field creates deterministic finding;
- profile finding updates live for other authorized users;
- lost OpenCode session FULL rehydrates from Firestore.

## Day 5 — Convergence / impacts / conflicts

### Deliverables

- gaps/assumptions;
- N-party conflict positions;
- active-proposal collision -> conflict/dependency option;
- Decision recording;
- Knowledge ProposedDiff review;
- capability/impact view;
- WorkPackage change grouping;
- stale command/idempotency handling.

### Acceptance

- 3-party conflict persists all positions;
- DS-119/DS-123 contradictory proposals can be linked into a conflict;
- Knowledge diff remains proposed against exact source version;
- duplicate rerun cannot duplicate domain mutations.

## Day 6 — Acceptance / readiness / package

### Deliverables

- generalized AcceptanceCriterion/Evaluation;
- profile-required eval/acceptance rules;
- deterministic readiness including:
  - profile pinned;
  - blocking profile findings;
  - change classification;
  - stale baselines;
  - blocking unreviewed matches;
- Final Package/JSON/Markdown/read APIs;
- reverse traceability to baseline + proposal sources.

### Acceptance

- CREATE with blocking duplicate candidate cannot be READY;
- STALE_BASELINE cannot be READY;
- profile rule gaps cannot be READY unless resolved/explicitly waived;
- package says exactly which current requirement/source version each change affects;
- package never implies HANDED_OFF == current baseline promoted.

## Day 7 — GCP + war-room hardening

### Deliverables

- Cloud Run/Firestore/Vertex deployment config;
- requirement catalogue/profile seed/import utilities;
- war-room traces with profile/baseline/match metadata;
- simultaneous-user tests;
- stale baseline/profile upgrade/session recovery tests;
- realistic seeded scenario with active-proposal collision;
- known limitations.

### Acceptance

- CI typecheck/tests green;
- two users work independently and see structured changes live;
- non-member cannot read subject;
- profile edit/publish/upgrade semantics work;
- current catalogue remains unchanged through READY/HANDED_OFF;
- subject package reconstructs entirely from persisted domain state.

## Canonical rules coding agents must not reinterpret

1. Firestore is the system of record for PoC domain state.
2. Requirement Catalogue CURRENT and Delivery Subject PROPOSED are different stores/concepts.
3. Normal subject workflows never directly promote catalogue versions.
4. Every subject requirement is contextualized by RequirementChangeProposal.
5. MODIFY/SUPERSEDE/RETIRE/NO_CHANGE pin exact baseline version.
6. CREATE requires existing-requirement/active-proposal search when profile says so.
7. Blocking unreviewed duplicate/contradiction match prevents READY.
8. Published Requirement Profile versions are immutable.
9. Subject pins profile version; upgrades are explicit.
10. Profile-specific fields are typed, not arbitrary JSON/JS rules.
11. Capability links are explicit and separate from RequirementType.
12. Knowledge ProposedDiff pins source version/fingerprint where available.
13. Tool UI/form copilot/generative UI never bypass backend commands.
14. Interactables are non-authoritative in P0.
15. `contextRevisionPresented` means what OpenCode actually saw.
16. Membership controls access; PerspectiveAssignment controls authority.
17. Verification and acceptance/evals are proposal-revision specific.
18. Conflicts are N-party.
19. `blocking=true` unresolved means NOT_READY.
20. My Work taskInbox is a rebuildable read projection only.

## P0 backlog

- [ ] requirement profile/version schemas + seed API profile
- [ ] requirement catalogue/version schemas + seed current requirements
- [ ] subject profile pinning/upgrade preview
- [ ] current requirement retrieval
- [ ] active proposal collision retrieval
- [ ] requirement change proposals
- [ ] requirement matches + review UI
- [ ] stale baseline detection/rebase
- [ ] capability links
- [ ] typed profile details + evaluator/findings
- [ ] Requirement Catalogue UI
- [ ] Change Set UI/current-vs-proposed diff
- [ ] assistant-ui Tool UI toolkit
- [ ] form copilot surfaces
- [ ] constrained Generative UI vocabulary
- [ ] admin Requirement Profile editor/versioning
- [ ] membership/perspectives/tasks/taskInbox
- [ ] OpenCode/Vertex harness + recovery
- [ ] contribution/evidence/revision/source/verification
- [ ] gaps/assumptions/conflicts/decisions
- [ ] version-pinned Knowledge ProposedDiffs
- [ ] WorkPackages/dependencies
- [ ] acceptance/evals
- [ ] readiness
- [ ] package/export APIs
- [ ] war-room + GCP hardening
