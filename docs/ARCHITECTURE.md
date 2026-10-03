# Architecture

## 1. Architectural style

Req Helper is a modular monolith on Cloud Run with Firestore as the authoritative collaborative state store and OpenCode behind a narrow AgentHarness boundary.

The PoC separates:

1. CURRENT baseline state — requirement catalogue + external knowledge versions + published normalized architecture baseline;
2. Delivery Subject PROPOSED state — requirement/knowledge/architecture changes and impacts;
3. conversation state — user-visible messages;
4. harness state — disposable OpenCode session/execution state;
5. UI/read-model state — Firestore listeners and projections.

Only authoritative persisted domain state determines readiness/handoff.

## 2. GCP / source topology

```text
Architecture Git repos
Markdown + folders + links + prose
        |
        | exact commits
        v
Architecture ingestion pipeline
scan -> LLM extract -> reconcile -> validate -> publish
        |
        v
Normalized ArchitectureBaseline
        |
        v
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
- architecture ingestion/impact services
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
MCP | REST | Search | Files | Requirement repositories

Large uploads -> GCS/external storage.
```

P0 has **no Sparx adapter**. Existing Git Markdown architecture repositories are the only architecture source.

## 3. Frontend / assistant-ui

Next.js + React + assistant-ui + normal React/shadcn primitives.

assistant-ui modes:

- chat for questions/explanations;
- Tool UI for known domain actions;
- form-filling copilot for structured drafts;
- constrained Generative UI for read/propose-oriented compositions;
- Interactables only for non-authoritative scratch state in P0.

Architecture-specific Tool UI includes impact confirmation, source-evidence cards, architecture change proposal cards and ingestion-finding review. Generative UI may compose system-context/application-cooperation/implementation-impact views but cannot mutate truth directly.

## 4. Current baselines

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

### Knowledge baseline

KnowledgeProvider retrieves external artifacts with stable identity/version/fingerprint. Subject KnowledgeReference snapshots that metadata; ProposedDiff pins the analyzed baseline.

### Normalized architecture baseline

```text
architectureSources/{sourceId}
architectureIngestionRuns/{runId}
architectureBaselines/{baselineId}
  /elements
  /relationships
  /views
  /ingestionFindings
```

A published ArchitectureBaseline records exact Git source commits, schema/prompt version and fingerprint. It is immutable.

## 5. Git architecture ingestion pipeline

Architecture repositories are not assumed to follow one rigid machine format. Useful structure may exist in YAML/front matter, folder/file conventions, links, tables, prose and text diagrams.

The pipeline is therefore:

```text
resolve exact Git commit set
 -> enumerate/fingerprint Markdown
 -> deterministic structured hints
 -> LLM bounded document extraction
 -> cross-document reconciliation
 -> deterministic validation
 -> human review of inferred/ambiguous material topology
 -> publish immutable ArchitectureBaseline
```

### Responsibilities

**ArchitectureGitReader**
- resolves commits;
- lists configured Markdown;
- reads exact file content/fingerprint.

**ArchitectureMarkdownNormalizer**
- may use OpenCode/Vertex;
- outputs schema-valid element/relationship/view candidates;
- marks evidence `EXPLICIT | INFERRED`;
- never publishes or silently merges.

**ArchitectureReconciler**
- owns deterministic stable-key collision logic;
- resolves relationship endpoints;
- validates source evidence;
- surfaces aliases/conflicts/unresolved references as findings;
- decides whether candidate data is publishable according to rules.

See `src/adapters/architecture.ts` and `docs/ARCHIMATE_GIT_INGESTION.md`.

## 6. Normalized architecture model

`src/domain/architecture.ts` defines the ArchiMate-inspired subset.

Elements include capabilities, business processes/services/objects, application components/services/interfaces, data objects, nodes/technology services plus practical information concepts, policies, controls, APIs, events, repositories and teams.

Relationships include ArchiMate-like REALIZES/SERVES/ACCESSES/TRIGGERS/FLOWS_TO plus practical OWNS/IMPLEMENTS/EXPOSES/CONSUMES/READS/WRITES/DEPENDS_ON/DEPLOYED_TO/GOVERNED_BY.

Every element/relationship retains source evidence from the exact Git commit/path. Views are projections only.

## 7. Proposed subject state

Delivery Subject contains:

```text
requirements
requirementRevisions
requirementChangeProposals
requirementMatches
requirementQualityFindings
requirementSources
proposedDiffs
architectureContext
architectureImpacts
architectureChangeProposals
workPackageImplementationTargets
```

