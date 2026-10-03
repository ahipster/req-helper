# Req Helper PRD

## 1. Purpose

Req Helper is a one-week PoC for AI-first requirements discovery and convergence in an enterprise/bank context. It turns an initial signal/problem/idea into a persistent Delivery Subject and orchestrates people, current enterprise requirements/knowledge/architecture and AI loops until it can produce a traceable implementation-ready **change set**.

The product stops before code generation/deployment. A downstream SDLC consumes the change set.

## 2. Product thesis

The durable object is a **Delivery Subject**, not a transcript or agent session. A Delivery Subject is a proposed change to current enterprise truth, not a parallel replacement truth.

```text
Signal / source material
 -> Delivery Subject + pinned Requirement Profile
 -> discover CURRENT requirements + knowledge
 -> pin CURRENT normalized architecture baseline when profile requires it
 -> classify proposed requirement/knowledge changes
 -> required perspectives + memberships/assignments
 -> perspective-specific human drills
 -> contributions + evidence + verification
 -> proposed requirements + revisions/provenance
 -> requirement -> architecture impact analysis
 -> confirmed systems/components/APIs/repos/teams
 -> gaps / assumptions / N-party conflicts / decisions
 -> targeted work packages
 -> acceptance criteria + evals
 -> deterministic readiness
 -> machine/human-readable CHANGE SET
 -> downstream SDLC
```

Current catalogue/source/architecture baseline records are never silently overwritten by an in-flight Delivery Subject.

## 3. Non-goals

Not in the PoC:

- autonomous implementation/deployment;
- Sparx ingestion/synchronization;
- authoritative write-back to architecture Git repositories or external knowledge/source repositories;
- automatic promotion of proposed requirements/architecture into current enterprise baseline;
- full ArchiMate language coverage;
- generic enterprise knowledge graph;
- full project/portfolio management;
- enterprise-complete IAM/SCIM/group management;
- generic workflow/agent platform;
- shared multi-human OpenCode sessions.

## 4. Actors

- **Sponsor** — introduces the signal and follows outcome/progress.
- **Delivery Lead** — owns convergence for a specific Delivery Subject.
- **Perspective Owner/Delegate** — authoritative human for one perspective.
- **Contributor** — supplies useful knowledge without automatic authority.
- **Reviewer** — advisory review/challenge role.
- **Knowledge Steward** — validates enterprise references/knowledge diffs.
- **Architect/System Owner** — validates normalized topology and requirement-to-system impacts.
- **Requirement Steward/Admin** — maintains Requirement Profiles and optional catalogue/configuration.
- **Architecture Steward/Admin** — configures architecture Git sources, reviews ingestion findings and publishes normalized baselines.
- **Downstream SDLC Consumer** — consumes the change set.
- **War-room Operator** — diagnoses model/prompt/context/workflow failures.
- **Req Helper Admin** — configures PoC users/global roles/templates.

## 5. Core invariants

1. Firestore domain state is authoritative; OpenCode/chat/UI state is not.
2. CURRENT baseline and PROPOSED Delivery Subject state are separate.
3. A proposed change never becomes current merely because Req Helper reaches READY/HANDED_OFF.
4. Every MODIFY/SUPERSEDE/RETIRE/NO_CHANGE proposal pins the exact baseline requirement version analyzed.
5. Knowledge diffs pin source version/fingerprint where available.
6. Before CREATE, the system searches current requirements and active proposals for duplicate/overlap/contradiction candidates.
7. Active proposals in other Delivery Subjects are considered during collision detection.
8. Requirement type and enterprise capability links are explicit and orthogonal.
9. P0 architecture source is Git Markdown only; Sparx is out of scope.
10. Architecture ingestion is LLM-assisted but every published element/relationship retains exact Git source evidence.
11. LLM-inferred architecture is explicitly marked and reviewable; the model may not silently invent or merge topology.
12. Published ArchitectureBaseline versions are immutable.
13. Delivery Subjects pin an exact architecture baseline when required by their profile.
14. Requirement-to-system impacts are requirement-revision and architecture-baseline specific.
15. Work-package implementation routing uses confirmed architecture impacts, not unconstrained model guesses.
16. Architecture change proposals remain PROPOSED and never write back to Git automatically in P0.
17. Contribution is not authority.
18. Membership controls Delivery Subject access; PerspectiveAssignment controls authority.
19. Every material proposed requirement has revision-bound provenance.
20. Verification is append-only human judgment tied to exact target revision where applicable.
21. Requirement edits create immutable RequirementRevision records; prior-revision verification/acceptance/evals do not satisfy the new revision.
22. Contradictions are first-class N-party Conflict records.
23. Decisions are explicit human-owned records.
24. Readiness is deterministic code plus versioned Requirement Profile compliance.
25. AI text never mutates authoritative state directly; validated commands do.
26. Requirement Profile versions are immutable once published and Delivery Subjects pin one exact version.
27. Profile upgrades are explicit and show newly introduced/removed gaps before commit.
28. My Work is a non-authoritative per-user Task projection.

