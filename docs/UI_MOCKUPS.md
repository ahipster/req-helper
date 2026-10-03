# UI Mockups

The UI is task-oriented and change-oriented. Chat is one interaction surface; current baseline, proposed changes and structured state are always visible.

assistant-ui usage is defined in `docs/ASSISTANT_UI_INTERACTIONS.md`.

## Global navigation

```text
Req Helper | My Work | Delivery Subjects | Requirement Catalogue | Architecture | Admin* | War Room*
                                                                             * permission-gated
```

## 1. My Work

```text
┌─────────────────────────────────────────────────────────────────────┐
│ My Work                                              Alice Example │
├─────────────────────────────────────────────────────────────────────┤
│ NEEDS YOU                                                          │
│ Customer verification · Architecture · BLOCKING                    │
│ Confirm impact on Customer API                        [Continue]   │
│                                                                     │
│ PROCESSING                                                         │
│ Payment change · answer saved, AI processing                       │
│                                                                     │
│ WAITING ON OTHER                                                   │
│ Conflict C-17 · DS-119 and DS-123 disagree            [Open]       │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. New Signal

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Start Delivery Subject                                             │
├─────────────────────────────────────────────────────────────────────┤
│ What are we trying to change?                                      │
│ [ natural-language signal                                        ] │
│                                                                     │
│ Source material [Add link] [Upload document]                       │
│                                                                     │
│ AI suggests                                                        │
│ Subject kind: API_CHANGE                                           │
│ Requirement Profile: API Change v8                                 │
│ Architecture policy: baseline + confirmed impact required          │
│ [Change profile]                                                   │
│                                                   [Start discovery] │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Discovery — existing truth first

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Existing truth likely affected                                     │
├─────────────────────────────────────────────────────────────────────┤
│ REQUIREMENTS                                                       │
│ 0.93 REQ-248 v6 · Verification status exposure        CURRENT      │
│ 0.78 REQ-301 v8 · Customer API authorization           CURRENT      │
│                                                                     │
│ KNOWLEDGE                                                          │
│ Customer Verification concept v3                     CURRENT      │
│ Customer API contract 2.7                           CURRENT      │
│                                                                     │
│ ARCHITECTURE · AB-9 v9                               CURRENT      │
│ Customer Verification -> Customer MDM -> Customer API              │
│ Customer API -> Mobile / Onboarding                                │
│ source commits: arch/customer@19ec8f · arch/integration@a78bd2      │
│ [Open architecture neighborhood]                                   │
│                                                                     │
│ ACTIVE PROPOSAL COLLISION                                          │
│ DS-119 also proposes MODIFY REQ-248 v6                 [Compare]   │
└─────────────────────────────────────────────────────────────────────┘
```

The workflow does not start from an empty requirements list or an LLM guess about systems.

## 4. Clarify Scope — form copilot

```text
┌─────────────────────────────────────────────────────────────────────┐
│ AI interpretation                                     [Accept]     │
├─────────────────────────────────────────────────────────────────────┤
│ Problem       Downstream channels cannot...                         │
│ Outcome       Channels consume agreed verification state           │
│ In scope      semantics · distribution · failure behavior           │
│ Out of scope  implementation/deployment                             │
│ Constraints   security policy · current API contract                │
│ Success       verified implementation-ready change set              │
│                                                                     │
│ Copilot: "Tell me what to correct and I will update the draft."    │
│ [ message... ]                                       [Apply draft] │
└─────────────────────────────────────────────────────────────────────┘
```

