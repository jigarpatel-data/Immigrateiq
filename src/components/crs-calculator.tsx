
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Bot } from "lucide-react";

type Question = {
  id: string;
  text: string;
  field: string;
  options: { text: string; value: any; points: number }[];
};

const questions: Question[] = [
  {
    id: "q1",
    field: "age",
    text: "What is your age?",
    options: [
      { text: "17 or less", value: 17, points: 0 },
      { text: "18 to 35", value: 25, points: 100 },
      { text: "36", value: 36, points: 95 },
      { text: "37", value: 37, points: 90 },
      { text: "38", value: 38, points: 85 },
      { text: "39", value: 39, points: 80 },
      { text: "40", value: 40, points: 75 },
      { text: "41", value: 41, points: 65 },
      { text: "42", value: 42, points: 55 },
      { text: "43", value: 43, points: 45 },
      { text: "44", value: 44, points: 35 },
      { text: "45", value: 45, points: 25 },
      { text: "46", value: 46, points: 15 },
      { text: "47 or more", value: 47, points: 0 },
    ],
  },
  {
    id: "q2",
    field: "education",
    text: "What is your highest level of education?",
    options: [
      { text: "Less than high school", value: "secondary", points: 0 },
      { text: "High school diploma", value: "secondary", points: 30 },
      { text: "1-year post-secondary", value: "one-year", points: 90 },
      { text: "2-year post-secondary", value: "two-year", points: 98 },
      { text: "Bachelor's degree (3+ years)", value: "bachelor", points: 120 },
      { text: "Two or more certificates/degrees", value: "two-or-more", points: 128 },
      { text: "Master's degree", value: "master", points: 135 },
      { text: "Doctoral degree (PhD)", value: "phd", points: 150 },
    ],
  },
  {
    id: "q3",
    field: "experience",
    text: "How many years of skilled work experience do you have?",
    options: [
        { text: "None or less than a year", value: 0, points: 0 },
        { text: "1 year", value: 1, points: 40 },
        { text: "2 years", value: 2, points: 53 },
        { text: "3 years", value: 3, points: 64 },
        { text: "4 years", value: 4, points: 72 },
        { text: "5 years or more", value: 5, points: 80 },
    ],
  },
  {
    id: "q4",
    field: "language",
    text: "What is your English or French language proficiency level (CLB)?",
    options: [
        { text: "CLB 4 to 6", value: "clb6", points: 9 },
        { text: "CLB 7", value: "clb7", points: 17 },
        { text: "CLB 8", value: "clb8", points: 23 },
        { text: "CLB 9", value: "clb9", points: 31 },
        { text: "CLB 10 or higher", value: "clb10", points: 34 },
    ],
  }
];

type Answer = {
  questionId: string;
  field: string;
  value: any;
  points: number;
  text: string;
};

export function CrsCalculator() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const handleAnswer = (option: Question["options"][0], question: Question) => {
    const newAnswer: Answer = {
      questionId: question.id,
      field: question.field,
      value: option.value,
      points: option.points,
      text: option.text,
    };
    setAnswers([...answers, newAnswer]);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const restart = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setIsFinished(false);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const totalScore = answers.reduce((acc, ans) => acc + ans.points, 0);

  const getPointsForCategory = (field: string) => {
    const answer = answers.find(a => a.field === field);
    return answer ? answer.points : 0;
  }

  const scoreBreakdown = [
    { category: "Age", points: getPointsForCategory('age') },
    { category: "Education", points: getPointsForCategory('education') },
    { category: "Experience", points: getPointsForCategory('experience') },
    { category: "Language", points: getPointsForCategory('language') },
  ];

  return (
    <Card className="h-[calc(100vh-13rem)] flex flex-col">
       <CardHeader>
          <CardTitle>CRS Score Calculator</CardTitle>
          <CardDescription>Answer a few questions to get an estimate of your Comprehensive Ranking System (CRS) score.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
            <ScrollArea className="pr-4 -mr-4">
                <div className="space-y-4">
                    {/* Display previous questions and answers */}
                    {answers.map((answer) => {
                        const question = questions.find(q => q.id === answer.questionId);
                        return (
                            <div key={answer.questionId} className="space-y-2">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                                    </Avatar>
                                    <div className="rounded-lg bg-muted px-4 py-2 text-sm">
                                        <p>{question?.text}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 justify-end">
                                     <div className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm">
                                        <p>{answer.text}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {/* Display current question or results */}
                    {!isFinished && (
                        <div className="flex items-start gap-3 animate-in fade-in-0 duration-500">
                             <Avatar className="h-8 w-8 border">
                                <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                            </Avatar>
                            <div className="rounded-lg bg-muted px-4 py-2 text-sm">
                                <p>{currentQuestion.text}</p>
                            </div>
                        </div>
                    )}

                    {isFinished && (
                        <Card className="bg-muted/50">
                             <CardHeader className="text-center">
                                <CardTitle>Your Estimated Score</CardTitle>
                             </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <p className="text-6xl font-bold text-primary">{totalScore}</p>
                                </div>
                                <div className="space-y-2 pt-4 border-t">
                                    <h4 className="font-medium text-center">Score Breakdown</h4>
                                    {scoreBreakdown.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{item.category}:</span>
                                            <span className="font-semibold">{item.points}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col gap-2 text-center">
                                <Button onClick={restart} variant="secondary">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Start Over
                                </Button>
                                <p className="text-xs text-muted-foreground">Disclaimer: This is an estimate only and not official advice. The final score may vary.</p>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </ScrollArea>
        </CardContent>

        {!isFinished && (
            <CardFooter className="border-t pt-6">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-2 pb-4">
                        {currentQuestion.options.map((option) => (
                        <Button
                            key={option.value}
                            variant="outline"
                            className="flex-shrink-0"
                            onClick={() => handleAnswer(option, currentQuestion)}
                        >
                            {option.text}
                        </Button>
                        ))}
                    </div>
                </ScrollArea>
            </CardFooter>
        )}
    </Card>
  );
}
