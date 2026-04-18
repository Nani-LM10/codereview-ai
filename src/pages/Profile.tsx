import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { getReviews } from "@/lib/api";
import { computeBadges, computeDashboardStats } from "@/lib/stats";
import type { Review } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Code, Star, TriangleAlert as AlertTriangle, Globe, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Profile() {
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

  const stats = React.useMemo(() => computeDashboardStats(reviews), [reviews]);
  const badges = React.useMemo(() => computeBadges(reviews), [reviews]);

  const name = user?.name || user?.email?.split("@")[0] || "Developer";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const joinDate = user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "—";
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="size-16 rounded-xl">
              <AvatarFallback className="rounded-xl text-lg font-bold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold">{name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" /> Joined {joinDate}
                </span>
                <span className="flex items-center gap-1">
                  <Code className="size-3" /> {stats.totalReviews} reviews
                </span>
                <span className="flex items-center gap-1">
                  <Star className="size-3" /> {unlockedCount}/{badges.length} badges
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Reviews", value: stats.totalReviews, icon: Code, color: "text-blue-500" },
          { label: "Issues Found", value: stats.issuesDetected, icon: AlertTriangle, color: "text-orange-500" },
          { label: "Avg Score", value: stats.averageScore.toFixed(1), icon: Star, color: "text-yellow-500" },
          { label: "Languages", value: stats.languagesUsed, icon: Globe, color: "text-green-500" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <item.icon className={cn("size-5 shrink-0", item.color)} />
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Achievement Badges
            <span className="text-sm font-normal text-muted-foreground">
              {unlockedCount} of {badges.length} unlocked
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                  badge.unlocked
                    ? "border-primary/30 bg-primary/5"
                    : "border-dashed opacity-50"
                )}
              >
                <span className="text-2xl" role="img" aria-label={badge.name}>
                  {badge.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{badge.name}</p>
                    {badge.unlocked && (
                      <Badge variant="secondary" className="text-xs py-0 px-1.5 h-4">
                        Unlocked
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {stats.languageBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Language Proficiency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.languageBreakdown.map((item) => (
              <div key={item.language} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.language}</span>
                  <span className="text-muted-foreground">{item.count} review{item.count !== 1 ? "s" : ""}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
