# Architecture

## 1. Architectural style

Req Helper is a modular monolith on Cloud Run with Firestore as the authoritative collaborative state store and OpenCode behind a narrow AgentHarness boundary.

The PoC separates:

1. CURRENT baseline state — requirement catalogue + external knowledge versions;
2. Delivery Subject PROPOSED state — change proposals/revisions/findings;
3. conversation state — user-visible messages;
4. harness state — disposable OpenCode session/execution state;
5. UI/read-model state — Firestore listeners and projections.

Only authoritative Firestore domain state determines readiness/handoff.

## 2. GCP topology

```text
Browser
Next.js + React + assistant-ui
        |
        | HTTPS + authorized Firestore listeners
        v
Req Helper Cloud Run
- authn/authz
- domain command services
- requirement profile evaluator
- current requirement retrieval/matching
- change-set service
- task/workflow controller
- context builder
- readiness evaluator
- package/read APIs
- war-room diagnostics
        |                         |
        v                         v
Cloud Firestore              OpenCodeHarness
        |                         |
        |                         v
        |                    Vertex AI / Model Garden
        v
Enterprise adapters
MCP | REST | Search | Files | Requirement repositories | Architecture repositories

Large uploads -> GCS/external storage.
```

## 3. Frontend / assistant-ui

Next.js + React + assistant-ui + normal React/shadcn primitives.

assistant-ui modes:

- chat for questions/explanations;
- Tool UI for known domain actions;
- form-filling copilot for structured drafts;
- constrained Generative UI for read/propose-oriented compositions;
- Interactables only for non-authoritative scratch state in P0.

See `docs/ASSISTANT_UI_INTERACTIONS.md`.

The model never gets an unrestricted UI mutation channel. Tool/generative actions dispatch known typed commands.

## 4. Current baseline architecture

### Requirement Catalogue

```text
requirementCatalog/{stableId}
  currentVersion
  type
  capabilityRefs
  lifecycle

requirementCatalog/{stableId}/versions/{n}
  immutable semantic snapshot
```

The catalogue may be imported/synchronized from an enterprise requirements repository. Subject workflows treat it as read-only.

### Knowledge baseline

KnowledgeProvider retrieves external artifacts with stable identity/version/fingerprint where available. Subject KnowledgeReference snapshots that metadata; ProposedDiff pins the analyzed baseline.

## 5. Proposed change architecture

Delivery Subject contains:

```text
requirements                   # proposed content
requirementRevisions           # immutable subject revisions
requirementChangeProposals     # CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE
requirementMatches             # baseline/active-proposal collision review
requirementQualityFindings     # pinned profile compliance
requirementSources             # provenance
proposedDiffs                  # knowledge changes
```

Invariant:

```text
CURRENT baseline != subject proposal
READY/HANDED_OFF != baseline promotion
```

## 6. Requirement Profile architecture

```text
requirementProfiles/{profileId}
  currentPublishedVersion

requirementProfiles/{profileId}/versions/{version}
  DRAFT | PUBLISHED | RETIRED
  required perspectives
  per-type quality policies
  typed detail field definitions
  acceptance/eval rules
  matching/collision policies
```

Published versions are immutable. Subject pins exact ID/version. Profile evaluation is deterministic and outputs RequirementQualityFinding records.

## 7. Backend modules

### DeliverySubjectModule
Lifecycle, subject kind, profile pinning/upgrade, scope and aggregate revision.

### RequirementProfileModule
Draft/version/publish/compare and deterministic profile evaluation.

### RequirementCatalogueModule
Read/import/sync current requirements and immutable versions. No subject promotion path in P0.

### RequirementMatchingModule
Retrieves current catalogue candidates + active subject proposals; persists RequirementMatch classifications.

### ChangeSetModule
RequirementChangeProposal lifecycle, baseline pinning, stale-baseline checks and package change operations.

### RequirementModule
Proposed Requirement + immutable RequirementRevision + RequirementSource; shared human/AI edit path.

### KnowledgeModule
KnowledgeReference version/fingerprint + ProposedDiff stale-source semantics.

### Access/Perspective/Task/Contribution/Verification/Resolution modules
Existing role, task, evidence, verification, gaps/assumptions/conflicts/decisions semantics remain.

### WorkPackageModule
Groups proposed changes into implementation areas with dependencies/acceptance/evals.

### ReadinessModule
Deterministic checks including profile compliance, change classification, stale baseline and match review.

### AgentThreadModule
OpenCode session mapping, lease and exact context revision presented.

### PackageModule
Outputs explicit change-set JSON/Markdown/read APIs.

## 8. Requirement discovery/matching flow

```text
candidate semantic requirement
 -> derive type + capabilities + linked enterprise context
 -> search CURRENT catalogue
 -> search ACTIVE proposals in other subjects
 -> rank/classify:
      DUPLICATE | OVERLAPS | CONTRADICTS | RELATED
 -> persist RequirementMatch
 -> propose operation:
      CREATE | MODIFY | SUPERSEDE | RETIRE | NO_CHANGE
 -> human resolves blocking ambiguity
```

