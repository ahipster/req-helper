# UI Mockups

The UI is task-oriented for non-technical users. Chat is central during a drill, but every screen exposes condensed structured state so the user understands what matters without reading full transcripts.

## 1. My Work

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Req Helper                                            User / role ▾ │
├─────────────────────────────────────────────────────────────────────┤
│ My work                                                             │
│                                                                     │
│ NEEDS YOU                                                           │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Customer onboarding change                   BLOCKING · 3 items │ │
│ │ Your lens: Architecture                                       │ │
│ │ Confirm integration ownership and failure behavior             │ │
│ │                                               [Continue]        │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ REVIEW                                                              │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Payment status change                     2 requirements       │ │
│ │ Your lens: Data                           [Review]              │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ FOLLOWING                                                           │
│ Fraud rule update                              Readiness 78%         │
└─────────────────────────────────────────────────────────────────────┘
```

Principle: the user sees **why they are needed**, not a generic project dashboard.

## 2. New Signal

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Start a delivery subject                                            │
├─────────────────────────────────────────────────────────────────────┤
│ What are we trying to change or solve?                              │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ We need customers to ...                                       │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Why / expected outcome?                                             │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Optional initial context...                                    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Links / documents / source material                                 │
│ [+ add]                                                             │
│                                                                     │
│                                              [Start discovery]      │
└─────────────────────────────────────────────────────────────────────┘
```

Do not start with a requirements form. AI structures progressively.

## 3. Delivery Subject Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│ ← Customer onboarding change                     DRILLING · 62% ready │
├──────────────────┬─────────────────────────────┬───────────────────────┤
│ Perspectives     │ Current picture             │ Open issues           │
│                  │                             │                       │
│ ✓ Business       │ Problem                     │ 2 blocking gaps       │
│ ● Data           │ Customers wait for manual   │ 1 conflict            │
│ ! Security       │ verification...             │ 3 assumptions         │
│ ○ Operations     │                             │                       │
│ ● Architecture   │ Desired outcome             │ Next blocker          │
│                  │ Automated verified status   │ Security ownership    │
│                  │ available downstream...     │                       │
│                  │                             │ Readiness              │
│                  │ Requirements                │ ██████░░░░ 62%        │
│                  │ 14 verified · 6 draft       │                       │
├──────────────────┴─────────────────────────────┴───────────────────────┤
│ Recent: Architecture answered → R-17 revised → Security verify task  │
└────────────────────────────────────────────────────────────────────────┘
```

## 4. Drill Workspace — perspective owner / contributor

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Customer onboarding change                Your lens: Architecture      │
├─────────────────┬───────────────────────────────────┬───────────────────┤
│ YOUR FOCUS      │ CONVERSATION                      │ CURRENT CONTEXT   │
│                 │                                   │                   │
│ Integration     │ AI                                │ Requirement R-17  │
│ ownership       │ We currently believe System A    │                   │
│                 │ publishes status and System B     │ Customer status   │
│ Data source     │ consumes it.                      │ must be available │
│                 │                                   │ downstream...     │
│ Resilience      │ Can you confirm whether System B  │                   │
│                 │ accesses the API directly?        │ Evidence          │
│ 3 remaining     │                                   │ • Process P-12    │
│ questions       │ YOU                               │ • API Customer-v2 │
│                 │ [type answer...]                  │                   │
│                 │                                   │ Related           │
│                 │                                   │ Data ● Security ! │
├─────────────────┴───────────────────────────────────┴───────────────────┤
│ [I don't know] [Ask someone] [Show bigger picture]                    │
└─────────────────────────────────────────────────────────────────────────┘
```

The right rail updates when structured state changes. The transcript is not the state.

