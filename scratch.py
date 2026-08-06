import re

with open("src/components/HeadcountPanel.tsx", "r") as f:
    code = f.read()

# Add imports
imports = """import { useQuery } from "@tanstack/react-query";
import {
  getHeadcountKPIs,
  getHeadcountByDepartment,
  getHeadcountTrend,
  getMovementTrend,
  getCompositionByJobLevel,
  getVacancyAgeing,
  getBudgetUtilization,
  getCriticalSnapshot,
  getWorkforceActivity
} from "@/services/headcount";
"""
code = code.replace('import { Link } from "@tanstack/react-router";', 'import { Link } from "@tanstack/react-router";\n' + imports)

# In HeadcountPanel:
hooks = """
  const headcountKPIs = useQuery({ queryKey: ["hc", "kpis"], queryFn: getHeadcountKPIs });
  const headcountDept = useQuery({ queryKey: ["hc", "dept"], queryFn: getHeadcountByDepartment });
  const headcountTrendData = useQuery({ queryKey: ["hc", "trend"], queryFn: getHeadcountTrend });
  const movementTrendData = useQuery({ queryKey: ["hc", "movement"], queryFn: getMovementTrend });
  const jobLevelData = useQuery({ queryKey: ["hc", "levels"], queryFn: getCompositionByJobLevel });
  const vacancyAgeingData = useQuery({ queryKey: ["hc", "ageing"], queryFn: getVacancyAgeing });
  const budgetUtilData = useQuery({ queryKey: ["hc", "budget"], queryFn: getBudgetUtilization });
  const criticalSnapData = useQuery({ queryKey: ["hc", "critical"], queryFn: getCriticalSnapshot });
  const activityData = useQuery({ queryKey: ["hc", "activity"], queryFn: getWorkforceActivity });

"""
code = code.replace('const [draft, setDraft] = useState<Filters>(emptyFilters);', hooks + '  const [draft, setDraft] = useState<Filters>(emptyFilters);')

# Replace kpis mapping
kpi_replacement = """        {kpis.map((kpi) => {
          const apiMetric = headcountKPIs.data?.metrics?.find(m => m.metric_name === (
            kpi.key === "actual" ? "actual_employee_count" :
            kpi.key === "approved" ? "approved_position_count" :
            kpi.key === "budgeted" ? "budgeted_position_count" :
            kpi.key === "vacant" ? "vacant_approved_position_count" :
            kpi.key === "vacancyRate" ? "vacancy_rate_percentage" :
            kpi.key === "budgetUse" ? "budget_utilization_percentage" :
            kpi.key === "availability" ? "workforce_availability_percentage" :
            kpi.key
          ));
          const Icon = kpiIcons[kpi.key] ?? Users2;
          const value = apiMetric ? String(apiMetric.value) : (isFiltered && kpi.key === "actual" ? String(totalActual) : isFiltered && kpi.key === "approved" ? String(totalApproved) : isFiltered && kpi.key === "vacant" ? String(totalVacancies) : kpi.value);
"""
code = code.replace('        {kpis.map((kpi) => {\n          const Icon = kpiIcons[kpi.key] ?? Users2;\n          const value = isFiltered && kpi.key === "actual" ? String(totalActual) : isFiltered && kpi.key === "approved" ? String(totalApproved) : isFiltered && kpi.key === "vacant" ? String(totalVacancies) : kpi.value;', kpi_replacement)

# Replace DeptComparison rows
dept_comp = """      <DeptComparison rows={headcountDept.data?.records?.map(r => ({ name: r.department, approved: r.approved_position_count, budgeted: r.budgeted_position_count, actual: r.actual_employee_count })) ?? filteredDepartments} />"""
code = code.replace('<DeptComparison rows={filteredDepartments} />', dept_comp)


with open("src/components/HeadcountPanel.tsx", "w") as f:
    f.write(code)

print("Modified HeadcountPanel.tsx")
