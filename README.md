# Req Helper

AI-first requirements orchestration PoC for enterprise delivery.

Req Helper turns a raw signal/idea into a traceable, multi-perspective requirement package that a downstream SDLC can implement. The PoC is intentionally narrower than OrgWard: it focuses on requirements discovery, human/AI review loops, enterprise knowledge linkage, requirement decomposition, acceptance criteria, evals, and deterministic readiness.

## Core thesis

The primary object is a **Delivery Subject**, not a chat transcript or agent session.

```text
Signal
  -> Delivery Subject
  -> Knowledge + impact hypotheses
  -> Perspective-specific human drills
  -> Contributions / evidence / verification
  -> Structured requirements
  -> Gaps / conflicts / decisions
  -> Work-package split
  -> Acceptance criteria + evals
  -> Deterministic readiness gate
  -> Requirement package for downstream SDLC
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
 multiple users
```

### Recommended stack

- TypeScript / Node.js
- Next.js + React
- assistant-ui for the composable chat/agent surface
- Firebase Authentication or existing enterprise identity adapter
- Cloud Firestore as authoritative shared domain state
- OpenCode as the programmable agent harness
- Vertex AI / Model Garden as the primary model provider through OpenCode
- Zod/JSON Schema for structured AI outputs
- Cloud Run for the Req Helper web/API deployment
- adapter boundary for MCP / REST / enterprise APIs / files / search

There is **no LangGraph requirement** in the PoC. The application owns a small deterministic workflow/state machine around OpenCode.

OpenCode sessions are disposable execution context, not business state. Losing an OpenCode session must not lose requirements work; the session can be recreated from Firestore-backed context. See `docs/OPENCODE_STATE_SYNC.md`.

## Admin and role model

The PoC includes a small Admin UI for:

- users;
- global application roles;
- role templates;
- perspective templates/catalogue;
- Delivery Subject perspective assignments.

Global roles such as `ADMIN`, `DELIVERY_LEAD`, `PARTICIPANT`, and `WAR_ROOM_OPERATOR` are separate from Delivery Subject assignment relationships `OWNER`, `DELEGATE`, `CONTRIBUTOR`, and `REVIEWER`.

Job title, expertise hint, role template or AI suggestion must never grant authoritative ownership automatically. See `docs/ADMIN_UI.md`.

## Multi-user model

Each participant gets an independent interaction thread, normally keyed by:

```text
deliverySubjectId + perspectiveId + participantId
```

Do not have several humans write concurrently into one OpenCode session.

All threads read/write the same Firestore Delivery Subject state through validated application commands. Firestore listeners push relevant changes to other logged-in users in real time.

## OpenCode state synchronization

There is no wholesale replication of OpenCode's local database/disk into Firestore.

For every meaningful run Req Helper:

```text
loads authoritative Firestore state
 -> resolves/recreates OpenCode session
 -> compares Delivery Subject revision with AgentThread.lastContextRevision
 -> hydrates/refreshes bounded context
 -> runs OpenCode
 -> persists user-visible messages/run metadata
 -> validates proposed structured mutations
 -> rechecks revisions/idempotency
 -> commits authoritative Firestore changes
```

`AgentThread` stores a recoverable `opencodeSessionId`, `sessionGeneration`, and `lastContextRevision`. If the session is lost, Req Helper creates another and fully rehydrates from Firestore. Conversation history required by users is also persisted in Firestore.

## Firestore shape

Use small documents and subcollections; do not store the entire Delivery Subject in one large nested document.

```text
users/{userId}
roleTemplates/{roleTemplateId}
perspectiveTemplates/{perspectiveTemplateId}

deliverySubjects/{subjectId}
  /perspectives/{perspectiveId}
  /assignments/{assignmentId}
  /tasks/{taskId}
  /contributions/{contributionId}
  /requirements/{requirementId}
  /conflicts/{conflictId}
  /gaps/{gapId}
  /assumptions/{assumptionId}
  /decisions/{decisionId}
  /knowledgeRefs/{referenceId}
  /impacts/{impactId}
  /workPackages/{workPackageId}
  /messages/{messageId}
  /events/{eventId}
  /agentThreads/{threadId}
  /agentRuns/{runId}
```

See `docs/FIRESTORE_MODEL.md`.

## PoC boundary

In scope:
- create and persist a Delivery Subject;
- multi-user realtime collaboration;
- admin/configuration UI for PoC users, roles and perspective templates;
- propose affected perspectives;
- assign owners/contributors/reviewers;
- run OpenCode-backed AI drills with humans;
- recover/re-hydrate lost or stale OpenCode sessions from Firestore;
- capture contributions separately from authoritative verification;
- synthesize and version structured requirements;
- link existing enterprise knowledge and record proposed diffs;
- detect gaps, assumptions, conflicts, and decisions;
- split final requirements into affected-area work packages;
- generate detailed acceptance criteria and eval definitions;
- compute readiness deterministically;
- expose war-room traces for prompt/harness/context tuning.

Out of scope:
- autonomous implementation/deployment;
- authoritative write-back to enterprise architecture repositories;
- generic enterprise knowledge graph;
- generic workflow platform;
- production-complete IAM/SCIM and notification integrations.

## Repository map

```text
docs/                Product, architecture, Firestore, admin, sync, BPMN and plan
src/domain/          Domain schemas and deterministic readiness
src/harness/         OpenCode harness boundary
src/persistence/     Firestore persistence helpers/contracts
src/adapters/        Enterprise knowledge/identity boundaries
src/seed/            War-room demo scenario
prompts/             Small task-specific prompt/skill files
tests/               Domain/readiness tests
```

## Start here

1. Read `docs/PRD.md`.
2. Read `docs/ARCHITECTURE.md` and `docs/FIRESTORE_MODEL.md`.
3. Read `docs/ADMIN_UI.md`.
4. Read `docs/OPENCODE_STATE_SYNC.md` and `docs/MULTI_USER.md`.
5. Follow `docs/IMPLEMENTATION_PLAN.md` in priority order.
6. Use `src/seed/customer-status-change.ts` as the first war-room scenario.
7. Keep the agent loop small: **drill -> human answer -> extract -> mutate domain -> assess -> ask again**.

## Non-negotiable design constraints

1. Chat and OpenCode sessions are never the sole durable representation.
2. Firestore domain state is authoritative.
3. Every material requirement needs provenance.
4. Useful knowledge may come from non-owners; authority must be explicit.
5. Global roles/templates do not imply Delivery Subject authority.
6. Conflicts, assumptions, decisions, and gaps are first-class records.
7. Readiness is deterministic code, not an LLM opinion.
8. MCP is an integration boundary, not the internal architecture.
9. All AI-produced domain mutations validate against schema, authorization, idempotency and revision invariants first.
10. OpenCode local disk/state is disposable and is never replicated wholesale into Firestore.
