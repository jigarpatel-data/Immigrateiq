"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calculator, Loader2, AlertCircle, ChevronDown, Save } from "lucide-react";
import {
  calculateCrs,
  type CrsInput,
  type CrsOutput,
  type EducationLevel,
  type LanguageScores,
} from "@/lib/crs";
import { saveCrsScore, saveHypotheticalCrsScore } from "@/lib/crs-storage";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const EDUCATION_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: "less_than_high_school", label: "None, or less than secondary (high school)" },
  { value: "high_school", label: "Secondary diploma (high school graduation)" },
  { value: "one_year_postsecondary", label: "One-year program at a university, college, trade or technical school, or other institute" },
  { value: "two_year_postsecondary", label: "Two-year program at a university, college, trade or technical school, or other institute" },
  { value: "bachelor_or_3plus_year", label: "Bachelor's degree (three or more year program at a university, college, trade or technical school, or other institute)" },
  { value: "two_or_more_postsecondary", label: "Two or more certificates, diplomas or degrees. One must be for a program of three or more years" },
  { value: "masters_or_professional", label: "Master's degree, or professional degree needed to practice in a licensed profession (see Help)" },
  { value: "phd", label: "Doctoral level university degree (PhD)" },
];

const CLB_OPTIONS = [
  { value: 0, label: "Less than CLB 4" },
  { value: 4, label: "CLB 4 or 5" },
  { value: 6, label: "CLB 6" },
  { value: 7, label: "CLB 7" },
  { value: 8, label: "CLB 8" },
  { value: 9, label: "CLB 9" },
  { value: 10, label: "CLB 10 or more" },
];

const CLB_SECOND_LANG_OPTIONS = [
  { value: 0, label: "CLB 4 or less" },
  { value: 5, label: "CLB 5 or 6" },
  { value: 7, label: "CLB 7 or 8" },
  { value: 9, label: "CLB 9 or more" },
];

/** CLB options for score variation simulator (4–10) */
const CLB_SIMULATOR_OPTIONS = [4, 5, 6, 7, 8, 9, 10].map((v) => ({
  value: v,
  label: v === 10 ? "CLB 10+" : `CLB ${v}`,
}));

type TestScores = { speaking: number; listening: number; reading: number; writing: number };

/** Convert test scores to CLB based on test type */
function testScoresToClb(
  testType: string,
  scores: TestScores
): LanguageScores {
  if (testType === "ielts") {
    return {
      speaking_clb: ieltsToClb("speaking", scores.speaking),
      listening_clb: ieltsToClb("listening", scores.listening),
      reading_clb: ieltsToClb("reading", scores.reading),
      writing_clb: ieltsToClb("writing", scores.writing),
    };
  }
  if (testType === "celpip_g") {
    return {
      speaking_clb: celpipToClb(scores.speaking),
      listening_clb: celpipToClb(scores.listening),
      reading_clb: celpipToClb(scores.reading),
      writing_clb: celpipToClb(scores.writing),
    };
  }
  if (testType === "pte_core") {
    return {
      speaking_clb: pteToClb("speaking", scores.speaking),
      listening_clb: pteToClb("listening", scores.listening),
      reading_clb: pteToClb("reading", scores.reading),
      writing_clb: pteToClb("writing", scores.writing),
    };
  }
  if (testType === "tef_canada") {
    return {
      speaking_clb: tefToNclc("speaking", scores.speaking),
      listening_clb: tefToNclc("listening", scores.listening),
      reading_clb: tefToNclc("reading", scores.reading),
      writing_clb: tefToNclc("writing", scores.writing),
    };
  }
  if (testType === "tcf_canada") {
    return {
      speaking_clb: tcfToNclc("speaking", scores.speaking),
      listening_clb: tcfToNclc("listening", scores.listening),
      reading_clb: tcfToNclc("reading", scores.reading),
      writing_clb: tcfToNclc("writing", scores.writing),
    };
  }
  return {
    speaking_clb: scores.speaking,
    listening_clb: scores.listening,
    reading_clb: scores.reading,
    writing_clb: scores.writing,
  };
}

/** Get representative test scores for a given CLB (for preset buttons). Uses minimum band/score per IRCC tables. */
function getTestScoresForClb(
  testType: string,
  clb: number
): TestScores {
  if (testType === "ielts") {
    const byMod: Record<number, TestScores> = {
      4: { speaking: 4, listening: 4, reading: 4, writing: 4 },
      5: { speaking: 5, listening: 5, reading: 4, writing: 5 },
      6: { speaking: 5.5, listening: 5.5, reading: 5, writing: 5.5 },
      7: { speaking: 6, listening: 6, reading: 6, writing: 6 },
      8: { speaking: 6.5, listening: 7.5, reading: 6.5, writing: 6.5 },
      9: { speaking: 7, listening: 8, reading: 7, writing: 7 },
      10: { speaking: 7.5, listening: 8.5, reading: 8, writing: 7.5 },
    };
    return byMod[clb] ?? byMod[7];
  }
  if (testType === "celpip_g") {
    const s = Math.min(Math.max(clb, 5), 12);
    return { speaking: s, listening: s, reading: s, writing: s };
  }
  if (testType === "pte_core") {
    const byMod: Record<number, TestScores> = {
      4: { speaking: 39, listening: 39, reading: 42, writing: 39 },
      5: { speaking: 51, listening: 39, reading: 42, writing: 51 },
      6: { speaking: 59, listening: 50, reading: 51, writing: 60 },
      7: { speaking: 68, listening: 60, reading: 60, writing: 69 },
      8: { speaking: 76, listening: 71, reading: 69, writing: 79 },
      9: { speaking: 84, listening: 82, reading: 78, writing: 88 },
      10: { speaking: 89, listening: 89, reading: 88, writing: 90 },
    };
    return byMod[clb] ?? byMod[7];
  }
  if (testType === "tef_canada") {
    const byMod: Record<number, TestScores> = {
      5: { speaking: 226, listening: 181, reading: 151, writing: 226 },
      6: { speaking: 271, listening: 217, reading: 181, writing: 271 },
      7: { speaking: 310, listening: 249, reading: 207, writing: 310 },
      8: { speaking: 349, listening: 280, reading: 233, writing: 349 },
      9: { speaking: 371, listening: 298, reading: 248, writing: 371 },
      10: { speaking: 371, listening: 298, reading: 248, writing: 371 },
    };
    return byMod[clb] ?? byMod[7];
  }
  if (testType === "tcf_canada") {
    const byMod: Record<number, TestScores> = {
      5: { speaking: 6, listening: 369, reading: 375, writing: 6 },
      6: { speaking: 7, listening: 398, reading: 406, writing: 7 },
      7: { speaking: 10, listening: 458, reading: 453, writing: 10 },
      8: { speaking: 12, listening: 503, reading: 499, writing: 12 },
      9: { speaking: 14, listening: 523, reading: 524, writing: 14 },
      10: { speaking: 16, listening: 549, reading: 549, writing: 16 },
    };
    return byMod[clb] ?? byMod[7];
  }
  return { speaking: clb, listening: clb, reading: clb, writing: clb };
}

const MARITAL_STATUS_OPTIONS = [
  { value: "never_married", label: "Never Married / Single", hasSpouse: false },
  { value: "married", label: "Married", hasSpouse: true },
  { value: "common_law", label: "Common-Law", hasSpouse: true },
  { value: "divorced", label: "Divorced / Separated", hasSpouse: false },
  { value: "legally_separated", label: "Legally Separated", hasSpouse: false },
  { value: "widowed", label: "Widowed", hasSpouse: false },
  { value: "annulled", label: "Annulled Marriage", hasSpouse: false },
];

const AGE_OPTIONS = [
  { value: 17, label: "17 years of age or less" },
  { value: 18, label: "18 years of age" },
  { value: 19, label: "19 years of age" },
  ...Array.from({ length: 25 }, (_, i) => ({
    value: 20 + i,
    label: `${20 + i} years of age`,
  })),
  { value: 45, label: "45 years of age or more" },
];

const CANADIAN_WORK_OPTIONS = [
  { value: 0, label: "None or less than a year" },
  { value: 1, label: "1 year" },
  { value: 2, label: "2 years" },
  { value: 3, label: "3 years" },
  { value: 4, label: "4 years" },
  { value: 5, label: "5 years or more" },
];

const FOREIGN_WORK_OPTIONS = [
  { value: 0, label: "None or less than a year" },
  { value: 1, label: "1 year" },
  { value: 2, label: "2 years" },
  { value: 3, label: "3 years or more" },
];

const EDUCATION_IN_CANADA_LEVEL_OPTIONS: Record<string, string> = {
  secondary: "Secondary (high school) or less",
  one_two_year: "One- or two-year diploma or certificate",
  three_plus_year: "Degree, diploma or certificate of three years or longer OR Master's/professional/doctoral degree",
};

const LANGUAGE_TEST_OPTIONS: Record<string, string> = {
  celpip_g: "CELPIP-G",
  ielts: "IELTS",
  pte_core: "PTE Core",
  tef_canada: "TEF Canada",
  tcf_canada: "TCF Canada",
};

const defaultLanguageScores = (clb: number): LanguageScores => ({
  reading_clb: clb,
  writing_clb: clb,
  speaking_clb: clb,
  listening_clb: clb,
});

/** IELTS band scores 4.0–9.0 in 0.5 increments */
const IELTS_BAND_OPTIONS = Array.from({ length: 11 }, (_, i) => {
  const band = 4 + i * 0.5;
  return { value: band, label: band.toString() };
});

/** Convert IELTS module score to CLB per IRCC table */
function ieltsToClb(module: "speaking" | "listening" | "reading" | "writing", band: number): number {
  if (!Number.isFinite(band) || band < 4) return 4;
  const tables = {
    speaking: [
      [10, 7.5], [9, 7], [8, 6.5], [7, 6], [6, 5.5], [5, 5],
    ] as [number, number][],
    listening: [
      [10, 8.5], [9, 8], [8, 7.5], [7, 6], [6, 5.5], [5, 5],
    ] as [number, number][],
    reading: [
      [10, 8], [9, 7], [8, 6.5], [7, 6], [6, 5], [5, 4],
    ] as [number, number][],
    writing: [
      [10, 7.5], [9, 7], [8, 6.5], [7, 6], [6, 5.5], [5, 5],
    ] as [number, number][],
  };
  const t = tables[module];
  for (const [clb, minBand] of t) {
    if (band >= minBand) return clb;
  }
  return 4;
}

