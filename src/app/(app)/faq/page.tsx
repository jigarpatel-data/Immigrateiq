
"use client";

import { useState, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { withAuth } from '@/hooks/use-auth';
import { Footer } from '@/components/footer';

const faqData = [
  {
    question: "What is Express Entry?",
    answer: "Express Entry is Canada's online system for managing applications for permanent residence from skilled workers. It includes the Federal Skilled Worker Program, Federal Skilled Trades Program, and Canadian Experience Class.",
  },
  {
    question: "How is the Comprehensive Ranking System (CRS) score calculated?",
    answer: "The CRS score is based on several factors, including age, education, language proficiency in English and/or French, work experience, and whether you have a job offer or a provincial nomination. Points are awarded for each factor, and the total determines your rank in the Express Entry pool.",
  },
  {
    question: "What is a Provincial Nominee Program (PNP)?",
    answer: "PNPs are immigration programs operated by Canadian provinces and territories. They allow provinces to nominate individuals who have the skills and experience needed in their local economies to apply for permanent residence.",
  },
  {
    question: "Do I need a job offer to immigrate to Canada?",
    answer: "While a valid job offer can significantly increase your CRS score and chances of receiving an invitation, it is not mandatory for all immigration programs, including the Federal Skilled Worker Program.",
  },
  {
    question: "What are the language requirements?",
    answer: "You must prove your proficiency in either English or French by taking an approved language test (like IELTS for English or TEF for French). The minimum required score varies by program.",
  },
  {
    question: "How long does the permanent residence application process take?",
    answer: "Processing times vary widely depending on the program. For Express Entry, the standard processing time is six months after you submit your complete application. Other streams may take longer.",
  },
];

function FaqPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaqs = useMemo(() => {
    if (!searchTerm) {
      return faqData;
    }
    return faqData.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <>
      <div className="space-y-6 max-w-4xl mx-auto">
        <header className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
          <p className="text-muted-foreground mt-2">
            Find answers to common questions about Canadian immigration.
          </p>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="text"
            placeholder="Search questions..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Accordion type="single" collapsible className="w-full">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-semibold">No questions found</p>
              <p>Try adjusting your search term.</p>
            </div>
          )}
        </Accordion>
      </div>
      <Footer />
    </>
  );
}

export default withAuth(FaqPage);
