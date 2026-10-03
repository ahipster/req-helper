import { z } from "zod";

export const Criticality = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const Priority = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const DeliverySubjectStatus = z.enum([
  "DRAFT",
  "DISCOVERING",
  "DRILLING",
  "RESOLVING",
  "SPLITTING",
  "READY",
  "HANDED_OFF",
  "CANCELLED",
]);

export const PerspectiveType = z.enum([
  "BUSINESS",
  "PROCESS",
  "DATA",
  "ARCHITECTURE",
  "SECURITY",
  "PRIVACY",
  "RISK",
  "COMPLIANCE",
  "OPERATIONS",
  "INTEGRATION",
  "API",
  "SYSTEM",
  "UX",
  "PLATFORM",
  "OTHER",
]);

export const PerspectiveStatus = z.enum([
  "PROPOSED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETE",
  "BLOCKED",
]);

export const AssignmentRelationship = z.enum([
  "OWNER",
  "DELEGATE",
  "CONTRIBUTOR",
  "REVIEWER",
]);

export const SystemRole = z.enum([
  "ADMIN",
  "PARTICIPANT",
  "DELIVERY_LEAD",
  "WAR_ROOM_OPERATOR",
]);

export const SubjectRole = z.enum([
  "SPONSOR",
  "DELIVERY_LEAD",
  "PARTICIPANT",
  "OBSERVER",
]);

export const UserProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.string().email().optional(),
  active: z.boolean().default(true),
  systemRoles: z.array(SystemRole).min(1),
  expertisePerspectiveTypes: z.array(PerspectiveType).default([]),
  title: z.string().optional(),
  team: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RoleTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  systemRoles: z.array(SystemRole).default(["PARTICIPANT"]),
  suggestedPerspectiveTypes: z.array(PerspectiveType).default([]),
  active: z.boolean().default(true),
});

export const PerspectiveTemplateSchema = z.object({
  id: z.string().min(1),
  type: PerspectiveType,
  name: z.string().min(1),
  description: z.string().optional(),
  defaultCriticality: Criticality.optional(),
  active: z.boolean().default(true),
  defaultPromptSkill: z.string().optional(),
});

export const DeliverySubjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  initialSignal: z.string().min(1),
  problemStatement: z.string().min(1).optional(),
  desiredOutcome: z.string().min(1).optional(),
  scopeIn: z.array(z.string()).default([]),
  scopeOut: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  successMeasures: z.array(z.string()).default([]),
  status: DeliverySubjectStatus,
  priority: Priority.optional(),
  sponsorId: z.string().optional(),
  deliveryLeadId: z.string().optional(),
  currentIteration: z.number().int().nonnegative().default(0),
  revision: z.number().int().nonnegative().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DeliverySubjectMembershipSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  userId: z.string(),
  roles: z.array(SubjectRole).min(1),
  active: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PerspectiveSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  type: PerspectiveType,
  name: z.string(),
  description: z.string().optional(),
  criticality: Criticality,
  required: z.boolean(),
  rationale: z.string().optional(),
  status: PerspectiveStatus,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PerspectiveAssignmentSchema = z.object({
  id: z.string(),
  perspectiveId: z.string(),
  userId: z.string(),
  relationship: AssignmentRelationship,
  status: z.enum(["ACTIVE", "COMPLETED", "REMOVED"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const EvidenceKind = z.enum([
  "HUMAN_STATEMENT",
  "KNOWLEDGE_REFERENCE",
  "OBSERVATION",
  "POLICY",
  "DECISION",
  "SOURCE_ARTIFACT",
  "OTHER",
]);

export const EvidenceSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  kind: EvidenceKind,
  sourceId: z.string(),
  excerpt: z.string().optional(),
  uri: z.string().optional(),
  createdAt: z.string(),
});

export const SourceArtifactSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  name: z.string(),
  mediaType: z.string().optional(),
  storageType: z.enum(["LINK", "GCS", "EXTERNAL"]),
  uri: z.string(),
  sizeBytes: z.number().int().nonnegative().optional(),
  sha256: z.string().optional(),
  addedBy: z.string(),
  createdAt: z.string(),
});