Matching is advisory evidence; human/domain rules determine accepted operation.

P0 retrieval may use lexical filters + capability/context refs + model/semantic similarity. Do not add a vector DB unless needed.

## 9. Baseline staleness

At meaningful proposal/readiness points:

```text
proposal.baselineVersion
        vs
catalogue.currentVersion
```

Mismatch -> `STALE_BASELINE` -> block READY -> compare/rebase/reassess.

Knowledge diff uses source version/fingerprint equivalently.

## 10. Profile evaluation flow

```text
pinned RequirementProfileVersion
        +
proposed requirements/acceptance/evals/perspectives/matches
        |
        v
deterministic evaluator
        |
        v
RequirementQualityFinding[]
```

Profile rules must not rely on an LLM judgment for basic field/count/type constraints. AI may explain findings or propose fixes.

## 11. Assistant interaction flow

```text
OpenCode reasons over authoritative context
 -> calls known tool / proposes structured output
 -> assistant-ui renders Tool UI or constrained generated view
 -> human edits/approves
 -> backend command
 -> authz + schema + target/baseline revision + idempotency
 -> Firestore transaction
```

Form copilot edits local draft state until explicit save/publish.

## 12. OpenCode context envelope

P0 FULL hydration includes bounded relevant:

```text
DeliverySubject + revision
pinned RequirementProfileVersion/rules
current task/perspective/authority
CURRENT requirement catalogue candidates + exact versions
ACTIVE proposal collisions
RequirementChangeProposals + RequirementMatches
proposed Requirements/current revisions/sources/verifications
RequirementQualityFindings
KnowledgeReferences + ProposedDiffs/baseline versions
contributions/evidence
conflicts/gaps/assumptions/decisions
work packages/acceptance/evals
recent domain events
```

Session memory conflicting with authoritative CURRENT/PROPOSED context loses.

## 13. Realtime collaboration

Subscriptions remain narrow:

- My Work -> user taskInbox;
- Overview -> subject + change counts/profile findings/blockers;
- Drill -> task/thread + relevant baseline/proposal/matches;
- Change Set -> proposals/current refs/findings;
- Requirement Detail -> baseline version + proposed revision/history/provenance/verification;
- Catalogue -> current requirements/history;
- Conflict -> positions/tasks/decision;
- War Room -> agent runs/events/baseline/profile metadata.

## 14. Security

- subject reads require membership or admin policy;
- profiles/catalogue are signed-in read-only in PoC;
- authoritative mutations are backend-only;
- profile publishing/catalogue import-promotion paths are privileged backend operations;
- no OpenCode/Vertex/Firestore admin credentials in browser.

## 15. Requirement mutation path

Human/AI semantic proposal edit:

1. authorize;
2. check current subject Requirement revision;
3. append RequirementRevision;
4. update proposed Requirement;
5. write RequirementSources;
6. invalidate prior revision-bound verification/acceptance/evals for readiness;
7. re-evaluate pinned Requirement Profile;
8. re-run relevant matching when type/capabilities/semantics changed;
9. reassess conflicts/gaps;
10. append DomainEvent.

This does not mutate baseline catalogue.

## 16. Profile version lifecycle

```text
PUBLISHED v8
  |
  +-- create DRAFT v9
           |
           +-- form-copilot edits draft
           +-- validate
           +-- PUBLISH v9
```

Subjects pinned to v8 remain v8. Upgrade preview computes delta findings before explicit upgrade.

## 17. Readiness additions

Notable blockers:

- no pinned published profile;
- blocking OPEN profile finding;
- subject Requirement lacks explicit change proposal;
- stale requirement baseline;
- blocking unreviewed RequirementMatch;
- plus existing authority/provenance/conflict/dependency/task/acceptance/eval checks.

## 18. Downstream package boundary

Package contains explicit operations:

```text
MODIFY REQ-248 v6 -> R-17 rev3
CREATE -> R-18 rev2
RETIRE REQ-104 v2
```

and knowledge changes pinned to current source versions.

P0 APIs:

```text
GET /api/delivery-subjects/{id}/package
GET /api/delivery-subjects/{id}/work-packages/{workPackageId}
```

No P0 endpoint automatically makes these changes CURRENT.

## 19. Deployment

- Next.js/API: Cloud Run;
- Firestore: authoritative PoC state;
- GCS: large uploads;
- OpenCode: internal service/embedded process as operationally appropriate;
- Vertex AI: approved provider/model/region through ADC/workload identity.

## 20. Avoid week-one overbuild

- generic requirement DSL;
- generic enterprise graph;
- automatic cross-system baseline promotion;
- custom WebSocket layer;
- Redis/Kafka solely for UI sync;
- vector DB without demonstrated need;
- LangGraph/Temporal/Camunda/PostgreSQL;
- authoritative Interactables state.
