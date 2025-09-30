
export type Question = {
  id: string;
  text: string;
  field: string;
  options: { text: string; value: any; points: number }[];
};

export const questions: Question[] = [
  {
    id: "q1",
    field: "age",
    text: "What is your age?",
    options: [
      { text: "17 or less", value: 17, points: 0 },
      { text: "18 to 35", value: 25, points: 100 },
      { text: "36", value: 36, points: 95 },
      { text: "37", value: 37, points: 90 },
      { text: "38", value: 38, points: 85 },
      { text: "39", value: 39, points: 80 },
      { text: "40", value: 40, points: 75 },
      { text: "41", value: 41, points: 65 },
      { text: "42", value: 42, points: 55 },
      { text: "43", value: 43, points: 45 },
      { text: "44", value: 44, points: 35 },
      { text: "45", value: 45, points: 25 },
      { text: "46", value: 46, points: 15 },
      { text: "47 or more", value: 47, points: 0 },
    ],
  },
  {
    id: "q2",
    field: "education",
    text: "What is your highest level of education?",
    options: [
      { text: "Less than high school", value: "secondary", points: 0 },
      { text: "High school diploma", value: "secondary", points: 30 },
      { text: "1-year post-secondary", value: "one-year", points: 90 },
      { text: "2-year post-secondary", value: "two-year", points: 98 },
      { text: "Bachelor's degree (3+ years)", value: "bachelor", points: 120 },
      { text: "Two or more certificates/degrees", value: "two-or-more", points: 128 },
      { text: "Master's degree", value: "master", points: 135 },
      { text: "Doctoral degree (PhD)", value: "phd", points: 150 },
    ],
  },
  {
    id: "q3",
    field: "experience",
    text: "How many years of skilled work experience do you have?",
    options: [
        { text: "None or less than a year", value: 0, points: 0 },
        { text: "1 year", value: 1, points: 40 },
        { text: "2 years", value: 2, points: 53 },
        { text: "3 years", value: 3, points: 64 },
        { text: "4 years", value: 4, points: 72 },
        { text: "5 years or more", value: 5, points: 80 },
    ],
  },
  {
    id: "q4",
    field: "language",
    text: "What is your English or French language proficiency level (CLB)?",
    options: [
        { text: "CLB 4 to 6", value: "clb6", points: 9 },
        { text: "CLB 7", value: "clb7", points: 17 },
        { text: "CLB 8", value: "clb8", points: 23 },
        { text: "CLB 9", value: "clb9", points: 31 },
        { text: "CLB 10 or higher", value: "clb10", points: 34 },
    ],
  }
];