## 5. Bigger Picture

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Bigger picture                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ SIGNAL                                                              │
│ Customer onboarding change                                         │
│     │                                                               │
│     ├── Business: reduce manual review                              │
│     ├── Process: onboarding step changes                            │
│     ├── Data: new verification state                                │
│     ├── API: expose verification status                             │
│     ├── Security: additional consumer/access                        │
│     └── Operations: monitoring/failure behavior                     │
│                                                                     │
│ Your contribution currently touches                                │
│ Architecture ── API ── Data ── Operations                           │
│                                                                     │
│ Important decisions                                                │
│ D-03 Source of truth = Customer MDM                                 │
│                                                                     │
│                                           [Back to my questions]    │
└─────────────────────────────────────────────────────────────────────┘
```

## 6. Requirements

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Requirements                              Perspective ▾  State ▾       │
├─────────┬───────────────────────────────────────┬──────────┬────────────┤
│ ID      │ Requirement                           │ Owner    │ State      │
├─────────┼───────────────────────────────────────┼──────────┼────────────┤
│ R-001   │ Verification state must ...           │ Product  │ VERIFIED   │
│ R-002   │ Source of truth must be ...           │ Data     │ REVIEW     │
│ R-003   │ API must expose ...                   │ API      │ DRAFT      │
│ R-004   │ p95 latency must ...                  │ Ops      │ NEED INPUT │
└─────────┴───────────────────────────────────────┴──────────┴────────────┘
│ Selected: R-002                                                       │
│                                                                       │
│ Why / provenance                                                      │
│ • Contribution C-19 (owner verified)                                  │
│ • Concept: Customer Verification Status                               │
│ • Decision D-03                                                       │
│                                                                       │
│ Acceptance                                                            │
│ ✓ AC-20 verified path                                                  │
│ ○ missing source-unavailable scenario                                 │
│                                                                       │
│ [Edit] [Request verification] [Open evidence]                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 7. Verification Task — authoritative owner

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Verify contribution                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ Why you                                                             │
│ You are the owner/delegate for Customer Data semantics.             │
│                                                                     │
│ Contributor said                                                    │
│ "The verification state is currently mastered by System X."        │
│                                                                     │
│ Their relationship: Architecture contributor                        │
│ Their confidence: medium                                            │
│                                                                     │
│ Existing references                                                 │
│ • Customer concept                                                  │
│ • System X data dictionary                                          │
│                                                                     │
│ [Verify] [Reject] [Amend...] [Not mine / reassign]                  │
└─────────────────────────────────────────────────────────────────────┘
```

This screen embodies the rule: useful contribution ≠ authority.

## 8. Conflicts & Decisions

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Conflicts & decisions                                               │
├─────────────────────────────────────────────────────────────────────┤
│ BLOCKING · C-17                                                     │
│                                                                     │
│ Architecture                                                        │
│ "This integration must be asynchronous."                           │
│                                                                     │
│ Product                                                             │
│ "The customer needs the result immediately."                       │
│                                                                     │
│ Operations                                                          │
│ "The source can take up to 3 seconds."                             │
│                                                                     │
│ Required participants                                               │
│ ● Product  ● Architecture  ● Operations                             │
│                                                                     │
│ AI-framed options                                                   │
│ A. eventual consistency                                             │
│ B. synchronous orchestration                                        │
│ C. provisional response                                             │
│                                                                     │
│ Decision owner: Product                                             │
│ [Discuss]                                  [Record decision]        │
└─────────────────────────────────────────────────────────────────────┘
```

AI frames; human decision owner decides.

## 9. Enterprise Impact

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Enterprise impact                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Existing element                         Proposed effect             │
│                                                                     │
│ Customer concept                         MODIFY                      │
│ status                                   + verificationState         │
│                                                                     │
│ Onboarding process                       MODIFY                      │
│ Verify customer                          → automated validation      │
│                                                                     │
│ Customer API v2                          MODIFY                      │
│ /customer                                + verificationStatus       │
│                                                                     │
│ Risk policy                              POSSIBLE IMPACT             │
│                                          needs verification          │
│                                                                     │
│ [Open source] [View rationale] [Mark incorrect]                     │
└─────────────────────────────────────────────────────────────────────┘
```

All entries are proposed diffs until future reconciliation.

## 10. Work Package Split

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Implementation areas                                                │
├─────────────────────────────────────────────────────────────────────┤
│ Customer API                                      READY ██████████  │
│   Requirements R3 R7 R9                                             │
│   Acceptance 12 · Evals 4                                           │
│   Depends on Customer MDM                                           │
│                                                 [Open package]       │
│                                                                     │
│ Customer MDM                                      80% ████████░░    │
│   Requirements R2 R4                                                │
│   Missing: source-unavailable behavior                              │
│                                                                     │
│ Monitoring                                        65% ██████░░░░    │
│   Missing: alert ownership                                          │
└─────────────────────────────────────────────────────────────────────┘
```

## 11. Work Package Detail — downstream team perspective

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Customer API                                      READY? NO          │
├───────────────────────────────┬─────────────────────────────────────┤
│ REQUIREMENTS                  │ ACCEPTANCE / EVALS                  │
│                               │                                     │
│ R-003                         │ AC-31                               │
│ Expose verification status    │ Given verified customer...         │
│                               │                                     │
│ R-009                         │ AC-32                               │
│ Handle stale status           │ Given unavailable source...        │
│                               │                                     │
│ DEPENDENCIES                  │ EVAL-4                              │
│ Customer MDM                  │ p95 <= defined threshold           │
│ Security policy               │                                     │
│                               │ Security check                     │
│                               │ ...                                 │
├───────────────────────────────┴─────────────────────────────────────┤
│ Traceability: Signal → C-19 → R-003 → WP-API → AC-31 / EVAL-4     │
└─────────────────────────────────────────────────────────────────────┘
```

