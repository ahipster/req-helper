# One-Week PoC Implementation Plan

## Goal

Deliver one coherent multi-user vertical slice that proves Req Helper can turn an idea into an explicit, profile-compliant **change set over current requirements, knowledge and architecture**, can explain where implementation/verification should be directed from source-grounded current topology, and can hand downstream an immutable versioned package without leaking protected source content.

## P0 definition

By end of week, one seeded signal must support:

1. create Delivery Subject and classify subject kind;
2. suggest/select/pin a published Requirement Profile version;
3. clarify problem/outcome/scope;
4. discover current requirement catalogue + knowledge candidates;
5. enforce deny-by-default `SourceAccessPolicy` before protected source/UI/model access;
6. ingest one or more Git Markdown architecture repositories at exact commits;
7. treat architecture Markdown as bounded `UNTRUSTED_DATA` with no tool/network authority;
8. use LLM-assisted extraction to produce an ArchiMate-inspired normalized graph;
9. deterministically reconcile/validate and publish one immutable ArchitectureBaseline;
10. pin the subject to that exact architecture baseline when profile requires it;
11. find active requirement proposals in other Delivery Subjects;
12. classify each requirement effect as CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE;
13. pin exact requirement/knowledge/architecture baselines;
14. surface duplicate/overlap/contradiction matches;
15. link capabilities;
16. run architecture impact traversal using a versioned `ArchitectureTraversalPolicy`;
17. persist `ArchitectureImpactAssessment` coverage so all candidates are explicitly assessed;
18. human-confirm/reject concrete system/component/API impacts;
19. route work packages to confirmed implementation targets and repo/team where topology provides them;
20. manage subject access/perspective authority separately from protected-source entitlement;
21. run independent assistant-ui drill threads;
22. use Tool UI for known domain actions including architecture impacts/evidence;
23. use form copilot for structured drafts;
24. use constrained Generative UI for bigger-picture/current-vs-proposed/system-context views;
25. persist Contributions/Evidence/RequirementRevision/RequirementSource/Verification;
26. evaluate profile-specific typed requirement + architecture completeness rules;
27. detect/manage gaps/assumptions/N-party conflicts/decisions;
28. persist version-pinned Knowledge ProposedDiffs and ArchitectureChangeProposals;
29. define revision-aware acceptance/evals;
30. compute deterministic readiness including requirement/architecture baseline, coverage and routing checks;
31. realtime multi-user collaboration + My Work projection;
32. recover from OpenCode session loss/staleness;
33. publish immutable versioned `HandoffPackage` artifacts from exact READY subject state;
34. retrieve exact published package versions rather than rebuilding mutable current-state packages.

## Deliberate PoC limits

- **architecture source: Git Markdown only; Sparx is out of scope**;
- architecture ingestion: one/two representative repositories around the seeded scenario, not enterprise-wide migration;
- normalized model: useful ArchiMate subset + delivery extensions, not full ArchiMate metamodel/editor;
- LLM ingestion: exact-commit, source-evidence-backed extraction; no automatic source Git write-back;
- source authorization: explicit audience refs/policies suitable for PoC; enterprise IAM synchronization is future work;
- catalogue: seed/import tens or low hundreds of representative current requirements;
- matching: capability/type/source filters + model/semantic similarity sufficient for PoC; no vector DB unless needed;
- Requirement Profiles: typed rules in current schema, not arbitrary DSL/JavaScript;
- no automatic promotion from HANDED_OFF to current requirement/architecture baseline;
- no full maker-checker package approval workflow in P0;
- Interactables only for non-authoritative scratch state.

See `docs/FUTURE_IMPROVEMENTS.md` for intentionally deferred work.

## Day 1 — Canonical domain + trust/baseline fixtures

### Deliverables

- canonical Requirement/current-vs-proposed schemas;
- `src/domain/source-security.ts` and source-access fixtures;
- `src/domain/architecture.ts` schemas including traversal/coverage;
- `src/domain/handoff.ts` immutable package contract;
- RequirementProfile + immutable versions + architecture policy;
- RequirementCatalogItem + immutable versions;
- RequirementChangeProposal / Match / QualityFinding;
- ArchitectureSource / IngestionRun / Baseline / Element / Relationship / View / Finding;
- ArchitectureTraversalPolicy / ArchitectureImpactAssessment;
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
- missing SourceAccessPolicy denies protected source use;
- subject profile can say architecture/complete coverage is required or not required.

## Day 2 — Secure Git Markdown architecture ingestion

### Deliverables

- Git source reader against approved repository access;
- SourceAccessPolicy resolution and model-processing check;
- exact commit resolution;
- Markdown file listing/fingerprinting/change detection;
- deterministic front matter/link hints;
- `ingest-architecture-markdown` OpenCode skill with `UNTRUSTED_DATA`, no tools/network;
- schema-validated document extraction;
- deterministic reconciler:
  - stable key resolution;
  - endpoint resolution;
  - duplicate/conflicting definition findings;
  - unresolved reference findings;
  - EXPLICIT vs INFERRED evidence handling;
