# Firestore Model

Cloud Firestore is the authoritative shared state store for the Req Helper PoC. `src/domain/schemas.ts` and `docs/DOMAIN_MODEL.md` remain canonical.

## Root collections

```text
users/{userId}
  /taskInbox/{itemId}                    # non-authoritative My Work projection
roleTemplates/{roleTemplateId}
perspectiveTemplates/{perspectiveTemplateId}

requirementProfiles/{profileId}
  /versions/{versionId}                  # immutable once PUBLISHED

requirementCatalog/{requirementId}
  /versions/{versionId}                  # immutable current/history snapshots

deliverySubjects/{subjectId}
```

Published Requirement Profile versions and Requirement Catalogue versions are reference data. Delivery Subject workflows do not directly overwrite them.

## Delivery Subject root

```ts
{
  id,
  title,
  initialSignal,
  subjectKind?,
  requirementProfileId?,
  requirementProfileVersion?,
  problemStatement?,
  desiredOutcome?,
  scopeIn: string[],
  scopeOut: string[],
  constraints: string[],
  successMeasures: string[],
  status,
  priority?,
  sponsorId?,
  deliveryLeadId?,
  currentIteration,
  revision,
  readinessState?,
  readinessScore?,
  createdAt,
  updatedAt
}
```

`revision` increments on material subject-domain mutation.

## Delivery Subject subcollections

```text
deliverySubjects/{subjectId}/members/{userId}
deliverySubjects/{subjectId}/sourceArtifacts/{artifactId}
deliverySubjects/{subjectId}/perspectives/{perspectiveId}
deliverySubjects/{subjectId}/assignments/{assignmentId}
deliverySubjects/{subjectId}/tasks/{taskId}
deliverySubjects/{subjectId}/contributions/{contributionId}
deliverySubjects/{subjectId}/evidence/{evidenceId}
deliverySubjects/{subjectId}/verifications/{verificationId}
deliverySubjects/{subjectId}/knowledgeRefs/{referenceId}
deliverySubjects/{subjectId}/proposedDiffs/{diffId}
deliverySubjects/{subjectId}/requirements/{requirementId}
deliverySubjects/{subjectId}/requirementRevisions/{revisionId}
deliverySubjects/{subjectId}/requirementChangeProposals/{proposalId}
deliverySubjects/{subjectId}/requirementMatches/{matchId}
deliverySubjects/{subjectId}/requirementQualityFindings/{findingId}
deliverySubjects/{subjectId}/requirementSources/{sourceLinkId}
deliverySubjects/{subjectId}/gaps/{gapId}
deliverySubjects/{subjectId}/conflicts/{conflictId}
deliverySubjects/{subjectId}/assumptions/{assumptionId}
deliverySubjects/{subjectId}/decisions/{decisionId}
deliverySubjects/{subjectId}/workPackages/{workPackageId}
deliverySubjects/{subjectId}/acceptanceCriteria/{criterionId}
deliverySubjects/{subjectId}/evaluations/{evaluationId}
deliverySubjects/{subjectId}/dependencies/{dependencyId}
deliverySubjects/{subjectId}/messages/{messageId}
deliverySubjects/{subjectId}/events/{eventId}
deliverySubjects/{subjectId}/agentThreads/{threadId}
deliverySubjects/{subjectId}/agentRuns/{runId}
```

## Requirement Profiles

Root record:

```ts
requirementProfiles/{profileId} = {
  id,
  name,
  description?,
  currentPublishedVersion?,
  active,
  createdAt,
  updatedAt
}
```

Version:

```ts
requirementProfiles/{profileId}/versions/{version} = {
  profileId,
  version,
  status: "DRAFT" | "PUBLISHED" | "RETIRED",
  applicableSubjectKinds: [],
  requiredPerspectiveTypes: [],
  typePolicies: [],
  requireExistingRequirementSearchBeforeCreate,
  duplicateMatchThreshold,
  contradictionReviewRequired,
  createdBy,
  createdAt,
  publishedAt?
}
```

Rules:

- DRAFT may be edited only through backend admin commands;
- PUBLISHED content is immutable;
- publish updates root `currentPublishedVersion`;
- subject pins exact profile ID/version;
- no silent subject upgrade when new version publishes.

## Requirement Catalogue

Stable current identity:

```ts
requirementCatalog/{id} = {
  stableKey,
  type,
  title,
  lifecycle,
  currentVersion,
  capabilityRefs: [],
  authoritativeSourceSystem?,
  authoritativeExternalId?,
  createdAt,
  updatedAt
}
```

Immutable version:

```ts
requirementCatalog/{id}/versions/{version} = {
  requirementId,
  version,
  type,
  title,
  statement,
  rationale?,
  criticality,
  capabilityRefs: [],
  details: [],
  sourceVersion?,
  sourceFingerprint?,
  publishedAt,
  publishedBy?
}
```

A subject never writes these records as part of requirement discovery. P0 may import/sync them from an external source through backend utilities.

## Proposed subject Requirement

`deliverySubjects/{subjectId}/requirements/{id}` is subject-local proposal state:

```ts
{
  id,
  type,
  title,
  statement,
  rationale?,
  priority,
  criticality,
  status,
  ownerId?,
  capabilityRefs?: [],
  details?: [{ fieldKey, valueType, ...typedValue }],
  requiresEvaluation,
  revision,
  createdAt,
  updatedAt
}
```

