import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/score-ring";
import { AlertTriangle, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import type { ArgumentAnalysis } from "@shared/schema";

interface ArgumentAnalysisCardProps {
  analysis: ArgumentAnalysis;
}

export function ArgumentAnalysisCard({ analysis }: ArgumentAnalysisCardProps) {
  const metrics = [
    { label: "Logic", score: analysis.logicScore || 0 },
    { label: "Evidence", score: analysis.evidenceScore || 0 },
    { label: "Clarity", score: analysis.clarityScore || 0 },
    { label: "Persuasion", score: analysis.persuasivenessScore || 0 },
  ];

  return (
    <Card className="border-card-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-foreground">Argument Analysis</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Overall</span>
            <ScoreRing score={analysis.overallScore || 0} size={48} strokeWidth={4} showLabel={false} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {metrics.map((m) => (
            <ScoreRing key={m.label} score={m.score} size={56} strokeWidth={4} label={m.label} />
          ))}
        </div>

        {analysis.fallacies && analysis.fallacies.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-foreground">Fallacies Detected</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {analysis.fallacies.map((f, i) => (
                <Badge key={i} variant="outline" className="text-xs border-amber-500/30 text-amber-600 dark:text-amber-400">
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {analysis.strengths && analysis.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-medium text-foreground">Strengths</span>
            </div>
            <ul className="space-y-1">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-green-500 flex-shrink-0">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.weaknesses && analysis.weaknesses.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-medium text-foreground">Areas to Improve</span>
            </div>
            <ul className="space-y-1">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-red-500 flex-shrink-0">-</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.suggestions && analysis.suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-medium text-foreground">Suggestions</span>
            </div>
            <ul className="space-y-1">
              {analysis.suggestions.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-blue-500 flex-shrink-0">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
