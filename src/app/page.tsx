
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle, BarChart, Search, Bot, BookUser, Star, Menu, ArrowUpRight } from "lucide-react";
import placeholderImages from "@/lib/placeholder-images.json";
import { Footer } from "@/components/footer";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";

const features = [
    { icon: <CheckCircle className="h-6 w-6 text-accent" />, text: "Personalized PR eligibility checker" },
    { icon: <BarChart className="h-6 w-6 text-accent" />, text: "Real-time immigration draw tracker" },
    { icon: <BarChart className="h-6 w-6 text-accent" />, text: "Real-time immigration Program tracker" },
    { icon: <Search className="h-6 w-6 text-accent" />, text: "Find NOC for your occupation" },
    { icon: <BookUser className="h-6 w-6 text-accent" />, text: "Find programs eligible for PGWP" },
    { icon: <BookUser className="h-6 w-6 text-accent" />, text: "Find occupation eligible for Spousal open work permit" },
    { icon: <Bot className="h-6 w-6 text-accent" />, text: "AI chatbot for PR questions" },
    { icon: <CheckCircle className="h-6 w-6 text-accent" />, text: "Score calculator" },
    { icon: <Star className="h-6 w-6 text-accent" />, text: "Expert consultation booking" },
]

const featureCards = [
    { 
        title: "Eligibility Checker", 
        description: "Enter your details, instantly see your score & options.",
        icon: <CheckCircle className="h-10 w-10 text-accent mb-4" />
    },
    { 
        title: "Draw Tracker", 
        description: "Stay updated on the latest cutoffs and invitations.",
        icon: <BarChart className="h-10 w-10 text-accent mb-4" />
    },
    { 
        title: "NOC Finder", 
        description: "Match your job code to the right PR programs.",
        icon: <Search className="h-10 w-10 text-accent mb-4" />
    },
    { 
        title: "AI Assistant", 
        description: "Get instant, reliable answers to your immigration questions.",
        icon: <Bot className="h-10 w-10 text-accent mb-4" />
    },
]

const faqData = [
  {
    question: "Is this legal advice?",
    answer: "No, this is an information tool to guide your journey. We are not lawyers or licensed immigration consultants. Always consult with a professional for legal advice.",
  },
  {
    question: "Do I need a consultant?",
    answer: "Our app shows you pathways and provides powerful tools. You can choose to handle the process yourself or book expert help when you need it.",
  },
  {
    question: "What makes this different?",
    answer: "We combine real-time immigration data, AI guidance, and personalized tools — all in one place, designed to be simple, transparent, and affordable.",
  },
];

