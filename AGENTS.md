# AGENTS.md

This repository is a one-week PoC. Optimize for one coherent collaborative vertical slice, not framework completeness.

## Mission

Build an AI-first requirements orchestration system that turns a signal into a traceable **change set over current enterprise requirements/knowledge**.

The system must avoid the common failure mode of generating a parallel pile of requirements that duplicates or contradicts what already exists.

## Canonical sources

When artifacts disagree:

1. `src/domain/schemas.ts` — executable record/enums;
2. `docs/DOMAIN_MODEL.md` — semantic invariants;
3. `src/domain/readiness.ts` — readiness behavior;
4. `docs/PRD.md` / `docs/UI_MOCKUPS.md` / `docs/ASSISTANT_UI_INTERACTIONS.md`;
5. persistence/orchestration/implementation docs.

Fix contradictions immediately; do not preserve legacy fields for convenience.

## Non-negotiable current-vs-proposed rules

1. `requirementCatalog` represents CURRENT accepted requirement identity/version history.
2. `deliverySubjects/{id}/requirements` represents PROPOSED subject-local requirements.
3. Subject workflows never overwrite/promote catalogue versions directly.
4. READY/HANDED_OFF does not mean current baseline changed.
5. Every active subject Requirement must be contextualized by `RequirementChangeProposal`.
6. Change types are exactly: `CREATE | MODIFY | SUPERSEDE | RETIRE | NO_CHANGE`.
7. MODIFY/SUPERSEDE/RETIRE/NO_CHANGE pin exact `baselineRequirementId + baselineVersion`.
8. If current baseline advances, proposal becomes `STALE_BASELINE` until rebased/reassessed.
9. Before CREATE, search current catalogue and active proposals when the pinned profile requires it.
10. Persist duplicate/overlap/contradiction/related judgments as `RequirementMatch`; never hide them inside model reasoning.
11. Blocking UNREVIEWED RequirementMatch prevents READY.
12. Active proposals in other subjects count as possible future collisions.
13. `capabilityRefs` are explicit enterprise links and are not interchangeable with RequirementType.
14. Knowledge ProposedDiff pins source version/fingerprint where available and never writes back automatically in P0.

See `docs/REQUIREMENT_BASELINES_AND_PROFILES.md`.

## Requirement Profile rules

1. `RequirementProfile` is stable identity; `RequirementProfileVersion` is immutable once PUBLISHED.
2. Every Delivery Subject must pin one exact published profile version before READY.
3. A newly published profile version never silently changes an existing subject.
4. Subject upgrade requires explicit compare/preview/commit + audit event.
5. Profile-specific detail fields use typed value definitions, not arbitrary JSON/JavaScript validation.
6. Profile evaluation produces `RequirementQualityFinding` records.
7. Blocking OPEN profile findings prevent READY; WAIVED requires explicit human decision/audit.
8. Profile rules are the fast iteration mechanism for changing the “requirements for requirements”.

## assistant-ui rules

Use assistant-ui as a rich interaction layer, not just chat.

### P0

- normal chat: questions/explanations;
- Tool UI: known domain actions such as requirement match/change, verification, evidence, conflicts, decisions, knowledge diffs and profile gaps;
- form-filling copilot: Scope, Requirement, Decision, WorkPackage and Requirement Profile drafts;
- constrained Generative UI: Bigger Picture, current-vs-proposed, impact, traceability, readiness summaries.

### Experimental

Interactables may be used only for non-authoritative scratch state in P0.

No assistant-ui surface mutates Firestore simply because model state changed. Final action always becomes a typed backend application command with authz/schema/revision/idempotency checks.

See `docs/ASSISTANT_UI_INTERACTIONS.md`.

## Existing architecture invariants

- Firestore domain state is authoritative; OpenCode/session/chat/UI state is not.
- Membership controls subject access; PerspectiveAssignment controls authority.
- Global roles/job titles/expertise hints do not imply perspective authority.
- OWNER/DELEGATE may satisfy authoritative verification; REVIEWER is advisory.
- Human contribution and verification are separate concepts.
- Verification is append-only and revision-bound where applicable.
- RequirementRevision is immutable semantic history.
- RequirementSource is first-class revision-bound provenance.
- Prior-revision verification/acceptance/evals cannot satisfy a newer proposal revision.
- Conflicts are N-party.
- Readiness is deterministic.
- OpenCode is harness/executor, never system of record.
- One active run per AgentThread; different threads may run concurrently.
- OpenCode sessions must be recreatable from Firestore-backed context.
- Large source files live outside Firestore.
- `users/{uid}/taskInbox` is a rebuildable read projection, never task truth.

## Requirement editing discipline

Human form edits and AI proposals use the same service.

A semantic proposal edit must:

