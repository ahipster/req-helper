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
  it("keeps the seeded war-room scenario NOT_READY with actionable blockers", () => {
    const result = evaluateReadiness(seedSnapshot());

    expect(result.state).toBe("NOT_READY");
    expect(result.score).toBeLessThan(100);

    const failedCodes = result.checks
      .filter((check) => check.blocking && !check.passed)
      .map((check) => check.code);

    expect(failedCodes).toContain("CRITICAL_REQUIREMENTS_VERIFIED");
    expect(failedCodes).toContain("CRITICAL_REQUIREMENTS_AUTHORITATIVE_PROVENANCE");
    expect(failedCodes).toContain("NO_BLOCKING_GAPS");
    expect(failedCodes).toContain("NO_BLOCKING_CONFLICTS");
    expect(failedCodes).toContain("CRITICAL_REQUIREMENTS_PACKAGED");
    expect(failedCodes).toContain("CRITICAL_REQUIREMENTS_HAVE_ACCEPTANCE");
    expect(failedCodes).toContain("REQUIRED_EVALS_DEFINED");
    expect(failedCodes).toContain("NO_OPEN_BLOCKING_TASKS");
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
