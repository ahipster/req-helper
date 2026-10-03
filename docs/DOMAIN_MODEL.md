# Domain and Information Model

This document is the canonical semantic model for the Req Helper PoC. `src/domain/schemas.ts` is its executable representation. They must stay aligned.

## 1. Core boundaries

Req Helper separates these concerns:

1. **Application capability** — global system roles.
2. **Delivery Subject access** — membership in one subject.
3. **Perspective authority** — OWNER/DELEGATE/CONTRIBUTOR/REVIEWER for one perspective.
4. **Knowledge/provenance** — contributions, evidence, enterprise references, source artifacts, decisions and explicit AI inference.
5. **Verification** — append-only human judgment tied to the exact target/version where applicable.
6. **Conversation/harness state** — interaction/execution state that never substitutes for domain truth.

A job title, global role, expertise hint, membership or model confidence does not by itself confer perspective authority.

## 2. Conceptual model

```text
UserProfile
   |
   +-- systemRoles
   |
DeliverySubjectMembership -------- DeliverySubject
                                      |
       +------------------------------+-------------------------------+
       |              |               |              |                |
       v              v               v              v                v
  Perspective      SourceArtifact   Requirement    Conflict        WorkPackage
       |                              |              |                |
       v                              v              v                v
  Assignment                  RequirementSource  Position[]      Acceptance/Eval
       |                              |              |
       v                              v              v
     Task -> Contribution -> Evidence/Knowledge -> Decision
                  |                  |
                  +------> Verification

DeliverySubject also aggregates Gap, Assumption, Dependency, ProposedDiff,
RequirementRevision, Message, DomainEvent, AgentThread and AgentRun.

UserProfile owns a non-authoritative TaskInboxItem projection for My Work.
```

## 3. Delivery Subject

The Delivery Subject is the aggregate root and durable product object.

It contains:

- immutable `initialSignal`;
- problem statement and desired outcome;
- `scopeIn` / `scopeOut`;
- constraints;
- success measures;
- lifecycle status;
- sponsor and subject-specific delivery lead references;
- monotonically increasing `revision` for material domain mutations.

Lifecycle:

```text
DRAFT -> DISCOVERING -> DRILLING -> RESOLVING -> SPLITTING -> READY -> HANDED_OFF
                         ^              |
                         +--------------+
```

`CANCELLED` is terminal. New evidence may reopen an active subject back to DRILLING/RESOLVING. Scope/outcome changes are explicit audited mutations.

## 4. Access and role model

### Global system roles

```text
ADMIN | PARTICIPANT | DELIVERY_LEAD | WAR_ROOM_OPERATOR
```

These grant application capabilities, not authority over a particular Delivery Subject.

### Delivery Subject membership

```text
SPONSOR | DELIVERY_LEAD | PARTICIPANT | OBSERVER
```

Membership determines access/broad subject capacity. Global `DELIVERY_LEAD` means a user may lead subjects; subject membership establishes which subject they actually lead.

### Perspective assignment

```text
OWNER | DELEGATE | CONTRIBUTOR | REVIEWER
```

- OWNER/DELEGATE: may perform authoritative perspective verification.
- CONTRIBUTOR: useful knowledge, non-authoritative by default.
- REVIEWER: advisory challenge/comment/recommendation only.

`PerspectiveAssignment.required` does not exist. Requiredness belongs to Perspective.

## 5. Perspective

A Perspective is a required or optional lens, not an organizational unit.

```text
PROPOSED -> CONFIRMED -> IN_PROGRESS -> COMPLETE
                           |
                           +-> BLOCKED -> IN_PROGRESS
```

A required Perspective remaining PROPOSED blocks readiness. Every required Perspective needs an active OWNER or DELEGATE before READY.

## 6. SourceArtifact

User-supplied links/documents become metadata records. Large bytes live in GCS/approved external storage.

```text
storageType = LINK | GCS | EXTERNAL
```

Source artifacts can be referenced by Evidence and RequirementSource.

