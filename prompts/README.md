# Prompt Skills

Keep prompts small, versioned and task-specific. The deterministic application controller chooses a skill; prompts never own workflow, authority, baseline promotion or domain truth.

PoC skill set:

- `plan-drill.md`
- `extract-contributions.md`
- `match-requirements.md`
- `synthesize-requirements.md`
- `assess-gaps-conflicts.md`

## Context rules

Dynamic context is injected separately from static skill instructions and is explicitly labeled:

```text
PINNED REQUIREMENT PROFILE
CURRENT BASELINE
SUBJECT PROPOSED STATE
OTHER ACTIVE PROPOSALS
CONVERSATION CONTINUITY
CURRENT USER MESSAGE
```

When session memory conflicts with labeled authoritative context, the supplied authoritative context wins.

## Responsibilities

### match-requirements

Find and classify candidate CURRENT requirements and ACTIVE proposals before a new CREATE or major semantic change.

### synthesize-requirements

Propose the minimum justified CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE change set after considering profile rules and match results.

### plan-drill

Ask high-value questions driven by uncertainty, profile findings, stale/missing baseline information, authority and conflicts.

### extract-contributions

Extract atomic human claims/evidence without inventing authority.

### assess-gaps-conflicts

Distinguish generic gaps, profile findings, stale baselines, overlaps and true N-party contradictions.

## Global rules

1. Structured-output schemas live in code and validate before mutation.
2. Prompt/skill version is persisted with every AgentRun.
3. Changes during war-room testing must be attributable to prompt version.
4. Authority, baseline versioning, profile compliance, readiness and promotion are application/domain rules—not prompt conventions.
5. Model scores/similarity are evidence, not authority.
6. A proposal is never CURRENT merely because the model describes it as accepted/verified.
7. Do not solve recurring domain/workflow defects by adding endless prompt prose; fix the model/service.
8. Prompts may propose commands; application services authorize, revision/baseline-check, apply and audit them.
