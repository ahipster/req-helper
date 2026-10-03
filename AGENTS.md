# AGENTS.md

This repository is a one-week PoC. Optimize for a complete collaborative vertical slice, not framework completeness.

## Mission

Build an AI-first requirements orchestration system that turns a signal into an implementation-ready requirement package through multi-user human/AI loops.

## Canonical sources

When artifacts disagree, use this precedence and fix the loser immediately:

1. `src/domain/schemas.ts` — executable canonical enums/record shapes;
2. `docs/DOMAIN_MODEL.md` — canonical semantics/invariants;
3. `src/domain/readiness.ts` — canonical readiness behavior;
4. `docs/PRD.md` / `docs/UI_MOCKUPS.md` — product/UX behavior;
5. persistence/orchestration docs and implementation code.

Do not preserve contradictory legacy fields for convenience.

## Non-negotiable architecture rules

1. Firestore domain state is authoritative. OpenCode/session/chat state is not.
2. Chat transcripts are interaction history, never the sole representation of requirements.
3. Membership controls Delivery Subject access; PerspectiveAssignment controls authority.
4. Global roles/job titles/expertise hints never imply Delivery Subject authority.
5. OWNER/DELEGATE can satisfy authoritative verification; REVIEWER is advisory.
6. Human contributions and authoritative verification are separate concepts.
7. Verification is immutable and revision-bound.
8. Every semantic Requirement edit creates RequirementRevision and current-revision RequirementSource records as appropriate.
9. Prior-revision verification cannot satisfy current-revision readiness.
10. Conflicts are N-party and contain positions, not fixed itemA/itemB pairs.
11. Readiness criteria are deterministic functions over persisted state.
12. Enterprise knowledge is linked through adapters; do not build a generic knowledge graph.
13. MCP may implement an adapter; do not make it the internal object model.
14. Keep Req Helper a modular monolith unless a concrete PoC requirement forces separation.
15. Every structured AI output validates against Zod/JSON Schema before domain mutation.
16. Use OpenCode as the harness; do not add LangGraph/Temporal/Camunda for this PoC.
17. One active OpenCode run per AgentThread; separate participant/perspective threads may run concurrently.
18. OpenCode sessions must be recreatable from Firestore-backed context.
19. Privileged domain writes go through validated server application commands.
20. Large source files live in GCS/external systems; Firestore stores metadata/URI.

## Semantic definitions

### Priority vs criticality

- `priority`: delivery urgency/sequencing.
- `criticality`: consequence if wrong, omitted or violated.

### Blocking

For Gap/Conflict/Assumption/Dependency/Task, `blocking=true` means unresolved/nonterminal state prevents READY. An owner does not clear a blocker.

### Assignment

Requiredness belongs to Perspective. Do not re-add `PerspectiveAssignment.required`.

### Task states

Exactly:

```text
OPEN -> IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED
                     \-> WAITING_ON_OTHER -> IN_PROGRESS
Any nonterminal -> CANCELLED
```

Human input is persisted before PROCESSING.

### Work package destination

`targetAreaRef` identifies the implementation area. `targetTeamId` and human `coordinatorId` are optional separate fields.

### Acceptance/eval targets

May target `REQUIREMENT`, `WORK_PACKAGE`, or `DELIVERY_SUBJECT`.

## OpenCode execution discipline

Every meaningful run:

```text
authorize user/subject
 -> persist human answer/message
 -> load authoritative Firestore state
 -> acquire thread lease
 -> ensure/recreate OpenCode session
 -> determine hydration from contextRevisionPresented
 -> build bounded ContextEnvelope
 -> persist AgentRun(RUNNING)
 -> present authoritative context + message
 -> record exact revision actually presented
 -> invoke OpenCode/tools
 -> validate structured result
 -> re-read target revisions
 -> apply idempotent domain commands transactionally
 -> append revisions/provenance/events/verifications as appropriate
 -> persist domainRevisionAtEnd separately
 -> update task/follow-up state
 -> release lease
```

Never set `contextRevisionPresented = domainRevisionAtEnd` unless that end state was actually presented back to the session.

