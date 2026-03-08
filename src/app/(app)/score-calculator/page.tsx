"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Lock } from "lucide-react";

const calculators = [
  {
    title: "CRS Calculator",
    description: "Calculate your Comprehensive Ranking System score for Express Entry.",
    href: "/crs-calculator",
    available: true,
  },
  {
    title: "Ontario PNP Calculator",
    description: "Estimate your eligibility for Ontario Provincial Nominee Program.",
    href: "#",
    available: false,
  },
  {
    title: "BC PNP Calculator",
    description: "Estimate your eligibility for British Columbia Provincial Nominee Program.",
    href: "#",
    available: false,
  },
];

export default function ScoreCalculatorPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-muted-foreground text-base leading-relaxed">
          Choose a calculator to estimate your immigration score.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {calculators.map((calc) => (
          <Card
            key={calc.title}
            className={
              calc.available
                ? "hover:border-primary/50 hover:shadow-md transition-all cursor-pointer min-h-[180px] flex flex-col"
                : "opacity-75 min-h-[180px] flex flex-col"
            }
          >
            {calc.available ? (
              <Link href={calc.href}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {calc.title}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {calc.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium text-primary">Open calculator →</span>
                </CardContent>
              </Link>
            ) : (
              <>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {calc.title}
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {calc.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-muted-foreground">Coming soon</span>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
