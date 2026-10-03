# Admin UI and Role Model

## Purpose

Req Helper needs a small configuration surface so a PoC operator can set up participants, global application roles, perspective templates, and Delivery Subject assignments without editing Firestore manually.

This is deliberately not a full enterprise IAM product.

The model separates:

1. **Global application roles** — what a user may do in Req Helper itself.
2. **Perspective expertise hints** — which perspectives a user is commonly associated with.
3. **Delivery Subject assignments** — what that user is authoritative for on one specific Delivery Subject.

Do not infer authority from job title or global role.

## Global application roles

P0 roles:

```text
ADMIN
PARTICIPANT
DELIVERY_LEAD
WAR_ROOM_OPERATOR
```

Meaning:

- `ADMIN`: manage users, role templates, perspective catalogue and PoC configuration.
- `PARTICIPANT`: participate in assigned drills/reviews.
- `DELIVERY_LEAD`: create Delivery Subjects and manage assignments/readiness workflow.
- `WAR_ROOM_OPERATOR`: inspect agent traces, rerun analysis, classify failures and manage harness diagnostics.

A user may have multiple global roles.

## Delivery Subject assignment roles

These remain separate from global roles:

```text
OWNER
DELEGATE
CONTRIBUTOR
REVIEWER
```

Example:

```text
Alice
  global roles: PARTICIPANT
  expertise hints: ARCHITECTURE, API

DS-123
  Architecture -> OWNER
  API          -> CONTRIBUTOR

DS-456
  Architecture -> REVIEWER
```

This allows the same person to play different roles on different deliveries.

## Firestore collections

Add root collections:

```text
users/{userId}
roleTemplates/{roleTemplateId}
perspectiveTemplates/{perspectiveTemplateId}
```

### User profile

```ts
{
  id: string,
  displayName: string,
  email?: string,
  active: boolean,
  systemRoles: ("ADMIN" | "PARTICIPANT" | "DELIVERY_LEAD" | "WAR_ROOM_OPERATOR")[],
  expertisePerspectiveTypes: string[],
  title?: string,
  team?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Role template

Role templates are convenience bundles only. They are not authoritative Delivery Subject ownership.

```ts
{
  id: string,
  name: string,
  description?: string,
  systemRoles: string[],
  suggestedPerspectiveTypes: string[],
  active: boolean
}
```

Examples:

```text
Architect
  systemRoles: PARTICIPANT
  perspectives: ARCHITECTURE, API, INTEGRATION

Product Owner
  systemRoles: PARTICIPANT
  perspectives: BUSINESS, PROCESS

War-room Operator
  systemRoles: WAR_ROOM_OPERATOR, PARTICIPANT
```

### Perspective template

```ts
{
  id: string,
  type: string,
  name: string,
  description?: string,
  defaultCriticality?: string,
  active: boolean,
  defaultPromptSkill?: string
}
```

## Admin screens

### 1. Admin overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Req Helper / Admin                                                  │
├──────────────────────────────────────────────────────────────────────┤
│ Users                  14 active                                    │
│ Role templates          6                                           │
│ Perspective templates  11                                           │
│                                                                      │
│ [Manage users] [Manage roles] [Manage perspectives]                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 2. Users

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Users                                                   [+ Add user] │
├───────────────┬─────────────────────┬────────────────┬───────────────┤
│ User          │ Global roles        │ Expertise      │ Status        │
├───────────────┼─────────────────────┼────────────────┼───────────────┤
│ Alice         │ PARTICIPANT         │ Arch, API      │ Active        │
│ Bob           │ DELIVERY_LEAD       │ Business       │ Active        │
│ Cara          │ PARTICIPANT         │ Data           │ Active        │
│ Dana          │ WAR_ROOM_OPERATOR   │ Security       │ Active        │
└───────────────┴─────────────────────┴────────────────┴───────────────┘
```

