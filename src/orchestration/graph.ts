import {
  Command,
  END,
  MemorySaver,
  START,
  StateGraph,
  StateSchema,
  interrupt,
} from "@langchain/langgraph";
import { z } from "zod";
import type { ModelGateway } from "../adapters/model.js";
import type { KnowledgeProvider } from "../adapters/knowledge.js";

const DrillQuestionSchema = z.object({
  question: z.string().min(1),
  rationale: z.string().min(1),
  perspectiveId: z.string(),
  assigneeId: z.string().optional(),
  relatedObjectIds: z.array(z.string()).default([]),
  blocking: z.boolean().default(false),
});

const DrillPlanSchema = z.object({
  questions: z.array(DrillQuestionSchema).min(1).max(5),
});

const ExtractedContributionSchema = z.object({
  statement: z.string().min(1),
  epistemicMode: z.enum(["KNOW", "BELIEVE", "OBSERVED", "UNKNOWN", "UNSPECIFIED"]),
  perspectiveId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  likelyAuthoritativeOwnerId: z.string().optional(),
  evidenceObjectIds: z.array(z.string()).default([]),
});

const ContributionExtractionSchema = z.object({
  contributions: z.array(ExtractedContributionSchema),
});

const RequirementMutationSchema = z.object({
  operation: z.enum(["CREATE", "REVISE", "NO_CHANGE"]),
  requirementId: z.string().optional(),
  type: z.enum([
    "BUSINESS",
    "FUNCTIONAL",
    "PROCESS",
    "DATA",
    "INTEGRATION",
    "SECURITY",
    "PRIVACY",
    "COMPLIANCE",
    "RISK",
    "OPERATIONAL",
    "PERFORMANCE",
    "RESILIENCE",
    "OBSERVABILITY",
    "UX",
    "MIGRATION",
    "TRANSITION",
  ]).optional(),
  title: z.string().optional(),
  statement: z.string().optional(),
  rationale: z.string().optional(),
  criticality: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  sourceContributionIds: z.array(z.string()).default([]),
  sourceKnowledgeReferenceIds: z.array(z.string()).default([]),
});

const RequirementSynthesisSchema = z.object({
  mutations: z.array(RequirementMutationSchema),
});

const GapConflictAnalysisSchema = z.object({
  needsMoreHumanInput: z.boolean(),
  gaps: z.array(
    z.object({
      description: z.string(),
      severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
      perspectiveId: z.string().optional(),
      blocking: z.boolean(),
    }),
  ),
  conflicts: z.array(
    z.object({
      description: z.string(),
      severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
      itemAId: z.string(),
      itemBId: z.string(),
      blocking: z.boolean(),
      ownerIds: z.array(z.string()).default([]),
    }),
  ),
});

export type OrchestrationContext = {
  deliverySummary: string;
  currentPerspectiveId?: string;
  relevantRequirements: Array<{ id: string; summary: string }>;
  relevantContributions: Array<{ id: string; statement: string; verified: boolean }>;
  relevantDecisions: Array<{ id: string; summary: string }>;
  relevantKnowledge: Array<{ id: string; title: string; summary?: string }>;
  openIssues: Array<{ id: string; type: string; summary: string; blocking: boolean }>;
};

export type HumanAnswer = {
  taskId: string;
  userId: string;
  answer?: string;
  action: "ANSWER" | "DONT_KNOW" | "ASK_SOMEONE";
  suggestedUserId?: string;
};

/**
 * The graph never writes the database itself. This port is implemented by
 * deterministic application/domain services which validate invariants,
 * persist state, and append audit events.
 */