## 6. Functional requirements

### FR-1 Create Delivery Subject

Create from ordinary language plus optional links/documents. Preserve `initialSignal` verbatim and immutable. Classify a `subjectKind` such as API_CHANGE, DATA_MODEL_CHANGE, REGULATORY_CHANGE, MIGRATION, NEW_SERVICE or GENERAL.

### FR-2 Select and pin Requirement Profile

Suggest a Requirement Profile from subject kind/context. Human confirms exact `requirementProfileId + requirementProfileVersion`. A Delivery Subject cannot reach READY without a pinned published profile version.

### FR-3 Clarify outcome and scope

AI may propose, human can correct: problem, outcome, scope in/out, constraints, success measures, unknowns/gaps.

### FR-4 Attach source material

Links/uploads become SourceArtifact metadata. Large bytes live in GCS/external systems.

### FR-5 Discover CURRENT enterprise knowledge

Search KnowledgeProviders for processes, concepts, APIs, applications, solutions, policies, controls, decisions, capabilities and services. Preserve stable identity, source version/fingerprint and retrieval metadata where available.

### FR-6 Discover CURRENT requirements

Search the current Requirement Catalogue or configured authoritative requirement source using semantic similarity, requirement type, capability links, linked API/system/process/concept and shared authoritative knowledge/provenance. Catalogue requirements have stable IDs and immutable published versions.

### FR-7 Detect active-proposal collisions

Search active Delivery Subjects for proposals affecting the same/related baseline requirements and capabilities. Surface parallel proposals before the subject creates a contradictory second future truth.

### FR-8 Classify requirement changes

Every material subject requirement participates in one explicit `RequirementChangeProposal`:

```text
CREATE | MODIFY | SUPERSEDE | RETIRE | NO_CHANGE
```

MODIFY/SUPERSEDE/RETIRE/NO_CHANGE pin `baselineRequirementId + baselineVersion`.

### FR-9 Review requirement matches

Persist auditable `RequirementMatch` records against BASELINE_REQUIREMENT or ACTIVE_PROPOSAL with relationship `DUPLICATE | OVERLAPS | CONTRADICTS | RELATED`. Blocking matches must be reviewed before READY.

### FR-10 Detect stale requirement/knowledge baselines

If a current catalogue requirement advances after a proposal pinned an older version, mark proposal `STALE_BASELINE`. Knowledge ProposedDiffs follow the same principle using source version/fingerprint.

### FR-11 Manage capabilities

Current and proposed requirements may link one or more stable `capabilityRefs`. Capability links drive retrieval, impact analysis, collision detection, architecture traversal, work-package grouping and visualization.

### FR-12 Configure architecture Git sources

P0 supports one or more configured Git repositories containing Markdown architecture material. Each source records repository, branch and optional path prefixes. Sparx is excluded from P0.

### FR-13 Ingest architecture at exact Git commits

Each architecture ingestion run resolves exact commit SHAs and fingerprints configured Markdown files. Source commit set is immutable input to the run.

### FR-14 LLM-assisted architecture normalization

The system uses a bounded LLM extraction skill to interpret architecture represented in Markdown prose, front matter, links, folder structure, tables and text diagrams into allowlisted `ArchitectureElement`, `ArchitectureRelationship` and `ArchitectureView` candidates.

Every candidate carries source evidence and `EXPLICIT | INFERRED` mode. The model cannot publish a baseline.

### FR-15 Reconcile and validate normalized architecture

Deterministic application logic, optionally assisted by model suggestions, resolves stable references and validates:

- stable identities;
- duplicate/conflicting definitions;
- relationship endpoints;
- allowlisted element/relationship types;
- source evidence;
- inferred/low-confidence material topology.

