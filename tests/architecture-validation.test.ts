import { describe, expect, it } from "vitest";
import { validateArchitectureForPublication } from "../src/domain/architecture-validation.js";
import type {
  ArchitectureElement,
  ArchitectureIngestionFinding,
  ArchitectureRelationship,
} from "../src/domain/architecture.js";

const now = "2026-10-03T18:00:00+02:00";

const evidence = {
  sourceId: "arch-source",
  commitSha: "abc123",
  path: "applications/customer-api.md",
  fingerprint: "fp-1",
  mode: "EXPLICIT" as const,
};

const element = (id: string, stableKey: string, reviewStatus: "CONFIRMED" | "NEEDS_REVIEW" | "REJECTED" = "CONFIRMED"): ArchitectureElement => ({
  id,
  baselineId: "ab-1",
  baselineVersion: 1,
  stableKey,
  type: "APPLICATION_COMPONENT",
  name: stableKey,
  lifecycle: "ACTIVE",
  tags: [],
  sourceEvidence: [evidence],
  reviewStatus,
  createdAt: now,
});

const relationship = (source: string, target: string): ArchitectureRelationship => ({
  id: `rel-${source}-${target}`,
  baselineId: "ab-1",
  baselineVersion: 1,
  type: "DEPENDS_ON",
  sourceElementKey: source,
  targetElementKey: target,
  sourceEvidence: [evidence],
  reviewStatus: "CONFIRMED",
  createdAt: now,
});

const finding = (status: "OPEN" | "RESOLVED" | "WAIVED"): ArchitectureIngestionFinding => ({
  id: `finding-${status}`,
  ingestionRunId: "run-1",
  type: "UNRESOLVED_REFERENCE",
  severity: "HIGH",
  blocking: true,
  message: "Reference must be resolved before publishing.",
  sourceEvidence: [evidence],
  relatedStableKeys: ["app.missing"],
  status,
  createdAt: now,
  updatedAt: now,
});

describe("validateArchitectureForPublication", () => {
  it("accepts a coherent graph with no open blockers", () => {
    const result = validateArchitectureForPublication({
      elements: [element("e1", "app.api"), element("e2", "app.mdm")],
      relationships: [relationship("app.api", "app.mdm")],
      findings: [finding("RESOLVED")],
    });

    expect(result.publishable).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("blocks duplicate stable keys", () => {
    const result = validateArchitectureForPublication({
      elements: [element("e1", "app.api"), element("e2", "app.api")],
      relationships: [],
      findings: [],
    });

    expect(result.publishable).toBe(false);
    expect(result.issues.some((issue) => issue.code === "DUPLICATE_STABLE_KEY")).toBe(true);
  });

  it("blocks unresolved relationship endpoints", () => {
    const result = validateArchitectureForPublication({
      elements: [element("e1", "app.api")],
      relationships: [relationship("app.api", "app.missing")],
      findings: [],
    });

    expect(result.publishable).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_RELATIONSHIP_TARGET")).toBe(true);
  });

  it("blocks relationships that depend on rejected elements", () => {
    const result = validateArchitectureForPublication({
      elements: [element("e1", "app.api"), element("e2", "app.mdm", "REJECTED")],
      relationships: [relationship("app.api", "app.mdm")],
      findings: [],
    });

    expect(result.publishable).toBe(false);
    expect(result.issues.some((issue) => issue.code === "REJECTED_RELATIONSHIP_TARGET")).toBe(true);
  });

  it("blocks open blocking ingestion findings but allows waived findings", () => {
    const blocked = validateArchitectureForPublication({
      elements: [element("e1", "app.api")],
      relationships: [],
      findings: [finding("OPEN")],
    });
    const waived = validateArchitectureForPublication({
      elements: [element("e1", "app.api")],
      relationships: [],
      findings: [finding("WAIVED")],
    });

    expect(blocked.publishable).toBe(false);
    expect(waived.publishable).toBe(true);
  });
});
