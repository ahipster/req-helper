import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "./firestore.js";
import type { InboxTaskProjection } from "../domain/projections.js";

export const userInboxCollection = (userId: string) =>
  firestore.collection("users").doc(userId).collection("inbox");

/**
 * Backend-maintained read projection for My Work. The authoritative Task is
 * always the Delivery Subject task document; this projection is disposable and
 * can be rebuilt from authoritative state.
 */
export async function upsertInboxTask(
  projection: Omit<InboxTaskProjection, "updatedAt">,
): Promise<void> {
  await userInboxCollection(projection.userId).doc(projection.id).set(
    {
      ...projection,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function removeInboxTask(userId: string, projectionId: string): Promise<void> {
  await userInboxCollection(userId).doc(projectionId).delete();
}
