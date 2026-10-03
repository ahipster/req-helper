# Firestore Model

Cloud Firestore is the authoritative shared state store for the Req Helper PoC. `src/domain/schemas.ts`, `src/domain/architecture.ts` and `docs/DOMAIN_MODEL.md` remain canonical.

## Root collections

```text
users/{userId}
  /taskInbox/{itemId}                    # non-authoritative My Work projection
roleTemplates/{roleTemplateId}
perspectiveTemplates/{perspectiveTemplateId}

requirementProfiles/{profileId}
  /versions/{versionId}
    /architecturePolicies/{policyId}

requirementCatalog/{requirementId}
  /versions/{versionId}

architectureSources/{sourceId}
architectureIngestionRuns/{runId}
architectureBaselines/{baselineId}
  /elements/{elementId}
  /relationships/{relationshipId}
  /views/{viewId}
  /ingestionFindings/{findingId}

deliverySubjects/{subjectId}
```

Published Requirement Profile versions, Requirement Catalogue versions and Architecture Baselines are immutable reference data. Delivery Subject workflows do not directly overwrite them.

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
deliverySubjects/{subjectId}/architectureContext/{contextId}
deliverySubjects/{subjectId}/architectureImpacts/{impactId}
deliverySubjects/{subjectId}/architectureChangeProposals/{proposalId}
deliverySubjects/{subjectId}/workPackageImplementationTargets/{targetId}
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

Root and immutable version semantics remain as before.

Architecture policy is a version-bound subcollection:

```ts
requirementProfiles/{profileId}/versions/{version}/architecturePolicies/default = {
  id,
  profileId,
  profileVersion,
  requireArchitectureBaseline,
  requireConfirmedImpactForHighCritical,
  requireImplementationTargetForHighCritical,
  allowNeedsReviewElementsForImpact,
  createdAt
}
```

PUBLISHED profile/version/policy content is immutable.

## Requirement Catalogue

Stable current identity and immutable semantic versions remain unchanged. Subject workflows never promote into it directly.

## ArchitectureSource

P0 source type is only `GIT_MARKDOWN`.

```ts
architectureSources/{sourceId} = {
  id,
  name,
  sourceType: "GIT_MARKDOWN",
  repository,
  defaultBranch,
  pathPrefixes: [],
  enabled,
  currentCommitSha?,
  createdAt,
  updatedAt
}
```

Repository credentials are not stored in readable Firestore documents. They belong in approved backend connector/secret configuration.

## ArchitectureIngestionRun

```ts
architectureIngestionRuns/{runId} = {
  id,
  sourceCommits: [{ sourceId, repository, branch, commitSha }],
  status: "QUEUED" | "SCANNING" | "EXTRACTING" | "RECONCILING" |
          "VALIDATING" | "SUCCEEDED" | "FAILED",
  schemaVersion,
  promptSkillVersion,
  providerId?,
  modelId?,
  inputFileCount,
  changedFileCount,
  startedAt,
  endedAt?
}
```

The exact source commit set is immutable input metadata for one ingestion run.

## ArchitectureBaseline

```ts
architectureBaselines/{baselineId} = {
  id,
  version,
  status: "DRAFT" | "PUBLISHED" | "SUPERSEDED",
  sourceCommits: [{ sourceId, repository, branch, commitSha }],
  ingestionRunIds: [],
  schemaVersion,
  fingerprint,
  createdAt,
  publishedAt?,
  publishedBy?
}
```

Published baseline content never mutates.

A later Git commit produces another ingestion run/baseline. The current pointer may live in application configuration; a previous published baseline becomes SUPERSEDED but remains readable/auditable.

## ArchitectureElement

```ts
architectureBaselines/{baselineId}/elements/{id} = {
  id,
  baselineId,
  baselineVersion,
  stableKey,
  type,
  name,
  description?,
  lifecycle,
  tags: [],
  sourceEvidence: [{
    sourceId,
    commitSha,
    path,
    blobSha?,
    fingerprint?,
    lineStart?,
    lineEnd?,
    excerpt?,
    mode: "EXPLICIT" | "INFERRED"
  }],
  extractionConfidence?,
  reviewStatus: "CONFIRMED" | "NEEDS_REVIEW" | "REJECTED",
  createdAt
}
```

Every published element requires source evidence.

## ArchitectureRelationship

```ts
architectureBaselines/{baselineId}/relationships/{id} = {
  id,
  baselineId,
  baselineVersion,
  type,
  sourceElementKey,
  targetElementKey,
  description?,
  sourceEvidence: [...],
  extractionConfidence?,
  reviewStatus,
  createdAt
}
```

Every endpoint must resolve inside the complete baseline. Model-proposed aliases never silently merge conflicting stable keys.

## ArchitectureView

```ts
architectureBaselines/{baselineId}/views/{id} = {
  id,
  baselineId,
  baselineVersion,
  name,
  viewType,
  purpose?,
  elementKeys: [],
  relationshipIds: [],
  sourceEvidence: [],
  createdAt
}
```

Views are projections only; elements/relationships remain canonical normalized topology.

## ArchitectureIngestionFinding

```ts
{
  id,
  ingestionRunId,
  baselineId?,
  type: "MISSING_STABLE_ID" | "UNRESOLVED_REFERENCE" |
        "DUPLICATE_ELEMENT" | "CONFLICTING_DEFINITION" |
        "INVALID_RELATIONSHIP" | "LOW_CONFIDENCE" |
        "SOURCE_CHANGED" | "OTHER",
  severity,
  blocking,
  message,
  sourceEvidence: [],
  relatedStableKeys: [],
  status: "OPEN" | "RESOLVED" | "WAIVED",
  createdAt,
  updatedAt
}
```

