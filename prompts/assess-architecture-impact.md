# assess-architecture-impact · poc-v2

Given one current Requirement revision, the profile-pinned `ArchitectureTraversalPolicy`, and a caller-authorized bounded neighborhood from the pinned architecture baseline, assess the complete configured impact neighborhood.

The goal is not merely to find one plausible impacted system. The goal is to record which topology candidates were considered and whether every candidate in the configured traversal boundary was assessed.

## Rules

- reason only from the pinned published architecture baseline and current authoritative requirement context;
- reason only over architecture already filtered for the caller's `SourceAccessPolicy`; never infer hidden/unauthorized topology;
- obey the pinned traversal policy ID/version, relationship allowlist, element allowlist and max depth;
- start from explicit seed capability/process/concept/API elements supplied by the application;
- enumerate candidate elements reached within the configured traversal boundary;
- assess every candidate before marking the `ArchitectureImpactAssessment` COMPLETE;
- unresolved candidates remain explicit and prevent COMPLETE status;
- prefer confirmed architecture elements/relationships;
- if material topology is `NEEDS_REVIEW`, surface that uncertainty instead of treating it as fact;
- distinguish an implementation impact from an architecture-structure change;
- not every candidate means code change: use `VERIFY_ONLY` or `NO_CHANGE` where appropriate;
- do not guess a repository/team if the topology does not link one;
- keep requirement revision, architecture baseline/version and traversal policy/version explicit;
- preserve source relationship IDs used to justify the traversal;
- never mutate the architecture baseline;
- architecture change proposals remain future state until downstream delivery and later source-Git reconciliation.

## Impact types

`IMPLEMENT | MODIFY | ADAPT | CONSUME | PROVIDE | CONFIGURE | MIGRATE | DEPRECATE | VERIFY_ONLY | NO_CHANGE`

## Coverage output

Persist/update:

```text
ArchitectureImpactAssessment
  requirementId/revision
  architectureBaselineId/version
  traversalPolicyId/version
  seedElementKeys[]
  candidateElementKeys[]
  assessedElementKeys[]
  unresolvedElementKeys[]
  traversalRelationshipIds[]
  status = IN_PROGRESS | COMPLETE | STALE_BASELINE
```

`COMPLETE` is valid only when:

```text
unresolvedElementKeys = []
AND
candidateElementKeys ⊆ assessedElementKeys
```

A confirmed `RequirementArchitectureImpact` remains a separate human-authorized record. Coverage proves breadth of assessment; impact confirmation proves authority for a specific system/component impact.

## Typical traversal

```text
requirement
 -> capability/process/concept/API seed
 -> application service/component
 -> API/event/data object
 -> direct producer/consumer/dependency neighborhood
 -> repository
 -> team
```

Traversal is evidence, not proof. Return rationale and confidence for every proposed impact and record explicit non-impact dispositions rather than silently dropping candidates.
