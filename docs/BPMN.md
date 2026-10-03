# BPMN-Style Workflow

Req Helper uses persisted Firestore state/tasks plus deterministic application services. OpenCode performs bounded reasoning/tool work; there is no suspended generic workflow engine.

## End-to-end process

```text
(Start)
   |
[Create Delivery Subject + SourceArtifacts]
   |
[Classify subject kind]
   |
[Suggest/select PUBLISHED Requirement Profile]
   |
[Pin exact profile version + architecture policy]
   |
[Clarify problem / outcome / scope / constraints / success]
   |
[Resolve membership/access]
   |
[Discover CURRENT enterprise requirements + knowledge]
   |
<Profile requires architecture?>
   | YES
   v
[Pin PUBLISHED ArchitectureBaseline exact version/fingerprint]
   |
[Retrieve bounded current topology around relevant capabilities/processes/concepts]
   |
   +-------------------------+
   | NO                      |
   +-------------------------+
             |
[Discover ACTIVE proposals from other Delivery Subjects]
   |
[Create RequirementMatch candidates]
   |
[OpenCode proposes perspectives + initial requirement change operations]
   |
[Delivery Lead confirms required perspectives]
   |
[Assign OWNER/DELEGATE/CONTRIBUTOR/REVIEWER]
   |
<Parallel required-perspective work>
   |
   +--> [Create targeted Task: OPEN]
   |       |
   |     [Participant opens -> IN_PROGRESS]
   |       |
   |     [Human answer persisted -> ANSWERED]
   |       |
   |     [OpenCode begins -> PROCESSING]
   |       |
   |     [Extract Contribution/Evidence]
   |       |
   |     [Propose/update subject Requirement]
   |       |
   |     [Find CURRENT + ACTIVE matches if semantics changed]
   |       |
   |     [Classify CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE]
   |       |
   |     [Evaluate pinned Requirement Profile]
   |       |
   |     <Architecture impact required/relevant?>
   |        | YES -> [Query bounded pinned topology]
   |        |         -> [Propose RequirementArchitectureImpact]
   |        |         -> [Create review/confirmation task when material]
   |        | NO
   |       |
   |     [Propose Gap/Assumption/Conflict/Decision tasks]
   |       |
   |     [Validate authz/schema/subject revision/all baseline versions/idempotency]
   |       |
   |     [Firestore transaction + Revision/Source/Proposal/Match/Finding/Impact/Event]
   |       |
   |     <Needs another human?>
   |        | YES -> [WAITING_ON_OTHER + related task]
   |        | NO  -> [COMPLETED]
   |
<Join when required perspectives converge enough>
   |
[Cross-perspective + cross-subject synthesis]
   |
[Detect gaps / assumptions / N-party conflicts / proposal collisions]
   |
<Requirement/knowledge/architecture baseline stale?>
   | YES -> [Compare/rebase/reassess affected proposals + impacts] -> relevant stage
   |
  NO
   v
<Blocking issues/profile findings/matches/architecture impacts?>
   | YES
   v
[Create VERIFY / FILL_GAP / REVIEW_MATCH / REVIEW_IMPACT / RESOLVE_CONFLICT / DECIDE tasks]
   |
[Human verification / impact confirmation / match review / positions / decisions]
   |
[Reassess requirements/change operations/architecture impacts]
   +-----------------------------> [Cross-perspective synthesis]
   |
   NO / resolved
   v
[Create WorkPackages from proposed change set]
   |
[Route packages through CONFIRMED RequirementArchitectureImpact]
   |
[Create WorkPackageImplementationTarget -> architecture element -> repo/team where current topology supports it]
   |
[Create Dependencies]
   |
[Generate requirement/package/subject acceptance + evals]
   |
[Run deterministic readiness]
   |
<READY?> -- NO --> [Create targeted blocker tasks] --> relevant stage
   |
  YES
   v
[FINAL_REVIEW task]
   |
[Publish JSON + Markdown + read-only CHANGE-SET API]
   |
[HANDED_OFF — current catalogue/knowledge/architecture Git remain unchanged]
   |
(Downstream SDLC implements/deploys; later reconciliation is outside P0)
```

## Architecture ingestion subprocess — admin/backend, separate from participant threads

```text
[Configured Git Markdown architecture sources]
   |
[Resolve exact source commits]
   |
[Enumerate + fingerprint Markdown files]
   |
[Deterministic front-matter/link hints]
   |
[LLM extract per bounded document]
   |   elements / relationships / views / unresolved refs
   |
[Deterministic cross-file reconcile]
   |   stable IDs / endpoints / duplicates / conflicts
   |
[Persist ArchitectureIngestionFinding]
   |
<Blocking findings?> -- YES --> [Human/admin review + resolve/waive] -> reconcile/validate
   |
  NO
   v
[validateArchitectureForPublication]
   |
<PUBLISHABLE?> -- NO --> stop
   |
  YES
   v
[Backend publishes immutable ArchitectureBaseline]
```

The LLM never publishes a baseline or silently merges similarly named systems.

## Requirement-to-architecture impact subprocess

```text
[Current proposed Requirement revision]
   |
[Load pinned ArchitectureBaseline]
   |
[Query bounded topology around capability/process/concept/system refs]
   |
[OpenCode assess-architecture-impact]
   |
[Propose RequirementArchitectureImpact]
   |
[Show traversal + Git source evidence]
   |
<Human review>
   +-- CONFIRM -> usable for routing
   +-- CORRECT -> update proposal/re-run bounded analysis
   +-- REJECT  -> not usable for routing
```

