import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

const app =
  getApps()[0] ??
  initializeApp({
    credential: applicationDefault(),
  });

export const firestore = getFirestore(app);

export const subjectRef = (db: Firestore, subjectId: string) =>
  db.collection("deliverySubjects").doc(subjectId);

export const subjectCollection = (
  db: Firestore,
  subjectId: string,
  name:
    | "perspectives"
    | "assignments"
    | "tasks"
    | "contributions"
    | "requirements"
    | "requirementRevisions"
    | "gaps"
    | "conflicts"
    | "assumptions"
    | "decisions"
    | "knowledgeRefs"
    | "impacts"
    | "workPackages"
    | "acceptanceCriteria"
    | "evaluations"
    | "dependencies"
    | "messages"
    | "events"
    | "agentThreads"
    | "agentRuns",
) => subjectRef(db, subjectId).collection(name);

export type AuditEventInput = {
  type: string;
  actorType: "HUMAN" | "AI" | "SYSTEM";
  actorId?: string;
  objectType: string;
  objectId: string;
  summary: string;
  runId?: string;
};

/**
 * Runs a material subject mutation and increments the subject revision in the
 * same Firestore transaction. Domain services should build on this primitive.
 */
export async function mutateSubject<T>(
  subjectId: string,
  mutate: Parameters<Firestore["runTransaction"]>[0] extends (
    transaction: infer TX,
  ) => Promise<unknown>
    ? (transaction: TX, currentRevision: number) => Promise<T>
    : never,
  event?: AuditEventInput,
): Promise<{ result: T; revision: number }> {
  const root = subjectRef(firestore, subjectId);

  return firestore.runTransaction(async (tx) => {
    const snapshot = await tx.get(root);
    if (!snapshot.exists) throw new Error(`Delivery Subject ${subjectId} not found`);

    const currentRevision = Number(snapshot.get("revision") ?? 0);
    const nextRevision = currentRevision + 1;
    const result = await mutate(tx as never, currentRevision);

    tx.update(root, {
      revision: nextRevision,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (event) {
      const eventRef = subjectCollection(firestore, subjectId, "events").doc();
      tx.create(eventRef, {
        ...event,
        domainRevision: nextRevision,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return { result, revision: nextRevision };
  });
}

export type AcquireThreadLeaseInput = {
  subjectId: string;
  threadId: string;
  leaseOwner: string;
  ttlMs?: number;
};

export async function acquireThreadLease({
  subjectId,
  threadId,
  leaseOwner,
  ttlMs = 120_000,
}: AcquireThreadLeaseInput): Promise<void> {
  const ref = subjectCollection(firestore, subjectId, "agentThreads").doc(threadId);

  await firestore.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    const now = Timestamp.now();
    const currentExpiry = snapshot.exists
      ? (snapshot.get("leaseExpiresAt") as Timestamp | undefined)
      : undefined;

    if (currentExpiry && currentExpiry.toMillis() > now.toMillis()) {
      throw new Error(`AgentThread ${threadId} is already running`);
    }

    tx.set(
      ref,
      {
        status: "RUNNING",
        leaseOwner,
        leaseExpiresAt: Timestamp.fromMillis(now.toMillis() + ttlMs),
        updatedAt: FieldValue.serverTimestamp(),
        ...(snapshot.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );
  });
}

export async function releaseThreadLease(
  subjectId: string,
  threadId: string,
  leaseOwner: string,
): Promise<void> {
  const ref = subjectCollection(firestore, subjectId, "agentThreads").doc(threadId);

  await firestore.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) return;
    if (snapshot.get("leaseOwner") !== leaseOwner) return;

    tx.update(ref, {
      status: "IDLE",
      leaseOwner: FieldValue.delete(),
      leaseExpiresAt: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
