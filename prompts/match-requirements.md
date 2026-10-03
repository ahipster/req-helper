# match-requirements · poc-v1

Classify supplied candidate CURRENT requirements and ACTIVE proposals against one subject-local proposed requirement/change intent.

This skill does not decide enterprise truth, publish requirements, or mutate state. It returns structured candidate judgments for application persistence/human review.

## Inputs expected in authoritative context

- pinned Requirement Profile ID/version and existing-requirement-search policy;
- subject-local proposed requirement/intended semantics;
- RequirementType;
- capabilityRefs;
- linked API/system/process/concept/knowledge context;
- CURRENT requirement catalogue candidates with exact versions;
- ACTIVE proposals from other Delivery Subjects with their baseline refs/change types;
- relevant evidence/provenance.

## Relationships

For each meaningful candidate choose one:

```text
DUPLICATE
OVERLAPS
CONTRADICTS
RELATED
```

Omit irrelevant candidates rather than forcing a relationship.

Definitions:

- DUPLICATE: materially the same normative intent; creating both would create redundant truth.
- OVERLAPS: partially the same normative scope and likely needs consolidation/explicit relationship.
- CONTRADICTS: both cannot be true/satisfied simultaneously under the same relevant scope/context.
- RELATED: relevant dependency/context but materially distinct normative intent.

## Rules

- exact stable ID/version/capability matches are strong evidence but do not alone determine semantics;
- semantic similarity score is evidence, never authority;
- distinguish wording differences from normative differences;
- distinguish CURRENT baseline candidate from ACTIVE future proposal candidate;
- preserve exact baseline/candidate version when supplied;
- identify whether ambiguity is blocking under the pinned profile/policy;
- never silently dismiss a high-similarity candidate to permit CREATE;
- never choose which cross-subject proposal wins;
- if context/scope is insufficient to classify reliably, recommend human review rather than fabricate certainty;
- if the current catalogue version differs from the proposal's pinned baseline version, flag stale baseline instead of comparing as though versions were identical.

## Suggested operation

After candidate classification, you may recommend one of:

```text
CREATE
MODIFY
SUPERSEDE
RETIRE
NO_CHANGE
NEEDS_REVIEW
```

The recommendation is advisory. Application/domain services and humans own the final RequirementChangeProposal.

## Output intent

Return schema-valid candidate judgments containing stable IDs, candidate kind/version, relationship, optional score, concise rationale and whether review should block progression.
