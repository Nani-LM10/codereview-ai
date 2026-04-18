export interface Issue {
  type: "error" | "warning" | "info";
  title: string;
  description: string;
}

export interface PerformanceTip {
  title: string;
  description: string;
}

export interface BestPractice {
  title: string;
  description: string;
}

export interface ReviewFeedback {
  score: number;
  summary: string;
  issues: Issue[];
  performance: PerformanceTip[];
  bestPractices: BestPractice[];
}

export interface Review {
  id: string;
  user_id: string;
  code: string;
  language: string;
  filename: string;
  score: number;
  summary: string;
  issues: Issue[];
  performance: PerformanceTip[];
  best_practices: BestPractice[];
  created_at: string;
}

export interface DashboardStats {
  totalReviews: number;
  issuesDetected: number;
  averageScore: number;
  languagesUsed: number;
  recentReviews: Review[];
  chartData: { date: string; count: number }[];
  languageBreakdown: { language: string; count: number; percentage: number }[];
}

export interface AnalyticsData {
  scoreTrend: { index: number; score: number; language: string; date: string }[];
  volumeData: { date: string; count: number }[];
  languageBreakdown: { language: string; count: number; percentage: number }[];
  issueTypes: { type: string; count: number }[];
}

export const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "go",
  "rust",
  "php",
  "ruby",
  "swift",
] as const;

export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  go: "Go",
  rust: "Rust",
  php: "PHP",
  ruby: "Ruby",
  swift: "Swift",
};

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}
