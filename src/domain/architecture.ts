import { z } from "zod";

export const ArchitectureSourceType = z.literal("GIT_MARKDOWN");

export const ArchitectureSourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sourceType: ArchitectureSourceType,
  repository: z.string().min(1),
  defaultBranch: z.string().min(1),
  pathPrefixes: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
  currentCommitSha: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ArchitectureSourceCommitSchema = z.object({
  sourceId: z.string(),
  repository: z.string(),
  branch: z.string(),
  commitSha: z.string(),
});

export const ArchitectureSourceEvidenceMode = z.enum(["EXPLICIT", "INFERRED"]);

export const ArchitectureSourceEvidenceSchema = z.object({
  sourceId: z.string(),
  commitSha: z.string(),
  path: z.string(),
  blobSha: z.string().optional(),
  fingerprint: z.string().optional(),
  lineStart: z.number().int().positive().optional(),
  lineEnd: z.number().int().positive().optional(),
  excerpt: z.string().optional(),
  mode: ArchitectureSourceEvidenceMode,
});

export const ArchitectureElementType = z.enum([
  "CAPABILITY",
  "BUSINESS_ACTOR",
  "BUSINESS_ROLE",
  "BUSINESS_PROCESS",
  "BUSINESS_SERVICE",
  "BUSINESS_OBJECT",
  "APPLICATION_COMPONENT",
  "APPLICATION_SERVICE",
  "APPLICATION_INTERFACE",
  "DATA_OBJECT",
  "NODE",
  "TECHNOLOGY_SERVICE",
  "INFORMATION_CONCEPT",
  "POLICY",
  "CONTROL",
  "API",
  "EVENT",
  "REPOSITORY",
  "TEAM",
  "OTHER",
]);

export const ArchitectureRelationshipType = z.enum([
  "REALIZES",
  "SERVES",
  "ASSIGNED_TO",
  "ACCESSES",
  "TRIGGERS",
  "FLOWS_TO",
  "COMPOSED_OF",
  "AGGREGATES",
  "SPECIALIZES",
  "ASSOCIATED_WITH",
  "OWNS",
  "IMPLEMENTS",
  "EXPOSES",
  "CONSUMES",
  "READS",
  "WRITES",
  "DEPENDS_ON",
  "DEPLOYED_TO",
  "GOVERNED_BY",
]);

export const ArchitectureReviewStatus = z.enum([
  "CONFIRMED",
  "NEEDS_REVIEW",
  "REJECTED",
]);

export const ArchitectureElementSchema = z.object({
  id: z.string(),
  baselineId: z.string(),
  baselineVersion: z.number().int().positive(),
  stableKey: z.string().min(1),
  type: ArchitectureElementType,
  name: z.string().min(1),
  description: z.string().optional(),
  lifecycle: z.enum(["ACTIVE", "DEPRECATED", "RETIRED"]).default("ACTIVE"),
  tags: z.array(z.string()).default([]),
  sourceEvidence: z.array(ArchitectureSourceEvidenceSchema).min(1),
  extractionConfidence: z.number().min(0).max(1).optional(),
  reviewStatus: ArchitectureReviewStatus,
  createdAt: z.string(),
});

export const ArchitectureRelationshipSchema = z.object({
  id: z.string(),
  baselineId: z.string(),
  baselineVersion: z.number().int().positive(),
  type: ArchitectureRelationshipType,
  sourceElementKey: z.string().min(1),
  targetElementKey: z.string().min(1),
  description: z.string().optional(),
  sourceEvidence: z.array(ArchitectureSourceEvidenceSchema).min(1),
  extractionConfidence: z.number().min(0).max(1).optional(),
  reviewStatus: ArchitectureReviewStatus,
  createdAt: z.string(),
});

export const ArchitectureViewType = z.enum([
  "BUSINESS_PROCESS",
  "APPLICATION_COOPERATION",
  "SYSTEM_CONTEXT",
  "INFORMATION_STRUCTURE",
  "IMPLEMENTATION_IMPACT",
  "CUSTOM",
]);

