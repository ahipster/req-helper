# OpenCode ↔ Firestore State Synchronization

## Purpose

OpenCode owns disposable execution/session state. Firestore owns authoritative collaborative product state. Current external/catalogue baseline and subject-local proposed state must be explicitly separated in every meaningful reasoning run.

Req Helper must remain correct if OpenCode restarts, loses local state, compacts history, or continues after another user/subject changed relevant state.

## State ownership

### Firestore owns

- Delivery Subject lifecycle/scope/revision + pinned Requirement Profile version;
- current Requirement Catalogue metadata/immutable versions mirrored/imported for PoC;
- subject RequirementChangeProposals, RequirementMatches and RequirementQualityFindings;
- memberships/perspectives/assignments/tasks/messages;
- contributions/evidence/verifications;
- proposed requirements/revisions/provenance;
- gaps/assumptions/conflicts/decisions;
- knowledge references/version-pinned ProposedDiffs;
- work packages/acceptance/evals/dependencies/readiness;
- events and AgentThread/AgentRun metadata.

### OpenCode owns transient state only

- provider/model conversation state;
- harness-local history;
- temporary tool context;
- compaction/cache state.

Never replicate `opencode.db` or local files wholesale into Firestore.

## CURRENT versus PROPOSED precedence

Every context envelope labels information explicitly:

```text
CURRENT_BASELINE
  requirement catalogue IDs + exact versions
  external knowledge IDs + versions/fingerprints

SUBJECT_PROPOSED
  RequirementChangeProposals
  proposed Requirement revisions
  ProposedDiffs
  matches/collisions/profile findings
```

OpenCode must never infer that a proposed item is current simply because it appears later in conversation. READY/HANDED_OFF is not baseline promotion.

## Logical AgentThread

Identity:

```text
subjectId + perspectiveId + participantId
```

AgentThread stores recoverable session metadata including `opencodeSessionId`, `sessionGeneration`, lease fields and `contextRevisionPresented`.

`contextRevisionPresented` means the highest Delivery Subject revision whose authoritative **subject** state was actually presented to the current OpenCode session. It does not mean all external baselines can never change independently; baseline versions/fingerprints therefore travel explicitly in the envelope and are revalidated before applying baseline-sensitive commands.

If a run starts at subject revision 41, presents revision 41, and its commands produce subject revision 44, keep:

```text
contextRevisionPresented = 41
```

until revision 44 is actually presented later.

## Run lifecycle

```text
1. authenticate/authorize user and subject
2. persist human message/task answer
3. load Delivery Subject + AgentThread
4. acquire AgentThread lease
5. resolve/recreate OpenCode session
6. load pinned Requirement Profile version
7. load relevant CURRENT requirement catalogue versions
8. load relevant CURRENT knowledge versions/fingerprints
9. load subject PROPOSED changes/matches/findings
10. compare subject revision with contextRevisionPresented
11. build bounded ContextEnvelope
12. persist AgentRun(RUNNING)
13. present labeled context + current message
14. record subject revision actually presented
15. invoke OpenCode / allowlisted tools
16. persist visible assistant output and validate structured output
17. re-read affected subject revisions AND baseline/source versions
18. apply allowed idempotent commands transactionally
19. append revisions/provenance/events/findings as applicable
20. persist domainRevisionAtEnd separately
21. update task/follow-up state
22. finish AgentRun and release lease
```

No domain mutation occurs merely because OpenCode emitted text/UI state.

## Session resolution / hydration

```text
new/recreated session                -> FULL
presented subject revision missing   -> FULL
subject current == presented         -> MINIMAL
subject current != presented         -> FULL in P0
```

Even MINIMAL runs must revalidate exact baseline/source versions before a baseline-sensitive mutation. If a catalogue/source version has advanced, return stale-baseline information instead of applying the old proposal.

## Context envelope

Typical bounded envelope:

```ts
{
  deliverySubject: {
    id,
    revision,
    subjectKind,
    requirementProfileId,
    requirementProfileVersion,
    problemStatement,
    desiredOutcome,
    scopeIn,
    scopeOut,
    constraints,
    successMeasures,
    status
  },
  requirementProfile: {
    id,
    version,
    relevantPerspectiveRules,
    relevantRequirementTypePolicies
  },
  participant: {
    id,
    subjectRoles,
    currentPerspectiveRelationship?
  },
  currentTask?,
  perspective?,

  currentBaseline: {
    requirements: [{ id, version, type, statement, capabilityRefs, details }],
    knowledge: [{ stableKey, version, fingerprint, title }]
  },

  subjectProposed: {
    requirementChanges: [],
    requirements: [],
    requirementSources: [],
    activeVerifications: [],
    knowledgeDiffs: [],
    requirementMatches: [],
    qualityFindings: []
  },

  otherActiveProposals: [],
  contributions: [],
  decisions: [],
  openConflicts: [],
  openGaps: [],
  assumptions: [],
  recentDomainEvents: []
}
```

