# Firestore Model

Cloud Firestore is the authoritative shared state store for the Req Helper PoC. This document defines the canonical persistence shape. It must stay aligned with `src/domain/schemas.ts` and `docs/DOMAIN_MODEL.md`.

## Root collections

```text
users/{userId}
  /inbox/{projectionId}             # read-only My Work projection
roleTemplates/{roleTemplateId}
perspectiveTemplates/{perspectiveTemplateId}
deliverySubjects/{subjectId}
```

The user inbox is a disposable read projection. The authoritative Task always remains under its Delivery Subject.

## Delivery Subject root

`deliverySubjects/{subjectId}` stores bounded aggregate summary/state only:

```ts
{
  id,
  title,
  initialSignal,
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
  readinessState,
  readinessScore?,
  summaryCounts?,
  createdAt,
  updatedAt
}
```

`revision` increments on material domain mutation and is the basis for stale-agent detection.

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

Use references/stable IDs rather than large nested objects or unbounded arrays.

## Membership

`members/{userId}` answers whether a user can access a Delivery Subject and their broad subject role.

```ts
{
  id,
  deliverySubjectId,
  userId,
  roles: ["SPONSOR" | "DELIVERY_LEAD" | "PARTICIPANT" | "OBSERVER"],
  active,
  createdAt,
  updatedAt
}
```

Global `DELIVERY_LEAD` capability does not grant access to every subject. Subject membership establishes actual participation in a specific Delivery Subject.

## My Work inbox projection

A browser-wide collection-group Task query conflicts with strict subject-membership rules because Firestore security rules are not post-query filters. P0 therefore maintains:

```text
users/{userId}/inbox/{projectionId}
```

Projection shape:

```ts
{
  id,
  userId,
  deliverySubjectId,
  taskId,
  taskType,
  taskStatus,
  title,
  perspectiveId?,
  blocking,
  deliverySubjectTitle,
  deliverySubjectRevision,
  updatedAt
}
```

Rules:

- authoritative Task remains `deliverySubjects/{subjectId}/tasks/{taskId}`;
- backend services update/remove the inbox projection when assignment/status changes;
- the projection may be rebuilt from authoritative tasks;
- user may read only their own inbox (ADMIN may read under PoC policy);
- no browser writes.

## Perspective and Assignment

Perspective status is canonical:

```text
PROPOSED | CONFIRMED | IN_PROGRESS | COMPLETE | BLOCKED
```

Assignment relationship:

```text
OWNER | DELEGATE | CONTRIBUTOR | REVIEWER
```

Do not store `required` on Assignment. Requiredness belongs to Perspective.

## SourceArtifact

Links or uploaded material are represented by metadata only:

```ts
{
  id,
  name,
  mediaType?,
  storageType: "LINK" | "GCS" | "EXTERNAL",
  uri,
  sizeBytes?,
  sha256?,
  addedBy,
  createdAt
}
```

Large file bytes do not belong in Firestore.

## Contribution

```ts
{
  id,
  taskId?,
  authorId,
  perspectiveId?,
  statement,
  epistemicMode,
  ownershipRelationship?,
  statedConfidence?,
  extractionConfidence?,
  evidenceIds: string[],
  likelyAuthoritativeOwnerId?,
  createdAt
}
```

Confidence is never authority.

## Evidence

Evidence has its own collection so contribution/requirement/conflict records do not point to undefined IDs.

```ts
{
  id,
  kind,
  sourceId,
  excerpt?,
  uri?,
  createdAt
}
```

## Verification

Verification is immutable and revision-bound where applicable.

Targets:

```text
CONTRIBUTION        -> no target revision
REQUIREMENT         -> targetRevision required
PROPOSED_DIFF       -> targetRevision required
```

Common fields:

```ts
{
  id,
  targetType,
  targetId,
  verifierId,
  perspectiveId?,
  verdict: "VERIFIED" | "REJECTED" | "AMENDED",
  rationale?,
  status: "ACTIVE" | "SUPERSEDED",
  createdAt
}
```

When a Requirement revision changes, prior Verification records remain for audit but do not satisfy readiness for the new revision.

## KnowledgeReference and ProposedDiff

Store external source metadata rather than source content. Proposed diffs are separate records keyed to a KnowledgeReference and have their own revision/timestamps.

## Requirement

Current state:

```ts
{
  id,
  type,
  title,
  statement,
  rationale?,
  priority,
  criticality,
  status: "DRAFT" | "NEEDS_INPUT" | "PROPOSED" | "CONFLICTED" | "SUPERSEDED",
  ownerId?,
  extractionConfidence?,
  requiresEvaluation,
  revision,
  createdAt,
  updatedAt
}
```

Verification is deliberately not encoded in Requirement status.

Meaning:

- `priority`: delivery urgency/sequencing;
- `criticality`: consequence if wrong/omitted.

### RequirementRevision

Every semantic human or AI edit appends an immutable revision record. Manual edit and AI edit use the same code path.

### RequirementSource

Provenance is first-class:

```ts
{
  id,
  requirementId,
  requirementRevision,
  sourceKind,
  sourceId,
  authoritative,
  createdAt
}
```

Do not rely on embedded source arrays for canonical provenance.

## Conflict

A conflict supports two or more positions:

```ts
{
  id,
  description,
  positions: [{
    id,
    actorId?,
    perspectiveId?,
    itemType,
    itemId,
    summary,
    evidenceIds: []
  }],
  severity,
  ownerIds,
  decisionOwnerId?,
  blocking,
  resolution?,
  decisionId?,
  status,
  createdAt,
  updatedAt
}
```

Keep `positions` bounded; if war-room usage proves it can grow materially, split into a subcollection later.

## Assumption

Assumptions include `criticality` and `blocking`, making readiness semantics explicit.

## Task

Canonical task types:

```text
DRILL | VERIFY | REVIEW | RESOLVE_CONFLICT | FILL_GAP |
DECIDE | FOLLOW_UP | FINAL_REVIEW
```

Canonical statuses:

```text
OPEN | IN_PROGRESS | ANSWERED | PROCESSING |
WAITING_ON_OTHER | COMPLETED | CANCELLED
```

`ANSWERED` means human input is saved. `PROCESSING` means AI/application logic is interpreting it. `COMPLETED` means resulting structured changes/follow-ups are durable.

## WorkPackage

```ts
{
  id,
  name,
  targetAreaRef,
  targetTeamId?,
  coordinatorId?,
  status,
  requirementIds: [],
  dependencyIds: [],
  knowledgeReferenceIds: [],
  createdAt,
  updatedAt
}
```

`targetAreaRef` is required. A human coordinator is not a substitute for implementation-area identity.

## AcceptanceCriterion and Evaluation

Both use generalized target types:

```text
REQUIREMENT     -> targetRevision required
WORK_PACKAGE    -> no requirement revision
DELIVERY_SUBJECT -> no requirement revision
```

This allows integration/package-level acceptance instead of forcing every check onto a single requirement.

## Dependency semantics

`blocking=true` means the dependency must be resolved before READY. Ownership alone does not make it acceptable.

## Messages

User-visible conversation continuity is stored in `messages`. Messages are not authoritative requirements.

## AgentThread

```ts
{
  id,
  perspectiveId?,
  participantId,
  opencodeSessionId?,
  sessionGeneration,
  status,
  leaseOwner?,
  leaseExpiresAt?,
  contextRevisionPresented?,
  lastRunId?,
  lastMessageAt?,
  createdAt,
  updatedAt
}
```

`contextRevisionPresented` means the highest Delivery Subject revision whose authoritative context was actually presented to the OpenCode session.

Do not set it to `domainRevisionAtEnd` merely because the same run caused mutations. Those mutations have not necessarily been presented back to the session yet.

## AgentRun

Persist enough to diagnose context staleness:

```text
runId
threadId
sessionGeneration
opencodeSessionId
participantId
perspectiveId
domainRevisionAtStart
contextRevisionPresentedBefore
contextRevisionPresentedThisRun
hydrationMode = FULL | DELTA | MINIMAL
inputObjectIds
skill versions
provider/model
tool calls
structured output
proposed commands
applied/rejected command IDs
domainRevisionAtEnd
status/error category
startedAt/endedAt
```

Never persist private chain-of-thought.

## Concurrency

### Human edits

Use server-side transactions for invariant-sensitive writes and increment Delivery Subject revision atomically.

### AI commands

Every material command carries:

- deterministic/idempotency key;
- target object IDs;
- expected domain/object revision;
- structured payload.

Before commit, re-read current state. Reject/recompute stale commands rather than last-write-wins.

### Same OpenCode thread

Serialize using AgentThread lease.

### Different threads

May execute concurrently; domain revisions protect shared objects.

## Realtime subscriptions

Subscribe narrowly.

- My Work: `users/{currentUser}/inbox`, filtered by taskStatus as needed.
- Delivery Overview: root summary + perspectives + blockers + recent events.
- Drill Workspace: current task + thread messages + relevant requirements/conflicts.
- Requirement detail: current requirement + revisions + sources + verifications + acceptance/evals.
- Conflict workspace: conflict + related tasks/positions/decision.
- War Room: recent AgentRuns/events/tasks.

## Security/access

Browser reads of Delivery Subject data are restricted by active Delivery Subject membership (or ADMIN policy). Admin/global-template access is governed separately.

P0 authoritative writes remain backend-only. The browser never receives Firestore admin credentials or OpenCode/Vertex credentials.

## Data-size rules

- no full large enterprise documents in Firestore;
- no long file blobs in Firestore;
- no unbounded arrays on Delivery Subject root;
- growing history lives in subcollections;
- relations become first-class documents when they need lifecycle/provenance/queryability.

## When Firestore stops fitting

Add a projection/secondary store later only for demonstrated needs such as complex cross-subject analytics, heavy SQL, graph traversal or stricter relational reporting. Firestore remains appropriate for the collaborative operational PoC.
