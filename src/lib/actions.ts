
"use server";

import {
  immigrationChatbot,
  type ImmigrationChatbotInput,
} from "@/ai/flows/immigration-chatbot";
import {
  crsCalculator,
  type CrsCalculatorInput,
} from "@/ai/flows/crs-calculator-flow";

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

export async function handleCrsCalculation(input: CrsCalculatorInput) {
  try {
    const result = await crsCalculator(input);
    return { success: true, ...result };
  } catch (error) {
    console.error("CRS Calculator action error:", error);
    return {
      success: false,
      response: "An error occurred while processing your request. Please try again later.",
    };
  }
}
