# UI Mockups

The UI is task-oriented. Chat is an interaction surface; structured state is always visible and is the durable product representation.

## Global navigation

```text
Req Helper | My Work | Delivery Subjects | Admin* | War Room*
                                      * permission-gated
```

A test-only persona switcher may exist in local/war-room mode, but normal product UX must not imply users can change their own role.

## 1. My Work

```text
┌──────────────────────────────────────────────────────────────────┐
│ My Work                                           Alice Example │
├──────────────────────────────────────────────────────────────────┤
│ NEEDS YOU                                                       │
│ Customer onboarding · Architecture · BLOCKING                   │
│ Define integration ownership                       [Continue]   │
│                                                                  │
│ PROCESSING                                                      │
│ Payment change · your answer saved, AI processing               │
│                                                                  │
│ WAITING ON OTHER                                                │
│ Conflict C-17 · waiting for Product decision                    │
│                                                                  │
│ REVIEW                                                          │
│ Requirement R-22 changed since your last review     [Review]    │
└──────────────────────────────────────────────────────────────────┘
```

Only tasks/subjects the user may access are shown.

## 2. New Signal

```text
┌──────────────────────────────────────────────────────────────────┐
│ Start Delivery Subject                                           │
├──────────────────────────────────────────────────────────────────┤
│ What are we trying to change or solve?                           │
│ [ natural-language signal                                      ] │
│                                                                  │
│ Expected outcome (optional)                                      │
│ [ ...                                                          ] │
│                                                                  │
│ Source material                                                  │
│ [Add link] [Upload document]                                     │
│                                                                  │
│                                         [Start discovery]        │
└──────────────────────────────────────────────────────────────────┘
```

Uploads become SourceArtifact metadata; file bytes live in GCS/external storage.

## 3. Clarify Scope

```text
┌──────────────────────────────────────────────────────────────────┐
│ AI interpretation                              [Accept] [Edit]   │
├──────────────────────────────────────────────────────────────────┤
│ Problem       Downstream channels cannot...                      │
│ Outcome       Channels can consume agreed verification state     │
│ In scope      semantics · distribution · failure behavior        │
│ Out of scope  implementation/deployment                          │
│ Constraints   security policy · existing integration standards   │
│ Success       implementation-ready verified package              │
│ Unknowns      source of truth · failure mode                      │
└──────────────────────────────────────────────────────────────────┘
```

## 4. Delivery Overview

```text
┌────────────────────────────────────────────────────────────────────┐
│ Customer onboarding                         DRILLING · NOT READY   │
├─────────────────┬─────────────────────────────┬────────────────────┤
│ Perspectives    │ Current picture             │ Blockers           │
│ ✓ Business      │ Outcome / scope summary     │ 2 gaps             │
│ ✓ Data          │                             │ 1 conflict         │
│ ✓ Architecture  │ Requirements 14             │ 2 blocking tasks   │
│ ! Security      │ Verified-current 8          │                    │
│ ✓ Operations    │ Revised today 3             │ Readiness 68%      │
├─────────────────┴─────────────────────────────┴────────────────────┤
│ Members: Sponsor · Delivery Lead · 5 participants · 2 observers   │
│ [Manage members/assignments]*                                     │
└────────────────────────────────────────────────────────────────────┘
```

The management action requires subject Delivery Lead/Admin permission.

## 5. Assign Perspectives

```text
┌──────────────────────────────────────────────────────────────────┐
│ Perspective     Person       Relationship       Authority         │
├──────────────────────────────────────────────────────────────────┤
│ Business        Bob          OWNER              authoritative     │
│ Architecture    Alice        OWNER              authoritative     │
│ Data            Cara         DELEGATE           authoritative     │
│ Security        Dana         REVIEWER           advisory only     │
│ Security        —            —                  NEEDS OWNER       │
└──────────────────────────────────────────────────────────────────┘
│ Suggested experts: Dana, Sofia                    [Save]          │
```

Expertise suggestions never grant authority automatically.

## 6. Drill Workspace

```text
┌─────────────────┬───────────────────────────────┬──────────────────┐
│ YOUR FOCUS      │ CONVERSATION                  │ CURRENT STATE    │
│ Architecture    │ AI: Can you confirm...?       │ Task T-14        │
│ 3 questions     │                               │ Req R-17 rev 3   │
│                 │ You: [type...]                │ Evidence 4       │
│                 │                               │ Conflict C-17    │
├─────────────────┴───────────────────────────────┴──────────────────┤
│ [I don't know] [Ask someone] [Show bigger picture]                │
└────────────────────────────────────────────────────────────────────┘
```

On submit:

```text
IN_PROGRESS -> ANSWERED -> PROCESSING -> COMPLETED
                                   \-> WAITING_ON_OTHER
```

The user's text is saved before AI processing.

## 7. Bigger Picture

```text
Signal
 ├─ Business outcome
 ├─ Process impact
 ├─ Data semantics
 ├─ API/Integration
 ├─ Architecture
 ├─ Security/Risk
 └─ Operations

Your current contribution touches: Architecture -> API -> Operations
Key decisions: D-03
Open conflicts: C-17
```

## 8. Requirements

```text
┌────────┬─────────────────────────┬─────┬────────────┬──────────────┐
│ ID     │ Requirement             │ Rev │ Lifecycle  │ Verification │
├────────┼─────────────────────────┼─────┼────────────┼──────────────┤
│ R-001  │ Verification source...  │ 3   │ PROPOSED   │ VERIFIED ✓   │
│ R-002  │ Integration contract... │ 2   │ CONFLICTED │ MISSING      │
└────────┴─────────────────────────┴─────┴────────────┴──────────────┘

Selected R-001 rev 3
Priority: HIGH       Criticality: CRITICAL
Owner: Data
Lifecycle: PROPOSED
Current verification: Cara · VERIFIED · rev 3
Authoritative sources: Concept K-4, Decision D-3
Acceptance: 3 current · 1 stale from rev 2

[Edit] [Request verification] [Evidence] [History]
```

