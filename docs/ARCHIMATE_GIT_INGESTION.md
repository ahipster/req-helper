# ArchiMate-inspired Git architecture ingestion

## Purpose

Req Helper needs enough current enterprise architecture context to answer a second question in addition to **what must change**:

> Which existing systems, application services, APIs, data objects, repositories and teams currently realize the affected capability/process/concept, and therefore where should implementation or verification be directed?

P0 does **not** integrate Sparx. The only architecture source in scope is one or more Git repositories containing Markdown/folder structures that broadly follow ArchiMate concepts and local architecture conventions.

The Git repositories remain authoritative source material. Req Helper maintains a normalized, versioned, ArchiMate-inspired **derived architecture baseline** produced by an LLM-assisted ingestion pipeline.

## Core boundary

```text
Git architecture repositories
Markdown + folders + links + front matter + prose
              |
              | exact repository commits
              v
 deterministic scanner
              |
              v
 LLM-assisted document extraction
              |
              v
 deterministic reconciliation + validation
              |
              v
 human review for inferred/ambiguous topology
              |
              v
 PUBLISHED ARCHITECTURE BASELINE
 elements + relationships + views + source evidence
              |
              v
 Delivery Subject pins exact baseline
              |
              v
 requirement -> architecture impact -> work package
```

The LLM is an interpreter, not an authoritative architecture repository.

## Why an LLM-supported transformation is required

The Git repositories are not assumed to have a single rigid machine schema. Useful architecture can be encoded in:

- directory structure;
- Markdown headings and prose;
- YAML/front matter where present;
- links between files;
- tables;
- Mermaid/ASCII diagrams represented as text;
- locally defined scripts/skills/conventions;
- implicit statements such as "Customer API reads Customer MDM".

A brittle parser would either miss important topology or force every existing repository to be redesigned before the PoC can work.

The ingestion pipeline therefore combines:

1. deterministic Git/file metadata collection;
2. deterministic extraction of obvious structured metadata;
3. LLM interpretation against an allowlisted architecture schema;
4. deterministic cross-file entity resolution and validation;
5. human review when the model has inferred rather than directly extracted material relationships.

## Source versioning

Every ingestion uses exact commits.

```text
architectureSources/source-customer
  repository: org/customer-architecture
  branch: main

ArchitectureIngestionRun I-17
  source commit: 19ec8f...

ArchitectureBaseline AB-9 v9
  sourceCommits:
    customer-architecture -> 19ec8f...
    integration-architecture -> a78bd2...
```

A published baseline never mutates. A later Git commit produces another candidate baseline/version.

A Delivery Subject pins one published baseline. If the current published architecture moves while the subject is active, the subject architecture context becomes `STALE_BASELINE` and impact analysis must be reassessed before READY when its profile requires architecture impact.

## Normalized ArchiMate-inspired model

The normalized model follows ArchiMate semantics where useful but intentionally includes practical enterprise/software-delivery extensions.

### Elements

P0 element types:

```text
BUSINESS
  CAPABILITY
  BUSINESS_ACTOR
  BUSINESS_ROLE
  BUSINESS_PROCESS
  BUSINESS_SERVICE
  BUSINESS_OBJECT

APPLICATION
  APPLICATION_COMPONENT
  APPLICATION_SERVICE
  APPLICATION_INTERFACE
  DATA_OBJECT

TECHNOLOGY
  NODE
  TECHNOLOGY_SERVICE

ENTERPRISE / DELIVERY EXTENSIONS
  INFORMATION_CONCEPT
  POLICY
  CONTROL
  API
  EVENT
  REPOSITORY
  TEAM
  OTHER
```

The normalized model is not intended to replace ArchiMate. It is the minimum useful projection for impact reasoning and implementation routing.

### Relationships

P0 relationship vocabulary:

```text
ArchiMate-like
  REALIZES
  SERVES
  ASSIGNED_TO
  ACCESSES
  TRIGGERS
  FLOWS_TO
  COMPOSED_OF
  AGGREGATES
  SPECIALIZES
  ASSOCIATED_WITH

practical extensions
  OWNS
  IMPLEMENTS
  EXPOSES
  CONSUMES
  READS
  WRITES
  DEPENDS_ON
  DEPLOYED_TO
  GOVERNED_BY
```

Do not force a useful repository/team/API relationship into an unnatural pure-ArchiMate construct merely to preserve notation purity.

## Stable identity

Every normalized element needs a stable key.

Preferred sources, in order:

1. explicit stable ID/front matter in the source Markdown;
2. explicit canonical link/reference in the source;
3. deterministic repository/path-derived key when the file itself represents one architecture object;
4. model-proposed candidate key requiring review when none of the above exists.

The LLM must never silently merge two objects merely because their names are similar.

