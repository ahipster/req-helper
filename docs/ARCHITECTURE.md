# Architecture

## 1. Architectural style

Use a **modular monolith** for the PoC. Separate domain modules and adapter boundaries in code, but deploy one application plus PostgreSQL unless the bank environment already provides a separate LangGraph runtime.

The architecture deliberately separates three kinds of state:

1. **Domain state** — authoritative business facts persisted in PostgreSQL.
2. **Conversation state** — messages/transcripts used for interaction and audit.
3. **Orchestration state** — temporary/checkpointed execution state used to resume AI workflows.

Only domain state determines readiness and final handoff.

## 2. Logical components

```text
┌───────────────────────────────────────────────────────────────────────┐
│ Browser / Next.js                                                    │
│                                                                       │
│ My Work | Delivery | Drill | Requirements | Impacts | Work Packages │
│ Readiness | Final Package | War Room                                 │
└──────────────────────────────┬────────────────────────────────────────┘
                               │ HTTPS/SSE
                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│ Application/API                                                       │
│                                                                       │
│ Auth context                                                          │
│ DeliverySubject service                                              │
│ Requirement service                                                  │
│ Contribution/verification service                                    │
│ Decision/conflict/gap service                                        │
│ Knowledge-link service                                               │
│ Work-package service                                                 │
│ Readiness evaluator                                                  │
│ Export service                                                       │
└───────────────┬────────────────────────────┬──────────────────────────┘
                │                            │
                ▼                            ▼
┌──────────────────────────┐      ┌───────────────────────────────────┐
│ PostgreSQL               │      │ Orchestration                    │
│                          │      │ LangGraph                         │
│ authoritative domain     │◄────►│ drill/extract/update/assess loop │
│ audit events             │      │ interrupts + checkpoints         │
│ conversation records     │      └───────────────┬───────────────────┘
└───────────────┬──────────┘                      │
                │                                 ▼
                │                      ┌──────────────────────────────┐
                │                      │ Model Gateway                │
                │                      │ structured generation       │
                │                      │ streaming                    │
                │                      └──────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────────────────┐
│ Adapter layer                                                         │
│                                                                       │
│ KnowledgeProvider: MCP | REST | SQL | Search | Files | Repositories  │
│ IdentityProvider                                                      │
│ NotificationProvider (future)                                        │
└───────────────────────────────────────────────────────────────────────┘
```

## 3. Frontend

Recommended:
- Next.js + React + TypeScript;
- assistant-ui as the composable conversation surface;
- shadcn/ui or equivalent design primitives;
- SSE or compatible streaming transport;
- server-rendered data where useful, client state only for transient interaction.

assistant-ui should not own the product data model. Build custom panels around it for task focus, requirement/evidence state, impacts, conflicts, and readiness.

### Core navigation

```text
/my-work
/delivery/new
/delivery/:id
/delivery/:id/drill/:taskId
/delivery/:id/requirements
/delivery/:id/conflicts
/delivery/:id/impacts
/delivery/:id/work-packages
/delivery/:id/readiness
/delivery/:id/package
/war-room/:id
```

## 4. Backend/domain modules

### DeliverySubjectModule
Lifecycle, scope, outcome, status.

### PerspectiveModule
Perspective catalogue, assignments and coverage.

### ContributionModule
Human statements, provenance, confidence, epistemic mode and verification.

### RequirementModule
Structured requirement lifecycle, versioning, provenance and relationships.

### ResolutionModule
Gaps, assumptions, conflicts, decisions and tasks.

### KnowledgeModule
References to external enterprise knowledge plus proposed diffs.

### WorkPackageModule
Area split, dependencies, acceptance criteria and evals.

### ReadinessModule
Pure/deterministic readiness checks over persisted state.

### AuditModule
Append-only domain events and orchestration traces.

## 5. AI/orchestration boundary

The orchestration layer must invoke domain application services rather than mutate persistence directly.

A node follows:

```text
load authoritative context
  -> build bounded context envelope
  -> call model/tool
  -> validate structured result
  -> create proposed domain commands
  -> validate invariants
  -> persist mutations + audit event
  -> determine next workflow transition
```

### Minimal graph

```text
START
  |
  v
clarify_signal
  |
retrieve_knowledge
  |
identify_perspectives
  |
plan_drill
  |
ask_human  <-----------------------------+
  |                                       |
  v                                       |
extract_contributions                     |
  |                                       |
synthesize_requirements                   |
  |                                       |
assess_gaps_conflicts                     |
  |                                       |
  +-- needs more human input? -- YES -----+
  |
  NO
  v
split_work_packages
  |
generate_acceptance_and_evals
  |
evaluate_readiness
  |
  +-- blocked? -> create targeted tasks -> plan_drill
  |
 READY
  v
END
```

Only `ask_human` should require a durable human interrupt in the first implementation. Additional approval interrupts can be added after the vertical slice works.

## 6. Context engineering

Never place the entire Delivery Subject or enterprise corpus into every prompt.

Build a node-specific context envelope containing only:

```ts
type ContextEnvelope = {
  deliverySummary: string;
  currentPerspective?: PerspectiveSummary;
  currentTask?: TaskSummary;
  relevantRequirements: RequirementSummary[];
  relevantContributions: ContributionSummary[];
  relevantDecisions: DecisionSummary[];
  relevantKnowledge: KnowledgeReferenceSummary[];
  dependencies: DependencySummary[];
  openIssues: IssueSummary[];
};
```

