"use server";

import {
  immigrationChatbot,
  type ImmigrationChatbotInput,
} from "@/ai/flows/immigration-chatbot";

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