## 7. Contribution

A Contribution is an atomic human-provided statement and stores:

- author/task/perspective;
- verbatim statement;
- epistemic mode: `KNOW | BELIEVE | OBSERVED | UNKNOWN | UNSPECIFIED`;
- optional human `statedConfidence`;
- optional AI `extractionConfidence`;
- evidence IDs;
- optional likely-authoritative-owner hint.

Confidence never implies authority. Contribution verification is represented by Verification records, not a scalar status on Contribution.

## 8. Evidence

Evidence is a typed link to source material supporting a contribution, requirement, conflict position or decision.

```text
HUMAN_STATEMENT | KNOWLEDGE_REFERENCE | OBSERVATION | POLICY |
DECISION | SOURCE_ARTIFACT | OTHER
```

## 9. Enterprise knowledge and ProposedDiff

KnowledgeReference stores metadata about an external enterprise artifact. ProposedDiff records advisory `ADD | MODIFY | REMOVE | DEPRECATE | UNKNOWN_CHANGE` effects and has its own revision.

No authoritative external write-back occurs in P0.

## 10. Requirement and RequirementRevision

Requirement is the current representation.

- `priority` = delivery urgency/sequencing.
- `criticality` = consequence if wrong/omitted/violated.
- Requirement status tracks synthesis/conflict lifecycle, not human verification:

```text
DRAFT | NEEDS_INPUT | PROPOSED | CONFLICTED | SUPERSEDED
```

Every semantic human or AI edit goes through one requirement-revision service and increments `Requirement.revision`. RequirementRevision is the immutable historical snapshot of that semantic revision plus actor/reason metadata.

Canonical provenance is **not** duplicated into RequirementRevision; it is represented by RequirementSource records tied to the requirement revision.

Manual `[Edit]` and AI synthesis use exactly the same revision/provenance/invalidation mechanics.

## 11. RequirementSource

Each provenance relation contains:

- requirement ID;
- requirement revision;
- source kind;
- source ID;
- `authoritative` flag validated by application invariants;
- timestamp.

```text
CONTRIBUTION | EVIDENCE | KNOWLEDGE_REFERENCE | DECISION |
ASSUMPTION | SOURCE_ARTIFACT | AI_INFERENCE
```

AI inference is provenance, never automatically authority.

## 12. Verification

Verification is append-only human judgment. Existing verification may be marked SUPERSEDED, but the original verdict/rationale is not rewritten.

Targets:

```text
CONTRIBUTION  -> atomic; no targetRevision
REQUIREMENT   -> targetRevision REQUIRED
PROPOSED_DIFF -> targetRevision REQUIRED
```

Verdicts:

```text
VERIFIED | REJECTED | AMENDED
```

For Requirement readiness, only an ACTIVE `VERIFIED` record for the **current requirement revision**, made by an active OWNER/DELEGATE for the stated perspective, counts.

Changing a Requirement revision invalidates prior-revision verification for readiness while preserving it for audit.

## 13. Gap and Assumption

Gap represents missing information with severity, ownership hint, blocking flag and lifecycle.

Assumption stores statement, owner, stated confidence, criticality, blocking flag, validation method, impact if wrong and status.

HIGH/CRITICAL assumptions require owner + validation method. A blocking assumption must not remain OPEN/INVALIDATED at READY.

## 14. N-party Conflict

Conflict contains at least two structured `positions[]`. Each position may link actor, perspective, source item and evidence.

Conflict also contains severity, affected owners, optional decision owner, blocking state, resolution and optional Decision reference.

Resolution is asynchronous:

```text
Conflict detected
 -> participant-specific tasks
 -> independent AgentThreads capture positions/evidence
 -> shared Conflict Workspace aggregates current positions
 -> AI may neutrally summarize/frame options
 -> named human decision owner records Decision or source correction
 -> conflict resolves
 -> affected requirements are reassessed
```

A shared Conflict Workspace is not a shared OpenCode session.

