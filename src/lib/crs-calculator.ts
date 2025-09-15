
import { z } from 'zod';

// Schemas for input validation using Zod
const languageSchema = z.object({
  listening: z.number().min(0).max(12).default(0),
  reading: z.number().min(0).max(12).default(0),
  writing: z.number().min(0).max(12).default(0),
  speaking: z.number().min(0).max(12).default(0),
  points: z.number().default(0),
});

const educationLevels = [
  "Less than secondary school (high school)",
  "Secondary diploma (high school graduation)",
  "One-year degree, diploma or certificate",
  "Two-year program",
  "Bachelor's degree or three-year program",
  "Two or more certificates, diplomas, or degrees (one must be 3+ years)",
  "Master's degree or professional degree",
  "Doctoral level university degree (PhD)",
] as const;

export const CrsFactorsSchema = z.object({
  hasSpouse: z.boolean().default(false),
  age: z.object({ value: z.number().min(0).default(0), points: z.number().default(0) }),
  education: z.object({ value: z.enum(educationLevels).default(educationLevels[0]), points: z.number().default(0) }),
  canadianWorkExperience: z.object({ value: z.number().min(0).default(0), points: z.number().default(0) }),
  firstLanguage: languageSchema,
  secondLanguage: languageSchema,
  spouse: z.object({
    education: z.object({ value: z.enum(educationLevels).default(educationLevels[0]), points: z.number().default(0) }),
    firstLanguage: languageSchema,
    canadianWorkExperience: z.object({ value: z.number().min(0).default(0), points: z.number().default(0) }),
    points: z.number().default(0),
  }),
  skillTransferability: z.object({
      education: z.object({ points: z.number().default(0) }),
      foreignWorkExperience: z.object({ points: z.number().default(0) }),
      qualification: z.object({ points: z.number().default(0) }),
      points: z.number().default(0),
  }),
  additional: z.object({
      siblingInCanada: z.boolean().default(false),
      frenchSkills: z.boolean().default(false),
      postSecondaryEducationInCanada: z.enum(["None", "1-2 years", "3+ years"]).default("None"),
      provincialNomination: z.boolean().default(false),
      points: z.number().default(0),
  }),
  foreignWorkExperience: z.object({ value: z.number().min(0).default(0) }),
  certificateOfQualification: z.boolean().default(false),
});

export type CrsFactors = z.infer<typeof CrsFactorsSchema>;

// Calculation Logic based on provided CRS guide

function getAgePoints(age: number, hasSpouse: boolean): number {
  const points = hasSpouse ? {
    "18": 90, "19": 95, "20-29": 100, "30": 95, "31": 90, "32": 85, "33": 80, "34": 75,
    "35": 70, "36": 65, "37": 60, "38": 55, "39": 50, "40": 45, "41": 35, "42": 25, "43": 15, "44": 5,
  } : {
    "18": 99, "19": 105, "20-29": 110, "30": 105, "31": 99, "32": 94, "33": 88, "34": 83,
    "35": 77, "36": 72, "37": 66, "38": 61, "39": 55, "40": 50, "41": 39, "42": 28, "43": 17, "44": 6,
  };

  if (age <= 17 || age >= 45) return 0;
  if (age >= 20 && age <= 29) return points['20-29'];
  return points[age.toString() as keyof typeof points] || 0;
}

function getEducationPoints(level: typeof educationLevels[number], hasSpouse: boolean): number {
    const pointsMap = {
        "Less than secondary school (high school)": 0,
        "Secondary diploma (high school graduation)": hasSpouse ? 28 : 30,
        "One-year degree, diploma or certificate": hasSpouse ? 84 : 90,
        "Two-year program": hasSpouse ? 91 : 98,
        "Bachelor's degree or three-year program": hasSpouse ? 112 : 120,
        "Two or more certificates, diplomas, or degrees (one must be 3+ years)": hasSpouse ? 119 : 128,
        "Master's degree or professional degree": hasSpouse ? 126 : 135,
        "Doctoral level university degree (PhD)": hasSpouse ? 140 : 150,
    };
    return pointsMap[level];
}

function getLanguageAbilityPoints(clb: number, hasSpouse: boolean): number {
    const points = hasSpouse ? { "4-5": 6, "6": 8, "7": 16, "8": 22, "9": 29, "10+": 32 }
                             : { "4-5": 6, "6": 9, "7": 17, "8": 23, "9": 31, "10+": 34 };
    if (clb <= 3) return 0;
    if (clb <= 5) return points['4-5'];
    if (clb >= 10) return points['10+'];
    return points[clb.toString() as keyof typeof points] || 0;
}

