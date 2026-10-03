# Domain and Information Model

This document is the canonical semantic model for Req Helper. `src/domain/schemas.ts` is the executable representation and must stay aligned.

## 1. Core semantic boundaries

Req Helper separates:

1. **Current enterprise baseline** — accepted requirement/knowledge versions in effect now.
2. **Delivery Subject proposal state** — changes being discovered/reviewed for one idea/subject.
3. **Requirement Profile** — versioned quality/completeness rules for what a good requirement/change set must contain.
4. **Application capability/access/authority** — global roles, subject membership and perspective authority.
5. **Knowledge/provenance/verification** — evidence for why a proposal exists and who authoritatively verified it.
6. **Conversation/harness/UI state** — interaction/execution state that never substitutes for domain truth.

A proposed requirement is not current enterprise truth. Reaching READY/HANDED_OFF does not promote it.

## 2. Conceptual model

```text
RequirementProfile ----< RequirementProfileVersion
                               |
                               | pinned by
                               v
UserProfile ---- DeliverySubjectMembership ---- DeliverySubject
                                                  |
                                      RequirementChangeProposal
                                       /                  \
                                      v                    v
                       CURRENT RequirementCatalog      proposed Requirement
                              |                              |
                              v                              v
                    RequirementCatalogVersion       RequirementRevision
                              ^                              |
                              |                              v
                         RequirementMatch          RequirementSource
                              ^                              |
                              |                              v
                    other active proposals       Verification / Acceptance / Eval

DeliverySubject
  ├─ Perspective -> Assignment -> Task -> Contribution/Evidence
  ├─ KnowledgeReference -> ProposedDiff
  ├─ RequirementQualityFinding
  ├─ Gap / Assumption / Conflict / Decision
  ├─ WorkPackage / Dependency
  └─ Message / Event / AgentThread / AgentRun
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

`CANCELLED` is terminal. `HANDED_OFF` means downstream received the change set; it does not mean the baseline changed.

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

Published versions never mutate. A Delivery Subject pins one exact version. New profile versions do not silently alter existing subjects.

### Requirement type policy

Per RequirementType, profile can define:

- enabled / required-by-default;
- rationale/owner/capability/provenance requirements;
- minimum acceptance criteria;
- automatable acceptance requirement;
- required evaluation types;
- typed detail fields.

### Typed profile detail fields

```text
TEXT | BOOLEAN | NUMBER | ENUM | REFERENCE | TEXT_LIST | REFERENCE_LIST
```

Requirement stores typed `RequirementDetailValue[]` keyed by field key. Core schema stays stable while quality rules evolve through profile versions.

## 5. Requirement quality findings

Deterministic profile evaluation creates `RequirementQualityFinding`:

```text
profileId/version
requirementId?
ruleId
severity
blocking
message
status = OPEN | RESOLVED | WAIVED
waiverDecisionId?
```

Blocking OPEN findings prevent READY. WAIVED requires explicit human governance/audit.

## 6. Current Requirement Catalogue

`RequirementCatalogItem` is the stable identity for accepted current requirements.

```text
id / stableKey
type
title
lifecycle = ACTIVE | DEPRECATED | RETIRED
currentVersion
capabilityRefs[]
authoritative source metadata
```

`RequirementCatalogVersion` is immutable and contains the semantic snapshot at one published version.

```text
requirementId
version
type/title/statement/rationale/criticality
capabilityRefs[]
typed details[]
source version/fingerprint
published metadata
```

The catalogue may be a Req Helper mirror of an external authoritative source. P0 treats it as read-only reference data for subject workflows.

## 7. Proposed Requirement

`deliverySubjects/{subjectId}/requirements/{id}` is a **subject-local proposed requirement**, not the current enterprise requirement.

Requirement has:

- type;
- title/statement/rationale;
- priority and criticality;
- owner;
- capabilityRefs[];
- typed profile detail values[];
- lifecycle status;
- requiresEvaluation;
- semantic revision.

Requirement lifecycle remains:

```text
DRAFT | NEEDS_INPUT | PROPOSED | CONFLICTED | SUPERSEDED
```

Verification is separate.

## 8. Requirement Change Proposal

Every material proposed requirement is contextualized by an explicit change operation:

```text
CREATE | MODIFY | SUPERSEDE | RETIRE | NO_CHANGE
```

`RequirementChangeProposal` stores:

- deliverySubjectId;
- changeType;
- exact baseline requirement ID/version where applicable;
- proposed Requirement ID where applicable;
- rationale;
- lifecycle/status;
- conflict/supersession links.

Status:

```text
DRAFT -> PROPOSED -> VERIFIED -> APPROVED_FOR_HANDOFF -> HANDED_OFF
  \-> REJECTED | WITHDRAWN
