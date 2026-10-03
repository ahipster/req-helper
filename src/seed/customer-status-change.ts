import type {
  AcceptanceCriterion,
  Assumption,
  Conflict,
  DeliverySubject,
  Evaluation,
  Gap,
  Perspective,
  PerspectiveAssignment,
  Requirement,
  RequirementSource,
  Task,
  WorkPackage,
} from "../domain/schemas.js";
import type {
  ExternalKnowledgeRef,
  KnowledgeDocument,
  KnowledgeHit,
  KnowledgeProvider,
  KnowledgeQuery,
} from "../adapters/knowledge.js";

export const personas = {
  sponsor: { id: "u-sponsor", name: "Business Sponsor" },
  product: { id: "u-product", name: "Product Owner" },
  data: { id: "u-data", name: "Customer Data Owner" },
  architect: { id: "u-architect", name: "Solution Architect" },
  security: { id: "u-security", name: "Security Specialist" },
  operations: { id: "u-ops", name: "Operations Owner" },
  api: { id: "u-api", name: "Customer API Owner" },
};

const now = "2026-10-03T08:00:00+02:00";

export const deliverySubject: DeliverySubject = {
  id: "ds-customer-verification",
  title: "Expose customer verification status to downstream channels",
  initialSignal:
    "Customer onboarding still requires manual checking in some channels. We want downstream channels to know whether the customer is verified so they can continue automatically where allowed.",
  problemStatement:
    "Downstream channels cannot reliably determine whether customer verification has completed and therefore fall back to manual handling.",
  desiredOutcome:
    "Authorized downstream channels can consume an agreed verification state with defined semantics, failure behavior and operational controls.",
  status: "DRILLING",
  priority: "HIGH",
  sponsorId: personas.sponsor.id,
  deliveryLeadId: personas.architect.id,
  currentIteration: 1,
  createdAt: now,
  updatedAt: now,
};

export const perspectives: Perspective[] = [
  {
    id: "p-business",
    deliverySubjectId: deliverySubject.id,
    type: "BUSINESS",
    name: "Business outcome and rules",
    criticality: "HIGH",
    required: true,
    status: "IN_PROGRESS",
    rationale: "Clarify when channels may proceed automatically and what verified means operationally.",
  },
  {
    id: "p-data",
    deliverySubjectId: deliverySubject.id,
    type: "DATA",
    name: "Customer verification semantics and source of truth",
    criticality: "CRITICAL",
    required: true,
    status: "IN_PROGRESS",
    rationale: "Status meaning, ownership and lineage must be authoritative.",
  },
  {
    id: "p-architecture",
    deliverySubjectId: deliverySubject.id,
    type: "ARCHITECTURE",
    name: "System and integration architecture",
    criticality: "HIGH",
    required: true,
    status: "IN_PROGRESS",
    rationale: "Change crosses MDM, API and channel boundaries.",
  },
  {
    id: "p-security",
    deliverySubjectId: deliverySubject.id,
    type: "SECURITY",
    name: "Access and exposure",
    criticality: "HIGH",
    required: true,
    status: "CONFIRMED",
    rationale: "New consumers will see customer verification information.",
  },
  {
    id: "p-operations",
    deliverySubjectId: deliverySubject.id,
    type: "OPERATIONS",
    name: "Availability, monitoring and failure behavior",
    criticality: "HIGH",
    required: true,
    status: "CONFIRMED",
    rationale: "Downstream automation depends on runtime behavior.",
  },
  {
    id: "p-api",
    deliverySubjectId: deliverySubject.id,
    type: "API",
    name: "Customer API contract",
    criticality: "HIGH",
    required: true,
    status: "IN_PROGRESS",
    rationale: "A current API is the likely distribution point.",
  },
];

export const assignments: PerspectiveAssignment[] = [
  { id: "a-business", perspectiveId: "p-business", userId: personas.product.id, relationship: "OWNER", required: true, status: "ACTIVE" },
  { id: "a-data", perspectiveId: "p-data", userId: personas.data.id, relationship: "OWNER", required: true, status: "ACTIVE" },
  { id: "a-arch", perspectiveId: "p-architecture", userId: personas.architect.id, relationship: "OWNER", required: true, status: "ACTIVE" },
  { id: "a-security", perspectiveId: "p-security", userId: personas.security.id, relationship: "OWNER", required: true, status: "ACTIVE" },
  { id: "a-ops", perspectiveId: "p-operations", userId: personas.operations.id, relationship: "OWNER", required: true, status: "ACTIVE" },
  { id: "a-api", perspectiveId: "p-api", userId: personas.api.id, relationship: "OWNER", required: true, status: "ACTIVE" },
  { id: "a-arch-data-contrib", perspectiveId: "p-data", userId: personas.architect.id, relationship: "CONTRIBUTOR", required: false, status: "ACTIVE" },
];

