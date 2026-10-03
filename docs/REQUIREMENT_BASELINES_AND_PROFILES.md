# Requirement Profiles, Baselines and Change Proposals

## Why this exists

Req Helper must not treat every Delivery Subject as a blank sheet. A new signal should first discover the **current accepted requirements and knowledge** that already describe the affected capabilities, processes, APIs, systems and concepts.

The product must answer three different questions without conflating them:

1. What is CURRENT today?
2. What does this Delivery Subject PROPOSE to change?
3. What becomes CURRENT only after downstream delivery/reconciliation?

The current baseline is never overwritten merely because a Delivery Subject proposes a change.

## Core lifecycle

```text
CURRENT enterprise baseline
        |
        | discover/match
        v
Delivery Subject DS-123
        |
        +-- CREATE proposed requirement
        +-- MODIFY existing requirement v6
        +-- SUPERSEDE existing requirement v4
        +-- RETIRE existing requirement v2
        +-- NO_CHANGE existing requirement v8
        |
        +-- MODIFY KnowledgeReference(source version 12)
        |
        v
verified change set
        |
        v
READY / HANDOFF
        |
        v
Downstream implementation/deployment
        |
        v
explicit reconciliation/promotion event
        |
        v
NEW CURRENT baseline version
```

P0 stops at READY/HANDED_OFF. It **does not promote proposals into the current requirement catalogue or external knowledge source**.

## Requirement catalogue

Req Helper keeps a typed catalogue/mirror of current accepted requirements. In production this may be synced from an authoritative requirement repository rather than owned by Req Helper.

Stable identity:

```text
requirementCatalog/{stableRequirementId}
```

Immutable versions:

```text
requirementCatalog/{stableRequirementId}/versions/{version}
```

The stable record points to `currentVersion`. Versions never mutate after publication.

Example:

```text
REQ-248
  type: INTEGRATION
  lifecycle: ACTIVE
  currentVersion: 6
  capabilityRefs:
    - enterprise://capabilities/customer-verification

REQ-248/v6
  "Channels may obtain verification status from Customer API."
```

## Delivery Subject requirements are proposals

`deliverySubjects/{subjectId}/requirements/{id}` is a working/proposed Requirement, not the enterprise current baseline.

A separate `RequirementChangeProposal` says what the subject intends to do:

```text
CREATE
MODIFY
SUPERSEDE
RETIRE
NO_CHANGE
```

Examples:

```text
Proposal CP-1
  changeType: MODIFY
  baselineRequirementId: REQ-248
  baselineVersion: 6
  proposedRequirementId: R-17

Proposal CP-2
  changeType: CREATE
  baselineRequirementId: none
  proposedRequirementId: R-18
```

This prevents the ambiguous state where a proposed requirement looks like current enterprise truth.

## Proposal status

```text
DRAFT
 -> PROPOSED
 -> VERIFIED
 -> APPROVED_FOR_HANDOFF
 -> HANDED_OFF

Any pre-handoff state -> REJECTED | WITHDRAWN
```

`HANDED_OFF` still does not mean current enterprise baseline has changed.

Future reconciliation may record `PROMOTED` externally or create a new catalogue version after evidence that delivery actually went live.

## Baseline version pinning

A MODIFY/SUPERSEDE/RETIRE/NO_CHANGE proposal references the **exact baseline version** that was analyzed.

If REQ-248 currentVersion moves from 6 to 7 while DS-123 is still active:

```text
DS-123 proposal targets REQ-248 v6
Current baseline is now REQ-248 v7
            |
            v
STALE BASELINE
            |
            +-> rebase proposal to v7
            +-> reassess diff/conflicts/acceptance
```

A stale baseline blocks READY until explicitly rebased or justified.

## Knowledge baseline pinning

KnowledgeReference already points to an external artifact/version. Every ProposedDiff must preserve the source version/fingerprint used as its baseline.

```text
Customer API contract
source version: 2.7
        |
        v
DS-123 ProposedDiff
baselineVersion: 2.7
MODIFY verificationStatus semantics
```

If the source becomes 2.8, the proposal becomes stale and must be re-evaluated before handoff.

No P0 write-back to the knowledge source occurs.

## Find existing before create

The workflow for a potential requirement is:

```text
new requirement idea
      |
      v
derive type + capability/context refs
      |
      v
search CURRENT catalogue
      |
      +--> semantic similarity
      +--> same capability
      +--> same API/system/process/concept
      +--> shared authoritative knowledge
      |
      v
search ACTIVE proposals in other Delivery Subjects
      |
      v
classify candidates
  DUPLICATE | OVERLAPS | CONTRADICTS | RELATED
      |
      v
human/AI review
      |
      +--> MODIFY/SUPERSEDE existing
      +--> link to existing and NO_CHANGE
      +--> confirm genuinely CREATE
      +--> create Conflict / cross-subject dependency
```

A CREATE proposal cannot become READY while blocking duplicate/contradiction candidates remain unresolved.

## Active proposal collision

Searching only CURRENT requirements is insufficient because two Delivery Subjects may simultaneously modify the same baseline.

Example:

```text
CURRENT REQ-248 v6
       |
       +-- DS-119 proposes MODIFY -> asynchronous event
       |
       +-- DS-123 proposes MODIFY -> synchronous API lookup
```

Req Helper must surface this immediately as an active-proposal collision. The subjects may be linked, one may supersede the other, or a Conflict/Decision can resolve the inconsistency.

The current catalogue remains unchanged while this is resolved.

## Requirement matches

Persist match/review records so duplicate detection is auditable rather than a hidden model judgment.

