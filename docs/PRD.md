# Req Helper PRD

## 1. Purpose

Req Helper is a one-week PoC for AI-first requirements discovery and convergence in an enterprise/bank context. It turns an initial signal/problem/idea into a persistent Delivery Subject and orchestrates people, enterprise knowledge and AI loops until it can produce a traceable implementation-ready requirement package.

The product stops before code generation/deployment. A downstream SDLC consumes the package.

## 2. Product thesis

The durable object is a **Delivery Subject**, not a transcript or agent session.

```text
Signal / source material
 -> Delivery Subject + scope/outcome
 -> enterprise knowledge / impact hypotheses
 -> required perspectives + memberships/assignments
 -> perspective-specific human drills
 -> contributions + evidence + verification
 -> structured requirements + revisions/provenance
 -> gaps / assumptions / N-party conflicts / decisions
 -> affected-area work packages
 -> acceptance criteria + evals
 -> deterministic readiness
 -> human + machine-readable package
```

## 3. Non-goals

Not in the PoC:

- autonomous implementation/deployment;
- generic enterprise knowledge graph;
- authoritative write-back to source repositories;
- full project/portfolio management;
- enterprise-complete IAM/SCIM/group management;
- generic workflow/agent platform;
- shared multi-human OpenCode sessions.

## 4. Actors

- **Sponsor** — introduces the signal and follows outcome/progress.
- **Delivery Lead** — owns convergence for a specific Delivery Subject.
- **Perspective Owner/Delegate** — authoritative human for a specific perspective in a specific Delivery Subject.
- **Contributor** — supplies useful knowledge without automatic authority.
- **Reviewer** — advisory review/challenge role; does not satisfy authoritative verification by itself.
- **Knowledge Steward** — validates enterprise references/impacts where appropriate.
- **Downstream SDLC Consumer** — consumes work packages/requirements programmatically or via export.
- **War-room Operator** — diagnoses model/prompt/context/workflow failures.
- **Req Helper Admin** — configures PoC users/global roles/perspective templates.

## 5. Core invariants

1. Firestore domain state is authoritative; OpenCode state is disposable.
2. Contribution is not authority.
3. Global role/job title/expertise hint is not Delivery Subject authority.
4. Delivery Subject membership controls access; PerspectiveAssignment controls authority.
5. Every material requirement has explicit revision-bound provenance.
6. Verification is append-only human judgment and tied to a specific target revision where applicable.
7. Semantic Requirement edits create RequirementRevision records and invalidate prior-revision verification/acceptance/evals for readiness.
8. Contradictions are first-class N-party Conflict records.
9. Decisions are explicit human-owned records.
10. Readiness is deterministic code.
11. AI text never mutates authoritative state directly; only validated commands do.
12. My Work is a non-authoritative per-user Task projection; authoritative Task state remains under the Delivery Subject.

## 6. Functional requirements

### FR-1 Create Delivery Subject

Create from ordinary language plus optional source links/documents. Preserve `initialSignal` verbatim and immutable.

### FR-2 Clarify outcome and scope

AI may propose, but a human can correct:

- problem statement;
- desired outcome;
- `scopeIn`;
- `scopeOut`;
- constraints;
- success measures;
- unknowns/gaps.

### FR-3 Attach source material

Links/uploads are represented as `SourceArtifact` metadata. Large bytes are stored in GCS/external systems, not Firestore.

### FR-4 Discover enterprise knowledge

Search configured KnowledgeProviders for processes, concepts, APIs, applications, solutions, policies, controls, decisions and services. Persist references with source/version metadata.

### FR-5 Discover perspectives

AI proposes affected perspectives with rationale/criticality. Delivery Lead confirms/adds/removes. A required perspective remaining PROPOSED blocks readiness.

### FR-6 Manage access and authority

- Delivery Subject membership: SPONSOR / DELIVERY_LEAD / PARTICIPANT / OBSERVER.
- Perspective assignment: OWNER / DELEGATE / CONTRIBUTOR / REVIEWER.
- Expertise hints may suggest candidates but never establish authority.

### FR-7 Run smart drills

Question priority considers ownership relevance, requirement criticality, uncertainty, contradiction severity, dependency importance, missing acceptance/evals, uncovered perspective and confidence deficit.

The system may ask a participant about knowledge outside their formal ownership; resulting knowledge remains non-authoritative until verified by appropriate OWNER/DELEGATE.

### FR-8 Persist task lifecycle

Canonical states:

```text
OPEN -> IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED
                     \-> WAITING_ON_OTHER -> IN_PROGRESS
Any nonterminal -> CANCELLED
```

Human response is durable before AI processing begins.

### FR-9 Maintain My Work read projection

Authoritative tasks live under `deliverySubjects/{subjectId}/tasks/{taskId}`. For realtime cross-subject My Work, the backend maintains `users/{userId}/taskInbox/{itemId}`.

The projection:

