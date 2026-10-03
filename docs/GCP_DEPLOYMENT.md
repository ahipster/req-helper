# GCP Deployment

## PoC target

```text
Browser
  -> Cloud Run: Req Helper Next.js/API
       -> Firestore
       -> OpenCode service/SDK
            -> Vertex AI / Model Garden
```

## GCP services

Minimum:
- Cloud Run;
- Cloud Firestore;
- Vertex AI;
- Artifact Registry;
- Secret Manager only where non-ADC secrets are unavoidable;
- Identity Platform/Firebase Auth or existing enterprise identity integration.

## Authentication

Prefer Application Default Credentials / workload identity.

The Req Helper Cloud Run service account needs only the permissions required to:
- read/write its Firestore database;
- invoke approved Vertex models indirectly/directly as configured;
- access explicitly approved enterprise integrations.

Do not put service-account JSON keys into the image or repository.

OpenCode's Vertex provider can resolve project/location from its config or environment variables such as:

```text
GOOGLE_CLOUD_PROJECT
GOOGLE_VERTEX_LOCATION
```

On GCP, rely on the runtime service identity rather than local credential files.

## OpenCode deployment choices

### A. Separate internal service — preferred PoC shape

Run OpenCode as an internal service and connect with `createOpencodeClient`.

Advantages:
- clean process isolation;
- restart independently;
- simple Req Helper adapter;
- easier war-room inspection.

Caveat:
OpenCode local session persistence must be treated as disposable. Req Helper stores the logical AgentThread and authoritative context in Firestore and recreates missing OpenCode sessions.

### B. Embedded SDK

Start/host OpenCode from the Req Helper backend process.

Advantages:
- less network plumbing.

Trade-offs:
- lifecycle/process ownership is more coupled;
- Cloud Run instance churn makes local OpenCode state even more obviously temporary.

Either approach must satisfy the same invariant: loss of OpenCode state cannot lose product/domain state.

## Cloud Run scaling

Req Helper can scale horizontally because durable state lives in Firestore.

AgentThread leases prevent two backend instances from concurrently prompting the same logical thread.

Separate threads may run concurrently.

Do not depend on in-memory locks for correctness.

## Firestore locality

Choose a Firestore database location consistent with bank/data-residency requirements before creating the database; changing database location later is not a normal in-place operation.

Choose Vertex model regions according to model availability and policy. `opencode.json.example` uses `europe-west4` only as an example, not as a compliance decision.

## Realtime browser access

Browser SDK:
- authenticate user;
- open narrow Firestore listeners for authorized shared state;
- use the Cloud Run API for authoritative mutations.

Server SDK:
- Firebase Admin / Google Cloud credentials;
- domain transactions and audit writes;
- OpenCode invocation and validated AI command application.

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
```

Firebase web configuration values identify the Firebase project; authorization must come from identity + Firestore Security Rules, not from treating these values as secrets.

## PoC deployment verification

Before war-room week verify:

1. two authenticated browsers can watch the same Delivery Subject;
2. browser A mutation through API is visible to browser B without refresh;
3. two different AgentThreads can run concurrently;
4. same AgentThread cannot run twice concurrently;
5. killing/restarting OpenCode causes session recreation, not data loss;
6. killing/restarting Cloud Run causes no Delivery Subject data loss;
7. Vertex calls use the expected project/model/region;
8. Firestore Security Rules deny direct browser domain writes;
9. audit events identify human vs AI/system actor;
10. final export can be reconstructed solely from Firestore domain state.