## 5. Delivery Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Customer verification                            DRILLING · NOT READY  │
│ API_CHANGE · Requirement Profile API Change v8                         │
│ Architecture AB-9 v9 · CURRENT                                         │
├───────────────────┬────────────────────────────┬────────────────────────┤
│ CURRENT IMPACT    │ PROPOSED CHANGE SET        │ BLOCKERS               │
│ Req baseline 3    │ MODIFY 2                   │ 1 profile gap          │
│ Knowledge 4       │ CREATE 1                   │ 1 collision            │
│ Arch elements 5   │ Arch impacts 4             │ 1 unconfirmed impact   │
│                   │ Arch changes 1             │ 1 conflict · 2 tasks   │
├───────────────────┴────────────────────────────┴────────────────────────┤
│ Profile v8 · [Compare newer v9] · [Architecture impact]               │
└─────────────────────────────────────────────────────────────────────────┘
```

## 6. Drill Workspace — rich assistant-ui

```text
┌────────────────┬────────────────────────────────────┬──────────────────┐
│ YOUR FOCUS     │ CONVERSATION / TOOL UI             │ CURRENT STATE    │
│                │                                    │                  │
│ Architecture   │ AI: This modifies REQ-248 and      │ REQ-248 v6       │
│ 3 tasks        │ appears to affect Customer API.    │ R-17 rev3        │
│                │                                    │ AB-9 v9          │
│                │ ╭─ Architecture impact ─────────╮  │                  │
│                │ │ Customer API · MODIFY        │  │ Source topology  │
│                │ │ via API -> MDM dependency    │  │ 4 elements       │
│                │ │ confidence 0.91              │  │ 3 relationships  │
│                │ │ [Confirm] [Correct] [Source] │  │                  │
│                │ ╰──────────────────────────────╯  │                  │
│                │ [ message composer ]              │                  │
├────────────────┴────────────────────────────────────┴──────────────────┤
│ [I don't know] [Ask someone] [Show bigger picture]                    │
└────────────────────────────────────────────────────────────────────────┘
```

Known domain actions render assistant-ui Tool UI. Free-form chat is not the authoritative editor.

## 7. Review existing requirement match — Tool UI

```text
╭─ Existing requirement match ─────────────────────────────────────╮
│ Candidate: REQ-248 v6 · CURRENT                                 │
│ Relationship suggested: OVERLAPS                                │
│ Score: 0.93                                                     │
│ Same capability: Customer Verification                          │
│ Same API: Customer API                                          │
│                                                                 │
│ AI suggestion: MODIFY existing rather than CREATE               │
│                                                                 │
│ [Use as baseline] [This is genuinely new] [Related only]        │
╰─────────────────────────────────────────────────────────────────╯
```

## 8. Requirements / Change Set

```text
[Proposed changes] [Affected current] [All]

┌───────────┬─────────────────────────┬─────────────────────┬──────────┐
│ CHANGE    │ BASELINE                │ PROPOSAL            │ STATUS   │
├───────────┼─────────────────────────┼─────────────────────┼──────────┤
│ MODIFY    │ REQ-248 v6              │ R-17 rev3           │ VERIFIED │
│ CREATE    │ —                       │ R-18 rev2           │ PROPOSED │
│ RETIRE    │ REQ-104 v2              │ —                   │ DRAFT    │
│ NO_CHANGE │ REQ-301 v8              │ —                   │ VERIFIED │
└───────────┴─────────────────────────┴─────────────────────┴──────────┘
```

## 9. Requirement Detail — current vs proposed

```text
╭─ REQ-248 · Verification status exposure ──────────────────────────╮
│ CURRENT BASELINE v6                 PROPOSED DS-123 / R-17 rev3  │
│                                                                  │
│ Customer API exposes status.       Customer API exposes current  │
│                                    verification state.           │
│ No freshness requirement.          Stale state fails closed.     │
│                                                                  │
│ Capability: Verification           Verification + Operations      │
│                                                                  │
│ Current state: CURRENT              Change: MODIFY                │
│                                    Proposal: VERIFIED            │
├──────────────────────────────────────────────────────────────────┤
│ Architecture impact · AB-9 v9                                  │
│ Customer API       MODIFY      CONFIRMED                        │
│ Customer MDM       VERIFY_ONLY PROPOSED                         │
│ Onboarding Engine  MODIFY      PROPOSED                         │
│ [Open impact view]                                                │
├──────────────────────────────────────────────────────────────────┤
│ Profile API Change v8                                           │
│ ✓ producer       Customer MDM                                   │
│ ✓ consumers      Channels                                       │
│ ✓ contract       Customer API                                   │
│ ! failureBehaviour missing                         [Resolve]     │
├──────────────────────────────────────────────────────────────────┤
│ Other active proposal: DS-119 modifies REQ-248 v6  [Compare]    │
│ [Edit proposal] [Evidence] [Verification] [History]              │
╰──────────────────────────────────────────────────────────────────╯
```

## 10. Architecture Impact workspace

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Architecture impact · AB-9 v9 · CURRENT                               │
│ Source commits: customer-arch@19ec8f · integration-arch@a78bd2          │
├─────────────────────────────────────┬───────────────────────────────────┤
│ CURRENT TOPOLOGY                    │ PROPOSED IMPACT                   │
│                                     │                                   │
│ Customer Verification               │ R-17 rev3                         │
│      | REALIZES                     │ Customer API      MODIFY  ✓       │
│      v                              │ Customer MDM      VERIFY   ?       │
│ Customer MDM                        │ Onboarding        MODIFY   ?       │
│      | EXPOSES                      │ Mobile App        VERIFY   ?       │
│      v                              │                                   │
│ Customer API                        │ [Confirm selected]                 │
│   /        \                        │                                   │
│ Mobile   Onboarding                 │ Proposed architecture change      │
│                                     │ + Customer API freshness semantics│
├─────────────────────────────────────┴───────────────────────────────────┤
│ Selected edge: Customer API DEPENDS_ON Customer MDM                    │
│ Evidence: integration/customer-api.md @ a78bd2 · lines 34-41 · EXPLICIT│
│ [Show Markdown source] [Mark topology incorrect]                       │
└─────────────────────────────────────────────────────────────────────────┘
```

The current graph is immutable baseline. Correcting an ingestion error creates a review/finding workflow; it does not mutate the source baseline from this screen.

## 11. Architecture source evidence — Tool UI

```text
╭─ Architecture source evidence ────────────────────────────────────╮
│ Customer API -> Customer MDM · DEPENDS_ON                        │
│                                                                  │
│ repo: bank/integration-architecture                              │
│ commit: a78bd2...                                                │
│ path: applications/customer-api.md                               │
│ lines: 34-41                                                     │
│ mode: EXPLICIT                                                   │
│                                                                  │
│ "Customer API reads customer master data through..."            │
│                                                                  │
│ [Open source] [Report incorrect relationship]                    │
╰─────────────────────────────────────────────────────────────────╯
```

For `INFERRED` source evidence, the card visibly states that model interpretation was required and offers review.

## 12. Architecture impact confirmation — Tool UI

```text
╭─ Proposed implementation impact ─────────────────────────────────╮
│ Requirement R-17 rev3                                           │
│ Target Customer API · APPLICATION_COMPONENT                     │
│ Impact MODIFY                                                   │
│                                                                  │
│ Rationale                                                       │
│ Freshness/failure semantics are exposed through this component. │
│                                                                  │
│ Traversal                                                       │
│ Verification capability -> Customer MDM -> Customer API         │
│                                                                  │
│ [Confirm] [Change impact type] [Reject] [Show source topology]   │
╰─────────────────────────────────────────────────────────────────╯
```

## 13. Requirement editor — form-filling copilot

```text
Type          INTEGRATION
Title         [Expose verification status]
Statement     [................................................]
Priority      [HIGH]
Criticality   [HIGH]
Capabilities  [Customer Verification] [+]

Profile-required details
Producer      [Customer MDM]
Consumers     [Channels]
Contract      [Customer API]
Failure mode  [................................................]
Compatibility[Backward compatible]

Copilot
"Tell me what to change. I will update the draft, not save it."
[................................................................]

[Cancel] [Review diff] [Save revision]
```

Saving a semantically changed requirement can invalidate/reopen old architecture-impact confirmation if the affected semantics/capabilities changed.

## 14. Baseline changed while subject active

```text
⚠ STALE BASELINE

Requirement proposal targets REQ-248 v6; current catalogue is v7.
Architecture impact targets AB-9 v9; current architecture baseline is AB-10 v10.

[Compare requirement baseline] [Refresh architecture impact] [Open conflict]

READY is blocked until configured stale baselines are resolved.
```

## 15. Active proposal collision

```text
╭─ Parallel future changes detected ────────────────────────────────╮
│ CURRENT REQ-248 v6                                              │
│                                                                 │
│ DS-119 proposes: async event propagation                        │
│ DS-123 proposes: synchronous API lookup                         │
│                                                                 │
│ Relationship: CONTRADICTS · BLOCKING                            │
│                                                                 │
│ [Compare subjects] [Create cross-subject conflict] [Dismiss]    │
╰─────────────────────────────────────────────────────────────────╯
```

## 16. Verification Task

```text
Verify R-17 revision 3 · MODIFY REQ-248 v6
Why you: OWNER for Data

Current baseline        Proposed revision
[summary]               [summary]

Sources/evidence: ...
Profile compliance: 1 blocking gap
Architecture impact: 3 proposed · 1 confirmed

[Verify] [Amend] [Reject] [Not mine]
```

Verification does not mean the proposal or architecture changes are merged into current baseline.

## 17. Enterprise Knowledge Impact

```text
CURRENT KNOWLEDGE                    PROPOSED BY DS-123
Customer API 2.7                     MODIFY contract
Architecture guideline 17            NO_CHANGE
Customer Verification concept v3     MODIFY semantics

[Review diff] [Confirm] [Reject] [Correct]
```

## 18. Conflict Workspace

```text
Conflict C-17 · BLOCKING

Product / Bob       Immediate confirmation required.
Architecture/Alice  Cross-domain propagation should be async.
Operations / Erik   Source can degrade to 3 seconds.
DS-119              Proposes async event propagation.

AI neutral summary
[...]
Decision owner: Bob

[Add my position] [Evidence] [Record decision]*
```

## 19. Show Bigger Picture — constrained Generative UI

```text
                         DS-123
                           │
                 Customer Verification
                           │
       ┌───────────────────┼────────────────────┐
       ▼                   ▼                    ▼
    DATA                 API                OPERATIONS
  REQ-51 v4          REQ-248 v6           REQ-330 v2
                          │
                       MODIFY
                          ▼
                      R-17 rev3
                          │
                   architecture impact
                          ▼
 Customer MDM --EXPOSES--> Customer API --> Onboarding
                          │
                          ▼
                 repo: customer-api
                 team: API Platform
```

The generated composition is read/advisory; actions dispatch known typed commands.

## 20. Requirement Catalogue

Read-oriented current accepted requirements with version history, type, capability links and active proposals. P0 subject workflows cannot promote into it.

## 21. Architecture Catalogue

```text
Architecture / Current baseline AB-9 v9

Sources
✓ customer-architecture       19ec8f...
✓ integration-architecture    a78bd2...

Elements 42 · Relationships 71 · Views 8
Needs review 3

[Application cooperation] [System context] [Search elements]
```

This is a normalized derived read model. Source Git remains authoritative.

## 22. Architecture ingestion admin

```text
Architecture / Ingestion

Source                     Branch   Current commit   Status
customer-architecture      main     19ec8f...        ✓
integration-architecture   main     a78bd2...        ✓

Run I-18
SCANNING -> EXTRACTING -> RECONCILING -> VALIDATING
Changed Markdown files: 7 / 84
Prompt: ingest-architecture-markdown poc-v1
Model: Vertex / approved model

Findings
! CONFLICTING_DEFINITION app.customer-api      BLOCKING
! UNRESOLVED_REFERENCE service.customer-query  BLOCKING
? LOW_CONFIDENCE relationship R-441            REVIEW

[Open findings] [Retry run] [Publish baseline]*
```

Publish is available only when validation/governance allows it. The LLM cannot publish.

## 23. Work Packages

```text
Customer API
Target area: enterprise://areas/customer-api
Target team: API Platform

Confirmed implementation targets
Customer API      MODIFY       app.customer-api
Repository        customer-api repo.customer-api
Team              API Platform team.api-platform

Changes
MODIFY REQ-248 v6 -> R-17 rev3
CREATE R-18 rev2

Acceptance 12 · Evals 4 · Dependencies 1
[Open]
```

Human targetAreaRef remains useful grouping metadata, but concrete routing comes from confirmed architecture-impact linkage when required by profile.

## 24. Readiness

```text
NOT READY · 76% informational

✓ Outcome defined
✓ Requirement Profile API Change v8 pinned
✓ Architecture baseline AB-9 v9 pinned
! R-17 has unconfirmed architecture impact on Onboarding
! R-18 has no implementation target
! Profile finding API-FAILURE-001 open
! Match M-12 CONTRADICTS active DS-119 and is unreviewed
✓ No stale requirement baseline
✓ No stale architecture baseline
! Conflict C-17 open

[Open next blocker]
```

## 25. Final Package

```text
READY ✓

Profile: API Change v8
Requirement baseline + changes
Knowledge baseline + changes
Architecture baseline AB-9 v9
  source Git commits
  confirmed requirement impacts
  proposed architecture changes
  implementation targets
Reviewed matches/collisions
Decisions / assumptions
Work packages
Acceptance / evals
Traceability
Readiness evidence

[Export JSON] [Export Markdown]
```

Header states: **HANDED OFF — proposals are not yet promoted into current baselines or architecture Git.**

## 26. Admin / Requirement Profiles

Profile editor additionally includes architecture policy:

```text
Architecture
[x] Require published architecture baseline
[x] Confirm impact for HIGH/CRITICAL requirements
[x] Require implementation target
[ ] Allow NEEDS_REVIEW topology to drive confirmed impact
```

## 27. Profile upgrade preview

New profile versions preview both requirement quality findings and architecture-policy changes before explicit subject upgrade.

## 28. War Room

```text
Workflow      Agent activity              Baselines
DRILLING      Run 8 SUCCEEDED             REQ-248 v6
2 processing  OpenCode generation 2       profile API v8
1 waiting     hydration FULL              architecture AB-9 v9
                                           source commits exact

[Open trace] [Rerun] [Architecture ingestion] [Classify issue]
```

## UX invariants

1. Always label CURRENT versus PROPOSED.
2. Never show a proposal as enterprise current truth.
3. Never show LLM-extracted architecture as source-of-truth without its source Git evidence/status.
4. Every architecture node/edge used for impact can expose source repo/commit/path and EXPLICIT/INFERRED mode.
5. CREATE cannot silently bypass existing-requirement/active-proposal search when profile requires it.
6. Requirement/knowledge/architecture baseline versions used for proposals are visible.
7. Stale baseline is visible and blocks READY when configured.
8. Tool UI/form copilot drafts do not mutate authoritative state until explicit submit.
9. Generative UI uses allowlisted components and read/propose-oriented actions.
10. Experimental Interactables are non-authoritative in P0.
11. Remote updates do not erase unsent drafts.
12. Requirement semantic changes trigger targeted impact reassessment when architecture is required.
13. `VERIFY_ONLY` remains visually distinct from code-change impacts.
14. Repository/team implementation routing is shown as confirmed only when current normalized topology supports it.
