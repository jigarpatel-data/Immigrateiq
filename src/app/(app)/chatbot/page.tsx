
"use client";

import { ChatInterface } from "@/components/chat-interface";
import { CrsCalculator } from "@/components/crs-calculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { withAuth } from "@/hooks/use-auth";
import { Bot, Calculator } from "lucide-react";

function ChatbotPage() {
  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="chatbot" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="chatbot">
            <Bot className="mr-2 h-4 w-4" />
            AI Chatbot
            </TabsTrigger>
          <TabsTrigger value="calculator">
            <Calculator className="mr-2 h-4 w-4" />
            CRS Calculator
            </TabsTrigger>
        </TabsList>
        <TabsContent value="chatbot" className="flex-1 mt-4">
          <ChatInterface />
        </TabsContent>
        <TabsContent value="calculator" className="flex-1 mt-4">
          <CrsCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withAuth(ChatbotPage);
