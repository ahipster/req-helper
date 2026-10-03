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

export const DeliverySubjectKind = z.enum([
  "GENERAL",
  "API_CHANGE",
  "DATA_MODEL_CHANGE",
  "REGULATORY_CHANGE",
  "CUSTOMER_JOURNEY_CHANGE",
  "OPERATIONAL_CHANGE",
  "MIGRATION",
  "NEW_SERVICE",
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
  subjectKind: DeliverySubjectKind.optional(),
  requirementProfileId: z.string().optional(),
  requirementProfileVersion: z.number().int().positive().optional(),
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
    perspectiveId: z.string(),
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
  stableKey: z.string().optional(),
  title: z.string(),
  uri: z.string().optional(),
  version: z.string().optional(),
  fingerprint: z.string().optional(),
  retrievedAt: z.string(),
  summary: z.string().optional(),
  relevance: z.number().min(0).max(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ProposedDiffSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  knowledgeReferenceId: z.string(),
  baselineVersion: z.string().optional(),
  baselineFingerprint: z.string().optional(),
  diffType: z.enum(["ADD", "MODIFY", "REMOVE", "DEPRECATE", "UNKNOWN_CHANGE"]),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  reason: z.string(),
  status: z.enum(["PROPOSED", "CONFIRMED", "REJECTED", "SUPERSEDED", "STALE_BASELINE"]),
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

export const RequirementDetailValueType = z.enum([
  "TEXT",
  "BOOLEAN",
  "NUMBER",
  "ENUM",
  "REFERENCE",
  "TEXT_LIST",
  "REFERENCE_LIST",
]);

export const RequirementDetailValueSchema = z.object({
  fieldKey: z.string().min(1),
  valueType: RequirementDetailValueType,
  textValue: z.string().optional(),
  booleanValue: z.boolean().optional(),
  numberValue: z.number().optional(),
  listValue: z.array(z.string()).optional(),
});

export const RequirementProfileFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  valueType: RequirementDetailValueType,
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  prompt: z.string().optional(),
});

export const RequirementProfileTypePolicySchema = z.object({
  requirementType: RequirementType,
  enabled: z.boolean().default(true),
  requiredByDefault: z.boolean().default(false),
  requireRationale: z.boolean().default(false),
  requireOwner: z.boolean().default(false),
  requireCapabilityLink: z.boolean().default(false),
  requireAuthoritativeProvenance: z.boolean().default(false),
  minimumAcceptanceCriteria: z.number().int().nonnegative().default(0),
  requireAutomatableAcceptance: z.boolean().default(false),
  requiredEvaluationTypes: z.array(z.enum([
    "DETERMINISTIC_TEST",
    "SEMANTIC_LLM_EVAL",
    "PERFORMANCE_TEST",
    "SECURITY_CHECK",
    "POLICY_CHECK",
    "HUMAN_EVAL",
  ])).default([]),
  detailFields: z.array(RequirementProfileFieldSchema).default([]),
});

export const RequirementProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  currentPublishedVersion: z.number().int().positive().optional(),
  active: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RequirementProfileVersionSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  version: z.number().int().positive(),
  status: z.enum(["DRAFT", "PUBLISHED", "RETIRED"]),
  name: z.string().min(1),
  description: z.string().optional(),
  applicableSubjectKinds: z.array(DeliverySubjectKind).default([]),
  requiredPerspectiveTypes: z.array(PerspectiveType).default([]),
  typePolicies: z.array(RequirementProfileTypePolicySchema).default([]),
  requireExistingRequirementSearchBeforeCreate: z.boolean().default(true),
  duplicateMatchThreshold: z.number().min(0).max(1).default(0.85),
  contradictionReviewRequired: z.boolean().default(true),
  createdBy: z.string(),
  createdAt: z.string(),
  publishedAt: z.string().optional(),
});

export const RequirementQualityFindingSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  profileId: z.string(),
  profileVersion: z.number().int().positive(),
  requirementId: z.string().optional(),
  ruleId: z.string(),
  severity: Criticality,
  blocking: z.boolean(),
  message: z.string(),
  status: z.enum(["OPEN", "RESOLVED", "WAIVED"]),
  waiverDecisionId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RequirementCatalogLifecycle = z.enum(["ACTIVE", "DEPRECATED", "RETIRED"]);

