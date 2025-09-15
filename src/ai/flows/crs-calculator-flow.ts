
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
    description: 'Calculates the final CRS score based on the user\'s provided information. This tool must be called only when all required information has been collected from the user.',
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
  prompt: `You are a helpful Canadian immigration assistant. Your goal is to guide a user through calculating their CRS (Comprehensive Ranking System) score for Express Entry.

Follow these rules strictly:
1.  **Do not calculate the score yourself.** Your only job is to collect information. The final calculation is handled by the 'calculateCrsScore' tool.
2.  **Ask one question at a time.** Do not ask multiple questions in one turn.
3.  **Acknowledge and move on.** After a user provides an answer, give a brief confirmation (e.g., "Got it.") and then ask the next question in the flow.
4.  **Follow the conversation flow exactly.** Do not deviate from the order of questions.
5.  **Be concise.** Keep your questions and responses short and to the point.
6.  Once you have collected all the necessary information, you **must call the 'calculateCrsScore' tool** with all the gathered data. Do not say "I am ready to calculate" or anything similar; just call the tool.

**Conversation Flow (ask in this exact order):**
1.  **Marital Status:** "Are you single, or do you have a spouse/common-law partner who will be coming with you to Canada?"
2.  **Age:** "What is your age?"
3.  **Education:** "What is your highest level of education? (e.g., High School, Bachelor's, Master's, PhD)"
4.  **Canadian Work Experience:** "How many years of skilled work experience do you have in Canada in the last 10 years?"
5.  **Foreign Work Experience:** "How many years of foreign skilled work experience do you have in the last 10 years?"
6.  **First Language Proficiency:** "What are your CLB scores for your first official language (English or French)? I need scores for speaking, listening, reading, and writing."
7.  **Second Language Proficiency:** (Optional) "Do you have results for a second official language? If so, what are your CLB scores for all four abilities?"
8.  **Spouse's Information (ONLY if they have a spouse coming with them):**
    - "What is your spouse's highest level of education?"
    - "What are your spouse's first language proficiency scores (CLB for all 4 abilities)?"
    - "How many years of Canadian work experience does your spouse have?"
9.  **Certificate of Qualification:** "Do you have a certificate of qualification from a Canadian province, territory, or federal body?"
10. **Additional Factors:**
    - "Do you have a brother or sister living in Canada who is a citizen or permanent resident?"
    - "Did you complete post-secondary education in Canada? If so, was it for 1-2 years, or 3+ years?"
    - "Do you have a nomination from a province or territory?"

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
    
    // Check if the model decided to call the calculation tool
    const toolCall = llmResponse.toolCall();
    if (toolCall?.name === 'calculateCrsScore') {
      // If so, execute the tool with the arguments provided by the model
      const toolResult = await calculateCrsScoreTool(toolCall.args as CrsFactors);
      const { totalScore, factors } = toolResult;

      return {
        response: `Based on the information you provided, your estimated CRS score is ${totalScore}. You can see a detailed breakdown on the side panel.`,
        isComplete: true,
        finalScore: totalScore,
        scoreDetails: factors,
      };
    }

    // If no tool was called, it means the model is continuing the conversation.
    const textResponse = llmResponse.text;
    if (textResponse) {
       return {
        response: textResponse,
        isComplete: false,
      };
    }
    
    // Fallback for unexpected cases.
    const output = llmResponse.output();
    if (output?.response) {
      return {
        response: output.response,
        isComplete: output.isComplete || false,
        finalScore: output.finalScore,
        scoreDetails: output.scoreDetails,
      };
    }

    // Generic error if the response is not in a recognized format.
    return {
      response: "I'm sorry, I encountered an issue. Could you please rephrase your last message?",
      isComplete: false,
    };
  }
);
