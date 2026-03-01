import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ArgumentAnalysisCard } from "@/components/argument-analysis-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ArgumentAnalysis } from "@shared/schema";
import { Target, Sparkles, Lightbulb, RefreshCw, Loader2, Shield, Swords, ChevronRight } from "lucide-react";

const SAMPLE_TOPICS = [
  "Social media has done more harm than good to society",
  "Universal basic income should be implemented globally",
  "Climate change requires immediate radical action",
  "Artificial intelligence poses an existential threat to humanity",
  "Nuclear energy is essential for a sustainable future",
];

export default function Practice() {
  const { toast } = useToast();
  const [argument, setArgument] = useState("");
  const [topic, setTopic] = useState("");
  const [position, setPosition] = useState("proposition");
  const [phase, setPhase] = useState("rebuttal");
  const [analysis, setAnalysis] = useState<ArgumentAnalysis | null>(null);
  const [counterArguments, setCounterArguments] = useState<string[]>([]);
  const [showCounters, setShowCounters] = useState(false);

  const analyzeMutation = useMutation({
    mutationFn: async (data: { argument: string; topic: string; position: string; phase: string }) => {
      return apiRequest("POST", "/api/analyze-argument", data);
    },
    onSuccess: (data: any) => {
      if (data.analysis) {
        setAnalysis(data.analysis);
      }
    },
    onError: () => toast({ title: "Error", description: "Failed to analyze argument", variant: "destructive" }),
  });

  const counterMutation = useMutation({
    mutationFn: (data: { argument: string; topic: string; position: string }) =>
      apiRequest("POST", "/api/counter-arguments", data),
    onSuccess: (data: any) => {
      setCounterArguments(data.counterArguments || []);
      setShowCounters(true);
    },
    onError: () => toast({ title: "Error", description: "Failed to generate counter-arguments", variant: "destructive" }),
  });

  const handleAnalyze = () => {
    if (!argument.trim()) return;
    analyzeMutation.mutate({ argument, topic, position, phase });
  };

  const handleCounters = () => {
    if (!argument.trim() || !topic.trim()) {
      toast({ title: "Required", description: "Please enter both argument and topic", variant: "destructive" });
      return;
    }
    counterMutation.mutate({ argument, topic, position });
  };

  const PHASES = ["opening", "rebuttal", "cross-examination", "closing"];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-6 py-3">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Practice Mode</h1>
            <p className="text-xs text-muted-foreground">Test and refine your arguments</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Practice explanation */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">How Practice Mode Works</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Use this sandbox to analyze any argument, get AI feedback on your logic and evidence, 
                and generate counter-arguments to anticipate objections. Perfect for debate preparation.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Your Argument</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Topic */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Topic (for context)</label>
                  <Input
                    placeholder="e.g. Social media harms society..."
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="text-sm"
                    data-testid="input-practice-topic"
                  />
                  {/* Quick topics */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {SAMPLE_TOPICS.slice(0, 3).map((t, i) => (
                      <button
                        key={i}
                        onClick={() => setTopic(t)}
                        className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground hover-elevate"
                      >
                        {t.slice(0, 28)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Your Position</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["proposition", "opposition"].map(pos => (
                      <button
                        key={pos}
                        onClick={() => setPosition(pos)}
                        className={`py-2 px-3 text-xs rounded-md border transition-colors capitalize ${
                          position === pos
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border text-muted-foreground"
                        }`}
                        data-testid={`button-pos-${pos}`}
                      >
                        {pos === "proposition" ? <><Shield className="w-3 h-3 inline mr-1" />For</> : <><Swords className="w-3 h-3 inline mr-1" />Against</>}
                        <span className="ml-1 capitalize">{pos}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phase */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Phase</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PHASES.map(p => (
                      <button
                        key={p}
                        onClick={() => setPhase(p)}
                        className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                          phase === p
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border text-muted-foreground"
                        }`}
                        data-testid={`button-practice-phase-${p}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Argument */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Your Argument</label>
                  <Textarea
                    placeholder="Write your argument here. Be specific, use evidence, and structure your points clearly..."
                    value={argument}
                    onChange={e => setArgument(e.target.value)}
                    className="min-h-[140px] text-sm"
                    data-testid="textarea-practice-argument"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!argument.trim() || analyzeMutation.isPending}
                    className="flex-1"
                    data-testid="button-analyze-argument"
                  >
                    {analyzeMutation.isPending ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Analyze Argument</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCounters}
                    disabled={!argument.trim() || counterMutation.isPending}
                    data-testid="button-get-counters"
                  >
                    {counterMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Counter Arguments */}
            {showCounters && counterArguments.length > 0 && (
              <Card className="border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    Counter-Arguments to Anticipate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {counterArguments.map((counter, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{i + 1}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{counter}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Analysis Results */}
          <div className="space-y-4">
            {analysis ? (
              <ArgumentAnalysisCard analysis={analysis} />
            ) : (
              <div className="bg-card border border-card-border rounded-lg flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary opacity-70" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">AI Analysis Ready</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Submit an argument to receive detailed scoring on logic, evidence quality, clarity, and persuasiveness — plus actionable feedback.
                </p>
              </div>
            )}

            {/* Tips Card */}
            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Debate Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    "Start with your strongest claim, then provide evidence",
                    "Use the PEEL structure: Point, Evidence, Explain, Link",
                    "Anticipate counterarguments and address them preemptively",
                    "Use specific statistics and examples over vague claims",
                    "End each argument by connecting back to the core motion",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
