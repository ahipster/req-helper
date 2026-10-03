import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const app =
  getApps()[0] ??
  initializeApp({
    credential: applicationDefault(),
  });

export const architectureFirestore = getFirestore(app);

export const architectureSourcesCollection = (db: Firestore = architectureFirestore) =>
  db.collection("architectureSources");

export const architectureIngestionRunsCollection = (db: Firestore = architectureFirestore) =>
  db.collection("architectureIngestionRuns");

export const architectureBaselinesCollection = (db: Firestore = architectureFirestore) =>
  db.collection("architectureBaselines");

export const architectureBaselineCollection = (
  baselineId: string,
  name: "elements" | "relationships" | "views" | "ingestionFindings",
  db: Firestore = architectureFirestore,
) => architectureBaselinesCollection(db).doc(baselineId).collection(name);

export const subjectArchitectureCollection = (
  subjectId: string,
  name:
    | "architectureContext"
    | "architectureImpacts"
    | "architectureChangeProposals"
    | "workPackageImplementationTargets",
  db: Firestore = architectureFirestore,
) => db.collection("deliverySubjects").doc(subjectId).collection(name);

export const requirementProfileArchitecturePoliciesCollection = (
  profileId: string,
  profileVersion: number,
  db: Firestore = architectureFirestore,
) =>
  db
    .collection("requirementProfiles")
    .doc(profileId)
    .collection("versions")
    .doc(String(profileVersion))
    .collection("architecturePolicies");