Duplicate or conflicting definitions produce `ArchitectureIngestionFinding` records.

## Source evidence

Every element and relationship must retain source evidence.

```text
ArchitectureSourceEvidence
  sourceId
  commitSha
  path
  blobSha/fingerprint
  line range when available
  short excerpt when useful
  mode = EXPLICIT | INFERRED
```

Examples:

```text
EXPLICIT
"Customer API consumes Customer MDM through the Customer Query service."

INFERRED
A diagram/text combination strongly implies the dependency but no direct statement exists.
```

An inferred relationship is allowed into a draft baseline, but may remain `NEEDS_REVIEW`. Requirement impact must not rely on `NEEDS_REVIEW` topology when the selected profile disallows it.

## Ingestion lifecycle

```text
QUEUED
 -> SCANNING
 -> EXTRACTING
 -> RECONCILING
 -> VALIDATING
 -> SUCCEEDED

any stage -> FAILED
```

### 1. Scan

Deterministic code:

- resolves exact source commit;
- enumerates configured Markdown paths;
- records blob SHA/fingerprint;
- detects files changed since the previous successful ingestion;
- parses obvious front matter/links when possible.

### 2. Extract

The model receives one bounded Markdown document plus deterministic metadata and outputs only schema-valid candidates:

```text
ArchitectureElement[]
ArchitectureRelationship[]
ArchitectureView[]
unresolvedReferences[]
```

The model must distinguish directly supported facts from inferred facts.

### 3. Reconcile

Cross-file deterministic/LLM-assisted reconciliation:

- resolve explicit stable references;
- join identical stable keys;
- identify aliases as proposals, not automatic merges;
- resolve relationship endpoints;
- surface conflicting element definitions;
- surface unresolved references;
- surface low-confidence or inferred material relationships.

LLM suggestions can help with alias matching, but deterministic code owns the final merge rules.

### 4. Validate

Blocking checks include:

- every published element has source evidence;
- every relationship has resolvable source/target stable keys;
- duplicate stable keys are resolved;
- conflicting definitions are resolved/waived;
- relationship type is allowlisted;
- low-confidence/inferred material topology is reviewed according to policy;
- exact source commit set is known.

### 5. Publish

Only the application can publish a baseline. Model output itself can never publish it.

A published baseline is immutable and fingerprinted.

## Incremental ingestion

For speed, a new run should preferentially send only changed Markdown files to the model. However publication always creates a coherent complete baseline.

```text
previous baseline AB-8
+ changed files at new commits
+ unchanged normalized objects carried forward only if source fingerprints still match
-> reconcile complete graph
-> validate
-> publish AB-9
```

Deletion/rename of a source file must not silently preserve obsolete current topology.

## Views

Views are projections over elements and relationships, not the system of record.

Useful P0 views:

```text
BUSINESS_PROCESS
APPLICATION_COOPERATION
SYSTEM_CONTEXT
INFORMATION_STRUCTURE
IMPLEMENTATION_IMPACT
CUSTOM
```

A Git repo may contain view descriptions/diagrams; ingestion may preserve them as source-derived views. Req Helper can also generate runtime views from the graph for a Delivery Subject.

Example application cooperation view:

```text
Customer Verification capability
          |
       REALIZES
          v
      Customer MDM
          |
        EXPOSES
          v
      Customer API
       /        \
   CONSUMES   CONSUMES
     /            \
Mobile App   Onboarding Engine
```

## Delivery Subject architecture context

A subject pins an exact baseline:

```text
DeliverySubjectArchitectureContext
  architectureBaselineId
  architectureBaselineVersion
  baselineFingerprint
  status = CURRENT | STALE_BASELINE
```

The architecture baseline belongs in the authoritative OpenCode context envelope whenever the current task depends on system/application impact.

Do not dump the full graph into every prompt. Retrieve a bounded neighborhood around capabilities, processes, concepts, systems or requirements relevant to the current task.

## Requirement -> architecture impact

A requirement may affect one or many current architecture elements.

```text
RequirementArchitectureImpact
  requirementId + requirementRevision
  architectureBaselineId/version
  architectureElementKey
  impactType
  rationale
  confidence
  sourceRelationshipIds
  status
```

Impact types:

```text
IMPLEMENT
MODIFY
ADAPT
CONSUME
PROVIDE
CONFIGURE
MIGRATE
DEPRECATE
VERIFY_ONLY
NO_CHANGE
```

Example:

```text
Requirement R-17
"Stale verification state must fail closed"

Customer MDM       VERIFY_ONLY   source semantics
Customer API       MODIFY        freshness/error contract
Onboarding Engine  MODIFY        fallback behavior
Mobile App         VERIFY_ONLY   consumer behavior
```

