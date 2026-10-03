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
  RequirementCatalogItem,
  RequirementCatalogVersion,
  RequirementChangeProposal,
  RequirementMatch,
  RequirementProfile,
  RequirementProfileVersion,
  RequirementQualityFinding,
  RequirementSource,
  Task,
  Verification,
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
const verificationCapability = "enterprise://capabilities/customer-verification";
const customerApiCapability = "enterprise://capabilities/customer-api";

export const apiChangeProfile: RequirementProfile = {
  id: "profile-api-change",
  name: "API Change",
  description: "Quality contract for changes affecting API/integration behavior.",
  currentPublishedVersion: 8,
  active: true,
  createdAt: now,
  updatedAt: now,
};

export const apiChangeProfileV8: RequirementProfileVersion = {
  id: "profile-api-change-v8",
  profileId: apiChangeProfile.id,
  version: 8,
  status: "PUBLISHED",
  name: "API Change",
  description: "Requires API, architecture, security and operations coverage plus explicit integration details.",
  applicableSubjectKinds: ["API_CHANGE", "NEW_SERVICE"],
  requiredPerspectiveTypes: ["API", "ARCHITECTURE", "SECURITY", "OPERATIONS"],
  typePolicies: [
    {
      requirementType: "INTEGRATION",
      enabled: true,
      requiredByDefault: true,
      requireRationale: true,
      requireOwner: true,
      requireCapabilityLink: true,
      requireAuthoritativeProvenance: true,
      minimumAcceptanceCriteria: 2,
      requireAutomatableAcceptance: true,
      requiredEvaluationTypes: ["SECURITY_CHECK"],
      detailFields: [
        { key: "producer", label: "Producer", valueType: "REFERENCE", required: true },
        { key: "consumers", label: "Consumers", valueType: "REFERENCE_LIST", required: true },
        { key: "contract", label: "Contract", valueType: "REFERENCE", required: true },
        { key: "failureBehaviour", label: "Failure behaviour", valueType: "TEXT", required: true },
        {
          key: "compatibility",
          label: "Compatibility",
          valueType: "ENUM",
          required: true,
          options: ["BACKWARD_COMPATIBLE", "BREAKING", "NOT_APPLICABLE"],
        },
      ],
    },
    {
      requirementType: "DATA",
      enabled: true,
      requiredByDefault: false,
      requireRationale: true,
      requireOwner: true,
      requireCapabilityLink: true,
      requireAuthoritativeProvenance: true,
      minimumAcceptanceCriteria: 1,
      requireAutomatableAcceptance: false,
      requiredEvaluationTypes: [],
      detailFields: [],
    },
  ],
  requireExistingRequirementSearchBeforeCreate: true,
  duplicateMatchThreshold: 0.85,
  contradictionReviewRequired: true,
  createdBy: personas.architect.id,
  createdAt: now,
  publishedAt: now,
};

export const requirementCatalog: RequirementCatalogItem[] = [
  {
    id: "REQ-051",
    stableKey: "customer-verification-authoritative-state",
    type: "DATA",
    title: "Authoritative customer verification state",
    lifecycle: "ACTIVE",
    currentVersion: 4,
    capabilityRefs: [verificationCapability],
    authoritativeSourceSystem: "EnterpriseRequirements",
    authoritativeExternalId: "ER-051",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "REQ-248",
    stableKey: "customer-verification-status-exposure",
    type: "INTEGRATION",
    title: "Expose customer verification status",
    lifecycle: "ACTIVE",
    currentVersion: 6,
    capabilityRefs: [verificationCapability, customerApiCapability],
    authoritativeSourceSystem: "EnterpriseRequirements",
    authoritativeExternalId: "ER-248",
    createdAt: now,
    updatedAt: now,
  },
];