function getSecondLangAbilityPoints(clb: number): number {
    if (clb <= 4) return 0;
    if (clb <= 6) return 1;
    if (clb <= 8) return 3;
    return 6;
}

function getCanadianWorkExpPoints(years: number, hasSpouse: boolean): number {
    const points = hasSpouse ? { "1": 35, "2": 46, "3": 56, "4": 63, "5+": 70 }
                             : { "1": 40, "2": 53, "3": 64, "4": 72, "5+": 80 };
    if (years === 0) return 0;
    if (years >= 5) return points['5+'];
    return points[years.toString() as keyof typeof points] || 0;
}

// Spouse points
function getSpouseEducationPoints(level: typeof educationLevels[number]): number {
    const pointsMap = {
        "Less than secondary school (high school)": 0,
        "Secondary diploma (high school graduation)": 2,
        "One-year degree, diploma or certificate": 6,
        "Two-year program": 7,
        "Bachelor's degree or three-year program": 8,
        "Two or more certificates, diplomas, or degrees (one must be 3+ years)": 9,
        "Master's degree or professional degree": 10,
        "Doctoral level university degree (PhD)": 10,
    };
    return pointsMap[level] || 0;
}

function getSpouseLangPoints(clb: number): number {
    if (clb <= 4) return 0;
    if (clb <= 6) return 1;
    if (clb <= 8) return 3;
    return 5;
}

function getSpouseCanadianWorkExpPoints(years: number): number {
     const points = { "1": 5, "2": 7, "3": 8, "4": 9, "5+": 10 };
    if (years === 0) return 0;
    if (years >= 5) return points['5+'];
    return points[years.toString() as keyof typeof points] || 0;
}

function getSkillTransferabilityPoints(factors: CrsFactors): { eduPoints: number, fwePoints: number, qualPoints: number } {
    const { firstLanguage: lang, education, canadianWorkExperience: cwe, foreignWorkExperience: fwe, certificateOfQualification } = factors;
    
    const isGoodLang = lang.listening >= 7 && lang.reading >= 7 && lang.writing >= 7 && lang.speaking >= 7;
    const isStrongLang = lang.listening >= 9 && lang.reading >= 9 && lang.writing >= 9 && lang.speaking >= 9;

    // Education points
    let eduPoints = 0;
    if (education.value !== educationLevels[0] && education.value !== educationLevels[1]) {
        const postSecondaryPoints = (level: typeof educationLevels[number]) => {
            const highCreds = ["Two or more certificates, diplomas, or degrees (one must be 3+ years)", "Master's degree or professional degree", "Doctoral level university degree (PhD)"];
            if (highCreds.includes(level)) return { good: 25, strong: 50 };
            return { good: 13, strong: 25 };
        };

        if (isGoodLang) {
           const base = isStrongLang ? postSecondaryPoints(education.value).strong : postSecondaryPoints(education.value).good;
           eduPoints = Math.max(eduPoints, base);
        }
        if (cwe.value > 0) {
            const base = cwe.value >= 2 ? postSecondaryPoints(education.value).strong : postSecondaryPoints(education.value).good;
            eduPoints = Math.max(eduPoints, base);
        }
    }


    // Foreign Work Experience points
    let fwePoints = 0;
    const fweYears = fwe.value;
    if (fweYears > 0) {
        const fweBasePoints = fweYears >= 3 ? { good: 25, strong: 50 } : { good: 13, strong: 25 };
        if (isGoodLang) {
            fwePoints = Math.max(fwePoints, isStrongLang ? fweBasePoints.strong : fweBasePoints.good);
        }
        if (cwe.value > 0) {
            fwePoints = Math.max(fwePoints, cwe.value >= 2 ? fweBasePoints.strong : fweBasePoints.good);
        }
    }

    // Certificate of Qualification points
    let qualPoints = 0;
    if (certificateOfQualification) {
        const isClb5 = lang.listening >= 5 && lang.reading >= 5 && lang.writing >= 5 && lang.speaking >= 5;
        if(isClb5) {
            qualPoints = isGoodLang ? 50 : 25;
        }
    }

    return { eduPoints: Math.min(eduPoints, 50), fwePoints: Math.min(fwePoints, 50), qualPoints: Math.min(qualPoints, 50) };
}

