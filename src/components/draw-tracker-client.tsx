

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Award, Building, Calendar, ExternalLink, Filter, Info, Loader2, Search, Users, X, ArrowUp, List, Table as TableIcon, ChevronsRight, ChevronsLeft } from 'lucide-react';
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
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


type DrawTrackerClientProps = {
    title: string;
    description: string;
    initialDraws: Draw[];
    initialOffset?: string;
    initialError?: string;
    provinceOptions: string[];
    categoryOptions: string[];
};

export function DrawTrackerClient({ 
    title,
    description,
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

  const [rawSearchTerm, setRawSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  const isMobile = useIsMobile();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setIsPanelOpen(true);
    }
  }, [isMobile]);

  const fetchDraws = useCallback(async (currentOffset?: string, isNewFilter = false, search?: string, newFilters?: { province: string, category: string }) => {
      if (isNewFilter) {
        setLoading(true);
        setAllDraws([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const filters = {
        province: newFilters ? newFilters.province : provinceFilter,
        category: newFilters ? newFilters.category : categoryFilter,
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
        if (isNewFilter && newDrawsWithId.length > 0 && !isMobile) {
          handleDrawClick(newDrawsWithId[0]);
        }
      } else {
        setHasMore(false);
      }
      setLoading(false);
      setLoadingMore(false);
  }, [provinceFilter, categoryFilter, activeSearchTerm, isMobile]);

  const handleDrawClick = useCallback(async (draw: Draw) => {
    setSelectedDraw(draw);
    if (!isPanelOpen && !isMobile) {
      setIsPanelOpen(true);
    }
    if (isMobile) {
      // It will be handled by the sheet opening
    } else if (!isPanelOpen) {
      setIsPanelOpen(true);
    }

    if (!details[draw.id]) {
      setLoadingDetails(true);
      const result = await getDrawDetails(draw.id);
      if (result.details) {
        const dirtyHtml = marked.parse(result.details, { breaks: true }) as string;
        setDetails(prev => ({ ...prev, [draw.id]: dirtyHtml }));
      } else if (result.error) {
        setDetails(prev => ({ ...prev, [draw.id]: result.error! }));
      }
      setLoadingDetails(false);
    }
  }, [details, isPanelOpen, isMobile]);

  useEffect(() => {
    if (initialDraws.length > 0 && !selectedDraw && !isMobile) {
      handleDrawClick(initialDraws[0]);
    }
  }, [initialDraws, selectedDraw, isMobile, handleDrawClick]);
  
  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) {
        const currentFilters = {
            province: provinceFilter,
            category: categoryFilter,
        };
        fetchDraws(offset, false, activeSearchTerm, currentFilters);
    }
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { searchTerm } = await getEnhancedSearchTerm(rawSearchTerm);
    const finalSearchTerm = searchTerm || rawSearchTerm;
    setActiveSearchTerm(finalSearchTerm);
    await fetchDraws(undefined, true, finalSearchTerm, { province: provinceFilter, category: categoryFilter });
    if (!isMobile) {
      setSelectedDraw(null);
    }
  }

  const handleFilterChange = (type: 'province' | 'category', value: string) => {
      const newFilters = {
        province: provinceFilter,
        category: categoryFilter,
      };

      if (type === 'province') {
          setProvinceFilter(value);
          newFilters.province = value;
      } else {
          setCategoryFilter(value);
          newFilters.category = value;
      }
      
      setIsFilterSheetOpen(false);
      fetchDraws(undefined, true, activeSearchTerm, newFilters);
      if (!isMobile) {
       setSelectedDraw(null);
      }
  };

  const resetFilters = () => {
    setRawSearchTerm('');
    setActiveSearchTerm('');
    setProvinceFilter('All');
    setCategoryFilter('All');
    fetchDraws(undefined, true, '', {province: 'All', category: 'All'});
    if (!isMobile) {
      setSelectedDraw(null);
    }
  };
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setShowScrollTop(target.scrollTop > 300);

    // Auto-load more content
    const threshold = 100; // pixels from bottom
    if (target.scrollHeight - target.scrollTop - target.clientHeight < threshold) {
      handleLoadMore();
    }
  };
  
  const scrollToTop = () => {
    viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const activeFilterCount = [activeSearchTerm, provinceFilter, categoryFilter].filter(f => f && f !== 'All').length;

  const DrawDetailsContent = () => (
    <>
      {loadingDetails ? (
        <div className="flex items-center justify-center h-full">
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
    <div className="space-y-6">
      <div className={cn("grid grid-cols-1 items-start gap-6 lg:grid-cols-3", !isPanelOpen && "lg:grid-cols-1")}>
          <div className={cn("lg:col-span-2 space-y-6", !isPanelOpen && "lg:col-span-3")}>
              <div className="sticky top-6 z-10">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight">{title}</CardTitle>
                          <CardDescription className="pt-1">{description}</CardDescription>
                        </div>
                         <div className="hidden lg:flex items-center space-x-2">
                          <Switch
                            id="table-view-switch"
                            checked={viewMode === 'table'}
                            onCheckedChange={(checked) => setViewMode(checked ? 'table' : 'card')}
                          />
                          <Label htmlFor="table-view-switch">Table View</Label>
                        </div>
                    </div>
                      
                      <div className="pt-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                           <div className="relative flex-grow">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                  placeholder="Search draws by NOC, category, or province..."
                                  value={rawSearchTerm}
                                  onChange={(e) => setRawSearchTerm(e.target.value)}
                                  className="pl-10"
                              />
                          </div>
                          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                            <SheetTrigger asChild>
                              <Button variant="outline" size="icon" className="relative">
                                <Filter className="h-4 w-4" />
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">{activeFilterCount}</span>
                                )}
                              </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="flex flex-col">
                                <SheetHeader>
                                    <SheetTitle>Filter Draws</SheetTitle>
                                    <SheetDescription>
                                    Refine your search by province or category.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-4 py-4">
                                     <div className="space-y-2">
                                        <label className="text-sm font-medium">Province</label>
                                        <Select value={provinceFilter} onValueChange={(value) => handleFilterChange('province', value)}>
                                            <SelectTrigger><SelectValue placeholder="Filter by province" /></SelectTrigger>
                                            <SelectContent>
                                                {provinceOptions.map(option => (
                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                     </div>
                                     <div className="space-y-2">
                                         <label className="text-sm font-medium">Category</label>
                                        <Select value={categoryFilter} onValueChange={(value) => handleFilterChange('category', value)}>
                                            <SelectTrigger><SelectValue placeholder="Filter by category" /></SelectTrigger>
                                            <SelectContent>
                                                {categoryOptions.map(option => (
                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <SheetFooter>
                                    {activeFilterCount > 0 && (
                                     <Button variant="ghost" onClick={resetFilters}>Reset</Button>
                                    )}
                                    <SheetClose asChild>
                                        <Button>Apply</Button>
                                    </SheetClose>
                                </SheetFooter>
                            </SheetContent>
                          </Sheet>
                           {activeFilterCount > 0 && (
                            <Button variant="ghost" size="icon" onClick={resetFilters}>
                              <X className="h-4 w-4" />
                              <span className="sr-only">Reset filters</span>
                            </Button>
                          )}
                        </form>
                      </div>
                  </CardHeader>
                </Card>
              </div>
              <div className="relative">
                <ScrollArea className="h-[calc(100vh-22rem)]" viewportRef={viewportRef} onScroll={handleScroll}>
                  <div className="space-y-4 pt-4">
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
                      ) : allDraws.length === 0 ? (
                              <div className="text-center py-16 text-muted-foreground col-span-full">
                                  <Filter className="mx-auto h-12 w-12 mb-4" />
                                  <p className="text-lg font-semibold">No draws found</p>
                                  <p>Try adjusting your search or filters.</p>
                              </div>
                      ) : (
                          <>
                          {(viewMode === 'card' || isMobile) ? (
                              <div className="grid gap-4 grid-cols-1">
                                  {allDraws.map((draw) => (
                                      <Card 
                                          key={draw.id} 
                                          onClick={() => handleDrawClick(draw)}
                                          className={cn(
                                              "cursor-pointer transition-all",
                                              selectedDraw?.id === draw.id && 'border-accent ring-2 ring-accent'
                                          )}
                                      >
                                      <div className="p-4 space-y-3">
                                          <div className="flex justify-between items-start gap-4">
                                              <div className="flex-1">
                                                  <p className="font-semibold text-base">{draw.Category}</p>
                                                  <span className="text-xs text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />{draw["Draw Date"]}</span>
                                              </div>
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
                                          <Separator />
                                          <div className="space-y-2 text-sm">
                                              <div className="flex justify-start items-center gap-2">
                                                  <span className="text-muted-foreground">Min. Score:</span>
                                                  <span className="font-semibold">{draw.Score || 'N/A'}</span>
                                              </div>
                                              <div className="flex justify-start items-center gap-2">
                                                  <span className="text-muted-foreground">Invitations:</span>
                                                  <div className="flex items-center gap-1.5">
                                                      <span className="font-semibold">{draw["Total Draw Invitations"] || 'N/A'}</span>
                                                      <TooltipProvider>
                                                          <Tooltip>
                                                              <TooltipTrigger asChild><button onClick={(e) => e.stopPropagation()}><Info className="h-4 w-4 text-muted-foreground" /></button></TooltipTrigger>
                                                              <TooltipContent><p className="max-w-xs">Invitations for this specific draw, not just this occupation.</p></TooltipContent>
                                                          </Tooltip>
                                                      </TooltipProvider>
                                                  </div>
                                              </div>
                                              <div className="flex justify-start items-start gap-2">
                                                  <span className="text-muted-foreground shrink-0">NOC/Occupations:</span>
                                                  <span className="font-semibold text-left" title={draw["NOC/Other"] || 'Not specified'}>{draw["NOC/Other"] || 'Not specified'}</span>
                                              </div>
                                          </div>
                                      </div>
                                      </Card>
                                  ))}
                              </div>
                          ) : (
                            <Card>
                              <div className="relative">
                                <Table>
                                  <TableHeader className="sticky top-0 bg-card z-10">
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Category</TableHead>
                                      <TableHead>Province</TableHead>
                                      <TableHead className="text-right">Score</TableHead>
                                      <TableHead className="text-right">Invitations</TableHead>
                                      <TableHead>NOC/Occupations</TableHead>
                                      <TableHead>Source</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {allDraws.map((draw) => (
                                      <TableRow 
                                        key={draw.id} 
                                        onClick={() => handleDrawClick(draw)}
                                        className={cn("cursor-pointer", selectedDraw?.id === draw.id && 'bg-muted/50')}
                                      >
                                        <TableCell>{draw["Draw Date"]}</TableCell>
                                        <TableCell>{draw.Category}</TableCell>
                                        <TableCell>{draw.Province}</TableCell>
                                        <TableCell className="text-right font-semibold">{draw.Score || 'N/A'}</TableCell>
                                        <TableCell className="text-right">{draw["Total Draw Invitations"] || 'N/A'}</TableCell>
                                        <TableCell>{draw["NOC/Other"] || 'N/A'}</TableCell>
                                        <TableCell>
                                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild onClick={(e) => e.stopPropagation()}>
                                            <Link href={draw.URL} target="_blank" rel="noopener noreferrer">
                                              <ExternalLink className="h-4 w-4" />
                                              <span className="sr-only">Source</span>
                                            </Link>
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </Card>
                          )}


                          {loadingMore && (
                              <div className="flex justify-center mt-6">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                </ScrollArea>
                {showScrollTop && (
                    <Button 
                        onClick={scrollToTop}
                        variant="outline"
                        size="icon"
                        className="absolute bottom-2 right-4 h-10 w-10 rounded-full ring-1 ring-white"
                    >
                        <ArrowUp className="h-5 w-5" />
                        <span className="sr-only">Scroll to top</span>
                    </Button>
                )}
              </div>
          </div>
          <div className={cn("lg:col-span-1", !isPanelOpen ? 'hidden' : 'block')}>
              {selectedDraw && (
                  <div className="sticky top-6">
                      {isMobile ? (
                          <Sheet open={!!selectedDraw && isMobile} onOpenChange={(isOpen) => !isOpen && setSelectedDraw(null)}>
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
                          <Card className={cn("flex flex-col h-[calc(100vh-8rem)] transition-all", isPanelOpen ? "w-full" : "w-0")}>
                              <CardHeader>
                                  <div className="flex justify-between items-start">
                                      <div className={cn(isPanelOpen ? "opacity-100" : "opacity-0")}>
                                          <CardTitle className="text-lg font-bold">{selectedDraw?.Category}</CardTitle>
                                          <CardDescription>{selectedDraw?.['Draw Date']}</CardDescription>
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPanelOpen(!isPanelOpen)}>
                                          {isPanelOpen ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                                          <span className="sr-only">Toggle Panel</span>
                                      </Button>
                                  </div>
                              </CardHeader>
                              <CardContent className={cn("flex-1 overflow-hidden p-0", isPanelOpen ? "opacity-100" : "opacity-0")}>
                                  <ScrollArea className="h-full px-6">
                                    <DrawDetailsContent />
                                  </ScrollArea>
                              </CardContent>
                          </Card>
                      )}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
    
    









