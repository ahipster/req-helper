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
[Pin exact profile version]
   |
[Clarify problem / outcome / scope / constraints / success]
   |
[Resolve membership/access]
   |
[Discover CURRENT enterprise requirements + knowledge]
   |
[Discover ACTIVE proposals from other Delivery Subjects]
   |
[Create RequirementMatch candidates]
   |
[OpenCode proposes impacts + perspectives + initial change operations]
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
   |     [Propose Gap/Assumption/Conflict/Decision tasks]
   |       |
   |     [Validate authz/schema/subject revision/baseline version/idempotency]
   |       |
   |     [Firestore transaction + Revision/Source/Proposal/Match/Finding/Event]
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
<Baseline/source stale?> -- YES --> [Compare/rebase/reassess] --> relevant stage
   |
  NO
   v
<Blocking issues/profile findings/matches?>
   | YES
   v
[Create VERIFY / FILL_GAP / REVIEW_MATCH / RESOLVE_CONFLICT / DECIDE tasks]
   |
[Human verification / match review / positions / decisions]
   |
[Reassess proposed requirements/change operations]
   +-----------------------------> [Cross-perspective synthesis]
   |
   NO / resolved
   v
[Identify implementation areas]
   |
[Create WorkPackages + Dependencies from proposed change set]
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
[HANDED_OFF — current catalogue/source remains unchanged]
   |
(Downstream SDLC implements/deploys; later reconciliation is outside P0)
```

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

The model's similarity score is not authority. A profile may require this subprocess before CREATE.

## Baseline staleness subprocess

```text
[Proposal pins REQ-248 v6]
        |
[read current catalogue]
        |
<current still v6?> -- YES --> continue
        |
       NO
        v
[mark STALE_BASELINE]
        |
[compare old baseline -> new baseline]
        |
[rebase proposal / reassess matches + conflicts + profile findings]
        |
[human confirms updated proposal where needed]
```

Knowledge ProposedDiff follows the same flow using source version/fingerprint.

## Requirement Profile subprocess

### Initial pin

```text
[subject kind/context]
 -> suggest PUBLISHED profile
 -> Delivery Lead confirms
 -> pin profileId/version
 -> create required perspectives
 -> evaluate initial profile findings
```

### Requirement evaluation

```text
[proposed Requirement revision changes]
 -> load pinned profile version
 -> validate enabled type + required fields/details
 -> validate capability/provenance requirements
 -> validate acceptance/eval rules
 -> persist/update RequirementQualityFinding records
```

### Upgrade

```text
[new profile version published]
 -> subject remains on old version
 -> [Compare versions]
 -> preview added/removed findings
 -> Delivery Lead chooses keep or explicit upgrade
 -> upgrade audit event + re-evaluation
```

No silent readiness-rule change.

## Human task subprocess

```text
OPEN -> IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED
                     \-> WAITING_ON_OTHER -> IN_PROGRESS
Any nonterminal -> CANCELLED
```

Human answer is persisted before OpenCode invocation. Provider failure leaves retriable durable input.

Special responses:

```text
I don't know
 -> Contribution(UNKNOWN)
 -> route to likely owner/expert

Ask someone
 -> suggest participant
 -> authorized membership/assignment step if needed
 -> create related task
```

## Verification subprocess

```text
[proposed Requirement/Contribution/ProposedDiff needs authority]
 -> identify OWNER/DELEGATE
 -> VERIFY task
 -> render CURRENT baseline + exact PROPOSED target revision + evidence
 -> human VERIFIED / REJECTED / AMENDED
```

Verification means the proposal revision is verified; it does not promote it into CURRENT baseline.

## Requirement edit subprocess

Human Edit and AI proposal use one path:

```text
[edit proposed Requirement]
 -> authorize
 -> compare expected/current subject Requirement revision
 -> append RequirementRevision
 -> update proposed Requirement
 -> persist RequirementSource
 -> invalidate old revision verification/acceptance/evals for readiness
 -> re-run relevant baseline/active-proposal matching
 -> evaluate pinned profile
 -> reassess conflicts/gaps
 -> append DomainEvent
```

No catalogue mutation occurs.

## N-party conflict subprocess

```text
[Conflict detected]
 -> persist 2+ positions
 -> positions may reference CURRENT baseline, subject proposal,
    another active subject proposal or knowledge source
 -> participant-specific tasks
 -> independent AgentThreads capture evidence/position
 -> shared Conflict Workspace aggregates
 -> AI neutral summary/options
 -> named human Decision/source correction
 -> resolve + reassess changes/readiness
```

## Knowledge impact subprocess

```text
[CURRENT KnowledgeReference version/fingerprint]
 -> ProposedDiff ADD/MODIFY/REMOVE/DEPRECATE/UNKNOWN_CHANGE
 -> human confirm/reject/correct
 -> if source changes: STALE_BASELINE -> reassess
```

No external write-back in P0.

## Work-package subprocess

```text
[converged change proposals]
 -> identify implementation areas
 -> create targeted WorkPackages
 -> attach proposed Requirement IDs/change refs
 -> dependencies
 -> package-level acceptance/evals
```

## Readiness subprocess

Blocking checks include:

- problem/outcome;
- published Requirement Profile pinned;
- no blocking OPEN profile finding;
- all active proposed Requirements have change proposals;
- no stale requirement baseline;
- no blocking UNREVIEWED RequirementMatch;
- required perspectives confirmed/owned;
- current proposal revision verified/provenanced;
- no blocking gap/conflict/assumption/dependency/task;
- required impacts/work-package targets/acceptance/evals.

Any failed blocker -> NOT_READY. Score is informational.

## OpenCode recovery/context subprocess

```text
[Task processing]
 -> acquire thread lease
 -> resolve/recreate OpenCode session
 -> FULL hydrate when new/stale subject context
 -> include pinned profile
 -> include CURRENT baseline exact versions
 -> include PROPOSED changes/matches/findings
 -> run OpenCode
 -> record subject revision actually presented
 -> before mutation re-read target + baseline/source versions
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

`HANDED_OFF` means change set delivered downstream. Current Requirement Catalogue / external knowledge remain unchanged until an explicit future reconciliation process after delivery.
