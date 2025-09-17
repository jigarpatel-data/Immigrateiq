import { z } from 'zod';

// Schemas for input validation using Zod
const languageSchema = z.object({
  listening: z.number().min(0).max(12).default(0),
  reading: z.number().min(0).max(12).default(0),
  writing: z.number().min(0).max(12).default(0),
  speaking: z.number().min(0).max(12).default(0),
  points: z.number().default(0),
});

export const educationLevels = [
  "Less than secondary school (high school)",
  "Secondary diploma (high school graduation)",
  "One-year degree, diploma or certificate",
  "Two-year program at a university, college, trade or technical school, or other institute",
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
      frenchSkills: z.number().default(0),
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
  const pointsWithSpouse: {[key: number]: number} = {
    17: 0, 18: 90, 19: 95, 30: 95, 31: 90, 32: 85, 33: 80, 34: 75, 35: 70, 36: 65, 37: 60, 38: 55, 39: 50, 40: 45, 41: 35, 42: 25, 43: 15, 44: 5
  };
  const pointsWithoutSpouse: {[key: number]: number} = {
    17: 0, 18: 99, 19: 105, 30: 105, 31: 99, 32: 94, 33: 88, 34: 83, 35: 77, 36: 72, 37: 66, 38: 61, 39: 55, 40: 50, 41: 39, 42: 28, 43: 17, 44: 6
  };

  if (age >= 45) return 0;
  if (age >= 20 && age <= 29) return hasSpouse ? 100 : 110;
  
  return hasSpouse ? (pointsWithSpouse[age] ?? 0) : (pointsWithoutSpouse[age] ?? 0);
}

function getEducationPoints(level: typeof educationLevels[number], hasSpouse: boolean): number {
    const pointsMap = {
        "Less than secondary school (high school)": 0,
        "Secondary diploma (high school graduation)": hasSpouse ? 28 : 30,
        "One-year degree, diploma or certificate": hasSpouse ? 84 : 90,
        "Two-year program at a university, college, trade or technical school, or other institute": hasSpouse ? 91 : 98,
        "Bachelor's degree or three-year program": hasSpouse ? 112 : 120,
        "Two or more certificates, diplomas, or degrees (one must be 3+ years)": hasSpouse ? 119 : 128,
        "Master's degree or professional degree": hasSpouse ? 126 : 135,
        "Doctoral level university degree (PhD)": hasSpouse ? 140 : 150,
    };
    return pointsMap[level];
}

function getFirstLanguageAbilityPoints(clb: number, hasSpouse: boolean): number {
    const points = hasSpouse ? { 4: 6, 5: 6, 6: 8, 7: 16, 8: 22, 9: 29 }
                             : { 4: 6, 5: 6, 6: 9, 7: 17, 8: 23, 9: 31 };
    if (clb < 4) return 0;
    if (clb >= 10) return hasSpouse ? 32 : 34;
    return points[clb as keyof typeof points] || 0;
}

function getSecondLangAbilityPoints(clb: number): number {
    if (clb <= 4) return 0;
    if (clb <= 6) return 1;
    if (clb <= 8) return 3;
    return 6;
}

function getCanadianWorkExpPoints(years: number, hasSpouse: boolean): number {
    const points = hasSpouse ? { 0: 0, 1: 35, 2: 46, 3: 56, 4: 63 }
                             : { 0: 0, 1: 40, 2: 53, 3: 64, 4: 72 };
    if (years >= 5) return hasSpouse ? 70 : 80;
    return points[years as keyof typeof points] || 0;
}

