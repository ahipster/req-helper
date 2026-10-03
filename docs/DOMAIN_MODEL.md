# Domain and Information Model

## 1. Conceptual model

```text
                         ┌───────────────────┐
                         │   DeliverySubject │
                         └─────────┬─────────┘
                                   │
          ┌────────────────────────┼─────────────────────────┐
          │                        │                         │
          ▼                        ▼                         ▼
   ┌─────────────┐          ┌─────────────┐          ┌──────────────┐
   │ Perspective │          │KnowledgeRef │          │ Requirement  │
   └──────┬──────┘          └──────┬──────┘          └──────┬───────┘
          │                        │                         │
          ▼                        ▼                         ▼
   ┌─────────────┐          ┌─────────────┐          ┌──────────────┐
   │ Assignment  │          │ProposedDiff │          │AcceptanceCrit│
   └──────┬──────┘          └─────────────┘          └──────────────┘
          │
          ▼
   ┌─────────────┐
   │ Drill/Task  │
   └──────┬──────┘
          │
          ▼
 ┌──────────────────┐
 │Contribution/Claim│
 └───────┬──────────┘
         │
    ┌────┴───────────────┐
    ▼                    ▼
 Evidence             Verification

DeliverySubject also aggregates:
Decision | Assumption | Gap | Conflict | Dependency | WorkPackage | Evaluation | DomainEvent
```

## 2. Delivery Subject

```ts
type DeliverySubjectStatus =
  | "DRAFT"
  | "DISCOVERING"
  | "DRILLING"
  | "RESOLVING"
  | "SPLITTING"
  | "READY"
  | "HANDED_OFF"
  | "CANCELLED";

interface DeliverySubject {
  id: string;
  title: string;
  initialSignal: string;
  problemStatement?: string;
  desiredOutcome?: string;
  status: DeliverySubjectStatus;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sponsorId?: string;
  deliveryLeadId?: string;
  createdAt: string;
  updatedAt: string;
  currentIteration: number;
}
```

Invariant: `initialSignal` is immutable after creation.

## 3. Perspective

A perspective is a lens that must be considered, not necessarily an organizational unit.

```ts
type PerspectiveType =
  | "BUSINESS"
  | "PROCESS"
  | "DATA"
  | "ARCHITECTURE"
  | "SECURITY"
  | "PRIVACY"
  | "RISK"
  | "COMPLIANCE"
  | "OPERATIONS"
  | "INTEGRATION"
  | "API"
  | "SYSTEM"
  | "UX"
  | "PLATFORM"
  | "OTHER";

interface Perspective {
  id: string;
  deliverySubjectId: string;
  type: PerspectiveType;
  name: string;
  description?: string;
  criticality: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  required: boolean;
  rationale?: string;
  status: "PROPOSED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETE" | "BLOCKED";
}
```

## 4. Perspective Assignment

```ts
type AssignmentRelationship = "OWNER" | "DELEGATE" | "CONTRIBUTOR" | "REVIEWER";

interface PerspectiveAssignment {
  id: string;
  perspectiveId: string;
  userId: string;
  relationship: AssignmentRelationship;
  required: boolean;
  status: "ACTIVE" | "COMPLETED" | "REMOVED";
}
```

Invariant: every required/critical perspective must have at least one active OWNER or DELEGATE before readiness.

## 5. Contribution

An atomic human-provided statement. A contribution is not automatically authoritative.

```ts
type EpistemicMode = "KNOW" | "BELIEVE" | "OBSERVED" | "UNKNOWN" | "UNSPECIFIED";
type VerificationStatus = "UNVERIFIED" | "OWNER_VERIFIED" | "OWNER_REJECTED" | "SUPERSEDED";

interface Contribution {
  id: string;
  deliverySubjectId: string;
  taskId?: string;
  authorId: string;
  perspectiveId?: string;
  statement: string;
  epistemicMode: EpistemicMode;
  ownershipRelationship?: AssignmentRelationship;
  confidence?: number; // 0..1, never interpreted as authority
  verificationStatus: VerificationStatus;
  likelyAuthoritativeOwnerId?: string;
  createdAt: string;
}
```

