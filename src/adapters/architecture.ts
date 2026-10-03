import type {
  ArchitectureElement,
  ArchitectureIngestionFinding,
  ArchitectureRelationship,
  ArchitectureSource,
  ArchitectureSourceCommit,
  ArchitectureSourceEvidence,
  ArchitectureView,
} from "../domain/architecture.js";
import type { UntrustedModelInputPolicy } from "../domain/source-security.js";

export type GitMarkdownDocument = {
  sourceId: string;
  repository: string;
  branch: string;
  commitSha: string;
  path: string;
  blobSha?: string;
  fingerprint: string;
  content: string;
};

export type ArchitectureDocumentExtraction = {
  elements: Omit<ArchitectureElement, "baselineId" | "baselineVersion" | "id" | "createdAt">[];
  relationships: Omit<ArchitectureRelationship, "baselineId" | "baselineVersion" | "id" | "createdAt">[];
  views: Omit<ArchitectureView, "baselineId" | "baselineVersion" | "id" | "createdAt">[];
  unresolvedReferences: Array<{
    reference: string;
    rationale: string;
    sourceEvidence: ArchitectureSourceEvidence[];
  }>;
};

export interface ArchitectureGitReader {
  resolveCommit(source: ArchitectureSource): Promise<ArchitectureSourceCommit>;
  listMarkdown(source: ArchitectureSource, commitSha: string): Promise<Array<Omit<GitMarkdownDocument, "content">>>;
  readMarkdown(source: ArchitectureSource, commitSha: string, path: string): Promise<GitMarkdownDocument>;
}

/**
 * The caller must authorize the source and model-processing permission before
 * invoking the normalizer. Markdown content is untrusted data. The normalizer
 * receives an explicit security policy that forbids source-instruction
 * following, tools and network access for architecture ingestion.
 *
 * Output is always a proposal until deterministic validation/reconciliation.
 */
export interface ArchitectureMarkdownNormalizer {
  extract(
    document: GitMarkdownDocument,
    securityPolicy: UntrustedModelInputPolicy,
  ): Promise<ArchitectureDocumentExtraction>;
}

export type ArchitectureReconciliationInput = {
  sourceCommits: ArchitectureSourceCommit[];
  extractions: ArchitectureDocumentExtraction[];
};

export type ArchitectureReconciliationResult = {
  elements: ArchitectureDocumentExtraction["elements"];
  relationships: ArchitectureDocumentExtraction["relationships"];
  views: ArchitectureDocumentExtraction["views"];
  findings: Omit<ArchitectureIngestionFinding, "id" | "ingestionRunId" | "createdAt" | "updatedAt">[];
};

/**
 * Deterministic code owns stable-key collision handling, reference resolution,
 * schema checks, source-evidence requirements and publication eligibility.
 * An LLM may suggest entity aliases or relationship mappings but never silently
 * merge conflicting objects or publish a baseline.
 */
export interface ArchitectureReconciler {
  reconcile(input: ArchitectureReconciliationInput): Promise<ArchitectureReconciliationResult>;
}
