# Req Helper

AI-first requirements orchestration PoC for enterprise delivery.

Req Helper turns a raw signal/idea into a traceable, multi-perspective requirement package that a downstream SDLC can implement. The PoC is intentionally narrower than OrgWard: it focuses on requirements discovery, human/AI review loops, enterprise knowledge linkage, requirement decomposition, acceptance criteria, evals, and deterministic readiness.

## Core thesis

The primary object is a **Delivery Subject**, not a chat transcript.

```text
Signal
  -> Delivery Subject
  -> Knowledge + impact hypotheses
  -> Perspective-specific human drills
  -> Contributions / evidence / verification
  -> Structured requirements
  -> Gaps / conflicts / decisions
  -> Work-package split
  -> Acceptance criteria + evals
  -> Deterministic readiness gate
  -> Requirement package for downstream SDLC
```

## PoC boundary

In scope:
- create and persist a Delivery Subject;
- propose affected perspectives;
- assign owners/contributors/reviewers;
- run AI-guided drills with humans;
- capture contributions separately from authoritative verification;
- synthesize and version structured requirements;
- link existing enterprise knowledge and record proposed diffs;
- detect gaps, assumptions, conflicts, and decisions;
- split final requirements into affected-area work packages;
- generate detailed acceptance criteria and eval definitions;
- compute readiness deterministically;
- expose war-room traces for prompt/workflow tuning.

Out of scope for this PoC:
- autonomous implementation/deployment;
- authoritative write-back to enterprise architecture repositories;
- generic enterprise knowledge graph;
- full portfolio/project management;
- production-grade fine-grained RBAC;
- complete notification/inbox integration;
- generic workflow platform.

## Recommended stack

- TypeScript / Node.js
- Next.js + React
- assistant-ui for the composable conversation surface
- PostgreSQL as system of record
- LangGraph for the bounded human-in-the-loop orchestration loop
- Zod/JSON Schema for every structured AI output
- adapter boundary for MCP / REST / SQL / files / search

The domain database remains authoritative. LangGraph state is execution state only.

## Repository map

```text
docs/                Product, architecture, BPMN and delivery plan
src/domain/          Domain model and deterministic readiness
src/orchestration/   LangGraph workflow skeleton
src/adapters/        Knowledge/LLM/identity boundaries
src/seed/            War-room demo scenario
prompts/             Small role-specific prompt/skill files
tests/               Domain and readiness tests
```

## Start here

1. Read `docs/PRD.md`.
2. Read `docs/ARCHITECTURE.md` and `docs/DOMAIN_MODEL.md`.
3. Follow `docs/IMPLEMENTATION_PLAN.md` in priority order.
4. Use `src/seed/customer-status-change.ts` as the first war-room scenario.
5. Keep the orchestration loop small: **drill -> extract -> update -> assess gaps -> ask again**.

## Design constraints

1. Chat must never be the only durable representation.
2. Every material requirement needs provenance.
3. Useful knowledge may come from non-owners; authority must be explicit.
4. Conflicts, assumptions, decisions, and gaps are first-class records.
5. Readiness is code, not an LLM opinion.
6. MCP is an integration boundary, not the internal architecture.
7. Prefer a modular monolith for the PoC.
