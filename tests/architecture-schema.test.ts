import { describe, expect, it } from "vitest";
import {
  ArchitectureBaselineSchema,
  ArchitectureChangeProposalSchema,
  ArchitectureImpactAssessmentSchema,
  RequirementArchitectureImpactSchema,
  RequirementProfileArchitecturePolicySchema,
} from "../src/domain/architecture.js";

const now = "2026-10-03T18:00:00+02:00";

describe("architecture schema invariants", () => {
  it("requires baseline before confirmed-impact policy", () => {
    const parsed = RequirementProfileArchitecturePolicySchema.safeParse({
      id: "policy",
      profileId: "api-change",
      profileVersion: 8,
      requireArchitectureBaseline: false,
      requireConfirmedImpactForHighCritical: true,
      requireCompleteImpactAssessmentForHighCritical: false,
      requireImplementationTargetForHighCritical: false,
      allowNeedsReviewElementsForImpact: false,
      createdAt: now,
    });

    expect(parsed.success).toBe(false);
  });

  it("requires confirmed impacts before implementation targets", () => {
    const parsed = RequirementProfileArchitecturePolicySchema.safeParse({
      id: "policy",
      profileId: "api-change",
      profileVersion: 8,
      requireArchitectureBaseline: true,
      requireConfirmedImpactForHighCritical: false,
      requireCompleteImpactAssessmentForHighCritical: false,
      requireImplementationTargetForHighCritical: true,
      allowNeedsReviewElementsForImpact: false,
      createdAt: now,
    });

    expect(parsed.success).toBe(false);
  });

  it("requires a traversal policy when complete impact coverage is required", () => {
    const parsed = RequirementProfileArchitecturePolicySchema.safeParse({
      id: "policy",
      profileId: "api-change",
      profileVersion: 8,
      requireArchitectureBaseline: true,
      requireConfirmedImpactForHighCritical: true,
      requireCompleteImpactAssessmentForHighCritical: true,
      requireImplementationTargetForHighCritical: false,
      allowNeedsReviewElementsForImpact: false,
      createdAt: now,
    });

    expect(parsed.success).toBe(false);
  });

  it("does not allow a COMPLETE impact assessment with unresolved candidates", () => {
    const parsed = ArchitectureImpactAssessmentSchema.safeParse({
      id: "assessment",
      deliverySubjectId: "ds",
      requirementId: "r1",
      requirementRevision: 2,
      architectureBaselineId: "ab",
      architectureBaselineVersion: 3,
      traversalPolicyId: "api-impact",
      traversalPolicyVersion: 1,
      seedElementKeys: ["cap.customer"],
      candidateElementKeys: ["app.api", "app.mobile"],
      assessedElementKeys: ["app.api"],
      unresolvedElementKeys: ["app.mobile"],
      traversalRelationshipIds: [],
      status: "COMPLETE",
      createdAt: now,
      updatedAt: now,
    });

    expect(parsed.success).toBe(false);
  });

  it("requires a human/system confirmer for CONFIRMED impacts", () => {
    const parsed = RequirementArchitectureImpactSchema.safeParse({
      id: "impact",
      deliverySubjectId: "ds",
      requirementId: "r1",
      requirementRevision: 1,
      architectureBaselineId: "ab",
      architectureBaselineVersion: 1,
      architectureElementKey: "app.api",
      impactType: "MODIFY",
      rationale: "Changes API behavior.",
      status: "CONFIRMED",
      createdAt: now,
      updatedAt: now,
    });

    expect(parsed.success).toBe(false);
  });

  it("requires publishedAt on published baselines", () => {
    const parsed = ArchitectureBaselineSchema.safeParse({
      id: "ab",
      version: 1,
      status: "PUBLISHED",
      sourceCommits: [
        {
          sourceId: "src",
          repository: "org/architecture",
          branch: "main",
          commitSha: "abc123",
        },
      ],
      ingestionRunIds: ["run-1"],
      schemaVersion: "1",
      fingerprint: "fp",
      createdAt: now,
    });

    expect(parsed.success).toBe(false);
  });

  it("requires a proposed stable key for ADD architecture changes", () => {
    const parsed = ArchitectureChangeProposalSchema.safeParse({
      id: "cp",
      deliverySubjectId: "ds",
      targetType: "ELEMENT",
      changeType: "ADD",
      architectureBaselineId: "ab",
      architectureBaselineVersion: 1,
      rationale: "Add a new API.",
      status: "PROPOSED",
      createdAt: now,
      updatedAt: now,
    });

    expect(parsed.success).toBe(false);
  });
});
