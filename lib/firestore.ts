import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Judge {
  id: string;
  code: string;
  name: string;
  avatar?: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface Score {
  id: string;
  judgeId: string;
  teamId: string;
  score: number;
  createdAt: Timestamp | null;
}

// ─── Judges ──────────────────────────────────────────────────────────────────

export async function getJudgeByCode(code: string): Promise<Judge | null> {
  const judgesRef = collection(db, "judges");
  const q = query(judgesRef, where("code", "==", code.trim().toUpperCase()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Judge;
}

export async function getJudges(): Promise<Judge[]> {
  const snapshot = await getDocs(collection(db, "judges"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Judge);
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export async function getTeams(): Promise<Team[]> {
  const snapshot = await getDocs(collection(db, "teams"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Team);
}

// ─── Scores ──────────────────────────────────────────────────────────────────

/** Submit or overwrite a score. Document ID = judgeId_teamId (enforces unique). */
export async function submitScore(
  judgeId: string,
  teamId: string,
  score: number,
): Promise<void> {
  const docId = `${judgeId}_${teamId}`;
  await setDoc(doc(db, "scores", docId), {
    judgeId,
    teamId,
    score,
    createdAt: serverTimestamp(),
  });
}

/** Get score for a specific judge+team pair. */
export async function getScore(
  judgeId: string,
  teamId: string,
): Promise<Score | null> {
  const docId = `${judgeId}_${teamId}`;
  const docSnap = await getDoc(doc(db, "scores", docId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Score;
}

/** Subscribe real-time to all scores for a team. Returns unsubscribe fn. */
export function subscribeTeamScores(
  teamId: string,
  callback: (scores: Score[]) => void,
): Unsubscribe {
  const q = query(collection(db, "scores"), where("teamId", "==", teamId));
  return onSnapshot(q, (snapshot) => {
    const scores = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Score[];
    callback(scores);
  });
}

/** Subscribe real-time to ALL scores (all teams). Returns unsubscribe fn. */
export function subscribeAllScores(
  callback: (scores: Score[]) => void,
): Unsubscribe {
  return onSnapshot(collection(db, "scores"), (snapshot) => {
    const scores = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Score[];
    callback(scores);
  });
}
