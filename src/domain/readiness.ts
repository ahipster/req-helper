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
  RequirementChangeProposal,
  RequirementMatch,
  RequirementQualityFinding,
  RequirementSource,
  Task,
  Verification,
  WorkPackage,
} from "./schemas.js";
import type {
  ArchitectureChangeProposal,
  ArchitectureElement,
  ArchitectureRelationship,
  DeliverySubjectArchitectureContext,
  RequirementArchitectureImpact,
  RequirementProfileArchitecturePolicy,
  WorkPackageImplementationTarget,
} from "./architecture.js";

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
  requirementChangeProposals?: RequirementChangeProposal[];
  requirementMatches?: RequirementMatch[];
  requirementQualityFindings?: RequirementQualityFinding[];
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
  architecturePolicy?: RequirementProfileArchitecturePolicy;
  architectureContext?: DeliverySubjectArchitectureContext;
  architectureElements?: ArchitectureElement[];
  architectureRelationships?: ArchitectureRelationship[];
  architectureImpacts?: RequirementArchitectureImpact[];
  architectureChangeProposals?: ArchitectureChangeProposal[];
  workPackageImplementationTargets?: WorkPackageImplementationTarget[];
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

  const requirementChangeProposals = snapshot.requirementChangeProposals ?? [];
  const requirementMatches = snapshot.requirementMatches ?? [];
  const requirementQualityFindings = snapshot.requirementQualityFindings ?? [];
  const architectureElements = snapshot.architectureElements ?? [];
  const architectureRelationships = snapshot.architectureRelationships ?? [];
  const architectureImpacts = snapshot.architectureImpacts ?? [];
  const architectureChangeProposals = snapshot.architectureChangeProposals ?? [];
  const workPackageImplementationTargets = snapshot.workPackageImplementationTargets ?? [];
  const architecturePolicy = snapshot.architecturePolicy;
  const architectureRequired = architecturePolicy?.requireArchitectureBaseline === true;
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

  const profilePinned = Boolean(
    deliverySubject.requirementProfileId && deliverySubject.requirementProfileVersion,
  );
  checks.push({
    code: "REQUIREMENT_PROFILE_PINNED",
    passed: profilePinned,
    blocking: true,
    message: profilePinned
      ? `Requirement Profile ${deliverySubject.requirementProfileId} v${deliverySubject.requirementProfileVersion} is pinned.`
      : "A published Requirement Profile version must be selected and pinned.",
    relatedObjectIds: [deliverySubject.id],
  });

  const openProfileFindingIds = requirementQualityFindings
    .filter((finding) => finding.blocking && finding.status === "OPEN")
    .map((finding) => finding.id);
  checks.push({
    code: "REQUIREMENT_PROFILE_COMPLIANT",
    passed: openProfileFindingIds.length === 0,
    blocking: true,
    message:
      openProfileFindingIds.length === 0
        ? "No blocking Requirement Profile findings are open."
        : `${openProfileFindingIds.length} blocking Requirement Profile finding(s) remain open.`,
    relatedObjectIds: openProfileFindingIds,
  });

  const activeRequirements = requirements.filter((r) => r.status !== "SUPERSEDED");
  const criticalRequirements = activeRequirements.filter((r) => critical(r.criticality));

  const classifiedRequirementIds = new Set(
    requirementChangeProposals
      .map((proposal) => proposal.proposedRequirementId)
      .filter((id): id is string => Boolean(id)),
  );
  const unclassifiedRequirementIds = activeRequirements
    .filter((requirement) => !classifiedRequirementIds.has(requirement.id))
    .map((requirement) => requirement.id);
  checks.push({
    code: "REQUIREMENT_CHANGES_CLASSIFIED",
    passed: unclassifiedRequirementIds.length === 0,
    blocking: true,
    message:
      unclassifiedRequirementIds.length === 0
        ? "All active subject requirements are classified as explicit change proposals."
        : `${unclassifiedRequirementIds.length} requirement(s) are not linked to a CREATE/MODIFY/SUPERSEDE/RETIRE/NO_CHANGE proposal.`,
    relatedObjectIds: unclassifiedRequirementIds,
  });

  const staleProposalIds = requirementChangeProposals
    .filter((proposal) => proposal.status === "STALE_BASELINE")
    .map((proposal) => proposal.id);
  checks.push({
    code: "NO_STALE_REQUIREMENT_BASELINES",
    passed: staleProposalIds.length === 0,
    blocking: true,
    message:
      staleProposalIds.length === 0
        ? "No requirement change proposal targets a stale baseline version."
        : `${staleProposalIds.length} requirement change proposal(s) must be rebased to the current baseline.`,
    relatedObjectIds: staleProposalIds,
  });

  const unresolvedMatchIds = requirementMatches
    .filter((match) => match.blocking && match.status === "UNREVIEWED")
    .map((match) => match.id);
  checks.push({
    code: "NO_UNRESOLVED_REQUIREMENT_COLLISIONS",
    passed: unresolvedMatchIds.length === 0,
    blocking: true,
    message:
      unresolvedMatchIds.length === 0
        ? "No blocking duplicate/overlap/contradiction candidate remains unreviewed."
        : `${unresolvedMatchIds.length} blocking existing-requirement or active-proposal match(es) require review.`,
    relatedObjectIds: unresolvedMatchIds,
  });

  const architectureImpactHasAuthority = (impact: RequirementArchitectureImpact) =>
    impact.status === "CONFIRMED" &&
    Boolean(impact.confirmedBy && impact.confirmedPerspectiveId) &&
    assignments.some(
      (assignment) =>
        assignment.perspectiveId === impact.confirmedPerspectiveId &&
        assignment.userId === impact.confirmedBy &&
        assignment.status === "ACTIVE" &&
        (assignment.relationship === "OWNER" || assignment.relationship === "DELEGATE"),
    );

  const architecturePinned = Boolean(snapshot.architectureContext);
  checks.push({
    code: "ARCHITECTURE_BASELINE_PINNED",
    passed: !architectureRequired || architecturePinned,
    blocking: architectureRequired,
    message: !architectureRequired
      ? "The selected profile does not require an architecture baseline."
      : architecturePinned
        ? `Architecture baseline ${snapshot.architectureContext?.architectureBaselineId} v${snapshot.architectureContext?.architectureBaselineVersion} is pinned.`
        : "The selected profile requires a published architecture baseline.",
    relatedObjectIds: architecturePinned ? [snapshot.architectureContext!.id] : [deliverySubject.id],
  });

  const architectureBaselineCurrent =
    !architectureRequired || snapshot.architectureContext?.status === "CURRENT";
  checks.push({
    code: "ARCHITECTURE_BASELINE_CURRENT",
    passed: architectureBaselineCurrent,
    blocking: architectureRequired,
    message: architectureBaselineCurrent
      ? "The pinned architecture baseline is current for this subject."
      : "The pinned architecture baseline is stale and architecture impact must be reassessed.",
    relatedObjectIds:
      architectureBaselineCurrent || !snapshot.architectureContext
        ? []
        : [snapshot.architectureContext.id],
  });

  const staleArchitectureProposalIds = architectureChangeProposals
    .filter((proposal) => proposal.status === "STALE_BASELINE")
    .map((proposal) => proposal.id);
  checks.push({
    code: "NO_STALE_ARCHITECTURE_CHANGES",
    passed: staleArchitectureProposalIds.length === 0,
    blocking: architectureRequired,
    message:
      staleArchitectureProposalIds.length === 0
        ? "No architecture change proposal targets a stale baseline."
        : `${staleArchitectureProposalIds.length} architecture change proposal(s) require rebasing.`,
    relatedObjectIds: staleArchitectureProposalIds,
  });

  const staleArchitectureImpactIds = architectureImpacts
    .filter((impact) => impact.status === "STALE_BASELINE")
    .map((impact) => impact.id);
  checks.push({
    code: "NO_STALE_ARCHITECTURE_IMPACTS",
    passed: staleArchitectureImpactIds.length === 0,
    blocking: architectureRequired,
    message:
      staleArchitectureImpactIds.length === 0
        ? "No architecture impact targets a stale baseline."
        : `${staleArchitectureImpactIds.length} architecture impact(s) require reassessment.`,
    relatedObjectIds: staleArchitectureImpactIds,
  });

  const unauthorizedArchitectureImpactIds = architectureImpacts
    .filter((impact) => impact.status === "CONFIRMED" && !architectureImpactHasAuthority(impact))
    .map((impact) => impact.id);
  checks.push({
    code: "ARCHITECTURE_IMPACT_CONFIRMATIONS_AUTHORIZED",
    passed: unauthorizedArchitectureImpactIds.length === 0,
    blocking: architectureRequired,
    message:
      unauthorizedArchitectureImpactIds.length === 0
        ? "All confirmed architecture impacts were confirmed by an active OWNER/DELEGATE."
        : `${unauthorizedArchitectureImpactIds.length} confirmed architecture impact(s) lack active OWNER/DELEGATE authority.`,
    relatedObjectIds: unauthorizedArchitectureImpactIds,
  });

  if (architecturePolicy?.requireConfirmedImpactForHighCritical) {
    const missingImpactRequirementIds = criticalRequirements
      .filter(
        (requirement) =>
          !architectureImpacts.some(
            (impact) =>
              impact.requirementId === requirement.id &&
              impact.requirementRevision === requirement.revision &&
              architectureImpactHasAuthority(impact) &&
              (!snapshot.architectureContext ||
                (impact.architectureBaselineId === snapshot.architectureContext.architectureBaselineId &&
                  impact.architectureBaselineVersion === snapshot.architectureContext.architectureBaselineVersion)),
          ),
      )
      .map((requirement) => requirement.id);
    checks.push({
      code: "CRITICAL_REQUIREMENTS_HAVE_ARCHITECTURE_IMPACT",
      passed: missingImpactRequirementIds.length === 0,
      blocking: true,
      message:
        missingImpactRequirementIds.length === 0
          ? "All high/critical requirements have an authoritative confirmed current-revision architecture impact."
          : `${missingImpactRequirementIds.length} high/critical requirement(s) lack authoritative confirmed architecture impact.`,
      relatedObjectIds: missingImpactRequirementIds,
    });
  }

  if (architecturePolicy && !architecturePolicy.allowNeedsReviewElementsForImpact) {
    const elementByKey = new Map(architectureElements.map((element) => [element.stableKey, element]));
    const relationshipById = new Map(
      architectureRelationships.map((relationship) => [relationship.id, relationship]),
    );
    const untrustedImpactIds = architectureImpacts
      .filter((impact) => impact.status === "CONFIRMED")
      .filter((impact) => {
        const target = elementByKey.get(impact.architectureElementKey);
        if (!target || target.reviewStatus !== "CONFIRMED") return true;
        return impact.sourceRelationshipIds.some(
          (relationshipId) => relationshipById.get(relationshipId)?.reviewStatus !== "CONFIRMED",
        );
      })
      .map((impact) => impact.id);
    checks.push({
      code: "ARCHITECTURE_IMPACTS_USE_TRUSTED_TOPOLOGY",
      passed: untrustedImpactIds.length === 0,
      blocking: architectureRequired,
      message:
        untrustedImpactIds.length === 0
          ? "Confirmed architecture impacts rely only on reviewed topology."
          : `${untrustedImpactIds.length} confirmed architecture impact(s) rely on missing or NEEDS_REVIEW topology.`,
      relatedObjectIds: untrustedImpactIds,
    });
  }

  if (architecturePolicy?.requireImplementationTargetForHighCritical) {
    const impactById = new Map(architectureImpacts.map((impact) => [impact.id, impact]));
    const targetedRequirementIds = new Set(
      workPackageImplementationTargets
        .map((target) => impactById.get(target.architectureImpactId))
        .filter((impact): impact is RequirementArchitectureImpact => Boolean(impact))
        .filter((impact) => architectureImpactHasAuthority(impact))
        .map((impact) => impact.requirementId),
    );
    const missingImplementationTargetIds = criticalRequirements
      .filter((requirement) => !targetedRequirementIds.has(requirement.id))
      .map((requirement) => requirement.id);
    checks.push({
      code: "CRITICAL_REQUIREMENTS_HAVE_IMPLEMENTATION_TARGET",
      passed: missingImplementationTargetIds.length === 0,
      blocking: true,
      message:
        missingImplementationTargetIds.length === 0
          ? "All high/critical requirements are routed to concrete architecture implementation targets."
          : `${missingImplementationTargetIds.length} high/critical requirement(s) lack a work-package implementation target.`,
      relatedObjectIds: missingImplementationTargetIds,
    });
  }

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

  const verificationHasAuthority = (verification: Verification) =>
    Boolean(verification.perspectiveId) &&
    assignments.some(
      (assignment) =>
        assignment.perspectiveId === verification.perspectiveId &&
        assignment.userId === verification.verifierId &&
        assignment.status === "ACTIVE" &&
        (assignment.relationship === "OWNER" || assignment.relationship === "DELEGATE"),
    );

  const requirementIsVerified = (requirement: Requirement) =>
    verifications.some(
      (verification) =>
        verification.targetType === "REQUIREMENT" &&
        verification.targetId === requirement.id &&
        verification.targetRevision === requirement.revision &&
        verification.status === "ACTIVE" &&
        verification.verdict === "VERIFIED" &&
        verificationHasAuthority(verification),
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
        ? "All high/critical requirements have an authoritative active verification for their current revision."
        : `${unverifiedCriticalRequirementIds.length} high/critical requirement(s) lack current-revision OWNER/DELEGATE verification.`,
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
            ac.targetRevision === r.revision,
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

  const missingEvalIds = activeRequirements
    .filter((r) => r.requiresEvaluation)
    .filter(
      (r) =>
        !evaluations.some(
          (evaluation) =>
            evaluation.targetType === "REQUIREMENT" &&
            evaluation.targetId === r.id &&
            evaluation.targetRevision === r.revision,
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
