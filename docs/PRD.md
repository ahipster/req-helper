# Req Helper PRD

## 1. Purpose

Req Helper is a one-week PoC for AI-first requirements discovery and convergence in an enterprise/bank context. It turns an initial signal/problem/idea into a persistent Delivery Subject and orchestrates people, current enterprise requirements/knowledge and AI loops until it can produce a traceable implementation-ready **change set**.

The product stops before code generation/deployment. A downstream SDLC consumes the change set.

## 2. Product thesis

The durable object is a **Delivery Subject**, not a transcript or agent session. A Delivery Subject is a proposed change to current enterprise truth, not a parallel replacement truth.

```text
Signal / source material
 -> Delivery Subject + pinned Requirement Profile
 -> discover CURRENT requirements + knowledge
 -> classify proposed requirement/knowledge changes
 -> required perspectives + memberships/assignments
 -> perspective-specific human drills
 -> contributions + evidence + verification
 -> proposed requirements + revisions/provenance
 -> gaps / assumptions / N-party conflicts / decisions
 -> affected-area work packages
 -> acceptance criteria + evals
 -> deterministic readiness
 -> machine/human-readable CHANGE SET
 -> downstream SDLC
```

Current catalogue/source records are never silently overwritten by an in-flight Delivery Subject.

## 3. Non-goals

Not in the PoC:

- autonomous implementation/deployment;
- authoritative write-back to external knowledge/source repositories;
- automatic promotion of proposed requirements into current enterprise baseline;
- generic enterprise knowledge graph;
- full project/portfolio management;
- enterprise-complete IAM/SCIM/group management;
- generic workflow/agent platform;
- shared multi-human OpenCode sessions.

## 4. Actors

- **Sponsor** — introduces the signal and follows outcome/progress.
- **Delivery Lead** — owns convergence for a specific Delivery Subject.
- **Perspective Owner/Delegate** — authoritative human for one perspective.
- **Contributor** — supplies useful knowledge without automatic authority.
- **Reviewer** — advisory review/challenge role.
- **Knowledge Steward** — validates enterprise references/knowledge diffs.
- **Requirement Steward/Admin** — maintains Requirement Profiles and optional catalogue sync/config.
- **Downstream SDLC Consumer** — consumes the change set.
- **War-room Operator** — diagnoses model/prompt/context/workflow failures.
- **Req Helper Admin** — configures PoC users/global roles/templates.

## 5. Core invariants

1. Firestore domain state is authoritative; OpenCode/chat/UI state is not.
2. CURRENT baseline and PROPOSED Delivery Subject state are separate.
3. A proposed change never becomes current merely because Req Helper reaches READY/HANDED_OFF.
4. Every MODIFY/SUPERSEDE/RETIRE/NO_CHANGE proposal pins the exact baseline requirement version analyzed.
5. Knowledge diffs pin source version/fingerprint where available.
6. Before CREATE, the system searches current requirements and active proposals for duplicate/overlap/contradiction candidates.
7. Active proposals in other Delivery Subjects are considered during collision detection.
8. Requirement type and enterprise capability links are explicit and orthogonal.
9. Contribution is not authority.
10. Membership controls Delivery Subject access; PerspectiveAssignment controls authority.
11. Every material proposed requirement has revision-bound provenance.
12. Verification is append-only human judgment tied to exact target revision where applicable.
13. Requirement edits create immutable RequirementRevision records; prior-revision verification/acceptance/evals do not satisfy the new revision.
14. Contradictions are first-class N-party Conflict records.
15. Decisions are explicit human-owned records.
16. Readiness is deterministic code plus versioned Requirement Profile compliance.
17. AI text never mutates authoritative state directly; validated commands do.
18. Requirement Profile versions are immutable once published and Delivery Subjects pin one exact version.
19. Profile upgrades are explicit and show newly introduced/removed gaps before commit.
20. My Work is a non-authoritative per-user Task projection.

## 6. Functional requirements

### FR-1 Create Delivery Subject

Create from ordinary language plus optional links/documents. Preserve `initialSignal` verbatim and immutable. Classify a `subjectKind` such as API_CHANGE, DATA_MODEL_CHANGE, REGULATORY_CHANGE, MIGRATION, NEW_SERVICE or GENERAL.

