# Req Helper PRD

## 1. Purpose

Req Helper is a PoC for AI-first requirements discovery and convergence in an enterprise/bank context. It turns an initial signal, problem, request or idea into a persistent Delivery Subject and orchestrates the people, knowledge and AI loops needed to produce an implementation-ready requirement package.

The system ends before implementation/deployment. Another SDLC system consumes the output.

## 2. Product thesis

The primary object is a **Delivery Subject**. Chat is only one interaction mechanism.

A Delivery Subject accumulates:
- original signal and desired outcome;
- relevant enterprise knowledge references;
- affected perspectives and owners;
- human contributions and evidence;
- authoritative verifications;
- structured requirements;
- assumptions, gaps, conflicts and decisions;
- proposed diffs to enterprise artifacts;
- affected-area work packages;
- acceptance criteria;
- evaluation definitions;
- dependencies and traceability;
- deterministic readiness state.

## 3. Problem

Requirements are distributed across people and systems. Formal owners often know only part of the reality. Useful knowledge exists outside ownership boundaries. Different disciplines discover requirements asynchronously, contradictions surface late, provenance gets lost, and downstream teams receive unevenly mature requirements.

Req Helper makes this a persistent, traceable, multi-perspective feedback system rather than a series of meetings and documents.

## 4. PoC success criterion

During the war-room week, a real signal must move through the following lifecycle without a parallel hand-maintained requirements document:

```text
SIGNAL
 -> DELIVERY SUBJECT
 -> KNOWLEDGE / IMPACT HYPOTHESES
 -> HUMAN PERSPECTIVE DRILLS
 -> STRUCTURED REQUIREMENTS
 -> GAP / CONFLICT / DECISION LOOPS
 -> AREA WORK PACKAGES
 -> ACCEPTANCE CRITERIA + EVALS
 -> READY PACKAGE
```

The team must be able to observe why the flow stalls, tune prompts/workflow, rerun affected analysis, and distinguish AI failures from domain/workflow/ownership failures.

The PoC must also demonstrate that loss or staleness of OpenCode local session state does not lose product state: a participant can continue from Firestore-backed context after session recreation.

## 5. Non-goals

Not in the one-week PoC:
- generic enterprise ontology/knowledge graph;
- autonomous implementation or deployment;
- authoritative write-back to architecture/process/model repositories;
- replacement for Jira/project portfolio tools;
- full governance/approval engine;
- production-grade enterprise IAM/SCIM;
- generic agent platform.

## 6. Actors

### Signal Sponsor
Introduces the problem/opportunity and follows progress.

### Delivery Lead
Owns convergence of the Delivery Subject and resolves assignment/readiness issues.

### Perspective Owner
Authoritative human for a perspective such as business, process, data, architecture, security, risk, compliance, operations, integration/API, UX or affected system/domain.

### Contributor
Has useful knowledge without necessarily owning the subject.

### Reviewer / Knowledge Steward
Verifies requirements or enterprise references/impacts.

### Downstream SDLC Consumer
Consumes finalized work packages and their traceability, acceptance criteria and evals.

### War-room Operator
Inspects orchestration traces and tunes configuration/prompts during the PoC.

### Req Helper Admin
Configures PoC users, global application roles, role templates and perspective templates/catalogue.

## 7. Core product principles

### Contribution is not authority
A person may provide useful information outside formal ownership. Preserve it, route it to the likely owner, and track verification separately.

### Global role is not Delivery Subject authority
Application roles, job titles, role templates and expertise hints help configure/suggest participants. Only an explicit Delivery Subject assignment establishes OWNER/DELEGATE/CONTRIBUTOR/REVIEWER relationship for that delivery.

### Provenance is mandatory
Every important requirement must trace to human statement, enterprise artifact, policy, observation, decision, assumption or explicit AI inference.

### Contradictions are records
Never hide contradictions inside summaries. Persist them with severity, owners, blocking state and resolution.

### Decisions are records
A decision captures question, alternatives, outcome, rationale, owner, participants and affected requirements.

### Readiness is deterministic
The LLM can suggest missing work, but code determines whether a Delivery Subject is ready.

### OpenCode is disposable execution state
Firestore is authoritative. OpenCode sessions/local storage may be lost or stale and must be recreatable from Firestore-backed context.

## 8. Functional requirements

### FR-1 Create Delivery Subject
A user can create a Delivery Subject from natural-language signal text and optional links/documents. Preserve the original signal verbatim.

### FR-2 Clarify signal
AI proposes problem statement, desired outcome, scope and unknowns. The initiating human can correct them.

