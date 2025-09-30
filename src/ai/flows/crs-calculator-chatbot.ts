
'use server';
/**
 * @fileOverview An AI chatbot for calculating a user's CRS score conversationally.
 *
 * - crsCalculatorChatbot - A function that handles the conversational CRS calculation.
 * - CrsCalculatorChatbotInput - The input type for the function.
 * - CrsCalculatorChatbotOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { crsCalculationInstructions } from '@/lib/data/crs-instructions';

const CrsCalculatorChatbotInputSchema = z.object({
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe('The chat history between the user and the calculator chatbot.'),
});
export type CrsCalculatorChatbotInput = z.infer<typeof CrsCalculatorChatbotInputSchema>;

const ScoreBreakdownSchema = z.object({
    category: z.string().describe("The category for the points, e.g., 'Age', 'Education'."),
    points: z.number().describe("The points awarded for this category."),
});

const CrsCalculatorChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response, which is either the next question or the final result.'),
  isFinished: z.boolean().describe('Set to true only when the calculation is complete and the final score is presented.'),
  finalScore: z.number().optional().describe('The final calculated CRS score.'),
  scoreBreakdown: z.array(ScoreBreakdownSchema).optional().describe('A breakdown of the score by category.'),
});
export type CrsCalculatorChatbotOutput = z.infer<typeof CrsCalculatorChatbotOutputSchema>;

export async function crsCalculatorChatbot(input: CrsCalculatorChatbotInput): Promise<CrsCalculatorChatbotOutput> {
  return crsCalculatorChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'crsCalculatorChatbotPrompt',
  input: {schema: CrsCalculatorChatbotInputSchema},
  output: {schema: CrsCalculatorChatbotOutputSchema},
  prompt: `You are an AI assistant designed to calculate a user's Comprehensive Ranking System (CRS) score for Canadian immigration.

  Your instructions for calculating the score are provided below in the "CRS CALCULATION INSTRUCTIONS" section. You MUST follow these instructions exactly.

  Your task is to guide the user through the calculation process conversationally.
  1.  Start by introducing yourself and explaining the process. Your first message is already in the history.
  2.  Ask the user ONE question at a time to gather the necessary information (e.g., age, education, experience, language scores).
  3.  Based on the user's answer, find the corresponding points from the instructions. Keep a running total of the score and a breakdown by category.
  4.  Continue asking questions until you have all the information needed to calculate the full score.
  5.  Once you have all the information, present the final score. Your response should include the final score, a breakdown of points for each category, and a concluding message.
  6.  When you present the final score, you MUST set the 'isFinished' flag in your output to 'true'. At all other times, it must be 'false'.
  7.  Do not ask for information not specified in the instructions.
  8.  Be friendly and encouraging throughout the conversation.

  Here is the current conversation history. The user's latest message is the last one.
  {{#each chatHistory}}
  - {{role}}: {{content}}
  {{/each}}

  CRS CALCULATION INSTRUCTIONS:
  ---
  ${crsCalculationInstructions}
  ---
  `,
});

const crsCalculatorChatbotFlow = ai.defineFlow(
  {
    name: 'crsCalculatorChatbotFlow',
    inputSchema: CrsCalculatorChatbotInputSchema,
    outputSchema: CrsCalculatorChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
