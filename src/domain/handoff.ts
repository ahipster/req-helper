import { z } from "zod";
import type { DeliverySubject } from "./schemas.js";
import type { DeliverySubjectArchitectureContext } from "./architecture.js";

export const HandoffPackageStatus = z.enum([
  "DRAFT",
  "PUBLISHED",
  "SUPERSEDED",
]);

export const HandoffObjectType = z.enum([
  "REQUIREMENT",
  "REQUIREMENT_CHANGE_PROPOSAL",
  "KNOWLEDGE_DIFF",
  "ARCHITECTURE_IMPACT",
  "ARCHITECTURE_CHANGE_PROPOSAL",
  "WORK_PACKAGE",
  "ACCEPTANCE_CRITERION",
  "EVALUATION",
  "DEPENDENCY",
  "DECISION",
  "ASSUMPTION",
  "VERIFICATION",
]);

export const HandoffObjectRefSchema = z.object({
  objectType: HandoffObjectType,
  id: z.string().min(1),
  revision: z.number().int().nonnegative().optional(),
  version: z.number().int().positive().optional(),
  fingerprint: z.string().optional(),
});

export const HandoffArtifactSchema = z.object({
  format: z.enum(["JSON", "MARKDOWN"]),
  storageType: z.enum(["GCS", "EXTERNAL"]),
  uri: z.string().min(1),
  sha256: z.string().min(1),
  sizeBytes: z.number().int().nonnegative().optional(),
});

export const HandoffPackageSchema = z
  .object({
    id: z.string().min(1),
    deliverySubjectId: z.string().min(1),
    version: z.number().int().positive(),
    status: HandoffPackageStatus,
    subjectRevision: z.number().int().nonnegative(),
    requirementProfileId: z.string().min(1),
    requirementProfileVersion: z.number().int().positive(),
    architectureBaselineId: z.string().optional(),
    architectureBaselineVersion: z.number().int().positive().optional(),
    architectureBaselineFingerprint: z.string().optional(),
    manifestFingerprint: z.string().min(1),
    objectRefs: z.array(HandoffObjectRefSchema).min(1),
    artifacts: z.array(HandoffArtifactSchema).min(1),
    supersedesPackageId: z.string().optional(),
    supersededByPackageId: z.string().optional(),
    createdBy: z.string().min(1),
    createdAt: z.string(),
    publishedBy: z.string().optional(),
    publishedAt: z.string().optional(),
  })
  .superRefine((pkg, ctx) => {
    if (pkg.status === "PUBLISHED") {
      if (!pkg.publishedBy) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["publishedBy"],
          message: "A PUBLISHED handoff package requires publishedBy.",
        });
      }
      if (!pkg.publishedAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["publishedAt"],
          message: "A PUBLISHED handoff package requires publishedAt.",
        });
      }
      if (!pkg.artifacts.some((artifact) => artifact.format === "JSON")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["artifacts"],
          message: "A PUBLISHED handoff package requires an immutable JSON artifact.",
        });
      }
    }

    const hasArchitectureIdentity = Boolean(
      pkg.architectureBaselineId ||
        pkg.architectureBaselineVersion ||
        pkg.architectureBaselineFingerprint,
    );
    const hasCompleteArchitectureIdentity = Boolean(
      pkg.architectureBaselineId &&
        pkg.architectureBaselineVersion &&
        pkg.architectureBaselineFingerprint,
    );
    if (hasArchitectureIdentity && !hasCompleteArchitectureIdentity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["architectureBaselineId"],
        message:
          "Architecture baseline identity must include id, version and fingerprint together.",
      });
    }

    if (pkg.status === "SUPERSEDED" && !pkg.supersededByPackageId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supersededByPackageId"],
        message: "A SUPERSEDED handoff package requires supersededByPackageId.",
      });
    }
  });

export type HandoffPackage = z.infer<typeof HandoffPackageSchema>;
export type HandoffObjectRef = z.infer<typeof HandoffObjectRefSchema>;

export type HandoffPublicationIssue = {
  code: string;
  message: string;
};

export type HandoffPublicationValidation = {
  publishable: boolean;
  issues: HandoffPublicationIssue[];
};

/**
 * Validate the exact snapshot being published. Publication freezes content;
 * later subject edits create a new package version rather than changing this one.
 */
export function validateHandoffPublication(input: {
  candidate: HandoffPackage;
  deliverySubject: DeliverySubject;
  readinessState: "READY" | "NOT_READY";
  architectureContext?: DeliverySubjectArchitectureContext;
  latestPublishedPackage?: HandoffPackage;
}): HandoffPublicationValidation {
  const issues: HandoffPublicationIssue[] = [];
  const { candidate, deliverySubject, architectureContext, latestPublishedPackage } = input;

  if (candidate.status !== "PUBLISHED") {
    issues.push({
      code: "PACKAGE_NOT_PUBLISHED",
      message: "Publication validation requires candidate status PUBLISHED.",
    });
  }

  if (input.readinessState !== "READY") {
    issues.push({
      code: "SUBJECT_NOT_READY",
      message: "Only a READY Delivery Subject may publish a handoff package.",
    });
  }

  if (candidate.deliverySubjectId !== deliverySubject.id) {
    issues.push({
      code: "SUBJECT_MISMATCH",
      message: "Handoff package Delivery Subject does not match the aggregate.",
    });
  }

  if (candidate.subjectRevision !== deliverySubject.revision) {
    issues.push({
      code: "STALE_SUBJECT_REVISION",
      message: `Package snapshots subject revision ${candidate.subjectRevision}, current is ${deliverySubject.revision}.`,
    });
  }

  if (
    candidate.requirementProfileId !== deliverySubject.requirementProfileId ||
    candidate.requirementProfileVersion !== deliverySubject.requirementProfileVersion
  ) {
    issues.push({
      code: "PROFILE_MISMATCH",
      message: "Package profile/version must equal the Delivery Subject pinned profile/version.",
    });
  }

  if (architectureContext) {
    const matchesArchitecture =
      candidate.architectureBaselineId === architectureContext.architectureBaselineId &&
      candidate.architectureBaselineVersion === architectureContext.architectureBaselineVersion &&
      candidate.architectureBaselineFingerprint === architectureContext.baselineFingerprint;
    if (!matchesArchitecture) {
      issues.push({
        code: "ARCHITECTURE_BASELINE_MISMATCH",
        message: "Package must snapshot the exact architecture baseline pinned by the subject.",
      });
    }
  }

  if (latestPublishedPackage) {
    if (candidate.version !== latestPublishedPackage.version + 1) {
      issues.push({
        code: "PACKAGE_VERSION_NOT_SEQUENTIAL",
        message: "A new published package version must increment the previous published version by one.",
      });
    }
    if (candidate.supersedesPackageId !== latestPublishedPackage.id) {
      issues.push({
        code: "SUPERSESSION_LINK_MISSING",
        message: "A replacement handoff package must explicitly supersede the previous published package.",
      });
    }
  } else if (candidate.version !== 1) {
    issues.push({
      code: "FIRST_PACKAGE_MUST_BE_V1",
      message: "The first published handoff package must be version 1.",
    });
  }

  return { publishable: issues.length === 0, issues };
}
