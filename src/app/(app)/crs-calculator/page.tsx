"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type {
  CrsInput,
  CrsOutput,
  EducationLevel,
  LanguageScores,
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

const defaultLanguageScores = (clb: number): LanguageScores => ({
  reading_clb: clb,
  writing_clb: clb,
  speaking_clb: clb,
  listening_clb: clb,
});

const defaultCrsInput: CrsInput = {
  has_spouse: false,
  age: 30,
  education_level: "bachelor_or_3plus_year",
  first_official_language: defaultLanguageScores(7),
  second_official_language: null,
  canadian_work_experience_years: 0,
  foreign_work_experience_years: 0,
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

export default function CrsCalculatorPage() {
  const [input, setInput] = useState<CrsInput>(defaultCrsInput);
  const [maritalStatus, setMaritalStatus] = useState("");
  const [spouseCanadian, setSpouseCanadian] = useState<boolean | null>(null);
  const [educationInCanadaAnswer, setEducationInCanadaAnswer] = useState<"select" | "yes" | "no">("select");
  const [educationInCanadaLevel, setEducationInCanadaLevel] = useState<"select" | "secondary" | "one_two_year" | "three_plus_year">("select");
  const [firstLangTestRecent, setFirstLangTestRecent] = useState<"select" | "yes" | "no">("select");
  const [firstLangTestType, setFirstLangTestType] = useState<"select" | "celpip_g" | "ielts" | "pte_core" | "tef_canada" | "tcf_canada">("select");
  const [secondLangTestType, setSecondLangTestType] = useState<"select" | "celpip_g" | "ielts" | "pte_core" | "tef_canada" | "tcf_canada" | "not_applicable">("select");
  const [tradeCertificateAnswer, setTradeCertificateAnswer] = useState<"select" | "yes" | "no">("select");
  const [jobOfferAnswer, setJobOfferAnswer] = useState<"select" | "yes" | "no">("select");
  const [nominationAnswer, setNominationAnswer] = useState<"select" | "yes" | "no">("select");
  const [siblingAnswer, setSiblingAnswer] = useState<"select" | "yes" | "no">("select");
  const [result, setResult] = useState<CrsOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateInput = (partial: Partial<CrsInput>) => {
    setInput((prev) => ({ ...prev, ...partial }));
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/crs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        return;
      }

      setResult(data as CrsOutput);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-8 w-8" />
          CRS Calculator
        </h1>
        <p className="text-muted-foreground mt-1">
          Calculate your Comprehensive Ranking System score for Express Entry.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* A. Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>A. Core / Human Capital</CardTitle>
            <CardDescription>Age and marital status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="marital_status" className="text-base font-semibold text-primary">
                1) What is your marital status?
              </Label>
              <Select
                value={maritalStatus}
                onValueChange={(v) => {
                  setMaritalStatus(v);
                  const option = MARITAL_STATUS_OPTIONS.find((o) => o.value === v);
                  const hasSpouse = option?.hasSpouse ?? false;
                  if (!hasSpouse) setSpouseCanadian(null);
                  updateInput({
                    has_spouse: hasSpouse,
                    spouse_is_canadian_pr_or_citizen: undefined,
                    spouse: hasSpouse
                      ? {
                          education_level: "bachelor_or_3plus_year",
                          first_official_language: defaultLanguageScores(7),
                          canadian_work_experience_years: 0,
                        }
                      : null,
                  });
                  setResult(null);
                  setError(null);
                }}
              >
                <SelectTrigger id="marital_status" className="mt-2">
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

            {input.has_spouse && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-base font-semibold text-primary">
                  2) Is your spouse or common-law partner a citizen or permanent resident of Canada?
                </Label>
                <RadioGroup
                  value={spouseCanadian === null ? "" : spouseCanadian ? "yes" : "no"}
                  onValueChange={(v) => {
                    const val = v === "yes";
                    setSpouseCanadian(val);
                    updateInput({ spouse_is_canadian_pr_or_citizen: val });
                  }}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="spouse_canadian_yes" />
                    <Label htmlFor="spouse_canadian_yes" className="font-normal cursor-pointer">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="spouse_canadian_no" />
                    <Label htmlFor="spouse_canadian_no" className="font-normal cursor-pointer">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="age" className="text-base font-semibold text-primary">
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
                value={String(input.age)}
                onValueChange={(v) => updateInput({ age: Number(v) })}
              >
                <SelectTrigger id="age" className="mt-2">
                  <SelectValue placeholder="Select your age..." />
                </SelectTrigger>
                <SelectContent>
                  {AGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Q.4 Education */}
        <Card>
          <CardHeader>
            <CardTitle>4) What is your level of education?</CardTitle>
            <CardDescription>
              Enter the highest level of education for which you:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>earned a <strong>Canadian degree, diploma or certificate</strong> or</li>
              <li>had an Educational Credential Assessment (ECA) if you did your study outside Canada. (ECAs must be from an approved agency, in the last five years)</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> A Canadian degree, diploma or certificate must either have been earned at an accredited Canadian university, college, trade or technical school, or other institute in Canada. Distance learning counts for education points, but not for bonus points in your profile or application.
            </p>
            <Select
              value={input.education_level}
              onValueChange={(v) => updateInput({ education_level: v as EducationLevel })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-4 pt-6 border-t">
              <Label className="text-base font-semibold text-primary">
                4b) Have you earned a Canadian degree, diploma or certificate?
              </Label>
              <p className="text-sm text-muted-foreground">
                <strong>Note: to answer yes:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>English or French as a Second Language must not have made up more than half your study</li>
                <li>you must not have studied under an award that required you to return to your home country after graduation to apply your skills and knowledge</li>
                <li>you must have studied at a school within Canada (foreign campuses don&apos;t count)</li>
                <li>you had to be enrolled full time for at least eight months, unless you completed the study or training program (in whole or in part) <strong>between March 2020 and August 2022</strong></li>
                <li>you had to have been physically present in Canada for at least eight months, unless you completed the study or training program (in whole or in part) <strong>between March 2020 and August 2022</strong></li>
              </ul>
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
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select...</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
              {educationInCanadaAnswer === "yes" && (
                <div className="pt-4 space-y-2">
                  <Label className="text-base font-semibold text-primary">
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
                    }}
                  >
                    <SelectTrigger>
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
            </div>
          </CardContent>
        </Card>

        {/* Q.5 Official languages */}
        <Card>
          <CardHeader>
            <CardTitle>5) Official languages</CardTitle>
            <CardDescription>
              Canada&apos;s official languages are English and French.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              You need to submit language test results that are less than two years old for all programs under Express Entry, even if English or French is your first language.
            </p>

            <div>
              <Label className="text-base font-semibold text-primary">
                i. Are your test results less than two years old?
              </Label>
              <Select
                value={firstLangTestRecent}
                onValueChange={(v: "select" | "yes" | "no") => {
                  setFirstLangTestRecent(v);
                  updateInput({
                    first_language_test_less_than_two_years: v === "yes",
                  });
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select...</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {firstLangTestRecent === "yes" && (
              <>
                <div>
                  <Label className="text-base font-semibold text-primary">
                    ii. Which language test did you take for your first official language?
                  </Label>
                  <Select
                    value={firstLangTestType}
                onValueChange={(v: "select" | "celpip_g" | "ielts" | "pte_core" | "tef_canada" | "tcf_canada") => {
                  setFirstLangTestType(v);
                  if (v === "select") setSecondLangTestType("select");
                  updateInput({
                    first_language_test_type: v === "select" ? undefined : v,
                    second_official_language: v === "select" ? null : input.second_official_language,
                  });
                }}
                  >
                    <SelectTrigger className="mt-2">
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

                {firstLangTestType !== "select" && (
                  <>
                    <div>
                      <Label className="text-base font-semibold text-primary">
                        Enter your test scores:
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        CLB level — same for all abilities (reading, writing, speaking, listening)
                      </p>
                      <Select
                        value={String(input.first_official_language.reading_clb)}
                        onValueChange={(v) => {
                          const clb = Number(v);
                          updateInput({ first_official_language: defaultLanguageScores(clb) });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select CLB level..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CLB_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={String(o.value)}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-base font-semibold text-primary">
                        iii. Do you have other language results?
                      </Label>
                      <p className="text-sm text-muted-foreground mb-1">
                        If so, which language test did you take for your second official language?
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Test results must be less than two years old.
                      </p>
                      <Select
                        value={secondLangTestType}
                        onValueChange={(v: "select" | "celpip_g" | "ielts" | "pte_core" | "tef_canada" | "tcf_canada" | "not_applicable") => {
                          setSecondLangTestType(v);
                          updateInput({
                            second_official_language: v === "not_applicable" || v === "select" ? null : defaultLanguageScores(5),
                          });
                        }}
                      >
                        <SelectTrigger className="mt-2">
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
                      {secondLangTestType !== "select" && secondLangTestType !== "not_applicable" && (
                        <div className="mt-4">
                          <Label>Enter your second language test scores (CLB level)</Label>
                          <Select
                            value={String(input.second_official_language?.reading_clb ?? 5)}
                            onValueChange={(v) => {
                              const clb = Number(v);
                              updateInput({
                                second_official_language: defaultLanguageScores(clb),
                              });
                            }}
                          >
                            <SelectTrigger className="mt-2">
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
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Q.6 Work Experience */}
        <Card>
          <CardHeader>
            <CardTitle>6) Work Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-semibold text-primary">
                i. In the last 10 years, how many years of skilled work experience in Canada do you have?
              </Label>
              <p className="text-sm text-muted-foreground mt-2 mb-2">
                Skilled work experience must be paid, full-time (or equivalent part-time), physically in Canada, for a Canadian employer (including remote work), and in NOC TEER 0, 1, 2, or 3 category jobs.{" "}
                <a
                  href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/find-noc-occupation.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  find your NOC
                </a>
              </p>
              <Select
                value={String(input.canadian_work_experience_years)}
                onValueChange={(v) =>
                  updateInput({ canadian_work_experience_years: Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None or less than a year</SelectItem>
                  <SelectItem value="1">1 year</SelectItem>
                  <SelectItem value="2">2 years</SelectItem>
                  <SelectItem value="3">3 years</SelectItem>
                  <SelectItem value="4">4 years</SelectItem>
                  <SelectItem value="5">5 years or more</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-semibold text-primary">
                ii. In the last 10 years, how many total years of foreign skilled work experience do you have?
              </Label>
              <p className="text-sm text-muted-foreground mt-2 mb-2">
                It must have been paid, full-time (or an equal amount in part-time), and in only one occupation (NOC TEER category 0, 1, 2 or 3).
              </p>
              <Select
                value={String(Math.min(input.foreign_work_experience_years, 3))}
                onValueChange={(v) =>
                  updateInput({ foreign_work_experience_years: Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None or less than a year</SelectItem>
                  <SelectItem value="1">1 year</SelectItem>
                  <SelectItem value="2">2 years</SelectItem>
                  <SelectItem value="3">3 years or more</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* B. Spouse factors */}
        {input.has_spouse && input.spouse && (
          <Card>
            <CardHeader>
              <CardTitle>B. Spouse or common-law partner factors</CardTitle>
              <CardDescription>Education, language, and Canadian work experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Spouse&apos;s level of education</Label>
                <Select
                  value={input.spouse.education_level}
                  onValueChange={(v) =>
                    updateInput({
                      spouse: {
                        ...input.spouse!,
                        education_level: v as EducationLevel,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                  value={String(input.spouse.first_official_language.reading_clb)}
                  onValueChange={(v) => {
                    const clb = Number(v);
                    updateInput({
                      spouse: {
                        ...input.spouse!,
                        first_official_language: defaultLanguageScores(clb),
                      },
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <div>
                <Label>Spouse&apos;s Canadian work experience (years)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={input.spouse.canadian_work_experience_years}
                  onChange={(e) =>
                    updateInput({
                      spouse: {
                        ...input.spouse!,
                        canadian_work_experience_years: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Q.7 Certificate of qualification */}
        <Card>
          <CardHeader>
            <CardTitle>7) Do you have a certificate of qualification from a Canadian province, territory or federal body?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Note:</strong> A certificate of qualification lets people work in some skilled trades in Canada. Only the provinces, territories and a federal body can issue these certificates. To get one, a person must have them assess their training, trade experience and skills and then pass a certification exam. People usually have to go to the province or territory to be assessed. They may also need experience and training from an employer in Canada. This isn&apos;t the same as a nomination from a province or territory.
              </p>
              <Select
                value={tradeCertificateAnswer}
                onValueChange={(v: "select" | "yes" | "no") => {
                  setTradeCertificateAnswer(v);
                  updateInput({ has_trade_certificate_of_qualification: v === "yes" });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select...</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Q.8 Job offer */}
        <Card>
          <CardHeader>
            <CardTitle>8) Do you have a valid job offer supported by a Labour Market Impact Assessment (if needed)?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>A valid job offer must be</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-2">
                <li>full-time</li>
                <li>in a skilled job listed as TEER 0, 1, 2 or 3 in the 2021{" "}
                  <a
                    href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/find-noc-occupation.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    National Occupational Classification
                  </a>
                </li>
                <li>supported by a Labour Market Impact Assessment (LMIA) or exempt from needing one</li>
                <li>for one year from the time you become a permanent resident</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>A job offer isn&apos;t valid if your employer is:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-2">
                <li>an embassy, high commission or consulate in Canada or</li>
                <li>on the list of ineligible employers.</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-4">
                Whether an offer is valid or not also depends on different factors, depending on your case. See a{" "}
                <a
                  href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/valid-job-offer.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  full list of criteria for valid job offers
                </a>
                .
              </p>
              <Select
                value={jobOfferAnswer}
                onValueChange={(v: "select" | "yes" | "no") => {
                  setJobOfferAnswer(v);
                  updateInput({ has_valid_job_offer: v === "yes" });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select...</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Q.9 Provincial nomination - Additional Points */}
        <Card className="relative pt-8">
          <span className="absolute top-3 left-4 text-xs text-muted-foreground font-medium">
            Additional Points
          </span>
          <CardHeader className="pb-2">
            <CardTitle>9) Do you have a nomination certificate from a province or territory?</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={nominationAnswer}
              onValueChange={(v: "select" | "yes" | "no") => {
                setNominationAnswer(v);
                updateInput({ has_provincial_nomination: v === "yes" });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select...</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Q.10 Sibling in Canada - Additional Points */}
        <Card className="relative pt-8">
          <span className="absolute top-3 left-4 text-xs text-muted-foreground font-medium">
            Additional Points
          </span>
          <CardHeader className="pb-2">
            <CardTitle>10) Do you or your spouse or common-law partner (if they will come with you to Canada) have at least one brother or sister living in Canada who is a citizen or permanent resident?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Note: to answer yes, the brother or sister must be:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-2">
                <li>18 years old or older</li>
                <li>related to you or your partner by blood, marriage, common-law partnership or adoption</li>
                <li>have a parent in common with you or your partner</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>A brother or sister is related to you by:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                <li>blood (biological)</li>
                <li>adoption</li>
                <li>marriage (step-brother or step-sister)</li>
              </ul>
              <Select
                value={siblingAnswer}
                onValueChange={(v: "select" | "yes" | "no") => {
                  setSiblingAnswer(v);
                  updateInput({ has_sibling_in_canada: v === "yes" });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select...</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading}>
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
      </form>

      {result && (
        <Card className="border-primary/50">
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

            <div className="space-y-3">
              <h4 className="font-medium">Component breakdown</h4>
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">A. Core human capital</span>
                  <span className="font-semibold">{result.components.core_human_capital}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">B. Spouse factors</span>
                  <span className="font-semibold">{result.components.spouse_factors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">C. Skill transferability</span>
                  <span className="font-semibold">{result.components.skill_transferability}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">D. Additional points</span>
                  <span className="font-semibold">{result.components.additional_points}</span>
                </div>
              </div>
            </div>

            <Separator />

            <details className="text-sm">
              <summary className="cursor-pointer font-medium">Detailed breakdown</summary>
              <div className="mt-3 grid grid-cols-2 gap-2 text-muted-foreground">
                {Object.entries(result.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key.replace(/_/g, " ")}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </details>

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