## 12. Readiness

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Readiness                                           NOT READY       │
├─────────────────────────────────────────────────────────────────────┤
│ ✓ Problem/outcome defined                                           │
│ ✓ Required perspectives owned                                      │
│ ✓ Critical requirements verified                                   │
│ ! 1 blocking conflict                                               │
│ ✓ Enterprise impacts linked                                        │
│ ! 2 critical requirements missing acceptance criteria              │
│ ✓ Work packages assigned                                           │
│                                                                     │
│ Informational score: 83%                                            │
│                                                                     │
│ Blocking next actions                                               │
│ C-17  Product / Architecture / Operations            [Resolve]     │
│ R-19  Acceptance criteria missing                    [Open]        │
└─────────────────────────────────────────────────────────────────────┘
```

The percentage is informational. READY is boolean and deterministic.

## 13. Final Package

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Requirement package                                     READY ✓     │
├─────────────────────────────────────────────────────────────────────┤
│ Executive summary                                                   │
│ Scope / outcomes                                                    │
│ Decisions                                                          │
│ Assumptions                                                        │
│ Requirements                                                       │
│ Enterprise impacts                                                 │
│ Work packages                                                      │
│ Acceptance criteria                                                │
│ Evaluations                                                        │
│ Dependencies                                                       │
│ Traceability                                                       │
│ Readiness evidence                                                 │
│                                                                     │
│ [Export JSON] [Export Markdown] [Downstream handoff]               │
└─────────────────────────────────────────────────────────────────────┘
```

## 14. War Room

```text
┌────────────────────────────────────────────────────────────────────────┐
│ War room · Customer onboarding change                                 │
├────────────────────┬─────────────────────────┬─────────────────────────┤
│ WORKFLOW           │ AGENT ACTIVITY          │ QUALITY / DOMAIN        │
│                    │                         │                         │
│ DRILLING           │ 18 model calls          │ 14 reqs verified        │
│ 4 humans active    │ 6 tool calls            │ 3 gaps                  │
│ 2 waiting          │ 2 schema retries        │ 1 conflict              │
│                    │                         │                         │
│ Waiting            │ Latest transitions      │ Readiness 62%           │
│ Security owner     │ C19 → R8 revised        │ ██████░░░░              │
│ Operations owner   │ R8 → review task        │                         │
├────────────────────┴─────────────────────────┴─────────────────────────┤
│ Trace timeline                                                        │
│ 10:14 plan_drill      OK  1.2s  prompt poc-v1:plan-drill             │
│ 10:14 ask_human       WAITING user:security-owner                     │
│ 10:16 extract         OK  0.8s  2 contributions                       │
│ 10:16 synthesize      OK  1.5s  R-8 revised                           │
│                                                                        │
│ [Open trace] [Rerun analysis] [Override assignment] [Classify issue] │
└────────────────────────────────────────────────────────────────────────┘
```

## Perspective behavior summary

- **Sponsor:** outcome and progress first; no implementation detail by default.
- **Business/Product:** value, rules, customer/process behavior, prioritization and decisions.
- **Process:** actors, steps, hand-offs, exceptions and current/future process impact.
- **Data:** meaning, ownership, lineage, source-of-truth, quality and lifecycle.
- **Architecture:** system boundaries, dependencies, patterns, constraints and trade-offs.
- **Security/Privacy/Risk/Compliance:** controls, policy obligations, data exposure, evidence and approval needs.
- **Operations:** SLOs, failure behavior, observability, support model and recovery.
- **API/Integration/System:** contracts, producers/consumers, compatibility, sequencing and technical edge cases.
- **UX:** user journeys, accessibility, error states and interaction acceptance.
- **Delivery Lead:** coverage, blockers, ownership and readiness across perspectives.
- **Downstream team:** only its work package by default, with traceability/bigger picture available on demand.
