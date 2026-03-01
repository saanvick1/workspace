import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { UserStats, DebateSession } from "@shared/schema";
import {
  Swords, Trophy, Target, TrendingUp, Flame, Plus,
  BookOpen, History, ChevronRight, Star, BarChart3
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string | number; color: string;
}) {
  return (
    <Card className="border-card-border">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-md ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function WinRateBar({ won, total }: { won: number; total: number }) {
  const rate = total > 0 ? Math.round((won / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Win Rate</span>
        <span className="font-medium text-foreground">{rate}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700"
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/stats"],
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery<DebateSession[]>({
    queryKey: ["/api/sessions"],
  });

  const recentSessions = sessions?.slice(0, 4) || [];
  const completedSessions = sessions?.filter(s => s.status === "completed") || [];
  const avgScore = stats?.avgScore || 0;

  const getDifficultyColor = (score: number | null) => {
    if (!score) return "secondary";
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-6 py-3">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Your debate performance at a glance</p>
          </div>
          <Link href="/topics">
            <Button size="sm" data-testid="button-start-debate">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Debate
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/90 to-primary/60 p-6 text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">DebateForge AI</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Sharpen Your Arguments</h2>
            <p className="text-sm opacity-80 mb-4">Practice with AI, analyze your logic, win debates.</p>
            <div className="flex gap-2 flex-wrap">
              <Link href="/topics">
                <Button size="sm" variant="secondary" data-testid="button-hero-debate">
                  <Swords className="w-3.5 h-3.5 mr-1.5" />
                  Start Debating
                </Button>
              </Link>
              <Link href="/practice">
                <Button size="sm" variant="outline" className="border-white/30 text-white" data-testid="button-hero-practice">
                  <Target className="w-3.5 h-3.5 mr-1.5" />
                  Practice Mode
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
            <Swords className="w-32 h-32" />
          </div>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Swords} label="Total Debates" value={stats?.totalDebates || 0} color="bg-primary" />
            <StatCard icon={Trophy} label="Debates Won" value={stats?.wonDebates || 0} color="bg-green-600" />
            <StatCard icon={BarChart3} label="Avg Score" value={`${avgScore}/100`} color="bg-blue-600" />
            <StatCard icon={Flame} label="Win Streak" value={stats?.streak || 0} color="bg-orange-600" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Performance Card */}
          <Card className="border-card-border md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <>
                  <WinRateBar won={stats?.wonDebates || 0} total={stats?.totalDebates || 0} />
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total Arguments</span>
                      <span className="font-medium text-foreground">{stats?.totalArguments || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Debates Completed</span>
                      <span className="font-medium text-foreground">{completedSessions.length}</span>
                    </div>
                  </div>
                  {(stats?.totalDebates || 0) === 0 && (
                    <div className="text-center py-3">
                      <p className="text-xs text-muted-foreground">Start your first debate to see stats!</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card className="border-card-border md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Recent Debates
                </CardTitle>
                <Link href="/history">
                  <Button variant="ghost" size="sm" className="text-xs h-7">
                    View all <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-md" />
                  ))}
                </div>
              ) : recentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Swords className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No debates yet</p>
                  <Link href="/topics">
                    <Button size="sm" variant="outline" className="mt-3" data-testid="button-empty-start">
                      Start your first debate
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <Link key={session.id} href={session.status === "active" ? `/debate/${session.id}` : `/history`}>
                      <div
                        className="flex items-center justify-between p-3 rounded-md hover-elevate cursor-pointer border border-border"
                        data-testid={`card-session-${session.id}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{session.topicTitle}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant="outline" className="text-xs">{session.format}</Badge>
                            <span className="text-xs text-muted-foreground">{session.userPosition}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {session.score !== null && session.score !== undefined && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              <span className="text-xs font-medium text-foreground">{session.score}</span>
                            </div>
                          )}
                          <Badge
                            variant={session.status === "completed" ? "secondary" : "default"}
                            className="text-xs"
                          >
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/topics">
            <Card className="border-card-border cursor-pointer hover-elevate" data-testid="card-quick-browse">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Browse Topics</p>
                  <p className="text-xs text-muted-foreground">Explore debate motions</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/practice">
            <Card className="border-card-border cursor-pointer hover-elevate" data-testid="card-quick-practice">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-green-500/10 flex items-center justify-center">
                  <Target className="w-4.5 h-4.5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Argument Practice</p>
                  <p className="text-xs text-muted-foreground">Analyze your arguments</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/history">
            <Card className="border-card-border cursor-pointer hover-elevate" data-testid="card-quick-history">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <History className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Debate History</p>
                  <p className="text-xs text-muted-foreground">Review past debates</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