export const requirements: Requirement[] = [
  {
    id: "r-verification-state",
    deliverySubjectId: deliverySubject.id,
    type: "DATA",
    title: "Authoritative verification state",
    statement: "The solution shall use an explicitly defined authoritative source for customer verification state.",
    rationale: "Multiple channels must interpret the state consistently.",
    priority: "CRITICAL",
    criticality: "CRITICAL",
    status: "PROPOSED",
    ownerId: personas.data.id,
    requiresEvaluation: false,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "r-api-exposure",
    deliverySubjectId: deliverySubject.id,
    type: "API",
    title: "Expose verification state",
    statement: "Authorized downstream channels shall be able to obtain the customer verification state through the supported customer integration contract.",
    priority: "HIGH",
    criticality: "HIGH",
    status: "DRAFT",
    ownerId: personas.api.id,
    requiresEvaluation: true,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  },
];

export const requirementSources: RequirementSource[] = [
  {
    requirementId: "r-verification-state",
    sourceKind: "KNOWLEDGE_REFERENCE",
    sourceId: "k-customer-concept",
    authoritative: true,
  },
  {
    requirementId: "r-api-exposure",
    sourceKind: "AI_INFERENCE",
    sourceId: "inference-initial-impact",
    authoritative: false,
  },
];

export const gaps: Gap[] = [
  {
    id: "gap-failure-behavior",
    deliverySubjectId: deliverySubject.id,
    description: "Behavior is undefined when the authoritative verification source is unavailable or stale.",
    severity: "HIGH",
    perspectiveId: "p-operations",
    requiredOwnerId: personas.operations.id,
    blocking: true,
    status: "OPEN",
  },
];

export const conflicts: Conflict[] = [
  {
    id: "conflict-sync-async",
    deliverySubjectId: deliverySubject.id,
    description: "Business expects immediate response while current architecture guidance prefers asynchronous propagation and the source can respond slowly.",
    itemAType: "REQUIREMENT",
    itemAId: "r-api-exposure",
    itemBType: "KNOWLEDGE_REFERENCE",
    itemBId: "k-integration-guideline",
    severity: "HIGH",
    ownerIds: [personas.product.id, personas.architect.id, personas.operations.id],
    blocking: true,
    status: "OPEN",
  },
];

export const assumptions: Assumption[] = [
  {
    id: "assumption-api-channel",
    deliverySubjectId: deliverySubject.id,
    statement: "The existing Customer API is the correct distribution point for all target channels.",
    ownerId: personas.architect.id,
    confidence: 0.6,
    validationMethod: "Confirm target consumers and integration constraints during architecture/API drill.",
    impactIfWrong: "May require events or a separate service instead of API-only exposure.",
    status: "OPEN",
  },
];

export const workPackages: WorkPackage[] = [];
export const acceptanceCriteria: AcceptanceCriterion[] = [];
export const evaluations: Evaluation[] = [];

export const tasks: Task[] = [
  {
    id: "task-data-source",
    deliverySubjectId: deliverySubject.id,
    type: "DRILL",
    assigneeId: personas.data.id,
    perspectiveId: "p-data",
    title: "Confirm verification source of truth",
    question: "Which system and property is authoritative for verification state today, and which states/semantics are valid?",
    rationale: "The current requirement has authoritative concept provenance but not authoritative source-system lineage.",
    priority: 100,
    blocking: true,
    status: "OPEN",
    relatedObjectIds: ["r-verification-state", "k-customer-concept"],
  },
  {
    id: "task-ops-failure",
    deliverySubjectId: deliverySubject.id,
    type: "FILL_GAP",
    assigneeId: personas.operations.id,
    perspectiveId: "p-operations",
    title: "Define unavailable/stale behavior",
    question: "What must a channel do when verification state cannot be obtained or is older than the acceptable freshness window?",
    rationale: "Automation cannot be implemented safely without explicit failure behavior.",
    priority: 95,
    blocking: true,
    status: "OPEN",
    relatedObjectIds: ["gap-failure-behavior", "r-api-exposure"],
  },
];