It is never rendered/labeled as enterprise CURRENT.

## RequirementChangeProposal

```ts
{
  id,
  deliverySubjectId,
  changeType: "CREATE" | "MODIFY" | "SUPERSEDE" | "RETIRE" | "NO_CHANGE",
  baselineRequirementId?,
  baselineVersion?,
  proposedRequirementId?,
  rationale,
  status,
  relatedConflictIds: [],
  supersedesProposalIds: [],
  createdAt,
  updatedAt
}
```

For MODIFY/SUPERSEDE/RETIRE/NO_CHANGE, baseline ID/version pin what was analyzed. If current catalogue advances, service changes status to `STALE_BASELINE` until rebase/reassessment.

## RequirementMatch

Persist existing-requirement/parallel-proposal retrieval judgments:

```ts
{
  id,
  subjectRequirementId,
  candidateKind: "BASELINE_REQUIREMENT" | "ACTIVE_PROPOSAL",
  candidateId,
  candidateVersion?,
  relationship: "DUPLICATE" | "OVERLAPS" | "CONTRADICTS" | "RELATED",
  score?,
  rationale,
  blocking,
  status: "UNREVIEWED" | "CONFIRMED" | "DISMISSED",
  createdAt,
  updatedAt
}
```

Blocking UNREVIEWED candidates prevent READY.

## RequirementQualityFinding

Generated by deterministic evaluation of the subject's pinned Requirement Profile version:

```ts
{
  id,
  profileId,
  profileVersion,
  requirementId?,
  ruleId,
  severity,
  blocking,
  message,
  status: "OPEN" | "RESOLVED" | "WAIVED",
  waiverDecisionId?,
  createdAt,
  updatedAt
}
```

Profile upgrade re-evaluates findings only after explicit subject upgrade.

## RequirementRevision and RequirementSource

Every semantic edit appends immutable RequirementRevision. RequirementSource remains the canonical provenance relation and can include:

```text
CONTRIBUTION | EVIDENCE | KNOWLEDGE_REFERENCE | DECISION |
ASSUMPTION | SOURCE_ARTIFACT | BASELINE_REQUIREMENT | AI_INFERENCE
```

Source version may be retained.

## KnowledgeReference / ProposedDiff

KnowledgeReference includes stable/source identity plus `version` and optional `fingerprint`.

ProposedDiff records `baselineVersion`/`baselineFingerprint` where available. A source-version change can move diff to `STALE_BASELINE`; P0 never writes it back automatically.

## Membership / assignments / tasks

Membership controls subject access. Perspective assignment controls authority. Task lifecycle remains:

```text
OPEN | IN_PROGRESS | ANSWERED | PROCESSING |
WAITING_ON_OTHER | COMPLETED | CANCELLED
```

My Work reads private rebuildable `users/{uid}/taskInbox`; authoritative task remains subject-scoped.

## Verification

Append-only human judgment:

```text
CONTRIBUTION        -> no target revision
REQUIREMENT         -> targetRevision required
PROPOSED_DIFF       -> targetRevision required
```

Requirement verification relates to proposed subject Requirement revision, not catalogue version promotion.

## Conflict / Assumption / Decision / WorkPackage

Conflict supports 2+ positions, including baseline/proposal references. Assumptions use explicit criticality/blocking semantics. Decisions remain human-owned. WorkPackage holds proposed requirement IDs and target implementation area/team.

## AcceptanceCriterion / Evaluation

```text
REQUIREMENT      -> targetRevision required
WORK_PACKAGE     -> no requirement revision
DELIVERY_SUBJECT -> no requirement revision
```

## AgentThread / AgentRun

Unchanged core semantics: OpenCode state is disposable. `contextRevisionPresented` means the highest subject revision actually shown to that session. Never equate same-run `domainRevisionAtEnd` with context presented unless re-presented.

Context envelopes should include:

- pinned Requirement Profile/version and relevant type rules;
- current baseline requirements/versions relevant to the task;
- proposed change operations;
- requirement matches/collisions;
- proposed requirement revisions/details;
- current knowledge refs/diffs;
- profile findings;
- existing gaps/conflicts/decisions.

## Realtime subscriptions

- My Work: current user's `taskInbox`.
- Delivery Overview: root + change counts + profile findings + blockers.
- Drill: task/messages + current baseline/proposed requirement/change/matches.
- Requirement detail: baseline reference/version + proposal/revisions/sources/verifications/findings.
- Catalogue: current requirement records/history/proposal references.
- Conflict: positions/tasks/decision.
- War Room: AgentRuns/events/tasks/baseline/profile metadata.

## Security/access

- subject data: active membership or ADMIN policy;
- profiles/catalogue: signed-in read-only in PoC;
- authoritative writes: backend-only;
- profile publish and catalogue promotion/import: privileged backend service only;
- browser never receives admin/OpenCode/Vertex credentials.

## Data-size / consistency rules

- no large source bytes in Firestore;
- no unbounded arrays on Delivery Subject root;
- versions/history/relations as documents/subcollections;
- current baseline versions are immutable snapshots;
- subject proposals never overwrite baseline records;
- every AI mutation carries expected revisions/idempotency keys;
- stale baseline and stale subject revision are explicit states, never last-write-wins.
