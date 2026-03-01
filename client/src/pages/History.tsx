import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ScoreRing } from "@/components/score-ring";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DebateSession } from "@shared/schema";
import { History as HistoryIcon, Swords, Trophy, XCircle, Trash2, Play, Star } from "lucide-react";

export default function History() {
  const { toast } = useToast();

  const { data: sessions = [], isLoading } = useQuery<DebateSession[]>({
    queryKey: ["/api/sessions"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({ title: "Debate deleted" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete", variant: "destructive" }),
  });

  const completedSessions = sessions.filter(s => s.status === "completed");
  const activeSessions = sessions.filter(s => s.status === "active");

  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
    : 0;

  const wins = completedSessions.filter(s => (s.score || 0) >= 60).length;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-6 py-3">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Debate History</h1>
            <p className="text-xs text-muted-foreground">{sessions.length} total debates</p>
          </div>
          <Link href="/topics">
            <Button size="sm" data-testid="button-new-debate">
              <Swords className="w-3.5 h-3.5 mr-1.5" />
              New Debate
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Summary Cards */}
        {completedSessions.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-card-border">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{completedSessions.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
              </CardContent>
            </Card>
            <Card className="border-card-border">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{wins}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Won</p>
              </CardContent>
            </Card>
            <Card className="border-card-border">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{avgScore}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Avg Score</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-green-500" />
              Active Debates
            </h2>
            <div className="space-y-2">
              {activeSessions.map(session => (
                <Card key={session.id} className="border-card-border border-green-500/20" data-testid={`card-active-${session.id}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{session.topicTitle}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{session.format}</Badge>
                        <span className="text-xs text-muted-foreground capitalize">{session.userPosition}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(session.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">Active</Badge>
                      <Link href={`/debate/${session.id}`}>
                        <Button size="sm" variant="outline" data-testid={`button-resume-${session.id}`}>
                          <Play className="w-3.5 h-3.5 mr-1" />
                          Resume
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(session.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${session.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Sessions */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : completedSessions.length === 0 ? (
          <div className="text-center py-12">
            <HistoryIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground mb-1">No completed debates yet</p>
            <p className="text-xs text-muted-foreground mb-4">Complete a debate to see it here with your score and feedback</p>
            <Link href="/topics">
              <Button size="sm" data-testid="button-start-first">Start a Debate</Button>
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Completed Debates
            </h2>
            <div className="space-y-3">
              {completedSessions.map(session => (
                <Card key={session.id} className="border-card-border" data-testid={`card-completed-${session.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {session.score !== null && session.score !== undefined && (
                        <div className="flex-shrink-0">
                          <ScoreRing score={session.score} size={60} strokeWidth={5} showLabel={false} />
                          <p className="text-xs text-center text-muted-foreground mt-1">{session.score}/100</p>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug mb-1">{session.topicTitle}</p>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge variant="outline" className="text-xs">{session.format}</Badge>
                          <span className="text-xs text-muted-foreground capitalize">{session.userPosition}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(session.createdAt)}</span>
                        </div>
                        {session.feedback && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{session.feedback}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {session.score !== null && session.score !== undefined && (
                          <div className="flex items-center gap-1">
                            {(session.score || 0) >= 60 ? (
                              <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                            <span className={`text-xs font-medium ${getScoreColor(session.score || 0)}`}>
                              {(session.score || 0) >= 60 ? "Won" : "Lost"}
                            </span>
                          </div>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(session.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-completed-${session.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
