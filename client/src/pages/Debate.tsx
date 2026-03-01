import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ArgumentAnalysisCard } from "@/components/argument-analysis-card";
import { ScoreRing } from "@/components/score-ring";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DebateSession, DebateMessage, ArgumentAnalysis } from "@shared/schema";
import {
  Swords, Send, CheckCircle, Bot, User, Loader2, Trophy,
  RefreshCw, ChevronDown, MessageSquare, Sparkles, AlertCircle
} from "lucide-react";

const PHASES = [
  { id: "opening", label: "Opening" },
  { id: "rebuttal", label: "Rebuttal" },
  { id: "cross-examination", label: "Cross-Exam" },
  { id: "closing", label: "Closing" },
];

function MessageBubble({ message, isUser }: { message: DebateMessage; isUser: boolean }) {
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-foreground" />}
      </div>
      <div className={`flex-1 max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{isUser ? "You" : "AI Opponent"}</span>
          <Badge variant="outline" className="text-xs">{message.phase}</Badge>
        </div>
        <div className={`p-3 rounded-lg text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-card-border text-card-foreground"
        }`}>
          {message.content}
        </div>
      </div>
    </div>
  );
}

export default function Debate() {
  const [, params] = useRoute("/debate/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const sessionId = Number(params?.id);

  const [argument, setArgument] = useState("");
  const [phase, setPhase] = useState("rebuttal");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<ArgumentAnalysis | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedResult, setCompletedResult] = useState<{ feedback: string; score: number; winner: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessionData, isLoading } = useQuery<DebateSession & { messages: DebateMessage[]; analyses: ArgumentAnalysis[] }>({
    queryKey: ["/api/sessions", sessionId],
    queryFn: () => apiRequest("GET", `/api/sessions/${sessionId}`),
    refetchInterval: false,
  });

  const argueMutation = useMutation({
    mutationFn: (data: { argument: string; phase: string }) =>
      apiRequest("POST", `/api/sessions/${sessionId}/argue`, data),
    onSuccess: (data: any) => {
      setArgument("");
      setLastAnalysis(data.analysis);
      setShowAnalysis(true);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId] });
    },
    onError: () => toast({ title: "Error", description: "Failed to submit argument", variant: "destructive" }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionData?.messages]);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const result = await apiRequest("POST", `/api/sessions/${sessionId}/complete`, {});
      setCompletedResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    } catch {
      toast({ title: "Error", description: "Failed to complete debate", variant: "destructive" });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSubmit = () => {
    if (!argument.trim() || argueMutation.isPending) return;
    argueMutation.mutate({ argument: argument.trim(), phase });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Swords className="w-8 h-8 text-primary mx-auto animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading debate...</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">Debate not found</p>
          <Button onClick={() => navigate("/topics")} size="sm">Find a Topic</Button>
        </div>
      </div>
    );
  }

  const messages = sessionData.messages || [];
  const isActive = sessionData.status === "active";
  const isCompleted = sessionData.status === "completed";
  const userMessages = messages.filter(m => m.role === "user");

  // Show completion result screen
  if (completedResult || isCompleted) {
    const result = completedResult || { feedback: sessionData.feedback || "", score: sessionData.score || 0, winner: "user" };
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Debate Complete!</h1>
            <p className="text-sm text-muted-foreground">{sessionData.topicTitle}</p>
          </div>

          <Card className="border-card-border">
            <CardContent className="p-6 text-center">
              <ScoreRing score={result.score} size={100} strokeWidth={8} showLabel={false} />
              <p className="text-3xl font-bold text-foreground mt-3">{result.score}/100</p>
              <p className="text-sm text-muted-foreground mt-1">Final Score</p>
              <div className="mt-3">
                <Badge variant={result.winner === "user" ? "default" : "secondary"} className="text-sm px-3 py-1">
                  {result.winner === "user" ? "You Won!" : "AI Wins"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Judge's Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.feedback}</p>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/topics")}>
              New Debate
            </Button>
            <Button className="flex-1" onClick={() => navigate("/history")}>
              View History
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{sessionData.topicTitle}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{sessionData.format}</Badge>
              <span className="text-xs text-muted-foreground">You: {sessionData.userPosition}</span>
              <span className="text-xs text-muted-foreground">AI: {sessionData.aiPosition}</span>
            </div>
          </div>
          {isActive && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleComplete}
              disabled={isCompleting || userMessages.length === 0}
              data-testid="button-complete-debate"
            >
              {isCompleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
              {isCompleting ? "Judging..." : "Complete"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">The debate is about to begin...</p>
              </div>
            ) : (
              messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} isUser={msg.role === "user"} />
              ))
            )}
            {argueMutation.isPending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-card border border-card-border p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    AI is formulating response...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {isActive && (
            <div className="border-t border-border p-4 flex-shrink-0">
              {/* Phase selector */}
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {PHASES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPhase(p.id)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      phase === p.id
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-muted-foreground"
                    }`}
                    data-testid={`button-phase-${p.id}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder={`Present your ${phase} argument... (Be specific and use evidence!)`}
                  value={argument}
                  onChange={e => setArgument(e.target.value)}
                  className="flex-1 min-h-[80px] max-h-[200px] resize-y text-sm"
                  onKeyDown={e => {
                    if (e.key === "Enter" && e.ctrlKey) handleSubmit();
                  }}
                  data-testid="textarea-argument"
                  disabled={argueMutation.isPending}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!argument.trim() || argueMutation.isPending}
                  className="self-end h-9"
                  data-testid="button-submit-argument"
                >
                  {argueMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Ctrl+Enter to submit</p>
            </div>
          )}
        </div>

        {/* Analysis Panel */}
        <div className="w-72 border-l border-border overflow-y-auto flex-shrink-0 hidden md:block">
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Live Analysis
              </h3>

              {lastAnalysis ? (
                <ArgumentAnalysisCard analysis={lastAnalysis} />
              ) : (
                <div className="text-center py-6 bg-muted/30 rounded-lg">
                  <Sparkles className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">Submit an argument to see real-time analysis</p>
                </div>
              )}
            </div>

            {sessionData.analyses && sessionData.analyses.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-foreground mb-2">Session Scores</h3>
                <div className="space-y-2">
                  {sessionData.analyses.slice(0, 5).map((a, i) => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Argument {i + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${a.overallScore}%` }}
                          />
                        </div>
                        <span className="font-medium text-foreground w-6 text-right">{a.overallScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2">Debate Info</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium text-foreground">{sessionData.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Position</span>
                  <span className="font-medium text-foreground capitalize">{sessionData.userPosition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Arguments Made</span>
                  <span className="font-medium text-foreground">{userMessages.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
