# Architecture

## 1. Architectural style

Use a **modular monolith** for Req Helper itself and treat OpenCode as an external/embedded execution harness behind a narrow adapter.

The PoC separates four kinds of state:

1. **Domain state** — authoritative business facts persisted in Cloud Firestore.
2. **Conversation state** — user/thread messages persisted for continuity and audit.
3. **Harness/session state** — OpenCode session identifiers and transient execution context.
4. **UI subscription state** — realtime snapshots used by browsers.

Only Firestore domain state determines readiness and final handoff. OpenCode sessions are replaceable execution context.

## 2. Target GCP topology

```text
┌───────────────────────────────────────────────────────────────────────┐
│ Browser                                                               │
│ Next.js / React + assistant-ui                                       │
│                                                                       │
│ My Work | Delivery | Drill | Requirements | Impacts | Readiness      │
└──────────────────────────────┬────────────────────────────────────────┘
                               │ HTTPS + Firestore listeners
                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│ Req Helper Web/API - Cloud Run                                       │
│                                                                       │
│ auth/identity context                                                 │
│ domain command services                                               │
│ deterministic workflow controller                                    │
│ context builder                                                       │
│ readiness evaluator                                                   │
│ export service                                                        │
│ war-room trace service                                                │
└───────────────┬────────────────────────────┬──────────────────────────┘
                │                            │
                ▼                            ▼
┌──────────────────────────┐      ┌────────────────────────────────────┐
│ Cloud Firestore          │      │ OpenCodeHarness                   │
│ authoritative state      │      │ SDK/server adapter                │
│ conversations            │      │ one session per interaction thread│
│ audit/events             │      └───────────────┬────────────────────┘
└───────────────┬──────────┘                      │
                │                                 ▼
                │                      ┌───────────────────────────────┐
                │                      │ Vertex AI / Model Garden      │
                │                      │ Gemini / approved models      │
                │                      └───────────────────────────────┘
                ▼
┌───────────────────────────────────────────────────────────────────────┐
│ Enterprise adapter layer                                              │
│ MCP | REST | APIs | Search | Files | Repositories                    │
└───────────────────────────────────────────────────────────────────────┘
```

## 3. Why Firestore for the PoC

The war-room use case is inherently collaborative: multiple people can answer separate perspective drills while delivery leads observe the same Delivery Subject changing.

Firestore provides:
- realtime document/query listeners to browsers;
- optimistic/offline-friendly client behavior where useful;
- atomic transactions/batched writes for invariant-sensitive mutations;
- server-side IAM and client-side security rules;
- no custom WebSocket or Redis layer for the PoC.

The trade-off is weaker relational ergonomics. Mitigate that by using IDs, bounded subcollections, denormalized read summaries, and deterministic application services rather than giant nested aggregate documents.

## 4. Frontend

Recommended:
- Next.js + React + TypeScript;
- assistant-ui for the conversational surface;
- shadcn/ui or equivalent primitives;
- Firestore client listeners for shared state that should update live;
- normal API calls for privileged/validated mutations;
- avoid direct client writes to sensitive domain collections unless security rules and invariants are trivial.

assistant-ui owns interaction rendering, not product state.

### Session/thread rule

A chat thread maps to an application-level AgentThread, not directly to a global Delivery Subject.

Default thread key:

```text
deliverySubjectId + perspectiveId + participantId
```

This prevents concurrent humans from racing on one OpenCode session while still sharing the same Firestore domain state.

## 5. Backend/domain modules

### DeliverySubjectModule
Lifecycle, scope, outcome and status.

### PerspectiveModule
Perspective catalogue, assignments and coverage.

### ContributionModule
Human statements, provenance, confidence, epistemic mode and verification.

### RequirementModule
Requirement lifecycle, revisions, provenance and relationships.

### ResolutionModule
Gaps, assumptions, conflicts, decisions and follow-up tasks.

### KnowledgeModule
References to enterprise knowledge and proposed diffs.

### WorkPackageModule
Area split, dependencies, acceptance criteria and evals.

### ReadinessModule
Pure/deterministic checks over Firestore-backed snapshots.

### AgentThreadModule
Maps UI threads to OpenCode sessions, tracks lifecycle, lease/busy state and last context revision.

### AuditModule
Append-only events and agent-run traces.

## 6. OpenCode harness boundary

OpenCode replaces LangGraph as the agent execution harness for the PoC.

Req Helper owns sequencing and durable state. OpenCode performs bounded reasoning/tool work.

```ts
export interface AgentHarness {
  ensureThread(input: EnsureThreadInput): Promise<AgentThreadHandle>;
  prompt<T>(input: HarnessPrompt<T>): Promise<HarnessResult<T>>;
  stream(input: HarnessStreamPrompt): AsyncIterable<HarnessEvent>;
  cancel(runId: string): Promise<void>;
}
```

The OpenCode adapter may use `@opencode-ai/sdk` against either an embedded instance or a separately deployed server.

### Required behavior

- store `opencodeSessionId` only as recoverable metadata;
- if the session is missing, recreate it and hydrate from Firestore context;
- never rely on OpenCode transcript/session DB as the authoritative requirement store;
- serialize prompts per AgentThread;
- validate every structured result before applying a domain command;
- persist model/provider/session/run metadata for war-room inspection.

## 7. Deterministic workflow controller

Do not replace LangGraph with another generic workflow engine.

Use ordinary application state and task records:

```text
create signal
  -> clarify signal
  -> identify perspectives
  -> create perspective tasks
  -> participant drill thread
  -> record human answer
  -> OpenCode extracts contributions
  -> validated domain mutation
  -> OpenCode proposes requirements/gaps/conflicts
  -> validated domain mutation
  -> create follow-up tasks as needed
  -> converge
  -> work-package split
  -> acceptance criteria/evals
  -> deterministic readiness
```