## 15. Decision

Decision is explicit and human-owned: question, alternatives, chosen decision, rationale, owner, participants, affected requirements and optional superseded decision.

AI may frame options but cannot silently resolve contested choices.

## 16. Task

Canonical types:

```text
DRILL | VERIFY | REVIEW | RESOLVE_CONFLICT | FILL_GAP |
DECIDE | FOLLOW_UP | FINAL_REVIEW
```

Canonical lifecycle:

```text
OPEN -> IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED
                     \-> WAITING_ON_OTHER -> IN_PROGRESS
Any nonterminal -> CANCELLED
```

- ANSWERED: human input is durably saved.
- PROCESSING: application/OpenCode is interpreting/applying it.
- COMPLETED: resulting structured mutations/follow-ups are durable.
- WAITING_ON_OTHER: blocked on another human/task.

AgentRun status is separate. Any blocking Task not COMPLETED/CANCELLED blocks READY.

### TaskInboxItem

`TaskInboxItem` is a non-authoritative per-user projection used only by My Work. It points to the authoritative Task and contains enough display metadata for a realtime inbox. Opening an inbox item reloads/re-authorizes the underlying subject/task.

## 17. WorkPackage

WorkPackage is a downstream implementation slice with:

- human-readable name;
- required `targetAreaRef`;
- optional target team;
- optional human coordinator;
- requirements;
- dependencies;
- linked enterprise knowledge.

A human owner/coordinator is never a substitute for target implementation-area identity.

## 18. AcceptanceCriterion and Evaluation

Both target exactly one of:

```text
REQUIREMENT | WORK_PACKAGE | DELIVERY_SUBJECT
```

For `REQUIREMENT`, `targetRevision` is **mandatory**. A requirement-level criterion/eval for revision N does not satisfy readiness for revision N+1.

WorkPackage and DeliverySubject targets are not revision-bound in P0.

This supports both atomic requirement checks and cross-requirement/package acceptance.

## 19. Dependency

Dependency links Requirement, WorkPackage or KnowledgeReference.

`blocking=true` means unresolved dependency prevents READY. Ownership is required for accountability but never clears the blocker.

## 20. Traceability

Minimum forward/reverse lineage:

```text
Signal / SourceArtifact
 -> Contribution / Evidence / KnowledgeReference
 -> RequirementSource
 -> RequirementRevision / current Requirement
 -> Verification / Decision
 -> WorkPackage
 -> AcceptanceCriterion / Evaluation
```

Every final package item must be traversable back to its reason/evidence.

## 21. Readiness

Readiness is deterministic code over persisted state. Blocking baseline:

1. problem + desired outcome defined;
2. every required perspective confirmed;
3. every required perspective has active OWNER/DELEGATE;
4. every HIGH/CRITICAL requirement has authoritative ACTIVE verification for its current revision;
5. every HIGH/CRITICAL requirement has authoritative provenance for its current revision;
6. no blocking gap/conflict open;
7. HIGH/CRITICAL assumptions have owner + validation method;
8. no blocking assumption unresolved;
9. required enterprise impacts linked;
10. every HIGH/CRITICAL requirement belongs to a targeted work package;
11. current-revision acceptance exists for every HIGH/CRITICAL requirement;
12. every requirement flagged for eval has a current-revision eval;
13. no blocking dependency unresolved;
14. every unresolved blocking dependency has an owner;
15. no blocking Task remains active.

Score is informational only. Any failed blocking check means `NOT_READY`.

## 22. Downstream package contract

Human-readable and machine-readable handoff are generated from the same persisted model. P0 exposes:

```text
GET /api/delivery-subjects/{id}/package
GET /api/delivery-subjects/{id}/work-packages/{workPackageId}
```

The downstream SDLC consumes scope/outcomes, requirements/revisions/provenance, verification, decisions, impacts, work packages, acceptance/evals, dependencies and readiness evidence. It never treats OpenCode session state as product truth.
