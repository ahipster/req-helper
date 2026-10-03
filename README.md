# Req Helper

AI-first requirements orchestration PoC for enterprise delivery.

Req Helper turns a raw signal/idea into a traceable, multi-perspective **change set over current enterprise requirements, knowledge and architecture** that a downstream SDLC can implement.

## Core thesis

The primary object is a **Delivery Subject**, not chat. The system does not assume every idea needs brand-new requirements or guess implementation targets from prose alone.

```text
Signal + source material
  -> Delivery Subject + pinned Requirement Profile
  -> discover CURRENT requirements + knowledge
  -> pin CURRENT normalized architecture baseline
  -> discover ACTIVE proposals from other subjects
  -> classify requirement changes:
       CREATE | MODIFY | SUPERSEDE | RETIRE | NO_CHANGE
  -> multi-perspective human/AI drills
  -> proposed Requirement revisions + provenance + verification
  -> requirement -> architecture impact analysis
  -> confirmed system/component/API/repository/team targets
  -> gaps / assumptions / conflicts / decisions
  -> work packages + acceptance/evals
  -> deterministic readiness
  -> explicit change-set package
  -> downstream SDLC
```

**CURRENT** and **PROPOSED** are separate concepts throughout the model and UI. READY/HANDED_OFF does not mean a proposal has become current enterprise truth.

## PoC architecture

```text
Architecture Git repos (Markdown, ArchiMate-inspired)
                  |
        LLM-assisted ingestion
                  |
                  v
      Normalized architecture baseline
                  |
                  v
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
- Git repository access for architecture Markdown ingestion
- MCP / REST / search / files / repository adapters where useful

No LangGraph requirement. Req Helper owns a small deterministic workflow/state machine around OpenCode.

## Architecture source: Git Markdown, not Sparx

P0 intentionally excludes Sparx integration.

Existing custom Git architecture repositories remain authoritative source material. They may use folders, front matter, links, prose, tables, scripts/skills and text diagrams while broadly following ArchiMate concepts.

Req Helper derives a normalized, versioned ArchiMate-inspired architecture baseline from exact Git commits:

```text
Git commit(s)
 -> scan/fingerprint Markdown
 -> deterministic structured hints
 -> LLM extraction
 -> deterministic reconciliation/validation
 -> human review of inferred/ambiguous topology
 -> immutable PUBLISHED ArchitectureBaseline
```

Every normalized architecture element/relationship keeps source evidence including commit/path/fingerprint and whether the fact was `EXPLICIT` or `INFERRED`.

The LLM may interpret source material, but it may not silently invent systems/relationships, merge similar names, or publish a baseline.

See `docs/ARCHIMATE_GIT_INGESTION.md`.

## Requirement -> system impact

The architecture baseline closes the gap between semantic requirements and implementation routing.

```text
Requirement
 -> capability / process / concept
 -> application service / component
 -> API / event / data object
 -> repository
 -> team
```

Req Helper persists revision/baseline-specific `RequirementArchitectureImpact` records such as:

```text
Customer MDM       VERIFY_ONLY
Customer API       MODIFY
Onboarding Engine  MODIFY
Mobile App         VERIFY_ONLY
```

Confirmed impacts drive `WorkPackageImplementationTarget` records. A model is not allowed to route work to a guessed repository/team when current topology does not support that link.

Architecture structure changes themselves are separate `ArchitectureChangeProposal` records and remain PROPOSED until later delivery/reconciliation changes the source Git architecture.

## assistant-ui is more than chat

P0 explicitly uses:

- normal chat for questions/explanations;
- **Tool UI** for requirement matches/change proposals/verification/conflicts/decisions/knowledge diffs/architecture impacts;
- **form-filling copilot** for Scope, Requirement, Decision, WorkPackage and Requirement Profile drafts;
- **constrained Generative UI** for Bigger Picture, current-vs-proposed, system context/application cooperation, impact/traceability/readiness views;
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

Architecture requirements are also profile-controlled through a versioned `RequirementProfileArchitecturePolicy`, for example:

- architecture baseline required;
- confirmed impact required for HIGH/CRITICAL requirements;
- implementation target required;
- whether `NEEDS_REVIEW` topology may be used.

A Delivery Subject pins one exact published profile version. A newer profile never silently changes existing subjects; Delivery Lead can compare/upgrade explicitly.

## Current baseline and proposals

### Current Requirement Catalogue

```text
requirementCatalog/{stableRequirementId}
  /versions/{immutableVersion}
