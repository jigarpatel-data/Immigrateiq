"use client";

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

const allDraws = [
  { date: "2024-07-19", round: "297", program: "General", invitations: "4,500", score: "522" },
  { date: "2024-07-02", round: "296", program: "Provincial Nominee Program", invitations: "1,250", score: "698" },
  { date: "2024-06-19", round: "295", program: "General", invitations: "3,000", score: "525" },
  { date: "2024-05-31", round: "294", program: "Canadian Experience Class", invitations: "3,000", score: "522" },
  { date: "2024-05-30", round: "293", program: "Provincial Nominee Program", invitations: "2,985", score: "676" },
  { date: "2024-04-24", round: "292", program: "French language proficiency", invitations: "1,400", score: "410" },
  { date: "2024-04-23", round: "291", program: "General", invitations: "2,095", score: "529" },
  { date: "2024-04-11", round: "290", program: "STEM occupations", invitations: "4,500", score: "491" },
  { date: "2024-04-10", round: "289", program: "General", invitations: "1,280", score: "549" },
  { date: "2024-03-26", round: "288", program: "French language proficiency", invitations: "1,500", score: "388" },
  { date: "2024-03-25", round: "287", program: "General", invitations: "1,980", score: "524" },
  { date: "2024-03-13", round: "286", program: "Transport occupations", invitations: "975", score: "430" },
];

const programOptions = ["All", "General", "Provincial Nominee Program", "Canadian Experience Class", "French language proficiency", "STEM occupations", "Transport occupations"];

export default function DrawTrackerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('All');

  const filteredDraws = useMemo(() => {
    return allDraws.filter(draw => {
      const matchesProgram = programFilter === 'All' || draw.program === programFilter;
      const matchesSearch = searchTerm === '' || draw.score.includes(searchTerm) || draw.round.includes(searchTerm);
      return matchesProgram && matchesSearch;
    });
  }, [searchTerm, programFilter]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Draw Tracker</h1>
        <p className="text-muted-foreground">
          Visualize the latest immigration draws and filter by program.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Express Entry Draws</CardTitle>
          <CardDescription>
            Filter and search through the history of Express Entry draws.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Search by round or score..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Filter by program" />
              </SelectTrigger>
              <SelectContent>
                {programOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead className="text-right">Invitations Issued</TableHead>
                  <TableHead className="text-right">CRS Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDraws.length > 0 ? (
                  filteredDraws.map((draw, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{draw.date}</TableCell>
                      <TableCell>{draw.round}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{draw.program}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{draw.invitations}</TableCell>
                      <TableCell className="text-right font-bold text-accent">{draw.score}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No draws found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
