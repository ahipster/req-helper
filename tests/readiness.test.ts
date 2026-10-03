import { describe, expect, it } from "vitest";
import { evaluateReadiness, type ReadinessSnapshot } from "../src/domain/readiness.js";
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

const seedSnapshot = (): ReadinessSnapshot => ({
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

describe("evaluateReadiness", () => {
  it("keeps the seeded war-room scenario NOT_READY with profile/baseline/collision blockers", () => {
    const result = evaluateReadiness(seedSnapshot());

    expect(result.state).toBe("NOT_READY");
    expect(result.score).toBeLessThan(100);

    const failedCodes = result.checks
      .filter((check) => check.blocking && !check.passed)
      .map((check) => check.code);

    expect(failedCodes).toContain("REQUIREMENT_PROFILE_COMPLIANT");
    expect(failedCodes).toContain("NO_UNRESOLVED_REQUIREMENT_COLLISIONS");
    expect(failedCodes).toContain("CRITICAL_REQUIREMENTS_VERIFIED");
    expect(failedCodes).toContain("NO_BLOCKING_GAPS");
    expect(failedCodes).toContain("NO_BLOCKING_CONFLICTS");
    expect(failedCodes).toContain("CRITICAL_REQUIREMENTS_PACKAGED");
    expect(failedCodes).toContain("CRITICAL_REQUIREMENTS_HAVE_ACCEPTANCE");
    expect(failedCodes).toContain("REQUIRED_EVALS_DEFINED");
    expect(failedCodes).toContain("NO_OPEN_BLOCKING_TASKS");
  });

  it("requires a pinned Requirement Profile version", () => {
    const snapshot = seedSnapshot();
    const result = evaluateReadiness({
      ...snapshot,
      deliverySubject: {
        ...snapshot.deliverySubject,
        requirementProfileId: undefined,
        requirementProfileVersion: undefined,
      },
    });

    expect(
      result.checks.find((c) => c.code === "REQUIREMENT_PROFILE_PINNED")?.passed,
    ).toBe(false);
  });

  it("blocks a subject requirement that is not classified as a change proposal", () => {
    const snapshot = seedSnapshot();
    const result = evaluateReadiness({
      ...snapshot,
      requirementChangeProposals: snapshot.requirementChangeProposals?.filter(
        (proposal) => proposal.proposedRequirementId !== "r-api-exposure",
      ),
    });

    expect(
      result.checks.find((c) => c.code === "REQUIREMENT_CHANGES_CLASSIFIED")?.passed,
    ).toBe(false);
  });

  it("blocks stale baseline requirement proposals", () => {
    const snapshot = seedSnapshot();
    const result = evaluateReadiness({
      ...snapshot,
      requirementChangeProposals: snapshot.requirementChangeProposals?.map((proposal) =>
        proposal.id === "cp-api" ? { ...proposal, status: "STALE_BASELINE" as const } : proposal,
      ),
    });

    expect(
      result.checks.find((c) => c.code === "NO_STALE_REQUIREMENT_BASELINES")?.passed,
    ).toBe(false);
  });

  it("blocks unreviewed duplicate/contradiction candidates", () => {
    const result = evaluateReadiness(seedSnapshot());
    expect(
      result.checks.find((c) => c.code === "NO_UNRESOLVED_REQUIREMENT_COLLISIONS")?.passed,
    ).toBe(false);
  });

  it("allows a reviewed/dismissed collision to clear the collision check", () => {
    const snapshot = seedSnapshot();
    const result = evaluateReadiness({
      ...snapshot,
      requirementMatches: snapshot.requirementMatches?.map((match) =>
        match.id === "match-parallel-proposal" ? { ...match, status: "DISMISSED" as const } : match,
      ),
    });

    expect(
      result.checks.find((c) => c.code === "NO_UNRESOLVED_REQUIREMENT_COLLISIONS")?.passed,
    ).toBe(true);
  });

  it("blocks open profile quality findings", () => {
    const result = evaluateReadiness(seedSnapshot());
    expect(
      result.checks.find((c) => c.code === "REQUIREMENT_PROFILE_COMPLIANT")?.passed,
    ).toBe(false);
  });

  it("allows resolved profile findings to clear the profile check", () => {
    const snapshot = seedSnapshot();
    const result = evaluateReadiness({
      ...snapshot,
      requirementQualityFindings: snapshot.requirementQualityFindings?.map((finding) => ({
        ...finding,
        status: "RESOLVED" as const,
      })),
    });

    expect(
      result.checks.find((c) => c.code === "REQUIREMENT_PROFILE_COMPLIANT")?.passed,
    ).toBe(true);
  });

  it("blocks a required perspective that is still only proposed, regardless of medium criticality", () => {
    const snapshot = seedSnapshot();
    const result = evaluateReadiness({
      ...snapshot,
      perspectives: [
        ...snapshot.perspectives,
        {
          id: "p-risk",
          deliverySubjectId: deliverySubject.id,
          type: "RISK",
          name: "Risk",
          criticality: "MEDIUM",
          required: true,
          status: "PROPOSED",
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    expect(
      result.checks.find((c) => c.code === "REQUIRED_PERSPECTIVES_CONFIRMED")?.passed,
    ).toBe(false);
    expect(
      result.checks.find((c) => c.code === "REQUIRED_PERSPECTIVES_OWNED")?.passed,
    ).toBe(false);
  });

  it("requires verification for the current requirement revision", () => {
    const snapshot = seedSnapshot();
    const result = evaluateReadiness({
      ...snapshot,
      verifications: [
        {
          id: "v-old",
          deliverySubjectId: deliverySubject.id,
          targetType: "REQUIREMENT",
          targetId: "r-verification-state",
          targetRevision: 99,
          verifierId: "u-data",
          perspectiveId: "p-data",
          verdict: "VERIFIED",
          status: "ACTIVE",
          createdAt: now,
        },
      ],
    });

    expect(
      result.checks.find((c) => c.code === "CRITICAL_REQUIREMENTS_VERIFIED")?.passed,
    ).toBe(false);
  });

  it("does not accept REVIEWER verification as authoritative", () => {
    const snapshot = seedSnapshot();
    const reviewerId = "u-reviewer";
    const result = evaluateReadiness({
      ...snapshot,
      assignments: [
        ...snapshot.assignments,
        {
          id: "a-data-reviewer",
          perspectiveId: "p-data",
          userId: reviewerId,
          relationship: "REVIEWER",
          status: "ACTIVE",
          createdAt: now,
          updatedAt: now,
        },
      ],
      verifications: [
        {
          id: "v-reviewer",
          deliverySubjectId: deliverySubject.id,
          targetType: "REQUIREMENT",
          targetId: "r-verification-state",
          targetRevision: 1,
          verifierId: reviewerId,
          perspectiveId: "p-data",
          verdict: "VERIFIED",
          status: "ACTIVE",
          createdAt: now,
        },
      ],
    });

    expect(
      result.checks.find((c) => c.code === "CRITICAL_REQUIREMENTS_VERIFIED")?.passed,
    ).toBe(false);
  });

  it("accepts current-revision verification from active OWNERs", () => {
    const snapshot = seedSnapshot();
    const result = evaluateReadiness({
      ...snapshot,
      verifications: [
        {
          id: "v-owner",
          deliverySubjectId: deliverySubject.id,
          targetType: "REQUIREMENT",
          targetId: "r-verification-state",
          targetRevision: 1,
          verifierId: "u-data",
          perspectiveId: "p-data",
          verdict: "VERIFIED",
          status: "ACTIVE",
          createdAt: now,
        },
        {
          id: "v-api-owner",
          deliverySubjectId: deliverySubject.id,
          targetType: "REQUIREMENT",
          targetId: "r-api-exposure",
          targetRevision: 1,
          verifierId: "u-api",
          perspectiveId: "p-api",
          verdict: "VERIFIED",
          status: "ACTIVE",
          createdAt: now,
        },
      ],
    });

    expect(
      result.checks.find((c) => c.code === "CRITICAL_REQUIREMENTS_VERIFIED")?.passed,
    ).toBe(true);
  });

  it("does not accept stale requirement-targeted acceptance criteria", () => {
    const snapshot = seedSnapshot();
    const result = evaluateReadiness({
      ...snapshot,
      acceptanceCriteria: [
        {
          id: "ac-data-old",
          deliverySubjectId: deliverySubject.id,
          targetType: "REQUIREMENT",
          targetId: "r-verification-state",
          targetRevision: 99,
          then: "Verification source is defined.",
          verificationType: "HUMAN_REVIEW",
          automatable: false,
          priority: "HIGH",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "ac-api-old",
          deliverySubjectId: deliverySubject.id,
          targetType: "REQUIREMENT",
          targetId: "r-api-exposure",
          targetRevision: 99,
          then: "Integration exposes the state.",
          verificationType: "AUTOMATED_TEST",
          automatable: true,
          priority: "HIGH",
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    expect(
      result.checks.find((c) => c.code === "CRITICAL_REQUIREMENTS_HAVE_ACCEPTANCE")?.passed,
    ).toBe(false);
  });

  it("does not accept a stale requirement-targeted eval", () => {
    const snapshot = seedSnapshot();
    const result = evaluateReadiness({
      ...snapshot,
      evaluations: [
        {
          id: "eval-api-old",
          deliverySubjectId: deliverySubject.id,
          targetType: "REQUIREMENT",
          targetId: "r-api-exposure",
          targetRevision: 99,
          name: "API contract check",
          evaluationType: "DETERMINISTIC_TEST",
          expectedBehaviour: "Verification state is exposed according to the contract.",
          failureBehaviour: "Fail the downstream handoff check.",
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    expect(
      result.checks.find((c) => c.code === "REQUIRED_EVALS_DEFINED")?.passed,
    ).toBe(false);
  });

  it("does not let an informational score override a blocking failure", () => {
    const snapshot = seedSnapshot();
    const result = evaluateReadiness({
      ...snapshot,
      gaps: [],
      conflicts: [],
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.state).toBe("NOT_READY");
    expect(result.checks.some((check) => check.blocking && !check.passed)).toBe(true);
  });

  it("treats any unresolved blocking dependency as a readiness blocker even when owned", () => {
    const snapshot = seedSnapshot();
    const result = evaluateReadiness({
      ...snapshot,
      dependencies: [
        {
          id: "dep-1",
          deliverySubjectId: deliverySubject.id,
          fromType: "WORK_PACKAGE",
          fromId: "wp-a",
          toType: "WORK_PACKAGE",
          toId: "wp-b",
          type: "BLOCKS",
          ownerId: "u-architect",
          resolved: false,
          blocking: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    expect(
      result.checks.find((c) => c.code === "NO_UNRESOLVED_BLOCKING_DEPENDENCIES")?.passed,
    ).toBe(false);
    expect(
      result.checks.find((c) => c.code === "BLOCKING_DEPENDENCIES_OWNED")?.passed,
    ).toBe(true);
  });
});
