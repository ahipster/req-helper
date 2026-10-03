# Req Helper

AI-first requirements orchestration PoC for enterprise delivery.

Req Helper turns a raw signal/idea into a traceable, multi-perspective **change set over current enterprise requirements and knowledge** that a downstream SDLC can implement.

## Core thesis

The primary object is a **Delivery Subject**, not chat. The system does not assume every idea needs brand-new requirements.

```text
Signal + source material
  -> Delivery Subject + pinned Requirement Profile
  -> discover CURRENT requirements + knowledge
  -> discover ACTIVE proposals from other subjects
  -> classify changes:
       CREATE | MODIFY | SUPERSEDE | RETIRE | NO_CHANGE
  -> multi-perspective human/AI drills
  -> proposed Requirement revisions + provenance + verification
  -> gaps / assumptions / conflicts / decisions
  -> work packages + acceptance/evals
  -> deterministic readiness
  -> explicit change-set package
  -> downstream SDLC
```

**CURRENT** and **PROPOSED** are separate concepts throughout the model and UI. READY/HANDED_OFF does not mean a proposal has become current enterprise truth.

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
 authorized users
```

### Stack

- TypeScript / Node.js
- Next.js + React
- assistant-ui
- Firebase Auth / enterprise identity adapter
- Cloud Firestore
- GCS/external file storage
- OpenCode programmable agent harness
- Vertex AI / Model Garden
- Zod/JSON Schema
- Cloud Run
- MCP / REST / search / files / repository adapters

No LangGraph requirement. Req Helper owns a small deterministic workflow/state machine around OpenCode.

## assistant-ui is more than chat

P0 explicitly uses:

- normal chat for questions/explanations;
- **Tool UI** for requirement matches/change proposals/verification/conflicts/decisions/knowledge diffs;
- **form-filling copilot** for Scope, Requirement, Decision, WorkPackage and Requirement Profile drafts;
- **constrained Generative UI** for Bigger Picture, current-vs-proposed, impact/traceability/readiness views;
- experimental Interactables only for non-authoritative scratch surfaces.

See `docs/ASSISTANT_UI_INTERACTIONS.md`.

## Requirement Profiles — requirements for requirements

A versioned Requirement Profile defines quality/completeness rules for a class of Delivery Subjects without changing the core schema/code.

Examples:

```text
API Change v8
Data Model Change v4
Regulatory Change v3
Migration v2
```

Profiles define required perspectives, expected requirement types, typed detail fields, acceptance/evaluation rules and existing-requirement matching policies.

A Delivery Subject pins one exact published profile version. A newer profile never silently changes existing subjects; Delivery Lead can compare/upgrade explicitly.

## Current baseline and proposals

### Current Requirement Catalogue

```text
requirementCatalog/{stableRequirementId}
  /versions/{immutableVersion}
```

### Subject-local proposed state

```text
deliverySubjects/{subjectId}
  /requirements
  /requirementRevisions
  /requirementChangeProposals
  /requirementMatches
  /requirementQualityFindings
  /requirementSources
```

Example:

```text
CURRENT REQ-248 v6
       |
       +-- DS-123: MODIFY -> R-17 rev3
       +-- DS-119: MODIFY -> R-22 rev2   <-- collision surfaced
```

A proposed CREATE should first search current requirements and active proposals. Duplicate/overlap/contradiction candidates are persisted/reviewed rather than hidden in model reasoning.

If the baseline advances while a subject is active, the proposal becomes `STALE_BASELINE` until rebased/reassessed.

See `docs/REQUIREMENT_BASELINES_AND_PROFILES.md`.

## Authority model

Three concepts stay separate:

1. global application capability: `ADMIN`, `PARTICIPANT`, `DELIVERY_LEAD`, `WAR_ROOM_OPERATOR`;
2. Delivery Subject membership/access: `SPONSOR`, `DELIVERY_LEAD`, `PARTICIPANT`, `OBSERVER`;
3. perspective authority: `OWNER`, `DELEGATE`, `CONTRIBUTOR`, `REVIEWER`.

OWNER/DELEGATE can satisfy authoritative verification; Reviewer is advisory.

## OpenCode synchronization

OpenCode local state is disposable. There is no wholesale replication of its local DB/disk into Firestore.

Every meaningful run receives current authoritative subject state including:

- pinned profile/version + relevant rules;
- CURRENT baseline requirements/knowledge;
- PROPOSED change operations/matches;
- proposed Requirement revisions/details;
- profile findings;
- gaps/conflicts/decisions/work packages.

`contextRevisionPresented` records what the session actually saw, not same-run `domainRevisionAtEnd`.

## Firestore shape

```text
users/{userId}/taskInbox
roleTemplates
perspectiveTemplates

requirementProfiles/{profileId}/versions/{version}
requirementCatalog/{requirementId}/versions/{version}

deliverySubjects/{subjectId}
  /members
  /sourceArtifacts
  /perspectives
  /assignments
  /tasks
  /contributions
  /evidence
  /verifications
  /knowledgeRefs
  /proposedDiffs
  /requirements
  /requirementRevisions
  /requirementChangeProposals
  /requirementMatches
  /requirementQualityFindings
  /requirementSources
  /gaps
  /conflicts
  /assumptions
  /decisions
  /workPackages
  /acceptanceCriteria
  /evaluations
  /dependencies
  /messages
  /events
  /agentThreads
  /agentRuns
```

## Readiness additions

READY now also requires:

- a published Requirement Profile version is pinned;
- no blocking OPEN profile finding;
- every active proposed Requirement has an explicit change proposal;
- no stale requirement baseline;
- no blocking unreviewed duplicate/contradiction candidate.

Existing authority/provenance/conflict/dependency/acceptance/evaluation/task readiness rules remain.

## P0 boundary

In scope:

- small representative current requirement catalogue;
- versioned Requirement Profiles + admin editor;
- current-vs-proposed change-set UX;
- duplicate/contradiction/current/active-proposal matching;
- capability links;
- typed profile detail fields/findings;
- assistant-ui Tool UI/form copilot/generative UI;
- realtime multi-user requirements drills;
- OpenCode/Vertex;
- provenance/verification/conflicts/decisions;
- work packages/acceptance/evals/readiness;
- JSON/Markdown + package APIs.

Out of scope:

- automatic implementation/deployment;
- automatic promotion of proposal into current requirement catalogue;
- external source-system write-back;
- generic enterprise knowledge graph;
- production-complete IAM/SCIM/notifications.

## Start here

1. `AGENTS.md`
2. `docs/PRD.md`
3. `docs/DOMAIN_MODEL.md`
4. `docs/REQUIREMENT_BASELINES_AND_PROFILES.md`
5. `docs/ASSISTANT_UI_INTERACTIONS.md`
6. `src/domain/schemas.ts`
7. `docs/ARCHITECTURE.md`
8. `docs/FIRESTORE_MODEL.md`
9. `docs/UI_MOCKUPS.md`
10. `docs/OPENCODE_STATE_SYNC.md`
11. `docs/IMPLEMENTATION_PLAN.md`

If artifacts disagree, `src/domain/schemas.ts` + `docs/DOMAIN_MODEL.md` win and the conflicting artifact must be fixed.
