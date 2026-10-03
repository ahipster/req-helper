# BPMN-Style Workflow

This is the logical business process for the PoC. The initial implementation may execute it with LangGraph plus deterministic application services rather than a BPMN engine.

## End-to-end process

```text
(Start)
   |
   v
[Create Delivery Subject]
   |
   v
[Clarify signal / problem / outcome]
   |
   v
[Retrieve related enterprise knowledge]
   |
   v
[AI proposes impacts + perspectives]
   |
   v
[Human confirms perspective set]
   |
   v
<Parallel Gateway: required perspectives>
   |
   +--------------------------------------------------+
   |                                                  |
   v                                                  |
[Assign owner/delegate/contributors]                  |
   |                                                  |
   v                                                  |
[Generate targeted drill task]                        |
   |                                                  |
   v                                                  |
(User Task: answer / don't know / nominate expert)    |
   |                                                  |
   v                                                  |
[Extract contributions + epistemic metadata]          |
   |                                                  |
   v                                                  |
[Propose requirement mutations]                       |
   |                                                  |
   v                                                  |
[Validate schema + domain invariants]                  |
   |                                                  |
   v                                                  |
[Persist requirements + provenance + audit event]     |
   |                                                  |
   v                                                  |
[Assess perspective confidence/coverage]              |
   |                                                  |
   v                                                  |
<Enough information?> ---- NO ----> [Next drill] -----+
   |
  YES
   |
   v
<Join Gateway>
   |
   v
[Cross-perspective synthesis]
   |
   v
[Detect gaps, assumptions and conflicts]
   |
   v
<Blocking issues?>
   | YES
   v
[Create verification / gap / resolution tasks]
   |
   v
(User Tasks to affected humans)
   |
   v
[Record verification or explicit decision]
   |
   +-----------------------------> [Cross-perspective synthesis]
   |
   NO / resolved
   v
[Identify affected implementation areas]
   |
   v
[Create work packages + dependencies]
   |
   v
[Generate acceptance criteria]
   |
   v
[Generate evaluation definitions]
   |
   v
[Run deterministic readiness evaluation]
   |
   v
<Ready?>
   | NO
   v
[Create targeted missing tasks]
   |
   +-----------------------------> [Relevant drill/resolution stage]
   |
  YES
   v
(User Task: final package review)
   |
   v
[Publish JSON + Markdown package]
   |
   v
(Ready for downstream SDLC)
```

## Human interaction subprocess

Every human task follows the same pattern:

```text
[Task created]
   |
   v
[Render why this matters + condensed context]
   |
   v
<User response>
   |
   +-- "I don't know" --------> [Capture unknown + route/replan]
   |
   +-- "Ask someone" ---------> [Capture suggested expert + create task]
   |
   +-- substantive answer -----> [Persist raw message]
                                   |
                                   v
                                [Extract contribution(s)]
                                   |
                                   v
                                [Show interpreted structured change]
                                   |
                                   v
                         <Needs explicit verification?>
                              | YES            | NO
                              v                v
                       [Owner review task]   [Continue]
```

## Conflict-resolution subprocess

```text
[Conflict detected]
   |
   v
[Identify affected owners/perspectives]
   |
   v
[Build evidence bundle]
   |
   v
[AI frames disagreement + possible options]
   |
   v
(User discussion / review)
   |
   v
<Decision required?>
   | YES                         | NO
   v                             v
[Named decision owner]        [Correct source/requirement]
   |                             |
   v                             |
[Record explicit decision]       |
   |                             |
   +-------------+---------------+
                 v
         [Mark conflict resolved]
                 |
                 v
        [Re-evaluate affected requirements]
```

## Knowledge-impact subprocess

```text
[Relevant artifact linked]
   |
   v
[Compare current artifact understanding vs proposed requirements]
   |
   v
[Propose ADD/MODIFY/REMOVE/DEPRECATE/UNKNOWN_CHANGE]
   |
   v
[Human can confirm/reject/correct]
   |
   v
[Persist ProposedDiff]
```

No write-back to source repositories occurs in the PoC.

## Readiness subprocess

Readiness is deterministic application code.

```text
[Load persisted domain state]
   |
   v
[Evaluate all readiness checks]
   |
   v
[Persist ReadinessEvaluated event]
   |
   +-- blocking failure --> [NOT_READY + actionable blockers]
   |
   +-- no blocking failure -> [READY]
```

AI may explain a blocker or propose next tasks, but it cannot override the readiness evaluator.

## State transitions

```text
DRAFT
  -> DISCOVERING
  -> DRILLING
  -> RESOLVING
  -> SPLITTING
  -> READY
  -> HANDED_OFF

Any active state may move back to DRILLING/RESOLVING when new evidence invalidates previous assumptions.
CANCELLED is terminal.
```

## PoC simplification

For the first working vertical slice, implement one durable loop:

```text
PLAN DRILL
 -> HUMAN INTERRUPT
 -> EXTRACT CONTRIBUTIONS
 -> SYNTHESIZE REQUIREMENTS
 -> ASSESS GAPS/CONFLICTS
 -> PLAN DRILL ...
```

After the loop is stable, append splitting, acceptance/evals and readiness as mostly deterministic/generative post-processing steps.
