
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
    
    // Simplistic search for demo purposes. This could be improved with fuzzy matching.
    const foundNoc = (nocData as NocEntry[]).find(noc => 
        noc.nocTitle.toLowerCase().includes(jobTitleLower) ||
        noc.exampleJobTitles?.some(ex => ex.toLowerCase().includes(jobTitleLower))
    );

    if (foundNoc) {
      const nocCodeStr = String(foundNoc.nocCode);
      console.log(`Found NOC code: ${nocCodeStr}`);
      return { nocCode: nocCodeStr };
    }
    
    console.log('No NOC code found for the title.');
    return { nocCode: undefined };
  }
);
