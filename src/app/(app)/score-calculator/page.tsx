
"use client";

import { useState } from "react";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { calculateCrsScore, CrsFactors, educationLevels } from "@/lib/crs-calculator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { withAuth } from "@/hooks/use-auth";
import { ArrowLeft, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";


const formSchema = z.object({
    hasSpouse: z.enum(["no", "yes"]),
    age: z.coerce.number().min(17, "Age must be 17 or over."),
    education: z.enum(educationLevels),
    canadianWorkExperience: z.coerce.number().min(0),
    foreignWorkExperience: z.coerce.number().min(0),
    
    firstLanguage_listening: z.coerce.number().min(0).max(12),
    firstLanguage_reading: z.coerce.number().min(0).max(12),
    firstLanguage_writing: z.coerce.number().min(0).max(12),
    firstLanguage_speaking: z.coerce.number().min(0).max(12),
    
    hasSecondLanguage: z.enum(["no", "yes"]),
    secondLanguage_listening: z.coerce.number().min(0).max(12).optional(),
    secondLanguage_reading: z.coerce.number().min(0).max(12).optional(),
    secondLanguage_writing: z.coerce.number().min(0).max(12).optional(),
    secondLanguage_speaking: z.coerce.number().min(0).max(12).optional(),
    
    spouse_education: z.enum(educationLevels).optional(),
    spouse_canadianWorkExperience: z.coerce.number().min(0).optional(),
    spouse_firstLanguage_listening: z.coerce.number().min(0).max(12).optional(),
    spouse_firstLanguage_reading: z.coerce.number().min(0).max(12).optional(),
    spouse_firstLanguage_writing: z.coerce.number().min(0).max(12).optional(),
    spouse_firstLanguage_speaking: z.coerce.number().min(0).max(12).optional(),
    
    certificateOfQualification: z.enum(["no", "yes"]),
    provincialNomination: z.enum(["no", "yes"]),
    siblingInCanada: z.enum(["no", "yes"]),
    postSecondaryEducationInCanada: z.enum(["None", "1-2 years", "3+ years"]),
});

type FormValues = z.infer<typeof formSchema>;

const totalSteps = 7;

function ScoreCalculatorPage() {
    const [step, setStep] = useState(1);
    const [scoreDetails, setScoreDetails] = useState<CrsFactors | null>(null);
    const [finalScore, setFinalScore] = useState<number | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            hasSpouse: "no",
            age: 29,
            education: "Master's degree or professional degree",
            canadianWorkExperience: 1,
            foreignWorkExperience: 3,
            firstLanguage_listening: 7.5,
            firstLanguage_reading: 7,
            firstLanguage_writing: 7,
            firstLanguage_speaking: 7.5,
            hasSecondLanguage: "no",
            certificateOfQualification: "no",
            provincialNomination: "no",
            siblingInCanada: "no",
            postSecondaryEducationInCanada: "None",
        },
    });

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        const factors: CrsFactors = {
            hasSpouse: data.hasSpouse === "yes",
            age: { value: data.age, points: 0 },
            education: { value: data.education, points: 0 },
            canadianWorkExperience: { value: data.canadianWorkExperience, points: 0 },
            foreignWorkExperience: { value: data.foreignWorkExperience },
            firstLanguage: {
                listening: data.firstLanguage_listening,
                reading: data.firstLanguage_reading,
                writing: data.firstLanguage_writing,
                speaking: data.firstLanguage_speaking,
                points: 0,
            },
            secondLanguage: {
                listening: data.secondLanguage_listening ?? 0,
                reading: data.secondLanguage_reading ?? 0,
                writing: data.secondLanguage_writing ?? 0,
                speaking: data.secondLanguage_speaking ?? 0,
                points: 0,
            },
            spouse: {
                education: { value: data.spouse_education ?? educationLevels[0], points: 0 },
                canadianWorkExperience: { value: data.spouse_canadianWorkExperience ?? 0, points: 0 },
                firstLanguage: {
                    listening: data.spouse_firstLanguage_listening ?? 0,
                    reading: data.spouse_firstLanguage_reading ?? 0,
                    writing: data.spouse_firstLanguage_writing ?? 0,
                    speaking: data.spouse_firstLanguage_speaking ?? 0,
                    points: 0,
                },
                points: 0,
            },
            skillTransferability: {
                education: { points: 0 },
                foreignWorkExperience: { points: 0 },
                qualification: { points: 0 },
                points: 0,
            },
            additional: {
                provincialNomination: data.provincialNomination === "yes",
                siblingInCanada: data.siblingInCanada === "yes",
                postSecondaryEducationInCanada: data.postSecondaryEducationInCanada,
                frenchSkills: false, // This is derived inside the calculator
                points: 0,
            },
            certificateOfQualification: data.certificateOfQualification === 'yes',
        };

        const { totalScore, factors: detailedFactors } = calculateCrsScore(factors);
        setFinalScore(totalScore);
        setScoreDetails(detailedFactors);
        setStep(step + 1);
    };

    const nextStep = async () => {
        const isValid = await form.trigger(getFieldsForStep(step, form.getValues().hasSpouse === 'yes'));
        if (isValid) {
            setStep(s => s + 1);
        }
    }
    const prevStep = () => setStep(s => s - 1);
    
    const hasSpouse = form.watch("hasSpouse") === "yes";
    const hasSecondLanguage = form.watch("hasSecondLanguage") === "yes";

    return (
        <div className="space-y-8">
             <header>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">CRS Score Calculator</h1>
                <p className="text-muted-foreground">
                   A step-by-step tool to estimate your Comprehensive Ranking System score.
                </p>
            </header>

            <Card>
                 <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <Progress value={(step / totalSteps) * 100} className="mb-4" />
                            <CardTitle>
                                {step === 1 && "Personal Details"}
                                {step === 2 && "Education"}
                                {step === 3 && "Language Proficiency"}
                                {step === 4 && "Work Experience"}
                                {step === 5 && (hasSpouse ? "Spouse's Details" : "Additional Factors (Part 1)")}
                                {step === 6 && (hasSpouse ? "Additional Factors (Part 1)" : "Additional Factors (Part 2)")}
                                {step === 7 && "Additional Factors (Part 2)"}
                                {step === 8 && "Your Results"}
                            </CardTitle>
                             <CardDescription>
                                {`Step ${step} of ${totalSteps}`}
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-6 min-h-[300px]">
                            {step === 1 && (
                                <>
                                    <FormField control={form.control} name="hasSpouse" render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel>Will a spouse or common-law partner be immigrating with you?</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name="age" render={({ field }) => (
                                        <FormItem><FormLabel>What is your age?</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </>
                            )}
                            {step === 2 && (
                                 <FormField control={form.control} name="education" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>What is your highest level of education?</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select education level" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {educationLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            )}
                             {step === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-md font-medium mb-4">First Official Language (IELTS, CELPIP, etc.)</h3>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <FormField control={form.control} name="firstLanguage_listening" render={({ field }) => (<FormItem><FormLabel>Listening</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="firstLanguage_reading" render={({ field }) => (<FormItem><FormLabel>Reading</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="firstLanguage_writing" render={({ field }) => (<FormItem><FormLabel>Writing</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="firstLanguage_speaking" render={({ field }) => (<FormItem><FormLabel>Speaking</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                    </div>
                                     <FormField control={form.control} name="hasSecondLanguage" render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel>Do you have results for a second official language?</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    {hasSecondLanguage && (
                                        <div>
                                            <h3 className="text-md font-medium mb-4">Second Official Language Scores</h3>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                <FormField control={form.control} name="secondLanguage_listening" render={({ field }) => (<FormItem><FormLabel>Listening</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="secondLanguage_reading" render={({ field }) => (<FormItem><FormLabel>Reading</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="secondLanguage_writing" render={({ field }) => (<FormItem><FormLabel>Writing</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="secondLanguage_speaking" render={({ field }) => (<FormItem><FormLabel>Speaking</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                             {step === 4 && (
                                <div className="space-y-6">
                                    <FormField control={form.control} name="canadianWorkExperience" render={({ field }) => (
                                        <FormItem><FormLabel>Years of skilled work experience in Canada</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>In the last 10 years.</FormDescription><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="foreignWorkExperience" render={({ field }) => (
                                        <FormItem><FormLabel>Years of foreign skilled work experience</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>In the last 10 years.</FormDescription><FormMessage /></FormItem>
                                    )} />
                                </div>
                            )}
                             {step === 5 && hasSpouse && (
                                <div className="space-y-6">
                                     <FormField control={form.control} name="spouse_education" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Spouse's highest level of education</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select education level" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {educationLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                                            </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <FormField control={form.control} name="spouse_canadianWorkExperience" render={({ field }) => (
                                        <FormItem><FormLabel>Spouse's years of Canadian work experience</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <div>
                                        <h3 className="text-md font-medium mb-4">Spouse's Language Proficiency</h3>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <FormField control={form.control} name="spouse_firstLanguage_listening" render={({ field }) => (<FormItem><FormLabel>Listening</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="spouse_firstLanguage_reading" render={({ field }) => (<FormItem><FormLabel>Reading</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="spouse_firstLanguage_writing" render={({ field }) => (<FormItem><FormLabel>Writing</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="spouse_firstLanguage_speaking" render={({ field }) => (<FormItem><FormLabel>Speaking</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {(step === 5 && !hasSpouse || step === 6 && hasSpouse) && (
                                <div className="space-y-6">
                                     <FormField control={form.control} name="certificateOfQualification" render={({ field }) => (
                                        <FormItem className="space-y-3"><FormLabel>Do you have a certificate of qualification from a Canadian province, territory or federal body?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="provincialNomination" render={({ field }) => (
                                        <FormItem className="space-y-3"><FormLabel>Do you have a nomination from a province or territory?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                            )}
                            {(step === 6 && !hasSpouse || step === 7 && hasSpouse) && (
                                <div className="space-y-6">
                                     <FormField control={form.control} name="siblingInCanada" render={({ field }) => (
                                        <FormItem className="space-y-3"><FormLabel>Do you have a brother or sister living in Canada who is a citizen or permanent resident?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="postSecondaryEducationInCanada" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Did you complete any post-secondary education in Canada?</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="None">No</SelectItem>
                                                <SelectItem value="1-2 years">Yes, a program of 1 or 2 years</SelectItem>
                                                <SelectItem value="3+ years">Yes, a program of 3 years or longer</SelectItem>
                                            </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                </div>
                            )}
                             {step === 8 && scoreDetails && finalScore !== null && (
                                <div className="flex flex-col items-center text-center">
                                    <h2 className="text-2xl font-bold">Calculation Complete!</h2>
                                    <p className="text-muted-foreground">Based on your provided information.</p>
                                    <div className="my-6">
                                        <p className="text-lg">Your Estimated CRS Score is:</p>
                                        <p className="text-6xl font-bold text-accent my-2">{finalScore}</p>
                                        <p className="text-muted-foreground">out of 1200 points</p>
                                    </div>
                                    <ScoreBreakdownTable details={scoreDetails} />
                                </div>
                            )}

                        </CardContent>

                        <CardFooter className="border-t pt-6 justify-between">
                            {step > 1 && step <= totalSteps && (
                                <Button type="button" variant="ghost" onClick={prevStep}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button>
                            )}
                             {step === 8 && (
                                <Button type="button" variant="outline" onClick={() => setStep(1)}>Start Over</Button>
                            )}
                            <div className="flex-grow"></div>
                            {step < totalSteps && (
                                <Button type="button" onClick={nextStep}>Next</Button>
                            )}
                             {step === totalSteps && (
                                <Button type="submit">Calculate Score</Button>
                            )}
                        </CardFooter>
                    </form>
                </FormProvider>
            </Card>
        </div>
    )
}

function ScoreBreakdownTable({ details }: { details: CrsFactors }) {
    const coreHumanCapital = (details.age?.points ?? 0) +
        (details.education?.points ?? 0) +
        (details.firstLanguage?.points ?? 0) +
        (details.secondLanguage?.points ?? 0) +
        (details.canadianWorkExperience?.points ?? 0);

    const spousePoints = details.spouse?.points ?? 0;
    const skillTransferability = details.skillTransferability?.points ?? 0;
    const additionalPoints = details.additional?.points ?? 0;
    const total = coreHumanCapital + spousePoints + skillTransferability + additionalPoints;

    return (
         <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold">Core / Human Capital Factors: {coreHumanCapital}</h3>
                        <Table>
                            <TableBody>
                                <TableRow><TableCell>Age</TableCell><TableCell className="text-right">{details.age.points}</TableCell></TableRow>
                                <TableRow><TableCell>Level of Education</TableCell><TableCell className="text-right">{details.education.points}</TableCell></TableRow>
                                <TableRow><TableCell>Official Languages</TableCell><TableCell className="text-right">{details.firstLanguage.points + details.secondLanguage.points}</TableCell></TableRow>
                                <TableRow><TableCell>Canadian Work Experience</TableCell><TableCell className="text-right">{details.canadianWorkExperience.points}</TableCell></TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {details.hasSpouse && (
                        <div>
                            <h3 className="font-semibold">Spouse Factors: {spousePoints}</h3>
                            <Table>
                                <TableBody>
                                     <TableRow><TableCell>Level of Education</TableCell><TableCell className="text-right">{details.spouse.education.points}</TableCell></TableRow>
                                     <TableRow><TableCell>Official Languages</TableCell><TableCell className="text-right">{details.spouse.firstLanguage.points}</TableCell></TableRow>
                                     <TableRow><TableCell>Canadian Work Experience</TableCell><TableCell className="text-right">{details.spouse.canadianWorkExperience.points}</TableCell></TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div>
                        <h3 className="font-semibold">Skill Transferability Factors: {skillTransferability}</h3>
                        <Table>
                            <TableBody>
                                <TableRow><TableCell>Education</TableCell><TableCell className="text-right">{details.skillTransferability.education.points}</TableCell></TableRow>
                                <TableRow><TableCell>Foreign Work Experience</TableCell><TableCell className="text-right">{details.skillTransferability.foreignWorkExperience.points}</TableCell></TableRow>
                                <TableRow><TableCell>Certificate of Qualification</TableCell><TableCell className="text-right">{details.skillTransferability.qualification.points}</TableCell></TableRow>
                            </TableBody>
                        </Table>
                    </div>

                     <div>
                        <h3 className="font-semibold">Additional Points: {additionalPoints}</h3>
                         <Table>
                            <TableBody>
                                <TableRow><TableCell>Provincial Nomination</TableCell><TableCell className="text-right">{details.additional.provincialNomination ? 600 : 0}</TableCell></TableRow>
                                <TableRow><TableCell>Study in Canada</TableCell><TableCell className="text-right">{details.additional.postSecondaryEducationInCanada === '1-2 years' ? 15 : details.additional.postSecondaryEducationInCanada === '3+ years' ? 30 : 0}</TableCell></TableRow>
                                <TableRow><TableCell>Sibling in Canada</TableCell><TableCell className="text-right">{details.additional.siblingInCanada ? 15 : 0}</TableCell></TableRow>
                                <TableRow><TableCell>French-language skills</TableCell><TableCell className="text-right">{details.additional.frenchSkills ? 'TBD' : 0}</TableCell></TableRow>
                            </TableBody>
                        </Table>
                    </div>

                     <div className="font-bold text-lg flex justify-between border-t pt-4">
                        <span>Grand Total</span>
                        <span>{total}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

const getFieldsForStep = (step: number, hasSpouse: boolean): (keyof FormValues)[] => {
    switch (step) {
        case 1: return ["hasSpouse", "age"];
        case 2: return ["education"];
        case 3: return ["firstLanguage_listening", "firstLanguage_reading", "firstLanguage_writing", "firstLanguage_speaking", "hasSecondLanguage"];
        case 4: return ["canadianWorkExperience", "foreignWorkExperience"];
        case 5: return hasSpouse ? ["spouse_education", "spouse_canadianWorkExperience", "spouse_firstLanguage_listening", "spouse_firstLanguage_reading", "spouse_firstLanguage_writing", "spouse_firstLanguage_speaking"] : ["certificateOfQualification", "provincialNomination"];
        case 6: return hasSpouse ? ["certificateOfQualification", "provincialNomination"] : ["siblingInCanada", "postSecondaryEducationInCanada"];
        case 7: return hasSpouse ? ["siblingInCanada", "postSecondaryEducationInCanada"] : [];
        default: return [];
    }
}


export default withAuth(ScoreCalculatorPage);

    
