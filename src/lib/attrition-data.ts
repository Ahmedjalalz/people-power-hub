export type RiskEmployee = {
  name: string;
  role: string;
  score: number;
  reason: string;
  timeframe: string;
};

export const attritionOverview = {
  overallRate: 8.4,
  industryAvg: 7.1,
  atRiskCount: 12,
  totalEmployees: 248,
  trend: [
    { month: "Jan", rate: 6.2 },
    { month: "Feb", rate: 6.8 },
    { month: "Mar", rate: 7.1 },
    { month: "Apr", rate: 7.4 },
    { month: "May", rate: 7.9 },
    { month: "Jun", rate: 8.4 },
  ],
};

export const topRisk: RiskEmployee[] = [
  { name: "Usman Ali", role: "Senior Analyst", score: 82, reason: "Pension window closing, missed promotion, long commute", timeframe: "60–90 days" },
  { name: "Sarah Malik", role: "Product Manager", score: 76, reason: "Passed over for promotion, external offer signals", timeframe: "30–60 days" },
  { name: "Ahmed Raza", role: "Field Engineer", score: 71, reason: "Long commute, low engagement scores", timeframe: "60–90 days" },
  { name: "Fatima Khan", role: "Ops Lead", score: 68, reason: "Compensation gap vs. market, reduced overtime", timeframe: "90+ days" },
  { name: "Bilal Sheikh", role: "Data Analyst", score: 64, reason: "New manager, drop in 1:1 frequency", timeframe: "90+ days" },
];

export const reasonBreakdown = [
  { reason: "Career Growth", value: 34, color: "var(--pastel-pink)" },
  { reason: "Compensation", value: 28, color: "var(--pastel-peach)" },
  { reason: "Work-Life Balance", value: 22, color: "var(--pastel-mint)" },
  { reason: "Management", value: 10, color: "var(--pastel-blue)" },
  { reason: "Other", value: 6, color: "var(--pastel-lavender)" },
];

export const departmentRisk = [
  { dept: "Engineering", risk: 14, color: "var(--chart-1)" },
  { dept: "Operations", risk: 22, color: "var(--chart-2)" },
  { dept: "Sales", risk: 9, color: "var(--chart-3)" },
  { dept: "Support", risk: 17, color: "var(--chart-4)" },
  { dept: "Finance", risk: 6, color: "var(--chart-5)" },
];

export const tenureBuckets = [
  { bucket: "< 1 yr", leaving: 8 },
  { bucket: "1–3 yrs", leaving: 15 },
  { bucket: "3–5 yrs", leaving: 6 },
  { bucket: "5–10 yrs", leaving: 4 },
  { bucket: "10+ yrs", leaving: 9 },
];
