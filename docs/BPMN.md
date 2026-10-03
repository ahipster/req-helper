# BPMN-Style Workflow

This is the logical business process for the PoC. The implementation uses persisted Firestore tasks/state plus a deterministic application controller; OpenCode performs bounded reasoning/tool work. No generic workflow engine is required.

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
[OpenCode proposes impacts + perspectives]
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
[Create targeted drill task]                          |
   |                                                  |
   v                                                  |
(User Task: answer / don't know / nominate expert)    |
   |                                                  |
   v                                                  |
[OpenCode extracts contributions + epistemic data]    |
   |                                                  |
   v                                                  |
[OpenCode proposes requirement commands]              |
   |                                                  |
   v                                                  |
[Validate schema + domain invariants + revision]       |
   |                                                  |
   v                                                  |
[Firestore transaction: state + provenance + event]   |
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

Every human wait is represented by a durable Firestore Task, not suspended in-memory workflow state.

```text
[Task created]
   |
   v
[Relevant user's realtime UI receives task]
   |
   v
[Render why this matters + condensed context]
   |
   v
<User response]
   |
   +-- "I don't know" --------> [Capture unknown + route/replan]
   |
   +-- "Ask someone" ---------> [Capture suggested expert + create task]
   |
   +-- substantive answer -----> [Persist raw message/answer]
                                   |
                                   v
                           [Acquire AgentThread lease]
                                   |
                                   v
                       [OpenCode extracts contribution(s)]
                                   |
                                   v
                         [Validate/apply domain command]
                                   |
                                   v
                         <Needs explicit verification?>
                              | YES            | NO
                              v                v
                       [Owner review task]   [Continue]
```

Each participant/perspective interaction has its own logical AgentThread. Multiple AgentThreads may proceed in parallel against the same Delivery Subject.

## Conflict-resolution subprocess

```text
[Conflict detected]
   |
   v
[Persist Conflict + identify owners/perspectives]
   |
   v
[Build evidence bundle]
   |
   v
[OpenCode frames disagreement + possible options]
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
[Compare current understanding vs proposed requirements]
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

Readiness is deterministic application code over authoritative Firestore state.

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

## PoC execution loop

The smallest durable loop is:

```text
CREATE TASK
 -> HUMAN ANSWER
 -> ACQUIRE AGENT THREAD LEASE
 -> OPENCODE EXTRACT/SYNTHESIZE
 -> VALIDATE STRUCTURED COMMAND
 -> FIRESTORE TRANSACTION
 -> ASSESS GAPS/CONFLICTS
 -> CREATE NEXT TASK(S)
```

There is no suspended graph checkpoint. Waiting is represented by persisted tasks. If OpenCode loses its session, the backend creates a new one and reconstructs relevant context from Firestore.
