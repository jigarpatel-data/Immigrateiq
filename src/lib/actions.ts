

"use server";

import {
  immigrationChatbot,
  type ImmigrationChatbotInput,
} from "@/ai/flows/immigration-chatbot";
import {
  crsCalculatorChatbot as crsCalculatorChatbotFlow,
  type CrsCalculatorChatbotInput,
  type CrsCalculatorChatbotOutput,
} from "@/ai/flows/crs-calculator-chatbot";
import { extractSearchTerm } from "@/ai/flows/search-term-extractor";
import { getDrawDetails as getAirtableDrawDetails } from './airtable';

export async function handleChat(input: ImmigrationChatbotInput) {
  try {
    const result = await immigrationChatbot(input);
    return { success: true, ...result };
  } catch (error) {
    console.error("Chatbot action error:", error);
    return {
      success: false,
      response: "An error occurred while processing your request. Please try again later.",
    };
  }
}

export async function crsCalculatorChatbot(input: CrsCalculatorChatbotInput): Promise<CrsCalculatorChatbotOutput> {
  return await crsCalculatorChatbotFlow(input);
}


export async function getDrawDetails(recordId: string) {
    return getAirtableDrawDetails(recordId);
}

export async function getEnhancedSearchTerm(query: string): Promise<{ searchTerm?: string }> {
  if (!query) {
    return {};
  }
  try {
    const result = await extractSearchTerm({ query });
    // If the AI returns a specific term, use it. Otherwise, fallback to the original query.
    return { searchTerm: result.searchTerm || query };
  } catch (error) {
    console.error("Search term enhancement error:", error);
    // In case of an error, just fallback to the original query.
    return { searchTerm: query };
  }
}
