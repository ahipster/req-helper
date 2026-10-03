# AGENTS.md

This repository is a one-week PoC. Optimize for one coherent collaborative vertical slice, not framework completeness.

## Mission

Build an AI-first requirements orchestration system that turns a signal into a traceable **change set over current enterprise requirements, knowledge and architecture**.

The system must avoid two failure modes:

1. generating a parallel pile of requirements that duplicates/contradicts current truth;
2. guessing implementation targets without grounding them in the current system/application topology.

## Canonical sources

When artifacts disagree:

1. `src/domain/schemas.ts` + `src/domain/architecture.ts` — executable record/enums;
2. `docs/DOMAIN_MODEL.md` + `docs/REQUIREMENT_BASELINES_AND_PROFILES.md` + `docs/ARCHIMATE_GIT_INGESTION.md` — semantic invariants;
3. `src/domain/readiness.ts` — readiness behavior;
4. `docs/PRD.md` / `docs/UI_MOCKUPS.md` / `docs/ASSISTANT_UI_INTERACTIONS.md`;
5. persistence/orchestration/implementation docs.

Fix contradictions immediately; do not preserve legacy fields for convenience.

## Non-negotiable current-vs-proposed rules

1. `requirementCatalog` represents CURRENT accepted requirement identity/version history.
2. `deliverySubjects/{id}/requirements` represents PROPOSED subject-local requirements.
3. Subject workflows never overwrite/promote catalogue versions directly.
4. READY/HANDED_OFF does not mean current baseline changed.
5. Every active subject Requirement must be contextualized by `RequirementChangeProposal`.
6. Change types are exactly: `CREATE | MODIFY | SUPERSEDE | RETIRE | NO_CHANGE`.
7. MODIFY/SUPERSEDE/RETIRE/NO_CHANGE pin exact `baselineRequirementId + baselineVersion`.
8. If current baseline advances, proposal becomes `STALE_BASELINE` until rebased/reassessed.
9. Before CREATE, search current catalogue and active proposals when the pinned profile requires it.
10. Persist duplicate/overlap/contradiction/related judgments as `RequirementMatch`; never hide them inside model reasoning.
11. Blocking UNREVIEWED RequirementMatch prevents READY.
12. Active proposals in other subjects count as possible future collisions.
13. `capabilityRefs` are explicit enterprise links and are not interchangeable with RequirementType.
14. Knowledge ProposedDiff pins source version/fingerprint where available and never writes back automatically in P0.

See `docs/REQUIREMENT_BASELINES_AND_PROFILES.md`.

## Architecture source and ingestion rules

P0 architecture source is **Git Markdown only**. Sparx is explicitly out of scope.

1. Existing architecture Git repositories remain authoritative source material.
2. Req Helper derives a normalized ArchiMate-inspired architecture baseline from exact repository commits.
3. Ingestion is LLM-assisted because useful architecture may live in prose, links, folder structure, front matter, tables and text diagrams.
4. The LLM is an interpreter, not an architecture authority.
5. Every normalized element/relationship must keep exact source evidence: source/repository commit, path, fingerprint/blob and `EXPLICIT | INFERRED` mode.
6. Never invent topology to make a graph complete.
7. Never silently merge similarly named systems/components. Stable-key collisions or ambiguous aliases become ingestion findings/review tasks.
8. Deterministic code owns stable identity resolution, endpoint resolution, validation and baseline publication eligibility.
9. `NEEDS_REVIEW` elements/relationships remain visibly uncertain and may be forbidden from driving requirement impacts by the pinned profile policy.
10. A published `ArchitectureBaseline` is immutable and fingerprinted.
11. Delivery Subjects pin an exact architecture baseline through `DeliverySubjectArchitectureContext`.
12. When the architecture baseline advances, affected subject context/impacts become stale and must be reassessed when architecture is required.
13. Views are projections over the normalized graph, never the source of truth.
14. Req Helper does not write back architecture Markdown in P0.
15. READY/HANDED_OFF does not promote proposed architecture to CURRENT.

See `docs/ARCHIMATE_GIT_INGESTION.md`.

## Requirement -> architecture impact discipline

Implementation routing must not come from a free-form model guess.

For requirements where the pinned profile requires architecture analysis:

```text
current Requirement revision
 -> relevant capability/process/concept
 -> bounded current architecture neighborhood
 -> application service/component/API/event/data
 -> repository/team where topology supports it
 -> RequirementArchitectureImpact proposals
 -> human confirm/reject
 -> WorkPackageImplementationTarget
```

Rules:

- impact is requirement-revision specific and architecture-baseline specific;
- impacts can be `IMPLEMENT | MODIFY | ADAPT | CONSUME | PROVIDE | CONFIGURE | MIGRATE | DEPRECATE | VERIFY_ONLY | NO_CHANGE`;
- not every impacted system needs code changes;
- source relationship IDs used for traversal are persisted;
- stale architecture impacts block readiness when architecture is required;
- architecture structure changes use `ArchitectureChangeProposal`, distinct from mere implementation impact;
- WorkPackage routing references confirmed architecture impacts; do not substitute a guessed team name for topology.

