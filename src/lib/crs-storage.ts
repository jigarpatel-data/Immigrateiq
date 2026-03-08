/**
 * Firestore storage for CRS scores.
 * Paths: customers/{userId}/crsScore/current, customers/{userId}/crsScore/hypothetical
 */

import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import type { CrsInput, CrsOutput, EducationLevel, LanguageScores } from "@/lib/crs";

/** Sanitize input for Firestore: replace undefined with defaults (Firestore rejects undefined). */
function sanitizeInputForFirestore(input: CrsInput): CrsInput {
  const safeLang = (l: LanguageScores): LanguageScores => ({
    reading_clb: Number.isFinite(l.reading_clb) && l.reading_clb >= 0 ? l.reading_clb : 7,
    writing_clb: Number.isFinite(l.writing_clb) && l.writing_clb >= 0 ? l.writing_clb : 7,
    speaking_clb: Number.isFinite(l.speaking_clb) && l.speaking_clb >= 0 ? l.speaking_clb : 7,
    listening_clb: Number.isFinite(l.listening_clb) && l.listening_clb >= 0 ? l.listening_clb : 7,
  });
  const validEdu: EducationLevel[] = [
    "less_than_high_school", "high_school", "one_year_postsecondary", "two_year_postsecondary",
    "bachelor_or_3plus_year", "two_or_more_postsecondary", "masters_or_professional", "phd",
  ];
  const safeEdu = (e: unknown): EducationLevel =>
    typeof e === "string" && validEdu.includes(e as EducationLevel) ? e as EducationLevel : "bachelor_or_3plus_year";

  return {
    ...input,
    age: Number.isFinite(input.age) && input.age > 0 ? input.age : 30,
    education_level: safeEdu(input.education_level),
    first_official_language: safeLang(input.first_official_language),
    first_language_test_less_than_two_years: input.first_language_test_less_than_two_years ?? true,
    first_language_test_type: input.first_language_test_type ?? "ielts",
    second_official_language: input.second_official_language ?? null,
    canadian_work_experience_years: Number.isFinite(input.canadian_work_experience_years) && input.canadian_work_experience_years >= 0 ? input.canadian_work_experience_years : 0,
    foreign_work_experience_years: Number.isFinite(input.foreign_work_experience_years) && input.foreign_work_experience_years >= 0 ? input.foreign_work_experience_years : 0,
    spouse_is_canadian_pr_or_citizen: input.spouse_is_canadian_pr_or_citizen ?? false,
    spouse: input.spouse
      ? {
          education_level: safeEdu(input.spouse.education_level),
          first_official_language: safeLang(input.spouse.first_official_language),
          canadian_work_experience_years: Number.isFinite(input.spouse.canadian_work_experience_years) && input.spouse.canadian_work_experience_years >= 0 ? input.spouse.canadian_work_experience_years : 0,
        }
      : null,
    has_valid_job_offer: input.has_valid_job_offer ?? false,
    french: {
      nclc_reading: Number.isFinite(input.french?.nclc_reading) ? input.french.nclc_reading : 0,
      nclc_writing: Number.isFinite(input.french?.nclc_writing) ? input.french.nclc_writing : 0,
      nclc_speaking: Number.isFinite(input.french?.nclc_speaking) ? input.french.nclc_speaking : 0,
      nclc_listening: Number.isFinite(input.french?.nclc_listening) ? input.french.nclc_listening : 0,
    },
    education_in_canada: {
      has_credential: input.education_in_canada?.has_credential ?? false,
      years_of_study: Number.isFinite(input.education_in_canada?.years_of_study) ? input.education_in_canada.years_of_study : 0,
    },
  };
}

export type CrsScoreDocument = {
  input: CrsInput;
  result: CrsOutput;
  updatedAt: Timestamp | null;
  /** Optional: language test scores used (e.g. "L:8 R:7 S:6 W:8" for IELTS) */
  languageScoreLabel?: string;
};

const CRS_DOC_ID_CURRENT = "current";
const CRS_DOC_ID_HYPOTHETICAL = "hypothetical";

export async function saveCrsScore(
  userId: string,
  input: CrsInput,
  result: CrsOutput
): Promise<{ error: string | null }> {
  if (!db) return { error: "Database not configured" };

  try {
    const docRef = doc(db, "customers", userId, "crsScore", CRS_DOC_ID_CURRENT);
    const sanitizedInput = sanitizeInputForFirestore(input);
    await setDoc(docRef, {
      input: sanitizedInput,
      result,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save CRS score";
    return { error: message };
  }
}

/** Save hypothetical CRS score (from Advanced section) to separate document. Does not overwrite current score. */
export async function saveHypotheticalCrsScore(
  userId: string,
  input: CrsInput,
  result: CrsOutput,
  languageScoreLabel: string
): Promise<{ error: string | null }> {
  if (!db) return { error: "Database not configured" };

  try {
    const docRef = doc(db, "customers", userId, "crsScore", CRS_DOC_ID_HYPOTHETICAL);
    const sanitizedInput = sanitizeInputForFirestore(input);
    await setDoc(docRef, {
      input: sanitizedInput,
      result,
      updatedAt: serverTimestamp(),
      languageScoreLabel,
    });
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save hypothetical CRS score";
    return { error: message };
  }
}

export async function getCrsScore(
  userId: string
): Promise<{ data: CrsScoreDocument | null; error: string | null }> {
  if (!db) return { data: null, error: "Database not configured" };

  try {
    const docRef = doc(db, "customers", userId, "crsScore", CRS_DOC_ID_CURRENT);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return { data: null, error: null };
    return { data: snapshot.data() as CrsScoreDocument, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load CRS score";
    return { data: null, error: message };
  }
}

export function subscribeCrsScore(
  userId: string,
  callback: (data: CrsScoreDocument | null) => void
): () => void {
  if (!db) {
    callback(null);
    return () => {};
  }

  const docRef = doc(db, "customers", userId, "crsScore", CRS_DOC_ID_CURRENT);
  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      callback(snapshot.data() as CrsScoreDocument);
    },
    () => callback(null)
  );
  return unsubscribe;
}

export function subscribeHypotheticalCrsScore(
  userId: string,
  callback: (data: CrsScoreDocument | null) => void
): () => void {
  if (!db) {
    callback(null);
    return () => {};
  }

  const docRef = doc(db, "customers", userId, "crsScore", CRS_DOC_ID_HYPOTHETICAL);
  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      callback(snapshot.data() as CrsScoreDocument);
    },
    () => callback(null)
  );
  return unsubscribe;
}