Invariant:

```text
CURRENT baseline != subject proposal
READY/HANDED_OFF != baseline promotion
```

## 8. Requirement Profile architecture

Published RequirementProfileVersion is immutable and pinned by subject.

Architecture-specific completeness lives in `RequirementProfileArchitecturePolicy`:

```text
requireArchitectureBaseline
requireConfirmedImpactForHighCritical
requireImplementationTargetForHighCritical
allowNeedsReviewElementsForImpact
```

This lets technical profiles require system routing without forcing it on every subject.

## 9. Backend modules

### DeliverySubjectModule
Lifecycle, subject kind, profile pinning/upgrade, scope and aggregate revision.

### RequirementProfileModule
Draft/version/publish/compare and deterministic profile evaluation.

### RequirementCatalogueModule
Read/import/sync current requirements and immutable versions. No subject promotion path in P0.

### RequirementMatchingModule
Retrieves current catalogue candidates + active subject proposals; persists RequirementMatch classifications.

### ArchitectureSourceModule
Configures Git Markdown sources and exact source-commit metadata.

### ArchitectureIngestionModule
Runs scanner/extractor/reconciler/validator; persists ingestion runs/findings and publishes immutable ArchitectureBaseline after validation/human review.

### ArchitectureQueryModule
Provides bounded traversal/search over one published baseline by stable key/type/capability/process/system and returns source-evidence-backed neighborhoods.

### ArchitectureImpactModule
Maps current Requirement revisions to baseline architecture elements, manages confirmation/rejection/staleness and ArchitectureChangeProposal lifecycle.

### ChangeSetModule
RequirementChangeProposal lifecycle, baseline pinning, stale-baseline checks and package change operations.

### RequirementModule
Proposed Requirement + immutable RequirementRevision + RequirementSource; shared human/AI edit path.

### KnowledgeModule
KnowledgeReference version/fingerprint + ProposedDiff stale-source semantics.

### Access/Perspective/Task/Contribution/Verification/Resolution modules
Existing role, task, evidence, verification, gaps/assumptions/conflicts/decisions semantics remain.

### WorkPackageModule
Groups proposed changes into work packages and links confirmed architecture impacts through WorkPackageImplementationTarget.

### ReadinessModule
Deterministic checks including profile compliance, current/proposed classification, stale baselines and architecture-routing rules.

### AgentThreadModule
OpenCode session mapping, lease and exact context revision presented.

### PackageModule
Outputs explicit requirement/knowledge/architecture change-set JSON/Markdown/read APIs.

## 10. Requirement discovery/matching flow

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

## 11. Requirement-to-architecture impact flow

For a current proposed Requirement revision:

```text
Requirement + capability/process/concept refs
 -> query bounded neighborhood from pinned ArchitectureBaseline
 -> traverse current realization/dependency topology
 -> propose RequirementArchitectureImpact[]
 -> show exact source elements/relationships/evidence
 -> human confirm/reject/correct
 -> create WorkPackageImplementationTarget[]
```

Typical traversal:

```text
requirement
 -> capability/process/concept
 -> application service/component
 -> API/event/data object
 -> REPOSITORY
 -> TEAM
```

The model cannot simply fabricate repository/team routing when no current topology supports it.

`VERIFY_ONLY` is a first-class impact so impacted consumers need not be falsely labeled as code-change targets.

## 12. Architecture structure-change flow

If implementation changes the architecture structure itself:

```text
current baseline element/relationship
 -> ArchitectureChangeProposal
      ADD | MODIFY | REMOVE | DEPRECATE | NO_CHANGE
 -> confirm/reject
 -> handoff as proposed future architecture
```

No P0 write-back to architecture Git. A future downstream commit + ingestion can make delivered architecture current.

## 13. Baseline staleness

At meaningful proposal/readiness points, compare pinned/current requirement, knowledge and architecture baselines.

Architecture example:

```text
subject ArchitectureContext = AB-9 v9
current published architecture = AB-10 v10
             |
             v
STALE_BASELINE
 -> refresh/rebase impact analysis
```

RequirementArchitectureImpact and ArchitectureChangeProposal may also independently become STALE_BASELINE.

## 14. Profile evaluation flow

```text
pinned RequirementProfileVersion
 + RequirementProfileArchitecturePolicy
 + proposed requirements/acceptance/evals/perspectives/matches
 + architecture context/impacts/targets where required
        |
        v
deterministic evaluators
        |
        v
quality/readiness findings
```

