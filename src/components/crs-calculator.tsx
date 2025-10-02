
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Loader2, User, RefreshCw, Send } from "lucide-react";
import { crsCalculatorChatbot } from "@/lib/actions";
import type { CrsCalculatorChatbotOutput } from "@/ai/flows/crs-calculator-chatbot";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const initialMessage: ChatMessage = {
    role: "assistant",
    content: "Welcome to the conversational CRS Calculator! I'll ask you a few questions to estimate your score. Let's start when you're ready! Just say 'hi' or 'start'.",
};

export function CrsCalculator() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<CrsCalculatorChatbotOutput['scoreBreakdown'] | null>(null);
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleResponse = (response: CrsCalculatorChatbotOutput) => {
    if (response) {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      
      if (response.isFinished) {
        setIsFinished(true);
        setFinalScore(response.finalScore ?? 0);
        setScoreBreakdown(response.scoreBreakdown ?? []);
      }
    } else {
        const errorMessage: ChatMessage = {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
    }
  }
  
  const handleSubmit = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: messageText };
    setIsLoading(true);
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    const chatHistory = [...messages, userMessage].map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const result = await crsCalculatorChatbot({ chatHistory });
    handleResponse(result);
    setIsLoading(false);
  }, [messages]);

  const restart = () => {
    setMessages([initialMessage]);
    setIsFinished(false);
    setFinalScore(null);
    setScoreBreakdown(null);
    setIsLoading(false);
  };
  
  return (
    <Card className="h-[calc(100vh-15rem)] flex flex-col">
      <CardHeader>
        <CardTitle>CRS Score Calculator</CardTitle>
        <CardDescription>
          Answer the chatbot's questions to get an estimate of your CRS score.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between overflow-hidden">
        <ScrollArea className="flex-1 pr-4 -mr-4" viewportRef={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" ? "justify-end" : ""
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback>
                      <Bot className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-md rounded-lg px-4 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p>{message.content}</p>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback>
                    <Bot className="h-5 w-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg bg-muted px-4 py-2 text-sm">
                   <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
             {isFinished && finalScore !== null && (
                <Card className="bg-muted/50">
                    <CardHeader className="text-center">
                        <CardTitle>Your Estimated Score</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <p className="text-6xl font-bold text-primary">{finalScore}</p>
                        </div>
                        {scoreBreakdown && scoreBreakdown.length > 0 && (
                            <div className="space-y-2 pt-4 border-t">
                                <h4 className="font-medium text-center">Score Breakdown</h4>
                                {scoreBreakdown.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{item.category}:</span>
                                        <span className="font-semibold">{item.points}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-center">
                        <Button onClick={restart} variant="secondary">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Start Over
                        </Button>
                        <p className="text-xs text-muted-foreground">Disclaimer: This is an estimate only and not official advice.</p>
                    </CardFooter>
                </Card>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      {!isFinished && (
        <CardFooter className="border-t pt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(inputValue);
            }}
            className="relative w-full"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your answer..."
              disabled={isLoading}
              className="pr-12"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      )}
    </Card>
  );
}
