export type Criticality = "Low" | "Medium" | "High";

export type Replacement = {
  id: string;
  name: string;
  reason: string;
};

export type Employee = {
  id: string;
  name: string;
  department: string;
  positionId: string;
  positionTitle: string;
  designation: string;
  jobLevel: string;
  workMode: "On-site" | "Hybrid" | "Remote";
  shiftType: "Day" | "Night" | "Rotational";
  employmentType: "Permanent" | "Contract" | "Part-time";
  employeeStatus: "Active" | "On Leave" | "Notice Period";
  tenureMonths: number;
  yearsInCompany: number;
  engagementScore: number;
  managerRelationshipScore: number;
  candidateBaseEligibility: "Eligible" | "Conditional" | "Not eligible";
  internalMobilityReadiness: "Ready now" | "Developing" | "Not ready";
  attritionLabel: "High risk" | "Medium risk" | "Low risk" | "Stable";
  reference: string;
  vacancyPlanningStatus: "Backfill approved" | "Planning in progress" | "Not planned";
  positionCriticality: Criticality;
  /** Attrition model score (0–100). Present for people flagged by the model. */
  riskScore?: number;
  riskSummary?: string;
  timeframe?: string;
  signals?: string[];
  replacements?: Replacement[];
};

export const employees: Employee[] = [
  {
    id: "E1042",
    name: "Usman Ali",
    department: "Operations",
    positionId: "P-2201",
    positionTitle: "Senior Operations Analyst",
    designation: "Senior Analyst",
    jobLevel: "L5",
    workMode: "On-site",
    shiftType: "Day",
    employmentType: "Permanent",
    employeeStatus: "Active",
    tenureMonths: 106,
    yearsInCompany: 8.8,
    engagementScore: 41,
    managerRelationshipScore: 52,
    candidateBaseEligibility: "Eligible",
    internalMobilityReadiness: "Ready now",
    attritionLabel: "High risk",
    reference: "Internal referral — Ops restructure 2017",
    vacancyPlanningStatus: "Planning in progress",
    positionCriticality: "High",
    riskScore: 82,
    riskSummary: "Pension window closing, missed promotion, long commute",
    timeframe: "60–90 days",
    signals: [
      "Eligible for pension in under 6 months, with no confirmed intent to extend.",
      "Two consecutive promotion cycles passed over despite strong reviews.",
      "Posted 400km from family residence with no pending transfer approved.",
    ],
    replacements: [
      { id: "E1108", name: "Hina Yousaf", reason: "Already covers his reporting pack during leave and knows the Ops dashboards end to end." },
      { id: "E1121", name: "Zain Abbas", reason: "Rated 'ready now' for L5 mobility and has 3 years in the same process area." },
      { id: "E1133", name: "Maryam Iqbal", reason: "Strong analytics scores and based in the same city, so no relocation needed." },
    ],
  },
  {
    id: "E1057",
    name: "Sarah Malik",
    department: "Product",
    positionId: "P-3310",
    positionTitle: "Product Manager, Payments",
    designation: "Product Manager",
    jobLevel: "L4",
    workMode: "Hybrid",
    shiftType: "Day",
    employmentType: "Permanent",
    employeeStatus: "Active",
    tenureMonths: 34,
    yearsInCompany: 2.8,
    engagementScore: 48,
    managerRelationshipScore: 61,
    candidateBaseEligibility: "Eligible",
    internalMobilityReadiness: "Ready now",
    attritionLabel: "High risk",
    reference: "Campus hire 2023 cohort",
    vacancyPlanningStatus: "Backfill approved",
    positionCriticality: "High",
    riskScore: 76,
    riskSummary: "Passed over for promotion, external offer signals",
    timeframe: "30–60 days",
    signals: [
      "Promotion case deferred twice while peers at the same level moved up.",
      "Compensation sits 12% below market band for Payments PMs.",
      "Sharp drop in optional meeting attendance over the last two months.",
    ],
    replacements: [
      { id: "E1145", name: "Ali Hamza", reason: "Led the Payments discovery track and already partners with the same engineering pod." },
      { id: "E1108", name: "Hina Yousaf", reason: "Deep data background that fits the payments metrics ownership of the role." },
      { id: "E1160", name: "Noor Fatima", reason: "Associate PM rated ready for step-up with an existing merchant relationship." },
    ],
  },
  {
    id: "E1063",
    name: "Ahmed Raza",
    department: "Engineering",
    positionId: "P-1180",
    positionTitle: "Field Engineer II",
    designation: "Field Engineer",
    jobLevel: "L3",
    workMode: "On-site",
    shiftType: "Rotational",
    employmentType: "Permanent",
    employeeStatus: "Active",
    tenureMonths: 27,
    yearsInCompany: 2.3,
    engagementScore: 44,
    managerRelationshipScore: 47,
    candidateBaseEligibility: "Conditional",
    internalMobilityReadiness: "Developing",
    attritionLabel: "High risk",
    reference: "Agency hire — TechStaff",
    vacancyPlanningStatus: "Planning in progress",
    positionCriticality: "Medium",
    riskScore: 71,
    riskSummary: "Long commute, low engagement scores",
    timeframe: "60–90 days",
    signals: [
      "Average one-way commute of 90 minutes on rotational shifts.",
      "Engagement score fell 18 points after the shift roster change.",
      "No development conversation logged in the last two quarters.",
    ],
    replacements: [
      { id: "E1121", name: "Zain Abbas", reason: "Certified on the same field equipment and lives inside the service zone." },
      { id: "E1174", name: "Danish Tariq", reason: "Completed the field-readiness programme and shadowed this route for 6 months." },
      { id: "E1133", name: "Maryam Iqbal", reason: "Can absorb the diagnostics half of the role while a full backfill is hired." },
    ],
  },
  {
    id: "E1071",
    name: "Fatima Khan",
    department: "Operations",
    positionId: "P-2240",
    positionTitle: "Operations Team Lead",
    designation: "Ops Lead",
    jobLevel: "L4",
    workMode: "Hybrid",
    shiftType: "Day",
    employmentType: "Permanent",
    employeeStatus: "Active",
    tenureMonths: 52,
    yearsInCompany: 4.3,
    engagementScore: 55,
    managerRelationshipScore: 66,
    candidateBaseEligibility: "Eligible",
    internalMobilityReadiness: "Ready now",
    attritionLabel: "Medium risk",
    reference: "Internal promotion 2022",
    vacancyPlanningStatus: "Not planned",
    positionCriticality: "High",
    riskScore: 68,
    riskSummary: "Compensation gap vs. market, reduced overtime",
    timeframe: "90+ days",
    signals: [
      "Base pay 9% under the market band for team leads in Operations.",
      "Voluntary overtime dropped to near zero over three months.",
      "Requested a formal review of her career path in the last cycle.",
    ],
    replacements: [
      { id: "E1108", name: "Hina Yousaf", reason: "Acting lead during her last leave with no service dips reported." },
      { id: "E1174", name: "Danish Tariq", reason: "Knows the escalation process and is rated ready for a first leadership role." },
      { id: "E1160", name: "Noor Fatima", reason: "Strong stakeholder scores and already runs the weekly Ops review." },
    ],
  },
  {
    id: "E1085",
    name: "Bilal Sheikh",
    department: "Support",
    positionId: "P-4102",
    positionTitle: "Data Analyst, Support Insights",
    designation: "Data Analyst",
    jobLevel: "L3",
    workMode: "Remote",
    shiftType: "Day",
    employmentType: "Permanent",
    employeeStatus: "Active",
    tenureMonths: 19,
    yearsInCompany: 1.6,
    engagementScore: 58,
    managerRelationshipScore: 43,
    candidateBaseEligibility: "Conditional",
    internalMobilityReadiness: "Developing",
    attritionLabel: "Medium risk",
    reference: "Referred by Sarah Malik",
    vacancyPlanningStatus: "Not planned",
    positionCriticality: "Medium",
    riskScore: 64,
    riskSummary: "New manager, drop in 1:1 frequency",
    timeframe: "90+ days",
    signals: [
      "Manager changed twice in 12 months.",
      "1:1 frequency dropped from weekly to roughly monthly.",
      "Manager relationship score is the lowest in his team.",
    ],
    replacements: [
      { id: "E1133", name: "Maryam Iqbal", reason: "Built the current support dashboards and can pick up reporting immediately." },
      { id: "E1145", name: "Ali Hamza", reason: "Familiar with the data model from the Payments analytics work." },
      { id: "E1174", name: "Danish Tariq", reason: "Junior analyst ready for a step-up with light mentoring." },
    ],
  },
  {
    id: "E1108",
    name: "Hina Yousaf",
    department: "Operations",
    positionId: "P-2215",
    positionTitle: "Operations Analyst",
    designation: "Analyst",
    jobLevel: "L4",
    workMode: "Hybrid",
    shiftType: "Day",
    employmentType: "Permanent",
    employeeStatus: "Active",
    tenureMonths: 61,
    yearsInCompany: 5.1,
    engagementScore: 82,
    managerRelationshipScore: 88,
    candidateBaseEligibility: "Eligible",
    internalMobilityReadiness: "Ready now",
    attritionLabel: "Stable",
    reference: "Internal transfer from Support",
    vacancyPlanningStatus: "Not planned",
    positionCriticality: "Medium",
  },
  {
    id: "E1121",
    name: "Zain Abbas",
    department: "Engineering",
    positionId: "P-1165",
    positionTitle: "Field Engineer III",
    designation: "Senior Field Engineer",
    jobLevel: "L4",
    workMode: "On-site",
    shiftType: "Rotational",
    employmentType: "Permanent",
    employeeStatus: "Active",
    tenureMonths: 74,
    yearsInCompany: 6.2,
    engagementScore: 79,
    managerRelationshipScore: 81,
    candidateBaseEligibility: "Eligible",
    internalMobilityReadiness: "Ready now",
    attritionLabel: "Low risk",
    reference: "Internal referral 2020",
    vacancyPlanningStatus: "Not planned",
    positionCriticality: "High",
  },
  {
    id: "E1133",
    name: "Maryam Iqbal",
    department: "Support",
    positionId: "P-4120",
    positionTitle: "Insights Analyst",
    designation: "Analyst",
    jobLevel: "L3",
    workMode: "Remote",
    shiftType: "Day",
    employmentType: "Permanent",
    employeeStatus: "Active",
    tenureMonths: 40,
    yearsInCompany: 3.3,
    engagementScore: 84,
    managerRelationshipScore: 80,
    candidateBaseEligibility: "Eligible",
    internalMobilityReadiness: "Developing",
    attritionLabel: "Stable",
    reference: "Campus hire 2022 cohort",
    vacancyPlanningStatus: "Not planned",
    positionCriticality: "Medium",
  },
  {
    id: "E1145",
    name: "Ali Hamza",
    department: "Product",
    positionId: "P-3325",
    positionTitle: "Associate Product Manager",
    designation: "Associate PM",
    jobLevel: "L3",
    workMode: "Hybrid",
    shiftType: "Day",
    employmentType: "Permanent",
    employeeStatus: "Active",
    tenureMonths: 29,
    yearsInCompany: 2.4,
    engagementScore: 77,
    managerRelationshipScore: 84,
    candidateBaseEligibility: "Eligible",
    internalMobilityReadiness: "Ready now",
    attritionLabel: "Low risk",
    reference: "Referred by Ahmed Raza",
    vacancyPlanningStatus: "Not planned",
    positionCriticality: "Medium",
  },
  {
    id: "E1160",
    name: "Noor Fatima",
    department: "Operations",
    positionId: "P-2260",
    positionTitle: "Operations Coordinator",
    designation: "Coordinator",
    jobLevel: "L3",
    workMode: "On-site",
    shiftType: "Day",
    employmentType: "Permanent",
    employeeStatus: "Active",
    tenureMonths: 22,
    yearsInCompany: 1.8,
    engagementScore: 74,
    managerRelationshipScore: 76,
    candidateBaseEligibility: "Conditional",
    internalMobilityReadiness: "Developing",
    attritionLabel: "Low risk",
    reference: "Agency hire — PeopleFirst",
    vacancyPlanningStatus: "Not planned",
    positionCriticality: "Low",
  },
  {
    id: "E1174",
    name: "Danish Tariq",
    department: "Engineering",
    positionId: "P-1190",
    positionTitle: "Field Engineer I",
    designation: "Field Engineer",
    jobLevel: "L2",
    workMode: "On-site",
    shiftType: "Rotational",
    employmentType: "Contract",
    employeeStatus: "Active",
    tenureMonths: 14,
    yearsInCompany: 1.2,
    engagementScore: 71,
    managerRelationshipScore: 72,
    candidateBaseEligibility: "Conditional",
    internalMobilityReadiness: "Developing",
    attritionLabel: "Low risk",
    reference: "Apprenticeship programme",
    vacancyPlanningStatus: "Not planned",
    positionCriticality: "Low",
  },
];

export const employeeById = (id: string): Employee | undefined =>
  employees.find((employee) => employee.id.toLowerCase() === id.toLowerCase());

export const employeeByName = (name: string): Employee | undefined =>
  employees.find((employee) => employee.name.toLowerCase() === name.trim().toLowerCase());

export const atRiskEmployees = (): Employee[] =>
  employees
    .filter((employee) => typeof employee.riskScore === "number")
    .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));

export const initials = (name: string): string =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const riskTone = (score: number): string =>
  score >= 75 ? "bg-rose-400" : score >= 65 ? "bg-amber-400" : "bg-emerald-400";

export const criticalityTint = (level: Criticality): string =>
  level === "High" ? "bg-pastel-peach" : level === "Medium" ? "bg-pastel-yellow" : "bg-pastel-mint";
