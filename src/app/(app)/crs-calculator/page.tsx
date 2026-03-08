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
import { Calculator, Loader2, AlertCircle } from "lucide-react";
import {
  calculateCrs,
  type CrsInput,
  type CrsOutput,
  type EducationLevel,
  type LanguageScores,
} from "@/lib/crs";

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
  | "second_lang_test"
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
  const [secondLangTestType, setSecondLangTestType] = useState<"select" | "celpip_g" | "ielts" | "pte_core" | "tef_canada" | "tcf_canada" | "not_applicable">("select");
  const [tradeCertificateAnswer, setTradeCertificateAnswer] = useState<"select" | "yes" | "no">("select");
  const [jobOfferAnswer, setJobOfferAnswer] = useState<"select" | "yes" | "no">("select");
  const [nominationAnswer, setNominationAnswer] = useState<"select" | "yes" | "no">("select");
  const [siblingAnswer, setSiblingAnswer] = useState<"select" | "yes" | "no">("select");
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<CrsOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    else if (firstLangTestType !== "select") steps.push("first_lang_clb");
    if (firstLangTestType !== "select") steps.push("second_lang_test");
    if (secondLangTestType !== "select" && secondLangTestType !== "not_applicable") steps.push("second_lang_clb");
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
  useEffect(() => {
    const newLength = visibleSteps.length;
    const prevLength = prevStepsLengthRef.current;
    prevStepsLengthRef.current = newLength;

    setStepIndex((prev) => {
      const maxIdx = Math.max(0, newLength - 1);
      if (newLength > prevLength) {
        // Steps added (e.g. conditional 4c appeared): show all steps so other answers stay visible
        return maxIdx;
      }
      // Steps removed: clamp to valid range
      return Math.min(prev, maxIdx);
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
    } else if (idx === stepIndex) {
      // Answering current step: advance to next
      setStepIndex((i) => Math.min(i + 1, visibleSteps.length - 1));
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
            <Select
              value={firstLangTestType}
              onValueChange={(v: "select" | "celpip_g" | "ielts" | "pte_core" | "tef_canada" | "tcf_canada") => {
                setFirstLangTestType(v);
                if (v !== "ielts") setIeltsScores(null);
                if (v !== "celpip_g") setCelpipScores(null);
                if (v !== "pte_core") setPteScores(null);
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
                  i <= stepIndex ? "bg-primary" : "bg-muted"
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
            <div className="text-center">
              <p className="text-5xl font-bold text-primary">{result.total_crs}</p>
              <p className="text-sm text-muted-foreground mt-1">Total points</p>
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

            <p className="text-xs text-muted-foreground">
              This is an estimate only. Official CRS scores are determined by IRCC. Always verify with
              official sources.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