Impact types include `IMPLEMENT`, `MODIFY`, `ADAPT`, `CONFIGURE`, `MIGRATE`, `DEPRECATE`, `VERIFY_ONLY`, `NO_CHANGE`, etc. `VERIFY_ONLY` must not be converted into a code-change target.

## Architecture structural-change subprocess

```text
[Confirmed requirement impact suggests topology itself changes]
 -> ArchitectureChangeProposal
      ADD | MODIFY | REMOVE | DEPRECATE | NO_CHANGE
 -> human review
 -> stays PROPOSED through READY/HANDED_OFF
```

There is no P0 write-back to architecture Git. A later delivered Git change may be ingested as a new CURRENT ArchitectureBaseline.

## Existing-requirement matching subprocess

```text
[Potential requirement/change]
   |
[derive type + capability/context refs]
   |
+----------------------+----------------------+
| search CURRENT       | search ACTIVE        |
| requirement catalogue| subject proposals    |
+----------------------+----------------------+
            |
[rank candidates]
            |
[DUPLICATE / OVERLAPS / CONTRADICTS / RELATED]
            |
[persist RequirementMatch]
            |
<blocking ambiguity?> -- YES --> [human review task]
            |
           NO / resolved
            v
[classify CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE]
```

The model's similarity score is evidence, not authority.

## Baseline staleness subprocess

Requirement:

```text
proposal pins REQ-248 v6
 -> catalogue advances to v7
 -> STALE_BASELINE
 -> compare/rebase/reassess matches/conflicts/profile/impacts
```

Knowledge uses source version/fingerprint.

Architecture:

```text
subject pins ArchitectureBaseline AB-9 v9
 -> current published architecture advances to AB-10 v10
 -> DeliverySubjectArchitectureContext = STALE_BASELINE
 -> mark/reassess dependent architecture impacts/change proposals
 -> re-query current topology
 -> human re-confirms material impacts
```

## Requirement Profile subprocess

Initial pin:

```text
subject kind/context
 -> suggest PUBLISHED profile
 -> Delivery Lead confirms
 -> pin profileId/version
 -> load architecture policy
 -> create required perspectives
 -> evaluate initial findings
```

If architecture policy requires baseline/impact/implementation targets, those become deterministic readiness obligations.

Profile upgrade remains explicit: compare versions, preview new/removed requirement and architecture findings, then keep or upgrade with audit event.

## Human task subprocess

```text
OPEN -> IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED
                     \-> WAITING_ON_OTHER -> IN_PROGRESS
Any nonterminal -> CANCELLED
```

Human answer is persisted before OpenCode invocation.

## Verification / requirement edit subprocess

Requirement verification always targets exact current proposal revision and appropriate OWNER/DELEGATE authority.

A semantic requirement edit:

```text
edit
 -> authorize + revision check
 -> append RequirementRevision / RequirementSource
 -> old verification/acceptance/evals become stale for readiness
 -> re-run relevant requirement matching
 -> evaluate profile
 -> if semantics/capabilities changed and architecture is required:
      re-run targeted architecture impact analysis
 -> reassess conflicts/gaps
 -> event
```

No current baseline is mutated.

## N-party conflict subprocess

Conflicts may reference current baselines, proposed requirements, other Delivery Subjects, knowledge or architecture impact positions. Participants use independent AgentThreads; named human records Decision/source correction.

## Work-package subprocess

```text
[Converged proposed changes]
 -> create WorkPackage grouping
 -> attach Requirement IDs/change refs
 -> link CONFIRMED architecture impacts
 -> create WorkPackageImplementationTarget
 -> include repository/team only if normalized topology supports the link
 -> dependencies
 -> package acceptance/evals
```

## Readiness subprocess

Blocking checks include:

- outcome/profile/profile findings;
- explicit requirement change classification;
- stale requirement baseline/unreviewed collisions;
- required perspectives/verification/provenance;
- no blocking gaps/conflicts/assumptions/dependencies/tasks;
- current acceptance/evals;
- when architecture policy requires it:
  - architecture baseline pinned/current;
  - no stale architecture impacts/change proposals;
  - confirmed current-revision impacts for HIGH/CRITICAL requirements;
  - trusted/reviewed topology behind confirmed impact when configured;
  - concrete implementation target when configured.

Any failed blocker -> NOT_READY. Score is informational.

## OpenCode recovery/context subprocess

```text
Task processing
 -> acquire thread lease
 -> resolve/recreate session
 -> FULL hydrate when subject context stale
 -> include profile + exact CURRENT requirement/knowledge baselines
 -> include architecture baseline identity + bounded relevant topology
 -> include PROPOSED requirements/knowledge/architecture state
 -> run OpenCode
 -> before mutation re-read all relevant baseline versions
 -> validate/apply commands
 -> persist domainRevisionAtEnd separately
 -> release lease
```

## Delivery Subject states

```text
DRAFT -> DISCOVERING -> DRILLING -> RESOLVING -> SPLITTING -> READY -> HANDED_OFF
                         ^             |
                         +-------------+
```

`HANDED_OFF` means change set delivered downstream. Requirement Catalogue, external knowledge and architecture Git remain unchanged until explicit future reconciliation after delivery.