```

`STALE_BASELINE` is a blocking exceptional state.

### Invariants

- CREATE: no baseline requirement; proposed requirement required.
- MODIFY/SUPERSEDE: baseline ID/version + proposed requirement required.
- RETIRE/NO_CHANGE: baseline ID/version required; proposed requirement may be absent.
- Baseline version must still be current at readiness or proposal must be explicitly rebased/reassessed.

## 9. Requirement matching/collision detection

Potential new/changed requirement must be compared with:

1. CURRENT catalogue requirements;
2. active proposals in other Delivery Subjects.

`RequirementMatch` persists the model/human review trail:

```text
subjectRequirementId
candidateKind = BASELINE_REQUIREMENT | ACTIVE_PROPOSAL
candidateId/version?
relationship = DUPLICATE | OVERLAPS | CONTRADICTS | RELATED
score?
rationale
blocking
status = UNREVIEWED | CONFIRMED | DISMISSED
```

A model score is evidence, not authority. Blocking UNREVIEWED matches prevent READY.

This avoids adding a new requirement when the correct operation is MODIFY/SUPERSEDE and exposes parallel contradictory proposals before handoff.

## 10. Capabilities

Requirement type and enterprise capability are distinct dimensions.

```text
Requirement.type = INTEGRATION
Requirement.capabilityRefs = [Customer Verification, Customer Data Distribution]
```

Capabilities are stable enterprise references/URIs. They drive retrieval, impact analysis, duplicate detection, work-package grouping and bigger-picture views.

## 11. RequirementRevision

Every semantic human or AI edit creates immutable RequirementRevision containing the full proposed requirement snapshot plus actor/reason metadata.

Canonical provenance is not embedded in the revision; it is represented by RequirementSource records tied to exact requirement revision.

Human form edits and AI proposals use the same revision service.

## 12. RequirementSource

RequirementSource links one proposed requirement revision to a source:

```text
CONTRIBUTION
EVIDENCE
KNOWLEDGE_REFERENCE
DECISION
ASSUMPTION
SOURCE_ARTIFACT
BASELINE_REQUIREMENT
AI_INFERENCE
```

It can preserve source version. AI inference never becomes authority automatically.

## 13. KnowledgeReference and ProposedDiff

KnowledgeReference snapshots identity/version/fingerprint metadata for an external enterprise artifact.

ProposedDiff describes advisory change:

```text
ADD | MODIFY | REMOVE | DEPRECATE | UNKNOWN_CHANGE
```

It records baseline version/fingerprint where available. If source advances, proposal becomes `STALE_BASELINE` until reassessed.

P0 never writes the proposed diff back to the authoritative knowledge source.

## 14. Current versus proposed invariant

UI/API must always be able to distinguish:

```text
CURRENT BASELINE
  REQ-248 v6

PROPOSED BY DS-123
  MODIFY REQ-248 v6 -> R-17 rev3

NOT MERGED
```

The final package is a change set, not a flat list that forces downstream systems to infer intent.

## 15. Access/authority model

### Global system roles

```text
ADMIN | PARTICIPANT | DELIVERY_LEAD | WAR_ROOM_OPERATOR
```

### Delivery Subject membership

```text
SPONSOR | DELIVERY_LEAD | PARTICIPANT | OBSERVER
```

### Perspective assignment

```text
OWNER | DELEGATE | CONTRIBUTOR | REVIEWER
```

OWNER/DELEGATE may provide authoritative perspective verification. REVIEWER is advisory.

## 16. Perspective

```text
PROPOSED -> CONFIRMED -> IN_PROGRESS -> COMPLETE
                           |
                           +-> BLOCKED -> IN_PROGRESS
