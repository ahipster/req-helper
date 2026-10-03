# Prompt Skills

Keep prompts small, versioned and task-specific. The deterministic application controller chooses a skill; prompts never own workflow, authority, baseline promotion or domain truth.

PoC skill set:

- `plan-drill.md`
- `extract-contributions.md`
- `match-requirements.md`
- `synthesize-requirements.md`
- `assess-gaps-conflicts.md`
- `ingest-architecture-markdown.md`
- `assess-architecture-impact.md`

## Context rules

Dynamic context is injected separately from static skill instructions and is explicitly labeled:

```text
PINNED REQUIREMENT PROFILE + ARCHITECTURE POLICY
CURRENT REQUIREMENT / KNOWLEDGE / ARCHITECTURE BASELINE
SUBJECT PROPOSED STATE
OTHER ACTIVE PROPOSALS
CONVERSATION CONTINUITY
CURRENT USER MESSAGE
```

When session memory conflicts with labeled authoritative context, supplied authoritative context wins.

## Responsibilities

### match-requirements

Find and classify candidate CURRENT requirements and ACTIVE proposals before a new CREATE or major semantic change.

### synthesize-requirements

Propose the minimum justified CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE change set after considering profile rules and match results.

### plan-drill

Ask high-value questions driven by uncertainty, profile findings, architecture-impact gaps, stale/missing baseline information, authority and conflicts.

### extract-contributions

Extract atomic human claims/evidence without inventing authority.

### assess-gaps-conflicts

Distinguish generic gaps, profile findings, stale baselines, overlaps and true N-party contradictions.

### ingest-architecture-markdown

Interpret one bounded Git Markdown architecture document into schema-valid candidate elements/relationships/views with exact source evidence and explicit `EXPLICIT | INFERRED` mode.

It does **not** publish baselines, silently merge stable identities or invent missing topology.

### assess-architecture-impact

Given one current Requirement revision and a bounded neighborhood from the pinned published architecture baseline, propose requirement-to-system impacts and optional architecture structure changes.

It must distinguish implementation impact from topology change and must not guess repository/team routing when the current graph lacks that link.

## Global rules

1. Structured-output schemas live in code and validate before mutation.
2. Prompt/skill version is persisted with every AgentRun or ArchitectureIngestionRun as appropriate.
3. War-room changes must be attributable to prompt version.
4. Authority, baseline versioning, profile compliance, architecture publication, readiness and promotion are application/domain rules—not prompt conventions.
5. Model scores/similarity/confidence are evidence, not authority.
6. A proposal is never CURRENT merely because the model describes it as accepted/verified.
7. LLM-extracted architecture is never source truth without source Git evidence and publication/review state.
8. Do not solve recurring domain/workflow defects by adding endless prompt prose; fix the model/service.
9. Prompts may propose commands; application services authorize, revision/baseline-check, apply and audit them.
