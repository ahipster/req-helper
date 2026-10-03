# GCP Deployment

## PoC target

```text
Browser
  -> Cloud Run: Req Helper Next.js/API
       -> Firestore (authoritative structured state)
       -> GCS (uploaded source files, if enabled)
       -> OpenCode service/SDK
            -> Vertex AI / Model Garden
```

## Minimum GCP services

- Cloud Run;
- Cloud Firestore;
- Vertex AI;
- Artifact Registry;
- Identity Platform/Firebase Auth or enterprise identity;
- GCS only if file upload is enabled;
- Secret Manager only for unavoidable non-ADC secrets.

## Authentication and service identity

Prefer Application Default Credentials/workload identity.

Req Helper service identity receives only what it needs to:

- read/write Firestore;
- access the configured GCS bucket when uploads are enabled;
- invoke approved Vertex models indirectly/directly as configured;
- access explicit enterprise integrations.

Do not commit or bake service-account JSON keys into images.

OpenCode Vertex configuration can use runtime project/location, e.g.:

```text
GOOGLE_CLOUD_PROJECT
GOOGLE_VERTEX_LOCATION
```

## OpenCode deployment

### Separate internal service — preferred PoC shape

Run OpenCode as an internal service and connect via `@opencode-ai/sdk`.

Benefits:

- process isolation;
- independent restart;
- simpler adapter boundary;
- easier war-room inspection.

OpenCode local session persistence is disposable. Req Helper stores logical thread/session-generation metadata and authoritative context in Firestore.

### Embedded process

Acceptable for the PoC if operationally simpler, but lifecycle is more coupled and Cloud Run churn makes session state more ephemeral.

Both options must satisfy the same recovery tests.

## Cloud Run scaling

Req Helper can scale horizontally because correctness lives in Firestore.

- AgentThread Firestore lease serializes one logical thread.
- Different AgentThreads may run concurrently.
- Never rely on in-memory locks for correctness.

## Firestore location

Choose an approved location before database creation according to bank/data-residency policy. The repository does not prescribe a compliance region.

Vertex location likewise follows approved model availability/policy. Example configs are not compliance decisions.

## Source artifact storage

If uploads are enabled:

```text
Browser -> signed/backend upload flow -> GCS
                              |
                              +-> Firestore SourceArtifact(metadata + URI/hash)
```

Do not place large source document bytes in Firestore.

For PoC simplicity, link-only `SourceArtifact` records are acceptable if file upload setup would threaten the one-week vertical slice.

## Realtime browser access

Browser:

- authenticate;
- read only subjects where active membership exists (or admin policy allows);
- subscribe narrowly;
- use Cloud Run API for authoritative mutations.

Server:

- Admin SDK/service identity;
- membership + capability + perspective-authority checks;
- Firestore transactions/audit;
- OpenCode invocation;
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
REQ_HELPER_SOURCE_BUCKET=...   # only if uploads enabled
```

Firebase web configuration identifies the Firebase project; it is not an authorization mechanism.

## PoC deployment verification

Before war-room week verify:

1. two **authorized members** can observe the same subject live;
2. a signed-in non-member cannot read that subject;
3. browser direct authoritative writes are denied;
4. API mutation by user A is visible to authorized user B without refresh;
5. two different AgentThreads run concurrently;
6. same AgentThread cannot run twice concurrently;
7. OpenCode restart/session deletion causes session recreation + FULL hydration, not data loss;
8. `contextRevisionPresented` remains the actual presented revision, not same-run `domainRevisionAtEnd`;
9. Cloud Run restart causes no product-state loss;
10. Vertex calls use the expected project/model/location;
11. human answer persists if model/provider fails after submit;
12. uploaded source bytes (if enabled) are in GCS while Firestore holds only metadata;
13. audit events identify human vs AI/system actor;
14. final package/read API reconstructs solely from authoritative persisted domain state.
