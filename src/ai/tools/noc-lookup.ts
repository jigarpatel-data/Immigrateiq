
'use server';
/**
 * @fileOverview A tool for looking up a NOC code by a given job title.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import nocData from '@/lib/data/noc-job-titles.json';

export const lookupNocByJobTitle = ai.defineTool(
  {
    name: 'lookupNocByJobTitle',
    description: 'Looks up the Canadian National Occupational Classification (NOC) code for a given job title.',
    inputSchema: z.object({
      jobTitle: z.string().describe('The job title to search for. e.g., "construction labourer", "roofer helper"'),
    }),
    outputSchema: z.object({
        nocCode: z.string().optional().describe('The corresponding NOC code, e.g., "75110".'),
    }),
  },
  async (input) => {
    console.log(`Looking up NOC code for job title: ${input.jobTitle}`);
    const jobTitleLower = input.jobTitle.toLowerCase();
    
    for (const noc of nocData) {
      const found = noc.exampleJobTitles.some(title => title.toLowerCase() === jobTitleLower);
      if (found) {
        console.log(`Found NOC code: ${noc.nocCode}`);
        return { nocCode: noc.nocCode };
      }
    }
    
    console.log('No NOC code found.');
    return { nocCode: undefined };
  }
);
