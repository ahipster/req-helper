# Admin UI and Role Model

## Purpose

Req Helper Admin configures PoC users, global roles, perspective templates, versioned Requirement Profiles, requirement catalogue reference configuration and Git Markdown architecture ingestion. It is not a full IAM, enterprise requirement repository or architecture authoring tool.

The model separates:

1. global application capability;
2. Delivery Subject membership/access;
3. expertise hints;
4. per-perspective authority;
5. Requirement Profile governance;
6. current requirement catalogue reference/sync configuration;
7. architecture Git source/ingestion/baseline governance.

## 1. Global roles

```text
ADMIN
PARTICIPANT
DELIVERY_LEAD
WAR_ROOM_OPERATOR
```

P0 does not add a new global `ARCHITECTURE_STEWARD` role. “Architecture Steward” is a functional persona; privileged architecture-source configuration/baseline publication uses ADMIN in P0. Global role never implies Delivery Subject perspective authority.

## 2. Delivery Subject membership

```text
SPONSOR
DELIVERY_LEAD
PARTICIPANT
OBSERVER
```

Membership determines access to one subject.

## 3. Perspective authority

```text
OWNER
DELEGATE
CONTRIBUTOR
REVIEWER
```

OWNER/DELEGATE may satisfy authoritative verification/subject impact confirmation for their perspective. REVIEWER remains advisory.

## 4. Expertise hints

`expertisePerspectiveTypes` helps routing/suggestions only.

## 5. Admin root data

```text
users/{userId}
roleTemplates/{roleTemplateId}
perspectiveTemplates/{perspectiveTemplateId}
requirementProfiles/{profileId}
  /versions/{version}
    /architecturePolicies/{policyId}
requirementCatalog/{requirementId}
  /versions/{version}
architectureSources/{sourceId}
architectureIngestionRuns/{runId}
architectureBaselines/{baselineId}
```

Subject membership/assignments/proposals/impacts live under Delivery Subjects.

## 6. Admin Overview

```text
┌────────────────────────────────────────────────────────────────┐
│ Req Helper / Admin                                            │
├────────────────────────────────────────────────────────────────┤
│ Users                    14 active                             │
│ Perspective templates    11                                   │
│ Requirement Profiles      7 published · 2 drafts             │
│ Catalogue requirements  842 current                           │
│ Architecture sources       2 Git Markdown                     │
│ Architecture baseline     AB-9 v9 · PUBLISHED                 │
│ Ingestion findings         2 blocking · 1 review              │
│ Subjects missing owner     2                                   │
│                                                               │
│ [Users] [Perspectives] [Requirement Profiles] [Catalogue]     │
│ [Architecture] [Ownership gaps]                               │
└────────────────────────────────────────────────────────────────┘
```

## 7. Users / role templates / perspectives

Users can be activated/deactivated, assigned global roles and expertise hints. Deactivation preserves history. Perspective templates remain version-independent hints/defaults and do not silently mutate historical Delivery Subjects.

## 8. Requirement Profiles

Requirement Profile is the editable **requirements-for-requirements** contract. Published versions are immutable; edits create a new DRAFT version.

The editor includes requirement quality/matching rules and architecture policy:

```text
API Change · DRAFT v9

Required perspectives
[x] API [x] ARCHITECTURE [x] SECURITY [x] OPERATIONS

INTEGRATION policy
[x] capability link
[x] authoritative provenance
minimum acceptance              [2]
required evals                  [SECURITY_CHECK]

Typed details
Producer          REFERENCE       required
Consumers         REFERENCE_LIST  required
Contract          REFERENCE       required
FailureBehaviour  TEXT            required
Compatibility     ENUM            required

Existing requirement matching
Search before CREATE            [required]
Duplicate threshold             [0.85]
Contradiction review            [required]

Architecture
[x] Require published architecture baseline
[x] Confirm impact for HIGH/CRITICAL requirements
[x] Require implementation target for HIGH/CRITICAL
[ ] Allow NEEDS_REVIEW topology for confirmed impact

[Ask AI to modify draft] [Preview findings] [Publish v9]
```

Policy invariants:

- confirmed-impact requirement implies architecture baseline required;
- implementation-target requirement implies confirmed-impact requirement.

AI/form copilot edits draft state only. Human/admin explicitly publishes.

## 9. Profile publishing / upgrade

Publish validates typed rules, thresholds, field keys and architecture policy invariants. Existing Delivery Subjects remain pinned to their exact prior version.

Profile upgrade preview includes both requirement-quality changes and architecture-policy effects, for example:

```text
DS-123: API Change v8 -> v9

New blockers
+ R-17 missing rollbackBehaviour
+ R-18 now requires PERFORMANCE_TEST
+ R-17 requires confirmed architecture implementation target

[Keep v8] [Upgrade subject]
```

Upgrade is explicit and audited.

## 10. Requirement Catalogue admin/reference view