```

### Current normalized architecture

```text
architectureSources/{sourceId}
architectureIngestionRuns/{runId}
architectureBaselines/{baselineId}
  /elements
  /relationships
  /views
  /ingestionFindings
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
  /architectureContext
  /architectureImpacts
  /architectureChangeProposals
  /workPackageImplementationTargets
```

Example requirement collision:

```text
CURRENT REQ-248 v6
       |
       +-- DS-123: MODIFY -> R-17 rev3
       +-- DS-119: MODIFY -> R-22 rev2   <-- collision surfaced
```

If a requirement or architecture baseline advances while a subject is active, dependent proposals/impacts become stale until rebased/reassessed.

See `docs/REQUIREMENT_BASELINES_AND_PROFILES.md` and `docs/ARCHIMATE_GIT_INGESTION.md`.

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
- pinned architecture baseline identity/version and a bounded relevant topology neighborhood when needed;
- PROPOSED requirement/knowledge/architecture changes and impacts;
- profile findings;
- gaps/conflicts/decisions/work packages.

Do not dump the full architecture graph into every prompt.

`contextRevisionPresented` records what the session actually saw, not same-run `domainRevisionAtEnd`.

## Readiness additions

READY can now additionally require, according to the pinned profile:

- a published Requirement Profile version;
- no blocking OPEN profile finding;
- every active proposed Requirement has an explicit change proposal;
- no stale requirement baseline;
- no blocking unreviewed duplicate/contradiction candidate;
- a current pinned architecture baseline;
- confirmed current-revision architecture impacts for HIGH/CRITICAL requirements;
- trusted/reviewed topology behind those impacts;
- concrete work-package implementation targets;
- no stale architecture impact/change proposal.

Existing authority/provenance/conflict/dependency/acceptance/evaluation/task readiness rules remain.

## P0 boundary

In scope:

- small representative current requirement catalogue;
- versioned Requirement Profiles + admin editor;
- Git Markdown architecture source ingestion at exact commits;
- LLM-assisted ArchiMate-inspired normalization;
- deterministic reconciliation/validation + human review of inferred topology;
- published architecture baselines and system-context/application views;
- requirement-to-architecture impact analysis and implementation routing;
- current-vs-proposed requirement/knowledge/architecture UX;
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

- Sparx ingestion/synchronization;
- automatic implementation/deployment;
- automatic promotion of proposal into current requirement/architecture state;
- architecture Git write-back;
- external source-system write-back;
- full ArchiMate language coverage;
- generic enterprise knowledge graph;
- production-complete IAM/SCIM/notifications.

## Start here

1. `AGENTS.md`
2. `docs/PRD.md`
3. `docs/DOMAIN_MODEL.md`
4. `docs/REQUIREMENT_BASELINES_AND_PROFILES.md`
5. `docs/ARCHIMATE_GIT_INGESTION.md`
6. `docs/ASSISTANT_UI_INTERACTIONS.md`
7. `src/domain/schemas.ts`
8. `src/domain/architecture.ts`
9. `docs/ARCHITECTURE.md`
10. `docs/FIRESTORE_MODEL.md`
11. `docs/UI_MOCKUPS.md`
12. `docs/OPENCODE_STATE_SYNC.md`
13. `docs/IMPLEMENTATION_PLAN.md`

If artifacts disagree, `src/domain/schemas.ts` + `src/domain/architecture.ts` + the canonical domain docs win and the conflicting artifact must be fixed.
