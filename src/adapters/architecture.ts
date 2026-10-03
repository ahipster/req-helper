import type {
  ArchitectureElement,
  ArchitectureIngestionFinding,
  ArchitectureRelationship,
  ArchitectureSource,
  ArchitectureSourceCommit,
  ArchitectureSourceEvidence,
  ArchitectureView,
} from "../domain/architecture.js";

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
 * The normalizer may use an LLM/agent harness. Its output is always treated as
 * a proposal until deterministic validation/reconciliation has run.
 */
export interface ArchitectureMarkdownNormalizer {
  extract(document: GitMarkdownDocument): Promise<ArchitectureDocumentExtraction>;
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
