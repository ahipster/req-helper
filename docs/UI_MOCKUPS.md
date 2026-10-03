# UI Mockups

The UI is task-oriented and change-oriented. Chat is one interaction surface; current baseline, proposed changes and structured state are always visible.

assistant-ui usage is defined in `docs/ASSISTANT_UI_INTERACTIONS.md`.

## Global navigation

```text
Req Helper | My Work | Delivery Subjects | Requirement Catalogue | Admin* | War Room*
                                                              * permission-gated
```

## 1. My Work

```text
┌─────────────────────────────────────────────────────────────────────┐
│ My Work                                              Alice Example │
├─────────────────────────────────────────────────────────────────────┤
│ NEEDS YOU                                                          │
│ Customer verification · Architecture · BLOCKING                    │
│ Review MODIFY REQ-248 v6 -> R-17                      [Continue]   │
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
│ [Change profile]                                                   │
│                                                   [Start discovery] │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Discovery / existing truth first

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Existing requirements/knowledge likely affected                    │
├─────────────────────────────────────────────────────────────────────┤
│ 0.93 REQ-248 v6 · Verification status exposure        CURRENT      │
│      Capability: Customer Verification                            │
│      [Review]                                                     │
│                                                                     │
│ 0.78 REQ-301 v8 · Customer API authorization         CURRENT      │
│      [Review]                                                     │
│                                                                     │
│ Customer API contract 2.7                           CURRENT       │
│ Architecture guideline 17                         CURRENT       │
│                                                                     │
│ Active proposal collision                                          │
│ DS-119 also proposes MODIFY REQ-248 v6                 [Compare]   │
└─────────────────────────────────────────────────────────────────────┘
```

