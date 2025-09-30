
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

const formSchema = z.object({
  age: z.coerce.number().min(18, "Must be at least 18").max(60, "Must be 60 or younger"),
  education: z.string().min(1, "Education level is required"),
  experience: z.coerce.number().min(0, "Work experience cannot be negative"),
  ielts_speaking: z.coerce.number().min(0).max(9),
  ielts_listening: z.coerce.number().min(0).max(9),
  ielts_reading: z.coerce.number().min(0).max(9),
  ielts_writing: z.coerce.number().min(0).max(9),
});

type EligibilityResult = {
  score: number;
  breakdown: { category: string, points: number }[];
};

export function CrsCalculator() {
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: 29,
      education: "Master's degree",
      experience: 3,
      ielts_speaking: 7.5,
      ielts_listening: 8.0,
      ielts_reading: 7.0,
      ielts_writing: 7.0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mocked CRS calculation logic
    const agePoints = (values.age < 30 ? 100 : 80);
    const educationPoints = (values.education === "Master's degree" ? 135 : 120);
    const experiencePoints = (values.experience >= 3 ? 120 : 100);
    const languagePoints = Math.floor((values.ielts_speaking + values.ielts_listening + values.ielts_reading + values.ielts_writing) * 3.5);
    const score = agePoints + educationPoints + experiencePoints + languagePoints;
    
    setResult({
      score,
      breakdown: [
        { category: "Age", points: agePoints },
        { category: "Education", points: educationPoints },
        { category: "Experience", points: experiencePoints },
        { category: "Language", points: languagePoints },
      ]
    });
    setLoading(false);
  }

  return (
    <ScrollArea className="h-[calc(100vh-13rem)] pr-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>CRS Score Calculator</CardTitle>
              <CardDescription>Fill in your details to get an estimate of your Comprehensive Ranking System (CRS) score.</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="age" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="education" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level of Education</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select education level" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="PhD">PhD</SelectItem>
                            <SelectItem value="Master's degree">Master's degree</SelectItem>
                            <SelectItem value="Two or more certificates">Two or more certificates, diplomas, or degrees</SelectItem>
                            <SelectItem value="Bachelor's degree">Bachelor's degree</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="experience" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Skilled Work Experience</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormDescription>In the last 10 years.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div>
                    <h3 className="text-md font-medium mb-4">IELTS Scores</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <FormField control={form.control} name="ielts_listening" render={({ field }) => (
                          <FormItem><FormLabel>Listening</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="ielts_reading" render={({ field }) => (
                          <FormItem><FormLabel>Reading</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="ielts_writing" render={({ field }) => (
                          <FormItem><FormLabel>Writing</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="ielts_speaking" render={({ field }) => (
                          <FormItem><FormLabel>Speaking</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Calculate Score
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Estimated Score</CardTitle>
              <CardDescription>Your estimated CRS score will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
              {!loading && !result && <div className="text-center text-muted-foreground p-8">Submit the form to see your score.</div>}
              {!loading && result && (
                <div className="space-y-4">
                    <div className="text-center">
                        <p className="text-muted-foreground">Estimated CRS Score</p>
                        <p className="text-5xl font-bold text-primary">{result.score}</p>
                    </div>
                    <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-medium">Score Breakdown</h4>
                        {result.breakdown.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{item.category}:</span>
                                <span className="font-semibold">{item.points}</span>
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">Disclaimer: This is an estimate only and not official advice. The final score may vary.</p>
             </CardFooter>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}

