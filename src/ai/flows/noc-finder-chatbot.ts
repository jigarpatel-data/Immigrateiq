
'use server';
/**
 * @fileOverview A RAG-powered chatbot to find NOC codes using a vector database.
 * 
 * - nocFinderChatbot - A function that handles the conversational NOC code finding.
 * - NocFinderChatbotInput - The input type for the function.
 * - NocFinderChatbotOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateEmbedding, queryPinecone } from '@/lib/pinecone';

const NocFinderChatbotInputSchema = z.object({
  message: z.string().describe('The user message containing their job title or duties.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('The chat history between the user and the chatbot.'),
});
export type NocFinderChatbotInput = z.infer<typeof NocFinderChatbotInputSchema>;

const NocFinderChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response, identifying the NOC code or asking for clarification.'),
});
export type NocFinderChatbotOutput = z.infer<typeof NocFinderChatbotOutputSchema>;

export async function nocFinderChatbot(input: NocFinderChatbotInput): Promise<NocFinderChatbotOutput> {
  return nocFinderChatbotFlow(input);
}

const nocFinderChatbotFlow = ai.defineFlow(
  {
    name: 'nocFinderChatbotFlow',
    inputSchema: NocFinderChatbotInputSchema,
    outputSchema: NocFinderChatbotOutputSchema,
  },
  async (input) => {
    // 1. Generate an embedding for the user's query
    const embedding = await generateEmbedding(input.message);

    // 2. Query Pinecone to get relevant documents
    const topK = 3; // Retrieve the top 3 most similar documents
    const results = await queryPinecone(embedding, topK);
    const context = results.map(r => r.content[0].text).join('\n\n---\n\n');

    // 3. Use an LLM to analyze the context and provide an answer
    const prompt = ai.definePrompt({
        name: 'nocFinderPrompt',
        input: { schema: z.object({ message: z.string(), context: z.string(), chatHistory: NocFinderChatbotInputSchema.shape.chatHistory }) },
        output: { schema: NocFinderChatbotOutputSchema },
        prompt: `You are an expert Canadian immigration assistant specializing in the National Occupational Classification (NOC) system. Your task is to help users find the correct NOC code based on their job title or duties.

        You have been provided with the most relevant document sections from a vector database based on the user's query. Use this information as your primary source of truth.

        User's query: "{{message}}"

        Conversation History:
        {{#each chatHistory}}
            - {{role}}: {{content}}
        {{/each}}

        Relevant Information from NOC Database:
        ---
        {{context}}
        ---

        Instructions:
        1.  Analyze the "Relevant Information" to find the best matching NOC code and title for the user's query.
        2.  If you find a strong match, state the NOC code and title clearly. Explain *why* it's a good match by referencing the duties or lead statements from the provided information.
        3.  If the information is ambiguous or if multiple codes could apply, ask the user clarifying questions to help them decide. For example: "It looks like your duties could fit under either NOC 12345 (Job A) or NOC 67890 (Job B). Do you primarily focus on [duty from Job A] or [duty from Job B]?"
        4.  If no relevant information is found, inform the user that you couldn't find a match and suggest they rephrase their query with more detail about their main job duties.
        5.  Be friendly, professional, and helpful. Start the first conversation by introducing yourself.`
    });

    const { output } = await prompt({
        message: input.message,
        context,
        chatHistory: input.chatHistory,
    });
    return output!;
  }
);
