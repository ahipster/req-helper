# Admin UI and Role Model

## Purpose

Req Helper needs a small configuration surface for PoC users, global application roles, perspective templates and Delivery Subject setup. This is not a full enterprise IAM product.

The model deliberately separates four concepts:

1. global application capability;
2. Delivery Subject membership/access;
3. expertise hints;
4. per-perspective authority.

Do not infer authority from job title, system role, expertise hint or mere subject membership.

## 1. Global application roles

```text
ADMIN
PARTICIPANT
DELIVERY_LEAD
WAR_ROOM_OPERATOR
```

- `ADMIN`: manage users/templates and administer PoC configuration.
- `PARTICIPANT`: participate in assigned work.
- `DELIVERY_LEAD`: capability to lead Delivery Subjects, but does not grant access to every Delivery Subject.
- `WAR_ROOM_OPERATOR`: inspect/retry/diagnose agent runs, but does not grant assignment-management authority.

Users may have multiple system roles.

## 2. Delivery Subject membership

Membership determines access to one Delivery Subject:

```text
SPONSOR
DELIVERY_LEAD
PARTICIPANT
OBSERVER
```

Example:

```text
Alice
  global roles: PARTICIPANT, DELIVERY_LEAD

DS-123 membership: DELIVERY_LEAD
DS-456 membership: OBSERVER
DS-789: no membership -> no access
```

Global `DELIVERY_LEAD` means Alice is allowed to be configured as a subject lead; DS-123 membership establishes that she actually leads DS-123.

## 3. Perspective authority

Within a Delivery Subject:

```text
OWNER
DELEGATE
CONTRIBUTOR
REVIEWER
```

- OWNER/DELEGATE: authoritative verification rights for that perspective.
- CONTRIBUTOR: knowledge contribution only.
- REVIEWER: advisory challenge/comment/recommendation only.

Reviewer is never treated as authoritative merely because of a global role.

## 4. Expertise hints

`expertisePerspectiveTypes` is suggestion metadata only. It helps find likely participants and may influence AI routing suggestions. It never creates membership or assignment.

## 5. Firestore root collections

```text
users/{userId}
roleTemplates/{roleTemplateId}
perspectiveTemplates/{perspectiveTemplateId}
```

Membership and assignments live under each Delivery Subject:

```text
deliverySubjects/{subjectId}/members/{userId}
deliverySubjects/{subjectId}/assignments/{assignmentId}
```

## 6. Admin Overview

```text
┌───────────────────────────────────────────────────────────────┐
│ Req Helper / Admin                                           │
├───────────────────────────────────────────────────────────────┤
│ Users                 14 active                              │
│ Role templates         6                                     │
│ Perspective templates 11                                     │
│ Subjects missing owner 2                                     │
│                                                               │
│ [Users] [Roles] [Perspectives] [Ownership gaps]              │
└───────────────────────────────────────────────────────────────┘
```

## 7. Users

```text
User       Global capabilities               Expertise       Status
Alice      PARTICIPANT, DELIVERY_LEAD         Arch, API       Active
Bob        PARTICIPANT                        Business        Active
Dana       WAR_ROOM_OPERATOR, PARTICIPANT     Security        Active
```

## 8. User Detail

```text
Name       Alice Example
Email      alice@example.bank
Title      Solution Architect
Team       Customer Platform

Global roles
[x] PARTICIPANT
[x] DELIVERY_LEAD
[ ] WAR_ROOM_OPERATOR
[ ] ADMIN

Expertise hints
[x] ARCHITECTURE [x] API [x] INTEGRATION [ ] DATA

[Save] [Deactivate]
```

Deactivation preserves historical references. It prevents new work/assignments until reactivated.

## 9. Role Templates

Role templates are convenience bundles for system roles + expertise suggestions. They are never subject membership or authority.

```text
Architect
  global: PARTICIPANT
  suggested expertise: ARCHITECTURE, API, INTEGRATION

Product Owner
  global: PARTICIPANT
  suggested expertise: BUSINESS, PROCESS

War-room Operator
  global: WAR_ROOM_OPERATOR, PARTICIPANT
  authority implied: none
```

## 10. Perspective Catalogue

Admins can configure active perspective templates, descriptions, default criticality and default prompt skill.

Template changes do not silently alter historical Delivery Subject perspectives; subjects keep the snapshot/config actually used unless explicitly updated.

## 11. Delivery Subject Members

Subject Delivery Lead/Admin manages access:

```text
Customer onboarding / Members

Bob      SPONSOR, PARTICIPANT
Alice    DELIVERY_LEAD, PARTICIPANT
Cara     PARTICIPANT
Erik     PARTICIPANT
Mia      OBSERVER

[Add member] [Change role] [Remove access]
```

Removing access does not delete historical contributions/events.

## 12. Perspective Assignments

```text
Perspective    Person     Relation       Effect
Business       Bob        OWNER          authoritative
Architecture   Alice      OWNER          authoritative
Data           Cara       DELEGATE       authoritative
Security       Dana       REVIEWER       advisory only
Security       —          —              NEEDS OWNER/DELEGATE
```

Suggested experts may be shown, but the subject Delivery Lead confirms the assignment.

## 13. Permission matrix for P0

### ADMIN

- manage users/templates;
- view/administer all PoC subjects where policy permits;
- manage membership/assignments;
- use War Room diagnostics if also authorized by deployment policy.

### Subject DELIVERY_LEAD

- manage that subject's membership;
- confirm perspectives;
- manage assignments;
- reassign tasks;
- record/route decisions;
- reopen discovery/resolution.

### WAR_ROOM_OPERATOR

- inspect/rerun/classify harness activity for subjects they may access;
- **cannot** alter membership/assignments unless they also hold ADMIN or subject DELIVERY_LEAD.

### OWNER/DELEGATE

- authoritative verification for assigned perspective;
- no automatic admin/membership-management permission.

### REVIEWER

- comment/challenge/recommend;
- cannot satisfy authoritative verification solely as Reviewer.

## 14. User stories

### Admin

- Add/activate/deactivate users.
- Assign global application roles.
- Record expertise hints.
- Maintain role/perspective templates.
- See Delivery Subjects missing required authority.

### Delivery Lead

- Add/remove subject members.
- Assign subject roles.
- Assign OWNER/DELEGATE/CONTRIBUTOR/REVIEWER per perspective.
- Find candidate experts using hints.
- See required perspectives lacking OWNER/DELEGATE.

### War-room Operator

- Diagnose/rerun agent activity without accidentally obtaining governance authority.

## 15. P0 boundary

Do not implement HR directory sync, SCIM, nested groups, delegated-admin hierarchies, ABAC policy language or automatic job-title authority inference. Those are future identity integrations.