export const knowledge: KnowledgeDocument[] = [
  {
    ref: { externalSystem: "EnterpriseGlossary", externalId: "customer-verification-state", uri: "seed://glossary/customer-verification-state" },
    type: "CONCEPT",
    title: "Customer Verification State",
    summary: "Enterprise term describing whether mandatory customer verification has completed.",
    relevance: 0.98,
    version: "3",
    content: "Known states: PENDING, VERIFIED, FAILED. The glossary identifies Customer Data as semantic owner but does not define the technical source property.",
    retrievedAt: now,
  },
  {
    ref: { externalSystem: "ProcessRepository", externalId: "onboarding-v4", uri: "seed://process/onboarding-v4" },
    type: "BUSINESS_PROCESS",
    title: "Customer Onboarding v4",
    summary: "Current onboarding process with manual verification fallback.",
    relevance: 0.92,
    version: "4",
    content: "After identity verification, selected channels wait for back-office confirmation before activating the customer relationship.",
    retrievedAt: now,
  },
  {
    ref: { externalSystem: "ApiCatalog", externalId: "customer-api-v2", uri: "seed://api/customer-v2" },
    type: "API",
    title: "Customer API v2",
    summary: "Read-oriented customer profile API used by several channels.",
    relevance: 0.9,
    version: "2.7",
    content: "GET /customers/{id} exposes profile and lifecycle data. Verification state is not currently part of the contract.",
    retrievedAt: now,
  },
  {
    ref: { externalSystem: "ArchitectureRepository", externalId: "integration-guideline-17", uri: "seed://architecture/integration-guideline-17" },
    type: "ARCHITECTURE_DECISION",
    title: "Propagation of cross-domain status changes",
    summary: "Guideline preferring asynchronous propagation for non-transactional cross-domain state changes.",
    relevance: 0.86,
    version: "1.2",
    content: "Cross-domain status changes that do not require transactional consistency should normally be propagated asynchronously to reduce runtime coupling.",
    retrievedAt: now,
  },
  {
    ref: { externalSystem: "OpsCatalog", externalId: "customer-mdm-slo", uri: "seed://ops/customer-mdm-slo" },
    type: "SERVICE",
    title: "Customer MDM runtime expectations",
    summary: "Operational characteristics for synchronous reads.",
    relevance: 0.75,
    version: "2026-Q3",
    content: "Typical reads are fast, but downstream clients must tolerate transient failures and up to 3 seconds at the documented tail under degraded conditions.",
    retrievedAt: now,
  },
];

const matchesRef = (document: KnowledgeDocument, ref: ExternalKnowledgeRef) =>
  document.ref.externalSystem === ref.externalSystem &&
  (ref.externalId ? document.ref.externalId === ref.externalId : document.ref.uri === ref.uri);

export class SeedKnowledgeProvider implements KnowledgeProvider {
  async search(query: KnowledgeQuery): Promise<KnowledgeHit[]> {
    const terms = query.text.toLowerCase().split(/\s+/).filter(Boolean);
    return knowledge
      .map((document) => {
        const haystack = `${document.title} ${document.summary ?? ""} ${document.content}`.toLowerCase();
        const lexical = terms.length
          ? terms.filter((term) => haystack.includes(term)).length / terms.length
          : 0;
        return { ...document, relevance: Math.max(document.relevance ?? 0, lexical) };
      })
      .filter((document) => !query.types?.length || query.types.includes(document.type))
      .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0))
      .slice(0, query.limit ?? 20)
      .map(({ content: _content, retrievedAt: _retrievedAt, ...hit }) => hit);
  }

  async fetch(ref: ExternalKnowledgeRef): Promise<KnowledgeDocument | null> {
    return knowledge.find((document) => matchesRef(document, ref)) ?? null;
  }

  async related(ref: ExternalKnowledgeRef): Promise<KnowledgeHit[]> {
    const current = await this.fetch(ref);
    if (!current) return [];
    return knowledge
      .filter((document) => document !== current)
      .slice(0, 4)
      .map(({ content: _content, retrievedAt: _retrievedAt, ...hit }) => hit);
  }
}