Ambiguity becomes `ArchitectureIngestionFinding`, never silent merge/invention.

### FR-16 Publish immutable Architecture Baseline

Only backend application logic can publish an `ArchitectureBaseline`. It records exact source commits, schema/prompt versions and fingerprint. Published baselines never mutate.

Incremental ingestion may process only changed files, but publication always yields a coherent complete baseline.

### FR-17 Pin Delivery Subject architecture context

When the selected profile requires architecture analysis, the Delivery Subject pins exact `architectureBaselineId + architectureBaselineVersion + fingerprint`.

If a newer current baseline supersedes it, subject architecture context becomes `STALE_BASELINE` until impacts are reassessed/rebased.

### FR-18 ArchiMate-inspired normalized model

P0 follows ArchiMate semantics where useful and includes practical software-delivery extensions.

Element types include capabilities, business processes/services/objects, application components/services/interfaces, data objects, nodes/technology services, information concepts, policies, controls, APIs, events, repositories and teams.

Relationship types include ArchiMate-like REALIZES/SERVES/ACCESSES/TRIGGERS/FLOWS_TO plus practical OWNS/IMPLEMENTS/EXPOSES/CONSUMES/READS/WRITES/DEPENDS_ON/DEPLOYED_TO/GOVERNED_BY.

### FR-19 Discover requirement-to-architecture impact

For a requirement revision, retrieve a bounded neighborhood from the pinned architecture baseline and propose `RequirementArchitectureImpact` records.

Impact types:

```text
IMPLEMENT | MODIFY | ADAPT | CONSUME | PROVIDE | CONFIGURE |
MIGRATE | DEPRECATE | VERIFY_ONLY | NO_CHANGE
```

Persist architecture element key, baseline/version, rationale, confidence and source relationship IDs used for traversal.

### FR-20 Human-confirm architecture impact

AI impact is advisory until confirmed/rejected by an appropriate human. Material impact must not silently rely on `NEEDS_REVIEW` topology when the selected architecture policy disallows it.

### FR-21 Propose architecture structure changes

When future structure itself changes, persist `ArchitectureChangeProposal` against the pinned baseline:

```text
ADD | MODIFY | REMOVE | DEPRECATE | NO_CHANGE
```

Architecture impact and architecture structure change are separate concepts.

### FR-22 Route work packages from confirmed architecture impact

`WorkPackageImplementationTarget` links a work package to a confirmed requirement architecture impact and normalized architecture element, optionally including linked REPOSITORY and TEAM elements when current topology provides them.

No guessed repository/team should be presented as authoritative implementation routing.

### FR-23 Architecture Profile policy

A versioned `RequirementProfileArchitecturePolicy` can require:

- architecture baseline;
- confirmed architecture impact for HIGH/CRITICAL requirements;
- concrete implementation target for HIGH/CRITICAL requirements;
- whether `NEEDS_REVIEW` topology may drive confirmed impact.

Architecture is therefore part of configurable “requirements for requirements”, not universally hard-coded.

### FR-24 Discover perspectives

AI proposes affected perspectives with rationale/criticality. Delivery Lead confirms/adds/removes. Required PROPOSED perspectives block readiness.

### FR-25 Manage access and authority

Subject membership is SPONSOR / DELIVERY_LEAD / PARTICIPANT / OBSERVER. Perspective assignment is OWNER / DELEGATE / CONTRIBUTOR / REVIEWER. Expertise hints never establish authority.

### FR-26 Run smart drills

Question priority considers ownership relevance, criticality, profile gaps, architecture-impact uncertainty, unresolved uncertainty, contradictions, dependencies, missing acceptance/evals, uncovered perspectives and confidence deficit.

### FR-27 Persist task lifecycle

```text
OPEN -> IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED
                     \-> WAITING_ON_OTHER -> IN_PROGRESS
Any nonterminal -> CANCELLED
```

Human response is durable before AI processing.

### FR-28 Maintain My Work projection

Authoritative Tasks remain under Delivery Subjects. Backend maintains private `users/{uid}/taskInbox` projection and cleans it on reassignment/access removal.

### FR-29 Capture contributions/evidence

Persist verbatim contribution, epistemic mode, human/AI confidence separately, evidence and likely authoritative owner hints.

### FR-30 Maintain requirement revisions/provenance