The workflow does not start from an empty requirements list.

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
┌──────────────────────────────────────────────────────────────────────┐
│ Customer verification                         DRILLING · NOT READY  │
│ API_CHANGE · Requirement Profile API Change v8                      │
├───────────────────┬────────────────────────────┬────────────────────┤
│ CURRENT IMPACT    │ PROPOSED CHANGE SET        │ BLOCKERS           │
│ Req baseline 3    │ MODIFY 2                   │ 1 profile gap      │
│ Knowledge 4       │ CREATE 1                   │ 1 collision        │
│                   │ RETIRE 0                   │ 1 conflict         │
│                   │ NO_CHANGE 1                │ 2 tasks            │
├───────────────────┴────────────────────────────┴────────────────────┤
│ Profile v8 · [Compare newer v9]                                    │
└──────────────────────────────────────────────────────────────────────┘
```

## 6. Drill Workspace — rich assistant-ui

```text
┌────────────────┬────────────────────────────────────┬──────────────────┐
│ YOUR FOCUS     │ CONVERSATION / TOOL UI             │ CURRENT STATE    │
│                │                                    │                  │
│ Architecture   │ AI: This seems to modify an        │ Baseline         │
│ 3 tasks        │ existing requirement.              │ REQ-248 v6       │
│                │                                    │                  │
│                │ ╭─ Requirement change ──────────╮  │ Proposed         │
│                │ │ MODIFY REQ-248 v6            │  │ R-17 rev3        │
│                │ │ current ↔ proposed diff       │  │                  │
│                │ │ overlap 0.93                  │  │ Profile gaps 1   │
│                │ │ [Review] [Wrong match]        │  │ Collision DS-119 │
│                │ ╰───────────────────────────────╯  │                  │
│                │                                    │                  │
│                │ [ message composer ]               │                  │
├────────────────┴────────────────────────────────────┴──────────────────┤
│ [I don't know] [Ask someone] [Show bigger picture]                    │
└────────────────────────────────────────────────────────────────────────┘
```

Known domain actions render assistant-ui Tool UI. Free-form chat is not used as the authoritative change editor.

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

If `This is genuinely new` is selected, the match is explicitly dismissed with rationale rather than silently ignored.

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
│                                    Not merged into current       │
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

## 10. Requirement editor — form-filling copilot

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

## 11. Baseline changed while subject active

```text
⚠ STALE BASELINE

Your proposal targets REQ-248 v6.
Current catalogue version is now REQ-248 v7.

[Compare v6 -> v7] [Rebase proposal] [Open conflict]

READY is blocked until resolved.
```

## 12. Active proposal collision

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

## 13. Verification Task

```text
Verify R-17 revision 3 · MODIFY REQ-248 v6
Why you: OWNER for Data

Current baseline        Proposed revision
[summary]               [summary]

Sources/evidence: ...
Profile compliance: 1 blocking gap

[Verify] [Amend] [Reject] [Not mine]
```

Verification does not mean the proposal is merged into current baseline.

## 14. Enterprise Knowledge Impact

```text
CURRENT KNOWLEDGE                    PROPOSED BY DS-123
Customer API 2.7                     MODIFY contract
Architecture guideline 17            NO_CHANGE
Customer Verification concept v3     MODIFY semantics

[Review diff] [Confirm] [Reject] [Correct]
```

If source version changes, show STALE BASELINE and require reassessment.

## 15. Conflict Workspace

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

Participants keep independent AgentThreads.

## 16. Show Bigger Picture — constrained Generative UI

```text
                         DS-123
                           │
                 Customer Verification
                           │
       ┌───────────────────┼────────────────────┐
       ▼                   ▼                    ▼
    DATA                 API                OPERATIONS
  REQ-51 v4          REQ-248 v6           REQ-330 v2
      │                   │                    │
      │                MODIFY                  │
      │                   ▼                    │
      └─────────────── R-17 rev3 ──────────────┘
                           │
                      Conflict C-17
                           │
                    active DS-119

Current: 3 baseline requirements
Proposed: 2 MODIFY · 1 CREATE
Blockers: profile gap · collision · conflict
```

The model may compose this from an allowlisted vocabulary; actions dispatch known Tool UI/application commands.

## 17. Requirement Catalogue

```text
CURRENT REQUIREMENTS

REQ-248 v6 · INTEGRATION · ACTIVE
Customer verification exposure
Capabilities: Verification
[Open history] [Show active proposals]

REQ-301 v8 · SECURITY · ACTIVE
Customer API authorization
Capabilities: Customer API
[Open history] [Show active proposals]
```

P0 catalogue is read-only from Delivery Subject workflows.

## 18. Work Packages

```text
Customer API
Target area: enterprise://areas/customer-api
Target team: API Platform

Changes
MODIFY REQ-248 v6 -> R-17 rev3
CREATE R-18 rev2

Acceptance 12 · Evals 4 · Dependencies 1
[Open]
```

## 19. Readiness

```text
NOT READY · 79% informational

✓ Outcome defined
✓ Requirement Profile API Change v8 pinned
! Profile finding API-FAILURE-001 open
✓ All proposed requirements classified as changes
! Match M-12 CONTRADICTS active DS-119 and is unreviewed
✓ No stale requirement baseline
! Conflict C-17 open
! Blocking task T-19 PROCESSING

[Open next blocker]
```

## 20. Final Package

```text
READY ✓

Profile: API Change v8
Current baseline references
Requirement changes
  MODIFY / CREATE / SUPERSEDE / RETIRE / NO_CHANGE
Knowledge changes
Reviewed matches/collisions
Decisions / assumptions
Work packages
Acceptance / evals
Traceability
Readiness evidence

[Export JSON] [Export Markdown]
```

Header states: **HANDED OFF — proposals are not yet promoted into current baseline.**

## 21. Admin / Requirement Profiles

```text
Admin / Requirement Profiles

API Change       current v8       draft v9      [Edit v9]
Data Model       current v4                     [New version]
Regulatory       current v3                     [New version]

[Create profile]
```

### Profile editor

```text
API Change · DRAFT v9

Required perspectives
[x] API [x] Architecture [x] Security [x] Operations

INTEGRATION
[x] enabled
Required details
[x] Producer          REFERENCE
[x] Consumers         REFERENCE_LIST
[x] Contract          REFERENCE
[x] Failure behaviour TEXT
[x] Compatibility     ENUM
[x] Capability link

Acceptance
Minimum criteria             [2]
Automatable criterion        [required]

Evaluations
Security check               [required]
Performance                  [if HIGH/CRITICAL]

Existing requirement search
Before CREATE                [required]
Duplicate threshold          [0.85]
Contradiction review         [required]

Copilot: ["Add rollback behavior as mandatory for high-criticality changes"]

[Preview rules] [Publish v9]
```

## 22. Profile upgrade preview

```text
DS-123 currently uses API Change v8
Available: v9

New blocking checks if upgraded
+ R-17 missing rollbackBehaviour
+ R-18 requires PERFORMANCE_TEST

Removed
- none

[Keep v8] [Upgrade to v9]
```

Upgrade is explicit and audited.

## 23. War Room

```text
Workflow      Agent activity             Baseline/Profile
DRILLING      Run 8 SUCCEEDED            REQ-248 v6
2 processing  OpenCode generation 2      profile API v8
1 waiting     hydration FULL             current subject rev44

[Open trace] [Rerun] [Classify issue]
```

## UX invariants

1. Always label CURRENT versus PROPOSED.
2. Never show a proposal as enterprise current truth.
3. CREATE is not allowed to silently bypass existing-requirement/active-proposal search when profile requires it.
4. Baseline version/fingerprint used for a proposal is visible.
5. Stale baseline is visible and blocks READY.
6. Tool UI/form copilot drafts do not mutate authoritative state until explicit submit.
7. Generative UI uses allowlisted components and read/propose-oriented actions.
8. Experimental Interactables are non-authoritative in P0.
9. Remote updates do not erase unsent drafts.
10. Requirement history exposes both proposed revision history and baseline history references.