export const ArchitectureViewSchema = z.object({
  id: z.string(),
  baselineId: z.string(),
  baselineVersion: z.number().int().positive(),
  name: z.string().min(1),
  viewType: ArchitectureViewType,
  purpose: z.string().optional(),
  elementKeys: z.array(z.string()).default([]),
  relationshipIds: z.array(z.string()).default([]),
  sourceEvidence: z.array(ArchitectureSourceEvidenceSchema).default([]),
  createdAt: z.string(),
});

export const ArchitectureIngestionFindingType = z.enum([
  "MISSING_STABLE_ID",
  "UNRESOLVED_REFERENCE",
  "DUPLICATE_ELEMENT",
  "CONFLICTING_DEFINITION",
  "INVALID_RELATIONSHIP",
  "LOW_CONFIDENCE",
  "SOURCE_CHANGED",
  "OTHER",
]);

export const ArchitectureIngestionFindingSchema = z.object({
  id: z.string(),
  ingestionRunId: z.string(),
  baselineId: z.string().optional(),
  type: ArchitectureIngestionFindingType,
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  blocking: z.boolean(),
  message: z.string(),
  sourceEvidence: z.array(ArchitectureSourceEvidenceSchema).default([]),
  relatedStableKeys: z.array(z.string()).default([]),
  status: z.enum(["OPEN", "RESOLVED", "WAIVED"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ArchitectureIngestionRunSchema = z.object({
  id: z.string(),
  sourceCommits: z.array(ArchitectureSourceCommitSchema).min(1),
  status: z.enum(["QUEUED", "SCANNING", "EXTRACTING", "RECONCILING", "VALIDATING", "SUCCEEDED", "FAILED"]),
  schemaVersion: z.string(),
  promptSkillVersion: z.string(),
  providerId: z.string().optional(),
  modelId: z.string().optional(),
  inputFileCount: z.number().int().nonnegative().default(0),
  changedFileCount: z.number().int().nonnegative().default(0),
  startedAt: z.string(),
  endedAt: z.string().optional(),
});

export const ArchitectureBaselineSchema = z
  .object({
    id: z.string(),
    version: z.number().int().positive(),
    status: z.enum(["DRAFT", "PUBLISHED", "SUPERSEDED"]),
    sourceCommits: z.array(ArchitectureSourceCommitSchema).min(1),
    ingestionRunIds: z.array(z.string()).min(1),
    schemaVersion: z.string(),
    fingerprint: z.string(),
    createdAt: z.string(),
    publishedAt: z.string().optional(),
    publishedBy: z.string().optional(),
  })
  .superRefine((baseline, ctx) => {
    if (baseline.status === "PUBLISHED" && !baseline.publishedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publishedAt"],
        message: "A PUBLISHED architecture baseline requires publishedAt.",
      });
    }
  });

export const DeliverySubjectArchitectureContextSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  architectureBaselineId: z.string(),
  architectureBaselineVersion: z.number().int().positive(),
  baselineFingerprint: z.string(),
  status: z.enum(["CURRENT", "STALE_BASELINE"]),
  pinnedAt: z.string(),
  updatedAt: z.string(),
});

export const RequirementArchitectureImpactType = z.enum([
  "IMPLEMENT",
  "MODIFY",
  "ADAPT",
  "CONSUME",
  "PROVIDE",
  "CONFIGURE",
  "MIGRATE",
  "DEPRECATE",
  "VERIFY_ONLY",
  "NO_CHANGE",
]);

export const RequirementArchitectureImpactSchema = z
  .object({
    id: z.string(),
    deliverySubjectId: z.string(),
    requirementId: z.string(),
    requirementRevision: z.number().int().positive(),
    architectureBaselineId: z.string(),
    architectureBaselineVersion: z.number().int().positive(),
    architectureElementKey: z.string().min(1),
    architectureElementFingerprint: z.string().optional(),
    impactType: RequirementArchitectureImpactType,
    rationale: z.string().min(1),
    confidence: z.number().min(0).max(1).optional(),
    sourceRelationshipIds: z.array(z.string()).default([]),
    status: z.enum(["PROPOSED", "CONFIRMED", "REJECTED", "STALE_BASELINE"]),
    confirmedBy: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .superRefine((impact, ctx) => {
    if (impact.status === "CONFIRMED" && !impact.confirmedBy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmedBy"],
        message: "A CONFIRMED architecture impact requires confirmedBy.",
      });
    }
  });

