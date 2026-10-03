# OpenCode ↔ Firestore State Synchronization

## Purpose

OpenCode owns disposable execution/session state. Firestore owns authoritative collaborative product state. Current requirement/knowledge/architecture baselines and subject-local proposed state must be explicitly separated in every meaningful reasoning run.

Req Helper must remain correct if OpenCode restarts, loses local state, compacts history, or continues after another user/subject or source baseline changed relevant state.

## State ownership

### Firestore owns

- Delivery Subject lifecycle/scope/revision + pinned Requirement Profile version;
- current Requirement Catalogue metadata/immutable versions mirrored/imported for PoC;
- published normalized ArchitectureBaseline metadata/elements/relationships/views;
- ArchitectureIngestionRun/Finding metadata;
- DeliverySubjectArchitectureContext;
- RequirementArchitectureImpact / ArchitectureChangeProposal / WorkPackageImplementationTarget;
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
  architecture baseline ID/version/fingerprint + exact source Git commits

SUBJECT_PROPOSED
  RequirementChangeProposals
  proposed Requirement revisions
  ProposedDiffs
  RequirementArchitectureImpacts
  ArchitectureChangeProposals
  matches/collisions/profile findings
```

OpenCode must never infer that a proposed item is current simply because it appears later in conversation. READY/HANDED_OFF is not baseline promotion.

## Logical AgentThread

Identity:

```text
subjectId + perspectiveId + participantId
```

AgentThread stores recoverable session metadata including `opencodeSessionId`, `sessionGeneration`, lease fields and `contextRevisionPresented`.

`contextRevisionPresented` means the highest Delivery Subject revision whose authoritative **subject** state was actually presented to the current OpenCode session. External requirement/knowledge/architecture baselines can change independently, so their exact versions/fingerprints travel explicitly in the envelope and are revalidated before baseline-sensitive commands.

If a run starts at subject revision 41, presents revision 41, and its commands produce subject revision 44, keep `contextRevisionPresented = 41` until revision 44 is actually presented later.

## Run lifecycle

```text
1. authenticate/authorize user and subject
2. persist human message/task answer
3. load Delivery Subject + AgentThread
4. acquire AgentThread lease
5. resolve/recreate OpenCode session
6. load pinned Requirement Profile version + architecture policy
7. load relevant CURRENT requirement catalogue versions
8. load relevant CURRENT knowledge versions/fingerprints
9. load DeliverySubjectArchitectureContext when relevant
10. query bounded relevant CURRENT architecture neighborhood
11. load subject PROPOSED requirement/knowledge/architecture changes/matches/findings
12. compare subject revision with contextRevisionPresented
13. build bounded ContextEnvelope
14. persist AgentRun(RUNNING)
15. present labeled context + current message
16. record subject revision actually presented
17. invoke OpenCode / allowlisted tools
18. persist visible assistant output and validate structured output
19. re-read affected subject revisions AND requirement/knowledge/architecture baseline versions
20. apply allowed idempotent commands transactionally
21. append revisions/provenance/events/findings as applicable
22. persist domainRevisionAtEnd separately
23. update task/follow-up state
24. finish AgentRun and release lease
```

No domain mutation occurs merely because OpenCode emitted text/UI state.

## Session resolution / hydration

```text
new/recreated session                -> FULL
presented subject revision missing   -> FULL
subject current == presented         -> MINIMAL
subject current != presented         -> FULL in P0
```

Even MINIMAL runs revalidate exact requirement/knowledge/architecture baseline versions before a baseline-sensitive mutation. Stale baseline produces explicit stale state rather than application of old assumptions.

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
    relevantRequirementTypePolicies,
    architecturePolicy?
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
    knowledge: [{ stableKey, version, fingerprint, title }],
    architecture?: {
      id,
      version,
      fingerprint,
      sourceCommits,
      elements: [],
      relationships: [],
      sourceEvidence: []
    }
  },

  subjectProposed: {
    requirementChanges: [],
    requirements: [],
    requirementSources: [],
    activeVerifications: [],
    knowledgeDiffs: [],
    requirementMatches: [],
    qualityFindings: [],
    architectureImpacts: [],
    architectureChanges: [],
    implementationTargets: []
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

The architecture section is always **bounded**. Fetch deeper topology/source evidence through allowlisted architecture tools on demand. Never dump the entire enterprise graph into ordinary subject prompts.

## Prompt precedence

```text
SYSTEM / SKILL INSTRUCTIONS
PINNED REQUIREMENT PROFILE + ARCHITECTURE POLICY
CURRENT BASELINE (exact requirement/knowledge/architecture versions)
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
  expectedArchitectureBaselineId?,
  expectedArchitectureBaselineVersion?,
  expectedArchitectureBaselineFingerprint?,
  payload,
  provenanceIds
}
```

Before applying:

1. authorize actor/tool;
2. re-read current subject target/domain revision;
3. re-read current requirement/knowledge/architecture baseline where relevant;
4. verify idempotency;
5. reject stale subject or baseline assumptions;
6. validate Zod/domain/profile/architecture invariants;
7. commit mutation + revisions/provenance/findings/audit atomically where feasible;
8. recompute rather than last-write-wins when stale.

## Requirement synthesis/matching

Before a new CREATE is accepted when the profile requires existing-requirement search:

```text
candidate semantics
 -> search CURRENT catalogue
 -> search ACTIVE other-subject proposals
 -> persist RequirementMatch candidates
 -> review blocking duplicate/contradiction ambiguity
 -> classify CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE
