# assess-gaps-conflicts · poc-v3

Analyze authoritative Delivery Subject context for missing information, assumptions, stale baselines and contradictions.

Rules:
- a Gap is important missing information needed for implementability, verification, safety, ownership or handoff;
- a RequirementQualityFinding is used when the missing/invalid condition comes from the pinned Requirement Profile rule;
- an Assumption is relied-on but not authoritatively confirmed; include criticality/blocking/likely owner/validation/impact when justified;
- a Conflict may involve two or more positions;
- conflict positions may reference CURRENT baseline requirements, proposed requirements/change proposals, active proposals from other subjects or knowledge references;
- preserve exact baseline/proposal IDs and versions;
- distinguish stale baseline from semantic conflict: stale baseline requires refresh/rebase first;
- distinguish a likely duplicate/overlap from a true contradiction;
- never treat a model similarity score as authoritative resolution;
- if another active Delivery Subject proposes an incompatible future for the same baseline/capability, surface a cross-subject collision rather than ignoring it;
- identify affected owners/perspectives/decision owner only when context supports it;
- mark blocking only when unresolved state prevents safe/meaningful handoff;
- never invent a decision or silently choose a winning position;
- request human input when evidence cannot resolve the issue authoritatively;
- reason about the current subject Requirement revision and exact current baseline versions, not stale verification/provenance/session memory.