1. authorize user/subject/perspective as needed;
2. verify current subject Requirement revision;
3. append RequirementRevision;
4. update current proposed Requirement revision;
5. write RequirementSource records;
6. make old revision Verification/acceptance/evals ineligible;
7. re-evaluate pinned Requirement Profile rules;
8. re-run relevant requirement matching/collision checks when semantics/capabilities changed;
9. reassess dependent conflicts/gaps;
10. append DomainEvent.

## Existing-requirement discovery discipline

When agent proposes a requirement:

```text
extract proposed semantics
 -> determine RequirementType + capability/context refs
 -> retrieve CURRENT catalogue candidates
 -> retrieve ACTIVE proposals in other subjects
 -> classify matches
 -> persist RequirementMatch records
 -> choose/propose CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE
 -> human reviews blocking ambiguity
```

Never default to CREATE just because no subject-local Requirement exists yet.

## OpenCode execution discipline

Every meaningful run:

```text
authorize
 -> persist human message/answer
 -> load authoritative subject state
 -> acquire thread lease
 -> ensure/recreate OpenCode session
 -> build ContextEnvelope
 -> include pinned profile rules
 -> include relevant CURRENT baseline requirements/knowledge
 -> include proposed change operations/matches/profile findings
 -> present authoritative context
 -> invoke OpenCode/tools
 -> validate output
 -> re-read current target/baseline revisions
 -> apply idempotent commands transactionally
 -> persist domainRevisionAtEnd separately
 -> update task/taskInbox
 -> release lease
```

`contextRevisionPresented` means what OpenCode actually saw, not same-run end state.

## Firestore rules of thumb

- Delivery Subject root remains bounded.
- Growing/history/relations use subcollections.
- Catalogue/profile published versions are immutable snapshots.
- Subject proposals never overwrite baseline collections.
- Transactions for invariant-sensitive writes.
- Deterministic idempotency keys for AI mutations.
- Stale subject revisions and stale baseline versions are explicit failures, not last-write-wins.
- Browser reads are membership-aware.

Required subject subcollections now include:

```text
requirements
requirementRevisions
requirementChangeProposals
requirementMatches
requirementQualityFindings
requirementSources
```

in addition to existing tasks/contributions/evidence/verifications/knowledge/conflict/work-package collections.

## Readiness rules added by this model

READY additionally requires:

- published Requirement Profile version pinned;
- no blocking OPEN RequirementQualityFinding;
- every active subject Requirement classified by a change proposal;
- no `STALE_BASELINE` RequirementChangeProposal;
- no blocking UNREVIEWED RequirementMatch.

Existing readiness rules still apply.

## Vertical slice order

1. profile/catalogue schemas + seed data;
2. Delivery Subject profile pinning;
3. baseline/current requirement retrieval;
4. active proposal retrieval + matches;
5. change proposal classification + stale baseline mechanics;
6. assistant-ui Tool UI/form copilot/change-set UI;
7. admin Requirement Profile editor/versioning;
8. membership/perspectives/tasks/taskInbox;
9. OpenCode/Vertex/session recovery;
10. contribution/evidence/revision/provenance/verification;
11. profile evaluator/findings;
12. gaps/assumptions/conflicts/decisions/knowledge diffs;
13. WorkPackages/acceptance/evals;
14. readiness/change-set package;
15. war-room/GCP hardening.

## Required tests before claiming vertical slice works

- PUBLISHED profile content is immutable through normal service path;
- subject pinned to v8 does not silently adopt profile v9;
- explicit profile upgrade produces new findings before commit;
- proposed CREATE with blocking duplicate candidate cannot be READY;
- active proposal contradiction can block readiness;
- MODIFY targets exact baseline version;
- catalogue advance makes proposal STALE_BASELINE;
- stale baseline cannot be READY;
- subject requirement without RequirementChangeProposal cannot be READY;
- blocking profile finding cannot be READY;
- catalogue is unchanged when subject becomes READY/HANDED_OFF;
- current/proposed API/package output remains distinguishable;
- old proposal revision verification/acceptance/eval is stale;
- Reviewer cannot authoritatively verify;
- lost OpenCode session rehydrates with profile + baseline + proposal state;
- same thread serializes, different threads may run concurrently;
- My Work remains a private read projection;
- package traces proposed change back to exact baseline/source versions.

## Validation discipline

Do not claim typecheck/tests pass unless actually run. GitHub Actions must run `npm run typecheck` and `npm test`.

## Definition of done

A realistic signal can be processed by several users into a package that clearly states:

- what current requirements/knowledge were considered;
- which current versions are affected;
- what is CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE;
- what other active proposals collide;
- which Requirement Profile/version defines completeness;
- what evidence/authority/decisions support the proposal;
- how it will be accepted/evaluated;
- why it is READY;
- and that it remains PROPOSED until downstream delivery/reconciliation explicitly promotes current truth.