### FR-3 Discover relevant knowledge
The system queries configured KnowledgeProviders and links relevant concepts, glossary terms, processes, APIs, applications, solutions, policies, controls and architecture artifacts.

### FR-4 Discover perspectives
AI proposes affected perspectives with rationale and confidence. Delivery Lead confirms, removes or adds perspectives.

### FR-5 Assign humans
Each perspective supports OWNER, DELEGATE, CONTRIBUTOR and REVIEWER relationships. Expertise hints may suggest candidates but cannot establish authority automatically.

### FR-6 Run smart drills
The system asks targeted questions based on ownership relevance, uncertainty, criticality, dependencies, contradictions, missing acceptance criteria and confidence deficits.

Formal ownership influences priority, not whether a question may be asked.

### FR-7 Capture contribution semantics
For each meaningful human statement capture:
- verbatim statement;
- author;
- perspective;
- ownership relation;
- epistemic mode where possible: KNOW / BELIEVE / OBSERVED / UNKNOWN;
- confidence;
- evidence links;
- verification status;
- likely authoritative owner.

### FR-8 Synthesize structured requirements
AI proposes new/updated requirements from validated context. Every mutation validates against schema and keeps provenance.

### FR-9 Detect gaps
Persist unresolved missing information with perspective, severity, owner, blocking state and status.

### FR-10 Detect conflicts
Persist contradictions between requirements, artifacts, decisions or contributions. Route them to affected humans.

### FR-11 Record decisions
Humans can record explicit decisions; AI may frame options but cannot silently decide contested business/architecture choices.

### FR-12 Link proposed enterprise diffs
For linked enterprise artifacts, record ADD/MODIFY/REMOVE/DEPRECATE/UNKNOWN_CHANGE proposals. No authoritative write-back in PoC.

### FR-13 Split into work packages
When requirements converge, group them by implementation/affected area while preserving cross-package dependencies.

### FR-14 Generate acceptance criteria
Critical requirements require detailed acceptance criteria, ideally Given/When/Then where appropriate.

### FR-15 Generate eval definitions
Define downstream verification such as deterministic tests, performance/security checks, policy checks, human review, or semantic/LLM evals with explicit threshold/failure behavior.

### FR-16 Compute readiness
See `docs/DOMAIN_MODEL.md` and `src/domain/readiness.ts`.

### FR-17 Export package
Export machine-readable JSON and human-readable Markdown from the same domain state.

### FR-18 War-room observability
Expose workflow state, waits, model/tool calls, retries, structured outputs, schema failures, context/hydration metadata and domain mutations.

### FR-19 Admin/configuration UI
An ADMIN can manage PoC user profiles, global application roles, role templates and perspective templates/catalogue through UI/backend APIs. A Delivery Lead/Admin can manage Delivery Subject perspective assignments.

The P0 admin model is specified in `docs/ADMIN_UI.md`.

### FR-20 OpenCode/Firestore state synchronization
For every meaningful OpenCode run the backend must:
- load current authoritative Firestore state;
- resolve or recreate the OpenCode session;
- compare Delivery Subject revision to AgentThread `lastContextRevision`;
- inject bounded current context whenever state changed;
- persist user-visible message continuity independently of OpenCode disk;
- schema-validate outputs;
- reject stale/duplicate mutations using revisions/idempotency;
- update AgentThread/run metadata after completion.

There is no wholesale replication of OpenCode local disk/database to Firestore. Detailed mechanics are defined in `docs/OPENCODE_STATE_SYNC.md`.

## 9. UI requirements

The core layout is three-pane:

```text
┌────────────────┬────────────────────────────────┬───────────────────┐
│ What matters   │ Conversation / current task    │ Structured state  │
│ to this user   │                                │ and context       │
└────────────────┴────────────────────────────────┴───────────────────┘
```

### Screen: My Work
Shows blocking questions, review tasks and followed Delivery Subjects. Non-technical users should see tasks, not methodology.

### Screen: New Signal
Minimal natural-language entry plus optional context links/documents.

### Screen: Delivery Overview
Shows outcome, perspectives, requirement counts, open issues, overall readiness and recent activity.

### Screen: Drill Workspace
Left: current focus/questions. Center: conversation. Right: requirement/context/evidence and related perspectives. Actions include I DON'T KNOW, ASK SOMEONE and SHOW BIGGER PICTURE.

### Screen: Bigger Picture
Shows cross-perspective impact map without requiring the user to work in every perspective.

### Screen: Requirements
Filterable requirements with state, owner, provenance, acceptance coverage and related knowledge.

### Screen: Conflicts & Decisions
Shows blocking conflicts, participating perspectives, AI-proposed options and explicit human decision recording.

