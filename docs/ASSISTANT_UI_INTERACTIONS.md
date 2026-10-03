# assistant-ui Interaction Model

Req Helper uses assistant-ui as more than a chat transcript. The product combines normal conversation, deterministic Tool UI, form-filling copilot behavior, constrained Generative UI and optional experimental Interactables.

## Principle

Structured React/domain state is authoritative. UI generated or edited by the model is always a view, draft or proposal until it is submitted through a Req Helper application command.

```text
assistant-ui interaction
      |
      +-- chat/explanation
      +-- Tool UI / human tool
      +-- form copilot draft updates
      +-- constrained Generative UI
      +-- experimental Interactable scratch surfaces
      |
      v
validated Req Helper command
      v
Firestore authoritative domain state
```

The same rule applies to architecture: a generated system-context view is a projection over a published normalized baseline, not the architecture source of truth.

## P0 capability choices

### Normal chat — P0

Use for drill questions/answers, explanations, natural-language corrections, broader context and follow-ups.

Chat text is never the only representation of a material requirement/change/system impact.

### Tool UI — core P0

Known domain actions render known React components. The model chooses when to invoke them, but the component and allowed actions are shipped by Req Helper.

Required P0 Tool UIs:

```text
propose_requirement_change
review_existing_requirement_match
edit_requirement
verify_requirement
add_evidence
ask_someone
record_conflict_position
record_decision
review_knowledge_diff
assign_perspective
review_profile_gap
propose_architecture_impact
confirm_architecture_impact
show_architecture_source_evidence
review_architecture_change
review_architecture_ingestion_finding
```

Example requirement change:

```text
╭─ Requirement change ─────────────────────────────────────────╮
│ MODIFY CURRENT REQ-248 · v6                                  │
│ Capability: Customer Verification                            │
│                                                             │
│ CURRENT v6                                                   │
│ Channels may obtain verification status from Customer API.   │
│                                                             │
│ PROPOSED                                                     │
│ Authorized channels shall obtain current verification state  │
│ through the supported contract; stale state is not valid.    │
│                                                             │
│ [Review diff] [Edit proposal] [Wrong match]                  │
╰──────────────────────────────────────────────────────────────╯
```

Example architecture impact:

```text
╭─ Architecture impact ────────────────────────────────────────╮
│ Requirement: R-17 rev3                                      │
│ Baseline: AB-9 v9                                           │
│ Target: app.customer-api · APPLICATION_COMPONENT            │
│ Impact: MODIFY                                              │
│                                                             │
│ Why                                                         │
│ Freshness/failure semantics are exposed through this app.    │
│                                                             │
│ Traversal                                                   │
│ capability.customer-verification                            │
│   -> app.customer-mdm -> app.customer-api                   │
│                                                             │
│ Source topology                                             │
│ integration/customer-api.md @ a78bd2 · EXPLICIT            │
│                                                             │
│ [Confirm] [Change impact] [Reject] [Show source]             │
╰──────────────────────────────────────────────────────────────╯
```

Tool UIs may collect human input, but authoritative writes occur only through backend application services with authz, revision/baseline, idempotency and schema checks.

### Architecture source evidence Tool UI

Every architecture node/relationship used for material impact must allow a human to inspect where it came from.

```text
╭─ Architecture source evidence ───────────────────────────────╮
│ Customer API DEPENDS_ON Customer MDM                        │
│                                                             │
│ source: integration-architecture                            │
│ commit: a78bd2...                                           │
│ path: applications/customer-api.md                          │
│ lines: 34-41                                                │
│ evidence mode: EXPLICIT                                     │
│                                                             │
│ [Open source] [Report incorrect topology]                    │
╰──────────────────────────────────────────────────────────────╯
```

`INFERRED` is visually distinct from `EXPLICIT` and never disguised as directly stated architecture.

### Form-filling copilot — core P0

Use natural language to edit drafts of structured forms while the human retains explicit submit/save control.

Required copilot-enabled forms:

- Clarify Scope;
- Requirement editor;
- Decision editor;
- Work Package editor;
- Requirement Profile editor.

Profile editor includes architecture policy controls such as requiring baseline/impact/implementation targets.

The copilot never bypasses RequirementRevision, profile versioning, ArchitectureBaseline or impact confirmation mechanics.

### Constrained Generative UI — P0, read/propose oriented

Allow the model to compose views from an allowlisted component vocabulary:

```text
Card
Fact
Badge
Table
Timeline
RequirementSummary
RequirementDiff
KnowledgeDiff
PerspectiveSummary
ConflictSummary
DecisionSummary
ReadinessSummary
TraceabilityGraph
CapabilityMap
ArchitectureNode
ArchitectureRelationship
SystemContextView
ApplicationCooperationView
ImplementationImpactView
ArchitectureSourceBadge
```

Best uses:

- Show Bigger Picture;
- current-vs-proposed dashboards;
- system context/application cooperation views;
- requirement impact neighborhoods;
- implementation routing summaries;
- capability/requirement/architecture relationship views;
- conflict summaries;
- traceability explanations;
- readiness/blocker explanations.

Generated architecture visualizations are projections over normalized current baseline + proposed impacts/change proposals. They may not invent new elements/relationships as hidden UI-only truth.

Generative UI may dispatch known actions, but those actions still route to normal Tool UI/application commands. Arbitrary HTML/JavaScript is not accepted.

### Interactables — experimental / non-authoritative P0

assistant-ui Interactables may be used only for scratch requirement drafts, temporary comparison boards, planning notes, profile-design scratchpads or exploratory architecture layouts.

They must not be the system of record for Requirement, Requirement Profile, ArchitectureBaseline, ArchitectureElement, ArchitectureRelationship, RequirementArchitectureImpact, Decision, Verification, Change Proposal or Readiness.

If used, final committed state is translated into a typed Req Helper command.

## Rendering rules by domain event

| Domain situation | Render |
|---|---|
| Agent asks one question | chat |
| Existing requirement match | `review_existing_requirement_match` Tool UI |
| CREATE/MODIFY/SUPERSEDE/RETIRE proposal | Requirement Change Tool UI |
| Human edits structured requirement | form + copilot |
| OWNER/DELEGATE verification needed | Verification Tool UI |
| Architecture impact proposed | `propose_architecture_impact` Tool UI |
| Architecture impact needs human authority | `confirm_architecture_impact` Tool UI |
| User asks why system/API is impacted | architecture source-evidence Tool UI + optional generated neighborhood |
| Architecture topology is inferred/ambiguous | architecture ingestion finding Tool UI |
| Architecture structural future change | Architecture Change Tool UI |
| Conflict appears | Conflict summary + participant Tool UI |
| Decision required | Decision form Tool UI |
| Knowledge change detected | Knowledge Diff Tool UI |
| User asks "show bigger picture" | constrained Generative UI |
| User asks why not READY | generated ReadinessSummary + links to deterministic checks |
| Profile rule missing | Profile Gap Tool UI |

## Drill Workspace target

```text
┌────────────────┬───────────────────────────────────┬────────────────────┐
│ YOUR FOCUS     │ CONVERSATION / TOOL UI            │ CURRENT STATE      │
│                │                                   │                    │
│ Architecture   │ AI question                       │ Baseline: REQ-248  │
│ 3 tasks        │                                   │ Architecture AB-9  │
│                │ ╭ Architecture impact ─────────╮ │ Proposed R-17 r3  │
│                │ │ Customer API · MODIFY       │ │ Profile: API v8    │
│                │ │ via current topology        │ │ Arch impacts: 3    │
│                │ │ [Confirm] [Source]          │ │ Conflicts: 1       │
│                │ ╰──────────────────────────────╯ │                    │
│                │ [message composer]                │                    │
├────────────────┴───────────────────────────────────┴────────────────────┤
│ [I don't know] [Ask someone] [Show bigger picture]                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Current vs proposed comparison

Current-vs-proposed applies to requirements, knowledge and architecture.

```text
CURRENT ARCHITECTURE AB-9             PROPOSED DS-123
app.customer-api                      MODIFY
  consumes app.customer-mdm             + freshness/failure semantics
  exposes api.customer-v2

Source: customer-api.md @ a78bd2
```

Other active proposal collisions remain visible separately.

## Architecture generated view target

```text
           capability.customer-verification
                         |
                     REALIZES
                         v
                 app.customer-mdm
                         |
                      EXPOSES
                         v
                 app.customer-api
                  /             \
             CONSUMES         CONSUMES
                /                 \
        app.mobile        app.onboarding

R-17 impact
  app.customer-api      MODIFY ✓
  app.customer-mdm      VERIFY_ONLY ?
  app.onboarding        MODIFY ?
```

Each rendered node/edge can expose its stable key and source evidence. Generated layout does not alter the baseline.

## Profile editing target

The Requirement Profile editor is a normal structured form with copilot assistance.

```text
Admin / Requirement Profiles / API Change / draft v9

Required perspectives
[x] API  [x] Architecture  [x] Security  [x] Operations

INTEGRATION requirements
[x] enabled
Required details
[x] Producer
[x] Consumer(s)
[x] Contract
[x] Failure behaviour
[x] Compatibility
[x] Capability link

Architecture
[x] Require published architecture baseline
[x] Confirm impact for HIGH/CRITICAL requirements
[x] Require implementation target
[ ] Allow NEEDS_REVIEW topology to drive confirmed impact

Existing-requirement search
Before CREATE                 [required]
Duplicate threshold           [0.85]
Contradiction review          [required]

[Ask AI to improve profile] [Publish v9]
```

Publishing creates a new immutable profile version. Existing Delivery Subjects do not silently change profile versions.