/** CELPIP: 1:1 with CLB for 5–8; 9+ = CLB 9+ */
const CELPIP_OPTIONS = [5, 6, 7, 8, 9, 10, 11, 12].map((v) => ({ value: v, label: v === 12 ? "12 (9+)" : String(v) }));
function celpipToClb(score: number): number {
  if (!Number.isFinite(score) || score < 5) return 4;
  return Math.min(score, 10);
}

/** PTE Core: convert module score to CLB per IRCC table */
const PTE_OPTIONS = Array.from({ length: 52 }, (_, i) => ({ value: 39 + i, label: String(39 + i) }));
function pteToClb(module: "speaking" | "listening" | "reading" | "writing", score: number): number {
  if (!Number.isFinite(score) || score < 39) return 4;
  const tables = {
    speaking: [[10, 89], [9, 84], [8, 76], [7, 68], [6, 59], [5, 51]] as [number, number][],
    listening: [[10, 89], [9, 82], [8, 71], [7, 60], [6, 50], [5, 39]] as [number, number][],
    reading: [[10, 88], [9, 78], [8, 69], [7, 60], [6, 51], [5, 42]] as [number, number][],
    writing: [[10, 90], [9, 88], [8, 79], [7, 69], [6, 60], [5, 51]] as [number, number][],
  };
  const t = tables[module];
  for (const [clb, minScore] of t) {
    if (score >= minScore) return clb;
  }
  return 4;
}

/** TEF Canada: range options per IRCC table. Value = min of range for conversion. */
const TEF_SPEAKING_OPTIONS = [
  { value: 371, label: "371+ (NCLC 9+)" },
  { value: 349, label: "349-370 (NCLC 8)" },
  { value: 310, label: "310-348 (NCLC 7)" },
  { value: 271, label: "271-309 (NCLC 6)" },
  { value: 226, label: "226-270 (NCLC 5)" },
];
const TEF_LISTENING_OPTIONS = [
  { value: 298, label: "298+ (NCLC 9+)" },
  { value: 280, label: "280-297 (NCLC 8)" },
  { value: 249, label: "249-279 (NCLC 7)" },
  { value: 217, label: "217-248 (NCLC 6)" },
  { value: 181, label: "181-216 (NCLC 5)" },
];
const TEF_READING_OPTIONS = [
  { value: 248, label: "248+ (NCLC 9+)" },
  { value: 233, label: "233-247 (NCLC 8)" },
  { value: 207, label: "207-232 (NCLC 7)" },
  { value: 181, label: "181-206 (NCLC 6)" },
  { value: 151, label: "151-180 (NCLC 5)" },
];
const TEF_WRITING_OPTIONS = [
  { value: 371, label: "371+ (NCLC 9+)" },
  { value: 349, label: "349-370 (NCLC 8)" },
  { value: 310, label: "310-348 (NCLC 7)" },
  { value: 271, label: "271-309 (NCLC 6)" },
  { value: 226, label: "226-270 (NCLC 5)" },
];
function tefToNclc(module: "speaking" | "listening" | "reading" | "writing", score: number): number {
  if (!Number.isFinite(score)) return 4;
  const tables = {
    speaking: [[9, 371], [8, 349], [7, 310], [6, 271], [5, 226]] as [number, number][],
    listening: [[9, 298], [8, 280], [7, 249], [6, 217], [5, 181]] as [number, number][],
    reading: [[9, 248], [8, 233], [7, 207], [6, 181], [5, 151]] as [number, number][],
    writing: [[9, 371], [8, 349], [7, 310], [6, 271], [5, 226]] as [number, number][],
  };
  const t = tables[module];
  for (const [nclc, minScore] of t) {
    if (score >= minScore) return nclc;
  }
  return 4;
}

/** TCF Canada: range options per IRCC table. Value = min of range for conversion. */
const TCF_SW_OPTIONS = [
  { value: 16, label: "16-20 (NCLC 10+)" },
  { value: 14, label: "14-15 (NCLC 9)" },
  { value: 12, label: "12-13 (NCLC 8)" },
  { value: 10, label: "10-11 (NCLC 7)" },
  { value: 7, label: "7-9 (NCLC 6)" },
  { value: 6, label: "6 (NCLC 5)" },
];
const TCF_LISTENING_OPTIONS = [
  { value: 549, label: "549-699 (NCLC 10+)" },
  { value: 523, label: "523-548 (NCLC 9)" },
  { value: 503, label: "503-522 (NCLC 8)" },
  { value: 458, label: "458-502 (NCLC 7)" },
  { value: 398, label: "398-457 (NCLC 6)" },
  { value: 369, label: "369-397 (NCLC 5)" },
];
const TCF_READING_OPTIONS = [
  { value: 549, label: "549-699 (NCLC 10+)" },
  { value: 524, label: "524-548 (NCLC 9)" },
  { value: 499, label: "499-523 (NCLC 8)" },
  { value: 453, label: "453-498 (NCLC 7)" },
  { value: 406, label: "406-452 (NCLC 6)" },
  { value: 375, label: "375-405 (NCLC 5)" },
];
function tcfToNclc(module: "speaking" | "listening" | "reading" | "writing", score: number): number {
  if (!Number.isFinite(score)) return 4;
  if (module === "speaking" || module === "writing") {
    const t: [number, number][] = [[10, 16], [9, 14], [8, 12], [7, 10], [6, 7], [5, 6]];
    for (const [nclc, minScore] of t) {
      if (score >= minScore) return nclc;
    }
    return 4;
  }
  if (module === "listening") {
    const t: [number, number][] = [[10, 549], [9, 523], [8, 503], [7, 458], [6, 398], [5, 369]];
    for (const [nclc, minScore] of t) {
      if (score >= minScore) return nclc;
    }
    return 4;
  }
  const t: [number, number][] = [[10, 549], [9, 524], [8, 499], [7, 453], [6, 406], [5, 375]];
  for (const [nclc, minScore] of t) {
    if (score >= minScore) return nclc;
  }
  return 4;
}

const AGE_SELECT = 0;
const CLB_SELECT = -1;
const WORK_SELECT = -1;

const defaultCrsInput: CrsInput = {
  has_spouse: false,
  age: AGE_SELECT,
  education_level: "select" as unknown as EducationLevel,
  first_official_language: defaultLanguageScores(CLB_SELECT),
  second_official_language: null,
  canadian_work_experience_years: WORK_SELECT,
  foreign_work_experience_years: WORK_SELECT,
  spouse: null,
  has_trade_certificate_of_qualification: false,
  has_sibling_in_canada: false,
  french: {
    nclc_reading: 0,
    nclc_writing: 0,
    nclc_speaking: 0,
    nclc_listening: 0,
  },
  education_in_canada: {
    has_credential: false,
    years_of_study: 0,
  },
  has_provincial_nomination: false,
};

type StepId =
  | "marital"
  | "spouse_canadian"
  | "spouse_coming"
  | "age"
  | "education"
  | "education_in_canada"
  | "education_in_canada_level"
  | "spouse_factors"
  | "first_lang_recent"
  | "first_lang_test"
  | "first_lang_clb"
  | "first_lang_ielts"
  | "first_lang_celpip"
  | "first_lang_pte"
  | "first_lang_tef"
  | "first_lang_tcf"
  | "second_lang_test"
  | "second_lang_ielts"
  | "second_lang_celpip"
  | "second_lang_pte"
  | "second_lang_tef"
  | "second_lang_tcf"
  | "second_lang_clb"
  | "canadian_work"
  | "foreign_work"
  | "trade_certificate"
  | "job_offer"
  | "nomination"
  | "sibling";

