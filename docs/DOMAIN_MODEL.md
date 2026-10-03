# Domain and Information Model

This document is the canonical semantic model for the Req Helper PoC. `src/domain/schemas.ts` is the executable representation and must stay aligned with this document.

## 1. Core boundaries

Req Helper separates five different concepts that must never be conflated:

1. **Application capability** — global system roles such as ADMIN or WAR_ROOM_OPERATOR.
2. **Delivery Subject access** — membership in one Delivery Subject.
3. **Perspective authority** — OWNER/DELEGATE/CONTRIBUTOR/REVIEWER for one perspective in one Delivery Subject.
4. **Knowledge/provenance** — statements, evidence, enterprise references and decisions supporting a requirement.
5. **Verification** — an immutable human judgment tied to a specific target revision.

A job title, global role, expertise hint or membership does not by itself make a user authoritative for a perspective.

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
```

## 3. Delivery Subject

The Delivery Subject is the aggregate root and durable product object.

Required fields include:

- immutable `initialSignal`;
- problem statement and desired outcome;
- explicit `scopeIn` and `scopeOut`;
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

`CANCELLED` is terminal. New evidence may move an active subject back to DRILLING or RESOLVING.

`initialSignal` is immutable. Scope/outcome may evolve through explicit audited revisions.

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

Membership answers **who may access this Delivery Subject and in what broad capacity**.

A user with global `DELIVERY_LEAD` capability may lead deliveries, but only a subject membership/`deliveryLeadId` establishes that they lead a particular Delivery Subject.

### Perspective assignment

```text
OWNER | DELEGATE | CONTRIBUTOR | REVIEWER
```

- OWNER/DELEGATE may perform authoritative perspective verification.
- CONTRIBUTOR may provide useful knowledge but is not authoritative.
- REVIEWER may challenge/comment/recommend but is advisory and cannot satisfy authoritative verification by role alone.

`PerspectiveAssignment.required` does not exist. Requiredness belongs to the Perspective, not to a person.

## 5. Perspective

A perspective is a required or optional lens, not an organizational unit.

Canonical lifecycle:

```text
PROPOSED -> CONFIRMED -> IN_PROGRESS -> COMPLETE
                           |
                           +-> BLOCKED -> IN_PROGRESS
```

A required perspective remaining `PROPOSED` blocks readiness. Every required perspective must have an active OWNER or DELEGATE before readiness.

## 6. Source artifacts

User-supplied links/documents are represented as `SourceArtifact` records.

The record contains metadata and a URI. Large content belongs in GCS or an external source, not directly in Firestore.

Supported storage types:

```text
LINK | GCS | EXTERNAL
```

Artifacts can become Evidence and/or RequirementSource records.

## 7. Contributions and confidence

A Contribution is an atomic human-provided statement.

It stores:

- verbatim statement;
- author and perspective;
- epistemic mode (`KNOW`, `BELIEVE`, `OBSERVED`, `UNKNOWN`, `UNSPECIFIED`);
- optional `statedConfidence` from the human;
- optional `extractionConfidence` from AI parsing;
- evidence references;
- likely authoritative owner hint.

Neither confidence measure implies authority.

Contribution authority is represented through explicit Verification records, not a mutable scalar `verificationStatus` field.

## 8. Evidence

Evidence is a typed link to information supporting a contribution, requirement, conflict position or decision.

Kinds:

```text
HUMAN_STATEMENT | KNOWLEDGE_REFERENCE | OBSERVATION | POLICY |
DECISION | SOURCE_ARTIFACT | OTHER
```

Evidence preserves a source ID and may include an excerpt/URI.

## 9. Enterprise knowledge and proposed diffs

`KnowledgeReference` stores metadata about an authoritative external artifact, not the full source object.

`ProposedDiff` describes a possible effect on that artifact:

```text
ADD | MODIFY | REMOVE | DEPRECATE | UNKNOWN_CHANGE
```

Diffs are advisory until future reconciliation. A diff may itself be human-verified or rejected.

## 10. Requirements and revisions

A Requirement contains the current representation.

`priority` and `criticality` are deliberately different:

- **priority** = delivery urgency/sequencing importance;
- **criticality** = consequence if the requirement is wrong, omitted or violated.

Every semantic edit creates an immutable `RequirementRevision`.

A revision records:

- revision number;
- statement/title at that revision;
- actor type/id;
- reason;
- source IDs;
- timestamp.

Manual UI edits follow exactly the same revision path as AI-proposed edits.

### Verification invalidation

Verification is revision-bound. If Requirement revision 2 is created, verification of revision 1 no longer satisfies readiness. Existing Verification records remain for audit and may be marked `SUPERSEDED`.

Acceptance criteria/evals bound to an older requirement revision are likewise considered stale when `targetRevision` is specified.

## 11. Provenance

Requirement provenance is represented by first-class `RequirementSource` records rather than embedded source arrays.

Each record contains:

- requirement ID;
- requirement revision;
- source kind;
- source ID;
- whether that source is authoritative for the statement;
- timestamp.

Source kinds:

```text
CONTRIBUTION | EVIDENCE | KNOWLEDGE_REFERENCE | DECISION |
ASSUMPTION | SOURCE_ARTIFACT | AI_INFERENCE
```

An AI inference may be useful provenance but does not become authoritative merely because the model is confident.

## 12. Verification

Verification is immutable human judgment.

Targets:

```text
CONTRIBUTION | REQUIREMENT | PROPOSED_DIFF
```

Verdicts:

```text
VERIFIED | REJECTED | AMENDED
```

A Verification includes verifier, optional perspective, rationale, target revision where applicable, status and timestamp.

Only an active OWNER/DELEGATE for the relevant perspective can create an authoritative verification used by readiness. Reviewer feedback remains advisory.

## 13. Gaps and assumptions

A Gap represents missing information. It includes severity, owner hint, blocking flag and lifecycle.

An Assumption includes:

- statement;
- owner;
- stated confidence;
- criticality;
- `blocking` flag;
- validation method;
- impact if wrong;
- status.

A HIGH/CRITICAL assumption must at least be owned and have a validation method. A blocking assumption must be resolved/accepted before READY.

## 14. Multi-party conflicts

A Conflict is N-party, not pairwise.

It contains `positions[]`, where each position links:

- actor/perspective where known;
- source item type/id;
- concise position summary;
- supporting evidence IDs.

A conflict also has affected owners, optional decision owner, severity, blocking state and resolution.

### Conflict-resolution mechanics

The PoC is asynchronous:

```text
Conflict detected
 -> create response/review tasks for affected participants
 -> each participant records position/evidence in their own thread
 -> AI summarizes the current positions
 -> decision owner records explicit Decision or source correction
 -> conflict is marked resolved
 -> affected requirements are reassessed
