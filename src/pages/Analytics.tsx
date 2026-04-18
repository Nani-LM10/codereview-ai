import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { getReviews } from "@/lib/api";
import { computeAnalyticsData } from "@/lib/stats";
import type { Review } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { TrendingUp, ChartBar as BarChart3, Globe, TriangleAlert as AlertTriangle } from "lucide-react";

const scoreConfig = {
  score: { label: "Score", color: "var(--chart-1)" },
};

const volumeConfig = {
  count: { label: "Reviews", color: "var(--chart-2)" },
};

export default function Analytics() {
  const { user } = useAuth();
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    getReviews()
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const data = React.useMemo(() => computeAnalyticsData(reviews), [reviews]);

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center">
        <div className="grid w-full max-w-6xl gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4 py-20 text-center">
        <BarChart3 className="size-16 text-muted-foreground/40" />
        <div>
          <p className="text-lg font-semibold">No analytics data yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Complete some code reviews to see analytics here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="w-full max-w-6xl space-y-6">
        <div className="grid w-full gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4" />
              Score Trend (Last 15 Reviews)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.scoreTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Not enough data</p>
            ) : (
              <ChartContainer config={scoreConfig} className="h-48 w-full">
                <LineChart data={data.scoreTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--color-score)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--color-score)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4" />
              Review Volume (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={volumeConfig} className="h-48 w-full">
              <BarChart data={data.volumeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={3} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="size-4" />
              Language Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.languageBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              data.languageBreakdown.map((item) => (
                <div key={item.language} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.language}</span>
                    <span className="text-muted-foreground">
                      {item.count} review{item.count !== 1 ? "s" : ""} &mdash; {item.percentage}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4" />
              Issue Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.issueTypes.every((t) => t.count === 0) ? (
              <p className="text-sm text-muted-foreground">No issues detected yet — great work!</p>
            ) : (
              data.issueTypes.map((item) => {
                const total = data.issueTypes.reduce((s, t) => s + t.count, 0);
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                const labelMap: Record<string, string> = {
                  error: "Errors",
                  warning: "Warnings",
                  info: "Info",
                };
                const colorMap: Record<string, string> = {
                  error: "bg-destructive",
                  warning: "bg-yellow-500",
                  info: "bg-blue-500",
                };
                return (
                  <div key={item.type} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{labelMap[item.type] || item.type}</span>
                      <span className="text-muted-foreground">{item.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colorMap[item.type] || "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);
}