- is never authoritative;
- updates when task assignment/status changes;
- is removed from the previous assignee on reassignment;
- is removed when the user's subject membership is removed/deactivated;
- is readable only by that user (plus ADMIN under PoC policy);
- reloads/re-authorizes the authoritative Task/subject when opened.

### FR-10 Capture contribution semantics

Store verbatim statement, author, perspective, epistemic mode, human-stated confidence, optional AI extraction confidence, evidence and likely authoritative owner.

### FR-11 Evidence and provenance

Persist Evidence and RequirementSource as first-class records. RequirementSource is requirement-revision bound and may link Contribution, Evidence, KnowledgeReference, Decision, Assumption, SourceArtifact or AI inference.

### FR-12 Verification

OWNER/DELEGATE may verify/reject/amend a Contribution, current Requirement revision or ProposedDiff. Requirement and ProposedDiff Verification require the exact target revision. Reviewer feedback is advisory only.

### FR-13 Requirement lifecycle and editing

AI or human may propose/edit requirements through the same application command path.

Every semantic edit:

1. validates permissions/schema/current revision;
2. creates a RequirementRevision;
3. records actor/rationale;
4. writes revision-bound RequirementSource provenance;
5. increments current requirement revision;
6. makes prior-revision Verification ineligible for the new revision;
7. makes prior requirement-targeted acceptance/evals ineligible;
8. triggers targeted conflict/gap reassessment.

`priority` = urgency/sequencing. `criticality` = consequence if wrong/omitted.

### FR-14 Detect gaps

Persist gaps with severity, relevant perspective, owner hint, blocking state and lifecycle.

### FR-15 Manage assumptions

Assumptions include owner, confidence, criticality, blocking flag, validation method and impact if wrong. HIGH/CRITICAL assumptions must be explicitly managed; blocking assumptions must be resolved/accepted before READY.

### FR-16 Detect and resolve multi-party conflicts

A Conflict contains 2+ positions. Each affected participant responds in their own thread/task. The shared conflict workspace aggregates positions/evidence. AI may summarize/options-frame; a named human decision owner records the Decision or source correction.

No shared OpenCode session is required.

### FR-17 Decisions

Persist question, alternatives, decision, rationale, owner, participants, affected requirements and superseded decision where relevant.

### FR-18 Enterprise impacts

Persist ProposedDiffs to KnowledgeReferences. Users can confirm/reject/correct. No source-system write-back in PoC.

### FR-19 Split work packages

Group requirements by downstream implementation area. A populated WorkPackage must have `targetAreaRef`; optional `targetTeamId` and human coordinator are separate fields.

### FR-20 Acceptance criteria

AcceptanceCriterion can target REQUIREMENT, WORK_PACKAGE or DELIVERY_SUBJECT.

For a REQUIREMENT target, `targetRevision` is mandatory. A criterion for revision N does not satisfy readiness for revision N+1.

### FR-21 Evaluation definitions

Evaluation can target REQUIREMENT, WORK_PACKAGE or DELIVERY_SUBJECT and defines expected behavior, threshold where relevant and failure behavior.

For a REQUIREMENT target, `targetRevision` is mandatory. An eval for revision N does not satisfy revision N+1.

### FR-22 Dependencies

Dependencies may link requirements/work packages/knowledge references. `blocking=true` unambiguously means the dependency must be resolved before READY; merely assigning an owner does not clear it.

### FR-23 Deterministic readiness

See `docs/DOMAIN_MODEL.md` and `src/domain/readiness.ts`. The percentage is informational only.

### FR-24 Realtime collaboration

Multiple logged-in members can work concurrently. Firestore listeners update relevant structured state without resetting the participant's current chat input.

### FR-25 OpenCode state synchronization

Every meaningful run:

- loads current authoritative Firestore state;
- resolves/recreates the OpenCode session;
- compares current domain revision with AgentThread `contextRevisionPresented`;
- injects bounded authoritative context when needed;
- persists user-visible messages independently from OpenCode disk;
- validates outputs and revision/idempotency constraints;
- commits accepted commands transactionally;
- records `domainRevisionAtEnd` separately from `contextRevisionPresented`.

A run must **not** claim the session has seen mutations that occurred at the end of that same run unless those mutations are subsequently presented in context.

### FR-26 Requirement history UX

Normal participants can open a requirement history drawer showing revisions, actor/reason, provenance changes and current/superseded verifications without entering War Room tooling.

### FR-27 Admin/configuration UI

ADMIN manages users/global roles/role templates/perspective templates. Delivery Lead/Admin manages memberships and perspective assignments for subjects they may administer.

### FR-28 War-room observability

Show AgentRun status, hydration mode, session generation, context/domain revisions, tool calls, schema failures, applied/rejected commands and classified failure type.

War-room operators may rerun/diagnose. Assignment override is only available when the operator also has ADMIN or subject Delivery Lead permission.

