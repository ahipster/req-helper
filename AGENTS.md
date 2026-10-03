# AGENTS.md

This repository is a one-week PoC. Optimize for a complete vertical slice, not framework completeness.

## Mission

Build an AI-first requirements orchestration system that turns a signal into an implementation-ready, machine-readable requirement package through human/AI loops.

## Non-negotiable architecture rules

1. PostgreSQL/domain state is authoritative. Agent/graph state is not.
2. Chat transcripts are interaction history, never the sole representation of requirements.
3. Human contributions and authoritative verification are separate concepts.
4. AI-generated facts must retain provenance and verification state.
5. Readiness criteria are deterministic functions over persisted state.
6. Conflicts, assumptions, gaps and decisions are first-class entities.
7. Enterprise knowledge is linked through adapters; do not build a generic knowledge graph.
8. Do not couple internal services to MCP. MCP may implement an adapter.
9. Keep a modular monolith unless a concrete PoC requirement forces separation.
10. Every structured LLM output must validate against Zod/JSON Schema before mutating domain state.

## Vertical slice

Implement in this order:

1. Delivery Subject creation.
2. Perspective proposal/confirmation.
3. Perspective assignment.
4. Drill task generation.
5. Human response capture.
6. Contribution extraction.
7. Requirement synthesis/versioning.
8. Gap/conflict/assumption detection.
9. Verification/follow-up routing.
10. Knowledge reference + proposed impact diff.
11. Work-package split.
12. Acceptance criteria and eval generation.
13. Deterministic readiness.
14. Final package export.
15. War-room trace view.

Do not implement downstream code generation/deployment.

## Delivery discipline

- Prefer end-to-end behavior over isolated abstractions.
- Add tests when adding a domain invariant or readiness rule.
- Keep prompts small and task-specific under `/prompts`.
- Every AI node should expose: input schema, output schema, permitted tools, retry behavior, human interrupt behavior, prompt version, and trace metadata.
- Every domain mutation should produce an append-only event/audit record.
- Preserve source statements verbatim when deriving requirements.
- Never silently resolve contradictions.
- Never promote an unverified contribution to authoritative truth.

## War-room observability

For every orchestration node capture at minimum:

- run id;
- delivery subject id;
- node name;
- prompt version;
- model/provider;
- start/end/latency;
- tool calls;
- structured output;
- schema failures/retries;
- human interrupt/wait state;
- mutations proposed/applied;
- final node status.

Failures should be classifiable as MODEL, PROMPT, CONTEXT, KNOWLEDGE, WORKFLOW, DOMAIN_MODEL, UX or OWNERSHIP.

## Definition of done for PoC

A seeded realistic signal can be processed end-to-end, with multiple human perspectives, until the application exports a requirement package containing outcomes, decisions, assumptions, requirements, impacts, work packages, acceptance criteria, evals, dependencies, traceability and deterministic readiness evidence.
