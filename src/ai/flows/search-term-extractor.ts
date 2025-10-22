
'use server';
/**
 * @fileOverview An AI flow to extract a search term from a natural language query.
 *
 * - extractSearchTerm - A function that takes a user query and returns a search term.
 * - SearchTermExtractorInput - The input type for the extractSearchTerm function.
 * - SearchTermExtractorOutput - The return type for the extractSearchTerm function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { lookupNocByJobTitle } from '../tools/noc-lookup';

const SearchTermExtractorInputSchema = z.object({
  query: z.string().describe('The natural language query from the user.'),
});
export type SearchTermExtractorInput = z.infer<typeof SearchTermExtractorInputSchema>;

const SearchTermExtractorOutputSchema = z.object({
  searchTerm: z.string().optional().describe('The extracted keyword for searching immigration draws. e.g., "welder", "tech", "pnp", or a NOC code like "75110"'),
});
export type SearchTermExtractorOutput = z.infer<typeof SearchTermExtractorOutputSchema>;

export async function extractSearchTerm(input: SearchTermExtractorInput): Promise<SearchTermExtractorOutput> {
  return extractSearchTermFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchTermExtractorPrompt',
  input: {schema: SearchTermExtractorInputSchema},
  output: {schema: SearchTermExtractorOutputSchema},
  tools: [lookupNocByJobTitle],
  prompt: `You are an expert at parsing user queries about Canadian immigration draws. Your task is to extract the most relevant, concise search term.

  The user's query is: {{{query}}}

  - **First, check if the query is a job title.** If it is, use the \`lookupNocByJobTitle\` tool to find its official NOC code.
  - If the tool returns a NOC code, use that code as the searchTerm.
  - If the tool does not return a NOC code, then extract the most relevant keyword, program name (like "PNP", "Express Entry"), or specific category.
  - If the user asks "any recent tech draws", the search term is "tech".
  - If the user types a simple keyword like "PNP", the search term is "PNP".
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
    // If the query is simple (e.g., one or two words that are likely not job titles), 
    // we can try a direct search first to avoid LLM cost for simple cases.
    const wordCount = input.query.trim().split(/\s+/).length;
    if (wordCount <= 2 && !input.query.toLowerCase().includes(' for ')) {
      // Let's still try the LLM for potential mappings like "car mechanic"
      // but this logic could be a simple check.
    }
      
    const {output} = await prompt(input);
    return output || { searchTerm: input.query }; // Fallback to original query
  }
);
