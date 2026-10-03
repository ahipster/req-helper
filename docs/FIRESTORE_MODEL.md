# Firestore Model

## Purpose

Cloud Firestore is the authoritative shared state store for the Req Helper PoC. It must support:

- several logged-in users working on the same Delivery Subject;
- realtime UI updates;
- independent perspective/participant agent threads;
- deterministic readiness and auditability;
- safe reruns and concurrent AI activity.

Do not model the Delivery Subject as one giant JSON document.

## Root collections

```text
deliverySubjects/{subjectId}
users/{userId}                    # PoC profile/identity metadata only
```

Most product data is scoped below a Delivery Subject.

## Delivery Subject

`deliverySubjects/{subjectId}`

Bounded summary fields only:

```ts
{
  id: string,
  title: string,
  initialSignal: string,
  problemStatement?: string,
  desiredOutcome?: string,
  status: "DRAFT" | "DISCOVERING" | "DRILLING" | "RESOLVING" | "SPLITTING" | "READY" | "HANDED_OFF" | "CANCELLED",
  priority?: string,
  sponsorId?: string,
  deliveryLeadId?: string,
  revision: number,
  readinessState: "UNKNOWN" | "NOT_READY" | "READY",
  readinessScore?: number,
  summaryCounts?: {
    requirements: number,
    blockingGaps: number,
    blockingConflicts: number,
    openTasks: number
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

`revision` increments when a material domain mutation is committed. Agent commands carry the revision they were built against where stale-state detection matters.

## Subcollections

```text
deliverySubjects/{subjectId}/perspectives/{perspectiveId}
deliverySubjects/{subjectId}/assignments/{assignmentId}
deliverySubjects/{subjectId}/tasks/{taskId}
deliverySubjects/{subjectId}/contributions/{contributionId}
deliverySubjects/{subjectId}/requirements/{requirementId}
deliverySubjects/{subjectId}/requirementRevisions/{revisionId}
deliverySubjects/{subjectId}/gaps/{gapId}
deliverySubjects/{subjectId}/conflicts/{conflictId}
deliverySubjects/{subjectId}/assumptions/{assumptionId}
deliverySubjects/{subjectId}/decisions/{decisionId}
deliverySubjects/{subjectId}/knowledgeRefs/{referenceId}
deliverySubjects/{subjectId}/impacts/{impactId}
deliverySubjects/{subjectId}/workPackages/{workPackageId}
deliverySubjects/{subjectId}/acceptanceCriteria/{criterionId}
deliverySubjects/{subjectId}/evaluations/{evaluationId}
deliverySubjects/{subjectId}/dependencies/{dependencyId}
deliverySubjects/{subjectId}/messages/{messageId}
deliverySubjects/{subjectId}/events/{eventId}
deliverySubjects/{subjectId}/agentThreads/{threadId}
deliverySubjects/{subjectId}/agentRuns/{runId}
```

Use IDs/references to connect documents instead of large nested arrays.

## Perspective

```ts
{
  id: string,
  type: string,
  name: string,
  description?: string,
  criticality: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  required: boolean,
  rationale?: string,
  status: "PROPOSED" | "CONFIRMED" | "ACTIVE" | "COMPLETE" | "BLOCKED",
  updatedAt: Timestamp
}
```

## Assignment

```ts
{
  id: string,
  perspectiveId: string,
  userId: string,
  relationship: "OWNER" | "DELEGATE" | "CONTRIBUTOR" | "REVIEWER",
  required: boolean,
  status: "ACTIVE" | "COMPLETE" | "REMOVED",
  createdAt: Timestamp
}
```

## Task

Tasks represent durable human waits; no suspended workflow engine is required.

```ts
{
  id: string,
  perspectiveId?: string,
  assigneeId?: string,
  type: "DRILL" | "VERIFY" | "RESOLVE_CONFLICT" | "DECIDE" | "REVIEW" | "FOLLOW_UP",
  title: string,
  question?: string,
  rationale?: string,
  relatedObjectIds: string[],
  blocking: boolean,
  status: "OPEN" | "IN_PROGRESS" | "ANSWERED" | "CANCELLED",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Keep `relatedObjectIds` bounded. If relationship fan-out becomes large, add a separate relation collection later.

## Contribution

```ts
{
  id: string,
  taskId?: string,
  authorId: string,
  perspectiveId?: string,
  statement: string,
  epistemicMode: "KNOW" | "BELIEVE" | "OBSERVED" | "UNKNOWN" | "UNSPECIFIED",
  confidence?: number,
  evidenceIds: string[],
  likelyAuthoritativeOwnerId?: string,
  verificationStatus: "UNVERIFIED" | "OWNER_VERIFIED" | "OWNER_REJECTED" | "SUPERSEDED",
  createdAt: Timestamp
}
```

## Requirement

Current authoritative representation:

```ts
{
  id: string,
  type: string,
  title: string,
  statement: string,
  rationale?: string,
  ownerId?: string,
  criticality: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  status: "DRAFT" | "NEEDS_INPUT" | "PROPOSED" | "VERIFIED" | "CONFLICTED" | "APPROVED" | "SUPERSEDED",
  sourceContributionIds: string[],
  sourceKnowledgeReferenceIds: string[],
  currentRevision: number,
  workPackageIds: string[],
  updatedAt: Timestamp
}
```

Every material change also creates an immutable `requirementRevisions` document containing the previous/new statement and provenance.

If any ID array begins to grow materially, replace it with dedicated relation documents. PoC arrays must stay intentionally bounded.

## Conflict / gap / assumption / decision

These are first-class records. They must not live only in chat text.

Each includes:
- stable ID;
- status;
- severity/criticality where applicable;
- owner(s);
- related object IDs;
- blocking flag where applicable;
- created/updated timestamps;
- resolution/decision rationale when closed.

## Knowledge reference

Store metadata, not the entire enterprise repository object:

```ts
{
  id: string,
  sourceSystem: string,
  sourceType: string,
  externalId?: string,
  uri?: string,
  title: string,
  version?: string,
  summary?: string,
  retrievedAt: Timestamp,
  relevance?: number
}
```

Large documents stay in their source system/object storage and are fetched on demand.

## AgentThread

Logical interaction continuity independent of OpenCode server lifetime.

Default ID can be deterministic from:

```text
subjectId + perspectiveId + participantId
```

Document:

```ts
{
  id: string,
  perspectiveId?: string,
  participantId: string,
  opencodeSessionId?: string,
  status: "IDLE" | "RUNNING" | "ERROR" | "CLOSED",
  leaseOwner?: string,
  leaseExpiresAt?: Timestamp,
  lastContextRevision?: number,
  lastRunId?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

The OpenCode session ID is an optimization. If it becomes invalid, create another session and hydrate from authoritative context.

## AgentRun

```ts
{
  id: string,
  threadId: string,
  opencodeSessionId?: string,
  perspectiveId?: string,
  participantId: string,
  domainRevisionAtStart: number,
  provider?: string,
  model?: string,
  skillVersions: string[],
  inputObjectIds: string[],
  toolCalls: unknown[],
  structuredOutput?: unknown,
  proposedCommands?: unknown[],
  appliedCommandIds?: string[],
  rejectedCommands?: unknown[],
  status: "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED",
  errorCategory?: string,
  startedAt: Timestamp,
  endedAt?: Timestamp
}
```

Do not persist private model chain-of-thought.

## Messages

Messages are interaction history and can be used to reconstruct user-visible threads, but they are not authoritative requirements.

```ts
{
  id: string,
  threadId: string,
  actorType: "HUMAN" | "ASSISTANT" | "SYSTEM" | "TOOL",
  actorId?: string,
  content: string,
  relatedObjectIds?: string[],
  createdAt: Timestamp
}
```

## Events

Append-only audit records:

```ts
{
  id: string,
  type: string,
  actorType: "HUMAN" | "AI" | "SYSTEM",
  actorId?: string,
  objectType: string,
  objectId: string,
  summary: string,
  runId?: string,
  domainRevision: number,
  createdAt: Timestamp
}
```

## Concurrency strategy

### Human edits

Use server-side transactions when the operation depends on current state. Increment the Delivery Subject `revision` in the same transaction for material changes.

### AI commands

Each proposed command includes:
- deterministic/idempotency key;
- object IDs it affects;
- expected domain/object revision when relevant;
- structured payload.

Before applying:
1. re-read the current object/revision;
2. reject or recompute if the command is stale;
3. commit state + event atomically where feasible.

### Thread lease

Acquire AgentThread lease transactionally:
- only when no unexpired lease exists;
- set `status=RUNNING`, `leaseOwner`, `leaseExpiresAt`;
- renew for long runs if necessary;
- clear on completion;
- expired leases are recoverable.

This prevents two prompts racing through the same OpenCode session.

## Realtime subscriptions

Use narrow queries.

Examples:

### My Work
`tasks where assigneeId == currentUser AND status in OPEN/IN_PROGRESS`

### Delivery Overview
- Delivery Subject document;
- perspectives;
- blocking gaps/conflicts;
- recent events (limited);

### Drill Workspace
- current task;
- thread messages;
- relevant requirements;
- conflicts tied to current perspective.

### War Room
- recent agentRuns;
- recent events;
- open tasks;
- subject readiness summary.

Do not subscribe to all messages/events/history for all users.

## Indexing

Start with the queries the UI actually uses. Expected composite indexes include:
- tasks: `assigneeId + status + updatedAt`;
- tasks: `perspectiveId + status + updatedAt`;
- requirements: `status + criticality + updatedAt`;
- conflicts: `blocking + status + updatedAt`;
- agentRuns: `threadId + startedAt`;
- events: `createdAt` descending.

Keep `firestore.indexes.json` under source control.

## Data-size boundaries

- Never store full large enterprise documents or long generated reports in one Firestore document.
- Keep summaries bounded and store references to source/object storage for large payloads.
- Keep growing collections as subcollections, not nested arrays/maps in parent documents.
- Keep high-cardinality relation lists out of single documents when they grow beyond PoC scale.

## When Firestore stops fitting

Firestore is appropriate for this PoC and likely an initial limited-team rollout. Add a projection/secondary store later if you need:
- complex cross-Delivery-Subject joins/reporting;
- large-scale graph traversal;
- heavy analytical SQL;
- strict relational referential integrity across many aggregates.

Do not pre-emptively add PostgreSQL before such a need appears.