export const requirementCatalogVersions: RequirementCatalogVersion[] = [
  {
    id: "REQ-051-v4",
    requirementId: "REQ-051",
    version: 4,
    type: "DATA",
    title: "Authoritative customer verification state",
    statement: "Customer verification status shall use the enterprise-defined verification semantics and authoritative source.",
    rationale: "Channels must not invent local verification semantics.",
    criticality: "CRITICAL",
    capabilityRefs: [verificationCapability],
    details: [],
    sourceVersion: "ER-051/4",
    publishedAt: now,
  },
  {
    id: "REQ-248-v6",
    requirementId: "REQ-248",
    version: 6,
    type: "INTEGRATION",
    title: "Expose customer verification status",
    statement: "Authorized channels may obtain customer verification status through the Customer API.",
    rationale: "Avoid channel-specific verification integrations.",
    criticality: "HIGH",
    capabilityRefs: [verificationCapability, customerApiCapability],
    details: [
      { fieldKey: "producer", valueType: "REFERENCE", textValue: "Customer MDM" },
      { fieldKey: "consumers", valueType: "REFERENCE_LIST", listValue: ["Channels"] },
      { fieldKey: "contract", valueType: "REFERENCE", textValue: "Customer API" },
      { fieldKey: "compatibility", valueType: "ENUM", textValue: "BACKWARD_COMPATIBLE" },
    ],
    sourceVersion: "ER-248/6",
    publishedAt: now,
  },
];

export const deliverySubject: DeliverySubject = {
  id: "ds-customer-verification",
  title: "Expose customer verification status to downstream channels",
  initialSignal:
    "Customer onboarding still requires manual checking in some channels. We want downstream channels to know whether the customer is verified so they can continue automatically where allowed.",
  subjectKind: "API_CHANGE",
  requirementProfileId: apiChangeProfile.id,
  requirementProfileVersion: 8,
  problemStatement:
    "Downstream channels cannot reliably determine whether customer verification has completed and therefore fall back to manual handling.",
  desiredOutcome:
    "Authorized downstream channels can consume an agreed verification state with defined semantics, failure behavior and operational controls.",
  scopeIn: ["verification-state semantics", "supported downstream distribution", "failure behavior"],
  scopeOut: ["implementation and deployment"],
  constraints: ["existing enterprise security and integration policy remains authoritative"],
  successMeasures: ["downstream teams receive a verified implementation-ready change set"],
  status: "DRILLING",
  priority: "HIGH",
  sponsorId: personas.sponsor.id,
  deliveryLeadId: personas.architect.id,
  currentIteration: 1,
  revision: 7,
  createdAt: now,
  updatedAt: now,
};

export const perspectives: Perspective[] = [
  { id: "p-business", deliverySubjectId: deliverySubject.id, type: "BUSINESS", name: "Business outcome and rules", criticality: "HIGH", required: true, status: "IN_PROGRESS", rationale: "Clarify when channels may proceed automatically.", createdAt: now, updatedAt: now },
  { id: "p-data", deliverySubjectId: deliverySubject.id, type: "DATA", name: "Verification semantics and source of truth", criticality: "CRITICAL", required: true, status: "IN_PROGRESS", rationale: "Status meaning, ownership and lineage must be authoritative.", createdAt: now, updatedAt: now },
  { id: "p-architecture", deliverySubjectId: deliverySubject.id, type: "ARCHITECTURE", name: "System and integration architecture", criticality: "HIGH", required: true, status: "IN_PROGRESS", rationale: "Change crosses MDM, API and channel boundaries.", createdAt: now, updatedAt: now },
  { id: "p-security", deliverySubjectId: deliverySubject.id, type: "SECURITY", name: "Access and exposure", criticality: "HIGH", required: true, status: "CONFIRMED", rationale: "New consumers will see customer verification information.", createdAt: now, updatedAt: now },
  { id: "p-operations", deliverySubjectId: deliverySubject.id, type: "OPERATIONS", name: "Availability, monitoring and failure behavior", criticality: "HIGH", required: true, status: "CONFIRMED", rationale: "Downstream automation depends on runtime behavior.", createdAt: now, updatedAt: now },
  { id: "p-api", deliverySubjectId: deliverySubject.id, type: "API", name: "Customer API contract", criticality: "HIGH", required: true, status: "IN_PROGRESS", rationale: "A current API is the likely distribution point.", createdAt: now, updatedAt: now },
];

