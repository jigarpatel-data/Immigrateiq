
"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import { Award, Building, Calendar, ChevronsUpDown, ExternalLink, Filter, Info, Loader2, Search, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAirtableDraws, type Draw } from '@/lib/airtable';
import { Separator } from '@/components/ui/separator';

const DRAWS_PER_PAGE = 10;

function DrawTrackerPage() {
  const [allDraws, setAllDraws] = useState<Draw[]>([]);
  const [displayedDraws, setDisplayedDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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
        setAllDraws(formattedDraws);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const provinceOptions = useMemo(() => ["All", ...new Set(allDraws.map(d => d.Province).filter(Boolean).sort())], [allDraws]);
  const categoryOptions = useMemo(() => ["All", ...new Set(allDraws.map(d => d.Category).filter(Boolean).sort())], [allDraws]);


  const filteredAndSortedDraws = useMemo(() => {
    let result = [...allDraws];

    const hasFilters = searchTerm !== '' || provinceFilter !== 'All' || categoryFilter !== 'All';
    if(hasFilters) {
        result = result.filter(draw => {
          const matchesProvince = provinceFilter === 'All' || draw.Province === provinceFilter;
          const matchesCategory = categoryFilter === 'All' || draw.Category === categoryFilter;
          const matchesSearch = searchTerm === '' || 
            (draw["NOC/Other"] && draw["NOC/Other"].toLowerCase().includes(searchTerm.toLowerCase())) ||
            draw.Category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            draw.Province.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesProvince && matchesCategory && matchesSearch;
        });
    }

    result.sort((a, b) => {
      const dateA = new Date(a["Draw Date"]).getTime();
      const dateB = new Date(b["Draw Date"]).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - b.id.localeCompare(a.id);
    });

    return result;
  }, [allDraws, searchTerm, provinceFilter, categoryFilter, sortOrder]);

  const hasMoreDraws = displayedDraws.length < filteredAndSortedDraws.length;

  const loadMoreDraws = useCallback(() => {
    if (hasMoreDraws) {
      setPage(prevPage => prevPage + 1);
    }
  }, [hasMoreDraws]);
  
  useEffect(() => {
    setDisplayedDraws(filteredAndSortedDraws.slice(0, page * DRAWS_PER_PAGE));
  }, [filteredAndSortedDraws, page]);

  useEffect(() => {
    setPage(1); // Reset page when filters change
  }, [searchTerm, provinceFilter, categoryFilter, sortOrder]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '200px', // Start loading a bit before the user hits the bottom
      threshold: 0,
    };

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMoreDraws && !loading) {
        loadMoreDraws();
      }
    };
    
    observer.current = new IntersectionObserver(handleObserver, options);
    
    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.current.observe(currentLoadMoreRef);
    }

    return () => {
      if(observer.current && currentLoadMoreRef) {
        observer.current.unobserve(currentLoadMoreRef);
      }
    };
  }, [hasMoreDraws, loading, loadMoreDraws]);


  const resetFilters = () => {
    setSearchTerm('');
    setProvinceFilter('All');
    setCategoryFilter('All');
    setSortOrder('newest');
  };
  
  const activeFilterCount = [searchTerm, provinceFilter, categoryFilter].filter(f => f && f !== 'All').length;

  if (loading && allDraws.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Loading Draws...</h1>
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Draw Tracker</h1>
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
                  <SelectTrigger className="w-full sm:w-auto flex-grow sm:flex-grow-0 sm:min-w-40">
                      <SelectValue placeholder="Filter by province" />
                  </SelectTrigger>
                  <SelectContent>
                      {provinceOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
               <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-auto flex-grow sm:flex-grow-0 sm:min-w-40">
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
            <div className="grid gap-4 grid-cols-1">
              {displayedDraws.length > 0 ? (
                displayedDraws.map((draw) => (
                  <Card key={draw.id}>
                    {/* Desktop View */}
                    <div className='hidden sm:block p-6 space-y-4'>
                      <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />{draw["Draw Date"]}</p>
                            <CardTitle className="text-base font-semibold pt-1">{draw.Category}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="flex items-center gap-1.5 whitespace-nowrap text-xs">
                              <Building className="h-3.5 w-3.5" />
                              {draw.Province}
                            </Badge>
                             <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <Link href={draw.URL} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                    <span className="sr-only">Source</span>
                                </Link>
                            </Button>
                          </div>
                      </div>
                      <div className="flex items-center text-center sm:text-left gap-4 sm:gap-6 pt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Award className="h-4 w-4 text-accent" />
                            <span className="font-semibold text-foreground">{draw.Score || 'N/A'}</span>
                            <span className='hidden sm:inline'>Min. Score</span>
                        </div>
                        <Separator orientation="vertical" className="h-5" />
                        <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-accent" />
                            <span className="font-semibold text-foreground">{draw["Total Draw Invitations"] || 'N/A'}</span>
                             <span className='hidden sm:inline'>Invitations</span>
                             <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                    <span className="sr-only">More info</span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    These many invitations were issued in this draw, not for any specific occupation. This draw may have invited other occupations as well.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Separator orientation="vertical" className="h-5" />
                        <p className='truncate' title={draw["NOC/Other"] || 'Not specified'}>{draw["NOC/Other"] || 'Not specified'}</p>
                      </div>
                    </div>
                    {/* Mobile View */}
                    <div className="sm:hidden p-3 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />{draw["Draw Date"]}</span>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="flex items-center gap-1.5 text-xs">
                                <Building className="h-3.5 w-3.5" />
                                {draw.Province}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <Link href={draw.URL} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                        <span className="sr-only">Source</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        <p className="text-base font-semibold">{draw.Category}</p>
                        <Separator/>
                        <div className="space-y-2 text-sm">
                            <div className="flex text-sm">
                                <span className="text-muted-foreground mr-2">Min. Score:</span>
                                <span className="font-semibold text-foreground">{draw.Score || 'N/A'}</span>
                            </div>
                            <div className="flex text-sm">
                                <span className="text-muted-foreground mr-2">Invitations:</span>
                                <div className='flex items-center gap-1.5'>
                                  <span className="font-semibold text-foreground">{draw["Total Draw Invitations"] || 'N/A'}</span>
                                  <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                        <button>
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                            <span className="sr-only">More info</span>
                                        </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                        <p className="max-w-xs">
                                            These many invitations were issued in this draw, not for any specific occupation. This draw may have invited other occupations as well.
                                        </p>
                                        </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                            </div>
                             <div className="flex items-center">
                                <span className='text-xs text-muted-foreground truncate' title={draw["NOC/Other"] || 'Not specified'}>{draw["NOC/Other"] || 'Not specified'}</span>
                            </div>
                        </div>
                    </div>
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
            <div ref={loadMoreRef} className="h-1 col-span-full" />
             {hasMoreDraws && (
                <div className="flex justify-center mt-6">
                    <Button onClick={loadMoreDraws} variant="secondary" disabled={loading}>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading More...
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(DrawTrackerPage);
