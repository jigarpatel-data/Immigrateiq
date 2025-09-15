
'use server';
/**
 * @fileOverview A conversational AI flow for calculating a user's CRS score for Canadian immigration.
 *
 * - crsCalculator - The main function that drives the conversational calculation.
 * - CrsCalculatorInput - The input type for the crsCalculator function.
 * - CrsCalculatorOutput - The return type for the crsCalculator function.
 */

import {ai} from '@/ai/genkit';
import {calculateCrsScore, CrsFactors, CrsFactorsSchema} from '@/lib/crs-calculator';
import {z} from 'genkit';

const CrsCalculatorInputSchema = z.object({
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe('The full chat history between the user and the assistant.'),
});
export type CrsCalculatorInput = z.infer<typeof CrsCalculatorInputSchema>;

const CrsCalculatorOutputSchema = z.object({
  response: z.string().describe('The chatbot\'s next response or question to the user.'),
  isComplete: z.boolean().describe('Whether the CRS calculation is complete.'),
  finalScore: z.number().optional().describe('The final total CRS score, if complete.'),
  scoreDetails: CrsFactorsSchema.optional().describe('A detailed breakdown of the CRS score, if complete.'),
});
export type CrsCalculatorOutput = z.infer<typeof CrsCalculatorOutputSchema>;

export async function crsCalculator(input: CrsCalculatorInput): Promise<CrsCalculatorOutput> {
  return crsCalculatorFlow(input);
}

const calculateCrsScoreTool = ai.defineTool(
  {
    name: 'calculateCrsScore',
    description: 'Calculates the final CRS score based on the user\'s provided information. This tool must be called only when all required information has been collected.',
    inputSchema: CrsFactorsSchema,
    outputSchema: z.object({
      totalScore: z.number(),
      factors: CrsFactorsSchema,
    }),
  },
  async (factors) => {
    const { totalScore } = calculateCrsScore(factors);
    return { totalScore, factors };
  }
);


const prompt = ai.definePrompt({
  name: 'crsCalculatorPrompt',
  input: {schema: CrsCalculatorInputSchema},
  output: {schema: CrsCalculatorOutputSchema},
  tools: [calculateCrsScoreTool],
  prompt: `
    You are an expert AI assistant for calculating the Canadian Comprehensive Ranking System (CRS) score. Your goal is to guide users through a conversational process to collect all the necessary information to calculate their score accurately.

    **Your Role:**
    1.  **Guide the Conversation:** Ask questions one by one to gather the required information.
    2.  **Be Clear and Concise:** Explain what information you need and why.
    3.  **Strictly Follow the Logic:** Do NOT make up point values. Use the 'calculateCrsScore' tool to get the final, accurate score ONLY when all information is gathered.
    4.  **Handle Ambiguity:** If a user's answer is unclear, ask for clarification. For example, if they say "a degree," ask "Is that a Bachelor's, Master's, or PhD?".
    5.  **Maintain Context:** Use the chat history to keep track of the conversation and the information already provided.
    6.  **Summarize Points (Conceptually):** After each user response, briefly acknowledge it and mention that it contributes to their score. For example, "Thanks! Your age is a key factor in your score. Now, what's your highest level of education?" or "Great, strong language skills significantly boost your points. Let's move on to your Canadian work experience." Do not give specific numbers until the very end. The final calculation is handled by the tool.

    **Required Information Checklist (Ask in this order):**
    - **Marital Status:** Are you single or do you have a spouse/common-law partner who will be coming with you to Canada?
    - **Age:** The user's age.
    - **Education:** The user's highest level of education. (e.g., High School, Bachelor's, Master's, PhD).
    - **First Language Proficiency:** CLB levels for speaking, listening, reading, and writing. Ask for all four scores.
    - **Second Language Proficiency:** (Optional) Ask if they have scores for a second official language. If yes, get CLB levels for all four abilities.
    - **Canadian Work Experience:** Years of skilled work experience in Canada.
    - **Foreign Work Experience:** Years of skilled work experience outside Canada.
    - **Spouse's Information (if applicable):**
        - Spouse's highest level of education.
        - Spouse's first language proficiency (CLB for all 4 abilities).
        - Spouse's Canadian work experience.
    - **Certificate of Qualification:** Does the user have a certificate of qualification from a Canadian province, territory, or federal body?
    - **Additional Factors:**
        - Do they have a brother or sister living in Canada who is a citizen or permanent resident?
        - Did they complete post-secondary education in Canada (1-2 years, or 3+ years)?
        - Do they have a nomination from a province or territory?

    **Conversation Flow:**
    - Start by greeting the user and asking the first question (Marital Status).
    - Based on the chat history, determine the next question to ask from the checklist.
    - When you have gathered an answer, briefly acknowledge it and move to the next question.
    - When all questions have been answered, call the 'calculateCrsScore' tool with all the collected information.
    - After the tool returns the score, present the final score and a summary to the user. Set 'isComplete' to true in your final output.

    **Current Conversation:**
    {{#each chatHistory}}
      **{{role}}**: {{{content}}}
    {{/each}}
  `,
});

const crsCalculatorFlow = ai.defineFlow(
  {
    name: 'crsCalculatorFlow',
    inputSchema: CrsCalculatorInputSchema,
    outputSchema: CrsCalculatorOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    
    const toolCall = llmResponse.toolCalls()?.[0];
    if (toolCall?.name === 'calculateCrsScore') {
      const toolResult = await calculateCrsScoreTool(toolCall.args as CrsFactors);
      const { totalScore, factors } = toolResult;

      return {
        response: `Based on the information you provided, your estimated CRS score is ${totalScore}. You can see a detailed breakdown on the side panel.`,
        isComplete: true,
        finalScore: totalScore,
        scoreDetails: factors,
      };
    }

    const textResponse = llmResponse.text;
    if (textResponse) {
       return {
        response: textResponse,
        isComplete: false,
      };
    }
    
    // Fallback for cases where the model response is not in the expected format.
    const output = llmResponse.output();
    if (output?.response) {
      return {
        response: output.response,
        isComplete: false,
      };
    }

    return {
      response: "I'm sorry, I encountered an issue. Could you please rephrase your last message?",
      isComplete: false,
    };
  }
);