P0 catalogue is primarily read/reference oriented. Admin may configure/import/sync through backend utilities; subject UI has no direct `Make Current` action.

A Delivery Subject proposal never directly overwrites catalogue records.

## 11. Architecture Sources

P0 architecture source type is only `GIT_MARKDOWN`. Sparx configuration is intentionally absent.

```text
Architecture / Sources

Name                     Repository                         Branch  Paths
Customer architecture    bank/customer-architecture        main    /**/*.md
Integration architecture bank/integration-architecture     main    docs/arch/**

[Add Git source] [Disable source]
```

Source configuration stores repository identifiers/paths only. Credentials/tokens remain in approved backend connector/secret configuration and are never browser-readable Firestore fields.

Admin actions:

- add/disable Git Markdown source;
- set default branch/path prefixes;
- start ingestion;
- inspect resolved exact source commits;
- inspect run/prompt/model/schema metadata.

## 12. Architecture Ingestion

```text
Architecture / Ingestion

Run I-18 · VALIDATING
Sources
 customer-architecture      19ec8f...
 integration-architecture   a78bd2...

Files 84 · changed 7
Prompt ingest-architecture-markdown poc-v1

Findings
BLOCKING  CONFLICTING_DEFINITION  app.customer-api
BLOCKING  UNRESOLVED_REFERENCE    service.customer-query
REVIEW    LOW_CONFIDENCE           rel-441

[Open finding] [Retry] [Validate publication]
```

A finding review shows Git repository, exact commit, Markdown path, excerpt/line when available and EXPLICIT/INFERRED mode.

Admin may resolve/waive a finding with rationale according to PoC governance. The LLM cannot mark a baseline published.

## 13. Architecture Baseline Publication

Publication requires deterministic `validateArchitectureForPublication` to pass plus any required human reviews.

```text
Candidate AB-10 v10
Source commits: 2
Elements: 45
Relationships: 78
Views: 9
Blocking findings: 0

[Compare with AB-9] [Publish AB-10]
```

Publishing creates an immutable ArchitectureBaseline. Previous baseline remains auditable. Publication does not modify source Git.

## 14. Architecture Catalogue/reference view

Signed-in product users can inspect the published normalized baseline, search elements and traverse views. Admin gets additional ingestion/source controls.

Every material normalized node/edge exposes its source evidence and review status.

## 15. Delivery Subject Members and assignments

Subject Delivery Lead/Admin manages access and assignments as previously specified. Architecture ingestion administration is separate from subject authority.

An ADMIN who published architecture baseline is not automatically OWNER for a subject Architecture perspective. Conversely, an Architecture OWNER can confirm subject impacts but cannot configure Git sources/publish architecture baseline unless also ADMIN.

## 16. Permissions

### ADMIN

- manage users/global templates;
- create/edit/publish Requirement Profile versions;
- configure catalogue import/sync where enabled;
- configure architecture Git sources;
- inspect/retry ingestion runs/findings;
- publish validated ArchitectureBaseline;
- administer subject membership/assignments under PoC policy.

### Subject DELIVERY_LEAD

- manage subject membership/assignments;
- confirm perspectives;
- choose/pin published Requirement Profile;
- choose/pin published ArchitectureBaseline when required;
- compare/rebase stale subject architecture context;
- classify/review requirement changes/matches;
- route decisions.

### OWNER/DELEGATE

- authoritative verification for assigned perspective;
- may confirm/reject subject architecture impacts relevant to their perspective/application governance flow;
- no profile/architecture-baseline administration permission.

### WAR_ROOM_OPERATOR

- diagnose/rerun accessible subject harness activity;
- inspect architecture ingestion diagnostics only when also permitted by deployment/admin policy;
- no implicit publishing authority.

### REVIEWER

- advisory comment/challenge/recommendation only.

## 17. User stories

### Admin / Requirement Steward

- maintain versioned Requirement Profiles, typed details, matching rules and architecture policy;
- use form copilot to edit draft quickly;
- publish immutable version;
- inspect which subjects use each version.

### Admin / Architecture Steward persona

- configure Git Markdown architecture sources;
- start/retry ingestion;
- inspect exact commits and model/prompt version;
- review inferred/ambiguous architecture findings;
- validate publication blockers;
- publish an immutable normalized architecture baseline.

### Delivery Lead

- select/pin profile;
- select/pin architecture baseline when required;
- preview new profile/baseline gaps;
- explicitly rebase/upgrade rather than silently changing readiness.

## 18. P0 boundary

Do not implement:

- Sparx ingestion/sync;
- architecture Git write-back;
- full ArchiMate editor;
- HR directory sync/SCIM/nested groups;
- generic policy language;
- automatic requirement/architecture promotion after deployment;
- arbitrary user-defined JavaScript validation.

Requirement Profile and architecture policies use the typed schemas in `src/domain/schemas.ts` and `src/domain/architecture.ts`.