```

## Requirement edits and architecture impact invalidation

Human and AI edits use the same subject-proposal service:

- append RequirementRevision;
- increment proposed Requirement revision;
- attach RequirementSource records;
- invalidate old-revision verification/acceptance/evals for readiness;
- re-evaluate pinned Requirement Profile;
- re-run relevant matching if semantics/type/capabilities changed;
- when architecture policy requires it, re-evaluate relevant RequirementArchitectureImpact if semantics/capability links changed;
- reassess conflicts/gaps.

Never update Requirement Catalogue or ArchitectureBaseline merely because the proposal changed or became READY/HANDED_OFF.

## Architecture ingestion execution

Architecture ingestion is not an ordinary participant AgentThread. It is a backend/admin workflow with its own ArchitectureIngestionRun.

```text
resolve exact source Git commits
 -> deterministic scan/fingerprint
 -> invoke ingest-architecture-markdown skill per bounded changed document
 -> validate extraction schema
 -> deterministic reconciliation/reference resolution
 -> persist ArchitectureIngestionFinding records
 -> human/admin review where required
 -> backend publish immutable ArchitectureBaseline
```

LLM output cannot publish baseline, overwrite source Git, or silently merge ambiguous stable identities.

## Requirement-to-architecture impact execution

When architecture is relevant:

```text
current proposed Requirement revision
 -> query bounded topology around capabilities/process/concepts/systems
 -> present exact baseline/version + source-grounded edges
 -> invoke assess-architecture-impact skill
 -> validate RequirementArchitectureImpact proposals
 -> human confirm/reject/correct
 -> create WorkPackageImplementationTarget from confirmed impacts
```

OpenCode must not invent repository/team routing when the normalized current topology lacks the link.

## Profile changes

OpenCode/form copilot may edit a DRAFT Requirement Profile version through privileged typed commands. PUBLISHED versions are immutable.

Publishing a new profile version does not alter existing subjects. Subject upgrade explicitly compares/re-evaluates both requirement-quality and architecture-policy effects.

## Tools

Read tools may fetch catalogue/knowledge/profile/current subject/architecture context. Mutation tools call Req Helper application services:

```text
OpenCode
 -> Req Helper tool/API
    -> authz
    -> schema/profile/architecture validation
    -> subject + baseline revision checks
    -> idempotency
    -> Firestore transaction
    -> audit event
```

OpenCode never receives unrestricted Firestore or Git credentials.

## Concurrency / recovery

Same AgentThread is lease-serialized; different threads may run concurrently. Concurrent subject proposals against same baselines are allowed as proposals and surfaced as collisions.

Architecture ingestion runs should not publish two conflicting current baselines concurrently; baseline publication uses a current-pointer/version compare-and-set in application logic.

OpenCode loss/restart:
- product state remains in Firestore;
- run fails/aborts;
- replacement session FULL hydrates current profile/baselines/proposed state.

Backend restart:
- expired leases can be recovered;
- stale RUNNING runs can be abandoned/failed;
- requirement/knowledge/architecture baseline versions are re-read before retry.

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
architectureBaselineId/version/fingerprint
architectureInputElementAndRelationshipIds
hydrationMode
inputObjectIds
skillVersions/provider/model/toolCalls
structuredOutput
proposed/applied/rejectedCommandIds
domainRevisionAtEnd
latency/status/errorCategory
```

Never persist hidden chain-of-thought.

ArchitectureIngestionRun separately records source commits, prompt/schema/model versions and ingestion-stage diagnostics.

## Required P0 tests

1. lost OpenCode session rehydrates profile + CURRENT requirement/knowledge/architecture baseline + PROPOSED state;
2. another user's subject mutation is presented before next meaningful reasoning step;
3. same-run end revision is not falsely marked presented;
4. requirement baseline advancement rejects/rebases stale command;
5. knowledge source fingerprint/version advancement rejects stale diff command;
6. architecture baseline advancement marks dependent context/impact stale when required;
7. architecture impact command with wrong expected baseline cannot apply;
8. CREATE cannot silently bypass required requirement matching;
9. model cannot publish ArchitectureBaseline;
10. every published architecture element/relationship has source evidence;
11. unresolved architecture relationship endpoint prevents publication;
12. confirmed impact cannot rely on disallowed NEEDS_REVIEW topology;
13. model cannot fabricate confirmed repo/team routing without topology;
14. duplicate retry cannot duplicate revisions/proposals/events;
15. two separate threads run concurrently while same thread serializes;
16. human/visible message history survives OpenCode loss;
17. product correctness does not depend on OpenCode compaction/local persistence.
