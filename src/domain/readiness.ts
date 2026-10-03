import type {
  AcceptanceCriterion,
  Assumption,
  Conflict,
  DeliverySubject,
  Dependency,
  Evaluation,
  Gap,
  Perspective,
  PerspectiveAssignment,
  Requirement,
  RequirementSource,
  Task,
  WorkPackage,
} from "./schemas.js";

export type ReadinessCheck = {
  code: string;
  passed: boolean;
  blocking: boolean;
  message: string;
  relatedObjectIds: string[];
};

export type ReadinessResult = {
  state: "NOT_READY" | "READY";
  score: number;
  checks: ReadinessCheck[];
};

export type ReadinessSnapshot = {
  deliverySubject: DeliverySubject;
  perspectives: Perspective[];
  assignments: PerspectiveAssignment[];
  requirements: Requirement[];
  requirementSources: RequirementSource[];
  gaps: Gap[];
  conflicts: Conflict[];
  assumptions: Assumption[];
  workPackages: WorkPackage[];
  acceptanceCriteria: AcceptanceCriterion[];
  evaluations: Evaluation[];
  dependencies: Dependency[];
  tasks: Task[];
  requiredImpactLinksSatisfied?: boolean;
};

const critical = (value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") =>
  value === "HIGH" || value === "CRITICAL";

export function evaluateReadiness(snapshot: ReadinessSnapshot): ReadinessResult {
  const {
    deliverySubject,
    perspectives,
    assignments,
    requirements,
    requirementSources,
    gaps,
    conflicts,
    assumptions,
    workPackages,
    acceptanceCriteria,
    evaluations,
    dependencies,
    tasks,
  } = snapshot;

  const checks: ReadinessCheck[] = [];

  const outcomeReady = Boolean(deliverySubject.problemStatement && deliverySubject.desiredOutcome);
  checks.push({
    code: "OUTCOME_DEFINED",
    passed: outcomeReady,
    blocking: true,
    message: outcomeReady
      ? "Problem statement and desired outcome are defined."
      : "Problem statement and desired outcome must both be defined.",
    relatedObjectIds: [deliverySubject.id],
  });

  const criticalRequiredPerspectives = perspectives.filter(
    (p) => p.required && critical(p.criticality) && p.status !== "PROPOSED",
  );
  const unownedPerspectiveIds = criticalRequiredPerspectives
    .filter(
      (p) =>
        !assignments.some(
          (a) =>
            a.perspectiveId === p.id &&
            a.status === "ACTIVE" &&
            (a.relationship === "OWNER" || a.relationship === "DELEGATE"),
        ),
    )
    .map((p) => p.id);
  checks.push({
    code: "CRITICAL_PERSPECTIVES_OWNED",
    passed: unownedPerspectiveIds.length === 0,
    blocking: true,
    message:
      unownedPerspectiveIds.length === 0
        ? "All required high/critical perspectives have an accountable owner or delegate."
        : `${unownedPerspectiveIds.length} required high/critical perspective(s) lack an accountable owner/delegate.`,
    relatedObjectIds: unownedPerspectiveIds,
  });

  const criticalRequirements = requirements.filter(
    (r) => critical(r.criticality) && r.status !== "SUPERSEDED",
  );

  const unverifiedCriticalRequirementIds = criticalRequirements
    .filter((r) => r.status !== "VERIFIED" && r.status !== "APPROVED")
    .map((r) => r.id);
  checks.push({
    code: "CRITICAL_REQUIREMENTS_VERIFIED",
    passed: unverifiedCriticalRequirementIds.length === 0,
    blocking: true,
    message:
      unverifiedCriticalRequirementIds.length === 0
        ? "All high/critical requirements are verified."
        : `${unverifiedCriticalRequirementIds.length} high/critical requirement(s) are not verified.`,
    relatedObjectIds: unverifiedCriticalRequirementIds,
  });

  const noAuthoritativeSourceIds = criticalRequirements
    .filter(
      (r) =>
        !requirementSources.some(
          (s) => s.requirementId === r.id && s.authoritative,
        ),
    )
    .map((r) => r.id);
  checks.push({
    code: "CRITICAL_REQUIREMENTS_AUTHORITATIVE_PROVENANCE",
    passed: noAuthoritativeSourceIds.length === 0,
    blocking: true,
    message:
      noAuthoritativeSourceIds.length === 0
        ? "All high/critical requirements have authoritative provenance."
        : `${noAuthoritativeSourceIds.length} high/critical requirement(s) lack authoritative provenance.`,
    relatedObjectIds: noAuthoritativeSourceIds,
  });

  const openBlockingGapIds = gaps
    .filter((g) => g.blocking && g.status === "OPEN")
    .map((g) => g.id);
  checks.push({
    code: "NO_BLOCKING_GAPS",
    passed: openBlockingGapIds.length === 0,
    blocking: true,
    message:
      openBlockingGapIds.length === 0
        ? "No blocking gaps are open."
        : `${openBlockingGapIds.length} blocking gap(s) remain open.`,
    relatedObjectIds: openBlockingGapIds,
  });

  const openBlockingConflictIds = conflicts
    .filter((c) => c.blocking && c.status === "OPEN")
    .map((c) => c.id);
  checks.push({
    code: "NO_BLOCKING_CONFLICTS",
    passed: openBlockingConflictIds.length === 0,
    blocking: true,
    message:
      openBlockingConflictIds.length === 0
        ? "No blocking conflicts are open."
        : `${openBlockingConflictIds.length} blocking conflict(s) remain open.`,
    relatedObjectIds: openBlockingConflictIds,
  });

  const unmanagedAssumptionIds = assumptions
    .filter(
      (a) =>
        a.status === "OPEN" &&
        (!a.ownerId || !a.validationMethod),
    )
    .map((a) => a.id);
  checks.push({
    code: "OPEN_ASSUMPTIONS_MANAGED",
    passed: unmanagedAssumptionIds.length === 0,
    blocking: true,
    message:
      unmanagedAssumptionIds.length === 0
        ? "Open assumptions have an owner and validation method."
        : `${unmanagedAssumptionIds.length} open assumption(s) are missing owner or validation method.`,
    relatedObjectIds: unmanagedAssumptionIds,
  });

  const impactsReady = snapshot.requiredImpactLinksSatisfied !== false;
  checks.push({
    code: "REQUIRED_IMPACTS_LINKED",
    passed: impactsReady,
    blocking: true,
    message: impactsReady
      ? "Required enterprise impact links are satisfied."
      : "One or more required enterprise impact links are missing.",
    relatedObjectIds: impactsReady ? [] : [deliverySubject.id],
  });

  const requirementIdsInPackages = new Set(
    workPackages.flatMap((wp) => wp.requirementIds),
  );
  const unpackagedCriticalIds = criticalRequirements
    .filter((r) => !requirementIdsInPackages.has(r.id))
    .map((r) => r.id);
  checks.push({
    code: "CRITICAL_REQUIREMENTS_PACKAGED",
    passed: unpackagedCriticalIds.length === 0,
    blocking: true,
    message:
      unpackagedCriticalIds.length === 0
        ? "All high/critical requirements belong to a work package."
        : `${unpackagedCriticalIds.length} high/critical requirement(s) are not assigned to a work package.`,
    relatedObjectIds: unpackagedCriticalIds,
  });

  const acRequirementIds = new Set(acceptanceCriteria.map((ac) => ac.requirementId));
  const missingAcceptanceIds = criticalRequirements
    .filter((r) => !acRequirementIds.has(r.id))
    .map((r) => r.id);
  checks.push({
    code: "CRITICAL_REQUIREMENTS_HAVE_ACCEPTANCE",
    passed: missingAcceptanceIds.length === 0,
    blocking: true,
    message:
      missingAcceptanceIds.length === 0
        ? "All high/critical requirements have acceptance criteria."
        : `${missingAcceptanceIds.length} high/critical requirement(s) lack acceptance criteria.`,
    relatedObjectIds: missingAcceptanceIds,
  });

  const evalRequirementIds = new Set(evaluations.map((e) => e.requirementId));
  const missingEvalIds = requirements
    .filter((r) => r.requiresEvaluation && r.status !== "SUPERSEDED")
    .filter((r) => !evalRequirementIds.has(r.id))
    .map((r) => r.id);
  checks.push({
    code: "REQUIRED_EVALS_DEFINED",
    passed: missingEvalIds.length === 0,
    blocking: true,
    message:
      missingEvalIds.length === 0
        ? "All requirements flagged for evaluation have at least one eval."
        : `${missingEvalIds.length} requirement(s) flagged for evaluation have no eval.`,
    relatedObjectIds: missingEvalIds,
  });

  const unresolvedBlockingDependencies = dependencies
    .filter((d) => d.blocking && !d.resolved)
    .filter((d) => !d.ownerId)
    .map((d) => d.id);
  checks.push({
    code: "BLOCKING_DEPENDENCIES_OWNED",
    passed: unresolvedBlockingDependencies.length === 0,
    blocking: true,
    message:
      unresolvedBlockingDependencies.length === 0
        ? "All unresolved blocking dependencies have an owner."
        : `${unresolvedBlockingDependencies.length} unresolved blocking dependency/dependencies lack an owner.`,
    relatedObjectIds: unresolvedBlockingDependencies,
  });

  const unassignedBlockingTaskIds = tasks
    .filter(
      (t) =>
        t.blocking &&
        (t.status === "OPEN" || t.status === "WAITING") &&
        !t.assigneeId,
    )
    .map((t) => t.id);
  checks.push({
    code: "BLOCKING_TASKS_ASSIGNED",
    passed: unassignedBlockingTaskIds.length === 0,
    blocking: true,
    message:
      unassignedBlockingTaskIds.length === 0
        ? "All open blocking tasks are assigned."
        : `${unassignedBlockingTaskIds.length} open blocking task(s) are unassigned.`,
    relatedObjectIds: unassignedBlockingTaskIds,
  });

  const blockingChecks = checks.filter((c) => c.blocking);
  const passedBlockingChecks = blockingChecks.filter((c) => c.passed).length;
  const score = blockingChecks.length
    ? Math.round((passedBlockingChecks / blockingChecks.length) * 100)
    : 100;
  const ready = blockingChecks.every((c) => c.passed);

  return {
    state: ready ? "READY" : "NOT_READY",
    score,
    checks,
  };
}