Every included item must carry stable IDs so model output can reference domain objects without copying them.

## 7. LLM gateway

Internal interface:

```ts
export interface ModelGateway {
  generateText(input: TextGenerationRequest): Promise<TextGenerationResult>;
  generateStructured<T>(input: StructuredGenerationRequest<T>): Promise<T>;
  streamText(input: TextGenerationRequest): AsyncIterable<string>;
}
```

Provider-specific SDKs must stay behind this interface.

For structured generation:
- use Zod/JSON Schema;
- reject invalid enum/ID references;
- retry only bounded schema failures;
- never silently coerce semantic contradictions;
- store model/provider/prompt-version metadata with each run.

## 8. Knowledge adapter boundary

Do not make MCP the internal object model.

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
- SqlKnowledgeProvider;
- RepositoryKnowledgeProvider;
- SeedKnowledgeProvider for PoC.

All returned knowledge must identify source system, external ID/URI, version if available, retrieval timestamp and source type.

## 9. MCP strategy

For PoC:
- use MCP only when a real source is already exposed through MCP;
- otherwise use direct adapters;
- expose Req Helper through MCP later for downstream SDLC consumers if useful.

Candidate downstream tools:
- `get_delivery_subject`;
- `search_requirements`;
- `get_work_package`;
- `get_traceability`;
- `record_contribution`;
- `record_decision`.

## 10. Persistence

PostgreSQL is the system of record.

Recommended relational tables:
- delivery_subject;
- perspective;
- perspective_assignment;
- contribution;
- contribution_evidence;
- contribution_verification;
- requirement;
- requirement_revision;
- requirement_source;
- knowledge_reference;
- proposed_diff;
- gap;
- conflict;
- decision;
- assumption;
- work_package;
- work_package_requirement;
- acceptance_criterion;
- evaluation;
- dependency;
- task;
- conversation_message;
- domain_event;
- orchestration_run;
- orchestration_step.

Use JSONB only for provider-specific metadata or structured payload snapshots, not as an excuse to avoid core relational invariants.

## 11. API surface

Minimum:

```text
POST   /api/delivery-subjects
GET    /api/delivery-subjects/:id
PATCH  /api/delivery-subjects/:id
GET    /api/delivery-subjects/:id/summary
GET    /api/delivery-subjects/:id/readiness
GET    /api/delivery-subjects/:id/requirements
GET    /api/delivery-subjects/:id/perspectives
POST   /api/delivery-subjects/:id/perspectives/:perspectiveId/assign
GET    /api/me/tasks
POST   /api/tasks/:id/respond
POST   /api/contributions/:id/verify
GET    /api/delivery-subjects/:id/conflicts
POST   /api/conflicts/:id/resolve
POST   /api/delivery-subjects/:id/decisions
GET    /api/delivery-subjects/:id/impacts
GET    /api/delivery-subjects/:id/work-packages
GET    /api/work-packages/:id
POST   /api/delivery-subjects/:id/orchestrate
GET    /api/delivery-subjects/:id/package.json
GET    /api/delivery-subjects/:id/package.md
GET    /api/events/:deliverySubjectId
```

## 12. Audit/event model

Every meaningful mutation emits an append-only domain event, e.g.:

```text
DeliverySubjectCreated
SignalClarified
PerspectiveProposed
PerspectiveAssigned
QuestionCreated
ContributionReceived
ContributionVerified
ContributionRejected
RequirementCreated
RequirementRevised
RequirementVerified
GapDetected
ConflictDetected
DecisionRecorded
KnowledgeLinked
DiffProposed
WorkPackageCreated
AcceptanceCriterionAdded
EvaluationAdded
ReadinessChanged
PackageReady
```

This is not full event sourcing. Current-state tables remain authoritative; events provide auditability and war-room debugging.

## 13. Security baseline

Even in PoC:
- capture authenticated actor identity or explicit mocked actor;
- record actor for every mutation;
- mark human vs AI-originated changes;
- never place credentials/secrets into model context;
- allowlist model tools/adapters;
- do not dynamically trust arbitrary MCP servers;
- preserve history of requirement changes;
- retain source metadata for retrieved knowledge;
- log access only at metadata level where content is sensitive;
- make model/provider configurable for bank-approved deployment.

## 14. Observability

For each orchestration step persist:

```text
runId
stepId
deliverySubjectId
nodeName
promptVersion
model/provider
startedAt/endedAt/latencyMs
input object IDs (not necessarily full sensitive payload)
tool calls
structured output snapshot/schema version
validation errors/retry count
human interrupt state
proposed mutations
applied mutations
status/error category
```

Failure categories:
`MODEL | PROMPT | CONTEXT | KNOWLEDGE | WORKFLOW | DOMAIN_MODEL | UX | OWNERSHIP`.

## 15. Deployment

Do not hard-bind to Vercel. Ensure:
- normal Node container build;
- environment-driven PostgreSQL and model configuration;
- no platform-only persistence;
- stateless web/application process beyond DB/checkpointer;
- health/readiness endpoints.

For local PoC development, one app process + PostgreSQL is sufficient.