- ingestion run persistence including security policy version;
- architecture ingestion findings;
- baseline publish service;
- Architecture admin/run/finding screen.

### Acceptance

- same exact source commits produce reproducible source metadata;
- unauthorized/model-disallowed source is never placed into model context;
- source-embedded instructions cannot expand model capabilities;
- model cannot publish baseline;
- every relationship endpoint resolves before publication;
- every published object has source evidence;
- inferred material relation is visibly reviewable;
- blocking unresolved/duplicate/conflicting topology prevents publication;
- changed-file ingestion can reuse unchanged normalized data only when fingerprints still match;
- one ArchitectureBaseline successfully publishes from seeded Markdown.

## Day 3 — Existing truth + complete architecture impact assessment

### Deliverables

- current requirement lookup by type/capability/context/semantic query;
- active proposal lookup across open Delivery Subjects;
- RequirementMatch persistence/classification;
- CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE classification service;
- stale requirement/knowledge baseline detection/rebase flow;
- DeliverySubjectArchitectureContext pinning/stale detection;
- backend-only caller-authorized architecture query service;
- versioned ArchitectureTraversalPolicy;
- `assess-architecture-impact` skill;
- ArchitectureImpactAssessment persistence;
- RequirementArchitectureImpact persistence;
- architecture impact confirmation/correction;
- ArchitectureChangeProposal persistence;
- Requirement Catalogue + Change Set + Architecture Impact UIs.

### Acceptance

- likely existing requirement offered before CREATE;
- two active subjects changing same baseline surfaced;
- subject can pin exact architecture baseline version/fingerprint;
- architecture graph is filtered before UI/model serialization;
- traversal records seeds/candidates/assessed/unresolved elements;
- one confirmed impact cannot satisfy complete-coverage policy when another candidate is unresolved;
- architecture impact traces to element + source relationships/evidence;
- no repository/team is presented as confirmed merely because the model guessed it;
- requirement semantic/capability changes reopen targeted impact assessment;
- architecture baseline advance can make subject context/impact/assessment stale.

## Day 4 — assistant-ui interaction layer + admin/profile controls

### Deliverables

- assistant-ui conversation shell;
- Tool UIs:
  - existing requirement match;
  - requirement change proposal;
  - verification/evidence;
  - architecture impact proposal/confirmation;
  - architecture impact coverage/unresolved candidate review;
  - architecture source evidence;
  - architecture change proposal;
  - conflict/decision;
  - knowledge diff;
  - profile gap;
- form copilot for Scope/Requirement/Decision/WorkPackage/Profile drafts;
- constrained Generative UI vocabulary for Bigger Picture/current-vs-proposed/system context/application cooperation/implementation impact;
- Admin Requirement Profile editor/version publish including architecture/traversal policy;
- profile compare/subject upgrade preview.

### Acceptance

- Tool UI actions route through typed backend commands;
- form copilot only edits draft state until human save/publish;
- Generative UI cannot mutate architecture/requirements or emit arbitrary JS;
- architecture nodes/edges can show source evidence only when caller is authorized;
- published profile version stays immutable;
- subject pinned to v8 does not silently adopt v9.

## Day 5 — Multi-user drills, convergence and work routing

### Deliverables

- Membership/Perspective/Assignment/Task;
- private taskInbox projection;
- AgentHarness/OpenCode/Vertex;
- AgentThread lease/session generation/contextRevisionPresented;
- protected-source authorization/filtering in ContextEnvelope builder;
- explicit untrusted-source delimiters in prompts;
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
- subject membership cannot reveal architecture source content without source entitlement;
- requirement impact confirmation is human-visible and source-grounded;
- work package traces requirement -> impact -> architecture element -> repo/team when available;
- 3-party conflict persists all positions;
- duplicate rerun cannot duplicate mutations;
- lost OpenCode session FULL rehydrates only authorized profile + requirement baseline + architecture context.

## Day 6 — Acceptance / readiness / immutable handoff

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
  - complete ArchitectureImpactAssessment for HIGH/CRITICAL when required;
  - confirmed impact for HIGH/CRITICAL when required;
  - trusted topology for confirmed impact when required;
  - implementation target for HIGH/CRITICAL when required;
- HandoffPackage publication service and validation;
- immutable JSON + optional Markdown artifacts with hashes;
- version/supersession semantics;
- versioned read APIs;
- reverse traceability to baseline/source commits/proposals/impacts.

### Acceptance

- profile not requiring architecture does not fail architecture checks;
- profile requiring architecture blocks without pinned baseline;
- complete-coverage policy blocks when any traversal candidate is unresolved/unassessed;
- confirmed impact cannot rely on disallowed NEEDS_REVIEW topology;
- stale architecture context/impact blocks READY when architecture required;
- NOT_READY cannot publish handoff;
- package subject revision/profile/architecture baseline must match exact current READY state;
- first package is v1; later package explicitly supersedes and increments;
- published package artifact hash/identity never changes after later subject edits;
- package identifies exact architecture baseline/source commits and confirmed implementation targets;
- package never implies HANDED_OFF == current baseline/source Git promoted.

