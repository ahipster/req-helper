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

## P0 capability choices

### Normal chat — P0

Use for:
- drill questions and answers;
- explanations such as why a question is being asked;
- natural-language corrections;
- asking for broader context;
- follow-up questions.

Chat text is never the only representation of a material requirement/change.

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
```

Example:

```text
AI: This appears to modify an existing integration requirement.

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
│ Why modify instead of create?                                │
│ 0.91 semantic overlap + same capability/API                  │
│                                                             │
│ [Review diff] [Edit proposal] [Wrong match]                  │
╰──────────────────────────────────────────────────────────────╯
```

Tool UIs may collect human input, but authoritative writes occur only through backend application services with authz, revision, idempotency and schema checks.

### Form-filling copilot — core P0

Use natural language to edit drafts of structured forms while the human retains explicit submit/save control.

Required copilot-enabled forms:

- Clarify Scope;
- Requirement editor;
- Decision editor;
- Work Package editor;
- Requirement Profile editor.

Example:

```text
Requirement editor

Type          Integration
Title         Expose verification status
Statement     [ ... ]
Priority      HIGH
Criticality   HIGH
Capabilities  [Customer Verification] [Customer API]

Profile-required details
Producer      [Customer MDM]
Consumers     [Channels]
Failure mode  [not yet supplied]
Compatibility [Backward compatible]

You: "Add that stale values must fail closed and ask Operations
      to define the exact freshness threshold."

AI updates DRAFT fields only
 -> user reviews
 -> [Save revision]
```

The copilot never bypasses RequirementRevision/RequirementSource/Verification mechanics.

### Constrained Generative UI — P0, read/propose oriented

Allow the model to compose views from an allowlisted component vocabulary, for example:

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
```

Best uses:

- Show Bigger Picture;
- current-vs-proposed comparison dashboards;
- impact summaries;
- capability/requirement relationship views;
- conflict summaries;
- traceability explanations;
- readiness/blocker explanations.

Generative UI may dispatch known actions, but those actions still route to normal Tool UI/application commands. Arbitrary HTML/JavaScript is not accepted.

### Interactables — experimental / non-authoritative P0

assistant-ui Interactables are experimental. They may be used for:

- scratch requirement drafts;
- temporary comparison boards;
- planning notes;
- profile-design scratchpads.

They must not be the system of record for Requirement, Requirement Profile, Decision, Verification, Change Proposal or Readiness.

If used, the final committed state is translated into a typed Req Helper command and stored in Firestore.

## Rendering rules by domain event

| Domain situation | Render |
|---|---|
| Agent asks one question | chat |
| Agent identifies an existing requirement match | `review_existing_requirement_match` Tool UI |
| Agent proposes CREATE/MODIFY/SUPERSEDE/RETIRE | Requirement Change Tool UI |
| Human edits structured requirement | form + copilot |
| OWNER/DELEGATE verification needed | Verification Tool UI |
| Conflict appears | Conflict summary + participant Tool UI |
| Decision required | Decision form Tool UI |
| Knowledge change detected | Knowledge Diff Tool UI |
| User asks "show bigger picture" | constrained Generative UI |
| User asks why not READY | generated ReadinessSummary + links to deterministic checks |
| Profile rule is missing | Profile Gap Tool UI |

## Drill Workspace target

```text
┌────────────────┬───────────────────────────────────┬────────────────────┐
│ YOUR FOCUS     │ CONVERSATION / TOOL UI            │ CURRENT STATE      │
│                │                                   │                    │
│ Architecture   │ AI question                       │ Baseline: REQ-248  │
│ 3 tasks        │                                   │ Current v6         │
│                │ ╭ Requirement change ──────────╮ │ Proposed rev 3     │
│                │ │ MODIFY REQ-248 v6            │ │ Profile: API v8    │
│                │ │ current ↔ proposed diff      │ │ Profile gaps: 1    │
│                │ │ [Edit] [Wrong match]         │ │ Conflicts: 1       │
│                │ ╰───────────────────────────────╯ │                    │
│                │                                   │                    │
│                │ [message composer]                │                    │
├────────────────┴───────────────────────────────────┴────────────────────┤
│ [I don't know] [Ask someone] [Show bigger picture]                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Current vs proposed comparison

```text
╭─ REQ-248 · Customer verification exposure ───────────────────╮
│ CURRENT BASELINE v6                PROPOSED BY DS-123 rev 3   │
│                                                             │
│ Customer API exposes status.       Customer API exposes      │
│                                    current status.            │
│ No freshness requirement.          Stale values fail closed. │
│                                                             │
│ Capability: Verification           Capability: Verification  │
│                                    + Operations              │
│                                                             │
│ [Open baseline history]            [Edit proposed]           │
╰──────────────────────────────────────────────────────────────╯

Other active proposal detected:
DS-119 also modifies REQ-248 v6
[Compare] [Link subjects] [Open conflict]
```

## Profile editing target

The Requirement Profile editor is a normal structured form with copilot assistance, not arbitrary model state.

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

Acceptance
Minimum criteria              [2]
Automatable criterion         [required]

Evaluations
Security check                [required]
Performance                   [if HIGH/CRITICAL]

Existing-requirement search
Before CREATE                 [required]
Duplicate threshold           [0.85]
Contradiction review          [required]

[Ask AI to improve profile] [Publish v9]
```

Publishing creates a new immutable profile version. Existing Delivery Subjects do not silently change profile versions.