export const assignments: PerspectiveAssignment[] = [
  { id: "a-business", perspectiveId: "p-business", userId: personas.product.id, relationship: "OWNER", status: "ACTIVE", createdAt: now, updatedAt: now },
  { id: "a-data", perspectiveId: "p-data", userId: personas.data.id, relationship: "OWNER", status: "ACTIVE", createdAt: now, updatedAt: now },
  { id: "a-arch", perspectiveId: "p-architecture", userId: personas.architect.id, relationship: "OWNER", status: "ACTIVE", createdAt: now, updatedAt: now },
  { id: "a-security", perspectiveId: "p-security", userId: personas.security.id, relationship: "OWNER", status: "ACTIVE", createdAt: now, updatedAt: now },
  { id: "a-ops", perspectiveId: "p-operations", userId: personas.operations.id, relationship: "OWNER", status: "ACTIVE", createdAt: now, updatedAt: now },
  { id: "a-api", perspectiveId: "p-api", userId: personas.api.id, relationship: "OWNER", status: "ACTIVE", createdAt: now, updatedAt: now },
  { id: "a-arch-data-contrib", perspectiveId: "p-data", userId: personas.architect.id, relationship: "CONTRIBUTOR", status: "ACTIVE", createdAt: now, updatedAt: now },
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
    capabilityRefs: [verificationCapability],
    details: [],
    requiresEvaluation: false,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "r-api-exposure",
    deliverySubjectId: deliverySubject.id,
    type: "INTEGRATION",
    title: "Expose verification state",
    statement: "Authorized downstream channels shall be able to obtain current customer verification state through a supported integration contract; stale state must not be treated as authoritative.",
    rationale: "Downstream automation needs a consistent current state.",
    priority: "HIGH",
    criticality: "HIGH",
    status: "DRAFT",
    ownerId: personas.api.id,
    capabilityRefs: [verificationCapability, customerApiCapability],
    details: [
      { fieldKey: "producer", valueType: "REFERENCE", textValue: "Customer MDM" },
      { fieldKey: "consumers", valueType: "REFERENCE_LIST", listValue: ["Channels"] },
      { fieldKey: "contract", valueType: "REFERENCE", textValue: "Customer API" },
      { fieldKey: "compatibility", valueType: "ENUM", textValue: "BACKWARD_COMPATIBLE" },
    ],
    requiresEvaluation: true,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  },
];

export const requirementChangeProposals: RequirementChangeProposal[] = [
  {
    id: "cp-data",
    deliverySubjectId: deliverySubject.id,
    changeType: "MODIFY",
    baselineRequirementId: "REQ-051",
    baselineVersion: 4,
    proposedRequirementId: "r-verification-state",
    rationale: "The current requirement needs explicit technical source-of-truth lineage.",
    status: "PROPOSED",
    relatedConflictIds: [],
    supersedesProposalIds: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "cp-api",
    deliverySubjectId: deliverySubject.id,
    changeType: "MODIFY",
    baselineRequirementId: "REQ-248",
    baselineVersion: 6,
    proposedRequirementId: "r-api-exposure",
    rationale: "The current requirement lacks freshness/failure semantics needed for automation.",
    status: "PROPOSED",
    relatedConflictIds: ["conflict-sync-async"],
    supersedesProposalIds: [],
    createdAt: now,
    updatedAt: now,
  },
];

export const requirementMatches: RequirementMatch[] = [
  {
    id: "match-api-baseline",
    deliverySubjectId: deliverySubject.id,
    subjectRequirementId: "r-api-exposure",
    candidateKind: "BASELINE_REQUIREMENT",
    candidateId: "REQ-248",
    candidateVersion: 6,
    relationship: "OVERLAPS",
    score: 0.93,
    rationale: "Same capability, same API and materially overlapping intent; modify instead of create.",
    blocking: false,
    status: "CONFIRMED",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "match-parallel-proposal",
    deliverySubjectId: deliverySubject.id,
    subjectRequirementId: "r-api-exposure",
    candidateKind: "ACTIVE_PROPOSAL",
    candidateId: "ds-parallel-verification:cp-api",
    relationship: "CONTRADICTS",
    score: 0.88,
    rationale: "Another active Delivery Subject proposes asynchronous event propagation for the same baseline requirement.",
    blocking: true,
    status: "UNREVIEWED",
    createdAt: now,
    updatedAt: now,
  },
];

export const requirementQualityFindings: RequirementQualityFinding[] = [
  {
    id: "finding-api-failure",
    deliverySubjectId: deliverySubject.id,
    profileId: apiChangeProfile.id,
    profileVersion: 8,
    requirementId: "r-api-exposure",
    ruleId: "INTEGRATION.failureBehaviour.required",
    severity: "HIGH",
    blocking: true,
    message: "API Change v8 requires explicit failureBehaviour for INTEGRATION requirements.",
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  },
];

