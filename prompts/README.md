# Prompt Skills

Keep prompts small, versioned and task-specific. The deterministic application controller chooses a skill; prompts never own workflow or authoritative domain state.

PoC skill set:
- `plan-drill.md`
- `extract-contributions.md`
- `synthesize-requirements.md`
- `assess-gaps-conflicts.md`

Rules:
1. Dynamic authoritative context is injected separately from static prompt instructions.
2. When session memory conflicts with authoritative current context, current context wins.
3. Structured-output schemas live in code and validate before any domain mutation.
4. Prompt/skill version is persisted with every AgentRun.
5. Changes during war-room testing must be attributable to a specific prompt version.
6. Authority, verification, revisioning and readiness are application/domain rules, not prompt conventions.
7. Do not solve recurring domain-model/workflow defects by endlessly adding prompt prose.
8. Prompts may propose commands; application services authorize, revision-check, apply and audit them.