```text
RequirementMatch
  subjectRequirementId
  candidateKind: BASELINE_REQUIREMENT | ACTIVE_PROPOSAL
  candidateId
  candidateVersion?
  relationship: DUPLICATE | OVERLAPS | CONTRADICTS | RELATED
  score?
  rationale
  status: UNREVIEWED | CONFIRMED | DISMISSED
```

Model scores are evidence for review, not authority.

## Capabilities and typing

Every current/proposed requirement can link one or more capability references:

```text
capabilityRefs[]
```

Capabilities are stable enterprise references, normally KnowledgeReferences/external URIs, for example:

```text
enterprise://capabilities/customer-verification
enterprise://capabilities/customer-data-distribution
```

Capability links improve:

- existing requirement retrieval;
- impact analysis;
- duplicate/contradiction detection;
- work-package grouping;
- bigger-picture visualization;
- portfolio-level traceability later.

Requirement `type` remains orthogonal to capability. One capability may have BUSINESS, DATA, INTEGRATION, SECURITY and OPERATIONAL requirements.

## Requirement Profiles — requirements for requirements

A Requirement Profile defines the quality/completeness contract for a class of Delivery Subjects without changing TypeScript.

Stable profile:

```text
requirementProfiles/{profileId}
```

Immutable versions:

```text
requirementProfiles/{profileId}/versions/{version}
```

Example profiles:

- API Change;
- Data Model Change;
- Regulatory Change;
- Customer Journey Change;
- Operational Change;
- Migration;
- New Service;
- General.

A profile version can define:

- applicable subject kinds/tags;
- required perspective types;
- enabled/expected requirement types;
- requirement-type-specific required fields;
- typed detail fields;
- minimum acceptance criteria;
- required evaluation types/conditions;
- capability-link requirement;
- authoritative-provenance requirement;
- existing-requirement search requirement;
- duplicate/contradiction thresholds/policies;
- prompt/skill hints.

## Typed dynamic detail fields

The core Requirement schema remains stable. Profile-specific detail is represented as typed key/value records rather than arbitrary JSON.

Supported value types:

```text
TEXT
BOOLEAN
NUMBER
ENUM
REFERENCE
TEXT_LIST
REFERENCE_LIST
```

Example API profile:

```text
INTEGRATION
  producer              REFERENCE       required
  consumers             REFERENCE_LIST  required
  contract              REFERENCE       required
  failureBehaviour      TEXT            required
  compatibility         ENUM            required
  idempotencyBehaviour  TEXT            optional
```

A Requirement stores values by `fieldKey`. The selected profile version defines the type and whether it is required.

This allows fast iteration while preserving typed validation.

## Profile versioning

Publishing a profile creates an immutable version.

```text
API Change v8  PUBLISHED
API Change v9  DRAFT
```

A Delivery Subject pins:

```text
requirementProfileId
requirementProfileVersion
```

Publishing v9 does not silently alter DS-123 using v8.

The Delivery Lead may choose:

```text
[Compare profile v8 -> v9]
[Upgrade subject to v9]
```

The system computes newly introduced/removed profile gaps before the upgrade is committed.

## Profile compliance findings

Profile evaluation is deterministic where possible and produces typed findings:

```text
RequirementQualityFinding
  profileId/version
  requirementId?
  ruleId
  severity
  blocking
  message
  status: OPEN | RESOLVED | WAIVED
```

Examples:

```text
API-FAILURE-001
R-17 missing failureBehaviour
blocking

API-AC-002
R-17 has 1 acceptance criterion; profile minimum is 2
blocking
```

Blocking profile findings prevent READY.

A waiver is an explicit human decision/audit event, not a silent bypass.

## Admin iteration loop

```text
War room discovers recurring omission
        |
        v
Admin opens Requirement Profile
        |
        v
adds/changes typed rule
        |
        v
Publish v9
        |
        v
new subjects use v9
existing subjects remain pinned to v8
        |
        v
Delivery Lead may compare/upgrade
```

This is the fast way to iterate the **requirements for requirements** during the PoC.

## UI states

Requirements view should default to changes, not a flat undifferentiated list:

```text
[Proposed changes] [Affected current] [All]

MODIFY  REQ-248 v6 -> R-17 rev3
CREATE  new -> R-18 rev2
RETIRE  REQ-104 v2
NO_CHANGE REQ-301 v8
```

Detail view:

```text
CURRENT BASELINE                    DELIVERY SUBJECT PROPOSAL
REQ-248 v6                          R-17 rev3 / MODIFY
----------------                   -----------------------
Channels may obtain...              Authorized channels shall...
No freshness rule.                  Stale state fails closed.

Capability: Customer Verification   Same + Operations

Baseline status: CURRENT            Proposal status: VERIFIED
                                    Not merged into current
```

Knowledge uses the same visual language:

```text
CURRENT Customer API 2.7   |   PROPOSED MODIFY by DS-123
```

## Final handoff

The downstream package contains a **change set**, not merely a bag of final requirement text:

```json
{
  "deliverySubject": {},
  "profile": {"id":"api-change","version":8},
  "requirementChanges": [
    {
      "changeType":"MODIFY",
      "baseline":{"requirementId":"REQ-248","version":6},
      "proposedRequirement":{}
    }
  ],
  "knowledgeChanges": [],
  "conflicts": [],
  "decisions": [],
  "workPackages": [],
  "readiness": {}
}
```

This gives downstream implementation a precise answer to **what current truth should change**, rather than forcing it to infer changes from a new flat requirements list.
