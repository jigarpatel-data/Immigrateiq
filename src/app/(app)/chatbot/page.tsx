
"use client";

import { ChatInterface } from "@/components/chat-interface";
import { CrsCalculator } from "@/components/crs-calculator";
import { NocFinder } from "@/components/noc-finder";
import { PremiumContent } from "@/components/premium-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { withAuth } from "@/hooks/use-auth";
import { Bot, Calculator, Search } from "lucide-react";

function ChatbotPage() {
  return (
    <PremiumContent>
      <div className="flex flex-col h-full">
        <Tabs defaultValue="chatbot" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="chatbot">
              <Bot className="mr-2 h-4 w-4" />
              AI Chatbot
            </TabsTrigger>
            <TabsTrigger value="calculator">
              <Calculator className="mr-2 h-4 w-4" />
              CRS Calculator
            </TabsTrigger>
             <TabsTrigger value="noc-finder">
              <Search className="mr-2 h-4 w-4" />
              NOC Finder
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chatbot" className="flex-1 mt-4">
            <ChatInterface />
          </TabsContent>
          <TabsContent value="calculator" className="flex-1 mt-4">
            <CrsCalculator />
          </TabsContent>
           <TabsContent value="noc-finder" className="flex-1 mt-4">
            <NocFinder />
          </TabsContent>
        </Tabs>
      </div>
    </PremiumContent>
  );
}

export default withAuth(ChatbotPage);
