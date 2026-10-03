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
  workPackages,
} from "../src/seed/customer-status-change.js";

const seedSnapshot = (): ReadinessSnapshot => ({
  deliverySubject,
  perspectives,
  assignments,
  requirements,
  requirementSources,
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

  it("treats an unowned blocking dependency as a readiness blocker", () => {
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
          resolved: false,
          blocking: true,
        },
      ],
    });

    const check = result.checks.find(
      (candidate) => candidate.code === "BLOCKING_DEPENDENCIES_OWNED",
    );

    expect(check?.passed).toBe(false);
    expect(check?.relatedObjectIds).toEqual(["dep-1"]);
  });
});
