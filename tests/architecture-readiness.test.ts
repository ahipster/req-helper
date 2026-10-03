import { describe, expect, it } from "vitest";
import { evaluateReadiness, type ReadinessSnapshot } from "../src/domain/readiness.js";
import type {
  ArchitectureElement,
  ArchitectureImpactAssessment,
  DeliverySubjectArchitectureContext,
  RequirementArchitectureImpact,
  RequirementProfileArchitecturePolicy,
} from "../src/domain/architecture.js";
import {
  acceptanceCriteria,
  assumptions,
  assignments,
  conflicts,
  deliverySubject,
  evaluations,
  gaps,
  perspectives,
  requirementChangeProposals,
  requirementMatches,
  requirementQualityFindings,
  requirementSources,
  requirements,
  tasks,
  verifications,
  workPackages,
} from "../src/seed/customer-status-change.js";

const now = "2026-10-03T08:00:00+02:00";

const baseSnapshot = (): ReadinessSnapshot => ({
  deliverySubject,
  perspectives,
  assignments,
  requirements,
  requirementChangeProposals,
  requirementMatches,
  requirementQualityFindings,
  requirementSources,
  verifications,
  gaps,
  conflicts,
  assumptions,
  workPackages,
  acceptanceCriteria,
  evaluations,
  dependencies: [],
  tasks,
  requiredImpactLinksSatisfied: true,
});

const policy: RequirementProfileArchitecturePolicy = {
  id: "arch-policy-api-v8",
  profileId: "api-change",
  profileVersion: 8,
  requireArchitectureBaseline: true,
  requireConfirmedImpactForHighCritical: true,
  requireCompleteImpactAssessmentForHighCritical: false,
  requireImplementationTargetForHighCritical: false,
  allowNeedsReviewElementsForImpact: false,
  createdAt: now,
};

const coveragePolicy: RequirementProfileArchitecturePolicy = {
  ...policy,
  requireCompleteImpactAssessmentForHighCritical: true,
  traversalPolicyId: "api-impact",
  traversalPolicyVersion: 2,
};

const context: DeliverySubjectArchitectureContext = {
  id: "arch-context",
  deliverySubjectId: deliverySubject.id,
  architectureBaselineId: "ab-9",
  architectureBaselineVersion: 9,
  baselineFingerprint: "baseline-9",
  status: "CURRENT",
  pinnedAt: now,
  updatedAt: now,
};

const confirmedElement = (
  stableKey: string,
  reviewStatus: "CONFIRMED" | "NEEDS_REVIEW" = "CONFIRMED",
): ArchitectureElement => ({
  id: `element-${stableKey}`,
  baselineId: "ab-9",
  baselineVersion: 9,
  stableKey,
  type: "APPLICATION_COMPONENT",
  name: stableKey,
  lifecycle: "ACTIVE",
  tags: [],
  sourceEvidence: [
    {
      sourceId: "arch-repo",
      commitSha: "abc123",
      path: `applications/${stableKey}.md`,
      fingerprint: `fp-${stableKey}`,
      mode: reviewStatus === "CONFIRMED" ? "EXPLICIT" : "INFERRED",
    },
  ],
  reviewStatus,
  createdAt: now,
});

const impactFor = (
  requirementId: string,
  revision: number,
  stableKey: string,
  confirmer = "u-architect",
  perspectiveId = "p-architecture",
): RequirementArchitectureImpact => ({
  id: `impact-${requirementId}`,
  deliverySubjectId: deliverySubject.id,
  requirementId,
  requirementRevision: revision,
  architectureBaselineId: "ab-9",
  architectureBaselineVersion: 9,
  architectureElementKey: stableKey,
  impactType: "MODIFY",
  rationale: "The requirement changes behavior realized by this application component.",
  sourceRelationshipIds: [],
  status: "CONFIRMED",
  confirmedBy: confirmer,
  confirmedPerspectiveId: perspectiveId,
  createdAt: now,
  updatedAt: now,
});

const assessmentFor = (
  requirementId: string,
  revision: number,
  candidates: string[],
  assessed = candidates,
  unresolved: string[] = [],
): ArchitectureImpactAssessment => ({
  id: `assessment-${requirementId}`,
  deliverySubjectId: deliverySubject.id,
  requirementId,
  requirementRevision: revision,
  architectureBaselineId: "ab-9",
  architectureBaselineVersion: 9,
  traversalPolicyId: "api-impact",
  traversalPolicyVersion: 2,
  seedElementKeys: ["cap.customer-verification"],
  candidateElementKeys: candidates,
  assessedElementKeys: assessed,
  unresolvedElementKeys: unresolved,
  traversalRelationshipIds: [],
  status: unresolved.length === 0 && candidates.every((key) => assessed.includes(key)) ? "COMPLETE" : "IN_PROGRESS",
  createdAt: now,
  updatedAt: now,
});