### 3. User detail

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Alice Example                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ Name       [Alice Example                    ]                      │
│ Email      [alice@example.bank               ]                      │
│ Title      [Solution Architect               ]                      │
│ Team       [Customer Platform                ]                      │
│                                                                      │
│ Global roles                                                        │
│ [x] PARTICIPANT                                                     │
│ [ ] DELIVERY_LEAD                                                   │
│ [ ] WAR_ROOM_OPERATOR                                               │
│ [ ] ADMIN                                                           │
│                                                                      │
│ Expertise hints                                                     │
│ [x] ARCHITECTURE [x] API [x] INTEGRATION [ ] DATA                  │
│                                                                      │
│ [Save] [Deactivate]                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 4. Role templates

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Role templates                                          [+ New]      │
├──────────────────────────────────────────────────────────────────────┤
│ Architect                                                           │
│ PARTICIPANT · Architecture, API, Integration              [Edit]     │
│                                                                      │
│ Product Owner                                                       │
│ PARTICIPANT · Business, Process                           [Edit]     │
│                                                                      │
│ War-room Operator                                                   │
│ WAR_ROOM_OPERATOR · no authority implied                  [Edit]     │
└──────────────────────────────────────────────────────────────────────┘
```

### 5. Perspective catalogue

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Perspective catalogue                                  [+ Add]       │
├──────────────────────────────────────────────────────────────────────┤
│ Business       active · default criticality HIGH          [Edit]    │
│ Process        active · default criticality MEDIUM        [Edit]    │
│ Data           active · default criticality HIGH          [Edit]    │
│ Architecture   active · default criticality HIGH          [Edit]    │
│ Security       active · default criticality HIGH          [Edit]    │
│ Operations     active · default criticality MEDIUM        [Edit]    │
└──────────────────────────────────────────────────────────────────────┘
```

## Delivery Subject assignment UI

The Delivery Lead must be able to assign humans after the AI proposes perspectives.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Assign perspectives · Customer onboarding change                    │
├────────────────┬─────────────────────┬─────────────┬─────────────────┤
│ Perspective    │ Person              │ Relation    │ Status          │
├────────────────┼─────────────────────┼─────────────┼─────────────────┤
│ Business       │ Bob                 │ OWNER       │ ✓               │
│ Architecture   │ Alice               │ OWNER       │ ✓               │
│ Data           │ Cara                │ OWNER       │ ✓               │
│ Security       │ —                   │ —           │ NEEDS OWNER     │
│ Operations     │ Erik                │ REVIEWER    │ Needs OWNER     │
└────────────────┴─────────────────────┴─────────────┴─────────────────┘
│ Suggested experts for Security: Dana, Sofia                         │
│                                                      [Save]          │
└──────────────────────────────────────────────────────────────────────┘
```

Expertise hints may influence suggestions, but the Delivery Lead confirms the actual assignment.

## Authorization rules

P0 authorization should remain simple:

- all authenticated PoC testers may read Delivery Subjects they are allowed to access;
- only backend application services mutate authoritative domain state;
- `ADMIN` is required for `/admin/*` mutation endpoints;
- `DELIVERY_LEAD` or `ADMIN` may manage Delivery Subject assignments;
- `WAR_ROOM_OPERATOR` or `ADMIN` may rerun/diagnose agent runs;
- `OWNER`/`DELEGATE` assignment controls authoritative verification for that perspective;
- `CONTRIBUTOR` and `REVIEWER` never become authoritative merely because of their global role.

For the PoC, permission checks live in backend application services. Firestore Security Rules remain a defense-in-depth boundary for browser reads.

## User stories

### Admin

- I can add/activate/deactivate a user.
- I can assign global application roles.
- I can record perspective expertise hints.
- I can create/edit role templates.
- I can configure the perspective catalogue.
- I can see which Delivery Subjects currently lack required owners.

### Delivery Lead

- I can assign OWNER/DELEGATE/CONTRIBUTOR/REVIEWER per perspective.
- I can use expertise hints to find candidates.
- I can override AI-suggested participants.
- I can see when a required perspective lacks an accountable OWNER/DELEGATE.

## P0 boundary

Do not implement:

- HR directory synchronization;
- SCIM provisioning;
- complex nested groups;
- attribute-based policy language;
- enterprise-grade delegated administration;
- automatic authority inference from job title.

Those are future integrations. The one-week PoC only needs enough configuration to run several people through the workflow without editing raw database documents.