### FR-2 Select and pin Requirement Profile

Suggest a Requirement Profile from subject kind/context. Human confirms. Persist exact `requirementProfileId + requirementProfileVersion`.

A Delivery Subject cannot reach READY without a pinned published profile version.

### FR-3 Clarify outcome and scope

AI may propose, human can correct: problem, outcome, scope in/out, constraints, success measures, unknowns/gaps.

### FR-4 Attach source material

Links/uploads become SourceArtifact metadata. Large bytes live in GCS/external systems.

### FR-5 Discover CURRENT enterprise knowledge

Search KnowledgeProviders for processes, concepts, APIs, applications, solutions, policies, controls, decisions, capabilities and services. Preserve stable identity, source version/fingerprint and retrieval metadata where available.

### FR-6 Discover CURRENT requirements

Search the current Requirement Catalogue or configured authoritative requirement source using:

- semantic similarity;
- requirement type;
- capability links;
- linked API/system/process/concept;
- shared authoritative knowledge/provenance.

Catalogue requirements have stable IDs and immutable published versions.

### FR-7 Detect active-proposal collisions

Search active Delivery Subjects for proposals affecting the same/related baseline requirements and capabilities. Surface parallel proposals before the subject creates a contradictory second future truth.

### FR-8 Classify requirement changes

Every material subject requirement participates in one explicit `RequirementChangeProposal`:

```text
CREATE | MODIFY | SUPERSEDE | RETIRE | NO_CHANGE
```

MODIFY/SUPERSEDE/RETIRE/NO_CHANGE pin `baselineRequirementId + baselineVersion`.

### FR-9 Review requirement matches

Persist auditable RequirementMatch records:

```text
candidateKind = BASELINE_REQUIREMENT | ACTIVE_PROPOSAL
relationship = DUPLICATE | OVERLAPS | CONTRADICTS | RELATED
status = UNREVIEWED | CONFIRMED | DISMISSED
```

A blocking duplicate/contradiction candidate must be reviewed before READY.

### FR-10 Detect stale baselines

If a current catalogue requirement advances after a proposal pinned an older version, mark proposal `STALE_BASELINE`. It must be rebased/reassessed before READY.

Knowledge ProposedDiffs follow the same principle using source version/fingerprint.

### FR-11 Manage capabilities

Current and proposed requirements may link one or more stable `capabilityRefs`. Capability links drive retrieval, impact analysis, collision detection, work-package grouping and visualization.

### FR-12 Discover perspectives

AI proposes affected perspectives with rationale/criticality. Delivery Lead confirms/adds/removes. Required PROPOSED perspectives block readiness.

### FR-13 Manage access and authority

- subject membership: SPONSOR / DELIVERY_LEAD / PARTICIPANT / OBSERVER;
- perspective assignment: OWNER / DELEGATE / CONTRIBUTOR / REVIEWER;
- expertise hints never establish authority.

### FR-14 Run smart drills

Question priority considers ownership relevance, criticality, profile gaps, unresolved uncertainty, contradictions, dependencies, missing acceptance/evals, uncovered perspectives and confidence deficit.

People may contribute outside formal ownership; authority remains separate.

### FR-15 Persist task lifecycle

```text
OPEN -> IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED
                     \-> WAITING_ON_OTHER -> IN_PROGRESS
Any nonterminal -> CANCELLED
```

Human response is durable before AI processing.

### FR-16 Maintain My Work projection

Authoritative Tasks remain under Delivery Subjects. Backend maintains private `users/{uid}/taskInbox` projection and cleans it on reassignment/access removal.

### FR-17 Capture contributions/evidence

Persist verbatim contribution, epistemic mode, human/AI confidence separately, evidence and likely authoritative owner hints.

### FR-18 Maintain requirement revisions/provenance

Human and AI edits share one command path. Every semantic edit creates RequirementRevision, writes RequirementSource records and invalidates old revision-bound verification/acceptance/evals for readiness.

RequirementSource may also reference `BASELINE_REQUIREMENT` with source version.

### FR-19 Verify current proposal revision

OWNER/DELEGATE may verify/reject/amend a Contribution, current Requirement revision or ProposedDiff. Reviewer feedback remains advisory.

### FR-20 Evaluate Requirement Profile compliance

