import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const app =
  getApps()[0] ??
  initializeApp({
    credential: applicationDefault(),
  });

export const trustHandoffFirestore = getFirestore(app);

export const sourceAccessPoliciesCollection = (
  db: Firestore = trustHandoffFirestore,
) => db.collection("sourceAccessPolicies");

export const handoffPackagesCollection = (
  subjectId: string,
  db: Firestore = trustHandoffFirestore,
) => db.collection("deliverySubjects").doc(subjectId).collection("handoffPackages");