### Screen: Enterprise Impact
Shows linked artifacts and proposed before/after effects. Users can mark incorrect relationships.

### Screen: Work Packages
Shows area-specific packages, readiness, dependencies and missing information.

### Screen: Work Package Detail
Shows requirements, acceptance criteria, evals, dependencies and linked enterprise knowledge.

### Screen: Readiness
Shows deterministic checks with blockers and next actionable item.

### Screen: Final Package
Human-readable package plus JSON/Markdown export.

### Screen: War Room
Shows workflow state, agent activity, waits, traces, retries, context revision/hydration mode, quality indicators and rerun controls.

### Screen group: Admin
Admin Overview, Users, User Detail, Role Templates, Perspective Catalogue and Delivery Subject Assignment UI as defined in `docs/ADMIN_UI.md`.

## 10. Smart drill prioritization

Conceptually:

```text
priority(question) =
  ownership_relevance
+ requirement_criticality
+ unresolved_uncertainty
+ contradiction_severity
+ dependency_importance
+ missing_acceptance_criteria
+ uncovered_perspective
+ confidence_deficit
```

The exact weights are configurable and should be tuned during war-room testing.

## 11. User stories

### Sponsor
- As a sponsor, I can start with ordinary language.
- As a sponsor, I can correct the AI's interpretation.
- As a sponsor, I can see progress/readiness without reading every requirement.

### Perspective owner
- I see questions prioritized for my perspective.
- I can understand why I am being asked something.
- I can contribute outside my ownership without becoming authoritative by accident.
- I can verify/reject/amend a routed contribution.
- I can challenge generated requirements.
- I can inspect the bigger picture when needed.

### Delivery Lead
- I can see covered/unassigned/blocked perspectives.
- I can see blockers by severity.
- I can assign/reassign OWNER/DELEGATE/CONTRIBUTOR/REVIEWER.
- I can use expertise hints as suggestions without granting authority automatically.
- I can record decisions.
- I can reopen a requirement/perspective after new evidence.
- I can see exactly why readiness is blocked.

### Contributor
- I can say I know, believe, observed, or do not know.
- I can suggest a better expert/owner.

### Knowledge Steward
- I can inspect linked artifacts and proposed diffs.
- I can reject incorrect AI-discovered relationships.
- I can attach an authoritative source.

### Downstream SDLC Consumer
- I can retrieve one area-specific package.
- I can retrieve requirement provenance, acceptance criteria and evals programmatically.
- I can inspect cross-area dependencies.

### War-room Operator
- I can trace orchestration and model/tool activity.
- I can see OpenCode session generation, domain/context revisions and hydration mode.
- I can classify a failure and rerun affected analysis after prompt/config changes.

### Admin
- I can manage PoC users without editing Firestore manually.
- I can assign global application roles.
- I can manage role templates and perspective templates/catalogue.
- I can deactivate users/templates while preserving historical audit references.

## 12. Readiness baseline

A Delivery Subject cannot be READY while any of the following remain true:
- problem/outcome is missing;
- required perspective lacks accountable OWNER/DELEGATE;
- critical requirement lacks authoritative verification;
- blocking gap/conflict is open;
- major assumption has no explicit status/owner;
- affected knowledge is unlinked where required;
- critical requirement has no work package;
- critical requirement lacks acceptance criteria;
- required eval is missing;
- cross-package dependency is unresolved/unowned.

Global application roles, role templates and expertise hints do not satisfy perspective ownership readiness.

## 13. PoC metrics

Primary:
- time from signal to ready package;
- human interactions and time per participant;
- blocking gaps discovered;
- cross-perspective conflicts discovered;
- requirements changed after review;
- percentage with traceable provenance;
- acceptance/eval coverage;
- unowned blockers;
- reopened requirements.

War-room qualitative:
- was the question useful?
- was it routed to the right person?
- did the user understand why they were involved?
- did AI interpret the answer correctly?
- was context missing or excessive?
- did stale-session recovery preserve correct current state?

## 14. Final handoff contract

The package must contain at least:

```json
{
  "deliverySubject": {},
  "outcomes": [],
  "decisions": [],
  "assumptions": [],
  "requirements": [],
  "enterpriseImpacts": [],
  "workPackages": [
    {
      "area": "...",
      "requirements": [],
      "acceptanceCriteria": [],
      "evaluations": [],
      "dependencies": []
    }
  ],
  "traceability": [],
  "readiness": {}
}
```

Product boundary: Req Helper answers **what must change, why, according to whom, based on what evidence, across which areas, and how we will know it is correct**. The downstream AI-first SDLC answers **how to implement, test and deploy it**.