Blocking findings prevent baseline publication according to application policy.

## DeliverySubjectArchitectureContext

```ts
{
  id,
  deliverySubjectId,
  architectureBaselineId,
  architectureBaselineVersion,
  baselineFingerprint,
  status: "CURRENT" | "STALE_BASELINE",
  pinnedAt,
  updatedAt
}
```

When the profile requires architecture analysis, readiness requires a current pinned context.

## RequirementArchitectureImpact

```ts
{
  id,
  deliverySubjectId,
  requirementId,
  requirementRevision,
  architectureBaselineId,
  architectureBaselineVersion,
  architectureElementKey,
  architectureElementFingerprint?,
  impactType,
  rationale,
  confidence?,
  sourceRelationshipIds: [],
  status: "PROPOSED" | "CONFIRMED" | "REJECTED" | "STALE_BASELINE",
  confirmedBy?,
  createdAt,
  updatedAt
}
```

Impact is both requirement-revision and architecture-baseline specific.

## ArchitectureChangeProposal

```ts
{
  id,
  deliverySubjectId,
  targetType: "ELEMENT" | "RELATIONSHIP",
  changeType: "ADD" | "MODIFY" | "REMOVE" | "DEPRECATE" | "NO_CHANGE",
  architectureBaselineId,
  architectureBaselineVersion,
  baselineTargetId?,
  baselineTargetFingerprint?,
  proposedStableKey?,
  proposedType?,
  proposedName?,
  proposedDescription?,
  sourceRequirementIds: [],
  rationale,
  status: "DRAFT" | "PROPOSED" | "CONFIRMED" | "REJECTED" |
          "SUPERSEDED" | "STALE_BASELINE",
  createdAt,
  updatedAt
}
```

These records are proposed future architecture only. They never mutate a published baseline or Git source in P0.

## WorkPackageImplementationTarget

```ts
{
  id,
  deliverySubjectId,
  workPackageId,
  architectureImpactId,
  architectureElementKey,
  repositoryElementKey?,
  teamElementKey?,
  createdAt
}
```

This is the machine-readable bridge from requirement impact to actual delivery target. Repository/team fields are optional because not every current topology is complete.

## Proposed subject Requirement / change / match / profile findings

Existing requirement/current-vs-proposed structures remain unchanged:

- proposed Requirement;
- RequirementRevision;
- RequirementChangeProposal;
- RequirementMatch;
- RequirementQualityFinding;
- RequirementSource.

Stale requirement baseline remains explicit and blocking.

## KnowledgeReference / ProposedDiff

KnowledgeReference includes source identity/version/fingerprint. ProposedDiff pins baseline version/fingerprint and may become STALE_BASELINE. P0 never writes it back automatically.

## Membership / assignments / tasks

Membership controls subject access. Perspective assignment controls authority. My Work uses `users/{uid}/taskInbox`; authoritative Task remains subject-scoped.

## Verification

Append-only human judgment. Requirement verification targets exact proposed Requirement revision.

Architecture impact confirmation is modeled on `RequirementArchitectureImpact.status/confirmedBy` in P0 rather than reusing Requirement Verification semantics.

## WorkPackage / Acceptance / Evaluation / Dependency

WorkPackage keeps targetAreaRef/team/coordinator for human-friendly delivery grouping. Where the pinned architecture policy requires implementation targets, one or more `WorkPackageImplementationTarget` records must link the package to confirmed architecture impacts.

Acceptance/Evaluation requirements remain revision-bound for Requirement targets.

## AgentThread / AgentRun context

OpenCode state is disposable. Context envelopes can include:

- pinned Requirement Profile/version and architecture policy;
- current baseline requirements/versions;
- proposed requirement changes/matches/findings;
- current knowledge refs/diffs;
- DeliverySubjectArchitectureContext;
- bounded relevant architecture elements/relationships/source evidence;
- architecture impacts/change proposals;
- existing gaps/conflicts/decisions/work packages/targets.

Do not send the full architecture baseline graph by default.

## Realtime subscriptions

- My Work: current user's taskInbox.
- Delivery Overview: root + change/profile/architecture blockers.
- Drill: task/messages + relevant baseline/proposal/matches/topology.
- Requirement detail: requirement baseline/proposal/history + architecture impacts.
- Architecture Impact: architecture context + bounded graph + impacts/change proposals.
- Architecture Admin: sources/ingestion runs/findings/baseline publication.
- War Room: AgentRuns/events/tasks + ingestion-run diagnostics.

## Security/access

- subject data: active membership or ADMIN policy;
- profiles/catalogue/published architecture baseline: signed-in read-only in PoC;
- architecture ingestion runs: ADMIN read in current PoC rules;
- authoritative writes/publication: backend-only;
- Git credentials/tokens are never readable Firestore data or browser state;
- browser never receives Admin SDK/OpenCode/Vertex credentials.

## Data-size / consistency rules

- do not persist full Markdown repository content as architecture truth; retain normalized records plus concise source evidence/reference metadata;
- no unbounded arrays on Delivery Subject root;
- versions/history/relations as documents/subcollections;
- published baseline versions are immutable snapshots;
- subject proposals never overwrite baseline records;
- every AI mutation carries expected revisions/idempotency keys;
- stale requirement/knowledge/architecture baseline is explicit, never last-write-wins;
- incremental architecture extraction may reuse unchanged normalized objects only when source fingerprints still match.
