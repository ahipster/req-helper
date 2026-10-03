# GCP Deployment

## PoC target

```text
Architecture Git repos
      |
      | backend-only approved credentials/integration
      v
Cloud Run: Req Helper Next.js/API
  -> architecture ingestion service path
       -> exact Git commits / Markdown
       -> OpenCode/Vertex extraction
       -> Firestore normalized ArchitectureBaseline
  -> normal Req Helper APIs
       -> Firestore authoritative structured state
       -> GCS uploaded source files if enabled
       -> OpenCode service/SDK -> Vertex AI / Model Garden

Browser
  -> Cloud Run APIs + authorized Firestore reads
```

No Sparx connectivity is required in P0.

## Minimum GCP services

- Cloud Run;
- Cloud Firestore;
- Vertex AI;
- Artifact Registry;
- Identity Platform/Firebase Auth or enterprise identity;
- GCS only if file upload is enabled;
- Secret Manager only for unavoidable non-ADC/non-workload integration secrets.

Do not add Pub/Sub, Redis, Kafka or a separate ingestion platform solely for the PoC unless a demonstrated operational need appears.

## Authentication and service identity

Prefer Application Default Credentials/workload identity for GCP services.

Req Helper service identity receives only what it needs to:

- read/write Firestore;
- access GCS when enabled;
- invoke approved Vertex models/OpenCode;
- access explicit enterprise/Git integrations.

Do not commit/bake service-account JSON keys or Git tokens into images.

## Git architecture source access

Architecture source access is **backend-only**.

P0 supported source is Git Markdown repositories. Credentials may be supplied through an approved GitHub/GitLab/enterprise connector or Secret Manager where unavoidable.

Rules:

- browser never receives repository access token;
- OpenCode/model never receives unrestricted repository credential;
- application fetch layer resolves exact repository + branch + commit;
- ingestion passes bounded Markdown content + immutable source metadata to the model;
- Firestore stores repository identifiers, exact commit SHAs, paths, fingerprints and normalized source evidence — not credentials;
- P0 does not push/write commits back to architecture repositories.

Illustrative non-secret configuration:

```text
ARCHITECTURE_SOURCE_DEFAULT_BRANCH=main
ARCHITECTURE_INGESTION_SCHEMA_VERSION=1
ARCHITECTURE_INGESTION_PROMPT_VERSION=poc-v1
```

Any actual repository credential is deployment secret/connector state, not `.env.example` source-controlled data.

## Architecture ingestion execution shape

For the one-week PoC, architecture ingestion can run as a privileged backend/admin operation in the existing Cloud Run application or as a Cloud Run Job if execution duration makes request handling awkward.

Do not create another permanent service unless needed.

Lifecycle:

```text
admin starts ingestion
 -> backend resolves exact commits
 -> scans/fingerprints Markdown
 -> invokes bounded LLM extraction jobs
 -> reconciles/validates
 -> persists findings/candidate baseline
 -> admin reviews blockers
 -> backend publishes immutable ArchitectureBaseline
```

Publication must call deterministic architecture publication validation. Model output alone never changes the published baseline pointer/version.

If ingestion is long-running, prefer Cloud Run Job/manual admin execution for P0 rather than holding an interactive request open. Product correctness must not depend on one process staying alive; run state/findings remain in Firestore.

## OpenCode deployment

### Separate internal service — preferred PoC shape

Run OpenCode as an internal service and connect via `@opencode-ai/sdk`.

Benefits:

- process isolation;
- independent restart;
- simpler adapter boundary;
- easier war-room inspection.

OpenCode local session persistence is disposable. Req Helper stores logical thread/session-generation metadata and authoritative context in Firestore.

Architecture ingestion may use the same OpenCode/Vertex provider but has separate `ArchitectureIngestionRun` state, not participant AgentThread state.

### Embedded process

Acceptable for PoC if operationally simpler. Both options must satisfy identical state-recovery guarantees.

## Cloud Run scaling

Req Helper can scale horizontally because correctness lives in Firestore.

- AgentThread Firestore lease serializes one logical participant thread.
- Different AgentThreads may run concurrently.
- Architecture baseline publication must use application-level compare-and-set/version checks so two ingestion runs cannot both silently become current.
- Never rely on in-memory locks for correctness.

## Firestore location

Choose approved location before database creation according to bank/data-residency policy. Repository does not prescribe a compliance region.

Vertex/model location follows approved model availability/policy.

## Source artifact storage

If uploads are enabled:

```text
Browser -> signed/backend upload flow -> GCS
                              |
                              +-> Firestore SourceArtifact(metadata + URI/hash)
```

Do not place large source document bytes in Firestore.

Architecture Markdown is read from Git at exact commits; do not duplicate entire repositories into Firestore. Persist normalized architecture plus concise source evidence/reference metadata.

## Realtime browser access

Browser:

- authenticate;
- read only subjects where membership exists (or admin policy allows);
- read published reference baseline data according to PoC rules;
- use Cloud Run API for authoritative mutations;
- never receives Git/Admin SDK/OpenCode/Vertex credentials.

Server:

- Admin SDK/service identity;
- membership/capability/perspective checks;
- Firestore transactions/audit;
- OpenCode/Vertex invocation;
- Git source access;
- GCS access where applicable.

## Required environment variables

Illustrative:

```text
GOOGLE_CLOUD_PROJECT=...
GOOGLE_VERTEX_LOCATION=...
OPENCODE_BASE_URL=...
OPENCODE_PROVIDER_ID=google-vertex
OPENCODE_MODEL_ID=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
REQ_HELPER_SOURCE_BUCKET=...             # only if uploads enabled
ARCHITECTURE_INGESTION_SCHEMA_VERSION=1
ARCHITECTURE_INGESTION_PROMPT_VERSION=poc-v1
```

Git credentials are deliberately not shown as ordinary source-controlled environment configuration; use approved connector/secret mechanisms.

## PoC deployment verification

Before war-room week verify:

1. two authorized members observe same subject live;
2. signed-in non-member cannot read subject;
3. browser direct authoritative writes are denied;
4. API mutation by user A is visible to authorized user B;
5. different AgentThreads run concurrently; same AgentThread serializes;
6. OpenCode restart/session deletion recreates + FULL hydrates without product-data loss;
7. `contextRevisionPresented` remains actual presented subject revision;
8. Cloud Run restart causes no product-state loss;
9. Vertex calls use expected project/model/location;
10. human answer persists if model/provider fails after submit;
11. source uploads, if enabled, keep bytes in GCS and metadata in Firestore;
12. architecture Git credentials never appear in browser/Firestore-readable source config/model prompts;
13. ingestion run records exact source commits/prompt/schema/model versions;
14. every published architecture element/relationship has source evidence;
15. blocking architecture publication findings prevent publish;
16. architecture baseline publication is atomic/version-checked;
17. requirement impact can expose exact architecture source evidence;
18. final package reconstructs solely from authoritative persisted domain state and pinned baselines.
