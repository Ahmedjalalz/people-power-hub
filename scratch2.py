import re

with open("src/components/HeadcountPanel.tsx", "r") as f:
    code = f.read()

# Movement Trend
code = code.replace(
    "const data = movementTrend.slice(-window);",
    "const data = movementTrendData.data?.records?.map((r: any) => ({ month: r.month, joiners: r.joiner_count, leavers: r.leaver_count, promotions: r.promotion_count, transfers: r.transfer_count })) ?? movementTrend.slice(-window);"
)

# Headcount Trend
code = code.replace(
    "const data = headcountTrend.slice(-window);",
    "const data = headcountTrendData.data?.records?.map((r: any) => ({ month: r.snapshot_month, people: r.actual_employee_count })) ?? headcountTrend.slice(-window);"
)

# Job levels
job_level_replacement = """
  const levels = useMemo(
    () => {
      if (jobLevelData.data?.records) {
        return jobLevelData.data.records.map((r: any) => ({
          level: r.job_level,
          count: r.actual_employee_count,
          color: jobLevelMix.find(l => l.level === r.job_level)?.color || "var(--primary)"
        }));
      }
      return jobLevelMix
        .filter((row) => applied.jobLevel === "All" || row.level === applied.jobLevel)
        .map((row) => ({ ...row, count: Math.max(1, Math.round(row.count * scale)) }));
    },
    [applied.jobLevel, scale, jobLevelData.data],
  );
"""
# Replace original `const levels = useMemo(...)` block
# It's multiline so we use regex
code = re.sub(r'const levels = useMemo\([\s\S]*?\[applied\.jobLevel, scale\],\s*\);', job_level_replacement.strip(), code)

# Vacancy Ageing bucketing
vacancy_ageing_replacement = """
  const vacancyAgeingMapped = useMemo(() => {
    if (!vacancyAgeingData.data?.records) return vacancyAgeing;
    const counts = { "0-30": 0, "31-60": 0, "61-90": 0, "91-180": 0, "181+": 0 };
    for (const r of vacancyAgeingData.data.records) {
      const days = r.vacancy_age_in_days || 0;
      if (days <= 30) counts["0-30"]++;
      else if (days <= 60) counts["31-60"]++;
      else if (days <= 90) counts["61-90"]++;
      else if (days <= 180) counts["91-180"]++;
      else counts["181+"]++;
    }
    return vacancyAgeing.map(b => ({
      ...b,
      count: counts[b.bucket as keyof typeof counts] || b.count
    }));
  }, [vacancyAgeingData.data]);
"""
code = code.replace('const isFiltered = JSON.stringify(applied) !== JSON.stringify(emptyFilters);', 'const isFiltered = JSON.stringify(applied) !== JSON.stringify(emptyFilters);\n' + vacancy_ageing_replacement)

# Use vacancyAgeingMapped in DonutCard
code = code.replace(
    "data={vacancyAgeing.map((row) => ({ label: row.bucket, value: row.count, color: row.color }))}",
    "data={vacancyAgeingMapped.map((row) => ({ label: row.bucket, value: row.count, color: row.color }))}"
)
code = code.replace(
    "footer={`${vacancyAgeing.reduce((sum, row) => sum + row.count, 0)} open vacancies`}",
    "footer={`${vacancyAgeingMapped.reduce((sum, row) => sum + row.count, 0)} open vacancies`}"
)

