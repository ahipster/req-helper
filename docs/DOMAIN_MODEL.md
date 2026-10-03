# Domain and Information Model

This document is the canonical semantic model for Req Helper. `src/domain/schemas.ts` and `src/domain/architecture.ts` are the executable representations and must stay aligned.

## 1. Core semantic boundaries

Req Helper separates:

1. **Current enterprise baseline** — accepted requirement, knowledge and normalized architecture versions in effect now.
2. **Delivery Subject proposal state** — changes being discovered/reviewed for one idea/subject.
3. **Requirement Profile** — versioned quality/completeness rules, including optional architecture-impact policy.
4. **Architecture ingestion** — a derived ArchiMate-inspired graph normalized from exact Git Markdown commits.
5. **Application capability/access/authority** — global roles, subject membership and perspective authority.
6. **Knowledge/provenance/verification** — evidence for why a proposal exists and who authoritatively verified it.
7. **Conversation/harness/UI state** — interaction/execution state that never substitutes for domain truth.

A proposed requirement/architecture change is not current enterprise truth. Reaching READY/HANDED_OFF does not promote it.

## 2. Conceptual model

```text
RequirementProfile ----< RequirementProfileVersion
       |                         |
       |                         +-- RequirementProfileArchitecturePolicy
       |                                      |
       |                                      v
       |                            DeliverySubjectArchitectureContext
       |                                      |
       v                                      v
DeliverySubject ---------------------- ArchitectureBaseline
    |                                      /      \
    |                              ArchitectureElement
    |                              ArchitectureRelationship
    |                                      |
    |                                      v
    |                         RequirementArchitectureImpact
    |                                      |
    |                                      v
    |                         WorkPackageImplementationTarget
    |
    +-- RequirementChangeProposal -> proposed Requirement
    |           |                       |
    |           v                       v
    |    CURRENT RequirementCatalog   RequirementRevision
    |                                   |
    |                                   v
    |                             RequirementSource
    |
    +-- KnowledgeReference -> ProposedDiff
    +-- RequirementMatch / RequirementQualityFinding
    +-- Perspective -> Assignment -> Task -> Contribution/Evidence
    +-- Gap / Assumption / Conflict / Decision
    +-- ArchitectureChangeProposal
    +-- WorkPackage / Acceptance / Eval / Dependency
    +-- Message / Event / AgentThread / AgentRun
```

Architecture source lineage:

```text
ArchitectureSource(GIT_MARKDOWN)
  -> exact source commit(s)
  -> ArchitectureIngestionRun
  -> ArchitectureIngestionFinding
  -> immutable published ArchitectureBaseline
```

## 3. Delivery Subject

Delivery Subject is the durable aggregate for one proposed enterprise change.

It contains immutable `initialSignal`, optional `subjectKind`, pinned Requirement Profile ID/version, problem/outcome, scope, constraints, success measures, lifecycle and monotonically increasing domain revision.

Lifecycle:

```text
DRAFT -> DISCOVERING -> DRILLING -> RESOLVING -> SPLITTING -> READY -> HANDED_OFF
                         ^              |
                         +--------------+
```

`CANCELLED` is terminal. `HANDED_OFF` means downstream received the change set; it does not mean any baseline changed.

## 4. Requirement Profile

Requirement Profile is the configurable **requirements-for-requirements** contract.

Stable identity:

```text
RequirementProfile
  id
  name
  currentPublishedVersion
```

Immutable version:

```text
RequirementProfileVersion
  profileId
  version
  status = DRAFT | PUBLISHED | RETIRED
  applicableSubjectKinds[]
  requiredPerspectiveTypes[]
  typePolicies[]
  existing-requirement-search policy
  duplicate threshold
  contradiction-review policy
```

Published versions never mutate. A Delivery Subject pins one exact version.

### Requirement type policy

Per RequirementType, profile can define enabled/required-by-default, rationale/owner/capability/provenance rules, minimum acceptance, automatable acceptance, required eval types and typed detail fields.

Typed values:

```text
TEXT | BOOLEAN | NUMBER | ENUM | REFERENCE | TEXT_LIST | REFERENCE_LIST
```

### Architecture policy

`RequirementProfileArchitecturePolicy` is version-bound to the Requirement Profile version and can require:

```text
requireArchitectureBaseline
requireConfirmedImpactForHighCritical
requireImplementationTargetForHighCritical
allowNeedsReviewElementsForImpact
```

This avoids forcing architecture/system routing onto subjects where it is irrelevant while making it deterministic for technical delivery profiles.

## 5. Requirement quality findings