function getAdditionalPoints(factors: CrsFactors): number {
    let points = 0;
    const { additional, firstLanguage, secondLanguage } = factors;
    if (additional.siblingInCanada) points += 15;
    if (additional.provincialNomination) points += 600;

    if (additional.postSecondaryEducationInCanada === "1-2 years") points += 15;
    if (additional.postSecondaryEducationInCanada === "3+ years") points += 30;

    const hasNCLC7 = secondLanguage.listening >= 7 && secondLanguage.reading >= 7 && secondLanguage.writing >= 7 && secondLanguage.speaking >= 7;
    const hasCLB4 = firstLanguage.listening <= 4 && firstLanguage.reading <= 4 && firstLanguage.writing <= 4 && firstLanguage.speaking <= 4;
    const hasCLB5 = firstLanguage.listening >= 5 && firstLanguage.reading >= 5 && firstLanguage.writing >= 5 && firstLanguage.speaking >= 5;

    if (hasNCLC7 && hasCLB4) points += 25;
    if (hasNCLC7 && hasCLB5) points += 50;

    return Math.min(points, 600);
}


export function calculateCrsScore(factors: CrsFactors): { totalScore: number, factors: CrsFactors } {
  let totalScore = 0;
  const { hasSpouse } = factors;

  // Core / human capital
  factors.age.points = getAgePoints(factors.age.value, hasSpouse);
  factors.education.points = getEducationPoints(factors.education.value, hasSpouse);
  factors.canadianWorkExperience.points = getCanadianWorkExpPoints(factors.canadianWorkExperience.value, hasSpouse);
  
  let firstLangPts = 0;
  firstLangPts += getLanguageAbilityPoints(factors.firstLanguage.listening, hasSpouse);
  firstLangPts += getLanguageAbilityPoints(factors.firstLanguage.reading, hasSpouse);
  firstLangPts += getLanguageAbilityPoints(factors.firstLanguage.speaking, hasSpouse);
  firstLangPts += getLanguageAbilityPoints(factors.firstLanguage.writing, hasSpouse);
  factors.firstLanguage.points = Math.min(firstLangPts, hasSpouse ? 128 : 136);

  let secondLangPts = 0;
  secondLangPts += getSecondLangAbilityPoints(factors.secondLanguage.listening);
  secondLangPts += getSecondLangAbilityPoints(factors.secondLanguage.reading);
  secondLangPts += getSecondLangAbilityPoints(factors.secondLanguage.speaking);
  secondLangPts += getSecondLangAbilityPoints(factors.secondLanguage.writing);
  factors.secondLanguage.points = Math.min(secondLangPts, hasSpouse ? 22 : 24);

  let corePoints = factors.age.points + factors.education.points + factors.canadianWorkExperience.points + factors.firstLanguage.points + factors.secondLanguage.points;

  // Spouse factors
  if (hasSpouse) {
      factors.spouse.education.points = getSpouseEducationPoints(factors.spouse.education.value);
      
      let spouseLangPts = 0;
      spouseLangPts += getSpouseLangPoints(factors.spouse.firstLanguage.listening);
      spouseLangPts += getSpouseLangPoints(factors.spouse.firstLanguage.reading);
      spouseLangPts += getSpouseLangPoints(factors.spouse.firstLanguage.speaking);
      spouseLangPts += getSpouseLangPoints(factors.spouse.firstLanguage.writing);
      factors.spouse.firstLanguage.points = Math.min(spouseLangPts, 20);

      factors.spouse.canadianWorkExperience.points = getSpouseCanadianWorkExpPoints(factors.spouse.canadianWorkExperience.value);

      factors.spouse.points = factors.spouse.education.points + factors.spouse.firstLanguage.points + factors.spouse.canadianWorkExperience.points;
      corePoints += factors.spouse.points;
  }

  // Skill transferability
  const { eduPoints, fwePoints, qualPoints } = getSkillTransferabilityPoints(factors);
  factors.skillTransferability.education.points = eduPoints;
  factors.skillTransferability.foreignWorkExperience.points = fwePoints;
  factors.skillTransferability.qualification.points = qualPoints;
  factors.skillTransferability.points = Math.min(eduPoints + fwePoints + qualPoints, 100);


  // Additional points
  factors.additional.points = getAdditionalPoints(factors);

  totalScore = corePoints + factors.skillTransferability.points + factors.additional.points;

  return { totalScore: Math.min(totalScore, 1200), factors };
}
