
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Loader2, Send, User, Search } from "lucide-react";
import { nocFinderChatbot } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Inputs = {
  message: string;
};

export function NocFinder() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<Inputs>();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const userMessage: ChatMessage = { role: "user", content: data.message };
    if (!data.message.trim()) return;

    setIsLoading(true);
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    form.reset();

    const chatHistory = newMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const result = await nocFinderChatbot({
      message: data.message,
      chatHistory: chatHistory,
    });

    if (result.response) {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: result.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } else {
        const errorMessage: ChatMessage = {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again later.",
        };
        setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };
  
  return (
    <Card className="h-[calc(100vh-16rem)] flex flex-col shadow-lg">
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-6" viewportRef={scrollAreaRef}>
          <div className="space-y-6">
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground pt-16">
                    <Search className="mx-auto h-12 w-12 mb-4" />
                    <h2 className="text-xl font-semibold">NOC Code Finder</h2>
                    <p>Describe your job title or main duties to find your NOC code.</p>
                </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-4",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="bg-secondary">
                      <Bot className="h-5 w-5 text-secondary-foreground" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-md rounded-lg px-4 py-3 text-sm prose dark:prose-invert prose-p:my-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {message.content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
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
              <div className="flex items-start gap-4 justify-start">
                <Avatar className="h-8 w-8 border">
                   <AvatarFallback className="bg-secondary">
                      <Bot className="h-5 w-5 text-secondary-foreground" />
                    </AvatarFallback>
                </Avatar>
                <div className="max-w-md rounded-lg px-4 py-3 text-sm bg-muted flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-4 bg-background/50 mt-auto">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="relative"
          >
            <Textarea
              {...form.register("message")}
              placeholder="e.g., I'm a software developer who works with React and Node.js"
              className="flex-1 resize-none pr-12"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  form.handleSubmit(onSubmit)();
                }
              }}
              disabled={isLoading}
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
        </div>
      </CardContent>
    </Card>
  );
}