## Requirement Profile rules

1. `RequirementProfile` is stable identity; `RequirementProfileVersion` is immutable once PUBLISHED.
2. Every Delivery Subject must pin one exact published profile version before READY.
3. A newly published profile version never silently changes an existing subject.
4. Subject upgrade requires explicit compare/preview/commit + audit event.
5. Profile-specific detail fields use typed value definitions, not arbitrary JSON/JavaScript validation.
6. Profile evaluation produces `RequirementQualityFinding` records.
7. Blocking OPEN profile findings prevent READY; WAIVED requires explicit human decision/audit.
8. Profile rules are the fast iteration mechanism for changing the “requirements for requirements”.
9. Architecture completeness is also profile-controlled through `RequirementProfileArchitecturePolicy`; do not hard-code architecture impact as mandatory for every possible Delivery Subject.

## assistant-ui rules

Use assistant-ui as a rich interaction layer, not just chat.

### P0

- normal chat: questions/explanations;
- Tool UI: known domain actions such as requirement match/change, verification, evidence, conflicts, decisions, knowledge diffs, architecture impacts and profile gaps;
- form-filling copilot: Scope, Requirement, Decision, WorkPackage and Requirement Profile drafts;
- constrained Generative UI: Bigger Picture, current-vs-proposed, architecture/system context, impact, traceability and readiness summaries.

### Experimental

Interactables may be used only for non-authoritative scratch state in P0.

No assistant-ui surface mutates Firestore simply because model state changed. Final action always becomes a typed backend application command with authz/schema/revision/idempotency checks.

See `docs/ASSISTANT_UI_INTERACTIONS.md`.

## Existing architecture invariants

- Firestore domain state is authoritative; OpenCode/session/chat/UI state is not.
- Membership controls subject access; PerspectiveAssignment controls authority.
- Global roles/job titles/expertise hints do not imply perspective authority.
- OWNER/DELEGATE may satisfy authoritative verification; REVIEWER is advisory.
- Human contribution and verification are separate concepts.
- Verification is append-only and revision-bound where applicable.
- RequirementRevision is immutable semantic history.
- RequirementSource is first-class revision-bound provenance.
- Prior-revision verification/acceptance/evals cannot satisfy a newer proposal revision.
- Conflicts are N-party.
- Readiness is deterministic.
- OpenCode is harness/executor, never system of record.
- One active run per AgentThread; different threads may run concurrently.
- OpenCode sessions must be recreatable from Firestore-backed context.
- Large source files live outside Firestore.
- `users/{uid}/taskInbox` is a rebuildable read projection, never task truth.

## Requirement editing discipline

Human form edits and AI proposals use the same service.

A semantic proposal edit must:

1. authorize user/subject/perspective as needed;
2. verify current subject Requirement revision;
3. append RequirementRevision;
4. update current proposed Requirement revision;
5. write RequirementSource records;
6. make old revision Verification/acceptance/evals ineligible;
7. re-evaluate pinned Requirement Profile rules;
8. re-run relevant requirement matching/collision checks when semantics/capabilities changed;
9. reassess requirement-to-architecture impacts when semantics/capabilities changed and architecture is required;
10. reassess dependent conflicts/gaps;
11. append DomainEvent.

## Existing-requirement discovery discipline

When agent proposes a requirement:

```text
extract proposed semantics
 -> determine RequirementType + capability/context refs
 -> retrieve CURRENT catalogue candidates
 -> retrieve ACTIVE proposals in other subjects
 -> classify matches
 -> persist RequirementMatch records
 -> choose/propose CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE
 -> human reviews blocking ambiguity
```

Never default to CREATE just because no subject-local Requirement exists yet.

## Architecture ingestion discipline

```text
resolve exact Git commits
 -> enumerate configured Markdown files
 -> fingerprint files / detect changes
 -> deterministic front-matter/link extraction
 -> LLM extraction using ingest-architecture-markdown skill
 -> reconcile stable keys and references
 -> validate source evidence and relationship endpoints
 -> create ArchitectureIngestionFinding records
 -> human review inferred/ambiguous material topology
 -> publish immutable ArchitectureBaseline
```

Incremental extraction may process only changed files, but publication must still produce one coherent complete baseline.

## OpenCode execution discipline

Every meaningful subject run:

```text
authorize
 -> persist human message/answer
 -> load authoritative subject state
 -> acquire thread lease
 -> ensure/recreate OpenCode session
 -> build ContextEnvelope
 -> include pinned profile rules
 -> include relevant CURRENT baseline requirements/knowledge
 -> include pinned architecture baseline ID/version + bounded topology when relevant
 -> include proposed requirement/knowledge/architecture changes and impacts
 -> present authoritative context
 -> invoke OpenCode/tools
 -> validate output
 -> re-read current target/baseline revisions
 -> apply idempotent commands transactionally
 -> persist domainRevisionAtEnd separately
 -> update task/taskInbox
 -> release lease
```

