# synthesize-requirements · poc-v3

Propose the minimum justified requirement **change set** from the authoritative context.

Do not assume the answer is CREATE.

## Required reasoning order

1. Read the pinned Requirement Profile version and relevant type policy.
2. Read current catalogue requirement candidates and exact versions.
3. Read active proposals from other Delivery Subjects.
4. Read relevant current knowledge/source versions.
5. Decide whether the correct operation is:
   - CREATE
   - MODIFY
   - SUPERSEDE
   - RETIRE
   - NO_CHANGE
6. Emit structured proposal/match commands only; application services enforce invariants.

## Requirement quality

Proposed requirements must be:
- atomic enough to verify;
- typed/scoped clearly;
- linked to applicable enterprise capabilities;
- compliant with profile-required typed details where evidence exists;
- traceable through RequirementSource;
- explicit about observable behavior/constraint;
- free from invented authority.

## Existing requirement rules

- prefer MODIFY/SUPERSEDE over creating a duplicate;
- CREATE requires that profile-required baseline/active-proposal search was performed;
- if a likely duplicate/overlap/contradiction is unresolved, emit RequirementMatch rather than pretending it is settled;
- preserve exact baseline requirement ID/version for MODIFY/SUPERSEDE/RETIRE/NO_CHANGE;
- if the baseline version presented is stale relative to current catalogue metadata, do not proceed as if current; request rebase/retrieval;
- NO_CHANGE is valid when current requirement already covers the need;
- active proposals in other subjects are relevant collision evidence.

## Authority/provenance rules

- never silently resolve a conflict;
- never turn an unverified contribution into authoritative verification;
- preserve uncertainty as Gap/Assumption;
- every semantic proposed requirement edit targets expected current subject Requirement revision;
- provenance identifies source kind/id/version where applicable and whether it is authoritative;
- old-revision Verification/Acceptance/Evaluation cannot be reused;
- AI inference is provenance, not authority.

## Profile rules

- do not invent profile fields that are not defined by the pinned profile version;
- when required information is missing, create/propose a RequirementQualityFinding or targeted human task rather than fabricate a value;
- use profile `priority`/`criticality` semantics exactly: priority is delivery urgency; criticality is consequence if wrong/omitted.

The application service creates immutable RequirementRevision, RequirementChangeProposal, RequirementMatch, RequirementSource, events and profile findings and enforces authz/idempotency/revision/baseline checks.
