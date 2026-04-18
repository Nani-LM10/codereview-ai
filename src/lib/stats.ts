import type { Review, DashboardStats, AnalyticsData } from "@/types";
import { LANGUAGE_LABELS } from "@/types";
import { format, subDays, startOfDay } from "date-fns";

export function computeDashboardStats(reviews: Review[]): DashboardStats {
  const totalReviews = reviews.length;
  const issuesDetected = reviews.reduce((sum, r) => sum + (r.issues?.length || 0), 0);
  const averageScore =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.score, 0) / totalReviews
      : 0;

  const languageSet = new Set(reviews.map((r) => r.language));
  const languagesUsed = languageSet.size;

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    const key = format(startOfDay(date), "yyyy-MM-dd");
    return { date: format(date, "MMM d"), key };
  });

  const dayCounts: Record<string, number> = {};
  reviews.forEach((r) => {
    const key = format(startOfDay(new Date(r.created_at)), "yyyy-MM-dd");
    dayCounts[key] = (dayCounts[key] || 0) + 1;
  });

  const chartData = last30.map(({ date, key }) => ({
    date,
    count: dayCounts[key] || 0,
  }));

  const langCounts: Record<string, number> = {};
  reviews.forEach((r) => {
    langCounts[r.language] = (langCounts[r.language] || 0) + 1;
  });

  const languageBreakdown = Object.entries(langCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([language, count]) => ({
      language: LANGUAGE_LABELS[language] || language,
      count,
      percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0,
    }));

  return {
    totalReviews,
    issuesDetected,
    averageScore,
    languagesUsed,
    recentReviews: reviews.slice(0, 5),
    chartData,
    languageBreakdown,
  };
}

export function computeAnalyticsData(reviews: Review[]): AnalyticsData {
  const last15 = reviews.slice(0, 15).reverse();
  const scoreTrend = last15.map((r, i) => ({
    index: i + 1,
    score: r.score,
    language: LANGUAGE_LABELS[r.language] || r.language,
    date: format(new Date(r.created_at), "MMM d"),
  }));

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    const key = format(startOfDay(date), "yyyy-MM-dd");
    return { date: format(date, "MMM d"), key };
  });

  const dayCounts: Record<string, number> = {};
  reviews.forEach((r) => {
    const key = format(startOfDay(new Date(r.created_at)), "yyyy-MM-dd");
    dayCounts[key] = (dayCounts[key] || 0) + 1;
  });

  const volumeData = last30.map(({ date, key }) => ({
    date,
    count: dayCounts[key] || 0,
  }));

  const langCounts: Record<string, number> = {};
  reviews.forEach((r) => {
    langCounts[r.language] = (langCounts[r.language] || 0) + 1;
  });

  const total = reviews.length;
  const languageBreakdown = Object.entries(langCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([language, count]) => ({
      language: LANGUAGE_LABELS[language] || language,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

  const issueTypeCounts: Record<string, number> = { error: 0, warning: 0, info: 0 };
  reviews.forEach((r) => {
    (r.issues || []).forEach((issue) => {
      issueTypeCounts[issue.type] = (issueTypeCounts[issue.type] || 0) + 1;
    });
  });

  const issueTypes = Object.entries(issueTypeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return { scoreTrend, volumeData, languageBreakdown, issueTypes };
}

export function computeBadges(reviews: Review[]) {
  const totalReviews = reviews.length;
  const issuesFound = reviews.reduce((s, r) => s + (r.issues?.length || 0), 0);
  const languages = new Set(reviews.map((r) => r.language)).size;
  const perfectScores = reviews.filter((r) => r.score >= 9).length;
  const highScores = reviews.filter((r) => r.score >= 8).length;

  return [
    {
      id: "first_review",
      name: "First Review",
      description: "Complete your first code review",
      icon: "🚀",
      unlocked: totalReviews >= 1,
    },
    {
      id: "bug_hunter",
      name: "Bug Hunter",
      description: "Find 5 or more issues across reviews",
      icon: "🐛",
      unlocked: issuesFound >= 5,
    },
    {
      id: "streak_3",
      name: "Consistent Coder",
      description: "Complete 3 code reviews",
      icon: "🔥",
      unlocked: totalReviews >= 3,
    },
    {
      id: "perfect_score",
      name: "Perfect Score",
      description: "Receive a score of 9.0 or higher",
      icon: "⭐",
      unlocked: perfectScores >= 1,
    },
    {
      id: "polyglot",
      name: "Polyglot",
      description: "Review code in 3 different languages",
      icon: "🌐",
      unlocked: languages >= 3,
    },
    {
      id: "century",
      name: "Century",
      description: "Complete 10 code reviews",
      icon: "💯",
      unlocked: totalReviews >= 10,
    },
    {
      id: "streak_10",
      name: "Power Reviewer",
      description: "Complete 20 code reviews",
      icon: "⚡",
      unlocked: totalReviews >= 20,
    },
    {
      id: "clean_coder",
      name: "Clean Coder",
      description: "Get 3 scores of 8.0 or higher",
      icon: "✨",
      unlocked: highScores >= 3,
    },
  ];
}
