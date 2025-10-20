
'use server';
/**
 * @fileOverview A tool for looking up a NOC code by a given job title.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import nocData from '@/lib/data/noc-job-titles.json';

type NocEntry = {
    nocCode: number | string;
    nocTitle: string;
    TEER: number;
    exampleJobTitles?: string[];
}

export const lookupNocByJobTitle = ai.defineTool(
  {
    name: 'lookupNocByJobTitle',
    description: 'Looks up the Canadian National Occupational Classification (NOC) code for a given job title.',
    inputSchema: z.object({
      jobTitle: z.string().describe('The job title to search for. e.g., "glass cutters", "software engineer"'),
    }),
    outputSchema: z.object({
        nocCode: z.string().optional().describe('The corresponding NOC code, e.g., "73111".'),
    }),
  },
  async (input) => {
    console.log(`Looking up NOC code for job title: ${input.jobTitle}`);
    const jobTitleLower = input.jobTitle.toLowerCase().trim();
    
    let bestMatch: { nocCode: string | number, score: number } | null = null;

    (nocData as NocEntry[]).forEach(noc => {
      const titleLower = noc.nocTitle.toLowerCase();
      let currentScore = 0;

      // 1. Prioritize exact match on main title (highest score)
      if (titleLower === jobTitleLower) {
        currentScore = 1.0;
      } 
      // 2. Check for exact match in example titles
      else if (noc.exampleJobTitles?.some(ex => ex.toLowerCase() === jobTitleLower)) {
        currentScore = 0.95;
      }
      // 3. Check if main title starts with the query (very relevant)
      else if (titleLower.startsWith(jobTitleLower)) {
        currentScore = 0.9;
      }
      // 4. Check for inclusion in main title (less relevant, lower score)
      else if (titleLower.includes(jobTitleLower)) {
        // Score based on how much of the title is matched. Closer to 1 is better.
        currentScore = jobTitleLower.length / titleLower.length * 0.5; // Penalize simple inclusion
      }
      // 5. Check for inclusion in example titles
      else if (noc.exampleJobTitles?.some(ex => ex.toLowerCase().includes(jobTitleLower))) {
        currentScore = 0.4; // Low score for partial match in examples
      }
      
      if (currentScore > (bestMatch?.score ?? 0)) {
        bestMatch = { nocCode: noc.nocCode, score: currentScore };
      }
    });

    if (bestMatch && bestMatch.score > 0.3) { // Set a threshold to avoid poor matches
      const nocCodeStr = String(bestMatch.nocCode);
      console.log(`Found best match NOC code: ${nocCodeStr} with score ${bestMatch.score}`);
      return { nocCode: nocCodeStr };
    }
    
    console.log('No suitable NOC code found for the title.');
    return { nocCode: undefined };
  }
);