Requirement Profile rules define what a good requirement must contain. Deterministic evaluation produces RequirementQualityFinding records with rule ID, severity, blocking state and status.

Blocking OPEN profile findings prevent READY. WAIVED requires explicit human decision/audit trail.

### FR-21 Typed profile-specific details

The core Requirement model remains stable. Profile-specific details use typed fields:

```text
TEXT | BOOLEAN | NUMBER | ENUM | REFERENCE | TEXT_LIST | REFERENCE_LIST
```

Examples for an API/Integration profile include producer, consumers, contract, failure behavior and compatibility.

### FR-22 Detect gaps and assumptions

Persist gaps and assumptions with explicit severity/criticality, ownership, validation and blocking semantics.

### FR-23 Detect/resolve N-party conflicts

Persist 2+ positions. Participant-specific tasks/threads capture evidence. Shared conflict view aggregates positions. AI may neutrally summarize; named human records Decision/source correction.

### FR-24 Decisions

Persist question, alternatives, decision, rationale, owner, participants, affected requirements and superseded decision.

### FR-25 Enterprise knowledge changes

Persist ProposedDiff against exact KnowledgeReference baseline version/fingerprint where possible. Users can confirm/reject/correct. No source-system write-back in P0.

### FR-26 Split work packages

Group proposed changes by downstream implementation area. WorkPackage has required targetAreaRef, optional targetTeamId/coordinator.

### FR-27 Acceptance criteria

Target REQUIREMENT / WORK_PACKAGE / DELIVERY_SUBJECT. Requirement targetRevision is mandatory.

### FR-28 Evaluations

Target REQUIREMENT / WORK_PACKAGE / DELIVERY_SUBJECT. Requirement targetRevision is mandatory. Profile rules may require specific evaluation types.

### FR-29 Dependencies

Dependencies may link requirements/work packages/knowledge references. `blocking=true` means unresolved prevents READY.

### FR-30 Deterministic readiness

Includes core invariants plus:

- Requirement Profile pinned;
- no blocking OPEN profile findings;
- all active subject requirements classified as change proposals;
- no STALE_BASELINE requirement proposal;
- no blocking UNREVIEWED duplicate/contradiction match.

### FR-31 Realtime collaboration

Several logged-in members work simultaneously. Remote updates must not overwrite unsent drafts or silently replace stale structured edits.

### FR-32 OpenCode synchronization

OpenCode local session is disposable. Every meaningful run receives bounded authoritative current/proposed/profile context. `contextRevisionPresented` records what it actually saw, separate from same-run `domainRevisionAtEnd`.

### FR-33 Rich assistant-ui rendering

The application explicitly uses:

- normal chat for questions/explanations;
- **Tool UI** for known requirement/change/verification/conflict/decision/knowledge actions;
- **form-filling copilot** for Scope, Requirement, Decision, WorkPackage and Requirement Profile forms;
- **constrained Generative UI** for read/propose-oriented bigger-picture, current-vs-proposed, impact, traceability and readiness views;
- experimental Interactables only for non-authoritative scratch surfaces in P0.

See `docs/ASSISTANT_UI_INTERACTIONS.md`.

### FR-34 Requirement history/current-vs-proposed UX

Normal users can inspect:

- current catalogue baseline and its history;
- subject proposed requirement revision history;
- change type and proposal status;
- provenance/verification;
- other active proposal collisions;
- baseline-vs-proposed visual diff.

### FR-35 Admin Requirement Profiles

ADMIN/Requirement Steward can create DRAFT profile version, edit required perspectives/type policies/typed fields/acceptance/eval/collision rules, ask AI to assist form filling, and PUBLISH a new immutable version.

Existing Delivery Subjects never silently adopt it.

### FR-36 Explicit profile upgrade

Delivery Lead can compare pinned profile version with newer published version, preview added/removed quality findings, then explicitly upgrade subject profile version.

### FR-37 War-room observability

Show AgentRun status, hydration, session generation, context/domain revisions, tool calls, structured outputs, applied/rejected commands and classified failures.

### FR-38 Package export/read API

Generate JSON/Markdown and read APIs from persisted state. The package is a **change set**, including baseline refs and proposed changes—not only flattened final text.