Do not inject the entire architecture graph into every prompt. Retrieve the smallest relevant neighborhood.

`contextRevisionPresented` means what OpenCode actually saw, not same-run end state.

## Firestore rules of thumb

- Delivery Subject root remains bounded.
- Growing/history/relations use subcollections.
- Catalogue/profile/architecture published versions are immutable snapshots.
- Subject proposals never overwrite baseline collections.
- Transactions for invariant-sensitive writes.
- Deterministic idempotency keys for AI mutations.
- Stale subject revisions and stale baseline versions are explicit failures, not last-write-wins.
- Browser reads are membership-aware.

Architecture collections are defined in `src/persistence/architecture-firestore.ts` and `docs/ARCHIMATE_GIT_INGESTION.md`.

## Readiness rules added by current/baseline models

READY additionally requires:

- published Requirement Profile version pinned;
- no blocking OPEN RequirementQualityFinding;
- every active subject Requirement classified by a change proposal;
- no `STALE_BASELINE` RequirementChangeProposal;
- no blocking UNREVIEWED RequirementMatch;
- when architecture policy requires it: published architecture baseline pinned and current;
- current-revision confirmed architecture impacts for HIGH/CRITICAL requirements when configured;
- confirmed impacts use trusted/reviewed topology when configured;
- concrete work-package implementation targets for HIGH/CRITICAL requirements when configured;
- no stale architecture impacts/change proposals.

Existing readiness rules still apply.

## Vertical slice order

1. profile/catalogue schemas + seed data;
2. Git Markdown architecture source + ingestion schema;
3. architecture scanner/extractor/reconciler + seed architecture repo fixture;
4. publish one normalized architecture baseline;
5. Delivery Subject profile + architecture baseline pinning;
6. baseline/current requirement retrieval;
7. active proposal retrieval + matches;
8. change proposal classification + stale baseline mechanics;
9. assistant-ui Tool UI/form copilot/change-set UI;
10. architecture impact workspace + requirement-to-system routing;
11. admin Requirement Profile editor/versioning + architecture policy;
12. membership/perspectives/tasks/taskInbox;
13. OpenCode/Vertex/session recovery;
14. contribution/evidence/revision/provenance/verification;
15. profile evaluator/findings;
16. gaps/assumptions/conflicts/decisions/knowledge/architecture diffs;
17. WorkPackages/implementation targets/acceptance/evals;
18. readiness/change-set package;
19. war-room/GCP hardening.

## Required tests before claiming vertical slice works

- PUBLISHED profile content is immutable through normal service path;
- subject pinned to v8 does not silently adopt profile v9;
- explicit profile upgrade produces new findings before commit;
- proposed CREATE with blocking duplicate candidate cannot be READY;
- active proposal contradiction can block readiness;
- MODIFY targets exact baseline version;
- catalogue advance makes proposal STALE_BASELINE;
- stale baseline cannot be READY;
- subject requirement without RequirementChangeProposal cannot be READY;
- blocking profile finding cannot be READY;
- architecture source ingestion is tied to exact Git commits;
- every published architecture element/relationship has source evidence;
- inferred material relationship remains reviewable and cannot silently become confirmed;
- unresolved relationship endpoint prevents baseline publication;
- subject architecture baseline can become stale when source baseline advances;
- profile requiring architecture blocks READY without pinned architecture context;
- critical requirement can be blocked when no confirmed current-revision architecture impact exists;
- confirmed impact cannot rely on disallowed `NEEDS_REVIEW` topology;
- work-package implementation target traces requirement -> impact -> architecture element -> repo/team when available;
- catalogue/architecture baselines are unchanged when subject becomes READY/HANDED_OFF;
- current/proposed API/package output remains distinguishable;
- old proposal revision verification/acceptance/eval is stale;
- Reviewer cannot authoritatively verify;
- lost OpenCode session rehydrates with profile + requirement baseline + architecture context + proposal state;
- same thread serializes, different threads may run concurrently;
- My Work remains a private read projection;
- package traces proposed changes back to exact requirement, knowledge and architecture source versions.

## Validation discipline

Do not claim typecheck/tests pass unless actually run. GitHub Actions must run `npm run typecheck` and `npm test`.

## Definition of done

A realistic signal can be processed by several users into a package that clearly states:

- what current requirements/knowledge/architecture were considered;
- which current versions/commits are affected;
- what is CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE;
- what other active proposals collide;
- which Requirement Profile/version defines completeness;
- which capabilities/processes/concepts/systems realize the affected behavior;
- which systems/components/APIs/repos/teams are confirmed implementation or verification targets;
- what architecture changes are proposed versus still CURRENT;
- what evidence/authority/decisions support the proposal;
- how it will be accepted/evaluated;
- why it is READY;
- and that everything remains PROPOSED until downstream delivery/reconciliation explicitly changes current truth.
