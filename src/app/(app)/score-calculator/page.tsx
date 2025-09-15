
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Loader2, Send, User, Calculator } from "lucide-react";
import { handleCrsCalculation } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CrsFactors } from "@/lib/crs-calculator";
import { withAuth } from "@/hooks/use-auth";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Inputs = {
  message: string;
};

const initialMessage: ChatMessage = {
    role: "assistant",
    content: "Welcome to the CRS Score Calculator! I will ask you a series of questions to help estimate your score. To start, are you single, or do you have a spouse/common-law partner who will be coming with you to Canada?",
};


function ScoreCalculatorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [scoreDetails, setScoreDetails] = useState<CrsFactors | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const form = useForm<Inputs>();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const userMessage: ChatMessage = { role: "user", content: data.message };
    if (!data.message.trim()) return;

    setIsLoading(true);
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    form.reset();

    const chatHistory = currentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const result = await handleCrsCalculation({
      chatHistory: chatHistory,
    });

    if (result.success && result.response) {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: result.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (result.isComplete && result.finalScore !== undefined && result.scoreDetails) {
          setIsComplete(true);
          setFinalScore(result.finalScore);
          setScoreDetails(result.scoreDetails);
      }

    } else {
        const errorMessage: ChatMessage = {
            role: "assistant",
            content: result.response || "Sorry, something went wrong.",
        };
        setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };
  
  const scoreCategories = useMemo(() => {
      if (!scoreDetails) return [];
      const coreHumanCapital = (scoreDetails.age?.points ?? 0) +
        (scoreDetails.education?.points ?? 0) +
        (scoreDetails.firstLanguage?.points ?? 0) +
        (scoreDetails.secondLanguage?.points ?? 0) +
        (scoreDetails.canadianWorkExperience?.points ?? 0);

      const spousePoints = scoreDetails.spouse?.points ?? 0;
      const skillTransferability = scoreDetails.skillTransferability?.points ?? 0;
      const additionalPoints = scoreDetails.additional?.points ?? 0;
      const total = coreHumanCapital + spousePoints + skillTransferability + additionalPoints;

      return [
        { name: "Core / Human Capital", score: coreHumanCapital },
        { name: "Spouse Factors", score: spousePoints },
        { name: "Skill Transferability", score: skillTransferability },
        { name: "Additional Points", score: additionalPoints },
        { name: "Total Score", score: total, isTotal: true },
      ];
  }, [scoreDetails])


  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">CRS Score Calculator</h1>
        <p className="text-muted-foreground">
          An interactive, conversational tool to estimate your score.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 h-full">
            <Card className="flex-1 flex flex-col h-full max-h-[calc(100vh-theme(spacing.40))]">
                <CardContent className="flex-1 flex flex-col p-0">
                    <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                    <div className="space-y-6">
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
                                <AvatarFallback>
                                <Bot className="h-5 w-5 text-primary" />
                                </AvatarFallback>
                            </Avatar>
                            )}
                            <div
                            className={cn(
                                "max-w-md rounded-lg px-4 py-3 text-sm prose-p:my-1",
                                message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
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
                            <AvatarFallback>
                                <Bot className="h-5 w-5 text-primary" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="max-w-md rounded-lg px-4 py-3 text-sm bg-muted flex items-center">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        </div>
                        )}
                    </div>
                    </ScrollArea>
                     {!isComplete && (
                        <div className="border-t p-4 bg-background/50">
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="flex items-center gap-4"
                        >
                            <Textarea
                            {...form.register("message")}
                            placeholder="Type your answer here..."
                            className="flex-1 resize-none"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                form.handleSubmit(onSubmit)();
                                }
                            }}
                            disabled={isLoading}
                            autoFocus
                            />
                            <Button type="submit" size="icon" disabled={isLoading}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                            </Button>
                        </form>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
        <div className="space-y-6">
            <Card>
                <CardHeader className="text-center items-center">
                    <Calculator className="h-10 w-10 text-accent mb-2" />
                    <CardTitle>Your Estimated Score</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-5xl font-bold text-accent">{isComplete ? finalScore : '...'}</p>
                    <p className="text-sm text-muted-foreground mt-1">out of 1200 points</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Score Breakdown</CardTitle>
                    <CardDescription>Points per category based on your answers.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scoreCategories.map((item) => (
                                <TableRow key={item.name} className={cn(item.isTotal && "bg-muted/50 font-bold")}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right font-medium">{isComplete ? item.score : '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ScoreCalculatorPage);