export default function CrsCalculatorPage() {
  const [input, setInput] = useState<CrsInput>(defaultCrsInput);
  const [maritalStatus, setMaritalStatus] = useState("");
  const [spouseCanadian, setSpouseCanadian] = useState<boolean | null>(null);
  const [spouseComing, setSpouseComing] = useState<boolean | null>(null);
  const [educationInCanadaAnswer, setEducationInCanadaAnswer] = useState<"select" | "yes" | "no">("select");
  const [educationInCanadaLevel, setEducationInCanadaLevel] = useState<"select" | "secondary" | "one_two_year" | "three_plus_year">("select");
  const [firstLangTestRecent, setFirstLangTestRecent] = useState<"select" | "yes" | "no">("select");
  const [firstLangTestType, setFirstLangTestType] = useState<"select" | "celpip_g" | "ielts" | "pte_core" | "tef_canada" | "tcf_canada">("select");
  const [ieltsScores, setIeltsScores] = useState<{ speaking: number; listening: number; reading: number; writing: number } | null>(null);
  const [celpipScores, setCelpipScores] = useState<{ speaking: number; listening: number; reading: number; writing: number } | null>(null);
  const [pteScores, setPteScores] = useState<{ speaking: number; listening: number; reading: number; writing: number } | null>(null);
  const [tefScores, setTefScores] = useState<{ speaking: number; listening: number; reading: number; writing: number } | null>(null);
  const [tcfScores, setTcfScores] = useState<{ speaking: number; listening: number; reading: number; writing: number } | null>(null);
  const [secondLangTestType, setSecondLangTestType] = useState<"select" | "celpip_g" | "ielts" | "pte_core" | "tef_canada" | "tcf_canada" | "not_applicable">("select");
  const [secondIeltsScores, setSecondIeltsScores] = useState<TestScores | null>(null);
  const [secondCelpipScores, setSecondCelpipScores] = useState<TestScores | null>(null);
  const [secondPteScores, setSecondPteScores] = useState<TestScores | null>(null);
  const [secondTefScores, setSecondTefScores] = useState<TestScores | null>(null);
  const [secondTcfScores, setSecondTcfScores] = useState<TestScores | null>(null);
  const [hypotheticalTestScores, setHypotheticalTestScores] = useState<TestScores | null>(null);
  const [tradeCertificateAnswer, setTradeCertificateAnswer] = useState<"select" | "yes" | "no">("select");
  const [jobOfferAnswer, setJobOfferAnswer] = useState<"select" | "yes" | "no">("select");
  const [nominationAnswer, setNominationAnswer] = useState<"select" | "yes" | "no">("select");
  const [siblingAnswer, setSiblingAnswer] = useState<"select" | "yes" | "no">("select");
  const [stepIndex, setStepIndex] = useState(0);
  const [answeredStepIndex, setAnsweredStepIndex] = useState(-1);
  const [result, setResult] = useState<CrsOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const visibleSteps = useMemo((): StepId[] => {
    const steps: StepId[] = ["marital"];
    if (input.has_spouse) {
      steps.push("spouse_canadian");
      if (spouseCanadian === false) steps.push("spouse_coming");
    }
    steps.push("age");
    steps.push("education");
    steps.push("education_in_canada");
    if (educationInCanadaAnswer === "yes") steps.push("education_in_canada_level");
    steps.push("first_lang_recent");
    if (firstLangTestRecent === "yes") steps.push("first_lang_test");
    if (firstLangTestType === "ielts") steps.push("first_lang_ielts");
    else if (firstLangTestType === "celpip_g") steps.push("first_lang_celpip");
    else if (firstLangTestType === "pte_core") steps.push("first_lang_pte");
    else if (firstLangTestType === "tef_canada") steps.push("first_lang_tef");
    else if (firstLangTestType === "tcf_canada") steps.push("first_lang_tcf");
    else if (firstLangTestType !== "select") steps.push("first_lang_clb");
    if (firstLangTestType !== "select") steps.push("second_lang_test");
    if (secondLangTestType === "ielts") steps.push("second_lang_ielts");
    else if (secondLangTestType === "celpip_g") steps.push("second_lang_celpip");
    else if (secondLangTestType === "pte_core") steps.push("second_lang_pte");
    else if (secondLangTestType === "tef_canada") steps.push("second_lang_tef");
    else if (secondLangTestType === "tcf_canada") steps.push("second_lang_tcf");
    else if (secondLangTestType !== "select" && secondLangTestType !== "not_applicable") steps.push("second_lang_clb");
    steps.push("canadian_work");
    steps.push("foreign_work");
    steps.push("trade_certificate");
    steps.push("job_offer");
    steps.push("nomination");
    steps.push("sibling");
    if (input.spouse) steps.push("spouse_factors");
    return steps;
  }, [
    input.has_spouse,
    input.spouse,
    spouseCanadian,
    spouseComing,
    educationInCanadaAnswer,
    firstLangTestRecent,
    firstLangTestType,
    secondLangTestType,
  ]);

  const prevStepsLengthRef = useRef(visibleSteps.length);
  const lastSanitizedInputRef = useRef<CrsInput | null>(null);

  useEffect(() => {
    const newLength = visibleSteps.length;
    const prevLength = prevStepsLengthRef.current;
    prevStepsLengthRef.current = newLength;

    const maxIdx = Math.max(0, newLength - 1);

    setStepIndex((prev) => {
      if (newLength > prevLength) {
        // Steps added (e.g. conditional 4c appeared): show all steps so other answers stay visible
        return maxIdx;
      }
      // Steps removed: clamp to valid range
      return Math.min(prev, maxIdx);
    });

    setAnsweredStepIndex((prev) => {
      // Only clamp when steps removed; never set answeredStepIndex when steps are added
      if (newLength <= prevLength) {
        return Math.min(prev, maxIdx);
      }
      return prev;
    });
  }, [visibleSteps.length]);

  const updateInput = (partial: Partial<CrsInput>) => {
    setInput((prev) => ({ ...prev, ...partial }));
    setResult(null);
    setError(null);
  };

  const handleCalculate = () => {
    setLoading(true);
    setError(null);
    setResult(null);

    requestAnimationFrame(() => {
      try {
        const sanitized: CrsInput = {
          ...input,
          age: input.age === AGE_SELECT ? 30 : input.age,
          education_level: (input.education_level as string) === "select" ? "bachelor_or_3plus_year" : input.education_level,
          first_official_language:
            input.first_official_language.reading_clb === CLB_SELECT
              ? defaultLanguageScores(7)
              : input.first_official_language,
          canadian_work_experience_years: input.canadian_work_experience_years === WORK_SELECT ? 0 : input.canadian_work_experience_years,
          foreign_work_experience_years: input.foreign_work_experience_years === WORK_SELECT ? 0 : input.foreign_work_experience_years,
          spouse: input.spouse
            ? {
                ...input.spouse,
                education_level: (input.spouse.education_level as string) === "select" ? "bachelor_or_3plus_year" : input.spouse.education_level,
                first_official_language:
                  input.spouse.first_official_language.reading_clb === CLB_SELECT
                    ? defaultLanguageScores(7)
                    : input.spouse.first_official_language,
                canadian_work_experience_years:
                  input.spouse.canadian_work_experience_years === WORK_SELECT ? 0 : input.spouse.canadian_work_experience_years,
              }
            : input.spouse,
        };
        const output = calculateCrs(sanitized);
        lastSanitizedInputRef.current = sanitized;
        setResult(output);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to calculate CRS");
      } finally {
        setLoading(false);
      }
    });
  };

  const handleStepChange = (stepId: StepId) => {
    const idx = visibleSteps.indexOf(stepId);
    if (idx < 0) return;
    if (idx < stepIndex) {
      // Editing a previous step: don't rewind—keep stepIndex at least current, or at length so new conditional steps (e.g. 4c) stay visible
      setStepIndex((i) => Math.max(idx + 1, i, visibleSteps.length));
      setAnsweredStepIndex((prev) => Math.max(prev, idx));
    } else if (idx === stepIndex) {
      // Answering current step: advance to next
      setStepIndex((i) => Math.min(i + 1, visibleSteps.length - 1));
      setAnsweredStepIndex((prev) => Math.max(prev, idx));
    }
  };

  const StepFormContent = ({ formStepId }: { formStepId: StepId }) => {
    const step = formStepId;
    return (
      <>
        {step === "marital" && (
          <div className="space-y-4">
            <Label htmlFor="marital_status" className="text-lg font-semibold text-primary block leading-relaxed">
              1) What is your marital status?
            </Label>
            <Select
              value={maritalStatus}
              onValueChange={(v) => {
                setMaritalStatus(v);
                const option = MARITAL_STATUS_OPTIONS.find((o) => o.value === v);
                const hasSpouse = option?.hasSpouse ?? false;
                if (!hasSpouse) {
                  setSpouseCanadian(null);
                  setSpouseComing(null);
                }
                updateInput({
                  has_spouse: hasSpouse,
                  spouse_is_canadian_pr_or_citizen: undefined,
                  spouse: hasSpouse
                    ? {
                        education_level: "select" as unknown as EducationLevel,
                        first_official_language: defaultLanguageScores(CLB_SELECT),
                        canadian_work_experience_years: WORK_SELECT,
                      }
                    : null,
                });
                handleStepChange("marital");
              }}
            >
              <SelectTrigger id="marital_status" className="mt-1 h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {MARITAL_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "spouse_canadian" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              2) Is your spouse or common-law partner a citizen or permanent resident of Canada?
            </Label>
            <RadioGroup
              value={spouseCanadian === null ? "" : spouseCanadian ? "yes" : "no"}
              onValueChange={(v) => {
                const val = v === "yes";
                setSpouseCanadian(val);
                if (val) setSpouseComing(null); // Clear spouse_coming when spouse is Canadian PR/citizen
                updateInput({
                  spouse_is_canadian_pr_or_citizen: val,
                  spouse: val ? null : undefined,
                });
                handleStepChange("spouse_canadian");
              }}
              className="flex gap-6 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="spouse_canadian_yes" />
                <Label htmlFor="spouse_canadian_yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="spouse_canadian_no" />
                <Label htmlFor="spouse_canadian_no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>
        )}
        {step === "spouse_coming" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              2) ii. Will your spouse or common-law partner come with you to Canada?
            </Label>
            <p className="text-sm text-muted-foreground">
              If your spouse or partner is not a citizen or permanent resident of Canada, they will be included in your application. Answer &quot;No&quot; if they will not be accompanying you.
            </p>
            <RadioGroup
              value={spouseComing === null ? "" : spouseComing ? "yes" : "no"}
              onValueChange={(v) => {
                const val = v === "yes";
                setSpouseComing(val);
                updateInput({
                    spouse:
                    spouseCanadian === false && val
                      ? {
                          education_level: "select" as unknown as EducationLevel,
                          first_official_language: defaultLanguageScores(CLB_SELECT),
                          canadian_work_experience_years: WORK_SELECT,
                        }
                      : null,
                });
                handleStepChange("spouse_coming");
              }}
              className="flex gap-6 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="spouse_coming_yes" />
                <Label htmlFor="spouse_coming_yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="spouse_coming_no" />
                <Label htmlFor="spouse_coming_no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>
        )}
        {step === "age" && (
          <div className="space-y-4">
            <Label htmlFor="age" className="text-lg font-semibold text-primary block leading-relaxed">
              3) How old are you?
            </Label>
            <p className="text-sm text-muted-foreground">
              Choose the best answer:
              <br />
              • If you&apos;ve been invited to apply, enter your age on the date you were invited.
              <br />
              • If you plan to complete an Express Entry profile, enter your current age.
            </p>
            <Select
              value={input.age === AGE_SELECT ? "select" : String(input.age)}
              onValueChange={(v) => {
                updateInput({ age: v === "select" ? AGE_SELECT : Number(v) });
                handleStepChange("age");
              }}
            >
              <SelectTrigger id="age" className="mt-1 h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                {AGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "education" && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold text-primary">
                4) What is your level of education?
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the highest level of education for which you earned a <strong>Canadian degree, diploma or certificate</strong> or had an Educational Credential Assessment (ECA) if you did your study outside Canada.
              </p>
            </div>
            <Select
              value={(input.education_level as string) === "select" ? "select" : input.education_level}
              onValueChange={(v) => {
                updateInput({ education_level: (v === "select" ? "select" : v) as EducationLevel });
                handleStepChange("education");
              }}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                {EDUCATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "education_in_canada" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              4b) Have you earned a Canadian degree, diploma or certificate?
            </Label>
            <p className="text-sm text-muted-foreground">
              <strong>Note: to answer yes:</strong> English or French as a Second Language must not have made up more than half your study; you must have studied at a school within Canada; you had to be enrolled full time for at least eight months (or between March 2020 and August 2022).
            </p>
            <Select
              value={educationInCanadaAnswer}
              onValueChange={(v: "select" | "yes" | "no") => {
                setEducationInCanadaAnswer(v);
                if (v !== "yes") setEducationInCanadaLevel("select");
                updateInput({
                  education_in_canada: {
                    ...input.education_in_canada,
                    has_credential: v === "yes",
                    years_of_study: v === "yes" ? input.education_in_canada.years_of_study : 0,
                  },
                });
                handleStepChange("education_in_canada");
              }}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "education_in_canada_level" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              4c) Choose the best answer to describe this level of education.
            </Label>
            <Select
              value={educationInCanadaLevel}
              onValueChange={(v: "select" | "secondary" | "one_two_year" | "three_plus_year") => {
                setEducationInCanadaLevel(v);
                const years = v === "secondary" ? 0 : v === "one_two_year" ? 2 : v === "three_plus_year" ? 3 : 0;
                updateInput({
                  education_in_canada: {
                    ...input.education_in_canada,
                    years_of_study: years,
                  },
                });
                handleStepChange("education_in_canada_level");
              }}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                <SelectItem value="secondary">Secondary (high school) or less</SelectItem>
                <SelectItem value="one_two_year">One- or two-year diploma or certificate</SelectItem>
                <SelectItem value="three_plus_year">Degree, diploma or certificate of three years or longer OR a Master&apos;s, professional or doctoral degree of at least one academic year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "first_lang_recent" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              5i) Are your language test results less than two years old?
            </Label>
            <p className="text-sm text-muted-foreground mt-1 mb-2">
              You need to submit language test results that are less than two years old for all programs under Express Entry.
            </p>
            <Select
              value={firstLangTestRecent}
              onValueChange={(v: "select" | "no" | "yes") => {
                setFirstLangTestRecent(v);
                updateInput({ first_language_test_less_than_two_years: v === "yes" });
                handleStepChange("first_lang_recent");
              }}
            >
              <SelectTrigger className="mt-1 h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "first_lang_test" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              5ii) Which language test did you take for your first official language?
            </Label>
            <p className="text-sm text-muted-foreground">
              After calculating your score, use the "Advanced: Score variation" section to see how
              different language scores would affect your CRS.
            </p>
            <Select
              value={firstLangTestType}
              onValueChange={(v: "select" | "celpip_g" | "ielts" | "pte_core" | "tef_canada" | "tcf_canada") => {
                setFirstLangTestType(v);
                if (v !== "ielts") setIeltsScores(null);
                if (v !== "celpip_g") setCelpipScores(null);
                if (v !== "pte_core") setPteScores(null);
                if (v !== "tef_canada") setTefScores(null);
                if (v !== "tcf_canada") setTcfScores(null);
                if (v === "select") setSecondLangTestType("select");
                updateInput({
                  first_language_test_type: v === "select" ? undefined : v,
                  second_official_language: v === "select" ? null : input.second_official_language,
                });
                handleStepChange("first_lang_test");
              }}
            >
              <SelectTrigger className="mt-1 h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                <SelectItem value="celpip_g">CELPIP-G</SelectItem>
                <SelectItem value="ielts">IELTS</SelectItem>
                <SelectItem value="pte_core">PTE Core</SelectItem>
                <SelectItem value="tef_canada">TEF Canada</SelectItem>
                <SelectItem value="tcf_canada">TCF Canada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "first_lang_ielts" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              Enter your IELTS scores by module
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your band score for each module. CLB level will be calculated automatically.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ielts-speaking">Speaking</Label>
                <Select
                  value={ieltsScores?.speaking != null ? String(ieltsScores.speaking) : "select"}
                  onValueChange={(v) => {
                    const band = v === "select" ? 0 : Number(v);
                    const next = ieltsScores ? { ...ieltsScores, speaking: band } : { speaking: band, listening: 0, reading: 0, writing: 0 };
                    setIeltsScores(next);
                    if (band > 0) {
                      updateInput({
                        first_official_language: {
                          ...input.first_official_language,
                          speaking_clb: ieltsToClb("speaking", band),
                          listening_clb: next.listening > 0 ? ieltsToClb("listening", next.listening) : input.first_official_language.listening_clb,
                          reading_clb: next.reading > 0 ? ieltsToClb("reading", next.reading) : input.first_official_language.reading_clb,
                          writing_clb: next.writing > 0 ? ieltsToClb("writing", next.writing) : input.first_official_language.writing_clb,
                        },
                      });
                    }
                    handleStepChange("first_lang_ielts");
                  }}
                >
                  <SelectTrigger id="ielts-speaking" className="h-11 text-base">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">Select...</SelectItem>
                    {IELTS_BAND_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ielts-listening">Listening</Label>
                <Select
                  value={ieltsScores?.listening != null && ieltsScores.listening > 0 ? String(ieltsScores.listening) : "select"}
                  onValueChange={(v) => {
                    const band = v === "select" ? 0 : Number(v);
                    const next = ieltsScores ? { ...ieltsScores, listening: band } : { speaking: 0, listening: band, reading: 0, writing: 0 };
                    setIeltsScores(next);
                    if (band > 0) {
                      updateInput({
                        first_official_language: {
                          ...input.first_official_language,
                          speaking_clb: next.speaking > 0 ? ieltsToClb("speaking", next.speaking) : input.first_official_language.speaking_clb,
                          listening_clb: ieltsToClb("listening", band),
                          reading_clb: next.reading > 0 ? ieltsToClb("reading", next.reading) : input.first_official_language.reading_clb,
                          writing_clb: next.writing > 0 ? ieltsToClb("writing", next.writing) : input.first_official_language.writing_clb,
                        },
                      });
                    }
                    handleStepChange("first_lang_ielts");
                  }}
                >
                  <SelectTrigger id="ielts-listening" className="h-11 text-base">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">Select...</SelectItem>
                    {IELTS_BAND_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ielts-reading">Reading</Label>
                <Select
                  value={ieltsScores?.reading != null && ieltsScores.reading > 0 ? String(ieltsScores.reading) : "select"}
                  onValueChange={(v) => {
                    const band = v === "select" ? 0 : Number(v);
                    const next = ieltsScores ? { ...ieltsScores, reading: band } : { speaking: 0, listening: 0, reading: band, writing: 0 };
                    setIeltsScores(next);
                    if (band > 0) {
                      updateInput({
                        first_official_language: {
                          ...input.first_official_language,
                          speaking_clb: next.speaking > 0 ? ieltsToClb("speaking", next.speaking) : input.first_official_language.speaking_clb,
                          listening_clb: next.listening > 0 ? ieltsToClb("listening", next.listening) : input.first_official_language.listening_clb,
                          reading_clb: ieltsToClb("reading", band),
                          writing_clb: next.writing > 0 ? ieltsToClb("writing", next.writing) : input.first_official_language.writing_clb,
                        },
                      });
                    }
                    handleStepChange("first_lang_ielts");
                  }}
                >
                  <SelectTrigger id="ielts-reading" className="h-11 text-base">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">Select...</SelectItem>
                    {IELTS_BAND_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ielts-writing">Writing</Label>
                <Select
                  value={ieltsScores?.writing != null && ieltsScores.writing > 0 ? String(ieltsScores.writing) : "select"}
                  onValueChange={(v) => {
                    const band = v === "select" ? 0 : Number(v);
                    const next = ieltsScores ? { ...ieltsScores, writing: band } : { speaking: 0, listening: 0, reading: 0, writing: band };
                    setIeltsScores(next);
                    if (band > 0) {
                      updateInput({
                        first_official_language: {
                          ...input.first_official_language,
                          speaking_clb: next.speaking > 0 ? ieltsToClb("speaking", next.speaking) : input.first_official_language.speaking_clb,
                          listening_clb: next.listening > 0 ? ieltsToClb("listening", next.listening) : input.first_official_language.listening_clb,
                          reading_clb: next.reading > 0 ? ieltsToClb("reading", next.reading) : input.first_official_language.reading_clb,
                          writing_clb: ieltsToClb("writing", band),
                        },
                      });
                    }
                    handleStepChange("first_lang_ielts");
                  }}
                >
                  <SelectTrigger id="ielts-writing" className="h-11 text-base">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">Select...</SelectItem>
                    {IELTS_BAND_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {ieltsScores && (ieltsScores.speaking > 0 || ieltsScores.listening > 0 || ieltsScores.reading > 0 || ieltsScores.writing > 0) && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-2">Calculated CLB levels</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ieltsScores.speaking > 0 && <span>Speaking: CLB {ieltsToClb("speaking", ieltsScores.speaking)}</span>}
                  {ieltsScores.listening > 0 && <span>Listening: CLB {ieltsToClb("listening", ieltsScores.listening)}</span>}
                  {ieltsScores.reading > 0 && <span>Reading: CLB {ieltsToClb("reading", ieltsScores.reading)}</span>}
                  {ieltsScores.writing > 0 && <span>Writing: CLB {ieltsToClb("writing", ieltsScores.writing)}</span>}
                </div>
              </div>
            )}
          </div>
        )}
        {step === "first_lang_celpip" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              Enter your CELPIP scores by module
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your score for each module (5–12). CLB level equals CELPIP score; 9+ = CLB 9+.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["speaking", "listening", "reading", "writing"] as const).map((mod) => (
                <div key={mod}>
                  <Label htmlFor={`celpip-${mod}`}>{mod.charAt(0).toUpperCase() + mod.slice(1)}</Label>
                  <Select
                    value={celpipScores?.[mod] != null && celpipScores[mod] > 0 ? String(celpipScores[mod]) : "select"}
                    onValueChange={(v) => {
                      const score = v === "select" ? 0 : Number(v);
                      const next = celpipScores ? { ...celpipScores, [mod]: score } : { speaking: 0, listening: 0, reading: 0, writing: 0, [mod]: score };
                      setCelpipScores(next);
                      if (score > 0) {
                        updateInput({
                          first_official_language: {
                            ...input.first_official_language,
                            speaking_clb: next.speaking > 0 ? celpipToClb(next.speaking) : input.first_official_language.speaking_clb,
                            listening_clb: next.listening > 0 ? celpipToClb(next.listening) : input.first_official_language.listening_clb,
                            reading_clb: next.reading > 0 ? celpipToClb(next.reading) : input.first_official_language.reading_clb,
                            writing_clb: next.writing > 0 ? celpipToClb(next.writing) : input.first_official_language.writing_clb,
                          },
                        });
                      }
                      handleStepChange("first_lang_celpip");
                    }}
                  >
                    <SelectTrigger id={`celpip-${mod}`} className="h-11 text-base">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select">Select...</SelectItem>
                      {CELPIP_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {celpipScores && (celpipScores.speaking > 0 || celpipScores.listening > 0 || celpipScores.reading > 0 || celpipScores.writing > 0) && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-2">Calculated CLB levels</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {celpipScores.speaking > 0 && <span>Speaking: CLB {celpipToClb(celpipScores.speaking)}</span>}
                  {celpipScores.listening > 0 && <span>Listening: CLB {celpipToClb(celpipScores.listening)}</span>}
                  {celpipScores.reading > 0 && <span>Reading: CLB {celpipToClb(celpipScores.reading)}</span>}
                  {celpipScores.writing > 0 && <span>Writing: CLB {celpipToClb(celpipScores.writing)}</span>}
                </div>
              </div>
            )}
          </div>
        )}
        {step === "first_lang_pte" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              Enter your PTE Core scores by module
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your score for each module (0–90). CLB level will be calculated automatically.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["speaking", "listening", "reading", "writing"] as const).map((mod) => (
                <div key={mod}>
                  <Label htmlFor={`pte-${mod}`}>{mod.charAt(0).toUpperCase() + mod.slice(1)}</Label>
                  <Select
                    value={pteScores?.[mod] != null && pteScores[mod] > 0 ? String(pteScores[mod]) : "select"}
                    onValueChange={(v) => {
                      const score = v === "select" ? 0 : Number(v);
                      const next = pteScores ? { ...pteScores, [mod]: score } : { speaking: 0, listening: 0, reading: 0, writing: 0, [mod]: score };
                      setPteScores(next);
                      if (score > 0) {
                        updateInput({
                          first_official_language: {
                            ...input.first_official_language,
                            speaking_clb: next.speaking > 0 ? pteToClb("speaking", next.speaking) : input.first_official_language.speaking_clb,
                            listening_clb: next.listening > 0 ? pteToClb("listening", next.listening) : input.first_official_language.listening_clb,
                            reading_clb: next.reading > 0 ? pteToClb("reading", next.reading) : input.first_official_language.reading_clb,
                            writing_clb: next.writing > 0 ? pteToClb("writing", next.writing) : input.first_official_language.writing_clb,
                          },
                        });
                      }
                      handleStepChange("first_lang_pte");
                    }}
                  >
                    <SelectTrigger id={`pte-${mod}`} className="h-11 text-base">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select">Select...</SelectItem>
                      {PTE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {pteScores && (pteScores.speaking > 0 || pteScores.listening > 0 || pteScores.reading > 0 || pteScores.writing > 0) && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-2">Calculated CLB levels</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {pteScores.speaking > 0 && <span>Speaking: CLB {pteToClb("speaking", pteScores.speaking)}</span>}
                  {pteScores.listening > 0 && <span>Listening: CLB {pteToClb("listening", pteScores.listening)}</span>}
                  {pteScores.reading > 0 && <span>Reading: CLB {pteToClb("reading", pteScores.reading)}</span>}
                  {pteScores.writing > 0 && <span>Writing: CLB {pteToClb("writing", pteScores.writing)}</span>}
                </div>
              </div>
            )}
          </div>
        )}
        {step === "first_lang_tef" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              Enter your TEF Canada scores by module
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Select the range that includes your score for each module. NCLC level will be calculated automatically.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["speaking", "listening", "reading", "writing"] as const).map((mod) => {
                const tefOpts = mod === "speaking" ? TEF_SPEAKING_OPTIONS : mod === "listening" ? TEF_LISTENING_OPTIONS : mod === "reading" ? TEF_READING_OPTIONS : TEF_WRITING_OPTIONS;
                return (
                  <div key={mod}>
                    <Label htmlFor={`tef-${mod}`}>{mod.charAt(0).toUpperCase() + mod.slice(1)}</Label>
                    <Select
                      value={tefScores?.[mod] != null && tefScores[mod] > 0 ? String(tefScores[mod]) : "select"}
                      onValueChange={(v) => {
                        const score = v === "select" ? 0 : Number(v);
                        const next = tefScores ? { ...tefScores, [mod]: score } : { speaking: 0, listening: 0, reading: 0, writing: 0, [mod]: score };
                        setTefScores(next);
                        if (score > 0) {
                          updateInput({
                            first_official_language: {
                              ...input.first_official_language,
                              speaking_clb: next.speaking > 0 ? tefToNclc("speaking", next.speaking) : input.first_official_language.speaking_clb,
                              listening_clb: next.listening > 0 ? tefToNclc("listening", next.listening) : input.first_official_language.listening_clb,
                              reading_clb: next.reading > 0 ? tefToNclc("reading", next.reading) : input.first_official_language.reading_clb,
                              writing_clb: next.writing > 0 ? tefToNclc("writing", next.writing) : input.first_official_language.writing_clb,
                            },
                          });
                        }
                        handleStepChange("first_lang_tef");
                      }}
                    >
                      <SelectTrigger id={`tef-${mod}`} className="h-11 text-base">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select">Select...</SelectItem>
                        {tefOpts.map((o) => (
                          <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
            {tefScores && (tefScores.speaking > 0 || tefScores.listening > 0 || tefScores.reading > 0 || tefScores.writing > 0) && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-2">Calculated NCLC (CLB) levels</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {tefScores.speaking > 0 && <span>Speaking: NCLC {tefToNclc("speaking", tefScores.speaking)}</span>}
                  {tefScores.listening > 0 && <span>Listening: NCLC {tefToNclc("listening", tefScores.listening)}</span>}
                  {tefScores.reading > 0 && <span>Reading: NCLC {tefToNclc("reading", tefScores.reading)}</span>}
                  {tefScores.writing > 0 && <span>Writing: NCLC {tefToNclc("writing", tefScores.writing)}</span>}
                </div>
              </div>
            )}
          </div>
        )}
        {step === "first_lang_tcf" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              Enter your TCF Canada scores by module
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Speaking & Writing: 0–20 scale. Listening & Reading: 0–699 scale. NCLC level (equivalent to CLB) will be calculated.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["speaking", "listening", "reading", "writing"] as const).map((mod) => {
                const isSw = mod === "speaking" || mod === "writing";
                const options = isSw ? TCF_SW_OPTIONS : mod === "listening" ? TCF_LISTENING_OPTIONS : TCF_READING_OPTIONS;
                return (
                  <div key={mod}>
                    <Label htmlFor={`tcf-${mod}`}>{mod.charAt(0).toUpperCase() + mod.slice(1)}</Label>
                    <Select
                      value={tcfScores?.[mod] != null && tcfScores[mod] > 0 ? String(tcfScores[mod]) : "select"}
                      onValueChange={(v) => {
                        const score = v === "select" ? 0 : Number(v);
                        const next = tcfScores ? { ...tcfScores, [mod]: score } : { speaking: 0, listening: 0, reading: 0, writing: 0, [mod]: score };
                        setTcfScores(next);
                        if (score > 0) {
                          updateInput({
                            first_official_language: {
                              ...input.first_official_language,
                              speaking_clb: next.speaking > 0 ? tcfToNclc("speaking", next.speaking) : input.first_official_language.speaking_clb,
                              listening_clb: next.listening > 0 ? tcfToNclc("listening", next.listening) : input.first_official_language.listening_clb,
                              reading_clb: next.reading > 0 ? tcfToNclc("reading", next.reading) : input.first_official_language.reading_clb,
                              writing_clb: next.writing > 0 ? tcfToNclc("writing", next.writing) : input.first_official_language.writing_clb,
                            },
                          });
                        }
                        handleStepChange("first_lang_tcf");
                      }}
                    >
                      <SelectTrigger id={`tcf-${mod}`} className="h-11 text-base">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select">Select...</SelectItem>
                        {options.map((o) => (
                          <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
            {tcfScores && (tcfScores.speaking > 0 || tcfScores.listening > 0 || tcfScores.reading > 0 || tcfScores.writing > 0) && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-2">Calculated NCLC (CLB) levels</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {tcfScores.speaking > 0 && <span>Speaking: NCLC {tcfToNclc("speaking", tcfScores.speaking)}</span>}
                  {tcfScores.listening > 0 && <span>Listening: NCLC {tcfToNclc("listening", tcfScores.listening)}</span>}
                  {tcfScores.reading > 0 && <span>Reading: NCLC {tcfToNclc("reading", tcfScores.reading)}</span>}
                  {tcfScores.writing > 0 && <span>Writing: NCLC {tcfToNclc("writing", tcfScores.writing)}</span>}
                </div>
              </div>
            )}
          </div>
        )}
        {step === "first_lang_clb" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              Enter your first language test scores (CLB level)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Same for all abilities (reading, writing, speaking, listening)
            </p>
            <Select
              value={input.first_official_language.reading_clb === CLB_SELECT ? "select" : String(input.first_official_language.reading_clb)}
              onValueChange={(v) => {
                const clb = v === "select" ? CLB_SELECT : Number(v);
                updateInput({ first_official_language: defaultLanguageScores(clb) });
                handleStepChange("first_lang_clb");
              }}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                {CLB_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "second_lang_test" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              5iii) Do you have other language results?
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Which language test did you take for your second official language? Test results must be less than two years old.
            </p>
            <Select
              value={secondLangTestType}
              onValueChange={(v: "select" | "celpip_g" | "ielts" | "pte_core" | "tef_canada" | "tcf_canada" | "not_applicable") => {
                setSecondLangTestType(v);
                if (v !== "ielts") setSecondIeltsScores(null);
                if (v !== "celpip_g") setSecondCelpipScores(null);
                if (v !== "pte_core") setSecondPteScores(null);
                if (v !== "tef_canada") setSecondTefScores(null);
                if (v !== "tcf_canada") setSecondTcfScores(null);
                updateInput({
                  second_official_language: v === "not_applicable" || v === "select" ? null : defaultLanguageScores(5),
                });
                handleStepChange("second_lang_test");
              }}
            >
              <SelectTrigger className="mt-1 h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                {["celpip_g", "ielts", "pte_core"].includes(firstLangTestType) ? (
                  <>
                    <SelectItem value="tef_canada">TEF Canada</SelectItem>
                    <SelectItem value="tcf_canada">TCF Canada</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="celpip_g">CELPIP-G</SelectItem>
                    <SelectItem value="ielts">IELTS</SelectItem>
                    <SelectItem value="pte_core">PTE Core</SelectItem>
                  </>
                )}
                <SelectItem value="not_applicable">not applicable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "second_lang_ielts" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              Enter your second language (IELTS) scores by module
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your band score for each module. CLB level will be calculated automatically.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["speaking", "listening", "reading", "writing"] as const).map((mod) => (
                <div key={mod}>
                  <Label htmlFor={`second-ielts-${mod}`}>{mod.charAt(0).toUpperCase() + mod.slice(1)}</Label>
                  <Select
                    value={secondIeltsScores?.[mod] != null && secondIeltsScores[mod] > 0 ? String(secondIeltsScores[mod]) : "select"}
                    onValueChange={(v) => {
                      const band = v === "select" ? 0 : Number(v);
                      const next = secondIeltsScores ? { ...secondIeltsScores, [mod]: band } : { speaking: 0, listening: 0, reading: 0, writing: 0, [mod]: band };
                      setSecondIeltsScores(next);
                      if (band > 0) {
                        updateInput({
                          second_official_language: {
                            ...(input.second_official_language ?? defaultLanguageScores(5)),
                            speaking_clb: next.speaking > 0 ? ieltsToClb("speaking", next.speaking) : (input.second_official_language?.speaking_clb ?? 5),
                            listening_clb: next.listening > 0 ? ieltsToClb("listening", next.listening) : (input.second_official_language?.listening_clb ?? 5),
                            reading_clb: next.reading > 0 ? ieltsToClb("reading", next.reading) : (input.second_official_language?.reading_clb ?? 5),
                            writing_clb: next.writing > 0 ? ieltsToClb("writing", next.writing) : (input.second_official_language?.writing_clb ?? 5),
                          },
                        });
                      }
                      handleStepChange("second_lang_ielts");
                    }}
                  >
                    <SelectTrigger id={`second-ielts-${mod}`} className="h-11 text-base">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select">Select...</SelectItem>
                      {IELTS_BAND_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {secondIeltsScores && (secondIeltsScores.speaking > 0 || secondIeltsScores.listening > 0 || secondIeltsScores.reading > 0 || secondIeltsScores.writing > 0) && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-2">Calculated CLB levels</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {secondIeltsScores.speaking > 0 && <span>Speaking: CLB {ieltsToClb("speaking", secondIeltsScores.speaking)}</span>}
                  {secondIeltsScores.listening > 0 && <span>Listening: CLB {ieltsToClb("listening", secondIeltsScores.listening)}</span>}
                  {secondIeltsScores.reading > 0 && <span>Reading: CLB {ieltsToClb("reading", secondIeltsScores.reading)}</span>}
                  {secondIeltsScores.writing > 0 && <span>Writing: CLB {ieltsToClb("writing", secondIeltsScores.writing)}</span>}
                </div>
              </div>
            )}
          </div>
        )}
        {step === "second_lang_celpip" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              Enter your second language (CELPIP) scores by module
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your score for each module (5–12). CLB level equals CELPIP score; 9+ = CLB 9+.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["speaking", "listening", "reading", "writing"] as const).map((mod) => (
                <div key={mod}>
                  <Label htmlFor={`second-celpip-${mod}`}>{mod.charAt(0).toUpperCase() + mod.slice(1)}</Label>
                  <Select
                    value={secondCelpipScores?.[mod] != null && secondCelpipScores[mod] > 0 ? String(secondCelpipScores[mod]) : "select"}
                    onValueChange={(v) => {
                      const score = v === "select" ? 0 : Number(v);
                      const next = secondCelpipScores ? { ...secondCelpipScores, [mod]: score } : { speaking: 0, listening: 0, reading: 0, writing: 0, [mod]: score };
                      setSecondCelpipScores(next);
                      if (score > 0) {
                        updateInput({
                          second_official_language: {
                            ...(input.second_official_language ?? defaultLanguageScores(5)),
                            speaking_clb: next.speaking > 0 ? celpipToClb(next.speaking) : (input.second_official_language?.speaking_clb ?? 5),
                            listening_clb: next.listening > 0 ? celpipToClb(next.listening) : (input.second_official_language?.listening_clb ?? 5),
                            reading_clb: next.reading > 0 ? celpipToClb(next.reading) : (input.second_official_language?.reading_clb ?? 5),
                            writing_clb: next.writing > 0 ? celpipToClb(next.writing) : (input.second_official_language?.writing_clb ?? 5),
                          },
                        });
                      }
                      handleStepChange("second_lang_celpip");
                    }}
                  >
                    <SelectTrigger id={`second-celpip-${mod}`} className="h-11 text-base">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select">Select...</SelectItem>
                      {CELPIP_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {secondCelpipScores && (secondCelpipScores.speaking > 0 || secondCelpipScores.listening > 0 || secondCelpipScores.reading > 0 || secondCelpipScores.writing > 0) && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-2">Calculated CLB levels</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {secondCelpipScores.speaking > 0 && <span>Speaking: CLB {celpipToClb(secondCelpipScores.speaking)}</span>}
                  {secondCelpipScores.listening > 0 && <span>Listening: CLB {celpipToClb(secondCelpipScores.listening)}</span>}
                  {secondCelpipScores.reading > 0 && <span>Reading: CLB {celpipToClb(secondCelpipScores.reading)}</span>}
                  {secondCelpipScores.writing > 0 && <span>Writing: CLB {celpipToClb(secondCelpipScores.writing)}</span>}
                </div>
              </div>
            )}
          </div>
        )}
        {step === "second_lang_pte" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              Enter your second language (PTE Core) scores by module
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your score for each module (39–90). CLB level will be calculated automatically.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["speaking", "listening", "reading", "writing"] as const).map((mod) => (
                <div key={mod}>
                  <Label htmlFor={`second-pte-${mod}`}>{mod.charAt(0).toUpperCase() + mod.slice(1)}</Label>
                  <Select
                    value={secondPteScores?.[mod] != null && secondPteScores[mod] > 0 ? String(secondPteScores[mod]) : "select"}
                    onValueChange={(v) => {
                      const score = v === "select" ? 0 : Number(v);
                      const next = secondPteScores ? { ...secondPteScores, [mod]: score } : { speaking: 0, listening: 0, reading: 0, writing: 0, [mod]: score };
                      setSecondPteScores(next);
                      if (score > 0) {
                        updateInput({
                          second_official_language: {
                            ...(input.second_official_language ?? defaultLanguageScores(5)),
                            speaking_clb: next.speaking > 0 ? pteToClb("speaking", next.speaking) : (input.second_official_language?.speaking_clb ?? 5),
                            listening_clb: next.listening > 0 ? pteToClb("listening", next.listening) : (input.second_official_language?.listening_clb ?? 5),
                            reading_clb: next.reading > 0 ? pteToClb("reading", next.reading) : (input.second_official_language?.reading_clb ?? 5),
                            writing_clb: next.writing > 0 ? pteToClb("writing", next.writing) : (input.second_official_language?.writing_clb ?? 5),
                          },
                        });
                      }
                      handleStepChange("second_lang_pte");
                    }}
                  >
                    <SelectTrigger id={`second-pte-${mod}`} className="h-11 text-base">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select">Select...</SelectItem>
                      {PTE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {secondPteScores && (secondPteScores.speaking > 0 || secondPteScores.listening > 0 || secondPteScores.reading > 0 || secondPteScores.writing > 0) && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-2">Calculated CLB levels</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {secondPteScores.speaking > 0 && <span>Speaking: CLB {pteToClb("speaking", secondPteScores.speaking)}</span>}
                  {secondPteScores.listening > 0 && <span>Listening: CLB {pteToClb("listening", secondPteScores.listening)}</span>}
                  {secondPteScores.reading > 0 && <span>Reading: CLB {pteToClb("reading", secondPteScores.reading)}</span>}
                  {secondPteScores.writing > 0 && <span>Writing: CLB {pteToClb("writing", secondPteScores.writing)}</span>}
                </div>
              </div>
            )}
          </div>
        )}
        {step === "second_lang_tef" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              Enter your second language (TEF Canada) scores by module
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Select the range that includes your score for each module. NCLC level will be calculated automatically.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["speaking", "listening", "reading", "writing"] as const).map((mod) => {
                const tefOpts = mod === "speaking" ? TEF_SPEAKING_OPTIONS : mod === "listening" ? TEF_LISTENING_OPTIONS : mod === "reading" ? TEF_READING_OPTIONS : TEF_WRITING_OPTIONS;
                return (
                  <div key={mod}>
                    <Label htmlFor={`second-tef-${mod}`}>{mod.charAt(0).toUpperCase() + mod.slice(1)}</Label>
                    <Select
                      value={secondTefScores?.[mod] != null && secondTefScores[mod] > 0 ? String(secondTefScores[mod]) : "select"}
                      onValueChange={(v) => {
                        const score = v === "select" ? 0 : Number(v);
                        const next = secondTefScores ? { ...secondTefScores, [mod]: score } : { speaking: 0, listening: 0, reading: 0, writing: 0, [mod]: score };
                        setSecondTefScores(next);
                        if (score > 0) {
                          updateInput({
                            second_official_language: {
                              ...(input.second_official_language ?? defaultLanguageScores(5)),
                              speaking_clb: next.speaking > 0 ? tefToNclc("speaking", next.speaking) : (input.second_official_language?.speaking_clb ?? 5),
                              listening_clb: next.listening > 0 ? tefToNclc("listening", next.listening) : (input.second_official_language?.listening_clb ?? 5),
                              reading_clb: next.reading > 0 ? tefToNclc("reading", next.reading) : (input.second_official_language?.reading_clb ?? 5),
                              writing_clb: next.writing > 0 ? tefToNclc("writing", next.writing) : (input.second_official_language?.writing_clb ?? 5),
                            },
                          });
                        }
                        handleStepChange("second_lang_tef");
                      }}
                    >
                      <SelectTrigger id={`second-tef-${mod}`} className="h-11 text-base">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select">Select...</SelectItem>
                        {tefOpts.map((o) => (
                          <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
            {secondTefScores && (secondTefScores.speaking > 0 || secondTefScores.listening > 0 || secondTefScores.reading > 0 || secondTefScores.writing > 0) && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-2">Calculated NCLC (CLB) levels</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {secondTefScores.speaking > 0 && <span>Speaking: NCLC {tefToNclc("speaking", secondTefScores.speaking)}</span>}
                  {secondTefScores.listening > 0 && <span>Listening: NCLC {tefToNclc("listening", secondTefScores.listening)}</span>}
                  {secondTefScores.reading > 0 && <span>Reading: NCLC {tefToNclc("reading", secondTefScores.reading)}</span>}
                  {secondTefScores.writing > 0 && <span>Writing: NCLC {tefToNclc("writing", secondTefScores.writing)}</span>}
                </div>
              </div>
            )}
          </div>
        )}
        {step === "second_lang_tcf" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              Enter your second language (TCF Canada) scores by module
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Speaking & Writing: 0–20 scale. Listening & Reading: 0–699 scale. NCLC level (equivalent to CLB) will be calculated.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["speaking", "listening", "reading", "writing"] as const).map((mod) => {
                const isSw = mod === "speaking" || mod === "writing";
                const options = isSw ? TCF_SW_OPTIONS : mod === "listening" ? TCF_LISTENING_OPTIONS : TCF_READING_OPTIONS;
                return (
                  <div key={mod}>
                    <Label htmlFor={`second-tcf-${mod}`}>{mod.charAt(0).toUpperCase() + mod.slice(1)}</Label>
                    <Select
                      value={secondTcfScores?.[mod] != null && secondTcfScores[mod] > 0 ? String(secondTcfScores[mod]) : "select"}
                      onValueChange={(v) => {
                        const score = v === "select" ? 0 : Number(v);
                        const next = secondTcfScores ? { ...secondTcfScores, [mod]: score } : { speaking: 0, listening: 0, reading: 0, writing: 0, [mod]: score };
                        setSecondTcfScores(next);
                        if (score > 0) {
                          updateInput({
                            second_official_language: {
                              ...(input.second_official_language ?? defaultLanguageScores(5)),
                              speaking_clb: next.speaking > 0 ? tcfToNclc("speaking", next.speaking) : (input.second_official_language?.speaking_clb ?? 5),
                              listening_clb: next.listening > 0 ? tcfToNclc("listening", next.listening) : (input.second_official_language?.listening_clb ?? 5),
                              reading_clb: next.reading > 0 ? tcfToNclc("reading", next.reading) : (input.second_official_language?.reading_clb ?? 5),
                              writing_clb: next.writing > 0 ? tcfToNclc("writing", next.writing) : (input.second_official_language?.writing_clb ?? 5),
                            },
                          });
                        }
                        handleStepChange("second_lang_tcf");
                      }}
                    >
                      <SelectTrigger id={`second-tcf-${mod}`} className="h-11 text-base">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select">Select...</SelectItem>
                        {options.map((o) => (
                          <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
            {secondTcfScores && (secondTcfScores.speaking > 0 || secondTcfScores.listening > 0 || secondTcfScores.reading > 0 || secondTcfScores.writing > 0) && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-2">Calculated NCLC (CLB) levels</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {secondTcfScores.speaking > 0 && <span>Speaking: NCLC {tcfToNclc("speaking", secondTcfScores.speaking)}</span>}
                  {secondTcfScores.listening > 0 && <span>Listening: NCLC {tcfToNclc("listening", secondTcfScores.listening)}</span>}
                  {secondTcfScores.reading > 0 && <span>Reading: NCLC {tcfToNclc("reading", secondTcfScores.reading)}</span>}
                  {secondTcfScores.writing > 0 && <span>Writing: NCLC {tcfToNclc("writing", secondTcfScores.writing)}</span>}
                </div>
              </div>
            )}
          </div>
        )}
        {step === "second_lang_clb" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              Enter your second language test scores (CLB level)
            </Label>
            <Select
              value={String(input.second_official_language?.reading_clb ?? 5)}
              onValueChange={(v) => {
                const clb = Number(v);
                updateInput({ second_official_language: defaultLanguageScores(clb) });
                handleStepChange("second_lang_clb");
              }}
            >
              <SelectTrigger className="mt-1 h-11 text-base">
                <SelectValue placeholder="Select CLB level..." />
              </SelectTrigger>
              <SelectContent>
                {CLB_SECOND_LANG_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "canadian_work" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              6i) In the last 10 years, how many years of skilled work experience in Canada do you have?
            </Label>
            <p className="text-sm text-muted-foreground mt-2 mb-2">
              Skilled work must be paid, full-time (or equivalent part-time), in Canada, for a Canadian employer, NOC TEER 0, 1, 2, or 3.{" "}
              <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/find-noc-occupation.html" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">Find your NOC</a>
            </p>
            <Select
              value={input.canadian_work_experience_years === WORK_SELECT ? "select" : String(input.canadian_work_experience_years)}
              onValueChange={(v) => {
                updateInput({ canadian_work_experience_years: v === "select" ? WORK_SELECT : Number(v) });
                handleStepChange("canadian_work");
              }}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                <SelectItem value="0">None or less than a year</SelectItem>
                <SelectItem value="1">1 year</SelectItem>
                <SelectItem value="2">2 years</SelectItem>
                <SelectItem value="3">3 years</SelectItem>
                <SelectItem value="4">4 years</SelectItem>
                <SelectItem value="5">5 years or more</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "foreign_work" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              6ii) In the last 10 years, how many total years of foreign skilled work experience do you have?
            </Label>
            <p className="text-sm text-muted-foreground mt-2 mb-2">
              Paid, full-time (or equal part-time), in one occupation (NOC TEER 0, 1, 2 or 3).
            </p>
            <Select
              value={input.foreign_work_experience_years === WORK_SELECT ? "select" : String(Math.min(input.foreign_work_experience_years, 3))}
              onValueChange={(v) => {
                updateInput({ foreign_work_experience_years: v === "select" ? WORK_SELECT : Number(v) });
                handleStepChange("foreign_work");
              }}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                <SelectItem value="0">None or less than a year</SelectItem>
                <SelectItem value="1">1 year</SelectItem>
                <SelectItem value="2">2 years</SelectItem>
                <SelectItem value="3">3 years or more</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "spouse_factors" && input.spouse && (
          <div className="space-y-4">
            <h3 className="font-semibold text-primary">B. Spouse or common-law partner factors</h3>
            <div>
              <Label>Spouse&apos;s level of education</Label>
              <Select
                value={(input.spouse.education_level as string) === "select" ? "select" : input.spouse.education_level}
                onValueChange={(v) => {
                  updateInput({
                    spouse: { ...input.spouse!, education_level: (v === "select" ? "select" : v) as EducationLevel },
                  });
                  handleStepChange("spouse_factors");
                }}
              >
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select...</SelectItem>
                  {EDUCATION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Spouse&apos;s first official language (CLB)</Label>
              <Select
                value={input.spouse.first_official_language.reading_clb === CLB_SELECT ? "select" : String(input.spouse.first_official_language.reading_clb)}
                onValueChange={(v) => {
                  const clb = v === "select" ? CLB_SELECT : Number(v);
                  updateInput({
                    spouse: {
                      ...input.spouse!,
                      first_official_language: defaultLanguageScores(clb),
                    },
                  });
                  handleStepChange("spouse_factors");
                }}
              >
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select...</SelectItem>
                  {CLB_SECOND_LANG_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-primary block leading-relaxed">
                12) In the last 10 years, how many years of skilled work experience in Canada does your spouse/common-law partner have?
              </Label>
              <p className="text-sm text-muted-foreground">
                It must have been paid, full-time (or an equal amount in part-time), and in one or more NOC TEER category 0, 1, 2, or 3 jobs.
              </p>
              <Select
                value={input.spouse.canadian_work_experience_years === WORK_SELECT ? "select" : String(Math.min(Math.floor(input.spouse.canadian_work_experience_years), 5))}
                onValueChange={(v) => {
                  updateInput({
                    spouse: {
                      ...input.spouse!,
                      canadian_work_experience_years: v === "select" ? WORK_SELECT : Number(v),
                    },
                  });
                  handleStepChange("spouse_factors");
                }}
              >
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select...</SelectItem>
                  {CANADIAN_WORK_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        {step === "trade_certificate" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              7) Do you have a certificate of qualification from a Canadian province, territory or federal body?
            </Label>
            <p className="text-sm text-muted-foreground mt-2 mb-2">
              A certificate lets people work in some skilled trades in Canada. This isn&apos;t the same as a provincial nomination.
            </p>
            <Select
              value={tradeCertificateAnswer}
              onValueChange={(v: "select" | "yes" | "no") => {
                setTradeCertificateAnswer(v);
                updateInput({ has_trade_certificate_of_qualification: v === "yes" });
                handleStepChange("trade_certificate");
              }}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "job_offer" && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary block leading-relaxed">
              8) Do you have a valid job offer supported by a Labour Market Impact Assessment (if needed)?
            </Label>
            <p className="text-sm text-muted-foreground mt-2 mb-2">
              Must be full-time, in a skilled job (NOC TEER 0–3), supported by LMIA or exempt, for one year from PR.
            </p>
            <Select
              value={jobOfferAnswer}
              onValueChange={(v: "select" | "yes" | "no") => {
                setJobOfferAnswer(v);
                updateInput({ has_valid_job_offer: v === "yes" });
                handleStepChange("job_offer");
              }}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "nomination" && (
          <div className="space-y-4">
            <span className="text-sm text-muted-foreground font-medium">Additional Points</span>
            <Label className="text-lg font-semibold text-primary block mt-1 leading-relaxed">
              9) Do you have a nomination certificate from a province or territory?
            </Label>
            <Select
              value={nominationAnswer}
              onValueChange={(v: "select" | "yes" | "no") => {
                setNominationAnswer(v);
                updateInput({ has_provincial_nomination: v === "yes" });
                handleStepChange("nomination");
              }}
            >
              <SelectTrigger className="mt-1 h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {step === "sibling" && (
          <div className="space-y-4">
            <span className="text-sm text-muted-foreground font-medium">Additional Points</span>
            <Label className="text-lg font-semibold text-primary block mt-1 leading-relaxed">
              10) Do you or your spouse have at least one brother or sister living in Canada who is a citizen or permanent resident?
            </Label>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Must be 18+, related by blood, marriage, common-law or adoption, with a parent in common.
            </p>
            <Select
              value={siblingAnswer}
              onValueChange={(v: "select" | "yes" | "no") => {
                setSiblingAnswer(v);
                updateInput({ has_sibling_in_canada: v === "yes" });
                handleStepChange("sibling");
              }}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <p className="text-muted-foreground text-base leading-relaxed">
          Calculate your Comprehensive Ranking System score for Express Entry.
        </p>
      </div>

      <form
        className="space-y-8"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-end text-sm text-muted-foreground">
          <div className="flex gap-1">
            {visibleSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i <= answeredStepIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-8 pt-8 space-y-8">
            {visibleSteps.slice(0, stepIndex + 1).map((stepId, idx) => (
              <div key={stepId}>
                {idx > 0 && <Separator className="my-8" />}
                <StepFormContent formStepId={stepId} />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="button" onClick={handleCalculate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate CRS Score
                </>
              )}
            </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </form>

      {result && (
        <Card className="border-primary/50" translate="no">
          <CardHeader>
            <CardTitle>Your CRS Score</CardTitle>
            <CardDescription>Comprehensive Ranking System breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-xs text-muted-foreground">
              This is an estimate only. Official CRS scores are determined by IRCC. Always verify with
              official sources.
            </p>
            <div className="text-center">
              <p className="text-5xl font-bold text-primary">{result.total_crs}</p>
              <p className="text-sm text-muted-foreground mt-1">Total points</p>
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  disabled={saving || !lastSanitizedInputRef.current}
                  onClick={async () => {
                    const sanitized = lastSanitizedInputRef.current;
                    if (!sanitized || !result) return;
                    setSaving(true);
                    const { error: saveError } = await saveCrsScore(user.uid, sanitized, result);
                    setSaving(false);
                    if (saveError) {
                      toast({
                        variant: "destructive",
                        title: "Failed to save",
                        description: saveError,
                      });
                    } else {
                      toast({
                        title: "Saved to profile",
                        description: "Your CRS score has been saved to your profile.",
                      });
                    }
                  }}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save to profile
                </Button>
              )}
            </div>

            <Separator />

            <div className="space-y-4 text-sm" translate="no">
              <h4 className="font-medium">Component breakdown</h4>

              {/* A. Core human capital */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>A. Core human capital</span>
                  <span>{result.components.core_human_capital}</span>
                </div>
                <div className="ml-4 grid gap-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Age</span>
                    <span>{result.details.age_core}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Education</span>
                    <span>{result.details.education_core}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>First official language</span>
                    <span>{result.details.first_language_core}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Second official language</span>
                    <span>{result.details.second_language_core}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Canadian work experience</span>
                    <span>{result.details.canadian_work_core}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* B. Spouse factors */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>B. Spouse factors</span>
                  <span>{result.components.spouse_factors}</span>
                </div>
                <div className="ml-4 grid gap-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Spouse education</span>
                    <span>{result.details.spouse_education}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spouse language</span>
                    <span>{result.details.spouse_language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spouse Canadian work</span>
                    <span>{result.details.spouse_canadian_work}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* C. Skill transferability (education = edu+lang + edu+CA work; foreign = foreign+lang + foreign+CA work; total max 100) */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>C. Skill transferability</span>
                  <span>{result.components.skill_transferability}</span>
                </div>
                <div className="ml-4 grid gap-1 text-muted-foreground">
                  <div className="flex justify-between font-medium">
                    <span>Education (max 50)</span>
                    <span>{result.details.transfer_education}</span>
                  </div>
                  <div className="ml-2 flex justify-between text-muted-foreground">
                    <span>Education + language</span>
                    <span>{result.details.transfer_edu_language}</span>
                  </div>
                  <div className="ml-2 flex justify-between text-muted-foreground">
                    <span>Education + Canadian work</span>
                    <span>{result.details.transfer_edu_canadian_work}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Foreign work (max 50)</span>
                    <span>{result.details.transfer_foreign_work}</span>
                  </div>
                  <div className="ml-2 flex justify-between text-muted-foreground">
                    <span>Foreign work + language</span>
                    <span>{result.details.transfer_foreign_language}</span>
                  </div>
                  <div className="ml-2 flex justify-between text-muted-foreground">
                    <span>Foreign work + Canadian work</span>
                    <span>{result.details.transfer_foreign_canadian_work}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trade certificate (max 50)</span>
                    <span>{result.details.transfer_trade_certificate}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* D. Additional points */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>D. Additional points</span>
                  <span>{result.components.additional_points}</span>
                </div>
                <div className="ml-4 grid gap-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Sibling in Canada</span>
                    <span>{result.details.additional_sibling}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>French language bonus</span>
                    <span>{result.details.additional_french}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Education in Canada</span>
                    <span>{result.details.additional_education_canada}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provincial nomination</span>
                    <span>{result.details.additional_pnp}</span>
                  </div>
                </div>
              </div>
            </div>

            <Collapsible className="mt-4">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <ChevronDown className="h-4 w-4" />
                Advanced: See how different language scores would affect your CRS
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4 space-y-4 rounded-lg border bg-muted/30 p-4">
                  {(() => {
                    const testType = firstLangTestType === "select" ? "ielts" : firstLangTestType;
                    const baseScores: TestScores =
                      hypotheticalTestScores ??
                      (testType === "ielts" && ieltsScores && (ieltsScores.speaking > 0 || ieltsScores.listening > 0 || ieltsScores.reading > 0 || ieltsScores.writing > 0)
                        ? ieltsScores
                        : testType === "celpip_g" && celpipScores && (celpipScores.speaking > 0 || celpipScores.listening > 0 || celpipScores.reading > 0 || celpipScores.writing > 0)
                          ? celpipScores
                          : testType === "pte_core" && pteScores && (pteScores.speaking > 0 || pteScores.listening > 0 || pteScores.reading > 0 || pteScores.writing > 0)
                            ? pteScores
                            : testType === "tef_canada" && tefScores && (tefScores.speaking > 0 || tefScores.listening > 0 || tefScores.reading > 0 || tefScores.writing > 0)
                              ? tefScores
                              : testType === "tcf_canada" && tcfScores && (tcfScores.speaking > 0 || tcfScores.listening > 0 || tcfScores.reading > 0 || tcfScores.writing > 0)
                                ? tcfScores
                                : (() => {
                                    const fl = input.first_official_language;
                                    const norm = (c: number) => (c === CLB_SELECT || c < 4 ? 7 : Math.min(c, 10));
                                    return {
                                      speaking: norm(fl?.speaking_clb ?? 7),
                                      listening: norm(fl?.listening_clb ?? 7),
                                      reading: norm(fl?.reading_clb ?? 7),
                                      writing: norm(fl?.writing_clb ?? 7),
                                    };
                                  })());
                    const getOptions = (mod: "speaking" | "listening" | "reading" | "writing") => {
                      if (testType === "ielts") return IELTS_BAND_OPTIONS;
                      if (testType === "celpip_g") return CELPIP_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
                      if (testType === "pte_core") return PTE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
                      if (testType === "tef_canada") {
                        if (mod === "speaking") return TEF_SPEAKING_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
                        if (mod === "listening") return TEF_LISTENING_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
                        if (mod === "reading") return TEF_READING_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
                        return TEF_WRITING_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
                      }
                      if (testType === "tcf_canada") {
                        if (mod === "speaking" || mod === "writing") return TCF_SW_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
                        if (mod === "listening") return TCF_LISTENING_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
                        return TCF_READING_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
                      }
                      return CLB_SIMULATOR_OPTIONS;
                    };
                    const displayScores = baseScores;
                    const displayLang = testScoresToClb(testType, displayScores);
                    return (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Enter hypothetical {testType === "ielts" ? "IELTS" : testType === "celpip_g" ? "CELPIP" : testType === "pte_core" ? "PTE Core" : testType === "tef_canada" ? "TEF Canada" : testType === "tcf_canada" ? "TCF Canada" : "CLB"} scores to see how your CRS would change. Save a hypothetical score separately—it appears in its own card on your dashboard with the language breakdown (e.g. L:8 R:7 S:6 W:8), without overwriting your current score.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(["speaking", "listening", "reading", "writing"] as const).map((mod) => {
                          const options = getOptions(mod);
                          return (
                            <div key={mod}>
                              <Label className="text-xs">{mod.charAt(0).toUpperCase() + mod.slice(1)}</Label>
                              <Select
                                value={displayScores[mod] > 0 ? String(displayScores[mod]) : "select"}
                                onValueChange={(v) => {
                                  const val = v === "select" ? 0 : Number(v);
                                  setHypotheticalTestScores((prev) => ({
                                    ...(prev ?? baseScores),
                                    [mod]: val,
                                  }));
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="select">Select...</SelectItem>
                                  {options.map((o) => (
                                    <SelectItem key={o.value} value={String(o.value)}>
                                      {o.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>
                      {displayScores.speaking > 0 || displayScores.listening > 0 || displayScores.reading > 0 || displayScores.writing > 0 ? (
                        <div className="rounded border bg-background/50 p-2 text-xs text-muted-foreground">
                          <span className="font-medium">Calculated CLB: </span>
                          Speaking {displayLang.speaking_clb}, Listening {displayLang.listening_clb}, Reading {displayLang.reading_clb}, Writing {displayLang.writing_clb}
                        </div>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        {[7, 8, 9, 10].map((clb) => (
                          <Button
                            key={clb}
                            variant="outline"
                            size="sm"
                            onClick={() => setHypotheticalTestScores(getTestScoresForClb(testType, clb))}
                          >
                            All CLB {clb}
                          </Button>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setHypotheticalTestScores(null)}
                        >
                          Reset to current
                        </Button>
                      </div>
                      {(() => {
                        const sanitized: CrsInput = {
                          ...input,
                          age: input.age === AGE_SELECT ? 30 : input.age,
                          education_level:
                            (input.education_level as string) === "select"
                              ? "bachelor_or_3plus_year"
                              : input.education_level,
                          first_official_language: displayLang,
                          canadian_work_experience_years:
                            input.canadian_work_experience_years === WORK_SELECT
                              ? 0
                              : input.canadian_work_experience_years,
                          foreign_work_experience_years:
                            input.foreign_work_experience_years === WORK_SELECT
                              ? 0
                              : input.foreign_work_experience_years,
                          spouse: input.spouse
                            ? {
                                ...input.spouse,
                                education_level:
                                  (input.spouse.education_level as string) === "select"
                                    ? "bachelor_or_3plus_year"
                                    : input.spouse.education_level,
                                first_official_language:
                                  input.spouse.first_official_language.reading_clb === CLB_SELECT
                                    ? defaultLanguageScores(7)
                                    : input.spouse.first_official_language,
                                canadian_work_experience_years:
                                  input.spouse.canadian_work_experience_years === WORK_SELECT
                                    ? 0
                                    : input.spouse.canadian_work_experience_years,
                              }
                            : input.spouse,
                        };
                        const hypoResult = calculateCrs(sanitized);
                        const diff = hypoResult.total_crs - (result?.total_crs ?? 0);
                        const hasAllScores = displayScores.speaking > 0 && displayScores.listening > 0 && displayScores.reading > 0 && displayScores.writing > 0;
                        const formatScore = (v: number) => (v % 1 === 0 ? String(v) : v.toFixed(1));
                        const langLabel = `L:${formatScore(displayScores.listening)} R:${formatScore(displayScores.reading)} S:${formatScore(displayScores.speaking)} W:${formatScore(displayScores.writing)}`;
                        const testName = testType === "ielts" ? "IELTS" : testType === "celpip_g" ? "CELPIP" : testType === "pte_core" ? "PTE" : testType === "tef_canada" ? "TEF" : testType === "tcf_canada" ? "TCF" : "CLB";
                        return (
                          <div className="space-y-3">
                            <div className="text-sm font-medium">
                              <span className="text-muted-foreground">With these scores, your CRS would be: </span>
                              <span className="text-primary">{hypoResult.total_crs}</span>
                              {diff !== 0 && (
                                <span className={diff > 0 ? "text-green-600" : "text-destructive"}>
                                  {" "}
                                  ({diff > 0 ? "+" : ""}
                                  {diff} pts)
                                </span>
                              )}
                            </div>
                            {hasAllScores && (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {testName} {langLabel}
                                </span>
                                {user && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={saving}
                                    onClick={async () => {
                                      setSaving(true);
                                      const { error: saveError } = await saveHypotheticalCrsScore(
                                        user.uid,
                                        sanitized,
                                        hypoResult,
                                        `${testName} ${langLabel}`
                                      );
                                      setSaving(false);
                                      if (saveError) {
                                        toast({
                                          variant: "destructive",
                                          title: "Failed to save",
                                          description: saveError,
                                        });
                                      } else {
                                        toast({
                                          title: "Hypothetical score saved",
                                          description: `Shown separately on your dashboard (${testName} ${langLabel}).`,
                                        });
                                      }
                                    }}
                                  >
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save as hypothetical
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                    );
                  })()}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
