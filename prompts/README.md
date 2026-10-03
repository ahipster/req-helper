# Prompt Skills

Keep prompts small, versioned and task-specific. The orchestration graph chooses a skill; prompts must not own workflow state.

PoC skill set:
- `plan-drill.md`
- `extract-contributions.md`
- `synthesize-requirements.md`
- `assess-gaps-conflicts.md`

Rules:
1. Dynamic context is injected separately from the static prompt.
2. Structured-output schemas live in code and are validated before domain mutations.
3. Prompt version is persisted with every orchestration step.
4. Changes during war-room testing must be attributable to a specific prompt version.
5. Do not solve recurring domain-model/workflow defects by endlessly adding prompt prose.
