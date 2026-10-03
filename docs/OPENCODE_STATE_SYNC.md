# OpenCode ↔ Firestore State Synchronization

## Purpose

OpenCode has its own local/session state. Req Helper has authoritative collaborative domain state in Firestore.

This document defines exactly how those two worlds interact.

The key rule is:

> OpenCode local state is disposable execution context. Firestore is authoritative product state.

Req Helper must remain correct if the OpenCode process restarts, its local database is lost, or a session becomes stale while other users continue working.

## State ownership

### Firestore owns

- Delivery Subject lifecycle;
- users/assignments;
- tasks;
- contributions;
- verification state;
- requirements and revisions;
- gaps/conflicts/assumptions/decisions;
- knowledge references and impacts;
- work packages;
- acceptance criteria/evals;
- readiness;
- user-visible message history required for continuity/audit;
- domain events;
- AgentThread metadata;
- AgentRun metadata.

### OpenCode owns only transient execution state

- provider/model conversation state;
- harness-local prompt/session history;
- temporary tool execution context;
- temporary model/provider metadata;
- internal caches/compaction state.

Req Helper must never depend on OpenCode's local database as the only copy of business-relevant information.

## What is copied from OpenCode into Firestore

Persist only explicit, product-relevant outputs:

1. user-visible assistant messages needed for conversation continuity;
2. tool call metadata needed for audit/debugging;
3. validated structured outputs;
4. proposed domain commands;
5. applied/rejected command IDs;
6. provider/model/run metadata;
7. error/status information.

Do **not** copy:

- hidden chain-of-thought/reasoning;
- OpenCode's internal database wholesale;
- provider credentials/tokens;
- internal caches;
- arbitrary harness-local metadata that has no product/audit purpose.

## AgentThread

Each logical human interaction has a Firestore `AgentThread`.

Default deterministic key:

```text
subjectId + perspectiveId + participantId
```

Example:

```text
DS-123|ARCHITECTURE|alice
```

AgentThread fields:

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
  lastMessageAt?: Timestamp,
  lastRunId?: string,
  sessionGeneration: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

`sessionGeneration` increments whenever a new OpenCode session replaces a previous one.

## Run lifecycle

For every meaningful user/agent interaction:

```text
1. Receive authenticated user action
2. Load Delivery Subject + AgentThread from Firestore
3. Acquire AgentThread lease
4. Resolve/recreate OpenCode session
5. Determine context delta/full hydration requirement
6. Build authoritative ContextEnvelope from Firestore
7. Persist AgentRun(status=RUNNING)
8. Prompt OpenCode
9. Persist user-visible assistant message / run metadata
10. Validate structured outputs
11. Re-read affected Firestore objects/revisions
12. Apply valid domain commands transactionally
13. Append domain events
14. Update AgentThread.lastContextRevision
15. Mark AgentRun succeeded/failed
16. Release lease
17. Firestore listeners update other users
```

No domain mutation occurs simply because OpenCode emitted text.

## Session resolution

### Existing session

If `AgentThread.opencodeSessionId` exists:

1. ask OpenCode whether that session exists;
2. if valid, reuse it;
3. if invalid/unavailable, create a new session;
4. update Firestore `opencodeSessionId` and increment `sessionGeneration`.

### No existing session

Create one, persist the ID, increment/initialize `sessionGeneration`, then hydrate it from Firestore context.

Session recreation is normal recovery behavior, not a fatal error.

## Context synchronization

An existing OpenCode conversation can be stale because another participant changed shared state.

Therefore every meaningful run is grounded from Firestore.

### Revision rule

The Delivery Subject has a monotonically increasing `revision`.

AgentThread stores `lastContextRevision`.

At run start:

```text
currentRevision = deliverySubject.revision
lastRevision = agentThread.lastContextRevision
```

Then:

```text
if new session:
    FULL HYDRATION
else if lastRevision is null:
    FULL HYDRATION
else if currentRevision == lastRevision:
    MINIMAL REFRESH
else:
    DELTA REFRESH or FULL HYDRATION
```

P0 may always use full bounded hydration when revision changed. Optimization to true deltas is optional.

## Context envelope

The prompt must reconstruct current truth from Firestore instead of trusting conversation memory.

Example:

```ts
type ContextEnvelope = {
  deliverySubject: {
    id: string;
    revision: number;
    problemStatement?: string;
    desiredOutcome?: string;
    status: string;
  };
  participant: {
    id: string;
    globalRoles: string[];
    currentAssignment?: string;
  };
  perspective?: {
    id: string;
    name: string;
    status: string;
  };
  currentTask?: unknown;
  relevantRequirements: unknown[];
  relevantContributions: unknown[];
  decisions: unknown[];
  openConflicts: unknown[];
  openGaps: unknown[];
  assumptions: unknown[];
  relevantKnowledge: unknown[];
  recentDomainEvents: unknown[];
};
```

Keep it bounded. Fetch deeper evidence through tools on demand.

## Prompt structure

A run should conceptually send:

```text
SYSTEM / SKILL INSTRUCTIONS

AUTHORITATIVE CURRENT STATE
- delivery subject revision 41
- current perspective/task
- selected requirements/decisions/conflicts

CONVERSATION CONTINUITY
- only the bounded recent user-visible conversation needed for usability

CURRENT USER MESSAGE
```

Authoritative current state overrides conflicting information remembered in the OpenCode conversation.

The system instruction must explicitly say:

> When conversation history conflicts with authoritative current state, use authoritative current state and surface the discrepancy when material.

## Example stale-session scenario

```text
Alice's OpenCode session last saw revision 38:
R-17 = synchronous response

Bob changes the shared requirement:
R-17 = asynchronous/event-based
Delivery Subject revision becomes 41

Alice sends another message
        ↓
Req Helper loads revision 41
        ↓
AgentThread.lastContextRevision = 38
        ↓
Req Helper injects fresh authoritative context
        ↓
OpenCode continues using R-17 asynchronous
        ↓
lastContextRevision becomes 41 after successful run
```

Do not attempt to edit OpenCode's historical transcript to make old messages disappear. The fresh context envelope establishes current truth.

## User-visible messages

When a user sends text:

1. persist the human message to Firestore first or atomically with task response state;
2. send it to OpenCode;
3. persist the assistant's user-visible response when available;
4. associate both messages with `threadId` and `runId`.

This means UI history can be reconstructed even if OpenCode storage disappears.

Messages are interaction history, not authoritative requirements.

## Structured mutation flow

OpenCode should output schema-validated proposals such as:

```ts
{
  commandId: string,
  idempotencyKey: string,
  expectedDomainRevision: 41,
  operation: "REVISE_REQUIREMENT",
  targetId: "R-17",
  payload: {...},
  provenanceIds: [...]
}
```

Before applying:

1. re-read current Delivery Subject/object;
2. check `expectedDomainRevision`/object revision;
3. check idempotency key has not already been applied;
4. validate permissions and domain invariants;
5. commit mutation + audit event;
6. if stale, reject and rerun/recompute instead of last-write-wins.

## Tool calls

Preferred pattern:

```text
OpenCode
   |
   +--> read-only tools may fetch current context/knowledge
   |
   +--> mutation tools call Req Helper application services
            |
            +--> authorization
            +--> schema validation
            +--> revision/idempotency checks
            +--> Firestore transaction
```

OpenCode should never receive unrestricted Firestore credentials.

## OpenCode local disk

There is **no continuous local-disk replication** from OpenCode to Firestore.

Do not:

```text
copy opencode.db -> Firestore
watch local files -> upload blobs
restore Firestore from OpenCode database
```

Instead Req Helper stores product-level state as interactions happen.

OpenCode local persistence is merely an optimization that may reduce prompt/hydration cost and improve conversational continuity.

## Process restart

If the OpenCode process restarts:

```text
Req Helper Firestore state remains intact
        ↓
next user action loads AgentThread
        ↓
old session lookup fails
        ↓
create new OpenCode session
        ↓
full context hydration from Firestore
        ↓
continue normally
```

UI conversation history is loaded from Firestore, not from OpenCode.

## Req Helper backend restart

No special recovery is required except expired thread leases.

On startup/request:

- an expired lease may be acquired by a new backend instance;
- AgentRun records stuck in `RUNNING` beyond a timeout may be marked `FAILED`/`ABANDONED` by recovery logic;
- domain state remains authoritative.

## Concurrency

### Different AgentThreads

May run concurrently.

### Same AgentThread

Serialized using Firestore lease.

### Same domain object from different threads

Allowed to propose concurrently, but commands commit only after revision/invariant checks.

A semantic collision becomes an explicit Conflict or forces recomputation.

## Compaction

Do not depend on OpenCode/provider compaction for product correctness.

Req Helper controls its own bounded context envelope.

When conversations become large:

- Firestore retains user-visible message history;
- context builder selects bounded recent messages plus authoritative summaries/state;
- optional conversation summary is stored as explicit Req Helper metadata;
- a new OpenCode session may be started at any time without losing product state.

## AgentRun observability

Persist for each run:

```text
runId
threadId
sessionGeneration
opencodeSessionId
participantId
perspectiveId
domainRevisionAtStart
lastContextRevisionBefore
hydrationMode = FULL | DELTA | MINIMAL
inputObjectIds
skill versions
provider/model
tool calls
structured output
proposed commands
applied/rejected command IDs
latency/status/error category
domainRevisionAtEnd
```

This is enough to diagnose stale context without copying opaque OpenCode internals.

## Failure cases

### OpenCode unavailable

- keep task/user input in Firestore;
- mark AgentRun failed;
- leave task retriable;
- do not lose user work.

### Model provider failure

Same as above. No domain mutation unless a validated command already committed.

### Session missing

Create a new session and full hydrate.

### Stale command

Reject and rerun with current revision.

### Duplicate retry

Use idempotency key to avoid duplicate requirements/events.

### User changes task while agent is running

Command revision checks determine whether the output is still applicable. If not, discard/recompute.

## P0 implementation requirements

The first implementation must include:

- persisted user-visible messages;
- AgentThread session mapping;
- `lastContextRevision`;
- `sessionGeneration`;
- thread lease;
- full rehydration on session recreation;
- context refresh when Delivery Subject revision changed;
- AgentRun hydration metadata;
- stale command rejection;
- idempotency keys for AI mutations;
- explicit recovery test where OpenCode state is deleted/restarted mid-scenario.

## Tests

At minimum:

1. lost OpenCode session does not lose requirements state;
2. new session reconstructs enough context to continue the task;
3. another user's Firestore update is visible to an old session on next run;
4. duplicate harness retry does not duplicate requirement mutation;
5. stale mutation is rejected;
6. two independent threads run concurrently;
7. same thread cannot run two prompts concurrently;
8. user-visible thread history survives OpenCode restart.