export interface OrchestrationDomainPort {
  loadContext(deliverySubjectId: string, perspectiveId?: string): Promise<OrchestrationContext>;
  persistPlannedQuestions(
    deliverySubjectId: string,
    questions: z.infer<typeof DrillQuestionSchema>[],
  ): Promise<{ currentTaskId: string }>;
  recordHumanAnswer(deliverySubjectId: string, answer: HumanAnswer): Promise<void>;
  persistContributions(
    deliverySubjectId: string,
    taskId: string,
    contributions: z.infer<typeof ExtractedContributionSchema>[],
  ): Promise<{ contributionIds: string[] }>;
  applyRequirementMutations(
    deliverySubjectId: string,
    mutations: z.infer<typeof RequirementMutationSchema>[],
  ): Promise<void>;
  persistGapConflictAnalysis(
    deliverySubjectId: string,
    analysis: z.infer<typeof GapConflictAnalysisSchema>,
  ): Promise<void>;
  hasConverged(deliverySubjectId: string): Promise<boolean>;
  finalizeWorkPackagesAcceptanceAndEvals(deliverySubjectId: string): Promise<void>;
  evaluateAndPersistReadiness(deliverySubjectId: string): Promise<"READY" | "NOT_READY">;
}

export type ReqHelperGraphDependencies = {
  model: ModelGateway;
  knowledge: KnowledgeProvider;
  domain: OrchestrationDomainPort;
  promptVersion?: string;
};

const ReqHelperState = new StateSchema({
  deliverySubjectId: z.string(),
  perspectiveId: z.string().optional(),
  currentTaskId: z.string().optional(),
  lastHumanAnswer: z.string().optional(),
  lastHumanUserId: z.string().optional(),
  lastContributionIds: z.array(z.string()).optional(),
  loopCount: z.number().int().nonnegative().default(0),
  ready: z.boolean().default(false),
});

type GraphState = {
  deliverySubjectId: string;
  perspectiveId?: string;
  currentTaskId?: string;
  lastHumanAnswer?: string;
  lastHumanUserId?: string;
  lastContributionIds?: string[];
  loopCount: number;
  ready: boolean;
};

const formatContext = (context: OrchestrationContext) => JSON.stringify(context, null, 2);