Human and AI edits share one command path. Every semantic edit creates RequirementRevision, writes RequirementSource records and invalidates old revision-bound verification/acceptance/evals for readiness. Changed requirement semantics/capabilities also trigger targeted architecture-impact reassessment when required.

### FR-31 Verify current proposal revision

OWNER/DELEGATE may verify/reject/amend a Contribution, current Requirement revision or ProposedDiff. Reviewer feedback remains advisory.

### FR-32 Evaluate Requirement Profile compliance

Deterministic profile evaluation produces `RequirementQualityFinding` records. Blocking OPEN findings prevent READY. WAIVED requires explicit human decision/audit trail.

### FR-33 Typed profile-specific details

The core Requirement model remains stable. Profile-specific details use typed values: TEXT, BOOLEAN, NUMBER, ENUM, REFERENCE, TEXT_LIST, REFERENCE_LIST.

### FR-34 Detect gaps and assumptions

Persist gaps and assumptions with explicit severity/criticality, ownership, validation and blocking semantics.

### FR-35 Detect/resolve N-party conflicts

Persist 2+ positions. Participant-specific tasks/threads capture evidence. Shared conflict view aggregates positions. AI may neutrally summarize; named human records Decision/source correction.

### FR-36 Decisions

Persist question, alternatives, decision, rationale, owner, participants, affected requirements and superseded decision.

### FR-37 Enterprise knowledge changes

Persist ProposedDiff against exact KnowledgeReference baseline version/fingerprint where possible. Users can confirm/reject/correct. No source-system write-back in P0.

### FR-38 Acceptance criteria and evaluations

AcceptanceCriterion/Evaluation target REQUIREMENT / WORK_PACKAGE / DELIVERY_SUBJECT. Requirement targetRevision is mandatory. Profile rules may require specific evaluation types.

### FR-39 Dependencies

Dependencies may link requirements/work packages/knowledge references. `blocking=true` means unresolved prevents READY.

### FR-40 Deterministic readiness

Includes core invariants plus profile/current-vs-proposed checks and architecture checks when configured by profile.

### FR-41 Realtime collaboration

Several logged-in members work simultaneously. Remote updates must not overwrite unsent drafts or silently replace stale structured edits.

### FR-42 OpenCode synchronization

OpenCode local session is disposable. Every meaningful run receives bounded authoritative current/proposed/profile context. Architecture-dependent runs receive pinned baseline identity plus a bounded relevant topology neighborhood, never the entire graph by default.

### FR-43 Rich assistant-ui rendering

Use normal chat, Tool UI, form-filling copilot and constrained Generative UI. Architecture-specific Tool UI includes impact proposal/confirmation/source evidence/change proposal cards. Generative UI may compose read-only/advisory system-context/application-cooperation/implementation-impact views.

### FR-44 Requirement and architecture history/current-vs-proposed UX

Normal users can inspect current requirement/knowledge/architecture baseline versus proposed future state, exact baseline versions/commits, source evidence, proposal history and stale-baseline warnings.

### FR-45 Admin Requirement Profiles

ADMIN/Requirement Steward can create/edit/publish immutable profile versions including architecture policy.

### FR-46 Explicit profile upgrade

Delivery Lead can compare pinned profile version with newer published version, preview new findings and explicitly upgrade.

### FR-47 Architecture ingestion/admin UX

Architecture Steward/Admin can:

- configure Git Markdown sources;
- start/retry ingestion;
- inspect exact commits/files/model/prompt version;
- review blocking ingestion findings;
- inspect inferred source evidence;
- publish a validated baseline.

### FR-48 War-room observability

Show AgentRun plus architecture ingestion run status, prompt/model/schema versions, source commit set, extraction/reconciliation findings and impact-analysis failures.

### FR-49 Package export/read API

Generate JSON/Markdown and read APIs from persisted state. The package is a **change set**, including requirement/knowledge/architecture baseline refs and proposed changes/impacts.

```text
GET /api/delivery-subjects/{id}/package
GET /api/delivery-subjects/{id}/work-packages/{workPackageId}
```

## 7. UI requirements

### Primary navigation

```text
My Work | Delivery Subjects | Requirement Catalogue | Architecture | Admin* | War Room*
```

### Delivery Overview

Show profile/version, subject kind, requirement/knowledge/architecture baselines, proposed changes, collisions, architecture impacts, blockers and readiness.

### Drill Workspace