LLM may explain/fix findings but does not define the deterministic rule outcome.

## 15. OpenCode context envelope

P0 FULL hydration includes bounded relevant:

```text
DeliverySubject + revision
pinned RequirementProfileVersion/rules + architecture policy
current task/perspective/authority
CURRENT requirement catalogue candidates + exact versions
ACTIVE proposal collisions
RequirementChangeProposals + RequirementMatches
proposed Requirements/current revisions/sources/verifications
RequirementQualityFindings
KnowledgeReferences + ProposedDiffs/baseline versions
ArchitectureContext baseline ID/version/fingerprint
bounded relevant architecture elements/relationships/source evidence
RequirementArchitectureImpacts + ArchitectureChangeProposals
contributions/evidence/conflicts/gaps/assumptions/decisions
work packages/implementation targets/acceptance/evals
recent domain events
```

Do not inject the complete architecture graph into every prompt. Query the smallest relevant neighborhood.

Session memory conflicting with authoritative CURRENT/PROPOSED context loses.

## 16. Realtime collaboration

Subscriptions remain narrow:

- My Work -> user taskInbox;
- Overview -> subject/change counts/profile/architecture blockers;
- Drill -> task/thread + relevant baseline/proposal/matches/topology;
- Change Set -> proposed/current refs/findings;
- Requirement Detail -> baseline + proposed revision/history/provenance/verification + architecture impacts;
- Architecture Impact -> subject architecture context + relevant graph + impact/change proposals;
- Catalogue -> current requirements/history;
- War Room -> agent runs/events + architecture ingestion runs/findings.

## 17. Security

- subject reads require membership or admin policy;
- profiles/catalogue/published architecture baseline are signed-in read-only in PoC;
- architecture ingestion runs are admin-only browser reads in P0;
- authoritative mutations/publication are backend-only;
- Git source credentials/tokens never reach the browser/OpenCode unrestricted;
- no OpenCode/Vertex/Firestore admin credentials in browser.

## 18. Requirement mutation path

Human/AI semantic proposal edit:

1. authorize;
2. check current subject Requirement revision;
3. append RequirementRevision;
4. update proposed Requirement;
5. write RequirementSources;
6. invalidate prior revision-bound verification/acceptance/evals for readiness;
7. re-evaluate pinned Requirement Profile;
8. re-run relevant matching when type/capabilities/semantics changed;
9. re-run targeted architecture impact when profile requires and semantics/capabilities changed;
10. reassess conflicts/gaps;
11. append DomainEvent.

This never mutates current catalogue or ArchitectureBaseline.

## 19. Readiness additions

Notable blockers include:

- no pinned published profile;
- blocking OPEN profile finding;
- subject Requirement lacks explicit change proposal;
- stale requirement baseline;
- blocking unreviewed RequirementMatch;
- when architecture policy requires it: missing/stale ArchitectureContext;
- stale ArchitectureImpact/ArchitectureChangeProposal;
- missing confirmed current-revision impact for HIGH/CRITICAL requirement;
- confirmed impact relying on disallowed NEEDS_REVIEW topology;
- missing concrete implementation target for HIGH/CRITICAL requirement;
- plus existing authority/provenance/conflict/dependency/task/acceptance/eval checks.

## 20. Downstream package boundary

Package contains explicit requirement/knowledge/architecture operations and implementation targets.

P0 APIs:

```text
GET /api/delivery-subjects/{id}/package
GET /api/delivery-subjects/{id}/work-packages/{workPackageId}
```

No P0 endpoint automatically makes any proposed change CURRENT.

## 21. Deployment

- Next.js/API: Cloud Run;
- Firestore: authoritative PoC state and normalized architecture baselines;
- GCS: large uploads;
- Git source access: backend-only approved credentials/integration;
- OpenCode: internal service/embedded process as operationally appropriate;
- Vertex AI: approved provider/model/region through ADC/workload identity.

## 22. Avoid week-one overbuild

- Sparx adapter;
- full ArchiMate metamodel/editor;
- architecture Git write-back;
- generic enterprise graph platform;
- generic requirement DSL;
- automatic cross-system baseline promotion;
- custom WebSocket layer;
- Redis/Kafka solely for UI sync;
- vector DB without demonstrated need;
- LangGraph/Temporal/Camunda/PostgreSQL;
- authoritative Interactables state.
