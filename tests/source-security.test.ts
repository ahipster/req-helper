import { describe, expect, it } from "vitest";
import type { ArchitectureElement, ArchitectureRelationship } from "../src/domain/architecture.js";
import {
  ARCHITECTURE_INGESTION_SECURITY_POLICY,
  canReadProtectedSource,
  canSendProtectedSourceToModel,
  filterArchitectureForPrincipal,
  type PrincipalAccessContext,
  type SourceAccessPolicy,
} from "../src/domain/source-security.js";

const now = "2026-10-03T21:00:00+02:00";

const principal: PrincipalAccessContext = {
  principalId: "u-1",
  authenticated: true,
  audienceRefs: ["team:customer"],
};

const policy = (
  sourceId: string,
  audienceRefs: string[],
  modelProcessingAllowed = true,
): SourceAccessPolicy => ({
  id: `policy-${sourceId}`,
  resourceType: "ARCHITECTURE_SOURCE",
  resourceId: sourceId,
  classification: "CONFIDENTIAL",
  audienceRefs,
  modelProcessingAllowed,
  inheritToDerivedArtifacts: true,
  createdAt: now,
  updatedAt: now,
});

const element = (stableKey: string, sourceId: string): ArchitectureElement => ({
  id: `e-${stableKey}`,
  baselineId: "ab-1",
  baselineVersion: 1,
  stableKey,
  type: "APPLICATION_COMPONENT",
  name: stableKey,
  lifecycle: "ACTIVE",
  tags: [],
  sourceEvidence: [
    {
      sourceId,
      commitSha: "abc123",
      path: `${stableKey}.md`,
      mode: "EXPLICIT",
    },
  ],
  reviewStatus: "CONFIRMED",
  createdAt: now,
});

const relationship: ArchitectureRelationship = {
  id: "rel-1",
  baselineId: "ab-1",
  baselineVersion: 1,
  type: "DEPENDS_ON",
  sourceElementKey: "app.api",
  targetElementKey: "app.mdm",
  sourceEvidence: [
    {
      sourceId: "src-customer",
      commitSha: "abc123",
      path: "integration.md",
      mode: "EXPLICIT",
    },
  ],
  reviewStatus: "CONFIRMED",
  createdAt: now,
};

describe("source security", () => {
  it("denies missing access policy by default", () => {
    expect(canReadProtectedSource(undefined, principal)).toBe(false);
    expect(canSendProtectedSourceToModel(undefined, principal)).toBe(false);
  });

  it("requires source audience and explicit model-processing permission", () => {
    expect(canReadProtectedSource(policy("src", ["team:customer"]), principal)).toBe(true);
    expect(canReadProtectedSource(policy("src", ["team:payments"]), principal)).toBe(false);
    expect(canSendProtectedSourceToModel(policy("src", ["team:customer"], false), principal)).toBe(false);
  });

  it("filters normalized architecture before UI/model serialization", () => {
    const result = filterArchitectureForPrincipal({
      elements: [element("app.api", "src-customer"), element("app.mdm", "src-restricted")],
      relationships: [relationship],
      policyBySourceId: new Map([
        ["src-customer", policy("src-customer", ["team:customer"])],
        ["src-restricted", policy("src-restricted", ["team:restricted"])],
      ]),
      principal,
    });

    expect(result.elements.map((item) => item.stableKey)).toEqual(["app.api"]);
    expect(result.relationships).toHaveLength(0);
  });

  it("fixes architecture ingestion to untrusted data with no tools or network", () => {
    expect(ARCHITECTURE_INGESTION_SECURITY_POLICY.contentTrust).toBe("UNTRUSTED_DATA");
    expect(ARCHITECTURE_INGESTION_SECURITY_POLICY.followSourceInstructions).toBe(false);
    expect(ARCHITECTURE_INGESTION_SECURITY_POLICY.toolAccess).toBe("NONE");
    expect(ARCHITECTURE_INGESTION_SECURITY_POLICY.networkAccess).toBe("NONE");
  });
});
