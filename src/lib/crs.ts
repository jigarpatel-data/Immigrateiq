/**
 * CRS (Comprehensive Ranking System) Calculator for Express Entry
 * Based on official IRCC criteria: https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html
 */

export type EducationLevel =
  | "less_than_high_school"
  | "high_school"
  | "one_year_postsecondary"
  | "two_year_postsecondary"
  | "bachelor_or_3plus_year"
  | "two_or_more_postsecondary"
  | "masters_or_professional"
  | "phd";

/** CLB level per ability. For now, form uses single dropdown; all 4 set to same value. */
export type LanguageScores = {
  reading_clb: number;
  writing_clb: number;
  speaking_clb: number;
  listening_clb: number;
};

export type CrsInput = {
  has_spouse: boolean;
  age: number;
  education_level: EducationLevel;
  /** First official language - CLB per ability. Form can use single dropdown setting all 4. */
  first_official_language: LanguageScores;
  /** Form flow: Are first language test results less than 2 years old? */
  first_language_test_less_than_two_years?: boolean;
  /** Form flow: Which language test for first official language? */
  first_language_test_type?: "celpip_g" | "ielts" | "pte_core" | "tef_canada" | "tcf_canada";
  /** Second official language - optional. Null if not applicable. */
  second_official_language?: LanguageScores | null;
  canadian_work_experience_years: number;
  foreign_work_experience_years: number;
  /** If spouse is Canadian citizen/PR, they may not be included in application. Stored for form flow. */
  spouse_is_canadian_pr_or_citizen?: boolean;
  spouse?: {
    education_level: EducationLevel;
    first_official_language: LanguageScores;
    canadian_work_experience_years: number;
  } | null;
  has_trade_certificate_of_qualification: boolean;
  has_sibling_in_canada: boolean;
  /** French NCLC scores for additional points (D) */
  french: {
    nclc_reading: number;
    nclc_writing: number;
    nclc_speaking: number;
    nclc_listening: number;
  };
  education_in_canada: {
    has_credential: boolean;
    years_of_study: number;
  };
  has_provincial_nomination: boolean;
  /** Form flow: Valid job offer with LMIA (if needed). Job offer points removed from CRS in 2025. */
  has_valid_job_offer?: boolean;
};