export const ContributionSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  taskId: z.string().optional(),
  authorId: z.string(),
  perspectiveId: z.string().optional(),
  statement: z.string().min(1),
  epistemicMode: z.enum(["KNOW", "BELIEVE", "OBSERVED", "UNKNOWN", "UNSPECIFIED"]),
  ownershipRelationship: AssignmentRelationship.optional(),
  statedConfidence: z.number().min(0).max(1).optional(),
  extractionConfidence: z.number().min(0).max(1).optional(),
  evidenceIds: z.array(z.string()).default([]),
  likelyAuthoritativeOwnerId: z.string().optional(),
  createdAt: z.string(),
});

const VerificationCommon = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  verifierId: z.string(),
  perspectiveId: z.string().optional(),
  verdict: z.enum(["VERIFIED", "REJECTED", "AMENDED"]),
  rationale: z.string().optional(),
  status: z.enum(["ACTIVE", "SUPERSEDED"]).default("ACTIVE"),
  createdAt: z.string(),
});

export const VerificationSchema = z.discriminatedUnion("targetType", [
  VerificationCommon.extend({
    targetType: z.literal("CONTRIBUTION"),
    targetId: z.string(),
  }),
  VerificationCommon.extend({
    targetType: z.literal("REQUIREMENT"),
    targetId: z.string(),
    targetRevision: z.number().int().positive(),
  }),
  VerificationCommon.extend({
    targetType: z.literal("PROPOSED_DIFF"),
    targetId: z.string(),
    targetRevision: z.number().int().positive(),
  }),
]);

export const KnowledgeReferenceSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  externalType: z.enum([
    "CAPABILITY",
    "BUSINESS_PROCESS",
    "CONCEPT",
    "INFORMATION_MODEL",
    "API",
    "SOLUTION",
    "APPLICATION",
    "POLICY",
    "CONTROL",
    "ARCHITECTURE_DECISION",
    "GLOSSARY_TERM",
    "SYSTEM",
    "SERVICE",
    "DOCUMENT",
    "OTHER",
  ]),
  externalSystem: z.string(),
  externalId: z.string().optional(),
  title: z.string(),
  uri: z.string().optional(),
  version: z.string().optional(),
  retrievedAt: z.string(),
  summary: z.string().optional(),
  relevance: z.number().min(0).max(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ProposedDiffSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  knowledgeReferenceId: z.string(),
  diffType: z.enum(["ADD", "MODIFY", "REMOVE", "DEPRECATE", "UNKNOWN_CHANGE"]),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  reason: z.string(),
  status: z.enum(["PROPOSED", "CONFIRMED", "REJECTED", "SUPERSEDED"]),
  revision: z.number().int().positive().default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RequirementType = z.enum([
  "BUSINESS",
  "FUNCTIONAL",
  "PROCESS",
  "DATA",
  "INTEGRATION",
  "SECURITY",
  "PRIVACY",
  "COMPLIANCE",
  "RISK",
  "OPERATIONAL",
  "PERFORMANCE",
  "RESILIENCE",
  "OBSERVABILITY",
  "UX",
  "MIGRATION",
  "TRANSITION",
]);

// Verification is a separate first-class record. Requirement status tracks
// synthesis/conflict lifecycle, not whether a human has verified the current revision.
export const RequirementStatus = z.enum([
  "DRAFT",
  "NEEDS_INPUT",
  "PROPOSED",
  "CONFLICTED",
  "SUPERSEDED",
]);

export const RequirementSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  type: RequirementType,
  title: z.string().min(1),
  statement: z.string().min(1),
  rationale: z.string().optional(),
  priority: Priority,
  criticality: Criticality,
  status: RequirementStatus,
  ownerId: z.string().optional(),
  extractionConfidence: z.number().min(0).max(1).optional(),
  requiresEvaluation: z.boolean().default(false),
  revision: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RequirementRevisionSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  requirementId: z.string(),
  revision: z.number().int().positive(),
  previousRevision: z.number().int().positive().optional(),
  statement: z.string(),
  title: z.string(),
  changedByActorType: z.enum(["HUMAN", "AI", "SYSTEM"]),
  changedByActorId: z.string().optional(),
  reason: z.string().optional(),
  sourceIds: z.array(z.string()).default([]),
  createdAt: z.string(),
});

