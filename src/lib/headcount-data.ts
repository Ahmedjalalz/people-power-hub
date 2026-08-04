export type Dept = {
  name: string;
  businessUnit: string;
  location: string;
  approved: number;
  budgeted: number;
  actual: number;
  vacancies: number;
  utilization: number;
  utilizationDelta: number;
};

export const departments: Dept[] = [
  { name: "Engineering", businessUnit: "Technology", location: "Lahore", approved: 96, budgeted: 92, actual: 74, vacancies: 22, utilization: 96, utilizationDelta: 3.2 },
  { name: "Operations", businessUnit: "Delivery", location: "Karachi", approved: 70, budgeted: 68, actual: 62, vacancies: 8, utilization: 88, utilizationDelta: 1.1 },
  { name: "Customer Support", businessUnit: "Delivery", location: "Karachi", approved: 52, budgeted: 48, actual: 43, vacancies: 9, utilization: 91, utilizationDelta: -0.8 },
  { name: "Sales", businessUnit: "Commercial", location: "Islamabad", approved: 46, budgeted: 44, actual: 39, vacancies: 7, utilization: 84, utilizationDelta: 2.4 },
  { name: "Marketing", businessUnit: "Commercial", location: "Islamabad", approved: 26, budgeted: 24, actual: 21, vacancies: 5, utilization: 72, utilizationDelta: -1.6 },
  { name: "Finance", businessUnit: "Corporate", location: "Lahore", approved: 34, budgeted: 33, actual: 30, vacancies: 4, utilization: 78, utilizationDelta: 0.6 },
  { name: "Human Resources", businessUnit: "Corporate", location: "Lahore", approved: 22, budgeted: 21, actual: 18, vacancies: 4, utilization: 66, utilizationDelta: -0.4 },
  { name: "IT", businessUnit: "Technology", location: "Remote", approved: 30, budgeted: 29, actual: 24, vacancies: 6, utilization: 93, utilizationDelta: 4.1 },
  { name: "Legal", businessUnit: "Corporate", location: "Lahore", approved: 12, budgeted: 12, actual: 11, vacancies: 1, utilization: 61, utilizationDelta: 0.2 },
  { name: "Administration", businessUnit: "Corporate", location: "Karachi", approved: 18, budgeted: 17, actual: 16, vacancies: 2, utilization: 69, utilizationDelta: 0.9 },
];

export const businessUnits = ["Technology", "Delivery", "Commercial", "Corporate"];
export const locations = ["Lahore", "Karachi", "Islamabad", "Remote"];
export const employmentTypes = ["Permanent", "Contract", "Part-time", "Intern"];
export const jobLevels = [
  "Intern", "Junior", "Associate", "Mid-Level", "Senior", "Lead", "Manager", "Director", "Executive",
];
export const dateRanges = ["Last 30 days", "This quarter", "This year", "Last 24 months"];

export const jobLevelMix: { level: string; count: number; color: string }[] = [
  { level: "Intern", count: 18, color: "var(--pastel-yellow)" },
  { level: "Junior", count: 44, color: "var(--pastel-mint)" },
  { level: "Associate", count: 52, color: "var(--pastel-teal)" },
  { level: "Mid-Level", count: 61, color: "var(--pastel-sky)" },
  { level: "Senior", count: 38, color: "var(--pastel-blue)" },
  { level: "Lead", count: 16, color: "var(--pastel-lavender)" },
  { level: "Manager", count: 12, color: "var(--pastel-pink)" },
  { level: "Director", count: 6, color: "var(--pastel-peach)" },
  { level: "Executive", count: 3, color: "var(--pastel-rose)" },
];

export const vacancyAgeing: { bucket: string; count: number; color: string }[] = [
  { bucket: "0–30 days", count: 26, color: "var(--pastel-mint)" },
  { bucket: "31–60 days", count: 19, color: "var(--pastel-teal)" },
  { bucket: "61–90 days", count: 11, color: "var(--pastel-yellow)" },
  { bucket: "90+ days", count: 12, color: "var(--pastel-peach)" },
];

/** 24 months of headcount, oldest first. */
export const headcountTrend: { month: string; people: number }[] = (() => {
  const labels = [
    "Sep 24", "Oct 24", "Nov 24", "Dec 24", "Jan 25", "Feb 25", "Mar 25", "Apr 25",
    "May 25", "Jun 25", "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25",
    "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26",
  ];
  const values = [
    196, 199, 203, 205, 208, 206, 211, 214, 217, 219, 221, 224,
    226, 228, 227, 231, 234, 236, 238, 240, 242, 244, 246, 248,
  ];
  return labels.map((month, index) => ({ month, people: values[index]! }));
})();

export type Kpi = {
  key: string;
  title: string;
  value: string;
  delta: number;
  tooltip: string;
  tint: string;
  spark: number[];
};