If the session disappears, create another and FULL hydrate. OpenCode local persistence is an optimization only.

## Requirement editing discipline

Human `[Edit]` and AI edits use the same service.

A semantic change must:

1. check permissions/current revision;
2. append RequirementRevision;
3. update current Requirement and increment revision;
4. persist new RequirementSource links;
5. preserve old Verification for audit but make it ineligible for new revision;
6. reassess revision-bound acceptance/evals;
7. reassess dependent conflicts/gaps;
8. append domain event.

## Conflict discipline

Do not create a shared OpenCode session for conflict discussion.

Use:

```text
Conflict
 -> participant-specific RESOLVE_CONFLICT/REVIEW tasks
 -> independent threads capture Position/Evidence
 -> shared conflict view aggregates positions
 -> AI neutral summary/options
 -> named human decision owner records Decision/source correction
 -> resolution + targeted reassessment
```

## Firestore rules of thumb

- Delivery Subject root contains bounded summary fields only;
- growing data/history/relations are separate documents/subcollections;
- use membership-aware browser reads;
- use transactions for invariant-sensitive read-modify-write;
- deterministic IDs/idempotency keys for AI proposal application;
- track revisions to reject stale commands;
- append audit events for meaningful mutations;
- do not store large source docs/blobs in Firestore.

Required subcollections include members, sourceArtifacts, evidence, verifications, requirementRevisions and requirementSources in addition to the core requirement/task/conflict collections.

## Vertical slice order

1. Firestore + canonical schema/domain services.
2. Delivery Subject + scope/source artifacts.
3. Membership + perspective assignment/admin.
4. Task inbox + realtime collaboration.
5. assistant-ui drill workspace.
6. AgentThread/OpenCode/Vertex + session recovery.
7. Contribution/Evidence extraction.
8. RequirementRevision/RequirementSource synthesis.
9. Verification.
10. Gap/Assumption/N-party Conflict/Decision loops.
11. KnowledgeReference/ProposedDiff.
12. WorkPackage target area/dependencies.
13. generalized acceptance/evals.
14. deterministic readiness.
15. requirement history + final package/read APIs.
16. War Room + recovery/idempotency/concurrency tests.
17. Cloud Run hardening.

## War-room observability

Capture:

- run/thread/session generation IDs;
- Delivery Subject/perspective/participant;
- model/provider/skill version;
- `domainRevisionAtStart`;
- `contextRevisionPresentedBefore` and `contextRevisionPresentedThisRun`;
- hydration mode;
- input object IDs;
- tool calls;
- structured outputs;
- proposed/applied/rejected commands;
- `domainRevisionAtEnd`;
- latency/status/error category.

Failures: `MODEL | PROMPT | CONTEXT | KNOWLEDGE | WORKFLOW | DOMAIN_MODEL | UX | OWNERSHIP | CONCURRENCY`.

## Required tests before claiming the vertical slice works

- required proposed perspective blocks readiness;
- required medium-criticality perspective still needs OWNER/DELEGATE;
- old requirement verification does not satisfy new revision;
- unresolved blocking dependency blocks even when owned;
- blocking task remains a blocker until COMPLETED/CANCELLED;
- manual edit creates revision and invalidates old verification;
- 3-party conflict persists all positions;
- Reviewer cannot authoritatively verify by role alone;
- non-member cannot read subject state;
- lost OpenCode session rehydrates;
- same-run end revision is not falsely marked as presented;
- duplicate retry is idempotent;
- two separate threads can execute concurrently;
- same thread cannot execute concurrently;
- human answer survives model failure;
- package API/export traces final items back to source/provenance.

## Definition of done

A realistic signal can be processed end-to-end by multiple simultaneous users until Req Helper exports and serves a package containing outcome/scope, source artifacts, decisions, assumptions, requirements/revisions/provenance/verifications, impacts, work packages, acceptance criteria, evals, dependencies, traceability and deterministic readiness evidence. Relevant changes appear live to authorized users, and loss/staleness of OpenCode state does not lose or silently corrupt product state.
