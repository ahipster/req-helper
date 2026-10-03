import { z } from "zod";

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

export const Criticality = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

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

export const RequirementStatus = z.enum([
  "DRAFT",
  "NEEDS_INPUT",
  "PROPOSED",
  "VERIFIED",
  "CONFLICTED",
  "APPROVED",
  "SUPERSEDED",
]);

export const DeliverySubjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  initialSignal: z.string().min(1),
  problemStatement: z.string().min(1).optional(),
  desiredOutcome: z.string().min(1).optional(),
  status: DeliverySubjectStatus,
  priority: Criticality.optional(),
  sponsorId: z.string().optional(),
  deliveryLeadId: z.string().optional(),
  currentIteration: z.number().int().nonnegative().default(0),
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
  status: z.enum(["PROPOSED", "CONFIRMED", "IN_PROGRESS", "COMPLETE", "BLOCKED"]),
});

export const PerspectiveAssignmentSchema = z.object({
  id: z.string(),
  perspectiveId: z.string(),
  userId: z.string(),
  relationship: AssignmentRelationship,
  required: z.boolean(),
  status: z.enum(["ACTIVE", "COMPLETED", "REMOVED"]),
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
  confidence: z.number().min(0).max(1).optional(),
  verificationStatus: z.enum([
    "UNVERIFIED",
    "OWNER_VERIFIED",
    "OWNER_REJECTED",
    "SUPERSEDED",
  ]),
  likelyAuthoritativeOwnerId: z.string().optional(),
  createdAt: z.string(),
});

export const RequirementSourceSchema = z.object({
  requirementId: z.string(),
  sourceKind: z.enum([
    "CONTRIBUTION",
    "KNOWLEDGE_REFERENCE",
    "DECISION",
    "ASSUMPTION",
    "AI_INFERENCE",
  ]),
  sourceId: z.string(),
  authoritative: z.boolean(),
});

export const RequirementSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  type: RequirementType,
  title: z.string().min(1),
  statement: z.string().min(1),
  rationale: z.string().optional(),
  priority: Criticality,
  criticality: Criticality,
  status: RequirementStatus,
  ownerId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  requiresEvaluation: z.boolean().default(false),
  revision: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
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
});

export const ConflictSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  description: z.string(),
  itemAType: z.string(),
  itemAId: z.string(),
  itemBType: z.string(),
  itemBId: z.string(),
  severity: Criticality,
  ownerIds: z.array(z.string()),
  blocking: z.boolean(),
  resolution: z.string().optional(),
  decisionId: z.string().optional(),
  status: z.enum(["OPEN", "RESOLVED", "SUPERSEDED"]),
});

export const AssumptionSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  statement: z.string(),
  ownerId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  validationMethod: z.string().optional(),
  impactIfWrong: z.string().optional(),
  status: z.enum(["OPEN", "VALIDATED", "INVALIDATED", "ACCEPTED", "SUPERSEDED"]),
});

export const WorkPackageSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  area: z.string(),
  ownerId: z.string().optional(),
  status: z.enum(["DRAFT", "NEEDS_INPUT", "READY", "HANDED_OFF"]),
  requirementIds: z.array(z.string()),
  dependencyIds: z.array(z.string()),
  knowledgeReferenceIds: z.array(z.string()),
});

export const AcceptanceCriterionSchema = z.object({
  id: z.string(),
  requirementId: z.string(),
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
  priority: Criticality,
});

export const EvaluationSchema = z.object({
  id: z.string(),
  requirementId: z.string(),
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
});

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
});

export const TaskSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  type: z.enum(["DRILL", "VERIFY", "REVIEW", "RESOLVE_CONFLICT", "FILL_GAP", "FINAL_REVIEW"]),
  assigneeId: z.string().optional(),
  perspectiveId: z.string().optional(),
  title: z.string(),
  question: z.string().optional(),
  rationale: z.string().optional(),
  priority: z.number(),
  blocking: z.boolean(),
  status: z.enum(["OPEN", "WAITING", "ANSWERED", "COMPLETED", "CANCELLED"]),
  relatedObjectIds: z.array(z.string()),
});

export type DeliverySubject = z.infer<typeof DeliverySubjectSchema>;
export type Perspective = z.infer<typeof PerspectiveSchema>;
export type PerspectiveAssignment = z.infer<typeof PerspectiveAssignmentSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type RoleTemplate = z.infer<typeof RoleTemplateSchema>;
export type PerspectiveTemplate = z.infer<typeof PerspectiveTemplateSchema>;
export type Contribution = z.infer<typeof ContributionSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type RequirementSource = z.infer<typeof RequirementSourceSchema>;
export type Gap = z.infer<typeof GapSchema>;
export type Conflict = z.infer<typeof ConflictSchema>;
export type Assumption = z.infer<typeof AssumptionSchema>;
export type WorkPackage = z.infer<typeof WorkPackageSchema>;
export type AcceptanceCriterion = z.infer<typeof AcceptanceCriterionSchema>;
export type Evaluation = z.infer<typeof EvaluationSchema>;
export type Dependency = z.infer<typeof DependencySchema>;
export type Task = z.infer<typeof TaskSchema>;