Deterministic profile evaluation creates `RequirementQualityFinding` with profile/version, rule, severity, blocking flag, message and `OPEN | RESOLVED | WAIVED` status. Blocking OPEN findings prevent READY.

## 6. Current Requirement Catalogue

`RequirementCatalogItem` is stable identity for accepted current requirements. `RequirementCatalogVersion` is immutable semantic history.

Current requirement catalogue is read/reference data for subject workflows; subject READY/HANDED_OFF never mutates it.

## 7. Proposed Requirement

`deliverySubjects/{subjectId}/requirements/{id}` is a **subject-local proposed requirement**.

It contains type, title/statement/rationale, priority/criticality, owner, capabilityRefs, typed details, lifecycle, evaluation flag and semantic revision.

Lifecycle:

```text
DRAFT | NEEDS_INPUT | PROPOSED | CONFLICTED | SUPERSEDED
```

Verification is separate.

## 8. Requirement Change Proposal

Every material proposed requirement is contextualized by:

```text
CREATE | MODIFY | SUPERSEDE | RETIRE | NO_CHANGE
```

MODIFY/SUPERSEDE/RETIRE/NO_CHANGE pin exact current baseline requirement ID/version.

`STALE_BASELINE` blocks readiness until explicit reassessment/rebase.

## 9. Requirement matching/collision detection

Compare proposed semantics with both CURRENT catalogue and ACTIVE proposals in other subjects.

Persist `RequirementMatch`:

```text
candidateKind = BASELINE_REQUIREMENT | ACTIVE_PROPOSAL
relationship = DUPLICATE | OVERLAPS | CONTRADICTS | RELATED
status = UNREVIEWED | CONFIRMED | DISMISSED
```

Blocking UNREVIEWED matches prevent READY.

## 10. Capabilities

Requirement type and enterprise capability are orthogonal. `capabilityRefs[]` drive requirement retrieval, architecture traversal, collision detection, impact analysis and bigger-picture views.

## 11. RequirementRevision and RequirementSource

Every semantic human/AI edit creates immutable RequirementRevision.

RequirementSource is canonical revision-bound provenance and may point to Contribution, Evidence, KnowledgeReference, Decision, Assumption, SourceArtifact, BASELINE_REQUIREMENT or AI_INFERENCE.

Prior-revision verification/acceptance/evals never satisfy a newer revision.

## 12. KnowledgeReference and ProposedDiff

KnowledgeReference preserves external identity/version/fingerprint metadata.

ProposedDiff describes `ADD | MODIFY | REMOVE | DEPRECATE | UNKNOWN_CHANGE`, pins source version/fingerprint where available, can become `STALE_BASELINE`, and never writes back automatically in P0.

## 13. Architecture source

P0 architecture source is only:

```text
ArchitectureSource.sourceType = GIT_MARKDOWN
```

An ArchitectureSource records repository, default branch, optional path prefixes, enablement and current resolved commit metadata.

Sparx is explicitly outside P0.

The source Git repositories remain authoritative architecture material. Req Helper stores a **derived normalized mirror**, not a replacement authoring repository.

## 14. Architecture ingestion run

`ArchitectureIngestionRun` records exact source commit set, lifecycle, schema/prompt/model metadata and file counts.

Lifecycle:

```text
QUEUED -> SCANNING -> EXTRACTING -> RECONCILING -> VALIDATING -> SUCCEEDED
any stage -> FAILED
```

The LLM may extract from Markdown prose/front matter/links/folders/tables/text diagrams, but application code owns reconciliation/validation/publication.

## 15. Architecture source evidence

Every published architecture element/relationship has at least one `ArchitectureSourceEvidence`:

```text
sourceId
commitSha
path
blobSha/fingerprint
line range/excerpt when available
mode = EXPLICIT | INFERRED
```

`EXPLICIT` means directly stated/structurally encoded in source. `INFERRED` means interpretation was required.

The LLM may not fabricate missing topology. Ambiguity remains visible.

## 16. Architecture normalized model

The model follows ArchiMate semantics where useful but includes practical extensions required to route delivery.

### Element types

```text
CAPABILITY
BUSINESS_ACTOR
BUSINESS_ROLE
BUSINESS_PROCESS
BUSINESS_SERVICE
BUSINESS_OBJECT
APPLICATION_COMPONENT
APPLICATION_SERVICE
APPLICATION_INTERFACE
DATA_OBJECT
NODE
TECHNOLOGY_SERVICE
INFORMATION_CONCEPT
POLICY
CONTROL
API
EVENT
REPOSITORY
TEAM
OTHER
```