export const ArchitectureChangeType = z.enum([
  "ADD",
  "MODIFY",
  "REMOVE",
  "DEPRECATE",
  "NO_CHANGE",
]);

export const ArchitectureChangeProposalSchema = z
  .object({
    id: z.string(),
    deliverySubjectId: z.string(),
    targetType: z.enum(["ELEMENT", "RELATIONSHIP"]),
    changeType: ArchitectureChangeType,
    architectureBaselineId: z.string(),
    architectureBaselineVersion: z.number().int().positive(),
    baselineTargetId: z.string().optional(),
    baselineTargetFingerprint: z.string().optional(),
    proposedStableKey: z.string().optional(),
    proposedType: z.string().optional(),
    proposedName: z.string().optional(),
    proposedDescription: z.string().optional(),
    sourceRequirementIds: z.array(z.string()).default([]),
    rationale: z.string().min(1),
    status: z.enum(["DRAFT", "PROPOSED", "CONFIRMED", "REJECTED", "SUPERSEDED", "STALE_BASELINE"]),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .superRefine((proposal, ctx) => {
    if (proposal.changeType === "ADD" && !proposal.proposedStableKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proposedStableKey"],
        message: "ADD architecture change requires proposedStableKey.",
      });
    }
    if (proposal.changeType !== "ADD" && !proposal.baselineTargetId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["baselineTargetId"],
        message: `${proposal.changeType} architecture change requires baselineTargetId.`,
      });
    }
  });

export const WorkPackageImplementationTargetSchema = z.object({
  id: z.string(),
  deliverySubjectId: z.string(),
  workPackageId: z.string(),
  architectureImpactId: z.string(),
  architectureElementKey: z.string().min(1),
  repositoryElementKey: z.string().optional(),
  teamElementKey: z.string().optional(),
  createdAt: z.string(),
});

export const RequirementProfileArchitecturePolicySchema = z
  .object({
    id: z.string(),
    profileId: z.string(),
    profileVersion: z.number().int().positive(),
    requireArchitectureBaseline: z.boolean().default(false),
    requireConfirmedImpactForHighCritical: z.boolean().default(false),
    requireImplementationTargetForHighCritical: z.boolean().default(false),
    allowNeedsReviewElementsForImpact: z.boolean().default(false),
    createdAt: z.string(),
  })
  .superRefine((policy, ctx) => {
    if (policy.requireConfirmedImpactForHighCritical && !policy.requireArchitectureBaseline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requireArchitectureBaseline"],
        message: "Confirmed architecture impact requires an architecture baseline.",
      });
    }
    if (
      policy.requireImplementationTargetForHighCritical &&
      !policy.requireConfirmedImpactForHighCritical
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requireConfirmedImpactForHighCritical"],
        message: "Implementation targets require confirmed architecture impact.",
      });
    }
  });

export type ArchitectureSource = z.infer<typeof ArchitectureSourceSchema>;
export type ArchitectureSourceCommit = z.infer<typeof ArchitectureSourceCommitSchema>;
export type ArchitectureSourceEvidence = z.infer<typeof ArchitectureSourceEvidenceSchema>;
export type ArchitectureElement = z.infer<typeof ArchitectureElementSchema>;
export type ArchitectureRelationship = z.infer<typeof ArchitectureRelationshipSchema>;
export type ArchitectureView = z.infer<typeof ArchitectureViewSchema>;
export type ArchitectureIngestionFinding = z.infer<typeof ArchitectureIngestionFindingSchema>;
export type ArchitectureIngestionRun = z.infer<typeof ArchitectureIngestionRunSchema>;
export type ArchitectureBaseline = z.infer<typeof ArchitectureBaselineSchema>;
export type DeliverySubjectArchitectureContext = z.infer<typeof DeliverySubjectArchitectureContextSchema>;
export type RequirementArchitectureImpact = z.infer<typeof RequirementArchitectureImpactSchema>;
export type ArchitectureChangeProposal = z.infer<typeof ArchitectureChangeProposalSchema>;
export type WorkPackageImplementationTarget = z.infer<typeof WorkPackageImplementationTargetSchema>;
export type RequirementProfileArchitecturePolicy = z.infer<typeof RequirementProfileArchitecturePolicySchema>;
