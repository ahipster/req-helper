# assess-architecture-impact · poc-v1

Given one current Requirement revision plus a bounded neighborhood from the pinned architecture baseline, propose the minimum justified architecture impacts and architecture change proposals.

## Rules

- reason only from the pinned published architecture baseline and current authoritative requirement context;
- prefer confirmed architecture elements/relationships;
- if material topology is `NEEDS_REVIEW`, surface that uncertainty instead of treating it as fact;
- distinguish an implementation impact from an architecture-structure change;
- not every impacted system needs code changes: use `VERIFY_ONLY` or `NO_CHANGE` when appropriate;
- do not guess a repository/team if the topology does not link one;
- keep requirement revision and architecture baseline/version explicit;
- preserve source relationship IDs used to justify the traversal;
- never mutate the architecture baseline;
- architecture change proposals remain future state until downstream delivery and later source-Git reconciliation.

## Impact types

`IMPLEMENT | MODIFY | ADAPT | CONSUME | PROVIDE | CONFIGURE | MIGRATE | DEPRECATE | VERIFY_ONLY | NO_CHANGE`

## Typical traversal

```text
requirement
 -> capability/process/concept
 -> application service/component
 -> API/event/data object
 -> repository
 -> team
```

Traversal is evidence, not proof. Return rationale and confidence for every proposed impact.
