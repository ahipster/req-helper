# Req Helper

AI-first requirements orchestration PoC for enterprise delivery.

Req Helper turns a raw signal/idea into a traceable, multi-perspective requirement package that a downstream SDLC can implement. The PoC is intentionally narrower than OrgWard: requirements discovery, human/AI review loops, enterprise knowledge linkage, requirement decomposition, acceptance/evals, and deterministic readiness.

## Core thesis

The primary object is a **Delivery Subject**, not a chat transcript or agent session.

```text
Signal + source material
  -> Delivery Subject + scope/outcome
  -> Knowledge + impact hypotheses
  -> Subject membership + required perspectives
  -> Perspective-specific human drills
  -> Contributions + evidence + verification
  -> Requirements + revisions + provenance
  -> Gaps + assumptions + N-party conflicts + decisions
  -> Targeted work packages
  -> Acceptance criteria + evals
  -> Deterministic readiness
  -> Requirement package/API for downstream SDLC
```

## PoC architecture

```text
Next.js / React + assistant-ui
            |
            v
Req Helper API on Cloud Run
       |             |
       v             v
   Firestore      OpenCode harness
(authoritative)       |
       |              v
 realtime UI      Vertex AI / Model Garden
       |
 authorized users

Large uploaded source files -> GCS/external storage
```

### Recommended stack

- TypeScript / Node.js
- Next.js + React
- assistant-ui
- Firebase Authentication or enterprise identity adapter
- Cloud Firestore authoritative shared domain state
- GCS/external object storage for uploaded source files
- OpenCode programmable agent harness
- Vertex AI / Model Garden through OpenCode
- Zod/JSON Schema for structured AI outputs
- Cloud Run
- MCP / REST / enterprise API / files / search adapter boundary

There is no LangGraph requirement. The application owns a small deterministic workflow/state machine around OpenCode.

## Authority model

Three concepts stay separate:

1. global application capability: `ADMIN`, `PARTICIPANT`, `DELIVERY_LEAD`, `WAR_ROOM_OPERATOR`;
2. Delivery Subject membership/access: `SPONSOR`, `DELIVERY_LEAD`, `PARTICIPANT`, `OBSERVER`;
3. perspective authority: `OWNER`, `DELEGATE`, `CONTRIBUTOR`, `REVIEWER`.

Global role, job title, template or expertise hint never grants perspective authority automatically. Reviewer is advisory; OWNER/DELEGATE can satisfy authoritative verification.

## Multi-user model

Each participant gets an independent logical interaction thread:

```text
deliverySubjectId + perspectiveId + participantId
```

Several humans never write concurrently into one OpenCode session. Threads converge through validated Firestore domain records and authorized realtime listeners.

## OpenCode state synchronization

OpenCode local state is disposable. There is no wholesale replication of its local DB/disk into Firestore.

For every meaningful run:

```text
persist human answer
 -> load authoritative Firestore state
 -> resolve/recreate OpenCode session
 -> compare current domain revision with contextRevisionPresented
 -> FULL hydrate if shared state changed in P0
 -> run OpenCode
 -> validate structured proposals
 -> revision/idempotency/authz checks
 -> commit authoritative Firestore mutations
 -> store domainRevisionAtEnd separately
```

`contextRevisionPresented` means the highest authoritative Delivery Subject revision actually shown to that OpenCode session. It must not be blindly set to same-run `domainRevisionAtEnd`.

## Firestore shape

```text
users/{userId}
roleTemplates/{roleTemplateId}
perspectiveTemplates/{perspectiveTemplateId}

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

See `docs/FIRESTORE_MODEL.md`.

## Canonical semantics

- `priority` = delivery urgency/sequencing.
- `criticality` = consequence if wrong/omitted.
- Requiredness belongs to Perspective, not Assignment.
- Verification is immutable and requirement-revision specific.
- Requirement provenance is first-class `RequirementSource` data.
- Conflict supports 2+ structured positions.
- `blocking=true` dependency must be resolved before READY; ownership alone does not clear it.
- WorkPackage identifies `targetAreaRef`; team/coordinator are separate.
- Acceptance/evals may target Requirement, WorkPackage or DeliverySubject.

## P0 boundary

In scope:

- Delivery Subject + scope/source material;
- subject membership/access;
- admin/user/perspective setup;
- perspective assignments/authority;
- realtime multi-user drills;
- OpenCode session recovery/context refresh;
- Contribution/Evidence/Verification;
- RequirementRevision/RequirementSource;
- gaps/assumptions/N-party conflicts/decisions;
- enterprise knowledge/ProposedDiffs;
- targeted work packages/dependencies;
- generalized acceptance/evals;
- deterministic readiness;
- normal-user requirement history;
- JSON/Markdown export + package/work-package read APIs;
- war-room traces.

Out of scope:

- autonomous implementation/deployment;
- authoritative source-system write-back;
- generic enterprise knowledge graph/workflow platform;
- production-complete IAM/SCIM/notifications.

## Repository map

```text
docs/                PRD, architecture, domain, Firestore, UX, BPMN, admin, sync, plan
src/domain/          Canonical Zod schemas + readiness
src/harness/         OpenCode harness boundary
src/persistence/     Firestore helpers/contracts
src/adapters/        Enterprise knowledge/identity boundaries
src/seed/            War-room scenario
prompts/             Small task-specific prompt skills
tests/               Domain/readiness tests
```

## Start here

1. `AGENTS.md`
2. `docs/PRD.md`
3. `docs/DOMAIN_MODEL.md`
4. `src/domain/schemas.ts`
5. `docs/ARCHITECTURE.md`
6. `docs/FIRESTORE_MODEL.md`
7. `docs/UI_MOCKUPS.md`
8. `docs/OPENCODE_STATE_SYNC.md`
9. `docs/IMPLEMENTATION_PLAN.md`

If artifacts disagree, `src/domain/schemas.ts` + `docs/DOMAIN_MODEL.md` are canonical and the conflicting artifact must be fixed rather than preserved.
