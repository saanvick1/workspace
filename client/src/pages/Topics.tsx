import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DebateTopic } from "@shared/schema";
import { Sparkles, Search, Swords, BookOpen, ChevronRight, Loader2, Plus, Wand2, PenLine } from "lucide-react";

const CATEGORIES = [
  "All",
  "Technology & Society",
  "Economics & Policy",
  "Environment",
  "Health & Society",
  "Politics & Governance",
  "Ethics & Philosophy",
];

const GENRE_CATEGORIES = CATEGORIES.filter(c => c !== "All");

const FORMATS = [
  { id: "Oxford", label: "Oxford Debate", desc: "Classic format: proposition vs opposition with audience vote" },
  { id: "Lincoln-Douglas", label: "Lincoln-Douglas", desc: "One-on-one value debate with philosophical focus" },
  { id: "Parliamentary", label: "Parliamentary", desc: "British parliamentary style with points of information" },
  { id: "Public Forum", label: "Public Forum", desc: "Current events focused, evidence-driven debate" },
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const SUGGESTED_TOPICS = [
  { title: "This House Would Ban Social Media for Children Under 16", category: "Technology & Society", difficulty: "beginner" },
  { title: "Universal Basic Income Should Replace Current Welfare Systems", category: "Economics & Policy", difficulty: "intermediate" },
  { title: "Genetic Engineering of Human Embryos Should Be Permitted", category: "Health & Society", difficulty: "advanced" },
  { title: "Nuclear Energy Is Essential for Combating Climate Change", category: "Environment", difficulty: "intermediate" },
  { title: "AI Systems Should Have Legal Personhood", category: "Ethics & Philosophy", difficulty: "advanced" },
  { title: "Direct Democracy Should Replace Representative Democracy", category: "Politics & Governance", difficulty: "intermediate" },
];

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = {
    beginner: "text-green-700 dark:text-green-400 border-green-500/30",
    intermediate: "text-blue-700 dark:text-blue-400 border-blue-500/30",
    advanced: "text-purple-700 dark:text-purple-400 border-purple-500/30",
  };
  return (
    <Badge variant="outline" className={`text-xs ${colors[difficulty as keyof typeof colors] || ""}`}>
      {difficulty}
    </Badge>
  );
}