export default function HomePage() {
  const heroImage = placeholderImages.find(p => p.id === 'hero-people-goals');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm print:hidden">
          <div className="container mx-auto flex h-16 items-center justify-between px-[5%]">
            <Link href="/" className="flex items-center gap-2">
                <Image src="https://firebasestorage.googleapis.com/v0/b/thecanindian.firebasestorage.app/o/Black%20background-final.png?alt=media&token=9086963b-efba-4599-8ff3-76ca37d7ba1c" alt="TheCanIndian Logo" width={150} height={40} />
            </Link>
            <div className="hidden items-center gap-2 md:flex">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/auth">Sign In</Link>
                </Button>
                <Button size="sm" variant="secondary" asChild>
                    <Link href="/auth">Get Started</Link>
                </Button>
            </div>
            <div className="md:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                        <nav className="flex flex-col gap-6 text-lg font-medium mt-10">
                            <SheetClose asChild>
                                <Link href="/auth" className="text-muted-foreground transition-colors hover:text-foreground">
                                    Sign In
                                </Link>
                            </SheetClose>
                             <SheetClose asChild>
                                <Link href="/auth" className="text-foreground transition-colors hover:text-foreground">
                                    Get Started
                                </Link>
                            </SheetClose>
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
          </div>
      </header>
      <main>
        {/* Hero Section */}
        <section className="pt-20 pb-20 text-center bg-[#0A0B0B]">
            <div className="w-full max-w-7xl mx-auto px-[5%]">
                 {heroImage && (
                <div className="relative aspect-[16/9] w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl">
                    <Image 
                        src={heroImage.src}
                        alt={heroImage.alt}
                        fill
                        priority
                        className="object-contain"
                        data-ai-hint={heroImage['data-ai-hint']}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
                </div>
                )}
                <div className="max-w-5xl mx-auto mt-0">
                    <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl animate-fade-in-up">
                        Find the best path to Canadian PR with AI-powered guidance
                    </h1>
                     <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-4xl mx-auto">
                        Check your eligibility, track immigration draws, and explore PR pathways - all in one place.
                     </p>
                     <div className="mt-10 animate-fade-in-up animation-delay-3000">
                      <div className="relative rounded-full border bg-card p-2 shadow-inner">
                        <div className="flex items-center">
                          <Search className="ml-4 h-5 w-5 text-muted-foreground" />
                          <div className="w-full text-left ml-4 overflow-hidden whitespace-nowrap">
                            <p className="animate-typing-container border-l-2 border-primary-foreground text-muted-foreground">
                              Search for NOC, programs, pr draws...
                            </p>
                          </div>
                          <Button asChild className="mr-1 rounded-md" size="icon" variant="secondary">
                            <Link href="/auth">
                                <ArrowUpRight className="h-5 w-5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Core Value Proposition */}
        <section id="why-us" className="py-20 bg-muted/30">
          <div className="w-full max-w-7xl mx-auto px-[5%] text-center">
            <h2 className="text-3xl font-bold">Why choose our app?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Simplify your immigration journey with tools built to save you time and stress.
            </p>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start text-left gap-4 p-4 rounded-lg hover:bg-muted transition-colors">
                    {feature.icon}
                    <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="features" className="py-20">
          <div className="w-full max-w-7xl mx-auto px-[5%] text-center">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Everything you need for a smarter immigration strategy.
            </p>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featureCards.map((card, index) => (
                    <Card key={index} className="text-center">
                        <CardHeader>
                            {card.icon}
                            <CardTitle>{card.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{card.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
          </div>
        </section>

        {/* Social Proof Placeholder */}
        <section id="social-proof" className="py-20 bg-muted/30">
          <div className="w-full max-w-7xl mx-auto px-[5%] text-center">
            <h2 className="text-3xl font-bold">Trusted by Aspiring Canadians</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Join thousands of users who are simplifying their journey to Canada.
            </p>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Placeholder for testimonials */}
                <Card><CardContent className="p-6"><p className="italic">"This app was a game-changer for my Express Entry application." - Priya S.</p></CardContent></Card>
                <Card><CardContent className="p-6"><p className="italic">"The draw tracker is incredibly useful. Finally, all the info in one place!" - Omar A.</p></CardContent></Card>
                <Card><CardContent className="p-6"><p className="italic">"I used the AI chatbot to clarify so many doubts. Highly recommended!" - Chen L.</p></CardContent></Card>
            </div>
          </div>
        </section>
        
        {/* Call-to-Action */}
        <section id="cta" className="py-20">
            <div className="w-full max-w-7xl mx-auto px-[5%] text-center">
                <h2 className="text-3xl font-bold">Ready to take the next step?</h2>
                <div className="mt-6">
                    <Link href="/auth">
                        <Button size="lg">Get Started Free</Button>
                    </Link>
                </div>
            </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-muted/30">
            <div className="w-full max-w-7xl mx-auto px-[5%] text-center">
                <h2 className="text-3xl font-bold">Simple & Transparent Pricing</h2>
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <Card className="text-left">
                        <CardHeader>
                            <CardTitle>Free</CardTitle>
                            <CardDescription>Get started with the essentials.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-4xl font-bold">$0</p>
                            <ul className="space-y-2 text-muted-foreground">
                                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Basic Score eligibility check</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Chatbot trial (3 days)</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Score calculator</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Link href="/auth" className="w-full">
                                <Button className="w-full" variant="outline">Start for Free</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                    <Card className="text-left border-accent ring-2 ring-accent">
                        <CardHeader>
                            <CardTitle>Premium</CardTitle>
                            <CardDescription>Unlock the full suite of immigration tools.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-4xl font-bold">$5 <span className="text-lg font-normal text-muted-foreground">/ month</span></p>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-accent" /> Draw tracker</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-accent" /> Historical data</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-accent" /> Unlimited chatbot access</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-accent" /> Expert booking discounts</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-accent" /> Credits for AI chatbot</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                          <Link href="/auth" className="w-full">
                            <Button className="w-full">Go Premium</Button>
                          </Link>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20">
            <div className="w-full max-w-7xl mx-auto px-[5%] text-center max-w-3xl">
                <h2 className="text-3xl font-bold">About Us</h2>
                <p className="mt-6 text-lg text-muted-foreground">
                    We’re immigrants ourselves. We built this app because the process was confusing, costly, and overwhelming. Our mission is simple: <strong>make immigration easier, faster, and more transparent for everyone.</strong>
                </p>
            </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-muted/30">
            <div className="w-full max-w-7xl mx-auto px-[5%] max-w-3xl">
                <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="w-full mt-8">
                    {faqData.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left text-lg">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-base">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>

        {/* Final CTA */}
        <section id="final-cta" className="py-20 border-t">
          <div className="w-full max-w-7xl mx-auto px-[5%] text-center">
            <h2 className="text-3xl font-bold">Start your PR journey today — it’s free.</h2>
            <div className="mt-6">
                <Link href="/auth">
                    <Button size="lg">Get Started Free</Button>
                </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

    

    

    




    

    

    

    

    

    