Human waiting is represented by persisted Task state, not suspended process memory.

## 8. Context engineering

Every OpenCode invocation receives a bounded context envelope reconstructed from Firestore and enterprise adapters.

```ts
type ContextEnvelope = {
  deliverySubject: DeliverySubjectSummary;
  thread: AgentThreadSummary;
  currentPerspective?: PerspectiveSummary;
  currentTask?: TaskSummary;
  relevantRequirements: RequirementSummary[];
  relevantContributions: ContributionSummary[];
  relevantDecisions: DecisionSummary[];
  relevantKnowledge: KnowledgeReferenceSummary[];
  openIssues: IssueSummary[];
  domainRevision: number;
};
```

Stable IDs are mandatory so the harness can propose commands without copying whole objects.

## 9. Firestore persistence model

See `docs/FIRESTORE_MODEL.md` for the complete model.

Top-level pattern:

```text
deliverySubjects/{subjectId}
  /perspectives
  /assignments
  /tasks
  /contributions
  /requirements
  /conflicts
  /gaps
  /assumptions
  /decisions
  /knowledgeRefs
  /impacts
  /workPackages
  /events
  /agentThreads
  /agentRuns
```

Use subcollections for unbounded/growing lists. The parent Delivery Subject document contains only summary/state fields needed frequently by overview screens.

### Concurrency

For mutations that depend on current state:
- use Firestore transactions;
- maintain `revision` or `updatedAt` fields;
- reject/retry stale commands where semantic conflicts matter;
- use deterministic IDs or idempotency keys for AI-proposed mutations;
- do not allow reruns to blindly duplicate requirements/events.

For agent threads:
- one active run per thread;
- use a short Firestore lease/busy marker with expiry;
- separate threads may execute concurrently against the same Delivery Subject;
- every command re-reads authoritative state before applying changes.

## 10. Realtime collaboration

Browsers subscribe to only the slices they need.

Examples:
- participant Drill Workspace: current task, relevant requirements, thread messages, blocking conflicts;
- Delivery Lead: subject summary, perspective status, tasks, blockers and readiness;
- War Room: agentRuns, events and open tasks.

Do not subscribe every user to every subcollection.

A human answer flows as:

```text
Alice UI -> API -> task/contribution write -> Firestore
                                      |
                                      +-> listeners update Bob/Lead views
                                      +-> backend invokes OpenCode
                                      +-> validated AI mutations -> Firestore
                                      +-> listeners update all relevant views
```

## 11. Authentication and authorization

PoC options:
- use existing enterprise identity if readily available;
- otherwise Firebase Authentication / Identity Platform or explicit named PoC personas.

Keep authorization separate from perspective ownership.

For production direction:
- browser reads constrained by security rules;
- privileged domain mutations through Cloud Run service account;
- enterprise integrations use workload identity/service accounts;
- OpenCode/Vertex credentials never reach the browser.

## 12. Vertex AI / Model Garden

OpenCode is configured with the `google-vertex` provider. Prefer Application Default Credentials/workload identity on GCP.

Configuration is environment-driven so approved models can change without product-code changes.

The application records:
- logical model role;
- actual provider/model;
- region;
- prompt/skill version;
- OpenCode session/run IDs;
- latency and errors.

## 13. Enterprise knowledge adapter boundary

```ts
export interface KnowledgeProvider {
  search(query: KnowledgeQuery): Promise<KnowledgeHit[]>;
  fetch(ref: ExternalKnowledgeRef): Promise<KnowledgeDocument | null>;
  related(ref: ExternalKnowledgeRef): Promise<KnowledgeHit[]>;
}
```

Possible implementations:
- MCPKnowledgeProvider;
- RestKnowledgeProvider;
- SearchKnowledgeProvider;
- RepositoryKnowledgeProvider;
- SeedKnowledgeProvider.

MCP remains an integration boundary, not the internal data model.

## 14. Audit/event model

Every meaningful mutation writes an append-only event under the Delivery Subject.

Examples:
- DeliverySubjectCreated;
- PerspectiveAssigned;
- HumanAnswerRecorded;
- ContributionExtracted;
- ContributionVerified;
- RequirementCreated/Revised;
- GapDetected;
- ConflictDetected;
- DecisionRecorded;
- KnowledgeLinked;
- WorkPackageCreated;
- ReadinessChanged.

This is not event sourcing. Current Firestore documents remain authoritative.

## 15. Agent-run observability

Persist per run:

```text
runId
threadId
deliverySubjectId
perspectiveId
participantId
opencodeSessionId
model/provider
prompt/skill versions
startedAt/endedAt/latencyMs
context revision/input object IDs
tool calls
structured result
schema validation failures
proposed commands
applied/rejected commands
status/error category
```

Failure categories remain:
`MODEL | PROMPT | CONTEXT | KNOWLEDGE | WORKFLOW | DOMAIN_MODEL | UX | OWNERSHIP | CONCURRENCY`.

## 16. Deployment

### PoC

- Next.js/Node Req Helper application: Cloud Run.
- Firestore: same GCP project/approved region configuration.
- OpenCode: either:
  1. a separately deployed internal service using `@opencode-ai/sdk`, or
  2. embedded/started by the backend where operationally acceptable.
- Vertex AI: region/model chosen by bank policy.

Treat OpenCode local session storage as disposable. A Cloud Run restart must be recoverable by creating a new OpenCode session and rebuilding context from Firestore.

### Avoid in week one

- Redis;
- Kafka/PubSub just for UI synchronization;
- LangGraph;
- Temporal/Camunda;
- PostgreSQL;
- a custom WebSocket collaboration layer;
- vector database unless retrieval quality demonstrates the need.
