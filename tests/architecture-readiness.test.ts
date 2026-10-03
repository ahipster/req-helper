import { describe, expect, it } from "vitest";
import { evaluateReadiness, type ReadinessSnapshot } from "../src/domain/readiness.js";
import type {
  ArchitectureElement,
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
  requireImplementationTargetForHighCritical: false,
  allowNeedsReviewElementsForImpact: false,
  createdAt: now,
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
});