Requirement lifecycle and human verification are deliberately separate. Manual Edit uses the same audited RequirementRevision path as AI edits.

## 9. Requirement History Drawer

```text
┌──────────────────────────────────────────────────────────────────┐
│ R-001 History                                                    │
├──────────────────────────────────────────────────────────────────┤
│ rev 3 · Alice · human edit · 10:42                              │
│ Reason: clarified stale-state semantics                          │
│ Verification: Cara VERIFIED                                      │
│ Sources: C-19, K-4, D-3                                         │
│                                                                  │
│ rev 2 · AI proposal · 10:16                                    │
│ Verification: SUPERSEDED                                        │
│                                                                  │
│ rev 1 · initial synthesis                                       │
└──────────────────────────────────────────────────────────────────┘
```

This is normal product UX, not War Room tooling.

## 10. Verification Task

```text
┌──────────────────────────────────────────────────────────────────┐
│ Verify R-001 revision 3                                          │
├──────────────────────────────────────────────────────────────────┤
│ Why you: OWNER for Data perspective                              │
│ Statement: ...                                                   │
│ Sources/evidence: ...                                            │
│ Previous rev verification: superseded                            │
│                                                                  │
│ [Verify] [Reject] [Amend] [Not mine / reassign]                 │
└──────────────────────────────────────────────────────────────────┘
```

Reviewer UI instead offers `[Comment] [Challenge] [Recommend change]`; Reviewer alone cannot create authoritative verification.

## 11. Conflict Workspace

```text
┌──────────────────────────────────────────────────────────────────┐
│ Conflict C-17 · BLOCKING                                         │
├──────────────────────────────────────────────────────────────────┤
│ Product / Bob                                                    │
│ Immediate confirmation is required.             [position saved] │
│                                                                  │
│ Architecture / Alice                                             │
│ Cross-domain propagation should be async.       [position saved] │
│                                                                  │
│ Operations / Erik                                                │
│ Source tail latency can reach 3 seconds.         [position saved]│
│                                                                  │
│ AI summary                                                       │
│ [current neutral synthesis of positions/evidence]                │
│                                                                  │
│ Decision owner: Bob                                              │
│ [Add my position] [View evidence] [Record decision]*             │
└──────────────────────────────────────────────────────────────────┘
```

Each participant uses their own task/thread. This page aggregates structured positions; it never creates one shared OpenCode session.

## 12. Enterprise Impact

```text
Knowledge element              Proposed diff              Status
Customer concept               MODIFY +verificationState  CONFIRMED
Customer API                   MODIFY contract            PROPOSED
Risk policy                    UNKNOWN_CHANGE             NEED REVIEW

[Open source] [Rationale] [Confirm] [Reject] [Correct]
```

## 13. Work Packages

```text
Customer API
Target area: enterprise://areas/customer-api
Target team: API Platform
Coordinator: Alice
Requirements: R3 R7 R9
Dependencies: MDM package
Acceptance: 12 · Evals: 4
[Open]
```

Do not use a human owner as the implementation-area identifier.

## 14. Work Package Detail

```text
Requirements | Package acceptance | Evals | Dependencies | Traceability

Package-level AC: end-to-end verified-state propagation across MDM + API
Requirement ACs: ...
Package eval: integration regression suite

Trace: Signal -> Evidence -> Requirement rev -> Verification -> Package -> Eval
```

Acceptance/evals may target Requirement, WorkPackage or DeliverySubject.

## 15. Readiness

```text
NOT READY · 81% informational

✓ Outcome defined
✓ Required perspectives confirmed
! Security required perspective lacks OWNER/DELEGATE
✓ Current critical requirement verification
! Conflict C-17 open
! Dependency DEP-4 unresolved (owned does not clear blocker)
! Blocking task T-19 still PROCESSING

[Open next blocker]
```

## 16. Final Package

```text
READY ✓

Outcome & scope
Source artifacts
Decisions / assumptions
Requirements + revision/provenance/verification
Enterprise impacts
Work packages
Acceptance / evals
Dependencies / traceability
Readiness evidence

[Export JSON] [Export Markdown]
Package API: /api/delivery-subjects/DS-123/package
```

## 17. War Room

```text
Workflow     Agent activity            Context
DRILLING     Run 8 SUCCEEDED           domain start 41
2 processing OpenCode generation 2     presented 41
1 waiting    hydration FULL            domain end 44

[Open trace] [Rerun analysis] [Classify issue]
[Manage assignment]*
```

`Manage assignment` is visible only if the current user also has ADMIN or subject Delivery Lead permission.

## 18. Admin

See `docs/ADMIN_UI.md`. Admin configures global application roles/templates. Subject membership and perspective authority remain explicit separate concepts.

## UX invariants

1. A live remote update must not erase an unsent local chat draft.
2. If an object being edited changes remotely, show a stale-edit warning before overwrite.
3. Every generated question can explain “why you / why now”.
4. Every requirement exposes current provenance, verification and history.
5. “AI says verified” is never presented as human verification.
6. Authority labels are explicit in verification/conflict views.
7. PROCESSING is visible so users know their answer was saved even while OpenCode is running.
8. Permission-gated controls are hidden/disabled with an explanation rather than failing late.
