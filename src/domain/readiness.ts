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
  Verification,
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
  verifications: Verification[];
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

const taskIsOpen = (status: Task["status"]) =>
  !["COMPLETED", "CANCELLED"].includes(status);

export function evaluateReadiness(snapshot: ReadinessSnapshot): ReadinessResult {
  const {
    deliverySubject,
    perspectives,
    assignments,
    requirements,
    requirementSources,
    verifications,
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

  const outcomeReady = Boolean(
    deliverySubject.problemStatement && deliverySubject.desiredOutcome,
  );
  checks.push({
    code: "OUTCOME_DEFINED",
    passed: outcomeReady,
    blocking: true,
    message: outcomeReady
      ? "Problem statement and desired outcome are defined."
      : "Problem statement and desired outcome must both be defined.",
    relatedObjectIds: [deliverySubject.id],
  });

  const requiredPerspectives = perspectives.filter((p) => p.required);
  const unconfirmedPerspectiveIds = requiredPerspectives
    .filter((p) => p.status === "PROPOSED")
    .map((p) => p.id);
  checks.push({
    code: "REQUIRED_PERSPECTIVES_CONFIRMED",
    passed: unconfirmedPerspectiveIds.length === 0,
    blocking: true,
    message:
      unconfirmedPerspectiveIds.length === 0
        ? "All required perspectives are confirmed."
        : `${unconfirmedPerspectiveIds.length} required perspective(s) remain only proposed.`,
    relatedObjectIds: unconfirmedPerspectiveIds,
  });

  const unownedPerspectiveIds = requiredPerspectives
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
    code: "REQUIRED_PERSPECTIVES_OWNED",
    passed: unownedPerspectiveIds.length === 0,
    blocking: true,
    message:
      unownedPerspectiveIds.length === 0
        ? "All required perspectives have an accountable owner or delegate."
        : `${unownedPerspectiveIds.length} required perspective(s) lack an active owner/delegate.`,
    relatedObjectIds: unownedPerspectiveIds,
  });

  const criticalRequirements = requirements.filter(
    (r) => critical(r.criticality) && r.status !== "SUPERSEDED",
  );

  const requirementIsVerified = (requirement: Requirement) =>
    verifications.some(
      (verification) =>
        verification.targetType === "REQUIREMENT" &&
        verification.targetId === requirement.id &&
        verification.targetRevision === requirement.revision &&
        verification.status === "ACTIVE" &&
        verification.verdict === "VERIFIED",
    );

  const unverifiedCriticalRequirementIds = criticalRequirements
    .filter((r) => !requirementIsVerified(r))
    .map((r) => r.id);
  checks.push({
    code: "CRITICAL_REQUIREMENTS_VERIFIED",
    passed: unverifiedCriticalRequirementIds.length === 0,
    blocking: true,
    message:
      unverifiedCriticalRequirementIds.length === 0
        ? "All high/critical requirements have an active verification for their current revision."
        : `${unverifiedCriticalRequirementIds.length} high/critical requirement(s) lack current-revision verification.`,
    relatedObjectIds: unverifiedCriticalRequirementIds,
  });

  const noAuthoritativeSourceIds = criticalRequirements
    .filter(
      (r) =>
        !requirementSources.some(
          (s) =>
            s.requirementId === r.id &&
            s.requirementRevision === r.revision &&
            s.authoritative,
        ),
    )
    .map((r) => r.id);
  checks.push({
    code: "CRITICAL_REQUIREMENTS_AUTHORITATIVE_PROVENANCE",
    passed: noAuthoritativeSourceIds.length === 0,
    blocking: true,
    message:
      noAuthoritativeSourceIds.length === 0
        ? "All high/critical requirements have authoritative provenance for the current revision."
        : `${noAuthoritativeSourceIds.length} high/critical requirement(s) lack authoritative current-revision provenance.`,
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

  const unmanagedMajorAssumptionIds = assumptions
    .filter(
      (a) =>
        a.status !== "SUPERSEDED" &&
        critical(a.criticality) &&
        (!a.ownerId || !a.validationMethod),
    )
    .map((a) => a.id);
  checks.push({
    code: "MAJOR_ASSUMPTIONS_MANAGED",
    passed: unmanagedMajorAssumptionIds.length === 0,
    blocking: true,
    message:
      unmanagedMajorAssumptionIds.length === 0
        ? "All major assumptions have an owner and validation method."
        : `${unmanagedMajorAssumptionIds.length} major assumption(s) lack owner or validation method.`,
    relatedObjectIds: unmanagedMajorAssumptionIds,
  });

  const unresolvedBlockingAssumptionIds = assumptions
    .filter(
      (a) =>
        a.blocking &&
        (a.status === "OPEN" || a.status === "INVALIDATED"),
    )
    .map((a) => a.id);
  checks.push({
    code: "NO_UNRESOLVED_BLOCKING_ASSUMPTIONS",
    passed: unresolvedBlockingAssumptionIds.length === 0,
    blocking: true,
    message:
      unresolvedBlockingAssumptionIds.length === 0
        ? "No blocking assumptions remain unresolved."
        : `${unresolvedBlockingAssumptionIds.length} blocking assumption(s) remain unresolved.`,
    relatedObjectIds: unresolvedBlockingAssumptionIds,
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

  const untargetedPackageIds = workPackages
    .filter((wp) => wp.requirementIds.length > 0 && !wp.targetAreaRef)
    .map((wp) => wp.id);
  checks.push({
    code: "WORK_PACKAGES_TARGETED",
    passed: untargetedPackageIds.length === 0,
    blocking: true,
    message:
      untargetedPackageIds.length === 0
        ? "All populated work packages have a target implementation area."
        : `${untargetedPackageIds.length} work package(s) lack a target implementation area.`,
    relatedObjectIds: untargetedPackageIds,
  });

  const missingAcceptanceIds = criticalRequirements
    .filter(
      (r) =>
        !acceptanceCriteria.some(
          (ac) =>
            ac.targetType === "REQUIREMENT" &&
            ac.targetId === r.id &&
            (ac.targetRevision == null || ac.targetRevision === r.revision),
        ),
    )
    .map((r) => r.id);
  checks.push({
    code: "CRITICAL_REQUIREMENTS_HAVE_ACCEPTANCE",
    passed: missingAcceptanceIds.length === 0,
    blocking: true,
    message:
      missingAcceptanceIds.length === 0
        ? "All high/critical requirements have current acceptance criteria."
        : `${missingAcceptanceIds.length} high/critical requirement(s) lack current acceptance criteria.`,
    relatedObjectIds: missingAcceptanceIds,
  });

  const missingEvalIds = requirements
    .filter((r) => r.requiresEvaluation && r.status !== "SUPERSEDED")
    .filter(
      (r) =>
        !evaluations.some(
          (evaluation) =>
            evaluation.targetType === "REQUIREMENT" &&
            evaluation.targetId === r.id &&
            (evaluation.targetRevision == null || evaluation.targetRevision === r.revision),
        ),
    )
    .map((r) => r.id);
  checks.push({
    code: "REQUIRED_EVALS_DEFINED",
    passed: missingEvalIds.length === 0,
    blocking: true,
    message:
      missingEvalIds.length === 0
        ? "All requirements flagged for evaluation have a current eval."
        : `${missingEvalIds.length} requirement(s) flagged for evaluation have no current eval.`,
    relatedObjectIds: missingEvalIds,
  });

  const unresolvedBlockingDependencyIds = dependencies
    .filter((d) => d.blocking && !d.resolved)
    .map((d) => d.id);
  checks.push({
    code: "NO_UNRESOLVED_BLOCKING_DEPENDENCIES",
    passed: unresolvedBlockingDependencyIds.length === 0,
    blocking: true,
    message:
      unresolvedBlockingDependencyIds.length === 0
        ? "No blocking dependencies remain unresolved."
        : `${unresolvedBlockingDependencyIds.length} blocking dependency/dependencies remain unresolved.`,
    relatedObjectIds: unresolvedBlockingDependencyIds,
  });

  const unownedBlockingDependencyIds = dependencies
    .filter((d) => d.blocking && !d.resolved && !d.ownerId)
    .map((d) => d.id);
  checks.push({
    code: "BLOCKING_DEPENDENCIES_OWNED",
    passed: unownedBlockingDependencyIds.length === 0,
    blocking: true,
    message:
      unownedBlockingDependencyIds.length === 0
        ? "All unresolved blocking dependencies have an owner."
        : `${unownedBlockingDependencyIds.length} unresolved blocking dependency/dependencies lack an owner.`,
    relatedObjectIds: unownedBlockingDependencyIds,
  });

  const openBlockingTaskIds = tasks
    .filter((task) => task.blocking && taskIsOpen(task.status))
    .map((task) => task.id);
  checks.push({
    code: "NO_OPEN_BLOCKING_TASKS",
    passed: openBlockingTaskIds.length === 0,
    blocking: true,
    message:
      openBlockingTaskIds.length === 0
        ? "No blocking human tasks remain open."
        : `${openBlockingTaskIds.length} blocking human task(s) remain open.`,
    relatedObjectIds: openBlockingTaskIds,
  });

  const unassignedBlockingTaskIds = tasks
    .filter(
      (task) => task.blocking && taskIsOpen(task.status) && !task.assigneeId,
    )
    .map((task) => task.id);
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

  return {
    state: blockingChecks.every((c) => c.passed) ? "READY" : "NOT_READY",
    score,
    checks,
  };
}