export const kpis: Kpi[] = [
  { key: "actual", title: "Actual employees", value: "248", delta: 1.6, tooltip: "Employees currently active on payroll.", tint: "bg-pastel-teal", spark: [231, 234, 238, 240, 244, 248] },
  { key: "approved", title: "Approved employees", value: "406", delta: 0.9, tooltip: "Total approved workforce positions.", tint: "bg-pastel-sky", spark: [392, 395, 398, 400, 403, 406] },
  { key: "budgeted", title: "Budgeted positions", value: "388", delta: 0.5, tooltip: "Positions approved inside the workforce budget.", tint: "bg-pastel-blue", spark: [376, 379, 381, 383, 386, 388] },
  { key: "vacant", title: "Vacant positions", value: "68", delta: -4.2, tooltip: "Approved positions that are currently unfilled.", tint: "bg-pastel-peach", spark: [79, 76, 74, 72, 70, 68] },
  { key: "funded", title: "Funded vacancies", value: "51", delta: 2.8, tooltip: "Vacancies that already have hiring budget approved.", tint: "bg-pastel-mint", spark: [44, 46, 47, 49, 50, 51] },
  { key: "vacancyRate", title: "Vacancy rate", value: "16.7%", delta: -1.3, tooltip: "Vacant positions as a share of approved positions.", tint: "bg-pastel-yellow", spark: [19.4, 18.8, 18.1, 17.5, 17.1, 16.7] },
  { key: "budgetUse", title: "Budget utilization", value: "84%", delta: 2.1, tooltip: "Share of the workforce budget used so far this year.", tint: "bg-pastel-lavender", spark: [76, 78, 79, 81, 82, 84] },
  { key: "cost", title: "Avg. cost per employee", value: "$32.4k", delta: 1.2, tooltip: "Average yearly employment cost per person.", tint: "bg-pastel-pink", spark: [30.8, 31.1, 31.5, 31.8, 32.1, 32.4] },
  { key: "hiring", title: "Hiring progress", value: "62%", delta: 5.4, tooltip: "Progress against this year's hiring plan.", tint: "bg-pastel-teal", spark: [38, 44, 49, 54, 58, 62] },
  { key: "mobility", title: "Internal mobility", value: "17", delta: 3.0, tooltip: "Employees who moved between departments this year.", tint: "bg-pastel-sky", spark: [9, 11, 12, 14, 16, 17] },
  { key: "newHires", title: "New hires (this month)", value: "9", delta: 12.5, tooltip: "People who joined during the current month.", tint: "bg-pastel-mint", spark: [5, 6, 8, 7, 8, 9] },
  { key: "exits", title: "Employee exits", value: "5", delta: -16.7, tooltip: "People who left during the current month.", tint: "bg-pastel-rose", spark: [8, 7, 7, 6, 6, 5] },
];

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export const criticalSnapshot: {
  dept: string; current: number; approved: number; vacancies: number; risk: RiskLevel;
}[] = departments.map((dept) => {
  const variance = dept.actual - dept.approved;
  const gap = Math.abs(variance) / dept.approved;
  const risk: RiskLevel = gap >= 0.2 ? "Critical" : gap >= 0.14 ? "High" : gap >= 0.08 ? "Medium" : "Low";
  return { dept: dept.name, current: dept.actual, approved: dept.approved, vacancies: dept.vacancies, risk };
});

export const todayActivity: { label: string; value: string; percent: string; change: number }[] = [
  { label: "Total employees", value: "248", percent: "100%", change: 0.4 },
  { label: "Employees at work", value: "186", percent: "75%", change: 1.2 },
  { label: "Remote employees", value: "38", percent: "15%", change: -0.6 },
  { label: "On leave", value: "14", percent: "6%", change: 2.1 },
  { label: "Business travel", value: "6", percent: "2%", change: 0.0 },
  { label: "New hires today", value: "2", percent: "0.8%", change: 100 },
  { label: "Exits today", value: "1", percent: "0.4%", change: -50 },
  { label: "Internal transfers today", value: "3", percent: "1.2%", change: 50 },
];

export type Skill = {
  name: string; employees: number; growth: number; demand: number;
};

export const skills: Skill[] = [
  { name: "Python", employees: 78, growth: 14, demand: 92 },
  { name: "Java", employees: 54, growth: 4, demand: 61 },
  { name: "React", employees: 62, growth: 18, demand: 88 },
  { name: "AWS", employees: 49, growth: 22, demand: 94 },
  { name: "Azure", employees: 31, growth: 16, demand: 71 },
  { name: "Docker", employees: 44, growth: 11, demand: 76 },
  { name: "Kubernetes", employees: 27, growth: 26, demand: 90 },
  { name: "Data Engineering", employees: 35, growth: 24, demand: 86 },
  { name: "Cyber Security", employees: 22, growth: 29, demand: 96 },
  { name: "Project Management", employees: 58, growth: 6, demand: 64 },
  { name: "Leadership", employees: 41, growth: 8, demand: 69 },
  { name: "Communication", employees: 96, growth: 3, demand: 58 },
];

export const aiInsights: { title: string; body: string; tint: string }[] = [
  { title: "Understaffed departments", body: "Engineering and IT are running 20%+ below approved staffing, which is slowing delivery commitments.", tint: "bg-pastel-peach" },
  { title: "Long open vacancies", body: "12 vacancies have been open past 90 days — mostly senior Engineering and Cyber Security roles.", tint: "bg-pastel-yellow" },
  { title: "Budget pressure", body: "Engineering (96%) and IT (93%) are close to their full workforce budget for the year.", tint: "bg-pastel-rose" },
  { title: "Promotion opportunities", body: "9 people with 3+ years tenure and strong reviews are ready for a step up before you hire externally.", tint: "bg-pastel-mint" },
  { title: "Hiring recommendations", body: "Prioritise Engineering, IT and Customer Support — they hold 55% of all funded vacancies.", tint: "bg-pastel-sky" },
];

export const suggestedActions = [
  "Prioritise Engineering hiring",
  "Close long-standing vacancies",
  "Redistribute workforce",
  "Reallocate hiring budget",
  "Increase internship intake",
  "Review department staffing plans",
];
