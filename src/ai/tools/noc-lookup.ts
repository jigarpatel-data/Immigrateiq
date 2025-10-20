
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
    
    // Find the best match in nocTitle
    let bestMatch: { nocCode: string | number, score: number } | null = null;

    (nocData as NocEntry[]).forEach(noc => {
      const titleLower = noc.nocTitle.toLowerCase();
      
      // Prioritize exact match
      if (titleLower === jobTitleLower) {
        bestMatch = { nocCode: noc.nocCode, score: 1 };
        return;
      }

      // Check for inclusion and score it (simple scoring)
      if (titleLower.includes(jobTitleLower)) {
        const score = jobTitleLower.length / titleLower.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { nocCode: noc.nocCode, score };
        }
      }
    });

    if (bestMatch) {
      const nocCodeStr = String(bestMatch.nocCode);
      console.log(`Found best match NOC code: ${nocCodeStr}`);
      return { nocCode: nocCodeStr };
    }
    
    console.log('No NOC code found for the title.');
    return { nocCode: undefined };
  }
);
