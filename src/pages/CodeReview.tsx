import { toast } from "sonner";
import * as React from "react";
import { callReviewFunction } from "@/lib/api";
import type { ReviewFeedback, Issue } from "@/types";
import { LANGUAGES, LANGUAGE_LABELS } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sparkles, TriangleAlert as AlertTriangle, Info, Circle as XCircle,
  Zap, CircleCheck as CheckCircle2, RotateCcw, Save, FileCode as FileCode2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Sub-components ────────────────────────────────────────────

function IssueIcon({ type }: { type: Issue["type"] }) {
  if (type === "error") return <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />;
  if (type === "warning") return <AlertTriangle className="size-4 text-yellow-500 shrink-0 mt-0.5" />;
  return <Info className="size-4 text-blue-500 shrink-0 mt-0.5" />;
}

function IssueCard({ issue }: { issue: Issue }) {
  const bg =
    issue.type === "error" ? "border-destructive/30 bg-destructive/5"
      : issue.type === "warning" ? "border-yellow-500/30 bg-yellow-500/5"
        : "border-blue-500/30 bg-blue-500/5";
  return (
    <div className={cn("rounded-lg border p-4 space-y-1.5", bg)}>
      <div className="flex items-start gap-2">
        <IssueIcon type={issue.type} />
        <div>
          <p className="text-sm font-semibold leading-tight">{issue.title}</p>
          <Badge variant="outline" className={cn(
            "mt-1 text-xs py-0 px-1.5 h-4 capitalize",
            issue.type === "error" && "border-destructive/50 text-destructive",
            issue.type === "warning" && "border-yellow-500/50 text-yellow-600 dark:text-yellow-400",
            issue.type === "info" && "border-blue-500/50 text-blue-600 dark:text-blue-400"
          )}>
            {issue.type}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground pl-6">{issue.description}</p>
    </div>
  );
}

function FeedbackCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border p-4 space-y-1">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ScoreDisplay({ score }: { score: number }) {
  const color = score >= 8 ? "text-green-600 dark:text-green-400"
    : score >= 6 ? "text-yellow-600 dark:text-yellow-400" : "text-destructive";
  const bg = score >= 8 ? "bg-green-100 dark:bg-green-900/20"
    : score >= 6 ? "bg-yellow-100 dark:bg-yellow-900/20" : "bg-destructive/10";
  const label = score >= 8 ? "Good Quality" : score >= 6 ? "Needs Improvement" : "Poor Quality";

  return (
    <div className={cn("rounded-xl p-4 flex items-center gap-4", bg)}>
      <div className={cn("text-4xl font-bold tabular-nums", color)}>
        {score.toFixed(1)}
        <span className="text-lg font-normal text-muted-foreground">/10</span>
      </div>
      <div className="flex-1">
        <p className={cn("text-sm font-semibold", color)}>{label}</p>
        <div className="mt-1 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700",
              score >= 8 ? "bg-green-500" : score >= 6 ? "bg-yellow-500" : "bg-destructive"
            )}
            style={{ width: `${(score / 10) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

const LOADING_STEPS = [
  "Sending code to server...",
  "Calling AI...",
  "Analyzing your code...",
  "Generating feedback...",
];

export default function CodeReview() {
  const [code, setCode] = React.useState("");
  const [language, setLanguage] = React.useState("javascript");
  const [filename, setFilename] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [loadingStep, setLoadingStep] = React.useState(0);
  const [feedback, setFeedback] = React.useState<ReviewFeedback | null>(null);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  // Cycle through loading messages while waiting
  React.useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep((s) => (s + 1) % LOADING_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [loading]);

  const handleReview = async () => {
    if (!code.trim()) {
      setError("Please paste some code to review.");
      return;
    }
    setError("");
    setFeedback(null);
    setSaved(false);
    setLoading(true);
    try {
      const result = await callReviewFunction(code, language, filename);
      setFeedback(result);
      setSaved(true);
      toast.success("Review complete!", { description: `Score: ${result.score}/10 · Saved to history` });
    } catch (err: any) {
      const msg = err.message || "Review failed. Check that your server is running and AI_API_KEY is set.";
      setError(msg);
      toast.error("Review failed", { description: msg.length > 80 ? msg.slice(0, 80) + "…" : msg });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode("");
    setFilename("");
    setFeedback(null);
    setError("");
    setSaved(false);
    toast.info("Editor cleared");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Left: Code input ── */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCode2 className="size-4" />
              Code Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage} disabled={loading}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>{LANGUAGE_LABELS[lang]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Filename <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  placeholder="e.g. main.py"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label>Your Code</Label>
                <span className="text-xs text-muted-foreground">{code.length.toLocaleString()} chars</span>
              </div>
              <Textarea
                placeholder={`Paste your ${LANGUAGE_LABELS[language] || language} code here...`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                className="min-h-[320px] font-mono text-sm resize-none"
              />
            </div>



            <div className="flex gap-2">
              <Button
                className="flex-1 gap-2"
                onClick={handleReview}
                disabled={loading || !code.trim()}
              >
                {loading ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {LOADING_STEPS[loadingStep]}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Review with AI
                  </>
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={handleClear} disabled={loading} title="Clear">
                <RotateCcw className="size-4" />
              </Button>
            </div>

            {saved && !loading && (
              <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <Save className="size-3" /> Review saved to history
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Right: Results ── */}
      <div className="space-y-4">

        {/* Error state */}
        {error && !loading && (
          <Card className="h-full">
            <CardContent className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center py-12">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
                <XCircle className="size-8 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-destructive">Review Failed</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!feedback && !loading && !error && (
          <Card className="h-full">
            <CardContent className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center py-12">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                <Sparkles className="size-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">AI Feedback will appear here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Paste your code and click "Review with AI"
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {["Issues", "Performance", "Best Practices"].map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {loading && (
          <Card>
            <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-6 py-12">
              <div className="relative">
                <div className="size-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="size-6 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold">{LOADING_STEPS[loadingStep]}</p>
                <p className="text-sm text-muted-foreground">
                  AI is reviewing your code
                </p>
              </div>
              <div className="flex gap-1.5">
                {LOADING_STEPS.map((_, i) => (
                  <div key={i} className={cn(
                    "size-1.5 rounded-full transition-all",
                    i === loadingStep ? "bg-primary w-4" : "bg-muted"
                  )} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {feedback && !loading && (
          <div className="space-y-4">
            <ScoreDisplay score={feedback.score} />

            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-medium mb-1 text-muted-foreground">Summary</p>
                <p className="text-sm leading-relaxed">{feedback.summary}</p>
              </CardContent>
            </Card>

            <Tabs defaultValue="issues">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="issues" className="gap-1.5 text-xs">
                  <XCircle className="size-3" />
                  Issues
                  {feedback.issues.length > 0 && (
                    <Badge variant="secondary" className="text-xs py-0 px-1 h-4 ml-0.5">
                      {feedback.issues.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="performance" className="gap-1.5 text-xs">
                  <Zap className="size-3" /> Performance
                </TabsTrigger>
                <TabsTrigger value="practices" className="gap-1.5 text-xs">
                  <CheckCircle2 className="size-3" /> Best Practices
                </TabsTrigger>
              </TabsList>

              <TabsContent value="issues" className="space-y-3 mt-4">
                {feedback.issues.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                    <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                    <p className="text-sm">No issues detected! Your code looks clean.</p>
                  </div>
                ) : (
                  feedback.issues.map((issue, i) => <IssueCard key={i} issue={issue} />)
                )}
              </TabsContent>

              <TabsContent value="performance" className="space-y-3 mt-4">
                {feedback.performance.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No performance notes.</p>
                ) : (
                  feedback.performance.map((tip, i) => (
                    <FeedbackCard key={i} title={tip.title} description={tip.description} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="practices" className="space-y-3 mt-4">
                {feedback.bestPractices.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No best practice notes.</p>
                ) : (
                  feedback.bestPractices.map((bp, i) => (
                    <FeedbackCard key={i} title={bp.title} description={bp.description} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