describe("architecture-aware readiness", () => {
  it("does not require architecture for profiles that omit architecture policy", () => {
    const result = evaluateReadiness(baseSnapshot());
    expect(
      result.checks.find((check) => check.code === "ARCHITECTURE_BASELINE_PINNED")?.blocking,
    ).toBe(false);
  });

  it("blocks when the selected profile requires architecture but no baseline is pinned", () => {
    const result = evaluateReadiness({ ...baseSnapshot(), architecturePolicy: policy });
    expect(
      result.checks.find((check) => check.code === "ARCHITECTURE_BASELINE_PINNED")?.passed,
    ).toBe(false);
  });

  it("requires authoritative confirmed current-revision architecture impact for high/critical requirements", () => {
    const result = evaluateReadiness({
      ...baseSnapshot(),
      architecturePolicy: policy,
      architectureContext: context,
      architectureElements: [confirmedElement("app.customer-mdm")],
      architectureImpacts: [],
    });
    expect(
      result.checks.find((check) => check.code === "CRITICAL_REQUIREMENTS_HAVE_ARCHITECTURE_IMPACT")?.passed,
    ).toBe(false);
  });

  it("does not accept impact confirmation from someone without active OWNER/DELEGATE authority", () => {
    const impacts = requirements.map((requirement, index) =>
      impactFor(
        requirement.id,
        requirement.revision,
        `app.target-${index}`,
        "u-product",
        "p-architecture",
      ),
    );
    const result = evaluateReadiness({
      ...baseSnapshot(),
      architecturePolicy: policy,
      architectureContext: context,
      architectureElements: requirements.map((_, index) => confirmedElement(`app.target-${index}`)),
      architectureImpacts: impacts,
    });

    expect(
      result.checks.find((check) => check.code === "ARCHITECTURE_IMPACT_CONFIRMATIONS_AUTHORIZED")?.passed,
    ).toBe(false);
    expect(
      result.checks.find((check) => check.code === "CRITICAL_REQUIREMENTS_HAVE_ARCHITECTURE_IMPACT")?.passed,
    ).toBe(false);
  });

  it("rejects confirmed impacts that rely on unreviewed normalized topology", () => {
    const impacts = requirements.map((requirement, index) =>
      impactFor(requirement.id, requirement.revision, `app.target-${index}`),
    );
    const elements = requirements.map((_, index) =>
      confirmedElement(`app.target-${index}`, index === 0 ? "NEEDS_REVIEW" : "CONFIRMED"),
    );
    const result = evaluateReadiness({
      ...baseSnapshot(),
      architecturePolicy: policy,
      architectureContext: context,
      architectureElements: elements,
      architectureImpacts: impacts,
    });
    expect(
      result.checks.find((check) => check.code === "ARCHITECTURE_IMPACTS_USE_TRUSTED_TOPOLOGY")?.passed,
    ).toBe(false);
  });

  it("blocks when one impact exists but the configured topology coverage was not completed", () => {
    const requirement = requirements[0]!;
    const result = evaluateReadiness({
      ...baseSnapshot(),
      requirements: [requirement],
      requirementChangeProposals: requirementChangeProposals.filter(
        (proposal) => proposal.proposedRequirementId === requirement.id,
      ),
      requirementSources: requirementSources.filter((source) => source.requirementId === requirement.id),
      verifications: verifications.filter((verification) => verification.targetId === requirement.id),
      workPackages: workPackages.map((workPackage) => ({
        ...workPackage,
        requirementIds: workPackage.requirementIds.filter((id) => id === requirement.id),
      })),
      acceptanceCriteria: acceptanceCriteria.filter((criterion) => criterion.targetId === requirement.id),
      evaluations: evaluations.filter((evaluation) => evaluation.targetId === requirement.id),
      architecturePolicy: coveragePolicy,
      architectureContext: context,
      architectureElements: [confirmedElement("app.api")],
      architectureImpacts: [impactFor(requirement.id, requirement.revision, "app.api")],
      architectureImpactAssessments: [
        assessmentFor(
          requirement.id,
          requirement.revision,
          ["app.api", "app.onboarding"],
          ["app.api"],
          ["app.onboarding"],
        ),
      ],
    });

    expect(
      result.checks.find(
        (check) => check.code === "CRITICAL_REQUIREMENTS_HAVE_COMPLETE_ARCHITECTURE_ASSESSMENT",
      )?.passed,
    ).toBe(false);
  });

  it("accepts coverage only when every candidate is assessed under the pinned traversal policy", () => {
    const requirement = requirements[0]!;
    const candidates = ["app.api", "app.onboarding"];
    const result = evaluateReadiness({
      ...baseSnapshot(),
      requirements: [requirement],
      requirementChangeProposals: requirementChangeProposals.filter(
        (proposal) => proposal.proposedRequirementId === requirement.id,
      ),
      requirementSources: requirementSources.filter((source) => source.requirementId === requirement.id),
      verifications: verifications.filter((verification) => verification.targetId === requirement.id),
      workPackages: workPackages.map((workPackage) => ({
        ...workPackage,
        requirementIds: workPackage.requirementIds.filter((id) => id === requirement.id),
      })),
      acceptanceCriteria: acceptanceCriteria.filter((criterion) => criterion.targetId === requirement.id),
      evaluations: evaluations.filter((evaluation) => evaluation.targetId === requirement.id),
      architecturePolicy: coveragePolicy,
      architectureContext: context,
      architectureElements: candidates.map(confirmedElement),
      architectureImpacts: [impactFor(requirement.id, requirement.revision, "app.api")],
      architectureImpactAssessments: [assessmentFor(requirement.id, requirement.revision, candidates)],
    });

    expect(
      result.checks.find(
        (check) => check.code === "CRITICAL_REQUIREMENTS_HAVE_COMPLETE_ARCHITECTURE_ASSESSMENT",
      )?.passed,
    ).toBe(true);
  });
});
