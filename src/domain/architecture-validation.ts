import type {
  ArchitectureElement,
  ArchitectureIngestionFinding,
  ArchitectureRelationship,
} from "./architecture.js";

export type ArchitecturePublicationIssue = {
  code:
    | "DUPLICATE_STABLE_KEY"
    | "MISSING_RELATIONSHIP_SOURCE"
    | "MISSING_RELATIONSHIP_TARGET"
    | "REJECTED_RELATIONSHIP_SOURCE"
    | "REJECTED_RELATIONSHIP_TARGET"
    | "OPEN_BLOCKING_INGESTION_FINDING";
  blocking: true;
  message: string;
  relatedIds: string[];
};

export type ArchitecturePublicationValidation = {
  publishable: boolean;
  issues: ArchitecturePublicationIssue[];
};

/**
 * Deterministic minimum publication gate for a normalized architecture baseline.
 * LLM output can produce candidates and review suggestions, but cannot bypass
 * these referential/integrity checks or publish a baseline directly.
 */
export function validateArchitectureForPublication(input: {
  elements: ArchitectureElement[];
  relationships: ArchitectureRelationship[];
  findings: ArchitectureIngestionFinding[];
}): ArchitecturePublicationValidation {
  const issues: ArchitecturePublicationIssue[] = [];
  const elementByKey = new Map<string, ArchitectureElement>();
  const duplicateKeys = new Map<string, string[]>();

  for (const element of input.elements) {
    const existing = elementByKey.get(element.stableKey);
    if (existing) {
      const ids = duplicateKeys.get(element.stableKey) ?? [existing.id];
      ids.push(element.id);
      duplicateKeys.set(element.stableKey, ids);
    } else {
      elementByKey.set(element.stableKey, element);
    }
  }

  for (const [stableKey, ids] of duplicateKeys) {
    issues.push({
      code: "DUPLICATE_STABLE_KEY",
      blocking: true,
      message: `Architecture stable key ${stableKey} is defined by multiple elements.`,
      relatedIds: ids,
    });
  }

  for (const relationship of input.relationships) {
    const source = elementByKey.get(relationship.sourceElementKey);
    const target = elementByKey.get(relationship.targetElementKey);

    if (!source) {
      issues.push({
        code: "MISSING_RELATIONSHIP_SOURCE",
        blocking: true,
        message: `Relationship ${relationship.id} source ${relationship.sourceElementKey} does not resolve.`,
        relatedIds: [relationship.id],
      });
    } else if (source.reviewStatus === "REJECTED") {
      issues.push({
        code: "REJECTED_RELATIONSHIP_SOURCE",
        blocking: true,
        message: `Relationship ${relationship.id} uses rejected source element ${source.stableKey}.`,
        relatedIds: [relationship.id, source.id],
      });
    }

    if (!target) {
      issues.push({
        code: "MISSING_RELATIONSHIP_TARGET",
        blocking: true,
        message: `Relationship ${relationship.id} target ${relationship.targetElementKey} does not resolve.`,
        relatedIds: [relationship.id],
      });
    } else if (target.reviewStatus === "REJECTED") {
      issues.push({
        code: "REJECTED_RELATIONSHIP_TARGET",
        blocking: true,
        message: `Relationship ${relationship.id} uses rejected target element ${target.stableKey}.`,
        relatedIds: [relationship.id, target.id],
      });
    }
  }

  for (const finding of input.findings) {
    if (finding.blocking && finding.status === "OPEN") {
      issues.push({
        code: "OPEN_BLOCKING_INGESTION_FINDING",
        blocking: true,
        message: finding.message,
        relatedIds: [finding.id, ...finding.relatedStableKeys],
      });
    }
  }

  return {
    publishable: issues.length === 0,
    issues,
  };
}