AI may propose these impacts. A human architecture/system perspective confirms or rejects material impacts.

## Architecture proposed change

Impact is not identical to future architecture design.

When the Delivery Subject explicitly proposes changing the architecture structure itself, persist `ArchitectureChangeProposal`:

```text
ADD/MODIFY/REMOVE/DEPRECATE/NO_CHANGE
```

Targets may be an element or relationship in the pinned baseline.

Examples:

```text
MODIFY application.customer-api
ADD API customer-verification-status
ADD relationship customer-api SERVES customer-verification
```

These remain PROPOSED. Req Helper does not rewrite the source Git repository in P0 and does not mark them CURRENT at handoff.

## Current vs proposed

The same temporal rule used by requirements applies to architecture:

```text
CURRENT ARCHITECTURE BASELINE
         |
         | exact baseline version
         v
Delivery Subject
         |
         +-- requirement impacts
         +-- architecture change proposals
         |
         v
READY/HANDED_OFF future change set
         |
         X no automatic source-Git modification
```

If downstream delivery later reconciles the architecture repo, a future ingestion sees those committed Markdown changes and publishes a new CURRENT architecture baseline.

## Work-package routing

Work packages must not be routed from an unconstrained model guess.

Confirmed `RequirementArchitectureImpact` records provide implementation targets.

`WorkPackageImplementationTarget` links:

```text
WorkPackage
 -> RequirementArchitectureImpact
 -> ArchitectureElement
 -> optional REPOSITORY element
 -> optional TEAM element
```

A typical traversal is:

```text
requirement
 -> affected capability/process/concept
 -> application service/component
 -> API/event/data object
 -> REPOSITORY
 -> TEAM
```

Not every architecture impact means code change. `VERIFY_ONLY` is deliberately distinct.

## Requirement Profile architecture policy

Architecture completeness varies by subject/profile. A versioned architecture policy can require:

- published architecture baseline;
- confirmed impact for every HIGH/CRITICAL requirement;
- implementation target for every HIGH/CRITICAL requirement;
- whether `NEEDS_REVIEW` architecture elements/relationships may drive an impact.

This makes architecture routing part of the configurable **requirements for requirements**, not a hard-coded rule for every possible Delivery Subject.

## Readiness

When the pinned Requirement Profile architecture policy requires it, READY blocks if:

- no architecture baseline is pinned;
- the subject baseline is stale;
- a HIGH/CRITICAL requirement lacks a current-revision confirmed architecture impact;
- an impact itself targets a stale baseline;
- a material impact depends on disallowed `NEEDS_REVIEW` topology;
- a HIGH/CRITICAL requirement lacks a work-package implementation target.

## UI

Add an **Architecture Impact** workspace.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Architecture impact                 Baseline AB-9 · CURRENT         │
├───────────────────────────────┬──────────────────────────────────────┤
│ CURRENT TOPOLOGY              │ PROPOSED IMPACT                      │
│                               │                                      │
│ Customer Verification         │ R-17                                 │
│       |                       │ Customer API      MODIFY   [Confirm] │
│       v                       │ Customer MDM      VERIFY   [Confirm] │
│ Customer MDM                  │ Onboarding        MODIFY?  [Review]  │
│       |                       │                                      │
│       v                       │ Architecture change                  │
│ Customer API                  │ + freshness/error semantics          │
│   /       \                   │                                      │
│ Mobile   Onboarding           │ [Show source] [Show requirement]     │
└───────────────────────────────┴──────────────────────────────────────┘
```

Every node/edge supports **Show source**, revealing repository, commit, Markdown path and evidence mode.

A Delivery Lead/architect can correct a proposed impact without editing the underlying architecture baseline.

## assistant-ui use

Use known Tool UI for authoritative actions:

- `ArchitectureImpactProposalCard`;
- `ConfirmArchitectureImpact`;
- `ArchitectureSourceEvidenceCard`;
- `ArchitectureChangeProposalCard`;
- `ArchitectureIngestionFindingCard` for admin/war-room review.

Use constrained Generative UI for read-only/advisory visualizations such as:

- system context view;
- application cooperation view;
- requirement impact neighborhood;
- change-set comparison.

Generated visual composition never mutates architecture truth directly.

## P0 source boundary

In scope:

- Git Markdown architecture repositories;
- exact-commit scanning;
- LLM-assisted extraction;
- deterministic reconciliation/validation;
- human review of ambiguous/inferred topology;
- published normalized architecture baselines;
- requirement impact and work-package routing;
- current-vs-proposed architecture changes.

Explicitly out of scope:

- Sparx ingestion;
- direct Sparx synchronization;
- automatic write-back to architecture Git repositories;
- full ArchiMate language coverage;
- replacing existing architecture repositories;
- automatic promotion of proposed architecture after delivery.