Invariant: AI may derive requirements from unverified contributions, but those requirements inherit the unverified provenance and cannot satisfy authoritative-verification readiness rules.

## 6. Evidence

```ts
interface Evidence {
  id: string;
  deliverySubjectId: string;
  kind: "HUMAN_STATEMENT" | "KNOWLEDGE_REFERENCE" | "OBSERVATION" | "POLICY" | "DECISION" | "OTHER";
  sourceId: string;
  excerpt?: string;
  uri?: string;
}
```

## 7. Knowledge Reference

```ts
interface KnowledgeReference {
  id: string;
  deliverySubjectId: string;
  externalType:
    | "CAPABILITY"
    | "BUSINESS_PROCESS"
    | "CONCEPT"
    | "INFORMATION_MODEL"
    | "API"
    | "SOLUTION"
    | "APPLICATION"
    | "POLICY"
    | "CONTROL"
    | "ARCHITECTURE_DECISION"
    | "GLOSSARY_TERM"
    | "SYSTEM"
    | "SERVICE"
    | "DOCUMENT"
    | "OTHER";
  externalSystem: string;
  externalId?: string;
  title: string;
  uri?: string;
  version?: string;
  retrievedAt: string;
  summary?: string;
  relevance?: number;
  metadata?: Record<string, unknown>;
}
```

## 8. Proposed Diff

```ts
type DiffType = "ADD" | "MODIFY" | "REMOVE" | "DEPRECATE" | "UNKNOWN_CHANGE";

interface ProposedDiff {
  id: string;
  deliverySubjectId: string;
  knowledgeReferenceId: string;
  diffType: DiffType;
  before?: unknown;
  after?: unknown;
  reason: string;
  status: "PROPOSED" | "CONFIRMED" | "REJECTED" | "SUPERSEDED";
}
```

These are advisory until future reconciliation.

## 9. Requirement

```ts
type RequirementType =
  | "BUSINESS"
  | "FUNCTIONAL"
  | "PROCESS"
  | "DATA"
  | "INTEGRATION"
  | "SECURITY"
  | "PRIVACY"
  | "COMPLIANCE"
  | "RISK"
  | "OPERATIONAL"
  | "PERFORMANCE"
  | "RESILIENCE"
  | "OBSERVABILITY"
  | "UX"
  | "MIGRATION"
  | "TRANSITION";

type RequirementStatus =
  | "DRAFT"
  | "NEEDS_INPUT"
  | "PROPOSED"
  | "VERIFIED"
  | "CONFLICTED"
  | "APPROVED"
  | "SUPERSEDED";

interface Requirement {
  id: string;
  deliverySubjectId: string;
  type: RequirementType;
  title: string;
  statement: string;
  rationale?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  criticality: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: RequirementStatus;
  ownerId?: string;
  confidence?: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
```

Requirement sources use an explicit join structure:

```ts
interface RequirementSource {
  requirementId: string;
  sourceKind: "CONTRIBUTION" | "KNOWLEDGE_REFERENCE" | "DECISION" | "ASSUMPTION" | "AI_INFERENCE";
  sourceId: string;
  authoritative: boolean;
}
```

## 10. Gap

```ts
interface Gap {
  id: string;
  deliverySubjectId: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  perspectiveId?: string;
  requiredOwnerId?: string;
  blocking: boolean;
  status: "OPEN" | "RESOLVED" | "ACCEPTED_RISK" | "SUPERSEDED";
}
```

## 11. Conflict

```ts
interface Conflict {
  id: string;
  deliverySubjectId: string;
  description: string;
  itemAType: string;
  itemAId: string;
  itemBType: string;
  itemBId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ownerIds: string[];
  blocking: boolean;
  resolution?: string;
  decisionId?: string;
  status: "OPEN" | "RESOLVED" | "SUPERSEDED";
}
```

## 12. Assumption

```ts
interface Assumption {
  id: string;
  deliverySubjectId: string;
  statement: string;
  ownerId?: string;
  confidence?: number;
  validationMethod?: string;
  impactIfWrong?: string;
  status: "OPEN" | "VALIDATED" | "INVALIDATED" | "ACCEPTED" | "SUPERSEDED";
}
```