Retrieve deeper evidence/catalogue history/artifacts through allowlisted tools on demand.

## Prompt precedence

```text
SYSTEM / SKILL INSTRUCTIONS
PINNED REQUIREMENT PROFILE
CURRENT BASELINE (exact versions)
SUBJECT PROPOSED STATE (subject revision N)
OTHER ACTIVE PROPOSALS / COLLISIONS
BOUNDED CONVERSATION CONTINUITY
CURRENT USER MESSAGE
```

Instruction:

> CURRENT BASELINE is current enterprise truth. SUBJECT PROPOSED STATE is not current truth. If session memory conflicts with these labeled authoritative sections, use the supplied sections and surface material discrepancies.

## Human message durability

Persist human input before invoking OpenCode. A provider/harness failure must leave the answer durable/retriable.

## Structured mutation contract

Baseline-sensitive commands include expected versions:

```ts
{
  commandId,
  idempotencyKey,
  expectedDomainRevision,
  operation,
  targetId,
  expectedTargetRevision?,
  expectedBaselineRequirementId?,
  expectedBaselineVersion?,
  expectedKnowledgeVersion?,
  expectedKnowledgeFingerprint?,
  payload,
  provenanceIds
}
```

Before applying:

1. authorize actor/tool;
2. re-read current subject target/domain revision;
3. re-read current baseline/source version when relevant;
4. verify idempotency;
5. reject stale subject or baseline assumptions;
6. validate Zod/domain/profile invariants;
7. commit mutation + revisions/provenance/findings/audit atomically where feasible;
8. recompute rather than last-write-wins when stale.

## Requirement synthesis/matching

Before a new CREATE is accepted when the pinned profile requires existing-requirement search:

```text
candidate semantics
 -> search CURRENT catalogue
 -> search ACTIVE other-subject proposals
 -> persist RequirementMatch candidates
 -> review blocking duplicate/contradiction ambiguity
 -> classify CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE
```

OpenCode may rank/summarize candidates; application/domain state stores the auditable result.

## Requirement edits

Human and AI edits use the same subject-proposal service:

- append RequirementRevision;
- increment proposed Requirement revision;
- attach RequirementSource records;
- invalidate old-revision verification/acceptance/evals for readiness;
- re-evaluate pinned Requirement Profile;
- re-run relevant matching if semantics/type/capabilities changed;
- reassess conflicts/gaps.

Never update Requirement Catalogue merely because the proposal changed or became READY/HANDED_OFF.

## Profile changes

OpenCode/form copilot may edit a DRAFT Requirement Profile version through privileged typed commands. PUBLISHED versions are immutable.

Publishing v9 does not change a subject pinned to v8. Subject upgrade requires explicit compare/preview/commit and then fresh profile evaluation.

## Tools

Read tools may fetch catalogue/knowledge/profile/current subject context. Mutation tools call Req Helper application services:

```text
OpenCode
 -> Req Helper tool/API
    -> authz
    -> schema/profile validation
    -> subject + baseline revision checks
    -> idempotency
    -> Firestore transaction
    -> audit event
```

OpenCode never receives unrestricted Firestore credentials.

## Concurrency / recovery

Same AgentThread is lease-serialized; different threads may run concurrently. Concurrent proposals against the same baseline are allowed as proposals and surfaced as active-proposal matches/collisions.

OpenCode loss/restart:
- product state remains in Firestore;
- run fails/aborts;
- replacement session FULL hydrates current profile/baseline/proposed state.

Backend restart:
- expired leases can be recovered;
- stale RUNNING runs can be abandoned/failed;
- baseline/source versions are re-read before retry.

Duplicate retry uses idempotency keys.

## AgentRun metadata

Persist at least:

```text
runId/threadId/sessionGeneration/opencodeSessionId
participantId/perspectiveId
profileId/profileVersion
domainRevisionAtStart
contextRevisionPresentedBefore
contextRevisionPresentedThisRun
baselineRequirementIdsAndVersions
knowledgeIdsAndVersionsOrFingerprints
hydrationMode
inputObjectIds
skillVersions/provider/model/toolCalls
structuredOutput
proposed/applied/rejectedCommandIds
domainRevisionAtEnd
latency/status/errorCategory
```

Never persist hidden chain-of-thought.

## Required P0 tests

1. lost OpenCode session rehydrates profile + CURRENT baseline + PROPOSED state;
2. another user's subject mutation is presented before next meaningful reasoning step;
3. same-run end revision is not falsely marked presented;
4. baseline requirement version advancing rejects/rebases stale command;
5. knowledge source fingerprint/version advancing rejects stale diff command;
6. CREATE cannot silently bypass required existing/current + active-proposal matching;
7. duplicate retry cannot duplicate revisions/proposals/events;
8. two separate threads run concurrently while same thread serializes;
9. human/visible message history survives OpenCode loss;
10. product correctness does not depend on OpenCode compaction/local persistence.
