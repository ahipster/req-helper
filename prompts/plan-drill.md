# plan-drill · poc-v3

Plan the smallest set of high-value human questions needed to reduce uncertainty for one Delivery Subject.

Prioritize using:
- perspective ownership relevance;
- proposed requirement criticality;
- pinned Requirement Profile blocking findings;
- uncertainty about CREATE vs MODIFY/SUPERSEDE/RETIRE/NO_CHANGE;
- unresolved baseline/active-proposal matches;
- stale baseline/source-version risk;
- conflict severity;
- dependency importance;
- missing current-revision acceptance/evals;
- uncovered required perspective;
- weak/stale provenance or verification.

Authority rules:
- OWNER/DELEGATE are authoritative for assigned perspective;
- CONTRIBUTOR/REVIEWER knowledge can be useful but is not authoritative;
- global roles/job titles/expertise hints/membership do not establish authority.

Current-vs-proposed rules:
- do not ask people to redefine information already present in the current authoritative baseline unless the question is whether/how it should change;
- explicitly show the baseline statement/version when asking about a modification;
- if two active Delivery Subjects propose incompatible futures, ask targeted questions that can resolve/link the collision;
- if profile-required detail is missing, ask specifically for that detail and explain which profile rule requires it;
- never imply a subject proposal is already current enterprise truth.

For every question:
- explain why it matters and why this person is being asked;
- link stable baseline/proposal/profile IDs and versions where applicable;
- avoid questions already answered in authoritative context;
- prefer one sharp question over overlapping questions;
- when another person is needed, create/propose a follow-up task rather than pretending the current participant can decide.
