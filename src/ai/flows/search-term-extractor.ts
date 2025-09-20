'use server';
/**
 * @fileOverview An AI flow to extract a search term from a natural language query.
 *
 * - extractSearchTerm - A function that takes a user query and returns a search term.
 * - SearchTermExtractorInput - The input type for the extractSearchTerm function.
 * - SearchTermExtractorOutput - The return type for the extractSearchTerm function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchTermExtractorInputSchema = z.object({
  query: z.string().describe('The natural language query from the user.'),
});
export type SearchTermExtractorInput = z.infer<typeof SearchTermExtractorInputSchema>;

const SearchTermExtractorOutputSchema = z.object({
  searchTerm: z.string().optional().describe('The extracted keyword for searching immigration draws. e.g., "welder", "tech", "pnp"'),
});
export type SearchTermExtractorOutput = z.infer<typeof SearchTermExtractorOutputSchema>;

export async function extractSearchTerm(input: SearchTermExtractorInput): Promise<SearchTermExtractorOutput> {
  return extractSearchTermFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchTermExtractorPrompt',
  input: {schema: SearchTermExtractorInputSchema},
  output: {schema: SearchTermExtractorOutputSchema},
  prompt: `You are an expert at parsing user queries about Canadian immigration draws. Your task is to extract the most relevant, concise search term (keyword, acronym, or official job title) from the user's query.

  The query is: {{{query}}}

  - Focus on occupations, program names (like "PNP", "Express Entry"), or specific categories.
  - If the user asks "what is the draw for welders", the search term is "welders".
  - If the user asks "any recent tech draws", the search term is "tech".
  - If the user types a simple keyword like "PNP", the search term is "PNP".
  - **Crucially, map common job titles to their likely official NOC equivalents.** For example, if the user asks about "car mechanic", you should return "automotive service technician".
  - If the user asks about "construction labour", you should return "construction labour".
  - If no specific, searchable keyword can be found, return an empty or undefined searchTerm.
  - Return the most important search term. It can be one or more words, but keep it concise.
  `,
});

const extractSearchTermFlow = ai.defineFlow(
  {
    name: 'extractSearchTermFlow',
    inputSchema: SearchTermExtractorInputSchema,
    outputSchema: SearchTermExtractorOutputSchema,
  },
  async input => {
    // If the query is simple (e.g., one or two words), just use it directly.
    // This avoids unnecessarily calling the LLM for simple keyword searches.
    const wordCount = input.query.trim().split(/\s+/).length;
    if (wordCount <= 2) {
      return { searchTerm: input.query };
    }
      
    const {output} = await prompt(input);
    return output || { searchTerm: input.query }; // Fallback to original query
  }
);
