
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart } from "recharts";
import { TrendingUp, Target, Users, CheckCircle } from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";

const chartData = [
  { month: "January", score: 480 },
  { month: "February", score: 485 },
  { month: "March", score: 490 },
  { month: "April", score: 488 },
  { month: "May", score: 495 },
  { month: "June", score: 501 },
];

const chartConfig = {
  score: {
    label: "CRS Score",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const eligibilityData = [
  { program: "Express Entry", value: 45, fill: "hsl(var(--chart-1))" },
  { program: "PNP", value: 30, fill: "hsl(var(--chart-2))" },
  { program: "Other", value: 25, fill: "hsl(var(--chart-4))" },
];

const eligibilityConfig = {
    value: {
      label: "Eligibility",
    },
    "Express Entry": {
      label: "Express Entry",
      color: "hsl(var(--chart-1))",
    },
    PNP: {
      label: "PNP",
      color: "hsl(var(--chart-2))",
    },
    Other: {
      label: "Other",
      color: "hsl(var(--chart-4))",
    },
} satisfies ChartConfig;


const recentDraws = [
  { date: "2024-07-19", program: "General", invitations: "4,500", score: "522" },
  { date: "2024-07-02", program: "PNP", invitations: "1,250", score: "698" },
  { date: "2024-06-19", program: "General", invitations: "3,000", score: "525" },
  { date: "2024-05-31", program: "CEC", invitations: "3,000", score: "522" },
  { date: "2024-05-30", program: "PNP", invitations: "2,985", score: "676" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your personalized Canadian immigration overview.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current CRS Score
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">498</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eligibility Status
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Eligible</div>
            <p className="text-xs text-muted-foreground">
              For Express Entry Pool
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Latest Draw Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">522</div>
            <p className="text-xs text-muted-foreground">General Draw</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Programs
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Programs you may be eligible for
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CRS Score Trend</CardTitle>
            <CardDescription>Your estimated score over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="score" fill="var(--color-score)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Program Eligibility</CardTitle>
            <CardDescription>Breakdown of your potential eligibility.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
             <ChartContainer
              config={eligibilityConfig}
              className="mx-auto aspect-square h-64"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={eligibilityData}
                  dataKey="value"
                  nameKey="program"
                  innerRadius={60}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="program" />}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Draws History</CardTitle>
          <CardDescription>
            A look at the most recent Express Entry draws.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead className="text-right">Invitations</TableHead>
                  <TableHead className="text-right">CRS Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDraws.map((draw) => (
                  <TableRow key={draw.date}>
                    <TableCell className="font-medium">{draw.date}</TableCell>
                    <TableCell>
                      <Badge variant={draw.program === 'General' ? 'default' : 'secondary'} className={draw.program === 'General' ? 'bg-accent text-accent-foreground' : ''}>{draw.program}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{draw.invitations}</TableCell>
                    <TableCell className="text-right font-semibold">{draw.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-4 md:hidden">
            {recentDraws.map((draw) => (
              <div key={draw.date} className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{draw.date}</span>
                  <Badge variant={draw.program === 'General' ? 'default' : 'secondary'} className={draw.program === 'General' ? 'bg-accent text-accent-foreground' : ''}>{draw.program}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invitations:</span>
                  <span>{draw.invitations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CRS Score:</span>
                  <span className="font-bold text-accent">{draw.score}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
