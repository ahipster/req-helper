import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";

const app =
  getApps()[0] ??
  initializeApp({
    credential: applicationDefault(),
  });

export const firestore = getFirestore(app);

export const usersCollection = (db: Firestore = firestore) => db.collection("users");
export const roleTemplatesCollection = (db: Firestore = firestore) => db.collection("roleTemplates");
export const perspectiveTemplatesCollection = (db: Firestore = firestore) =>
  db.collection("perspectiveTemplates");

// Shared reference/configuration data. Browser writes remain disabled by rules;
// publishing/promoting versions must go through backend application services.
export const requirementProfilesCollection = (db: Firestore = firestore) =>
  db.collection("requirementProfiles");
export const requirementProfileVersionsCollection = (
  profileId: string,
  db: Firestore = firestore,
) => requirementProfilesCollection(db).doc(profileId).collection("versions");

export const requirementCatalogCollection = (db: Firestore = firestore) =>
  db.collection("requirementCatalog");
export const requirementCatalogVersionsCollection = (
  requirementId: string,
  db: Firestore = firestore,
) => requirementCatalogCollection(db).doc(requirementId).collection("versions");

/**
 * Non-authoritative realtime projection used by My Work. The application
 * service must upsert/delete these items whenever task assignment/status or
 * Delivery Subject membership changes.
 */
export const userTaskInboxCollection = (
  userId: string,
  db: Firestore = firestore,
) => usersCollection(db).doc(userId).collection("taskInbox");

export const taskInboxItemRef = (
  userId: string,
  itemId: string,
  db: Firestore = firestore,
) => userTaskInboxCollection(userId, db).doc(itemId);

export type TaskInboxProjectionInput = {
  id: string;
  userId: string;
  deliverySubjectId: string;
  taskId: string;
  subjectTitle: string;
  perspectiveId?: string;
  type: string;
  title: string;
  blocking: boolean;
  status: string;
};

/**
 * Use from the same Firestore transaction that changes an authoritative Task
 * whenever practical. The projection is never read back to make domain
 * decisions.
 */
export function upsertTaskInboxItemInTransaction(
  tx: Transaction,
  item: TaskInboxProjectionInput,
): void {
  tx.set(
    taskInboxItemRef(item.userId, item.id),
    {
      ...item,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export function deleteTaskInboxItemInTransaction(
  tx: Transaction,
  userId: string,
  itemId: string,
): void {
  tx.delete(taskInboxItemRef(userId, itemId));
}

/**
 * Membership removal/deactivation must remove subject-specific inbox entries.
 * PoC batches are intentionally bounded below Firestore's write-batch limit.
 */
export async function deleteSubjectTaskInboxItems(
  userId: string,
  subjectId: string,
): Promise<number> {
  let deleted = 0;

  for (;;) {
    const snapshot = await userTaskInboxCollection(userId)
      .where("deliverySubjectId", "==", subjectId)
      .limit(400)
      .get();

    if (snapshot.empty) return deleted;

    const batch = firestore.batch();
    for (const doc of snapshot.docs) batch.delete(doc.ref);
    await batch.commit();
    deleted += snapshot.size;
  }
}

export const subjectRef = (db: Firestore, subjectId: string) =>
  db.collection("deliverySubjects").doc(subjectId);

export const subjectCollection = (
  db: Firestore,
  subjectId: string,
  name:
    | "members"
    | "sourceArtifacts"
    | "perspectives"
    | "assignments"
    | "tasks"
    | "contributions"
    | "evidence"
    | "verifications"
    | "knowledgeRefs"
    | "proposedDiffs"
    | "requirements"
    | "requirementRevisions"
    | "requirementChangeProposals"
    | "requirementMatches"
    | "requirementQualityFindings"
    | "requirementSources"
    | "gaps"
    | "conflicts"
    | "assumptions"
    | "decisions"
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

export async function mutateSubject<T>(
  subjectId: string,
  mutate: (transaction: Transaction, currentRevision: number) => Promise<T>,
  event?: AuditEventInput,
): Promise<{ result: T; revision: number }> {
  const root = subjectRef(firestore, subjectId);

  return firestore.runTransaction(async (tx) => {
    const snapshot = await tx.get(root);
    if (!snapshot.exists) throw new Error(`Delivery Subject ${subjectId} not found`);

    const currentRevision = Number(snapshot.get("revision") ?? 0);
    const nextRevision = currentRevision + 1;
    const result = await mutate(tx, currentRevision);

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
        sessionGeneration: snapshot.exists ? Number(snapshot.get("sessionGeneration") ?? 0) : 0,
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

export type UpdateThreadSessionInput = {
  subjectId: string;
  threadId: string;
  opencodeSessionId: string;
  sessionGeneration: number;
};

export async function updateThreadSession({
  subjectId,
  threadId,
  opencodeSessionId,
  sessionGeneration,
}: UpdateThreadSessionInput): Promise<void> {
  const ref = subjectCollection(firestore, subjectId, "agentThreads").doc(threadId);
  await ref.set(
    {
      opencodeSessionId,
      sessionGeneration,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Records only the highest Delivery Subject revision that was actually
 * presented to the OpenCode session as authoritative context.
 *
 * Do not pass domainRevisionAtEnd unless those end-of-run mutations were also
 * explicitly re-presented to the session after commit.
 */
export async function markThreadContextPresented(
  subjectId: string,
  threadId: string,
  contextRevisionPresented: number,
  runId: string,
): Promise<void> {
  const ref = subjectCollection(firestore, subjectId, "agentThreads").doc(threadId);
  await ref.set(
    {
      contextRevisionPresented,
      lastRunId: runId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export type PersistMessageInput = {
  subjectId: string;
  threadId: string;
  runId?: string;
  actorType: "HUMAN" | "ASSISTANT" | "SYSTEM" | "TOOL";
  actorId?: string;
  content: string;
  relatedObjectIds?: string[];
};

export async function persistThreadMessage(input: PersistMessageInput): Promise<string> {
  const ref = subjectCollection(firestore, input.subjectId, "messages").doc();
  await ref.create({
    threadId: input.threadId,
    runId: input.runId,
    actorType: input.actorType,
    actorId: input.actorId,
    content: input.content,
    relatedObjectIds: input.relatedObjectIds ?? [],
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}