export const requirementSources: RequirementSource[] = [
  {
    id: "rs-verification-state-baseline",
    deliverySubjectId: deliverySubject.id,
    requirementId: "r-verification-state",
    requirementRevision: 1,
    sourceKind: "BASELINE_REQUIREMENT",
    sourceId: "REQ-051",
    sourceVersion: "4",
    authoritative: true,
    createdAt: now,
  },
  {
    id: "rs-verification-state-concept",
    deliverySubjectId: deliverySubject.id,
    requirementId: "r-verification-state",
    requirementRevision: 1,
    sourceKind: "KNOWLEDGE_REFERENCE",
    sourceId: "k-customer-concept",
    authoritative: true,
    createdAt: now,
  },
  {
    id: "rs-api-baseline",
    deliverySubjectId: deliverySubject.id,
    requirementId: "r-api-exposure",
    requirementRevision: 1,
    sourceKind: "BASELINE_REQUIREMENT",
    sourceId: "REQ-248",
    sourceVersion: "6",
    authoritative: true,
    createdAt: now,
  },
];

export const verifications: Verification[] = [];

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
    createdAt: now,
    updatedAt: now,
  },
];

export const conflicts: Conflict[] = [
  {
    id: "conflict-sync-async",
    deliverySubjectId: deliverySubject.id,
    description: "Business expects immediate response while architecture and another active proposal prefer asynchronous propagation and operations notes slow-tail behavior.",
    positions: [
      { id: "pos-business", actorId: personas.product.id, perspectiveId: "p-business", itemType: "REQUIREMENT", itemId: "r-api-exposure", summary: "The business expects immediate confirmation.", evidenceIds: [] },
      { id: "pos-architecture", actorId: personas.architect.id, perspectiveId: "p-architecture", itemType: "KNOWLEDGE_REFERENCE", itemId: "k-integration-guideline", summary: "Cross-domain status propagation should normally be asynchronous.", evidenceIds: [] },
      { id: "pos-operations", actorId: personas.operations.id, perspectiveId: "p-operations", itemType: "KNOWLEDGE_REFERENCE", itemId: "k-customer-mdm-slo", summary: "The source can have degraded tail latency up to three seconds.", evidenceIds: [] },
      { id: "pos-other-subject", itemType: "REQUIREMENT_CHANGE_PROPOSAL", itemId: "ds-parallel-verification:cp-api", summary: "Another active Delivery Subject proposes asynchronous event propagation for REQ-248 v6.", evidenceIds: [] },
    ],
    severity: "HIGH",
    ownerIds: [personas.product.id, personas.architect.id, personas.operations.id],
    decisionOwnerId: personas.product.id,
    blocking: true,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  },
];

export const assumptions: Assumption[] = [
  {
    id: "assumption-api-channel",
    deliverySubjectId: deliverySubject.id,
    statement: "The existing Customer API is the correct distribution point for all target channels.",
    ownerId: personas.architect.id,
    statedConfidence: 0.6,
    criticality: "HIGH",
    blocking: false,
    validationMethod: "Confirm target consumers and integration constraints during architecture/API drill.",
    impactIfWrong: "May require events or a separate service instead of API-only exposure.",
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
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
    question: "REQ-051 v4 requires an authoritative verification state. Which system/property is authoritative today, and what specifically must change in this proposal?",
    rationale: "The baseline requirement defines semantics but not sufficient technical source lineage.",
    priority: 100,
    blocking: true,
    status: "OPEN",
    relatedObjectIds: ["REQ-051", "r-verification-state", "k-customer-concept"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "task-ops-failure",
    deliverySubjectId: deliverySubject.id,
    type: "FILL_GAP",
    assigneeId: personas.operations.id,
    perspectiveId: "p-operations",
    title: "Define unavailable/stale behavior",
    question: "API Change v8 requires failureBehaviour. What must a channel do when verification state cannot be obtained or is stale?",
    rationale: "Both the profile and automation safety require explicit failure behavior.",
    priority: 95,
    blocking: true,
    status: "OPEN",
    relatedObjectIds: ["finding-api-failure", "gap-failure-behavior", "r-api-exposure"],
    createdAt: now,
    updatedAt: now,
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
