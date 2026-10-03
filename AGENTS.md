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

## Thread/session model

Default logical AgentThread identity:

```text
deliverySubjectId + perspectiveId + participantId
```

Persist:
- logical thread ID;
- recoverable OpenCode session ID;
- status/busy lease and expiry;
- context/domain revision;
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
- write append-only audit events for meaningful domain mutations.

## Vertical slice

Implement in this order:

1. Firestore persistence + Delivery Subject creation.
2. Perspective proposal/confirmation.
3. Perspective assignment and task inbox.
4. Realtime multi-user overview/task updates.
5. assistant-ui drill workspace.
6. AgentThread creation and OpenCode session mapping.
7. Human response capture.
8. OpenCode contribution extraction.
9. Requirement synthesis/versioning.
10. Gap/conflict/assumption detection.
11. Verification/follow-up routing.
12. Knowledge reference + proposed impact diff.
13. Work-package split.
14. Acceptance criteria and eval generation.
15. Deterministic readiness.
16. Final package export.
17. War-room trace view.
18. Cloud Run + Vertex deployment hardening.

Do not implement downstream code generation/deployment.

## OpenCode execution discipline

Every run must:

```text
load authoritative Firestore state
 -> build bounded context envelope
 -> ensure/recreate AgentThread session
 -> acquire thread lease
 -> invoke OpenCode with allowlisted tools/skills
 -> validate structured result
 -> re-read relevant revision if needed
 -> apply deterministic domain command/transaction
 -> append audit + agentRun record
 -> release lease
```

If an OpenCode session disappears, create another and continue from Firestore.

Never store or expose private chain-of-thought. Persist only useful run metadata, tool activity, structured outputs, errors, and applied/rejected commands.

## War-room observability

For every agent run capture at minimum:
- run ID;
- logical thread ID;
- OpenCode session ID;
- delivery subject/perspective/participant IDs;
- model/provider;
- prompt/skill version;
- start/end/latency;
- input domain revision and relevant object IDs;
- tool calls;
- validated structured output;
- schema failures/retries;
- proposed/applied/rejected domain commands;
- final status/error category.

Failures are classifiable as MODEL, PROMPT, CONTEXT, KNOWLEDGE, WORKFLOW, DOMAIN_MODEL, UX, OWNERSHIP or CONCURRENCY.

## Definition of done

A seeded realistic signal can be processed end-to-end by multiple simultaneous users until the app exports a package containing outcomes, decisions, assumptions, requirements, impacts, work packages, acceptance criteria, evals, dependencies, traceability and deterministic readiness evidence. Another user must see relevant changes live without manually refreshing.