### Relationship types

```text
REALIZES
SERVES
ASSIGNED_TO
ACCESSES
TRIGGERS
FLOWS_TO
COMPOSED_OF
AGGREGATES
SPECIALIZES
ASSOCIATED_WITH
OWNS
IMPLEMENTS
EXPOSES
CONSUMES
READS
WRITES
DEPENDS_ON
DEPLOYED_TO
GOVERNED_BY
```

Practical extensions are intentional. Do not distort useful repository/team/API semantics merely for notation purity.

## 17. Architecture identity and review

`ArchitectureElement.stableKey` is stable identity within normalized architecture.

Preferred derivation:

1. explicit source stable ID;
2. explicit canonical reference/link;
3. deterministic path-derived identity where one file clearly represents one element;
4. model-proposed identity requiring review.

Similar names never justify silent merge.

Elements/relationships have:

```text
reviewStatus = CONFIRMED | NEEDS_REVIEW | REJECTED
extractionConfidence?
sourceEvidence[]
```

Duplicate/conflicting definitions and unresolved references become `ArchitectureIngestionFinding` records.

## 18. Architecture baseline

`ArchitectureBaseline` is an immutable published normalized snapshot.

It stores:

```text
id/version
status = DRAFT | PUBLISHED | SUPERSEDED
exact sourceCommits[]
ingestionRunIds[]
schemaVersion
fingerprint
published metadata
```

Incremental ingestion may extract only changed files, but publication always yields a coherent complete baseline.

## 19. Architecture views

`ArchitectureView` is a projection, not truth.

Useful P0 types:

```text
BUSINESS_PROCESS
APPLICATION_COOPERATION
SYSTEM_CONTEXT
INFORMATION_STRUCTURE
IMPLEMENTATION_IMPACT
CUSTOM
```

Source Markdown may define views; Req Helper may also compose dynamic views from the graph for a subject.

## 20. Delivery Subject architecture context

When the selected profile requires architecture analysis, subject pins exact:

```text
architectureBaselineId
architectureBaselineVersion
baselineFingerprint
status = CURRENT | STALE_BASELINE
```

If published current architecture advances, subject context becomes stale until explicitly reassessed.

## 21. RequirementArchitectureImpact

Architecture impact links one current proposed Requirement revision to one normalized architecture element in the pinned baseline.

```text
requirementId + requirementRevision
architectureBaselineId + version
architectureElementKey
impactType
rationale
confidence?
sourceRelationshipIds[]
status = PROPOSED | CONFIRMED | REJECTED | STALE_BASELINE
```

Impact types:

```text
IMPLEMENT
MODIFY
ADAPT
CONSUME
PROVIDE
CONFIGURE
MIGRATE
DEPRECATE
VERIFY_ONLY
NO_CHANGE
```

AI may propose impact. Material impact becomes authoritative for routing only after confirmation by appropriate human workflow.

`VERIFY_ONLY` explicitly models systems that need compatibility/behavior verification but no known code change.

## 22. ArchitectureChangeProposal

Requirement impact does not automatically mean topology itself changes.

When future architecture structure is explicitly proposed, use:

```text
ADD | MODIFY | REMOVE | DEPRECATE | NO_CHANGE
```

Target is ELEMENT or RELATIONSHIP in the pinned baseline, or a new proposed stable key for ADD.

ArchitectureChangeProposal is future state only; P0 never writes it into architecture Git.

## 23. WorkPackageImplementationTarget

Work-package routing links:

```text
WorkPackage
 -> RequirementArchitectureImpact
 -> ArchitectureElement
 -> optional REPOSITORY element
 -> optional TEAM element
```

This is the traceable answer to **where development/verification is directed**.

A human `coordinatorId` or free-text target area does not substitute for architecture implementation target when the profile requires one.

## 24. Current versus proposed invariant

Requirement, knowledge and architecture all use the same temporal separation:

```text
CURRENT BASELINE
     |
     v
Delivery Subject proposal
     |
     +-- requirement changes
     +-- knowledge diffs
     +-- architecture impacts/change proposals
     |
     v
READY/HANDED_OFF
     |
     X no automatic baseline/source mutation
```

Later downstream delivery/reconciliation may update source repositories; a future ingestion then publishes new CURRENT baseline versions.

## 25. Access/authority model

Global roles:

```text
ADMIN | PARTICIPANT | DELIVERY_LEAD | WAR_ROOM_OPERATOR
```

Subject membership:

```text
SPONSOR | DELIVERY_LEAD | PARTICIPANT | OBSERVER
```

Perspective assignment:

```text
OWNER | DELEGATE | CONTRIBUTOR | REVIEWER
```

OWNER/DELEGATE may provide authoritative perspective verification. REVIEWER is advisory.

Architecture baseline publication/configuration is backend/admin/steward behavior; requirement impact confirmation follows subject/perspective authority.

## 26. Perspective / Contribution / Evidence / Verification

Perspective lifecycle:

```text
PROPOSED -> CONFIRMED -> IN_PROGRESS -> COMPLETE
                           |
                           +-> BLOCKED -> IN_PROGRESS
```

Contribution stores statement, epistemic mode, separate stated/extraction confidence and evidence. Confidence does not confer authority.

Verification is append-only human judgment. Requirement verification always targets exact current revision.

## 27. Gap, Assumption, Conflict, Decision

Gap represents missing information.

Assumption stores owner, confidence, criticality, blocking, validation and impact-if-wrong.

Conflict is N-party with 2+ positions and asynchronous participant tasks. AI can summarize/frame options; named human records Decision/source correction.

Decision is explicit human-owned state.

## 28. Task

Types:

```text
DRILL | VERIFY | REVIEW | RESOLVE_CONFLICT | FILL_GAP |
DECIDE | FOLLOW_UP | FINAL_REVIEW
```

Lifecycle:

```text
OPEN -> IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED
                     \-> WAITING_ON_OTHER -> IN_PROGRESS
Any nonterminal -> CANCELLED
```

My Work uses non-authoritative TaskInboxItem projection.

## 29. WorkPackage, Acceptance, Evaluation, Dependency

WorkPackage still carries target area/team/coordinator and proposed Requirement IDs, but when architecture policy requires implementation targeting it must also be linked through `WorkPackageImplementationTarget`.

AcceptanceCriterion/Evaluation target REQUIREMENT / WORK_PACKAGE / DELIVERY_SUBJECT. Requirement targets always include exact proposed requirement revision.

Unresolved `blocking=true` dependency prevents READY.

## 30. Traceability

Minimum lineage becomes:

```text
Signal / SourceArtifact
 -> CURRENT Requirement/Knowledge/Architecture baseline
 -> RequirementMatch / architecture traversal
 -> RequirementChangeProposal / ProposedDiff / ArchitectureChangeProposal
 -> Contribution / Evidence / Decision
 -> proposed RequirementRevision + RequirementSource
 -> Verification
 -> RequirementArchitectureImpact
 -> WorkPackageImplementationTarget
 -> WorkPackage
 -> AcceptanceCriterion / Evaluation
```

Reverse traversal answers:

- why does this proposal exist?
- what current truth will it replace/change?
- which current systems realize the affected behavior?
- why is this repository/team/system an implementation or verification target?

## 31. Readiness

Readiness is deterministic over persisted state.

Core blocking checks include:

1. problem/outcome defined;
2. published Requirement Profile version pinned;
3. no blocking OPEN RequirementQualityFinding;
4. all active subject Requirements classified through RequirementChangeProposal;
5. no RequirementChangeProposal `STALE_BASELINE`;
6. no blocking UNREVIEWED RequirementMatch;
7. all required perspectives confirmed and owned/delegated;
8. HIGH/CRITICAL proposed Requirements current-revision authoritatively verified/sourced;
9. no blocking gap/conflict/assumption/dependency/task;
10. critical proposed requirements packaged;
11. current-revision acceptance/evals present where required.

When architecture policy requires it, also:

12. architecture baseline pinned;
13. architecture context not stale;
14. no stale architecture impacts/change proposals;
15. every HIGH/CRITICAL requirement has confirmed current-revision architecture impact;
16. confirmed impacts use reviewed/trusted topology if policy disallows NEEDS_REVIEW;
17. every HIGH/CRITICAL requirement has a work-package implementation target when configured.

Score is informational only.

## 32. Profile upgrade semantics

A newer published profile never silently changes an existing subject. Delivery Lead compares old/new profile, previews findings and explicitly upgrades or stays pinned.

Architecture policy changes are part of the same profile-version upgrade semantics.

## 33. Downstream package contract

P0 serves explicit change operations through package/work-package APIs.

Package includes pinned profile, requirement/knowledge baselines, architecture baseline source commits, requirement impacts, architecture change proposals, implementation targets, decisions, work packages, acceptance/evals, dependencies, traceability and readiness.

Downstream never treats OpenCode/session state or unconfirmed LLM architecture extraction as product truth.

Later delivery/reconciliation may update the source Git architecture and requirement catalogue, but promotion is outside P0.