export type CrsOutput = {
  total_crs: number;
  components: {
    core_human_capital: number;
    spouse_factors: number;
    skill_transferability: number;
    additional_points: number;
  };
  details: Record<string, number>;
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function floorYears(years: number): number {
  if (!Number.isFinite(years)) return 0;
  return Math.max(0, Math.floor(years));
}

/** Check if all 4 language abilities are >= minClb */
function allAbilitiesAtLeast(lang: LanguageScores, minClb: number): boolean {
  return (
    lang.reading_clb >= minClb &&
    lang.writing_clb >= minClb &&
    lang.speaking_clb >= minClb &&
    lang.listening_clb >= minClb
  );
}

/** Get language band for skill transferability: CLB 7+ (one under 9) = A, CLB 9+ all = B */
function getFirstLanguageBand(lang: LanguageScores): "none" | "clb7" | "clb9" {
  if (!allAbilitiesAtLeast(lang, 7)) return "none";
  if (allAbilitiesAtLeast(lang, 9)) return "clb9";
  return "clb7";
}

// ==================== A. CORE / HUMAN CAPITAL ====================

function scoreAge(age: number, hasSpouse: boolean): number {
  const a = clamp(age, 0, 100);
  const withSpouse: Record<number, number> = {
    17: 0, 18: 90, 19: 95, 20: 100, 21: 100, 22: 100, 23: 100, 24: 100,
    25: 100, 26: 100, 27: 100, 28: 100, 29: 100, 30: 95, 31: 90, 32: 85,
    33: 80, 34: 75, 35: 70, 36: 65, 37: 60, 38: 55, 39: 50, 40: 45,
    41: 35, 42: 25, 43: 15, 44: 5, 45: 0,
  };
  const withoutSpouse: Record<number, number> = {
    17: 0, 18: 99, 19: 105, 20: 110, 21: 110, 22: 110, 23: 110, 24: 110,
    25: 110, 26: 110, 27: 110, 28: 110, 29: 110, 30: 105, 31: 99, 32: 94,
    33: 88, 34: 83, 35: 77, 36: 72, 37: 66, 38: 61, 39: 55, 40: 50,
    41: 39, 42: 28, 43: 17, 44: 6, 45: 0,
  };
  const table = hasSpouse ? withSpouse : withoutSpouse;
  if (a <= 17) return 0;
  if (a >= 45) return 0;
  return table[a] ?? 0;
}

function scoreEducationCore(level: EducationLevel, hasSpouse: boolean): number {
  const withSpouse: Record<EducationLevel, number> = {
    less_than_high_school: 0,
    high_school: 28,
    one_year_postsecondary: 84,
    two_year_postsecondary: 91,
    bachelor_or_3plus_year: 112,
    two_or_more_postsecondary: 119,
    masters_or_professional: 126,
    phd: 140,
  };
  const withoutSpouse: Record<EducationLevel, number> = {
    less_than_high_school: 0,
    high_school: 30,
    one_year_postsecondary: 90,
    two_year_postsecondary: 98,
    bachelor_or_3plus_year: 120,
    two_or_more_postsecondary: 128,
    masters_or_professional: 135,
    phd: 150,
  };
  return hasSpouse ? withSpouse[level] : withoutSpouse[level];
}

/** Points per ability for first official language. Max 32 (spouse) or 34 (no spouse) per ability. */
function scoreFirstLanguagePerAbility(clb: number, hasSpouse: boolean): number {
  if (clb < 4) return 0;
  if (clb <= 5) return 6;
  if (clb === 6) return hasSpouse ? 8 : 9;
  if (clb === 7) return hasSpouse ? 16 : 17;
  if (clb === 8) return hasSpouse ? 22 : 23;
  if (clb === 9) return hasSpouse ? 29 : 31;
  return hasSpouse ? 32 : 34; // CLB 10+
}

/** Points per ability for second official language. Max 6 per ability. */
function scoreSecondLanguagePerAbility(clb: number): number {
  if (clb <= 4) return 0;
  if (clb <= 6) return 1;
  if (clb <= 8) return 3;
  return 6; // CLB 9+
}

function scoreCanadianWorkCore(years: number, hasSpouse: boolean): number {
  const y = floorYears(years);
  const withSpouse: Record<number, number> = {
    0: 0, 1: 35, 2: 46, 3: 56, 4: 63, 5: 70,
  };
  const withoutSpouse: Record<number, number> = {
    0: 0, 1: 40, 2: 53, 3: 64, 4: 72, 5: 80,
  };
  const table = hasSpouse ? withSpouse : withoutSpouse;
  const key = y >= 5 ? 5 : y;
  return table[key] ?? 0;
}

// ==================== B. SPOUSE FACTORS ====================

function scoreSpouseEducation(level: EducationLevel): number {
  const table: Record<EducationLevel, number> = {
    less_than_high_school: 0,
    high_school: 2,
    one_year_postsecondary: 6,
    two_year_postsecondary: 7,
    bachelor_or_3plus_year: 8,
    two_or_more_postsecondary: 9,
    masters_or_professional: 10,
    phd: 10,
  };
  return table[level];
}

/** Spouse language: max 5 per ability, 20 total */
function scoreSpouseLanguagePerAbility(clb: number): number {
  if (clb <= 4) return 0;
  if (clb <= 6) return 1;
  if (clb <= 8) return 3;
  return 5; // CLB 9+
}

function scoreSpouseCanadianWork(years: number): number {
  const y = floorYears(years);
  const table: Record<number, number> = {
    0: 0, 1: 5, 2: 7, 3: 8, 4: 9, 5: 10,
  };
  const key = y >= 5 ? 5 : y;
  return table[key] ?? 0;
}

// ==================== C. SKILL TRANSFERABILITY (Max 100) ====================

/** Education + language: Secondary=0, Post-sec 1yr/2yr/Bachelor's 3yr=13/25, Two or more/Master/PhD=25/50 */
function scoreTransferEducationLanguage(
  edu: EducationLevel,
  lang: LanguageScores
): number {
  const band = getFirstLanguageBand(lang);
  if (band === "none") return 0;

  const isSecondaryOrLess = edu === "less_than_high_school" || edu === "high_school";
  const isPostSecOneYearOrLonger =
    edu === "one_year_postsecondary" ||
    edu === "two_year_postsecondary" ||
    edu === "bachelor_or_3plus_year";
  const isTwoOrMoreOrHigher =
    edu === "two_or_more_postsecondary" ||
    edu === "masters_or_professional" ||
    edu === "phd";

  if (isSecondaryOrLess) return 0;
  if (isPostSecOneYearOrLonger) return band === "clb7" ? 13 : 25;
  if (isTwoOrMoreOrHigher) return band === "clb7" ? 25 : 50;
  return 0;
}

/** Education + Canadian work: same education categories, 1yr CA=13/25, 2+yr CA=25/50 */
function scoreTransferEducationCanadianWork(
  edu: EducationLevel,
  canadianYears: number
): number {
  const caYears = floorYears(canadianYears);
  const caBand = caYears >= 2 ? 2 : caYears >= 1 ? 1 : 0;
  if (caBand === 0) return 0;

  const isSecondaryOrLess = edu === "less_than_high_school" || edu === "high_school";
  const isPostSecOneYearOrLonger =
    edu === "one_year_postsecondary" ||
    edu === "two_year_postsecondary" ||
    edu === "bachelor_or_3plus_year";
  const isTwoOrMoreOrHigher =
    edu === "two_or_more_postsecondary" ||
    edu === "masters_or_professional" ||
    edu === "phd";

  if (isSecondaryOrLess) return 0;
  if (isPostSecOneYearOrLonger) return caBand === 1 ? 13 : 25;
  if (isTwoOrMoreOrHigher) return caBand === 1 ? 25 : 50;
  return 0;
}

/** Foreign work + language: 0yr=0, 1-2yr=13/25, 3+yr=25/50 */
function scoreTransferForeignWorkLanguage(
  foreignYears: number,
  lang: LanguageScores
): number {
  const band = getFirstLanguageBand(lang);
  if (band === "none") return 0;

  const fYears = floorYears(foreignYears);
  const fBand = fYears >= 3 ? 2 : fYears >= 1 ? 1 : 0;
  if (fBand === 0) return 0;

  if (fBand === 1) return band === "clb7" ? 13 : 25;
  return band === "clb7" ? 25 : 50;
}

/** Foreign work + Canadian work: 0yr=0, 1-2yr foreign + 1yr CA=13/25, 1-2yr + 2yr CA=25/50, 3+yr same */
function scoreTransferForeignWorkCanadianWork(
  foreignYears: number,
  canadianYears: number
): number {
  const fYears = floorYears(foreignYears);
  const caYears = floorYears(canadianYears);
  const fBand = fYears >= 3 ? 2 : fYears >= 1 ? 1 : 0;
  const caBand = caYears >= 2 ? 2 : caYears >= 1 ? 1 : 0;
  if (fBand === 0 || caBand === 0) return 0;

  if (fBand === 1) return caBand === 1 ? 13 : 25;
  return caBand === 1 ? 25 : 50;
}

/** Trade certificate + language: CLB 5+=25, CLB 7+=50 */
function scoreTransferTradeCertificate(
  hasCert: boolean,
  lang: LanguageScores
): number {
  if (!hasCert) return 0;
  if (!allAbilitiesAtLeast(lang, 5)) return 0;
  if (allAbilitiesAtLeast(lang, 7)) return 50;
  return 25;
}

// ==================== D. ADDITIONAL POINTS ====================

function scoreSibling(hasSibling: boolean): number {
  return hasSibling ? 15 : 0;
}

function scoreFrenchAdditional(
  french: CrsInput["french"],
  firstLang: LanguageScores
): number {
  const frenchAll7Plus =
    french.nclc_reading >= 7 &&
    french.nclc_writing >= 7 &&
    french.nclc_speaking >= 7 &&
    french.nclc_listening >= 7;
  if (!frenchAll7Plus) return 0;

  const englishAll4OrLess =
    firstLang.reading_clb <= 4 &&
    firstLang.writing_clb <= 4 &&
    firstLang.speaking_clb <= 4 &&
    firstLang.listening_clb <= 4;

  const englishAll5Plus =
    firstLang.reading_clb >= 5 &&
    firstLang.writing_clb >= 5 &&
    firstLang.speaking_clb >= 5 &&
    firstLang.listening_clb >= 5;

  if (englishAll4OrLess) return 25;
  if (englishAll5Plus) return 50;
  return 0;
}

function scoreEducationInCanada(eduCa: CrsInput["education_in_canada"]): number {
  if (!eduCa.has_credential) return 0;
  if (eduCa.years_of_study >= 3) return 30;
  if (eduCa.years_of_study >= 1) return 15;
  return 0;
}

function scorePNP(hasPNP: boolean): number {
  return hasPNP ? 600 : 0;
}

// ==================== MAIN CALCULATOR ====================

export function calculateCrs(input: CrsInput): CrsOutput {
  // Use "without spouse" grid when spouse is not accompanying (spouse_coming = No)
  // or when spouse is Canadian PR/citizen (not in application). Spouse data exists only when accompanying.
  const hasSpouse = !!input.has_spouse && !!input.spouse;

  // A. Core human capital
  const agePoints = scoreAge(input.age, hasSpouse);
  const eduCorePoints = scoreEducationCore(input.education_level, hasSpouse);

  const fl = input.first_official_language;
  const firstLangPoints = clamp(
    scoreFirstLanguagePerAbility(fl.reading_clb, hasSpouse) +
      scoreFirstLanguagePerAbility(fl.writing_clb, hasSpouse) +
      scoreFirstLanguagePerAbility(fl.speaking_clb, hasSpouse) +
      scoreFirstLanguagePerAbility(fl.listening_clb, hasSpouse),
    0,
    hasSpouse ? 128 : 136
  );

  let secondLangPoints = 0;
  if (input.second_official_language) {
    const sl = input.second_official_language;
    secondLangPoints = clamp(
      scoreSecondLanguagePerAbility(sl.reading_clb) +
        scoreSecondLanguagePerAbility(sl.writing_clb) +
        scoreSecondLanguagePerAbility(sl.speaking_clb) +
        scoreSecondLanguagePerAbility(sl.listening_clb),
      0,
      hasSpouse ? 22 : 24
    );
  }

  const caWorkPoints = scoreCanadianWorkCore(
    input.canadian_work_experience_years,
    hasSpouse
  );

  let coreHumanCapital =
    agePoints + eduCorePoints + firstLangPoints + secondLangPoints + caWorkPoints;
  coreHumanCapital = clamp(coreHumanCapital, 0, hasSpouse ? 460 : 500);

  // B. Spouse factors
  let spouseEduPoints = 0;
  let spouseLangPoints = 0;
  let spouseWorkPoints = 0;
  if (hasSpouse && input.spouse) {
    spouseEduPoints = scoreSpouseEducation(input.spouse.education_level);
    const sLang = input.spouse.first_official_language;
    spouseLangPoints = clamp(
      scoreSpouseLanguagePerAbility(sLang.reading_clb) +
        scoreSpouseLanguagePerAbility(sLang.writing_clb) +
        scoreSpouseLanguagePerAbility(sLang.speaking_clb) +
        scoreSpouseLanguagePerAbility(sLang.listening_clb),
      0,
      20
    );
    spouseWorkPoints = scoreSpouseCanadianWork(
      input.spouse.canadian_work_experience_years
    );
  }
  const spouseFactors = clamp(
    spouseEduPoints + spouseLangPoints + spouseWorkPoints,
    0,
    40
  );

  // C. Skill transferability (max 100)
  const eduLangTransfer = scoreTransferEducationLanguage(
    input.education_level,
    input.first_official_language
  );
  const eduCaWorkTransfer = scoreTransferEducationCanadianWork(
    input.education_level,
    input.canadian_work_experience_years
  );
  const foreignLangTransfer = scoreTransferForeignWorkLanguage(
    input.foreign_work_experience_years,
    input.first_official_language
  );
  const foreignCaWorkTransfer = scoreTransferForeignWorkCanadianWork(
    input.foreign_work_experience_years,
    input.canadian_work_experience_years
  );
  const tradeTransfer = scoreTransferTradeCertificate(
    input.has_trade_certificate_of_qualification,
    input.first_official_language
  );

  // Education = edu+language + edu+Canadian work (each sub-factor max 50)
  // Foreign work = foreign+language + foreign+Canadian work (each sub-factor max 50)
  const educationTransfer = eduLangTransfer + eduCaWorkTransfer;
  const foreignWorkTransfer = foreignLangTransfer + foreignCaWorkTransfer;
  let skillTransferability = educationTransfer + foreignWorkTransfer + tradeTransfer;
  skillTransferability = clamp(skillTransferability, 0, 100);

  // D. Additional points
  const siblingPoints = scoreSibling(input.has_sibling_in_canada);
  const frenchAdditional = scoreFrenchAdditional(input.french, input.first_official_language);
  const eduCanadaAdditional = scoreEducationInCanada(input.education_in_canada);
  const pnpPoints = scorePNP(input.has_provincial_nomination);

  const additionalPoints = clamp(
    siblingPoints + frenchAdditional + eduCanadaAdditional + pnpPoints,
    0,
    600
  );

  const total_crs =
    coreHumanCapital + spouseFactors + skillTransferability + additionalPoints;

  return {
    total_crs,
    components: {
      core_human_capital: coreHumanCapital,
      spouse_factors: spouseFactors,
      skill_transferability: skillTransferability,
      additional_points: additionalPoints,
    },
    details: {
      age_core: agePoints,
      education_core: eduCorePoints,
      first_language_core: firstLangPoints,
      second_language_core: secondLangPoints,
      canadian_work_core: caWorkPoints,
      spouse_education: spouseEduPoints,
      spouse_language: spouseLangPoints,
      spouse_canadian_work: spouseWorkPoints,
      transfer_edu_language: eduLangTransfer,
      transfer_edu_canadian_work: eduCaWorkTransfer,
      transfer_education: educationTransfer,
      transfer_foreign_language: foreignLangTransfer,
      transfer_foreign_canadian_work: foreignCaWorkTransfer,
      transfer_foreign_work: foreignWorkTransfer,
      transfer_trade_certificate: tradeTransfer,
      additional_sibling: siblingPoints,
      additional_french: frenchAdditional,
      additional_education_canada: eduCanadaAdditional,
      additional_pnp: pnpPoints,
    },
  };
}
