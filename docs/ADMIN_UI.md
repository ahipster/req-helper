# Admin UI and Role Model

## Purpose

Req Helper Admin configures PoC users, global roles, perspective templates and versioned Requirement Profiles. It is not a full IAM or enterprise requirement repository product.

The model separates:

1. global application capability;
2. Delivery Subject membership/access;
3. expertise hints;
4. per-perspective authority;
5. Requirement Profile governance;
6. current requirement catalogue reference/sync configuration.

## 1. Global roles

```text
ADMIN
PARTICIPANT
DELIVERY_LEAD
WAR_ROOM_OPERATOR
```

`ADMIN` may manage templates/profiles. Global role never implies perspective authority.

## 2. Delivery Subject membership

```text
SPONSOR
DELIVERY_LEAD
PARTICIPANT
OBSERVER
```

Membership determines access to one subject.

## 3. Perspective authority

```text
OWNER
DELEGATE
CONTRIBUTOR
REVIEWER
```

OWNER/DELEGATE may satisfy authoritative verification. REVIEWER remains advisory.

## 4. Expertise hints

`expertisePerspectiveTypes` helps routing/suggestions only.

## 5. Admin root data

```text
users/{userId}
roleTemplates/{roleTemplateId}
perspectiveTemplates/{perspectiveTemplateId}
requirementProfiles/{profileId}
  /versions/{version}
requirementCatalog/{requirementId}
  /versions/{version}
```

Subject membership/assignments/proposals live under Delivery Subjects.

## 6. Admin Overview

```text
┌────────────────────────────────────────────────────────────────┐
│ Req Helper / Admin                                            │
├────────────────────────────────────────────────────────────────┤
│ Users                    14 active                             │
│ Perspective templates    11                                    │
│ Requirement Profiles      7 published · 2 drafts              │
│ Catalogue requirements  842 current                            │
│ Subjects missing owner    2                                    │
│                                                                │
│ [Users] [Roles] [Perspectives] [Requirement Profiles]          │
│ [Catalogue] [Ownership gaps]                                   │
└────────────────────────────────────────────────────────────────┘
```

## 7. Users / role templates

Same semantics as before: users can be activated/deactivated, assigned global roles and expertise hints. Deactivation preserves historical references.

## 8. Perspective Catalogue

Admin configures active perspective templates, descriptions, default criticality and prompt skill. Template changes do not silently mutate historical Delivery Subject perspectives.

## 9. Requirement Profiles

Requirement Profile is the editable **requirements-for-requirements** contract.

```text
Profile            Published     Draft       Status
API Change         v8            v9          active
Data Model Change  v4            —           active
Regulatory Change  v3            —           active
Migration          v2            v3          active
```

Actions:

```text
[Create profile]
[New version]
[Edit draft]
[Compare versions]
[Publish]
[Retire profile]
```

Published versions are immutable. Editing a published profile always creates a new DRAFT version.

## 10. Requirement Profile editor

```text
API Change · DRAFT v9

Applicable subject kinds
[x] API_CHANGE [x] NEW_SERVICE [ ] MIGRATION

Required perspectives
[x] API [x] ARCHITECTURE [x] SECURITY [x] OPERATIONS

Requirement types
INTEGRATION [enabled]
SECURITY    [enabled]
RESILIENCE  [enabled]
OBSERVABILITY [enabled]

INTEGRATION policy
[x] rationale
[x] owner
[x] capability link
[x] authoritative provenance
minimum acceptance              [2]
automatable acceptance          [required]
required evals                  [SECURITY_CHECK]

Typed details
Producer          REFERENCE       required
Consumers         REFERENCE_LIST  required
Contract          REFERENCE       required
FailureBehaviour  TEXT            required
Compatibility     ENUM            required

Existing requirement matching
Search before CREATE            [required]
Duplicate threshold             [0.85]
Contradiction review            [required]

[Ask AI to modify draft] [Preview findings] [Publish v9]
```

The form may use assistant-ui form-filling copilot. AI updates draft fields only; human explicitly publishes.

## 11. Publishing a profile version

Publish validates:

- unique rule/field keys;
- supported types/value types;
- required enum options where relevant;
- thresholds in valid range;
- no contradictory policy definition;
- profile version > current published version.

On publish:

```text
DRAFT v9 -> PUBLISHED v9
profile.currentPublishedVersion = 9
```

Existing Delivery Subjects pinned to v8 stay on v8.

## 12. Profile impact / upgrade preview

Admin/Delivery Lead can preview the effect of a newer profile on a subject:

```text
DS-123: API Change v8 -> v9

New blocking findings
+ R-17 missing rollbackBehaviour
+ R-18 requires PERFORMANCE_TEST

Removed
- API-COMPAT-OLD

[Do not upgrade] [Upgrade subject]
```

Upgrade is an explicit subject mutation + audit event.

## 13. Requirement Catalogue admin/reference view

P0 catalogue is primarily read/reference oriented for Delivery Subject workflows.

```text
REQ-248 · INTEGRATION · ACTIVE · current v6
Capabilities: Customer Verification
Source: Enterprise Requirements Repository / EXT-1942

Versions: v1 ... v6
Active proposals: DS-119, DS-123
```

Admin may configure/import/sync catalogue data through backend utilities, but subject UI has no direct `Make Current` action.

A Delivery Subject proposal can never directly overwrite catalogue records.

## 14. Delivery Subject Members

Subject Delivery Lead/Admin manages access and assignments as previously specified.

```text
Bob      SPONSOR, PARTICIPANT
Alice    DELIVERY_LEAD, PARTICIPANT
Cara     PARTICIPANT
Mia      OBSERVER
```

## 15. Permissions

### ADMIN

- manage users/global templates;
- create/edit/publish Requirement Profile versions;
- configure catalogue import/sync where enabled;
- administer subject membership/assignments under PoC policy.

### Subject DELIVERY_LEAD

- manage that subject membership/assignments;
- confirm perspectives;
- choose/pin a published Requirement Profile;
- compare/upgrade to a newer published profile;
- classify/review requirement changes/matches;
- route decisions.

### WAR_ROOM_OPERATOR

- diagnose/rerun harness activity for accessible subjects;
- no implicit assignment/profile-publishing authority.

### OWNER/DELEGATE

- authoritative verification for assigned perspective;
- no profile administration permission.

### REVIEWER

- advisory comment/challenge/recommendation only.

## 16. User stories

### Admin / Requirement Steward

- Create Requirement Profile.
- Fork current published version into draft.
- Add/remove required perspectives.
- Configure enabled requirement types.
- Add typed profile detail fields.
- Change acceptance/evaluation expectations.
- Change existing-requirement search/duplicate policies.
- Use form copilot to edit the draft quickly.
- Publish immutable version.
- Inspect which subjects use each profile version.

### Delivery Lead

- Select/pin profile for subject.
- See available newer version.
- Preview new gaps before upgrade.
- Explicitly upgrade or remain on current version.

## 17. P0 boundary

Do not implement HR directory sync, SCIM, nested groups, generic policy language, automatic catalogue promotion after deployment or arbitrary user-defined JavaScript validation. Requirement Profile rules use the typed schema defined in `src/domain/schemas.ts`.
