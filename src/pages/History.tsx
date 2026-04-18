import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { getReviews, deleteReview } from "@/lib/api";
import type { Review } from "@/types";
import { LANGUAGE_LABELS, LANGUAGES } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Trash2, FileCode as FileCode2, Clock, Circle as XCircle, Zap, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Issue } from "@/types";

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 8
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : score >= 6
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-sm font-bold", cls)}>
      {score.toFixed(1)}
    </span>
  );
}

function IssueChip({ type, count }: { type: Issue["type"]; count: number }) {
  if (count === 0) return null;
  const cls =
    type === "error"
      ? "text-destructive"
      : type === "warning"
      ? "text-yellow-500"
      : "text-blue-500";
  const Icon = type === "error" ? XCircle : type === "warning" ? AlertTriangle : Info;
  return (
    <span className={cn("flex items-center gap-1 text-xs", cls)}>
      <Icon className="size-3" /> {count}
    </span>
  );
}

export default function History() {
  const { user } = useAuth();
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [langFilter, setLangFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Review | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;
    getReviews()
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = reviews.filter((r) => {
    const matchSearch =
      !search ||
      r.filename.toLowerCase().includes(search.toLowerCase()) ||
      r.language.toLowerCase().includes(search.toLowerCase());
    const matchLang = langFilter === "all" || r.language === langFilter;
    return matchSearch && matchLang;
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={langFilter} onValueChange={setLangFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <FileCode2 className="size-10 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium">No reviews found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reviews.length === 0
                      ? "Start your first code review to see history here."
                      : "Try adjusting your search or filters."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filtered.map((review) => (
              <div
                key={review.id}
                onClick={() => setSelected(review)}
                className={cn(
                  "cursor-pointer rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50",
                  selected?.id === review.id && "border-primary bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {review.filename || `${LANGUAGE_LABELS[review.language] || review.language} snippet`}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {format(new Date(review.created_at), "MMM d, yyyy")}
                      <Badge variant="outline" className="text-xs py-0 px-1.5 h-4">
                        {LANGUAGE_LABELS[review.language] || review.language}
                      </Badge>
                    </div>
                    <div className="flex gap-3 mt-1.5">
                      <IssueChip
                        type="error"
                        count={review.issues?.filter((i) => i.type === "error").length || 0}
                      />
                      <IssueChip
                        type="warning"
                        count={review.issues?.filter((i) => i.type === "warning").length || 0}
                      />
                    </div>
                  </div>
                  <ScoreBadge score={review.score} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-3">
        {!selected ? (
          <Card className="h-full">
            <CardContent className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
              <FileCode2 className="size-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Select a review to see details
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    {selected.filename || `${LANGUAGE_LABELS[selected.language] || selected.language} snippet`}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {format(new Date(selected.created_at), "MMMM d, yyyy 'at' h:mm a")}
                    <Badge variant="outline" className="text-xs py-0 px-1.5 h-4">
                      {LANGUAGE_LABELS[selected.language] || selected.language}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ScoreBadge score={selected.score} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Review</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this code review. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(selected.id)}
                          className="bg-destructive text-white hover:bg-destructive/90"
                        >
                          {deletingId === selected.id ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{selected.summary}</p>

              <Tabs defaultValue="issues">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="issues" className="text-xs gap-1">
                    <XCircle className="size-3" /> Issues ({selected.issues?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="text-xs gap-1">
                    <Zap className="size-3" /> Performance
                  </TabsTrigger>
                  <TabsTrigger value="practices" className="text-xs gap-1">
                    <CheckCircle2 className="size-3" /> Best Practices
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="issues" className="space-y-2 mt-3">
                  {(selected.issues || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No issues found.</p>
                  ) : (
                    (selected.issues || []).map((issue, i) => (
                      <div key={i} className="rounded-lg border p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          {issue.type === "error" ? (
                            <XCircle className="size-3.5 text-destructive shrink-0" />
                          ) : issue.type === "warning" ? (
                            <AlertTriangle className="size-3.5 text-yellow-500 shrink-0" />
                          ) : (
                            <Info className="size-3.5 text-blue-500 shrink-0" />
                          )}
                          <p className="text-sm font-medium">{issue.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground pl-5">{issue.description}</p>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="performance" className="space-y-2 mt-3">
                  {(selected.performance || []).map((tip, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-1">
                      <p className="text-sm font-medium">{tip.title}</p>
                      <p className="text-xs text-muted-foreground">{tip.description}</p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="practices" className="space-y-2 mt-3">
                  {(selected.best_practices || []).map((bp, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-1">
                      <p className="text-sm font-medium">{bp.title}</p>
                      <p className="text-xs text-muted-foreground">{bp.description}</p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>

              {selected.code && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Reviewed Code</p>
                  <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-auto max-h-40 whitespace-pre-wrap break-all">
                    {selected.code}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