```

The `[Discuss]` UI action opens this shared conflict workspace; it does **not** put multiple humans into one OpenCode session.

## 15. Decisions

A Decision is explicit and human-owned. It stores:

- question;
- alternatives considered;
- chosen decision;
- rationale;
- owner;
- participants;
- affected requirements;
- optional superseded decision.

AI may frame options but cannot silently resolve contested choices.

## 16. Tasks

Canonical task types:

```text
DRILL | VERIFY | REVIEW | RESOLVE_CONFLICT | FILL_GAP |
DECIDE | FOLLOW_UP | FINAL_REVIEW
```

Canonical lifecycle:

```text
OPEN
  -> IN_PROGRESS
  -> ANSWERED
  -> PROCESSING
  -> COMPLETED

Any active state -> WAITING_ON_OTHER -> IN_PROGRESS
Any nonterminal state -> CANCELLED
```

Meaning:

- `ANSWERED`: human input is durably saved.
- `PROCESSING`: OpenCode/application services are interpreting/applying it.
- `COMPLETED`: required structured state mutations/follow-ups have been persisted.
- `WAITING_ON_OTHER`: this task cannot progress until another human/task resolves something.

AgentRun state is separate from Task state.

A blocking task that is not COMPLETED/CANCELLED blocks READY.

## 17. Work packages

A WorkPackage represents the downstream implementation slice.

It must identify:

- human-readable name;
- `targetAreaRef` (required);
- optional target team ID;
- optional human coordinator;
- requirements;
- dependencies;
- linked enterprise knowledge.

A person is not used as a substitute for the target implementation area/team.

## 18. Acceptance criteria and evaluations

Acceptance Criteria and Evaluations use a generalized target:

```text
REQUIREMENT | WORK_PACKAGE | DELIVERY_SUBJECT
```

This supports requirement-specific checks as well as cross-requirement integration acceptance and package-level tests.

For requirement targets, `targetRevision` may bind the item to the current semantic revision.

## 19. Dependencies

A dependency links Requirement, WorkPackage or KnowledgeReference entities.

`blocking=true` has one unambiguous meaning:

> The dependency must be resolved before READY.

Ownership is still required for unresolved blocking dependencies, but assignment alone never makes the blocking dependency acceptable.

## 20. Traceability

Minimum forward/reverse lineage:

```text
Signal / SourceArtifact
 -> Contribution / Evidence / KnowledgeReference
 -> RequirementSource
 -> RequirementRevision
 -> Verification / Decision
 -> WorkPackage
 -> AcceptanceCriterion / Evaluation
```

Every final package item must be traversable back to the reason/evidence for its existence.

## 21. Readiness semantics

Readiness is deterministic code over persisted state.

Blocking baseline:

1. problem and desired outcome defined;
2. every required perspective is confirmed;
3. every required perspective has active OWNER/DELEGATE;
4. every HIGH/CRITICAL requirement has active Verification for its current revision;
5. every HIGH/CRITICAL requirement has authoritative provenance for its current revision;
6. no blocking gap/conflict is open;
7. HIGH/CRITICAL assumptions have owner + validation method;
8. no blocking assumption remains unresolved;
9. required enterprise impact links exist;
10. every HIGH/CRITICAL requirement belongs to a targeted work package;
11. current acceptance criteria exist for every HIGH/CRITICAL requirement;
12. required evals exist;
13. no blocking dependency remains unresolved;
14. every unresolved blocking dependency has an owner;
15. no blocking human task remains active.

The readiness percentage is informational only; any failed blocking check means `NOT_READY`.

## 22. Downstream package contract

The human-readable and machine-readable package are generated from the same persisted model. P0 exposes both export and a read-only API:

```text
GET /api/delivery-subjects/{id}/package
GET /api/delivery-subjects/{id}/work-packages/{workPackageId}
```

The downstream system consumes requirements, revisions/provenance, decisions, impacts, work packages, acceptance criteria, evals, dependencies and readiness evidence. It does not consume OpenCode session state as product truth.