## Day 7 — GCP + war-room hardening

### Deliverables

- Cloud Run/Firestore/Vertex deployment config;
- approved Git source access/configuration;
- source access policies/audience fixtures;
- requirement catalogue/profile seed/import utilities;
- content-addressed/versioned GCS handoff artifact path;
- war-room traces with profile/requirement/architecture baseline/security-policy metadata;
- architecture ingestion run/finding diagnostics;
- simultaneous-user tests;
- stale requirement/architecture baseline tests;
- profile upgrade/session recovery tests;
- immutable handoff re-publication/supersession tests;
- realistic seeded scenario end-to-end;
- known limitations/future improvements.

### Acceptance

- CI typecheck/tests green;
- two users work independently and see allowed structured changes live;
- non-member cannot read subject;
- source-entitlement mismatch cannot read protected architecture through Firestore/API/model;
- architecture source credentials are backend-only;
- baseline ingestion can be rerun/recovered;
- current requirement catalogue and architecture baselines remain unchanged through READY/HANDED_OFF;
- exact published handoff package can be retrieved after later subject edits without content drift.

## Canonical rules coding agents must not reinterpret

1. Firestore is the system of record for PoC domain state.
2. Requirement Catalogue CURRENT and Delivery Subject PROPOSED are different concepts.
3. Git Markdown is the only P0 architecture source; do not add Sparx work.
4. Source Git remains authoritative; normalized architecture is derived.
5. External source content is untrusted data, not instructions.
6. Missing SourceAccessPolicy denies protected source use; model use additionally requires `modelProcessingAllowed=true`.
7. Authorization/filtering occurs before UI serialization/model invocation.
8. Model never publishes ArchitectureBaseline or silently merges ambiguous systems.
9. Published ArchitectureBaseline is immutable and exact-commit/fingerprint pinned.
10. Requirement-to-system routing uses normalized current topology, not free-form guessing.
11. Complete impact coverage uses versioned ArchitectureTraversalPolicy + ArchitectureImpactAssessment.
12. A single confirmed impact never substitutes for complete coverage when the profile requires it.
13. Every subject requirement is contextualized by RequirementChangeProposal.
14. MODIFY/SUPERSEDE/RETIRE/NO_CHANGE pin exact baseline version.
15. CREATE requires existing-requirement/active-proposal search when profile says so.
16. Blocking unreviewed duplicate/contradiction match prevents READY.
17. Subject pins profile version; upgrades are explicit.
18. Architecture completeness is profile-controlled.
19. RequirementArchitectureImpact is both requirement-revision and architecture-baseline specific.
20. `VERIFY_ONLY` is not a code-change target.
21. WorkPackageImplementationTarget references confirmed impact; repo/team links only when topology supports them.
22. ArchitectureChangeProposal is future state; no Git write-back in P0.
23. Tool UI/form copilot/generative UI never bypass backend commands.
24. `contextRevisionPresented` means what OpenCode actually saw.
25. Membership controls subject access; PerspectiveAssignment controls authority; SourceAccessPolicy controls protected source access.
26. Verification/acceptance/evals are proposal-revision specific.
27. Conflicts are N-party.
28. `blocking=true` unresolved means NOT_READY.
29. My Work taskInbox is a rebuildable read projection only.
30. READY and published handoff are distinct. HandoffPackage is immutable/versioned and bound to exact subject revision.

## P0 backlog

- [ ] source access policy + deny-by-default authorization/filtering
- [ ] untrusted model-input execution policy
- [ ] requirement profile/version + architecture policy
- [ ] requirement catalogue/version + seed current requirements
- [ ] ArchitectureSource / ingestion / baseline schemas
- [ ] Git Markdown source reader
- [ ] exact commit/file fingerprinting
- [ ] secure ingest-architecture-markdown skill
- [ ] deterministic architecture reconciler/findings
- [ ] Architecture baseline publish service
- [ ] Architecture Admin/current baseline UI
- [ ] subject profile + architecture baseline pinning
- [ ] current requirement retrieval
- [ ] active proposal collision retrieval
- [ ] requirement change proposals/matches
- [ ] stale requirement/knowledge/architecture baseline handling
- [ ] versioned ArchitectureTraversalPolicy
- [ ] caller-authorized bounded architecture query/traversal
- [ ] assess-architecture-impact skill
- [ ] ArchitectureImpactAssessment coverage
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
- [ ] OpenCode/Vertex harness + authorized context recovery
- [ ] contribution/evidence/revision/source/verification
- [ ] gaps/assumptions/conflicts/decisions
- [ ] Knowledge ProposedDiffs
- [ ] WorkPackages/dependencies
- [ ] acceptance/evals
- [ ] readiness
- [ ] immutable HandoffPackage publication + versioned retrieval APIs
- [ ] war-room + GCP hardening
