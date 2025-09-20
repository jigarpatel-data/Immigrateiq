

"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
import { Award, Building, Calendar, ExternalLink, Filter, Info, Loader2, Search, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAirtableDraws, type Draw } from '@/lib/airtable';
import { Separator } from '@/components/ui/separator';
import { getDrawDetails, getEnhancedSearchTerm } from '@/lib/actions';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { withAuth } from '@/hooks/use-auth';


type DrawTrackerClientProps = {
    initialDraws: Draw[];
    initialOffset?: string;
    initialError?: string;
    provinceOptions: string[];
    categoryOptions: string[];
};

function DrawTrackerClientComponent({ 
    initialDraws, 
    initialOffset, 
    initialError, 
    provinceOptions, 
    categoryOptions 
}: DrawTrackerClientProps) {
  const [allDraws, setAllDraws] = useState<Draw[]>(initialDraws);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [offset, setOffset] = useState<string | undefined>(initialOffset);
  const [hasMore, setHasMore] = useState(!!initialOffset);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [rawSearchTerm, setRawSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const isMobile = useIsMobile();


  const fetchDraws = useCallback(async (currentOffset?: string, isNewFilter = false, search?: string) => {
      if (isNewFilter) {
        setLoading(true);
        setAllDraws([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const filters = {
        province: provinceFilter,
        category: categoryFilter,
        search: search === undefined ? activeSearchTerm : search,
      };

      const { draws, error: fetchError, offset: newOffset } = await getAirtableDraws(currentOffset, filters);
      
      if (fetchError) {
        setError(fetchError);
      } else if (draws) {
        const newDrawsWithId = draws.map(d => ({ ...d.fields, id: d.id }));
        setAllDraws(prev => isNewFilter ? newDrawsWithId : [...prev, ...newDrawsWithId]);
        setOffset(newOffset);
        setHasMore(!!newOffset);
      } else {
        setHasMore(false);
      }
      setLoading(false);
      setLoadingMore(false);
  }, [provinceFilter, categoryFilter, activeSearchTerm]);

  // Effect for infinite scroll
  useEffect(() => {
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loadingMore && !loading) {
        fetchDraws(offset);
      }
    };
    
    observer.current = new IntersectionObserver(handleObserver, {
      rootMargin: '200px',
    });
    
    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.current.observe(currentLoadMoreRef);
    }

    return () => {
      if(observer.current && currentLoadMoreRef) {
        observer.current.unobserve(currentLoadMoreRef);
      }
    };
  }, [hasMore, loadingMore, loading, offset, fetchDraws]);
  
  const handleDrawClick = async (draw: Draw) => {
    setSelectedDraw(draw);
    if (!details[draw.id]) {
      setLoadingDetails(true);
      const result = await getDrawDetails(draw.id);
      if (result.details) {
        const dirtyHtml = marked.parse(result.details, { breaks: true }) as string;
        // For now, we trust the source. In a real app, you'd want to sanitize this.
        setDetails(prev => ({ ...prev, [draw.id]: dirtyHtml }));
      } else if (result.error) {
        setDetails(prev => ({ ...prev, [draw.id]: result.error! }));
      }
      setLoadingDetails(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { searchTerm } = await getEnhancedSearchTerm(rawSearchTerm);
    setActiveSearchTerm(searchTerm || rawSearchTerm);
    await fetchDraws(undefined, true, searchTerm || rawSearchTerm);
    setSelectedDraw(null);
  }

  const resetFilters = () => {
    setRawSearchTerm('');
    setActiveSearchTerm('');
    setProvinceFilter('All');
    setCategoryFilter('All');
    fetchDraws(undefined, true, '');
    setSelectedDraw(null);
  };
  
  const activeFilterCount = [activeSearchTerm, provinceFilter, categoryFilter].filter(f => f && f !== 'All').length;
  
  useEffect(() => {
    if (provinceFilter !== 'All' || categoryFilter !== 'All') {
        fetchDraws(undefined, true);
        setSelectedDraw(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceFilter, categoryFilter]);

  const DrawDetailsContent = () => (
    <>
      {loadingDetails ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: details[selectedDraw?.id!] || '' }}
        />
      )}
    </>
  );

  return (
    <div className={cn("grid grid-cols-1 items-start gap-6 lg:grid-cols-3", !selectedDraw && "lg:grid-cols-1")}>
        <div className={cn("lg:col-span-2 space-y-6", !selectedDraw && "lg:col-span-3")}>
            <div className="sticky top-6 z-10">
              <Card>
              <CardHeader>
                  <CardTitle>Filter and Sort Draws</CardTitle>
                  <form onSubmit={handleSearch} className="flex flex-wrap gap-4 pt-4">
                      <div className="relative flex-grow min-w-[200px]">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                              placeholder="Ask about draws or search keywords..."
                              value={rawSearchTerm}
                              onChange={(e) => setRawSearchTerm(e.target.value)}
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
                      <Button type="submit" id="manual-search-button" className="w-full sm:w-auto" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Search
                      </Button>
                  
                  {activeFilterCount > 0 && (
                      <Button variant="ghost" type="button" onClick={resetFilters} className="w-full sm:w-auto">
                          <X className="mr-2 h-4 w-4" />
                          Reset
                      </Button>
                  )}
                  </form>
              </CardHeader>
              </Card>
            </div>
            <div className="space-y-4">
                {loading && allDraws.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-16">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Loading Draws...</h1>
                        <p className="text-muted-foreground">This may take a moment.</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-16 bg-destructive/10 text-destructive border border-destructive rounded-lg p-4">
                        <X className="mx-auto h-12 w-12 mb-4" />
                        <p className="text-lg font-semibold">Failed to load draws</p>
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                    <div className="grid gap-4 grid-cols-1">
                        {allDraws.length > 0 ? (
                        allDraws.map((draw) => (
                            <Card 
                                key={draw.id} 
                                onClick={() => handleDrawClick(draw)}
                                className={cn(
                                    "cursor-pointer transition-all",
                                    selectedDraw?.id === draw.id && 'border-accent ring-2 ring-accent'
                                )}
                            >
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
                                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild onClick={(e) => e.stopPropagation()}>
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
                                            <button onClick={(e) => e.stopPropagation()}>
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
                                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild onClick={(e) => e.stopPropagation()}>
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
                                            <span className="font-semibold text-foreground">{draw["Total Draw Invitations"] || 'N.A'}</span>
                                            <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                <button onClick={(e) => e.stopPropagation()}>
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
                    {hasMore && <div ref={loadMoreRef} className="h-1 col-span-full" />}
                    {loadingMore && (
                        <div className="flex justify-center mt-6">
                            <Button variant="secondary" disabled>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading More...
                            </Button>
                        </div>
                    )}
                    {!loading && !loadingMore && !hasMore && allDraws.length > 0 && (
                        <div className="text-center text-muted-foreground mt-6">
                            <p>You've reached the end of the list.</p>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>
        <div className={cn("lg:col-span-1", !selectedDraw ? 'hidden' : 'block')}>
             {selectedDraw && (
                <div className="sticky top-6">
                    {isMobile ? (
                        <Sheet open={!!selectedDraw} onOpenChange={(isOpen) => !isOpen && setSelectedDraw(null)}>
                            <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
                               <SheetHeader className="p-6">
                                    <SheetTitle>{selectedDraw?.Category}</SheetTitle>
                                    <SheetDescription>{selectedDraw?.['Draw Date']}</SheetDescription>
                                </SheetHeader>
                                <ScrollArea className="flex-1 px-6">
                                    <div className="pb-6">
                                        <DrawDetailsContent />
                                    </div>
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                    ) : (
                         <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-bold">{selectedDraw?.Category}</CardTitle>
                                        <CardDescription>{selectedDraw?.['Draw Date']}</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDraw(null)}>
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Close</span>
                                    </Button>
                                </div>
                            </CardHeader>
                             <CardContent>
                                <ScrollArea className="h-[calc(100vh-16rem)] pr-4">
                                  <DrawDetailsContent />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    </div>
  );
}

export const DrawTrackerClient = withAuth(DrawTrackerClientComponent);


    