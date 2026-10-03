import { z } from "zod";
import type {
  ArchitectureElement,
  ArchitectureRelationship,
} from "./architecture.js";

export const InformationClassification = z.enum([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "RESTRICTED",
]);

export const ProtectedResourceType = z.enum([
  "ARCHITECTURE_SOURCE",
  "SOURCE_ARTIFACT",
  "KNOWLEDGE_SOURCE",
  "REQUIREMENT_SOURCE",
]);

/**
 * Access metadata is independent of application membership. A user being a
 * Delivery Subject member or Req Helper ADMIN does not automatically mean they
 * may see the underlying enterprise source material.
 */
export const SourceAccessPolicySchema = z.object({
  id: z.string().min(1),
  resourceType: ProtectedResourceType,
  resourceId: z.string().min(1),
  classification: InformationClassification,
  audienceRefs: z.array(z.string()).default([]),
  sourcePermissionRef: z.string().optional(),
  modelProcessingAllowed: z.boolean().default(false),
  retentionClass: z.string().optional(),
  inheritToDerivedArtifacts: z.literal(true).default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PrincipalAccessContextSchema = z.object({
  principalId: z.string().min(1),
  authenticated: z.boolean(),
  audienceRefs: z.array(z.string()).default([]),
});

export const ModelInputPurpose = z.enum([
  "ARCHITECTURE_INGESTION",
  "SOURCE_ANALYSIS",
  "INTERACTIVE_REASONING",
]);

/**
 * Content originating outside Req Helper is always data, never instructions.
 * Architecture ingestion is deliberately incapable of tools/network actions.
 */
export const UntrustedModelInputPolicySchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  purpose: ModelInputPurpose,
  contentTrust: z.literal("UNTRUSTED_DATA"),
  followSourceInstructions: z.literal(false),
  toolAccess: z.literal("NONE"),
  networkAccess: z.literal("NONE"),
  maxDocumentBytes: z.number().int().positive(),
  allowedOutputSchemaIds: z.array(z.string().min(1)).min(1),
});

export const ARCHITECTURE_INGESTION_SECURITY_POLICY =
  UntrustedModelInputPolicySchema.parse({
    id: "architecture-ingestion",
    version: "poc-v1",
    purpose: "ARCHITECTURE_INGESTION",
    contentTrust: "UNTRUSTED_DATA",
    followSourceInstructions: false,
    toolAccess: "NONE",
    networkAccess: "NONE",
    maxDocumentBytes: 250_000,
    allowedOutputSchemaIds: [
      "ArchitectureElement[]",
      "ArchitectureRelationship[]",
      "ArchitectureView[]",
      "UnresolvedReference[]",
    ],
  });

export type SourceAccessPolicy = z.infer<typeof SourceAccessPolicySchema>;
export type PrincipalAccessContext = z.infer<typeof PrincipalAccessContextSchema>;
export type UntrustedModelInputPolicy = z.infer<typeof UntrustedModelInputPolicySchema>;

/** Deny by default. PUBLIC still requires an authenticated Req Helper principal. */
export function canReadProtectedSource(
  policy: SourceAccessPolicy | undefined,
  principal: PrincipalAccessContext,
): boolean {
  if (!policy || !principal.authenticated) return false;
  if (policy.classification === "PUBLIC") return true;
  if (policy.audienceRefs.length === 0) return false;

  const audiences = new Set(principal.audienceRefs);
  return policy.audienceRefs.some((audience) => audiences.has(audience));
}

export function canSendProtectedSourceToModel(
  policy: SourceAccessPolicy | undefined,
  principal: PrincipalAccessContext,
): boolean {
  return Boolean(
    policy?.modelProcessingAllowed && canReadProtectedSource(policy, principal),
  );
}

function evidenceSourcesAreVisible(
  sourceIds: string[],
  policyBySourceId: ReadonlyMap<string, SourceAccessPolicy>,
  principal: PrincipalAccessContext,
): boolean {
  const uniqueSourceIds = [...new Set(sourceIds)];
  return (
    uniqueSourceIds.length > 0 &&
    uniqueSourceIds.every((sourceId) =>
      canReadProtectedSource(policyBySourceId.get(sourceId), principal),
    )
  );
}

export function architectureElementIsVisible(
  element: ArchitectureElement,
  policyBySourceId: ReadonlyMap<string, SourceAccessPolicy>,
  principal: PrincipalAccessContext,
): boolean {
  return evidenceSourcesAreVisible(
    element.sourceEvidence.map((evidence) => evidence.sourceId),
    policyBySourceId,
    principal,
  );
}

export function architectureRelationshipIsVisible(
  relationship: ArchitectureRelationship,
  visibleElementKeys: ReadonlySet<string>,
  policyBySourceId: ReadonlyMap<string, SourceAccessPolicy>,
  principal: PrincipalAccessContext,
): boolean {
  return (
    visibleElementKeys.has(relationship.sourceElementKey) &&
    visibleElementKeys.has(relationship.targetElementKey) &&
    evidenceSourcesAreVisible(
      relationship.sourceEvidence.map((evidence) => evidence.sourceId),
      policyBySourceId,
      principal,
    )
  );
}

/**
 * Filter before UI serialization or LLM context construction. This function is
 * intentionally conservative: missing access metadata hides the object.
 */
export function filterArchitectureForPrincipal(input: {
  elements: ArchitectureElement[];
  relationships: ArchitectureRelationship[];
  policyBySourceId: ReadonlyMap<string, SourceAccessPolicy>;
  principal: PrincipalAccessContext;
}) {
  const elements = input.elements.filter((element) =>
    architectureElementIsVisible(
      element,
      input.policyBySourceId,
      input.principal,
    ),
  );
  const visibleElementKeys = new Set(elements.map((element) => element.stableKey));
  const relationships = input.relationships.filter((relationship) =>
    architectureRelationshipIsVisible(
      relationship,
      visibleElementKeys,
      input.policyBySourceId,
      input.principal,
    ),
  );

  return { elements, relationships };
}
