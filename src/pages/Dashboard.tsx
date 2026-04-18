import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getReviews } from "@/lib/api";
import { computeDashboardStats } from "@/lib/stats";
import type { Review } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Code, TriangleAlert as AlertTriangle, TrendingUp, Globe, ArrowRight, FileCode as FileCode2, Clock } from "lucide-react";
import { format } from "date-fns";
import { LANGUAGE_LABELS } from "@/types";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : score >= 6
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}

const chartConfig = {
  count: { label: "Reviews", color: "var(--chart-1)" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    getReviews()
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const stats = React.useMemo(() => computeDashboardStats(reviews), [reviews]);
  const name = user?.name || user?.email?.split("@")[0] || "Developer";

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center">
        <div className="w-full max-w-7xl space-y-6">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Reviews",
      value: stats.totalReviews,
      icon: Code,
      description: "Code reviews completed",
      color: "text-blue-500",
    },
    {
      title: "Issues Detected",
      value: stats.issuesDetected,
      icon: AlertTriangle,
      description: "Bugs & warnings found",
      color: "text-orange-500",
    },
    {
      title: "Average Score",
      value: stats.averageScore.toFixed(1),
      icon: TrendingUp,
      description: "Out of 10.0",
      color: "text-green-500",
    },
    {
      title: "Languages Used",
      value: stats.languagesUsed,
      icon: Globe,
      description: "Programming languages",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="w-full max-w-7xl space-y-6">
        <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here's an overview of your code review activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`size-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Review Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totalReviews === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No reviews yet. Start your first code review!
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-40 w-full">
                <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={6}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={3} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Language Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.languageBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No languages tracked yet.</p>
            ) : (
              stats.languageBreakdown.slice(0, 5).map((item) => (
                <div key={item.language} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.language}</span>
                    <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Reviews</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/app/history")} className="gap-1 text-xs">
            View all <ArrowRight className="size-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recentReviews.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <FileCode2 className="size-10 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">No reviews yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start by reviewing your first piece of code.
                </p>
              </div>
              <Button size="sm" onClick={() => navigate("/app/review")}>
                Review Code Now
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {review.filename || `${LANGUAGE_LABELS[review.language] || review.language} snippet`}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                        <Badge variant="outline" className="text-xs py-0 px-1.5 h-4">
                          {LANGUAGE_LABELS[review.language] || review.language}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <ScoreBadge score={review.score} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
);
}