// Spouse points
function getSpouseEducationPoints(level: typeof educationLevels[number]): number {
    const pointsMap = {
        "Less than secondary school (high school)": 0,
        "Secondary diploma (high school graduation)": 2,
        "One-year degree, diploma or certificate": 6,
        "Two-year program at a university, college, trade or technical school, or other institute": 7,
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
     const points = { 0: 0, 1: 5, 2: 7, 3: 8, 4: 9 };
    if (years >= 5) return 10;
    return points[years as keyof typeof points] || 0;
}

function getSkillTransferabilityPoints(factors: CrsFactors): { eduPoints: number, fwePoints: number, qualPoints: number } {
    const { firstLanguage, education, canadianWorkExperience, foreignWorkExperience, certificateOfQualification } = factors;
    
    // --- Education Points ---
    let eduAndLangPoints = 0;
    const allLangCLB7 = firstLanguage.listening >= 7 && firstLanguage.reading >= 7 && firstLanguage.writing >= 7 && firstLanguage.speaking >= 7;
    const allLangCLB9 = firstLanguage.listening >= 9 && firstLanguage.reading >= 9 && firstLanguage.writing >= 9 && firstLanguage.speaking >= 9;
    
    const postSecondaryOneYearOrLonger = educationLevels.slice(2).includes(education.value);
    const twoOrMoreCredsOrHigher = educationLevels.slice(5).includes(education.value);

    if (postSecondaryOneYearOrLonger) {
        if (allLangCLB9) {
            eduAndLangPoints = twoOrMoreCredsOrHigher ? 50 : 25;
        } else if (allLangCLB7) {
            eduAndLangPoints = twoOrMoreCredsOrHigher ? 25 : 13;
        }
    }

    let eduAndCWEPoints = 0;
     if (postSecondaryOneYearOrLonger) {
        if (canadianWorkExperience.value >= 2) {
            eduAndCWEPoints = twoOrMoreCredsOrHigher ? 50 : 25;
        } else if (canadianWorkExperience.value === 1) {
            eduAndCWEPoints = twoOrMoreCredsOrHigher ? 25 : 13;
        }
    }
    const eduPoints = Math.min(eduAndLangPoints + eduAndCWEPoints, 50);

    // --- Foreign Work Experience Points ---
    let fweAndLangPoints = 0;
    if (foreignWorkExperience.value > 0) {
         if (allLangCLB9) {
            fweAndLangPoints = foreignWorkExperience.value >= 3 ? 50 : 25;
        } else if (allLangCLB7) {
            fweAndLangPoints = foreignWorkExperience.value >= 3 ? 25 : 13;
        }
    }

    let fweAndCWEPoints = 0;
    if (foreignWorkExperience.value > 0 && canadianWorkExperience.value > 0) {
        if (canadianWorkExperience.value >= 2) {
             fweAndCWEPoints = foreignWorkExperience.value >= 3 ? 50 : 25;
        } else if (canadianWorkExperience.value === 1) {
             fweAndCWEPoints = foreignWorkExperience.value >= 3 ? 25 : 13;
        }
    }
    const fwePoints = Math.min(fweAndLangPoints + fweAndCWEPoints, 50);

    // --- Certificate of Qualification Points ---
    let qualPoints = 0;
    if (certificateOfQualification) {
        const allLangCLB5 = firstLanguage.listening >= 5 && firstLanguage.reading >= 5 && firstLanguage.writing >= 5 && firstLanguage.speaking >= 5;
        if(allLangCLB5) {
            if (allLangCLB7) {
                 qualPoints = 50;
            } else {
                 qualPoints = 25;
            }
        }
    }
    
    return { eduPoints, fwePoints, qualPoints };
}

function getAdditionalPoints(factors: CrsFactors): { points: number, french: number } {
    let points = 0;
    let frenchPoints = 0;
    const { additional, firstLanguage, secondLanguage } = factors;
    
    if (additional.provincialNomination) points += 600;
    if (additional.siblingInCanada) points += 15;
    
    if (additional.postSecondaryEducationInCanada === "1-2 years") points += 15;
    if (additional.postSecondaryEducationInCanada === "3+ years") points += 30;

    // Assuming French is second language
    const hasNCLC7 = secondLanguage.listening >= 7 && secondLanguage.reading >= 7 && secondLanguage.writing >= 7 && secondLanguage.speaking >= 7;
    const allEnglishCLB4 = firstLanguage.listening <= 4 && firstLanguage.reading <= 4 && firstLanguage.writing <= 4 && firstLanguage.speaking <= 4;
    const allEnglishCLB5 = firstLanguage.listening >= 5 && firstLanguage.reading >= 5 && firstLanguage.writing >= 5 && firstLanguage.speaking >= 5;

    if (hasNCLC7) {
        if (allEnglishCLB5) {
            frenchPoints = 50;
        } else if (allEnglishCLB4 || (firstLanguage.listening === 0 && firstLanguage.reading === 0 && firstLanguage.writing === 0 && firstLanguage.speaking === 0)) {
            frenchPoints = 25;
        }
    }

    points += frenchPoints;
    return { points, french: frenchPoints };
}


export function calculateCrsScore(factors: CrsFactors): { totalScore: number, factors: CrsFactors } {
  const { hasSpouse } = factors;

  // Core / human capital
  factors.age.points = getAgePoints(factors.age.value, hasSpouse);
  factors.education.points = getEducationPoints(factors.education.value, hasSpouse);
  factors.canadianWorkExperience.points = getCanadianWorkExpPoints(factors.canadianWorkExperience.value, hasSpouse);
  
  let firstLangPts = 0;
  firstLangPts += getFirstLanguageAbilityPoints(factors.firstLanguage.listening, hasSpouse);
  firstLangPts += getFirstLanguageAbilityPoints(factors.firstLanguage.reading, hasSpouse);
  firstLangPts += getFirstLanguageAbilityPoints(factors.firstLanguage.speaking, hasSpouse);
  firstLangPts += getFirstLanguageAbilityPoints(factors.firstLanguage.writing, hasSpouse);
  factors.firstLanguage.points = firstLangPts;

  let secondLangPts = 0;
  secondLangPts += getSecondLangAbilityPoints(factors.secondLanguage.listening);
  secondLangPts += getSecondLangAbilityPoints(factors.secondLanguage.reading);
  secondLangPts += getSecondLangAbilityPoints(factors.secondLanguage.speaking);
  secondLangPts += getSecondLangAbilityPoints(factors.secondLanguage.writing);
  factors.secondLanguage.points = secondLangPts;

  let corePoints = factors.age.points + factors.education.points + factors.canadianWorkExperience.points + factors.firstLanguage.points + factors.secondLanguage.points;
  
  // Spouse factors
  let spouseTotalPoints = 0;
  if (hasSpouse && factors.spouse) {
      factors.spouse.education.points = getSpouseEducationPoints(factors.spouse.education.value);
      
      let spouseLangPts = 0;
      spouseLangPts += getSpouseLangPoints(factors.spouse.firstLanguage.listening);
      spouseLangPts += getSpouseLangPoints(factors.spouse.firstLanguage.reading);
      spouseLangPts += getSpouseLangPoints(factors.spouse.firstLanguage.speaking);
      spouseLangPts += getSpouseLangPoints(factors.spouse.firstLanguage.writing);
      factors.spouse.firstLanguage.points = spouseLangPts;

      factors.spouse.canadianWorkExperience.points = getSpouseCanadianWorkExpPoints(factors.spouse.canadianWorkExperience.value);

      spouseTotalPoints = factors.spouse.education.points + factors.spouse.firstLanguage.points + factors.spouse.canadianWorkExperience.points;
      factors.spouse.points = spouseTotalPoints;
  }
  
  // Skill transferability
  const { eduPoints, fwePoints, qualPoints } = getSkillTransferabilityPoints(factors);
  const totalSkillTransferability = eduPoints + fwePoints + qualPoints;
  factors.skillTransferability.points = Math.min(totalSkillTransferability, 100);
  factors.skillTransferability.education.points = eduPoints;
  factors.skillTransferability.foreignWorkExperience.points = fwePoints;
  factors.skillTransferability.qualification.points = qualPoints;

  // Additional points
  const { points: additionalTotalPoints, french: frenchPointsVal } = getAdditionalPoints(factors);
  factors.additional.points = additionalTotalPoints;
  factors.additional.frenchSkills = frenchPointsVal;

  const totalScore = corePoints + spouseTotalPoints + factors.skillTransferability.points + factors.additional.points;

  return { totalScore: Math.min(totalScore, 1200), factors };
}