export default function Topics() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic | null>(null);
  const [debateFormat, setDebateFormat] = useState("Oxford");
  const [userPosition, setUserPosition] = useState("proposition");

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateMode, setGenerateMode] = useState<"choose" | "genre" | "custom">("choose");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("Ethics & Philosophy");
  const [customDifficulty, setCustomDifficulty] = useState("intermediate");

  const { data: topics = [], isLoading } = useQuery<DebateTopic[]>({
    queryKey: ["/api/topics"],
  });

  const startSession = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/sessions", data),
    onSuccess: (session: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      navigate(`/debate/${session.id}`);
    },
    onError: () => toast({ title: "Error", description: "Failed to start debate", variant: "destructive" }),
  });

  const generateTopic = useMutation({
    mutationFn: (cat: string) => apiRequest("POST", "/api/topics/generate", { category: cat }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      toast({ title: "New topic generated!", description: "A unique topic has been added to your collection" });
      closeGenerateDialog();
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("409") ? "Topic already exists. Try again for a new one." : "Failed to generate topic";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const createCustomTopic = useMutation({
    mutationFn: (data: { title: string; category: string; difficulty: string }) =>
      apiRequest("POST", "/api/topics/custom", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      toast({ title: "Topic created!", description: "Your custom topic has been added" });
      closeGenerateDialog();
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("409") ? "A topic with this title already exists" : "Failed to create topic";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const closeGenerateDialog = () => {
    setGenerateDialogOpen(false);
    setGenerateMode("choose");
    setSelectedGenre("");
    setCustomTitle("");
    setCustomCategory("Ethics & Philosophy");
    setCustomDifficulty("intermediate");
  };

  const availableSuggestions = SUGGESTED_TOPICS.filter(
    s => !topics.some(t => t.title.toLowerCase() === s.title.toLowerCase())
  );

  const filteredTopics = topics.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || t.category === category;
    const matchDifficulty = difficulty === "All" || t.difficulty === difficulty;
    return matchSearch && matchCategory && matchDifficulty;
  });

  const handleStartDebate = () => {
    if (!selectedTopic) return;
    startSession.mutate({
      topicId: selectedTopic.id,
      topicTitle: selectedTopic.title,
      format: debateFormat,
      userPosition,
      aiPosition: userPosition === "proposition" ? "opposition" : "proposition",
      status: "active",
      round: 1,
      totalRounds: 3,
    });
  };

  const handleAddSuggestion = (suggestion: typeof SUGGESTED_TOPICS[0]) => {
    createCustomTopic.mutate({
      title: suggestion.title,
      category: suggestion.category,
      difficulty: suggestion.difficulty,
    });
  };

  const isGenerating = generateTopic.isPending || createCustomTopic.isPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-6 py-3">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Debate Topics</h1>
            <p className="text-xs text-muted-foreground">{topics.length} topics available</p>
          </div>
          <Button
            onClick={() => setGenerateDialogOpen(true)}
            data-testid="button-new-topic"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Topic
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-5 max-w-6xl mx-auto">
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search topics..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-topics"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-36" data-testid="select-difficulty">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All levels</SelectItem>
                  {DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {availableSuggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Suggested Topics</span>
              <span className="text-xs text-muted-foreground">Quick-add popular debate topics</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {availableSuggestions.map((s, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant="outline"
                  className="text-xs h-auto py-1.5 px-3 gap-1.5"
                  onClick={() => handleAddSuggestion(s)}
                  disabled={isGenerating}
                  data-testid={`button-suggestion-${i}`}
                >
                  <Plus className="w-3 h-3" />
                  {s.title.length > 50 ? s.title.slice(0, 50) + "..." : s.title}
                </Button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No topics found matching your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTopics.map((topic) => (
              <Card
                key={topic.id}
                className="border-card-border cursor-pointer hover-elevate"
                onClick={() => setSelectedTopic(topic)}
                data-testid={`card-topic-${topic.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug mb-2">{topic.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{topic.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{topic.category}</Badge>
                    <DifficultyBadge difficulty={topic.difficulty} />
                    {topic.tags?.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedTopic} onOpenChange={open => !open && setSelectedTopic(null)}>
        <DialogContent className="max-w-md" data-testid="dialog-start-debate">
          <DialogHeader>
            <DialogTitle className="text-base">Configure Debate</DialogTitle>
          </DialogHeader>
          {selectedTopic && (
            <div className="space-y-4 py-1">
              <div className="bg-muted/40 rounded-md p-3">
                <p className="text-sm font-medium text-foreground leading-snug">{selectedTopic.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="secondary" className="text-xs">{selectedTopic.category}</Badge>
                  <DifficultyBadge difficulty={selectedTopic.difficulty} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Debate Format</label>
                <Select value={debateFormat} onValueChange={setDebateFormat}>
                  <SelectTrigger data-testid="select-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        <div>
                          <div className="font-medium text-sm">{f.label}</div>
                          <div className="text-xs text-muted-foreground">{f.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Your Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setUserPosition("proposition")}
                    className={`p-3 rounded-md border text-left transition-colors ${
                      userPosition === "proposition"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                    data-testid="button-position-proposition"
                  >
                    <div className="text-sm font-medium">Proposition</div>
                    <div className="text-xs opacity-70">Support the motion</div>
                  </button>
                  <button
                    onClick={() => setUserPosition("opposition")}
                    className={`p-3 rounded-md border text-left transition-colors ${
                      userPosition === "opposition"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                    data-testid="button-position-opposition"
                  >
                    <div className="text-sm font-medium">Opposition</div>
                    <div className="text-xs opacity-70">Challenge the motion</div>
                  </button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTopic(null)}>Cancel</Button>
            <Button
              onClick={handleStartDebate}
              disabled={startSession.isPending}
              data-testid="button-confirm-debate"
            >
              {startSession.isPending ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Starting...</>
              ) : (
                <><Swords className="w-3.5 h-3.5 mr-1.5" /> Start Debate</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={generateDialogOpen} onOpenChange={open => { if (!open) closeGenerateDialog(); }}>
        <DialogContent className="max-w-md" data-testid="dialog-new-topic">
          <DialogHeader>
            <DialogTitle className="text-base">
              {generateMode === "choose" ? "Add New Topic" : generateMode === "genre" ? "Generate by Genre" : "Enter Custom Topic"}
            </DialogTitle>
          </DialogHeader>

          {generateMode === "choose" && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">How would you like to create a new debate topic?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setGenerateMode("genre")}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                  data-testid="button-choose-genre"
                >
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wand2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Generate by Genre</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Pick a category and let AI create a unique topic for you</p>
                  </div>
                </button>
                <button
                  onClick={() => setGenerateMode("custom")}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                  data-testid="button-choose-custom"
                >
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <PenLine className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Enter Custom Topic</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Type your own debate topic or motion</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {generateMode === "genre" && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">Select a genre and AI will generate a unique debate topic you haven't seen before.</p>
              <div className="grid grid-cols-2 gap-2">
                {GENRE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedGenre(cat)}
                    className={`p-3 rounded-md border text-left transition-colors text-sm ${
                      selectedGenre === cat
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-foreground hover:border-primary/50"
                    }`}
                    data-testid={`button-genre-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setGenerateMode("choose")} data-testid="button-back-genre">Back</Button>
                <Button
                  onClick={() => selectedGenre && generateTopic.mutate(selectedGenre)}
                  disabled={!selectedGenre || isGenerating}
                  data-testid="button-generate-topic"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate Topic</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}

          {generateMode === "custom" && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Topic / Motion</label>
                <Textarea
                  placeholder='e.g. "This House Would Abolish Standardized Testing"'
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="min-h-[80px] resize-none"
                  data-testid="input-custom-title"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Category</label>
                  <Select value={customCategory} onValueChange={setCustomCategory}>
                    <SelectTrigger data-testid="select-custom-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Difficulty</label>
                  <Select value={customDifficulty} onValueChange={setCustomDifficulty}>
                    <SelectTrigger data-testid="select-custom-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setGenerateMode("choose")} data-testid="button-back-custom">Back</Button>
                <Button
                  onClick={() => customTitle.trim() && createCustomTopic.mutate({ title: customTitle, category: customCategory, difficulty: customDifficulty })}
                  disabled={!customTitle.trim() || isGenerating}
                  data-testid="button-create-custom"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Creating...</>
                  ) : (
                    <><Plus className="w-3.5 h-3.5 mr-1.5" /> Add Topic</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