```

Required PROPOSED perspective or required perspective without OWNER/DELEGATE blocks readiness.

## 17. Contribution and Evidence

Contribution stores human statement, epistemic mode, separate stated/extraction confidence, perspective/author and Evidence references. Confidence does not confer authority.

Evidence kinds:

```text
HUMAN_STATEMENT | KNOWLEDGE_REFERENCE | OBSERVATION | POLICY |
DECISION | SOURCE_ARTIFACT | OTHER
```

## 18. Verification

Verification is append-only human judgment.

```text
CONTRIBUTION  -> no targetRevision
REQUIREMENT   -> exact targetRevision required
PROPOSED_DIFF -> exact targetRevision required
```

For proposed Requirement readiness, only ACTIVE VERIFIED for the current revision from active OWNER/DELEGATE for the stated perspective counts.

## 19. Gap, Assumption, Conflict, Decision

Gap represents missing information.

Assumption stores owner, confidence, criticality, blocking, validation and impact-if-wrong.

Conflict is N-party with 2+ positions and asynchronous participant tasks. AI can summarize/frame options; named human records Decision or source correction.

Decision stores question, alternatives, chosen decision, rationale, owner, participants, affected requirements and supersession.

## 20. Task

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

## 21. WorkPackage, Acceptance, Evaluation, Dependency

WorkPackage identifies target implementation area/team/coordinator and proposed Requirement IDs.

AcceptanceCriterion/Evaluation target:

```text
REQUIREMENT | WORK_PACKAGE | DELIVERY_SUBJECT
```

Requirement targets always include exact proposed requirement revision.

Unresolved `blocking=true` dependency prevents READY.

## 22. Traceability

Minimum lineage becomes:

```text
Signal / SourceArtifact
 -> CURRENT baseline Requirement/Knowledge
 -> RequirementMatch / impact hypothesis
 -> RequirementChangeProposal / ProposedDiff
 -> Contribution / Evidence / Decision
 -> proposed RequirementRevision + RequirementSource
 -> Verification
 -> WorkPackage
 -> AcceptanceCriterion / Evaluation
```

Reverse traversal answers both **why does this proposal exist?** and **what current truth will it replace/change?**

## 23. Readiness

Readiness is deterministic over persisted state. Blocking baseline includes:

1. problem/outcome defined;
2. published Requirement Profile version pinned;
3. no blocking OPEN RequirementQualityFinding;
4. all active subject Requirements classified through RequirementChangeProposal;
5. no RequirementChangeProposal `STALE_BASELINE`;
6. no blocking UNREVIEWED RequirementMatch;
7. all required perspectives confirmed and owned/delegated;
8. HIGH/CRITICAL proposed Requirements current-revision authoritatively verified/sourced;
9. no blocking gap/conflict/assumption/dependency/task;
10. required enterprise impacts linked;
11. critical proposed requirements packaged into targeted WorkPackages;
12. current-revision acceptance/evals present where required.

Score is informational only.

## 24. Profile upgrade semantics

When a newer profile is published:

```text
subject pinned to v8
profile v9 published
      |
      v
compare v8 -> v9
      |
      v
preview added/removed quality findings
      |
      +-- keep v8
      +-- explicit upgrade to v9 + audit event
```

No silent readiness-rule changes.

## 25. Downstream package contract

P0 serves explicit change operations:

```text
GET /api/delivery-subjects/{id}/package
GET /api/delivery-subjects/{id}/work-packages/{workPackageId}
```

Package includes pinned profile, baseline references, requirement changes, knowledge changes, reviewed matches/collisions, decisions, work packages, acceptance/evals, dependencies, traceability and readiness.

Downstream never treats OpenCode/session state as product truth. Later delivery/reconciliation may publish new baseline versions, but that promotion is outside P0.
