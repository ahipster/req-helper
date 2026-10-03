# Future improvements after the P0 vertical slice

These are intentionally deferred so the one-week PoC can finish around the trust-critical core. They are important, but they do not need to expand the first implementation slice.

## P1 — Architecture identity continuity across baselines

Current P0 stable-key rules prevent silent merges, but a mature lifecycle should explicitly represent identity evolution across architecture baseline versions:

```text
SAME_AS
RENAMED_FROM
MOVED_FROM
MERGED_INTO
SPLIT_FROM
REPLACED_BY
REMOVED
```

This avoids interpreting a source-file rename as an architecture delete+add and improves long-running Delivery Subject rebasing.

Likely additions:

- stable architecture object identity separate from source path;
- baseline-version identity events;
- rename/move detection using Git history plus human confirmation;
- explicit merge/split lineage.

## P1 — Persist reconciliation decisions across ingestion runs

When an architect resolves an ingestion ambiguity, the next ingestion should reuse that decision rather than ask again.

Example:

```text
ArchitectureReconciliationDecision
  source identities[]
  resolution = SAME | DIFFERENT | ALIAS | REPLACED_BY
  decidedBy
  rationale
  validFromBaseline
```

This becomes deterministic input to later reconciliation before model-assisted alias suggestions.

## P1 — Whole-package approval / maker-checker policy

P0 distinguishes deterministic `READY` from immutable package publication, but it does not yet require a configurable multi-human approval matrix before publication.

Potential lifecycle:

```text
READY
 -> APPROVAL_PENDING
 -> APPROVED_FOR_HANDOFF
 -> PUBLISHED PACKAGE
 -> HANDED_OFF
```

Requirement Profile could define:

- required approver roles/perspectives;
- whether proposer and final approver must differ;
- minimum approvals;
- rejection/rework behavior;
- exceptional waiver governance.

This is especially relevant for regulated/high-risk changes but should not make all PoC subjects heavyweight.

## P1 — Requirement applicability and effective scope

Two requirements may appear contradictory while applying to different contexts. Add explicit applicability dimensions where needed:

```text
legal entity
jurisdiction
product/service
customer segment
channel
process variant
effectiveFrom
effectiveUntil
```

Matching/conflict detection should consider applicability before declaring a contradiction.

Avoid creating a universal taxonomy prematurely; Requirement Profiles can specify which applicability dimensions matter for each subject kind.

## P1 — Reproducible dependency/build inputs

The current PoC intentionally uses `latest` dependencies and `npm install`. Before production hardening:

- pin dependency versions;
- commit a lockfile;
- use `npm ci` in CI;
- pin Node/runtime versions;
- add dependency/SBOM/security scanning according to bank standards.

This improves deterministic rebuilds and supply-chain auditability.

## P1/P2 — Enterprise source permission synchronization

P0 models `SourceAccessPolicy` and applies deny-by-default backend filtering. A broader rollout should integrate policies with authoritative enterprise identity/entitlement sources rather than manually maintained audience refs.

Possible sources:

- repository/team permissions;
- enterprise IAM groups;
- document classification/DLP metadata;
- service catalogue ownership/access metadata.

Do not copy source permissions into an independent long-lived shadow IAM model without synchronization semantics.

## P2 — Post-delivery reconciliation / baseline promotion

After downstream implementation and deployment, add an explicit reconciliation process that can update current enterprise baselines only with delivery evidence.

```text
HandoffPackage vN
 -> downstream implementation/deployment evidence
 -> reconcile actual delivered state
 -> publish new requirement/knowledge/architecture baseline versions
 -> mark old current versions superseded
 -> re-evaluate active Delivery Subjects pinned to older baselines
```

This remains deliberately outside Req Helper P0.

## P2 — Sparx ingestion

Sparx remains out of the first PoC. If required later, implement it as another source ingestion path into the same normalized architecture baseline semantics rather than coupling Req Helper domain logic to Sparx packages/views.

The Git/LLM path remains useful even if Sparx is added because the two sources can have different coverage and freshness.
