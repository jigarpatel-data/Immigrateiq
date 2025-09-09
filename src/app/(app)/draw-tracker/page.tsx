
"use client";

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
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
import { Button } from '@/components/ui/button';
import { withAuth } from '@/hooks/use-auth';
import { Award, Building, Calendar, ChevronsUpDown, ExternalLink, Filter, Loader2, Search, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAirtableDraws, type Draw } from '@/lib/airtable';

function DrawTrackerPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    async function fetchData() {
      const { draws: fetchedDraws, error: fetchError } = await getAirtableDraws();
      if (fetchError) {
        setError(fetchError);
      } else if (fetchedDraws) {
        const formattedDraws = fetchedDraws.map(d => ({ ...d.fields, id: d.id }));
        setDraws(formattedDraws);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const provinceOptions = useMemo(() => ["All", ...new Set(draws.map(d => d.Province))], [draws]);
  const categoryOptions = useMemo(() => ["All", ...new Set(draws.map(d => d.Category))], [draws]);

  const filteredAndSortedDraws = useMemo(() => {
    let result = [...draws];

    // Filtering
    result = result.filter(draw => {
      const matchesProvince = provinceFilter === 'All' || draw.Province === provinceFilter;
      const matchesCategory = categoryFilter === 'All' || draw.Category === categoryFilter;
      const matchesSearch = searchTerm === '' || 
        (draw["NOC/Other"] && draw["NOC/Other"].toLowerCase().includes(searchTerm.toLowerCase())) ||
        draw.Category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        draw.Province.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesProvince && matchesCategory && matchesSearch;
    });

    // Sorting
    result.sort((a, b) => {
      const dateA = new Date(a["Draw Date"]).getTime();
      const dateB = new Date(b["Draw Date"]).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [draws, searchTerm, provinceFilter, categoryFilter, sortOrder]);

  const resetFilters = () => {
    setSearchTerm('');
    setProvinceFilter('All');
    setCategoryFilter('All');
    setSortOrder('newest');
  };
  
  const activeFilterCount = [searchTerm, provinceFilter, categoryFilter].filter(f => f && f !== 'All').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold tracking-tight">Loading Draws...</h1>
        <p className="text-muted-foreground">Fetching the latest data from Airtable.</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="text-center py-16 bg-destructive/10 text-destructive border border-destructive rounded-lg p-4">
        <X className="mx-auto h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Failed to load draws</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Draw Tracker</h1>
        <p className="text-muted-foreground">
          Explore the latest Provincial and Federal immigration draws.
        </p>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Filter and Sort Draws</CardTitle>
          <div className="flex flex-wrap gap-4 pt-4">
              <div className="relative flex-grow min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                      placeholder="Search by NOC, Category, Province..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                  />
              </div>
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by province" />
                  </SelectTrigger>
                  <SelectContent>
                      {provinceOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
               <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                      {categoryOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                        <ChevronsUpDown className="mr-2 h-4 w-4" />
                        Sort by Date
                        <Badge variant="secondary" className="ml-2">{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</Badge>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortOrder('newest')}>Newest First</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('oldest')}>Oldest First</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {activeFilterCount > 0 && (
                <Button variant="ghost" onClick={resetFilters} className="w-full sm:w-auto">
                    <X className="mr-2 h-4 w-4" />
                    Reset
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedDraws.length > 0 ? (
                filteredAndSortedDraws.map((draw) => (
                  <Card key={draw.id} className="flex flex-col">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />{draw["Draw Date"]}</p>
                            <CardTitle className="text-xl pt-1">{draw.Category}</CardTitle>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1.5 whitespace-nowrap">
                            <Building className="h-3.5 w-3.5" />
                            {draw.Province}
                          </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                      <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                              <Award className="h-5 w-5 text-accent" />
                              <div>
                                  <p className="font-bold text-lg">{draw.Score || 'N/A'}</p>
                                  <p className="text-xs text-muted-foreground">Min. Score</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-accent" />
                              <div>
                                  <p className="font-bold text-lg">{draw["Total Draw Invitations"] || 'N/A'}</p>
                                  <p className="text-xs text-muted-foreground">Invitations</p>
                              </div>
                          </div>
                      </div>
                       <div>
                          <p className="text-sm font-semibold">Program/Occupations:</p>
                          <p className="text-sm text-muted-foreground">{draw["NOC/Other"]}</p>
                      </div>
                    </CardContent>
                    <CardFooter>
                       <Button variant="outline" className="w-full" asChild>
                          <Link href={draw.URL} target="_blank" rel="noopener noreferrer">
                              Official Source
                              <ExternalLink className="ml-2 h-4 w-4" />
                          </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center py-16 text-muted-foreground col-span-full">
                  <Filter className="mx-auto h-12 w-12 mb-4" />
                  <p className="text-lg font-semibold">No draws found</p>
                  <p>Try adjusting your search or filters.</p>
                </div>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(DrawTrackerPage);