export function buildReqHelperGraph(deps: ReqHelperGraphDependencies) {
  const promptVersion = deps.promptVersion ?? "poc-v1";

  const planDrill = async (state: GraphState) => {
    const context = await deps.domain.loadContext(
      state.deliverySubjectId,
      state.perspectiveId,
    );

    // Knowledge retrieval is deliberately bounded. Implementations can make
    // this smarter without changing the graph/domain contract.
    const discovered = await deps.knowledge.search({
      deliverySubjectId: state.deliverySubjectId,
      text: context.deliverySummary,
      limit: 8,
    });

    const plan = await deps.model.generateStructured({
      system:
        "Plan the smallest set of high-value human questions needed to reduce uncertainty for this delivery subject. Formal ownership changes priority, not eligibility. Never treat unverified claims as authoritative facts.",
      prompt: `${formatContext(context)}\n\nAdditional knowledge hits:\n${JSON.stringify(discovered, null, 2)}`,
      schema: DrillPlanSchema,
      metadata: { provider: "configured", model: "configured", promptVersion: `${promptVersion}:plan-drill` },
    });

    const { currentTaskId } = await deps.domain.persistPlannedQuestions(
      state.deliverySubjectId,
      plan.questions,
    );

    return new Command({
      update: { currentTaskId, loopCount: state.loopCount + 1 },
      goto: "askHuman",
    });
  };

  const askHuman = async (state: GraphState) => {
    if (!state.currentTaskId) {
      throw new Error("askHuman requires currentTaskId");
    }

    // interrupt() is intentionally first meaningful side effect in this node.
    const answer = interrupt({
      deliverySubjectId: state.deliverySubjectId,
      taskId: state.currentTaskId,
      action: "Answer the current Req Helper task",
    }) as HumanAnswer;

    await deps.domain.recordHumanAnswer(state.deliverySubjectId, answer);

    if (answer.action === "ASK_SOMEONE" || answer.action === "DONT_KNOW") {
      return new Command({
        update: {
          lastHumanAnswer: answer.answer ?? "",
          lastHumanUserId: answer.userId,
        },
        goto: "assessGapsConflicts",
      });
    }

    return new Command({
      update: {
        lastHumanAnswer: answer.answer ?? "",
        lastHumanUserId: answer.userId,
      },
      goto: "extractContributions",
    });
  };

  const extractContributions = async (state: GraphState) => {
    if (!state.currentTaskId || !state.lastHumanUserId) {
      throw new Error("extractContributions requires task/user context");
    }

    const context = await deps.domain.loadContext(
      state.deliverySubjectId,
      state.perspectiveId,
    );
    const extraction = await deps.model.generateStructured({
      system:
        "Extract atomic human contributions. Preserve uncertainty. Distinguish KNOW, BELIEVE, OBSERVED and UNKNOWN. Do not upgrade a contributor into an authoritative owner.",
      prompt: `${formatContext(context)}\n\nHuman answer:\n${state.lastHumanAnswer ?? ""}`,
      schema: ContributionExtractionSchema,
      metadata: { provider: "configured", model: "configured", promptVersion: `${promptVersion}:extract-contributions` },
    });

    const persisted = await deps.domain.persistContributions(
      state.deliverySubjectId,
      state.currentTaskId,
      extraction.contributions,
    );

    return new Command({
      update: { lastContributionIds: persisted.contributionIds },
      goto: "synthesizeRequirements",
    });
  };

  const synthesizeRequirements = async (state: GraphState) => {
    const context = await deps.domain.loadContext(
      state.deliverySubjectId,
      state.perspectiveId,
    );
    const synthesis = await deps.model.generateStructured({
      system:
        "Propose minimal requirement CREATE/REVISE mutations supported by the supplied evidence. Keep provenance IDs. Never resolve conflicts silently and never invent authority.",
      prompt: formatContext(context),
      schema: RequirementSynthesisSchema,
      metadata: { provider: "configured", model: "configured", promptVersion: `${promptVersion}:synthesize-requirements` },
    });

    await deps.domain.applyRequirementMutations(
      state.deliverySubjectId,
      synthesis.mutations,
    );

    return new Command({ update: {}, goto: "assessGapsConflicts" });
  };

  const assessGapsConflicts = async (state: GraphState) => {
    const context = await deps.domain.loadContext(
      state.deliverySubjectId,
      state.perspectiveId,
    );
    const analysis = await deps.model.generateStructured({
      system:
        "Find material missing information and contradictions across perspectives. A contradiction is a first-class conflict, not text to smooth over. Identify whether more human input is required.",
      prompt: formatContext(context),
      schema: GapConflictAnalysisSchema,
      metadata: { provider: "configured", model: "configured", promptVersion: `${promptVersion}:assess-gaps-conflicts` },
    });

    await deps.domain.persistGapConflictAnalysis(state.deliverySubjectId, analysis);
    const converged = !analysis.needsMoreHumanInput && (await deps.domain.hasConverged(state.deliverySubjectId));

    if (!converged) {
      return new Command({ update: {}, goto: "planDrill" });
    }

    return new Command({ update: {}, goto: "finalizePackage" });
  };

  const finalizePackage = async (state: GraphState) => {
    await deps.domain.finalizeWorkPackagesAcceptanceAndEvals(state.deliverySubjectId);
    const readiness = await deps.domain.evaluateAndPersistReadiness(state.deliverySubjectId);

    if (readiness === "NOT_READY") {
      return new Command({ update: { ready: false }, goto: "planDrill" });
    }

    return new Command({ update: { ready: true }, goto: END });
  };

  const graph = new StateGraph(ReqHelperState)
    .addNode("planDrill", planDrill)
    .addNode("askHuman", askHuman)
    .addNode("extractContributions", extractContributions)
    .addNode("synthesizeRequirements", synthesizeRequirements)
    .addNode("assessGapsConflicts", assessGapsConflicts)
    .addNode("finalizePackage", finalizePackage)
    .addEdge(START, "planDrill");

  // MemorySaver is only a bootstrap default. Replace with durable PostgreSQL
  // checkpointing before multi-user war-room use.
  return graph.compile({ checkpointer: new MemorySaver() });
}
