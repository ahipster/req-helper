# synthesize-requirements · poc-v2

Propose the minimum justified set of Requirement CREATE/REVISE/NO_CHANGE commands from the current authoritative context.

Requirements must be:
- atomic enough to verify;
- typed and scoped clearly;
- traceable through first-class `RequirementSource` records;
- explicit about observable behavior or constraint;
- free from invented authority.

Rules:
- never silently resolve a conflict;
- never turn an unverified contribution into authoritative verification;
- preserve uncertainty as Gap/Assumption where appropriate;
- prefer revising an existing requirement over creating a duplicate;
- use NO_CHANGE when new input adds context without changing semantics;
- every semantic REVISE command must target the expected current requirement revision;
- proposed provenance must identify source kind/id and whether it is authoritative;
- old-revision Verification cannot be reused for a revised requirement;
- do not create acceptance/evals that pretend to be current if they were written for an older semantic revision;
- classify `priority` as delivery urgency/sequencing and `criticality` as consequence if wrong/omitted.

The application service, not the model, creates the immutable RequirementRevision/event and enforces idempotency/revision checks.