export const RequirementCatalogItemSchema = z.object({
  id: z.string(),
  stableKey: z.string().min(1),
  type: RequirementType,
  title: z.string().min(1),
  lifecycle: RequirementCatalogLifecycle,
  currentVersion: z.number().int().positive(),
  capabilityRefs: z.array(z.string()).default([]),
  authoritativeSourceSystem: z.string().optional(),
  authoritativeExternalId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RequirementCatalogVersionSchema = z.object({
  id: z.string(),
  requirementId: z.string(),
  version: z.number().int().positive(),
  type: RequirementType,
  title: z.string().min(1),
  statement: z.string().min(1),
  rationale: z.string().optional(),
  criticality: Criticality,
  capabilityRefs: z.array(z.string()).default([]),
  details: z.array(RequirementDetailValueSchema).default([]),
  sourceVersion: z.string().optional(),
  sourceFingerprint: z.string().optional(),
  effectiveFrom: z.string().optional(),
  publishedAt: z.string(),
  publishedBy: z.string().optional(),
});

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
  capabilityRefs: z.array(z.string()).optional(),
  details: z.array(RequirementDetailValueSchema).optional(),
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
  type: RequirementType,
  title: z.string().min(1),
  statement: z.string().min(1),
  rationale: z.string().optional(),
  priority: Priority,
  criticality: Criticality,
  ownerId: z.string().optional(),
  capabilityRefs: z.array(z.string()).optional(),
  details: z.array(RequirementDetailValueSchema).optional(),
  requiresEvaluation: z.boolean(),
  changedByActorType: z.enum(["HUMAN", "AI", "SYSTEM"]),
  changedByActorId: z.string().optional(),
  reason: z.string().optional(),
  createdAt: z.string(),
});

export const RequirementChangeType = z.enum([
  "CREATE",
  "MODIFY",
  "SUPERSEDE",
  "RETIRE",
  "NO_CHANGE",
]);

export const RequirementChangeProposalStatus = z.enum([
  "DRAFT",
  "PROPOSED",
  "VERIFIED",
  "APPROVED_FOR_HANDOFF",
  "HANDED_OFF",
  "REJECTED",
  "WITHDRAWN",
  "STALE_BASELINE",
]);

export const RequirementChangeProposalSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  changeType: RequirementChangeType,
  baselineRequirementId: z.string().optional(),
  baselineVersion: z.number().int().positive().optional(),
  proposedRequirementId: z.string().optional(),
  rationale: z.string().min(1),
  status: RequirementChangeProposalStatus,
  relatedConflictIds: z.array(z.string()).default([]),
  supersedesProposalIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RequirementMatchSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  subjectRequirementId: z.string(),
  candidateKind: z.enum(["BASELINE_REQUIREMENT", "ACTIVE_PROPOSAL"]),
  candidateId: z.string(),
  candidateVersion: z.number().int().positive().optional(),
  relationship: z.enum(["DUPLICATE", "OVERLAPS", "CONTRADICTS", "RELATED"]),
  score: z.number().min(0).max(1).optional(),
  rationale: z.string(),
  blocking: z.boolean().default(false),
  status: z.enum(["UNREVIEWED", "CONFIRMED", "DISMISSED"]),
  createdAt: z.string(),
  updatedAt: z.string(),
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
    "BASELINE_REQUIREMENT",
    "AI_INFERENCE",
  ]),
  sourceId: z.string(),
  sourceVersion: z.string().optional(),
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
  "BASELINE_REQUIREMENT",
  "REQUIREMENT_CHANGE_PROPOSAL",
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
export type RequirementProfile = z.infer<typeof RequirementProfileSchema>;
export type RequirementProfileVersion = z.infer<typeof RequirementProfileVersionSchema>;
export type RequirementQualityFinding = z.infer<typeof RequirementQualityFindingSchema>;
export type RequirementCatalogItem = z.infer<typeof RequirementCatalogItemSchema>;
export type RequirementCatalogVersion = z.infer<typeof RequirementCatalogVersionSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type RequirementRevision = z.infer<typeof RequirementRevisionSchema>;
export type RequirementChangeProposal = z.infer<typeof RequirementChangeProposalSchema>;
export type RequirementMatch = z.infer<typeof RequirementMatchSchema>;
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