### FR-29 Package export and read API

Generate Markdown and JSON from persisted state and expose P0 read APIs:

```text
GET /api/delivery-subjects/{id}/package
GET /api/delivery-subjects/{id}/work-packages/{workPackageId}
```

## 7. UI requirements

### My Work

Shows the current user's taskInbox projection: blocking/open tasks, reviews, processing/waiting state and relevant subject labels. Opening an item loads the authoritative Task and subject. No fake role switcher in production UI; PoC persona switching is clearly marked developer/test-only if present.

### New Signal

Natural-language signal, optional expected outcome, links/uploads. Scope is progressively structured after creation.

### Delivery Overview

Shows outcome, scope, perspectives/owners, requirements, blockers, recent changes and deterministic readiness.

### Drill Workspace

Three panes: personal focus, conversation, structured current context. Actions: I DON'T KNOW, ASK SOMEONE, SHOW BIGGER PICTURE.

### Requirements

Filterable requirements plus lifecycle/provenance/verification/acceptance. Detail includes History drawer.

### Verification

Shows target revision, source/evidence and verifier authority. VERIFY/REJECT/AMEND create Verification records; amendment uses normal requirement-revision flow.

### Conflict Workspace

Shared structured conflict page showing all positions/evidence, participant tasks and decision owner. `[Discuss]` means asynchronous shared conflict workspace, not a shared agent session.

### Enterprise Impact

KnowledgeReference + ProposedDiff with source/version/rationale and confirm/reject/correct actions.

### Work Packages

Shows target implementation area/team, requirements, dependencies, acceptance/evals and readiness.

### Readiness

Shows every deterministic check and exact blockers/next actions.

### Final Package

Shows package sections plus JSON/Markdown export and downstream read-API identifiers.

### War Room

Operational/debug view only. Permission-sensitive controls.

### Admin

Users/global roles, role templates, perspective templates, Delivery Subject membership and assignments.

## 8. User stories

### Sponsor

- Start a Delivery Subject using ordinary language.
- Correct problem/outcome/scope.
- See progress/readiness without reading every technical detail.

### Delivery Lead

- Confirm required perspectives.
- Add/remove subject members.
- Assign OWNER/DELEGATE/CONTRIBUTOR/REVIEWER.
- See missing authority/blockers.
- Reassign work and reopen discovery when new evidence appears.
- Record/route decisions.

### Perspective Owner/Delegate

- See questions relevant to my perspective.
- Understand why I am asked.
- Contribute outside my ownership without accidentally becoming authoritative.
- Verify/reject/amend revision-specific contributions/requirements.
- Inspect requirement history and bigger-picture impact.

### Contributor

- State what I know/believe/observed/don't know.
- Attach evidence/source material.
- Suggest another expert.

### Reviewer

- Comment/challenge/recommend changes.
- See that my review is advisory unless separately assigned OWNER/DELEGATE.

### Knowledge Steward

- Validate source references.
- Reject incorrect AI-discovered relationships.
- Confirm/reject proposed enterprise diffs.

### Conflict participant

- Submit my position/evidence asynchronously.
- See summarized positions from others.
- Know who has decision authority.

### Downstream consumer

- Retrieve package/work package via API.
- Inspect requirement revision/provenance/verification.
- Retrieve acceptance/evals/dependencies programmatically.

### War-room operator

- Distinguish MODEL/PROMPT/CONTEXT/KNOWLEDGE/WORKFLOW/DOMAIN_MODEL/UX/OWNERSHIP/CONCURRENCY failures.
- Rerun analysis without duplicating mutations.
- Inspect context revision/session recovery behavior.

### Admin

- Manage PoC users and global roles.
- Configure templates.
- Preserve historical references when users/templates are deactivated.

## 9. Readiness baseline

READY requires all blocking checks to pass, including:

- outcome defined;
- all required perspectives confirmed;
- all required perspectives have active OWNER/DELEGATE;
- HIGH/CRITICAL requirements have current-revision human verification and authoritative provenance;
- no blocking gap/conflict/assumption/dependency remains unresolved;
- major assumptions managed;
- enterprise impact links satisfied where required;
- critical requirements allocated to targeted work packages;
- current-revision acceptance criteria/evals present where required;
- no blocking human task remains active.

## 10. Final handoff contract

```json
{
  "deliverySubject": {},
  "scope": {},
  "sourceArtifacts": [],
  "decisions": [],
  "assumptions": [],
  "requirements": [],
  "requirementSources": [],
  "verifications": [],
  "enterpriseImpacts": [],
  "workPackages": [],
  "acceptanceCriteria": [],
  "evaluations": [],
  "dependencies": [],
  "traceability": [],
  "readiness": {}
}
```

Req Helper answers **what must change, why, according to whom, based on what evidence, across which implementation areas, and how we will know it is correct**. The downstream AI-first SDLC answers **how to implement, test and deploy it**.
