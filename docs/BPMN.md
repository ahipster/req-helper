# BPMN-Style Workflow

Req Helper uses persisted Firestore state/tasks plus deterministic application services. OpenCode performs bounded reasoning/tool work; there is no suspended generic workflow engine.

## End-to-end process

```text
(Start)
   |
[Create Delivery Subject + SourceArtifacts]
   |
[Clarify problem / outcome / scope / constraints / success]
   |
[Resolve subject membership/access]
   |
[Retrieve enterprise knowledge]
   |
[OpenCode proposes impacts + perspectives]
   |
[Delivery Lead confirms required perspectives]
   |
[Assign OWNER/DELEGATE/CONTRIBUTOR/REVIEWER]
   |
<Parallel required-perspective work>
   |
   +--> [Create targeted Task: OPEN]
   |       |
   |     [Participant opens -> IN_PROGRESS]
   |       |
   |     [Human answer persisted -> ANSWERED]
   |       |
   |     [OpenCode begins -> PROCESSING]
   |       |
   |     [Extract Contribution/Evidence]
   |       |
   |     [Propose Requirement/Gap/Assumption/Conflict commands]
   |       |
   |     [Validate authz + schema + revision + idempotency]
   |       |
   |     [Firestore transaction + RequirementRevision/Source/Event]
   |       |
   |     <Needs another human?>
   |        | YES -> [WAITING_ON_OTHER + related task]
   |        | NO  -> [COMPLETED]
   |       |
   |     <Enough perspective coverage?> -- NO --> next Task
   |
<Join when required perspectives converge enough>
   |
[Cross-perspective synthesis]
   |
[Detect gaps / assumptions / N-party conflicts]
   |
<Blocking issues?>
   | YES
   v
[Create VERIFY / FILL_GAP / RESOLVE_CONFLICT / DECIDE tasks]
   |
[Human verification / positions / decision]
   |
[Reassess affected requirements]
   +---------------------------> [Cross-perspective synthesis]
   |
   NO / resolved
   v
[Identify implementation areas]
   |
[Create targeted WorkPackages + Dependencies]
   |
[Generate Requirement/WorkPackage/DeliverySubject acceptance + evals]
   |
[Run deterministic readiness]
   |
<READY?> -- NO --> [Create targeted blocker tasks] --> relevant stage
   |
  YES
   v
[FINAL_REVIEW task]
   |
[Publish JSON + Markdown + read-only package API]
   |
(Ready for downstream SDLC)
```

## Human task subprocess

Canonical Task lifecycle:

```text
OPEN -> IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED
                     \-> WAITING_ON_OTHER -> IN_PROGRESS
Any nonterminal -> CANCELLED
```

Important ordering:

```text
Human submits answer
 -> persist message/answer
 -> task ANSWERED
 -> only then invoke OpenCode
```

If OpenCode/model fails, the human answer remains durable and the task is retriable.

Special responses:

```text
I don't know
 -> persist Contribution(epistemicMode=UNKNOWN)
 -> identify likely owner/expert
 -> create/reroute follow-up

Ask someone
 -> persist suggested participant
 -> Delivery Lead/authorized flow confirms access/assignment if needed
 -> create related task
```

## Verification subprocess

```text
[Requirement/Contribution/ProposedDiff needs authority]
   |
[Identify active OWNER/DELEGATE for relevant perspective]
   |
[VERIFY task]
   |
[Render exact target revision + provenance/evidence]
   |
<Human verdict>
   +-- VERIFIED -> append active Verification
   +-- REJECTED -> append Verification + reopen synthesis/gap
   +-- AMENDED  -> append Verification + normal revision/edit service
```

A Requirement revision change never inherits old-revision readiness verification automatically.

Reviewer comments/challenges are advisory and follow a REVIEW task, not authoritative verification.

## Requirement edit subprocess

Human Edit and AI proposal use the same path:

```text
[Edit proposed]
 -> authorize
 -> compare expected/current requirement revision
 -> append RequirementRevision
 -> update current Requirement revision
 -> persist RequirementSource links
 -> old revision Verification remains audit-only
 -> reassess revision-bound acceptance/evals
 -> reassess dependent conflicts/gaps
 -> append DomainEvent
```

## N-party conflict-resolution subprocess

```text
[Conflict detected]
   |
[Persist Conflict with 2+ initial positions]
   |
[Identify affected participants + named decision owner]
   |
[Create participant-specific RESOLVE_CONFLICT/REVIEW tasks]
   |
+---------- independent threads in parallel ----------+
| participant records position/evidence               |
+------------------------------------------------------+
   |
[Shared Conflict Workspace aggregates structured positions]
   |
[OpenCode produces neutral summary/options]
   |
<Decision/source correction needed?>
   +-- Decision -> [Named human owner records Decision]
   +-- Correction -> [Normal requirement/source correction path]
   |
[Mark conflict resolved]
   |
[Re-evaluate affected requirements / tasks / readiness]
```

The shared Conflict Workspace is a shared **view**, not a shared OpenCode conversation/session.

## Knowledge-impact subprocess

```text
[KnowledgeReference linked]
 -> compare current source understanding vs proposed change
 -> ProposedDiff ADD/MODIFY/REMOVE/DEPRECATE/UNKNOWN_CHANGE
 -> human confirm/reject/correct where needed
 -> persist Verification/updated ProposedDiff
```

No authoritative source-system write-back occurs in the PoC.

## Work-package subprocess

```text
[Converged requirements]
 -> identify target implementation areas
 -> create WorkPackage(targetAreaRef, targetTeamId?, coordinatorId?)
 -> attach requirements
 -> detect cross-package dependencies
 -> package-level acceptance/evals where needed
```

A human coordinator is never substituted for target implementation-area identity.

## Readiness subprocess

```text
[Load canonical persisted snapshot]
 -> deterministic checks
 -> append ReadinessEvaluated event
 -> any blocking failure: NOT_READY + exact object IDs/actions
 -> all blocking pass: READY
```

Notable blockers include required-but-PROPOSED perspectives, missing OWNER/DELEGATE, stale requirement verification, open blocking assumptions/dependencies/tasks and missing current acceptance/evals.

## OpenCode recovery/context subprocess

```text
[Task processing begins]
 -> acquire AgentThread lease
 -> resolve stored OpenCode session
 -> missing? create session + increment generation + FULL hydration
 -> compare DeliverySubject.revision vs contextRevisionPresented
 -> changed? FULL bounded authoritative hydration in P0
 -> run OpenCode
 -> record revision actually presented
 -> validate/apply commands
 -> persist domainRevisionAtEnd separately
 -> release lease
```

Never write same-run `domainRevisionAtEnd` as `contextRevisionPresented` unless that state was actually presented back to OpenCode.

## Delivery Subject state transitions

```text
DRAFT -> DISCOVERING -> DRILLING -> RESOLVING -> SPLITTING -> READY -> HANDED_OFF
                         ^             |
                         +-------------+
```

New evidence may return an active subject to DRILLING/RESOLVING. `CANCELLED` is terminal.