export const RequirementSourceSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  requirementId: z.string(),
  requirementRevision: z.number().int().positive(),
  sourceKind: z.enum([
    "CONTRIBUTION",
    "EVIDENCE",
    "KNOWLEDGE_REFERENCE",
    "DECISION",
    "ASSUMPTION",
    "SOURCE_ARTIFACT",
    "AI_INFERENCE",
  ]),
  sourceId: z.string(),
  authoritative: z.boolean(),
  createdAt: z.string(),
});

export const GapSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  description: z.string(),
  severity: Criticality,
  perspectiveId: z.string().optional(),
  requiredOwnerId: z.string().optional(),
  blocking: z.boolean(),
  status: z.enum(["OPEN", "RESOLVED", "ACCEPTED_RISK", "SUPERSEDED"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ConflictItemType = z.enum([
  "CONTRIBUTION",
  "REQUIREMENT",
  "KNOWLEDGE_REFERENCE",
  "DECISION",
  "ASSUMPTION",
  "PROPOSED_DIFF",
  "OTHER",
]);

export const ConflictPositionSchema = z.object({
  id: z.string(),
  actorId: z.string().optional(),
  perspectiveId: z.string().optional(),
  itemType: ConflictItemType,
  itemId: z.string(),
  summary: z.string(),
  evidenceIds: z.array(z.string()).default([]),
});

export const ConflictSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  description: z.string(),
  positions: z.array(ConflictPositionSchema).min(2),
  severity: Criticality,
  ownerIds: z.array(z.string()).min(1),
  decisionOwnerId: z.string().optional(),
  blocking: z.boolean(),
  resolution: z.string().optional(),
  decisionId: z.string().optional(),
  status: z.enum(["OPEN", "RESOLVED", "SUPERSEDED"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AssumptionSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  statement: z.string(),
  ownerId: z.string().optional(),
  statedConfidence: z.number().min(0).max(1).optional(),
  criticality: Criticality,
  blocking: z.boolean().default(false),
  validationMethod: z.string().optional(),
  impactIfWrong: z.string().optional(),
  status: z.enum(["OPEN", "VALIDATED", "INVALIDATED", "ACCEPTED", "SUPERSEDED"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DecisionSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  question: z.string(),
  alternatives: z.array(z.string()).min(1),
  decision: z.string(),
  rationale: z.string(),
  ownerId: z.string(),
  participantIds: z.array(z.string()).default([]),
  affectedRequirementIds: z.array(z.string()).default([]),
  supersedesDecisionId: z.string().optional(),
  createdAt: z.string(),
});

export const WorkPackageSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  name: z.string(),
  targetAreaRef: z.string(),
  targetTeamId: z.string().optional(),
  coordinatorId: z.string().optional(),
  status: z.enum(["DRAFT", "NEEDS_INPUT", "READY", "HANDED_OFF"]),
  requirementIds: z.array(z.string()),
  dependencyIds: z.array(z.string()),
  knowledgeReferenceIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AcceptanceTargetType = z.enum([
  "REQUIREMENT",
  "WORK_PACKAGE",
  "DELIVERY_SUBJECT",
]);

const AcceptanceCommon = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  given: z.string().optional(),
  when: z.string().optional(),
  then: z.string().min(1),
  verificationType: z.enum([
    "AUTOMATED_TEST",
    "HUMAN_REVIEW",
    "OBSERVATION",
    "POLICY_CHECK",
    "OTHER",
  ]),
  automatable: z.boolean(),
  priority: Priority,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AcceptanceCriterionSchema = z.discriminatedUnion("targetType", [
  AcceptanceCommon.extend({
    targetType: z.literal("REQUIREMENT"),
    targetId: z.string(),
    targetRevision: z.number().int().positive(),
  }),
  AcceptanceCommon.extend({
    targetType: z.literal("WORK_PACKAGE"),
    targetId: z.string(),
  }),
  AcceptanceCommon.extend({
    targetType: z.literal("DELIVERY_SUBJECT"),
    targetId: z.string(),
  }),
]);

const EvaluationCommon = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  name: z.string(),
  evaluationType: z.enum([
    "DETERMINISTIC_TEST",
    "SEMANTIC_LLM_EVAL",
    "PERFORMANCE_TEST",
    "SECURITY_CHECK",
    "POLICY_CHECK",
    "HUMAN_EVAL",
  ]),
  inputDefinition: z.string().optional(),
  expectedBehaviour: z.string(),
  threshold: z.string().optional(),
  failureBehaviour: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const EvaluationSchema = z.discriminatedUnion("targetType", [
  EvaluationCommon.extend({
    targetType: z.literal("REQUIREMENT"),
    targetId: z.string(),
    targetRevision: z.number().int().positive(),
  }),
  EvaluationCommon.extend({
    targetType: z.literal("WORK_PACKAGE"),
    targetId: z.string(),
  }),
  EvaluationCommon.extend({
    targetType: z.literal("DELIVERY_SUBJECT"),
    targetId: z.string(),
  }),
]);

export const DependencySchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  fromType: z.enum(["REQUIREMENT", "WORK_PACKAGE", "KNOWLEDGE_REFERENCE"]),
  fromId: z.string(),
  toType: z.enum(["REQUIREMENT", "WORK_PACKAGE", "KNOWLEDGE_REFERENCE"]),
  toId: z.string(),
  type: z.enum(["REQUIRES", "BLOCKS", "USES", "PROVIDES", "CONSTRAINS", "OTHER"]),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  resolved: z.boolean(),
  blocking: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TaskType = z.enum([
  "DRILL",
  "VERIFY",
  "REVIEW",
  "RESOLVE_CONFLICT",
  "FILL_GAP",
  "DECIDE",
  "FOLLOW_UP",
  "FINAL_REVIEW",
]);

export const TaskStatus = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "ANSWERED",
  "PROCESSING",
  "WAITING_ON_OTHER",
  "COMPLETED",
  "CANCELLED",
]);

export const TaskSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  type: TaskType,
  assigneeId: z.string().optional(),
  perspectiveId: z.string().optional(),
  title: z.string(),
  question: z.string().optional(),
  rationale: z.string().optional(),
  priority: z.number(),
  blocking: z.boolean(),
  status: TaskStatus,
  relatedObjectIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Realtime My Work reads a server-maintained projection under the current
// user's profile. It is deliberately non-authoritative and must be deleted or
// updated transactionally when task assignment/access changes.
export const TaskInboxItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  deliverySubjectId: z.string(),
  taskId: z.string(),
  subjectTitle: z.string(),
  perspectiveId: z.string().optional(),
  type: TaskType,
  title: z.string(),
  blocking: z.boolean(),
  status: TaskStatus,
  updatedAt: z.string(),
});