Three panes: personal focus, assistant-ui chat/Tool UI, structured current/proposed state.

### Requirements / Change Set

Default to Proposed changes / Affected current / All, with explicit CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE.

### Architecture Impact

Side-by-side current topology and proposed impacts/architecture changes. Every node/edge can expose repository, commit, Markdown path and EXPLICIT/INFERRED evidence.

### Architecture baseline/admin

Show source repositories, current commits, ingestion run, findings and published baseline. Publishing is admin/steward action, never model action.

### Work Packages

Show confirmed implementation impacts, target architecture elements, linked repositories/teams when available, requirements, dependencies, acceptance/evals and readiness.

### Readiness

Show exact deterministic blockers including profile, stale requirement/architecture baseline, unreviewed requirement collision and missing/untrusted architecture impact where required.

## 8. User stories

### Sponsor
- Start an idea and see how it changes current truth rather than reading a flat requirement list.

### Delivery Lead
- Select/pin profile and architecture baseline when required.
- See existing requirements/knowledge/systems likely affected.
- Decide requirement change type.
- See collisions with other active subjects.
- See where implementation is grounded in current system topology.

### Perspective Owner/Delegate
- Answer focused questions and verify exact proposed revisions.
- Inspect source-grounded system impacts relevant to my perspective.

### Architect/System Owner
- See which architecture traversal caused an impact proposal.
- Inspect Markdown/commit source evidence.
- Confirm/reject/correct impacted systems/components/APIs/repositories/teams.
- Distinguish code change from VERIFY_ONLY impact.

### Architecture Steward/Admin
- Configure architecture Git sources.
- Review inferred/ambiguous ingestion output.
- Resolve duplicate/unresolved architecture identifiers.
- Publish immutable architecture baseline.

### Requirement Steward/Admin
- Change “requirements for requirements” by publishing Requirement Profile versions, including architecture policy.

### Downstream consumer
- Retrieve explicit requirement/knowledge/architecture change operations and implementation targets with pinned baseline versions/commits.

### War-room operator
- Diagnose MODEL/PROMPT/CONTEXT/KNOWLEDGE/ARCHITECTURE_INGESTION/ARCHITECTURE_IMPACT/WORKFLOW/DOMAIN_MODEL/UX/OWNERSHIP/CONCURRENCY/BASELINE_MATCHING/PROFILE failures.

## 9. Readiness baseline

READY requires all blocking checks to pass, including:

- outcome defined;
- published Requirement Profile version pinned;
- no blocking profile findings;
- all active subject requirements linked to explicit change proposals;
- no stale requirement baseline;
- no blocking unreviewed duplicate/contradiction candidate;
- all required perspectives confirmed and owned/delegated;
- HIGH/CRITICAL proposed requirements current-revision verified and authoritatively sourced;
- no blocking gap/conflict/assumption/dependency/task;
- critical proposed requirements allocated to targeted work packages;
- current-revision acceptance/evals present as required;
- when profile architecture policy requires it: current published architecture baseline pinned;
- no stale architecture impacts/change proposals;
- HIGH/CRITICAL requirements have confirmed current-revision architecture impact;
- confirmed impact relies on sufficiently reviewed topology;
- HIGH/CRITICAL requirements have concrete work-package implementation target.

Readiness percentage is informational only.

## 10. Final handoff contract

```json
{
  "deliverySubject": {},
  "profile": {"id": "api-change", "version": 8},
  "scope": {},
  "sourceArtifacts": [],
  "requirementChanges": [],
  "knowledgeChanges": [],
  "architecture": {
    "baseline": {"id": "AB-9", "version": 9, "sourceCommits": []},
    "requirementImpacts": [],
    "architectureChanges": []
  },
  "matchesReviewed": [],
  "decisions": [],
  "assumptions": [],
  "verifications": [],
  "workPackages": [],
  "implementationTargets": [],
  "acceptanceCriteria": [],
  "evaluations": [],
  "dependencies": [],
  "traceability": [],
  "readiness": {}
}
```

Req Helper answers **what current truth is affected, what is proposed to change, which current systems realize the affected behavior, where implementation/verification should be directed, why, according to whom, based on what source evidence, and how we will know the proposed change is correct**.

Downstream SDLC answers **how to implement/test/deploy it**. Only later explicit reconciliation can make delivered changes current enterprise requirement/knowledge/architecture baseline.
