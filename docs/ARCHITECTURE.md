# Architecture

## 1. Architectural style

Req Helper is a modular monolith on Cloud Run with Firestore as the authoritative collaborative state store and OpenCode behind a narrow `AgentHarness` boundary.

The PoC separates:

1. domain state — authoritative product/business state in Firestore;
2. conversation state — user-visible messages in Firestore;
3. harness state — disposable OpenCode session/execution state;
4. UI subscription state — realtime browser snapshots.

Only authoritative Firestore state determines readiness and final handoff.

## 2. GCP topology

```text
Browser
Next.js + React + assistant-ui
        |
        | HTTPS + authorized Firestore listeners
        v
Req Helper Cloud Run
- authn/authz
- domain command services
- task/workflow controller
- context builder
- readiness evaluator
- package/read APIs
- war-room diagnostics
        |                         |
        v                         v
Cloud Firestore              OpenCodeHarness
(authoritative)                   |
        |                         v
        |                   Vertex AI / Model Garden
        v
Enterprise adapters
MCP | REST | Search | Files | Repositories

Large uploaded files -> GCS/external storage, referenced from Firestore.
```

## 3. Frontend

Recommended:

- Next.js + React + TypeScript;
- assistant-ui for conversation/tool rendering;
- shadcn/ui or equivalent primitives;
- Firestore listeners for authorized shared state;
- backend APIs for authoritative mutations.

assistant-ui owns interaction rendering, not product state.

One logical chat thread maps to:

```text
deliverySubjectId + perspectiveId + participantId
```

Never have several simultaneously active humans writing into one OpenCode session.

## 4. Identity, access and authority

Three layers remain distinct:

### Global application capability

`ADMIN | PARTICIPANT | DELIVERY_LEAD | WAR_ROOM_OPERATOR`

### Delivery Subject membership

`SPONSOR | DELIVERY_LEAD | PARTICIPANT | OBSERVER`

Membership controls access to a specific subject.

### Perspective authority

`OWNER | DELEGATE | CONTRIBUTOR | REVIEWER`

OWNER/DELEGATE can create authoritative verification for their perspective. REVIEWER is advisory.

A global DELIVERY_LEAD role only means the user may lead subjects. Subject membership determines which subject they actually lead.

## 5. Backend/domain modules

### DeliverySubjectModule

Lifecycle, scope, constraints, success measures, aggregate revision.

### AccessModule

Subject memberships, global capability checks and subject-scoped authorization.

### PerspectiveModule

Perspective catalogue, confirmation, assignments and authority checks.

### SourceModule

SourceArtifact metadata/GCS references, Evidence and enterprise source linkage.

### ContributionModule

Human statements, epistemic mode and confidence semantics.

### RequirementModule

Current Requirement, immutable RequirementRevision, RequirementSource and manual/AI edit path.

### VerificationModule

Immutable revision-bound human Verification and authorization of verifier authority.

### ResolutionModule

Gaps, assumptions, N-party conflicts, positions, decisions and follow-up tasks.

### KnowledgeModule

KnowledgeReferences and ProposedDiffs.

### WorkPackageModule

Target implementation area/team, dependencies, acceptance criteria and evals.

### ReadinessModule

Pure/deterministic checks over canonical snapshots.

### AgentThreadModule

OpenCode session mapping, lease, session generation and exact context revision actually presented.

### PackageModule

JSON/Markdown export and read-only downstream package/work-package APIs.

### AuditModule

Append-only DomainEvents and AgentRun traces.

## 6. Firestore persistence shape

See `docs/FIRESTORE_MODEL.md` for canonical details.

Key subcollections:

```text
deliverySubjects/{subjectId}
  /members
  /sourceArtifacts
  /perspectives
  /assignments
  /tasks
  /contributions
  /evidence
  /verifications
  /knowledgeRefs
  /proposedDiffs
  /requirements
  /requirementRevisions
  /requirementSources
  /gaps
  /conflicts
  /assumptions
  /decisions
  /workPackages
  /acceptanceCriteria
  /evaluations
  /dependencies
  /messages
  /events
  /agentThreads
  /agentRuns
```

Growing data/history remains in subcollections. The Delivery Subject root is bounded summary/state.

## 7. Deterministic application workflow

No generic workflow engine is required in P0.

```text
create signal/source artifacts
 -> clarify problem/outcome/scope
 -> confirm subject membership + perspectives
 -> assign perspective humans
 -> create targeted tasks
 -> persist human answer
 -> task ANSWERED -> PROCESSING
 -> OpenCode extracts structured proposals
 -> validate/revision-check/idempotency-check
 -> persist contribution/evidence/requirement revision/source/verification/etc.
 -> create targeted follow-ups/conflicts as needed
 -> task COMPLETED or WAITING_ON_OTHER
 -> converge
 -> work-package split
 -> acceptance/evals
 -> deterministic readiness
 -> package API/export
```

Human waiting is durable Task state, never suspended process memory.

## 8. Canonical task lifecycle

```text
OPEN -> IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED
                     \-> WAITING_ON_OTHER -> IN_PROGRESS
Any nonterminal -> CANCELLED
```

AgentRun status is separate from Task status.

A human answer is persisted before invoking OpenCode so provider/harness failures do not lose human work.

## 9. OpenCode harness boundary

```ts
export interface AgentHarness {
  ensureThread(input: EnsureThreadInput): Promise<AgentThreadHandle>;
  prompt<T>(input: HarnessPrompt<T>): Promise<HarnessResult<T>>;
  stream(input: HarnessStreamPrompt): AsyncIterable<HarnessEvent>;
  cancel(runId: string): Promise<void>;
}
```

