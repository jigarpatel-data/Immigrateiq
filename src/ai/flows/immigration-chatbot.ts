// src/ai/flows/immigration-chatbot.ts
'use server';
/**
 * @fileOverview An AI chatbot for answering questions about Canadian immigration.
 *
 * - immigrationChatbot - A function that handles the chatbot conversation.
 * - ImmigrationChatbotInput - The input type for the immigrationChatbot function.
 * - ImmigrationChatbotOutput - The return type for the immigrationChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImmigrationChatbotInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('The chat history between the user and the chatbot.'),
});
export type ImmigrationChatbotInput = z.infer<typeof ImmigrationChatbotInputSchema>;

const ImmigrationChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user message.'),
});
export type ImmigrationChatbotOutput = z.infer<typeof ImmigrationChatbotOutputSchema>;

export async function immigrationChatbot(input: ImmigrationChatbotInput): Promise<ImmigrationChatbotOutput> {
  return immigrationChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'immigrationChatbotPrompt',
  input: {schema: ImmigrationChatbotInputSchema},
  output: {schema: ImmigrationChatbotOutputSchema},
  prompt: `You are an AI-powered chatbot assistant specialized in Canadian immigration processes, eligibility requirements, and required documentation. Your goal is to provide users with personalized guidance and support regarding their Canadian immigration inquiries.

  Context:
  - Current Chat History: {{chatHistory}}

  Instructions:
  - Use the current chat history to maintain context and provide relevant answers.
  - Be clear, concise, and accurate in your responses.
  - If you don't know the answer, politely admit it and suggest resources where the user can find more information.
  - Do not ask any clarifying questions, just answer the question to the best of your ability.
  
  User Message: {{{message}}}
  Chatbot Response: `,
});

const immigrationChatbotFlow = ai.defineFlow(
  {
    name: 'immigrationChatbotFlow',
    inputSchema: ImmigrationChatbotInputSchema,
    outputSchema: ImmigrationChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