# Budget Utilization
budget_replacement = """        {filteredDepartments.map((dept) => {
          const apiUtil = budgetUtilData.data?.records?.find((r: any) => r.department === dept.name)?.budget_utilization_percentage;
          const utilization = apiUtil !== undefined ? apiUtil : dept.utilization;
          const tone = utilization >= 95 ? "bg-rose-400" : utilization >= 90 ? "bg-orange-400" : utilization >= 80 ? "bg-amber-400" : "bg-emerald-400";
          const status = utilization >= 95 ? "Critical" : utilization >= 90 ? "High usage" : utilization >= 80 ? "Needs attention" : "Healthy";
          return (
            <div key={dept.name} className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[10rem_1fr_4rem_5rem_7rem]">
              <span className="truncate text-sm">{dept.name}</span>
              <div className="col-span-2 h-2 overflow-hidden rounded-full bg-foreground/5 sm:col-span-1">
                <div className={cn("h-full rounded-full", tone)} style={{ width: `${utilization}%` }} />
              </div>
              <span className="hidden text-right text-sm sm:block">{utilization}%</span>
              <span className={cn("hidden text-right text-xs sm:block", dept.utilizationDelta >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500")}>
                {dept.utilizationDelta >= 0 ? "+" : ""}{dept.utilizationDelta}%
              </span>
              <span className="hidden justify-self-end rounded-full bg-muted px-2 py-0.5 text-[11px] sm:block">{status}</span>
            </div>
          );
        })}"""

code = re.sub(r'\{filteredDepartments\.map\(\(dept\) => \{[\s\S]*?return \([\s\S]*?\);\n\s*\}\)\}', budget_replacement.strip(), code)

# Critical Snapshot
critical_replacement = """            {(criticalSnapData.data?.records?.map((r: any) => ({
              dept: r.department,
              current: r.actual_employee_count,
              approved: r.approved_position_count,
              vacancies: r.vacant_approved_position_count,
              risk: r.vacancy_rate_percentage > 18 ? "Critical" : r.vacancy_rate_percentage > 15 ? "High" : r.vacancy_rate_percentage > 10 ? "Medium" : "Low"
            })) || criticalSnapshot)
              .filter((row: any) => filteredDepartments.some((dept) => dept.name === row.dept))
              .map((row: any) => (
                <tr key={row.dept} className={cn("border-t", row.risk === "Critical" && "bg-pastel-peach/25")}>
                  <td className="px-4 py-2.5">{row.dept}</td>
                  <td className="px-4 py-2.5">{row.current}</td>
                  <td className="px-4 py-2.5">{row.approved}</td>
                  <td className="px-4 py-2.5">{row.current - row.approved}</td>
                  <td className="px-4 py-2.5 font-medium">
                    {row.current > row.approved ? (
                      <span className="text-pastel-rose">Overstaffed</span>
                    ) : row.current < row.approved ? (
                      <span className="text-pastel-peach">Understaffed</span>
                    ) : (
                      <span className="text-pastel-mint">Balanced</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">{row.vacancies}</td>
                  <td className="px-4 py-2.5"><RiskBadge level={row.risk} /></td>
                </tr>
              ))}"""
code = re.sub(r'\{criticalSnapshot[\s\S]*?\.map\(\(row\) => \([\s\S]*?\n\s*\}\)\}', critical_replacement.strip(), code)


# Today Activity
activity_replacement = """      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {todayActivity.map((item) => {
          const apiVal = activityData.data?.metrics?.find(m => m.metric_name === (
            item.label === "Total employees" ? "actual_employee_count" :
            item.label === "Employees at work" ? "employees_available_for_work" :
            item.label === "On leave" ? "employees_on_approved_leave" :
            item.label === "Absent" ? "employees_absent" :
            item.label === "Overtime (hrs)" ? "total_overtime_hours" :
            item.label === "Open positions" ? "daily_open_position_count" :
            item.label === "Critical openings" ? "daily_critical_open_position_count" : item.label
          ));
          return (
          <div key={item.label} className="rounded-2xl border bg-card p-3">
            <div className="text-[11px] text-muted-foreground">{item.label}</div>
            <div className="text-xl font-semibold tracking-tight">{apiVal ? apiVal.value : item.value}</div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{item.percent}</span>
              <span className={item.change >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"}>
                {item.change >= 0 ? "+" : ""}{item.change}% vs yesterday
              </span>
            </div>
          </div>
        )})}
      </div>"""
code = re.sub(r'<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">[\s\S]*?\{todayActivity\.map\(\(item\) => \([\s\S]*?\n\s*\)\)\} \n      </div>', activity_replacement.strip(), code)


with open("src/components/HeadcountPanel.tsx", "w") as f:
    f.write(code)

print("Modified remaining parts")