export type DeliverySubject = z.infer<typeof DeliverySubjectSchema>;
export type DeliverySubjectMembership = z.infer<typeof DeliverySubjectMembershipSchema>;
export type Perspective = z.infer<typeof PerspectiveSchema>;
export type PerspectiveAssignment = z.infer<typeof PerspectiveAssignmentSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type RoleTemplate = z.infer<typeof RoleTemplateSchema>;
export type PerspectiveTemplate = z.infer<typeof PerspectiveTemplateSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type SourceArtifact = z.infer<typeof SourceArtifactSchema>;
export type Contribution = z.infer<typeof ContributionSchema>;
export type Verification = z.infer<typeof VerificationSchema>;
export type KnowledgeReference = z.infer<typeof KnowledgeReferenceSchema>;
export type ProposedDiff = z.infer<typeof ProposedDiffSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type RequirementRevision = z.infer<typeof RequirementRevisionSchema>;
export type RequirementSource = z.infer<typeof RequirementSourceSchema>;
export type Gap = z.infer<typeof GapSchema>;
export type Conflict = z.infer<typeof ConflictSchema>;
export type ConflictPosition = z.infer<typeof ConflictPositionSchema>;
export type Assumption = z.infer<typeof AssumptionSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type WorkPackage = z.infer<typeof WorkPackageSchema>;
export type AcceptanceCriterion = z.infer<typeof AcceptanceCriterionSchema>;
export type Evaluation = z.infer<typeof EvaluationSchema>;
export type Dependency = z.infer<typeof DependencySchema>;
export type Task = z.infer<typeof TaskSchema>;
export type TaskInboxItem = z.infer<typeof TaskInboxItemSchema>;
