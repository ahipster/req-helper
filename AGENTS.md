# AGENTS.md

This repository is a one-week PoC. Optimize for a complete collaborative vertical slice, not framework completeness.

## Mission

Build an AI-first requirements orchestration system that turns a signal into an implementation-ready requirement package through multi-user human/AI loops.

## Non-negotiable architecture rules

1. Firestore domain state is authoritative. OpenCode/session/chat state is not.
2. Chat transcripts are interaction history, never the sole representation of requirements.
3. Human contributions and authoritative verification are separate concepts.
4. AI-generated facts retain provenance and verification state.
5. Readiness criteria are deterministic functions over persisted state.
6. Conflicts, assumptions, gaps and decisions are first-class entities.
7. Enterprise knowledge is linked through adapters; do not build a generic knowledge graph.
8. MCP may implement an adapter; do not make it the internal object model.
9. Keep Req Helper a modular monolith unless a concrete PoC requirement forces separation.
10. Every structured AI output validates against Zod/JSON Schema before domain mutation.
11. Use OpenCode as the harness; do not add LangGraph/Temporal/Camunda for this PoC.
12. One active OpenCode run per AgentThread; separate participant/perspective threads may run concurrently.
13. OpenCode sessions must be recreatable from Firestore-backed context.
14. Firestore listeners are for collaborative reads; privileged domain writes go through validated server application commands.
15. Global application roles and per-Delivery-Subject perspective assignments are separate concepts.
16. Do not infer authoritative ownership from job title, role template, expertise hint, or OpenCode output.
17. Do not replicate OpenCode local disk/database into Firestore. Persist only product-level messages, validated structured outputs, tool/run metadata, and domain mutations.
18. Every meaningful OpenCode run must refresh authoritative context from Firestore according to `docs/OPENCODE_STATE_SYNC.md`.

## Required specification reading

Before implementation, read:

1. `docs/PRD.md`
2. `docs/ARCHITECTURE.md`
3. `docs/FIRESTORE_MODEL.md`
4. `docs/ADMIN_UI.md`
5. `docs/OPENCODE_STATE_SYNC.md`
6. `docs/MULTI_USER.md`
7. `docs/IMPLEMENTATION_PLAN.md`

## Identity and role model

Global application roles:

```text
ADMIN
PARTICIPANT
DELIVERY_LEAD
WAR_ROOM_OPERATOR
```

Delivery Subject assignment relationships:

```text
OWNER
DELEGATE
CONTRIBUTOR
REVIEWER
```

Role templates and expertise hints help suggest participants; they never establish authority on a Delivery Subject. The Delivery Lead/Admin explicitly confirms assignments.

P0 must include enough Admin UI to manage users, role templates, perspective templates and Delivery Subject assignments without editing Firestore manually.

## Thread/session model

Default logical AgentThread identity:

```text
deliverySubjectId + perspectiveId + participantId
```

Persist:
- logical thread ID;
- recoverable OpenCode session ID;
- session generation;
- status/busy lease and expiry;
- last authoritative context/domain revision;
- last run metadata.

Do not put multiple simultaneously active humans into one OpenCode session.

## Firestore rules of thumb

- parent Delivery Subject docs contain bounded summary fields only;
- requirements/tasks/contributions/messages/events/etc. are separate documents in subcollections;
- no unbounded arrays on aggregate documents;
- use Firestore transactions for invariant-sensitive read-modify-write operations;
- use idempotency keys/deterministic IDs for AI proposal application;
- track revision/updatedAt to reject stale AI commands;
- do not store large enterprise source documents in Firestore when a reference/summary is sufficient;
- add indexes for actual UI queries, not speculative combinations;
- write append-only audit events for meaningful domain mutations;
- root `users`, `roleTemplates`, and `perspectiveTemplates` hold PoC configuration only.

## Vertical slice

Implement in this order:

1. Firestore persistence + Delivery Subject creation.
2. User/admin configuration model and minimal Admin UI.
3. Perspective proposal/confirmation.
4. Perspective assignment and task inbox.
5. Realtime multi-user overview/task updates.
6. assistant-ui drill workspace.
7. AgentThread creation and OpenCode session mapping.
8. Firestore-backed context hydration/session recovery.
9. Human response capture.
10. OpenCode contribution extraction.
11. Requirement synthesis/versioning.
12. Gap/conflict/assumption detection.
13. Verification/follow-up routing.
14. Knowledge reference + proposed impact diff.
15. Work-package split.
16. Acceptance criteria and eval generation.
17. Deterministic readiness.
18. Final package export.
19. War-room trace view.
20. Cloud Run + Vertex deployment hardening.

Do not implement downstream code generation/deployment.

## OpenCode execution discipline

Every meaningful run must:

```text
receive authenticated user action
 -> load authoritative Firestore state + AgentThread
 -> acquire thread lease
 -> verify/recreate OpenCode session
 -> compare Delivery Subject revision with AgentThread.lastContextRevision
 -> build bounded authoritative context envelope
 -> persist AgentRun(status=RUNNING)
 -> invoke OpenCode with allowlisted tools/skills
 -> persist user-visible assistant response/run metadata
 -> validate structured result
 -> re-read affected objects/revisions
 -> apply idempotent deterministic domain command/transaction
 -> append audit/domain events
 -> update AgentThread.lastContextRevision/sessionGeneration as needed
 -> mark AgentRun terminal
 -> release lease
```

If an OpenCode session disappears, create another and continue from Firestore. OpenCode local storage is disposable.

When conversation memory conflicts with Firestore-backed current state, current Firestore state wins and the discrepancy should be surfaced when material.

Never store or expose private chain-of-thought. Persist only useful run metadata, user-visible messages, tool activity, structured outputs, errors, and applied/rejected commands.

## Required recovery/concurrency tests

P0 tests must prove:

- OpenCode restart/session deletion does not lose domain state or user-visible thread history;
- a recreated session can continue from Firestore hydration;
- another user's update is injected into an old thread on its next meaningful run;
- duplicate retries do not duplicate domain mutations;
- stale AI commands are rejected/recomputed;
- independent participant threads can run concurrently;
- same-thread concurrent prompts are prevented by lease;
- required perspective ownership cannot be satisfied by an expertise hint alone.

## War-room observability

For every agent run capture at minimum:
- run ID;
- logical thread ID;
- OpenCode session ID and session generation;
- delivery subject/perspective/participant IDs;
- model/provider;
- prompt/skill version;
- start/end/latency;
- input domain revision and `lastContextRevision` before run;
- hydration mode (`FULL`, `DELTA`, `MINIMAL`);
- relevant object IDs;
- tool calls;
- validated structured output;
- schema failures/retries;
- proposed/applied/rejected domain commands;
- final status/error category;
- domain revision after run.

Failures are classifiable as MODEL, PROMPT, CONTEXT, KNOWLEDGE, WORKFLOW, DOMAIN_MODEL, UX, OWNERSHIP or CONCURRENCY.

## Definition of done

A seeded realistic signal can be processed end-to-end by multiple simultaneous users until the app exports a package containing outcomes, decisions, assumptions, requirements, impacts, work packages, acceptance criteria, evals, dependencies, traceability and deterministic readiness evidence. Another user must see relevant changes live without manually refreshing. Admins can configure PoC participants/roles from the UI, and loss/staleness of OpenCode local state is demonstrably recoverable from Firestore.