```text
GET /api/delivery-subjects/{id}/package
GET /api/delivery-subjects/{id}/work-packages/{workPackageId}
```

## 7. UI requirements

### Primary navigation

```text
My Work | Delivery Subjects | Requirement Catalogue | Admin* | War Room*
```

### Delivery Overview

Show profile/version, subject kind, scope, current baseline impacts, proposed change counts, collisions, blockers and readiness.

### Drill Workspace

Three panes: personal focus, assistant-ui chat/Tool UI, structured current/proposed state.

### Requirements / Change Set

Default to:

```text
[Proposed changes] [Affected current] [All]

MODIFY     REQ-248 v6 -> R-17 rev3
CREATE     new -> R-18 rev2
RETIRE     REQ-104 v2
NO_CHANGE  REQ-301 v8
```

### Requirement Detail

Side-by-side CURRENT BASELINE versus DELIVERY SUBJECT PROPOSAL. Show capabilities, profile gaps, match/collision candidates, provenance, verification, acceptance/evals and history.

### Requirement Catalogue

Read-oriented current accepted requirements, stable identity, current version, history, type and capability links. In P0 subject workflows cannot promote into it.

### Enterprise Impact

CURRENT knowledge/source version alongside PROPOSED diff and stale-source warnings.

### Admin

Users/roles/perspectives plus Requirement Profiles and profile versions.

### Readiness

Show deterministic blockers including profile findings, stale baseline and unreviewed duplicate/contradiction candidates.

## 8. User stories

### Sponsor
- Start an idea and see how it changes current truth rather than reading a flat requirement list.

### Delivery Lead
- Select/pin a profile.
- See existing requirements/knowledge likely affected.
- Decide whether a proposed requirement is CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE.
- See collisions with other active subjects.
- Upgrade profile explicitly and preview new gaps.

### Perspective Owner/Delegate
- Answer focused questions.
- Compare current vs proposed wording/details.
- Verify exact proposed revision with evidence.

### Contributor/Reviewer
- Add knowledge/evidence/challenges without being treated as authority.

### Requirement Steward/Admin
- Change “requirements for requirements” by publishing a new Requirement Profile version through UI.
- Add typed required fields and quality policies without changing the core schema/code.
- Inspect impact of profile changes before subjects upgrade.

### Downstream consumer
- Retrieve explicit requirement/knowledge change operations with pinned baseline versions.
- Know what is current, what is proposed, and what has not yet been promoted.

### War-room operator
- Diagnose MODEL/PROMPT/CONTEXT/KNOWLEDGE/WORKFLOW/DOMAIN_MODEL/UX/OWNERSHIP/CONCURRENCY/BASELINE_MATCHING/PROFILE failures.

## 9. Readiness baseline

READY requires all blocking checks to pass, including:

- outcome defined;
- published Requirement Profile version pinned;
- no blocking profile findings;
- all active subject requirements linked to explicit change proposals;
- no stale baseline proposal;
- no blocking unreviewed duplicate/contradiction candidate;
- all required perspectives confirmed and owned/delegated;
- HIGH/CRITICAL proposed requirements current-revision verified and authoritatively sourced;
- no blocking gap/conflict/assumption/dependency/task;
- required enterprise impacts linked;
- critical proposed requirements allocated to targeted work packages;
- current-revision acceptance/evals present as required.

Readiness percentage is informational only.

## 10. Final handoff contract

```json
{
  "deliverySubject": {},
  "profile": {"id": "api-change", "version": 8},
  "scope": {},
  "sourceArtifacts": [],
  "requirementChanges": [
    {
      "changeType": "MODIFY",
      "baseline": {"requirementId": "REQ-248", "version": 6},
      "proposedRequirement": {}
    }
  ],
  "knowledgeChanges": [],
  "matchesReviewed": [],
  "decisions": [],
  "assumptions": [],
  "verifications": [],
  "workPackages": [],
  "acceptanceCriteria": [],
  "evaluations": [],
  "dependencies": [],
  "traceability": [],
  "readiness": {}
}
```

Req Helper answers **what current truth is affected, what is proposed to change, why, according to whom, based on what evidence, across which implementation areas, and how we will know the proposed change is correct**. Downstream SDLC answers **how to implement/test/deploy it**. Only later explicit reconciliation can make delivered changes current enterprise baseline.