Required behavior:

- `opencodeSessionId` is recoverable metadata only;
- lost session -> create replacement + increment generation + FULL hydrate;
- serialize prompts per AgentThread using Firestore lease;
- different threads may execute concurrently;
- every structured output validates before domain commands;
- every mutating command checks authz + expected revision + idempotency;
- OpenCode never receives unrestricted Firestore credentials.

## 10. Context synchronization

AgentThread stores `contextRevisionPresented`.

Meaning:

> highest Delivery Subject revision whose authoritative state was actually presented to the current OpenCode session.

Do not use a vague `lastContextRevision`, and never set this field to same-run `domainRevisionAtEnd` unless those mutations were explicitly presented back to the session.

P0 hydration:

```text
new/recreated session -> FULL
no presented revision -> FULL
current == presented  -> MINIMAL
current != presented  -> FULL
```

True delta hydration is optional later.

ContextEnvelope includes current scope/task/perspective, relevant requirements + sources + active verifications, contributions, decisions/conflicts/gaps/assumptions, knowledge and recent events.

## 11. Requirement mutation path

Human `[Edit]` and AI synthesis use one service.

A semantic edit:

1. checks access/authority/current revision;
2. appends RequirementRevision;
3. increments current Requirement revision;
4. writes RequirementSource links;
5. preserves old Verification for audit but makes it ineligible for the new revision;
6. marks/reassesses revision-bound acceptance/evals;
7. reassesses conflicts/gaps;
8. appends DomainEvent.

This prevents manual UI edits from bypassing provenance/readiness semantics.

## 12. Conflict orchestration

Conflict is N-party.

```text
Conflict detected
 -> participant-specific tasks
 -> independent participant threads capture Position/Evidence
 -> shared conflict page aggregates positions
 -> AI produces neutral summary/options
 -> named human decision owner records Decision or source correction
 -> conflict resolves
 -> affected requirements are reassessed
```

The shared conflict page is a shared **view**, not a shared OpenCode session.

## 13. Realtime collaboration

Browsers subscribe narrowly:

- My Work: user's tasks;
- Overview: subject summary/perspectives/blockers/readiness;
- Drill: current task/thread messages/relevant structured state;
- Requirement detail: current requirement + history/provenance/verification/acceptance/evals;
- Conflict workspace: conflict positions/tasks/decision;
- War Room: recent AgentRuns/events/tasks.

Remote updates must not erase unsent local chat drafts. Editing stale structured state must produce a revision warning rather than silent overwrite.

## 14. Browser authorization

Firestore Security Rules enforce subject membership for subject reads. Admin/global-template reads are separate.

Authoritative writes go through Cloud Run backend application services using service identity. Backend services enforce:

- membership;
- system capability;
- subject role;
- perspective authority;
- target revision/invariants.

War-room permission does not imply assignment-management permission.

## 15. Source artifacts

New Signal may attach links/files.

- metadata: Firestore SourceArtifact;
- uploaded bytes: GCS or approved external source;
- evidence/provenance: references to artifact ID/URI;
- no large file payload inside Firestore documents.

## 16. Work packages / acceptance / evals

A WorkPackage has required `targetAreaRef`, optional target team and optional human coordinator.

AcceptanceCriterion and Evaluation can target:

```text
REQUIREMENT | WORK_PACKAGE | DELIVERY_SUBJECT
```

Requirement-level checks may bind to a semantic requirement revision.

## 17. Dependency semantics

`blocking=true` means unresolved dependency prevents READY. An owner helps accountability but does not clear the blocker.

## 18. Readiness

Readiness consumes canonical Firestore-backed snapshots and is deterministic.

Notable invariants:

- all required perspectives confirmed;
- all required perspectives owned/delegated regardless of medium/high criticality;
- current-revision human verification + authoritative provenance for high/critical requirements;
- unresolved blocking gap/conflict/assumption/dependency/task blocks;
- targeted work packages;
- current acceptance/evals.

## 19. Downstream package boundary

P0 supports:

```text
GET /api/delivery-subjects/{id}/package
GET /api/delivery-subjects/{id}/work-packages/{workPackageId}
```

and JSON/Markdown exports from the same persisted model.

Downstream consumers receive domain state/provenance/verification/readiness, never OpenCode session state as product truth.

## 20. Agent-run observability

Persist:

```text
runId/threadId/sessionGeneration/opencodeSessionId
subject/perspective/participant
provider/model/skill versions
domainRevisionAtStart
contextRevisionPresentedBefore
contextRevisionPresentedThisRun
hydrationMode
input object IDs/tool calls/structured output
proposed/applied/rejected commands
domainRevisionAtEnd
latency/status/error category
```

Never persist private chain-of-thought.

## 21. GCP deployment

- Next.js/Node application: Cloud Run.
- Firestore: approved GCP location.
- uploaded source files: GCS where uploads are enabled.
- OpenCode: internal service or embedded process where operationally acceptable.
- Vertex AI/Model Garden: approved models/region through OpenCode `google-vertex` provider and ADC/workload identity.

OpenCode local storage is disposable. Restart/replacement must be recoverable from Firestore.

## 22. Avoid in week one

- Redis;
- Kafka/PubSub solely for UI synchronization;
- LangGraph/Temporal/Camunda;
- PostgreSQL;
- custom WebSocket collaboration layer;
- vector database unless a concrete retrieval failure proves need.
