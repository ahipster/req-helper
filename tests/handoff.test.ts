import { describe, expect, it } from "vitest";
import {
  HandoffPackageSchema,
  validateHandoffPublication,
  type HandoffPackage,
} from "../src/domain/handoff.js";
import { deliverySubject } from "../src/seed/customer-status-change.js";
import type { DeliverySubjectArchitectureContext } from "../src/domain/architecture.js";

const now = "2026-10-03T21:00:00+02:00";

const architectureContext: DeliverySubjectArchitectureContext = {
  id: "arch-context",
  deliverySubjectId: deliverySubject.id,
  architectureBaselineId: "ab-9",
  architectureBaselineVersion: 9,
  baselineFingerprint: "baseline-fp-9",
  status: "CURRENT",
  pinnedAt: now,
  updatedAt: now,
};

const packageFor = (overrides: Partial<HandoffPackage> = {}): HandoffPackage => ({
  id: "handoff-1",
  deliverySubjectId: deliverySubject.id,
  version: 1,
  status: "PUBLISHED",
  subjectRevision: deliverySubject.revision,
  requirementProfileId: deliverySubject.requirementProfileId!,
  requirementProfileVersion: deliverySubject.requirementProfileVersion!,
  architectureBaselineId: architectureContext.architectureBaselineId,
  architectureBaselineVersion: architectureContext.architectureBaselineVersion,
  architectureBaselineFingerprint: architectureContext.baselineFingerprint,
  manifestFingerprint: "manifest-sha256",
  objectRefs: [
    {
      objectType: "REQUIREMENT",
      id: "r-17",
      revision: 3,
    },
  ],
  artifacts: [
    {
      format: "JSON",
      storageType: "GCS",
      uri: "gs://req-helper/handoffs/ds-1/v1/package.json",
      sha256: "json-sha256",
    },
  ],
  createdBy: "u-lead",
  createdAt: now,
  publishedBy: "u-lead",
  publishedAt: now,
  ...overrides,
});

describe("handoff package", () => {
  it("requires immutable JSON artifact metadata for PUBLISHED package", () => {
    const parsed = HandoffPackageSchema.safeParse({
      ...packageFor(),
      artifacts: [
        {
          format: "MARKDOWN",
          storageType: "GCS",
          uri: "gs://req-helper/handoffs/ds-1/v1/package.md",
          sha256: "markdown-sha256",
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects publishing a snapshot of an older subject revision", () => {
    const result = validateHandoffPublication({
      candidate: packageFor({ subjectRevision: Math.max(0, deliverySubject.revision - 1) }),
      deliverySubject,
      readinessState: "READY",
      architectureContext,
    });
    expect(result.publishable).toBe(false);
    expect(result.issues.some((issue) => issue.code === "STALE_SUBJECT_REVISION")).toBe(true);
  });

  it("rejects handoff when deterministic readiness is not READY", () => {
    const result = validateHandoffPublication({
      candidate: packageFor(),
      deliverySubject,
      readinessState: "NOT_READY",
      architectureContext,
    });
    expect(result.publishable).toBe(false);
    expect(result.issues.some((issue) => issue.code === "SUBJECT_NOT_READY")).toBe(true);
  });

  it("requires a replacement package to increment and supersede the prior published package", () => {
    const previous = packageFor();
    const candidate = packageFor({
      id: "handoff-2",
      version: 2,
      supersedesPackageId: previous.id,
    });
    const result = validateHandoffPublication({
      candidate,
      deliverySubject,
      readinessState: "READY",
      architectureContext,
      latestPublishedPackage: previous,
    });
    expect(result.publishable).toBe(true);
  });

  it("rejects a package whose pinned architecture identity differs from the subject", () => {
    const result = validateHandoffPublication({
      candidate: packageFor({ architectureBaselineVersion: 8 }),
      deliverySubject,
      readinessState: "READY",
      architectureContext,
    });
    expect(result.publishable).toBe(false);
    expect(result.issues.some((issue) => issue.code === "ARCHITECTURE_BASELINE_MISMATCH")).toBe(true);
  });
});
