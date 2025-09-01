
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
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { withAuth } from "@/hooks/use-auth";

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
  program: string;
  eligible: boolean;
  score: number;
  details: string;
};

function ProgramTrackerPage() {
  const [results, setResults] = useState<EligibilityResult[] | null>(null);
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
    // Simulate API call and score calculation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mocked eligibility logic
    const score = (values.age < 30 ? 100 : 80) +
                  (values.education === "Master's degree" ? 135 : 120) +
                  (values.experience >= 3 ? 120 : 100) +
                  Math.floor((values.ielts_speaking + values.ielts_listening + values.ielts_reading + values.ielts_writing) * 3);
    
    setResults([
      {
        program: "Express Entry - Federal Skilled Worker",
        eligible: score > 450,
        score: score,
        details: "Based on the information provided, your estimated CRS score makes you a competitive candidate."
      },
      {
        program: "Provincial Nominee Program (PNP)",
        eligible: values.experience >= 2,
        score: 0, // PNP has its own scoring system, not CRS
        details: "You may be eligible for various PNP streams depending on your occupation and provincial ties."
      }
    ]);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Program Tracker</h1>
        <p className="text-muted-foreground">
          Check your eligibility for various PR programs.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Eligibility Calculator</CardTitle>
              <CardDescription>Fill in your details to get an estimate of your eligibility and CRS score.</CardDescription>
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
                    Check Eligibility
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Your estimated results will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
              {!loading && !results && <div className="text-center text-muted-foreground p-8">Submit the form to see your results.</div>}
              {!loading && results && results.map((result, index) => (
                <Card key={index} className={result.eligible ? 'border-green-500' : 'border-red-500'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {result.eligible ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                      {result.program}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-bold">Status: <span className={result.eligible ? 'text-green-500' : 'text-red-500'}>{result.eligible ? 'Likely Eligible' : 'Likely Not Eligible'}</span></p>
                    {result.score > 0 && <p className="text-sm">Estimated Score: <span className="font-bold text-accent">{result.score}</span></p>}
                    <p className="text-sm text-muted-foreground mt-2">{result.details}</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="link" className="p-0 h-auto">Learn more about this program</Button>
                  </CardFooter>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ProgramTrackerPage);