## 13. Decision

```ts
interface Decision {
  id: string;
  deliverySubjectId: string;
  question: string;
  alternatives: string[];
  decision: string;
  rationale: string;
  ownerId: string;
  participantIds: string[];
  affectedRequirementIds: string[];
  supersedesDecisionId?: string;
  createdAt: string;
}
```

## 14. Task / Drill Question

```ts
type TaskType = "DRILL" | "VERIFY" | "REVIEW" | "RESOLVE_CONFLICT" | "FILL_GAP" | "FINAL_REVIEW";

interface Task {
  id: string;
  deliverySubjectId: string;
  type: TaskType;
  assigneeId: string;
  perspectiveId?: string;
  title: string;
  question?: string;
  rationale?: string;
  priority: number;
  blocking: boolean;
  status: "OPEN" | "WAITING" | "ANSWERED" | "COMPLETED" | "CANCELLED";
  relatedObjectIds: string[];
}
```

## 15. Work Package

```ts
interface WorkPackage {
  id: string;
  deliverySubjectId: string;
  area: string;
  ownerId?: string;
  status: "DRAFT" | "NEEDS_INPUT" | "READY" | "HANDED_OFF";
  requirementIds: string[];
  dependencyIds: string[];
  knowledgeReferenceIds: string[];
}
```

## 16. Acceptance Criterion

```ts
interface AcceptanceCriterion {
  id: string;
  requirementId: string;
  given?: string;
  when?: string;
  then: string;
  verificationType: "AUTOMATED_TEST" | "HUMAN_REVIEW" | "OBSERVATION" | "POLICY_CHECK" | "OTHER";
  automatable: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}
```

## 17. Evaluation

```ts
interface Evaluation {
  id: string;
  requirementId: string;
  name: string;
  evaluationType:
    | "DETERMINISTIC_TEST"
    | "SEMANTIC_LLM_EVAL"
    | "PERFORMANCE_TEST"
    | "SECURITY_CHECK"
    | "POLICY_CHECK"
    | "HUMAN_EVAL";
  inputDefinition?: string;
  expectedBehaviour: string;
  threshold?: string;
  failureBehaviour: string;
}
```

## 18. Dependency

```ts
interface Dependency {
  id: string;
  deliverySubjectId: string;
  fromType: "REQUIREMENT" | "WORK_PACKAGE" | "KNOWLEDGE_REFERENCE";
  fromId: string;
  toType: "REQUIREMENT" | "WORK_PACKAGE" | "KNOWLEDGE_REFERENCE";
  toId: string;
  type: "REQUIRES" | "BLOCKS" | "USES" | "PROVIDES" | "CONSTRAINS" | "OTHER";
  description?: string;
  ownerId?: string;
  resolved: boolean;
}
```

## 19. Traceability

Minimum supported lineage:

```text
Signal
 -> Contribution / Knowledge Reference
 -> Requirement
 -> Decision (where relevant)
 -> Work Package
 -> Acceptance Criterion
 -> Evaluation
```

The API must support reverse traversal from any final work-package item back to original signal/evidence.

## 20. Deterministic readiness

Readiness returns checks, not just a percentage.

```ts
interface ReadinessCheck {
  code: string;
  passed: boolean;
  blocking: boolean;
  message: string;
  relatedObjectIds: string[];
}

interface ReadinessResult {
  state: "NOT_READY" | "READY";
  score: number; // informational only
  checks: ReadinessCheck[];
}
```

Baseline blocking checks:
1. problem and desired outcome present;
2. every required critical perspective has accountable owner/delegate;
3. critical requirements are verified and have authoritative provenance;
4. no blocking gap is open;
5. no blocking conflict is open;
6. major assumptions are owned and explicitly handled;
7. required enterprise knowledge/impact links exist where flagged;
8. every critical requirement belongs to a work package;
9. every critical requirement has acceptance criteria;
10. every requirement flagged as needing an eval has at least one eval;
11. unresolved blocking dependencies are owned;
12. no blocking task is unassigned.
