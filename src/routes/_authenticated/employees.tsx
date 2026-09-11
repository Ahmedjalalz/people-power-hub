import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Users,
  Search,
  Building2,
  Briefcase,
  ArrowRight,
  ShieldAlert,
  Laptop,
  CheckCircle2,
  Clock,
  Filter,
  X,
  Layers,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { employees as localEmployees, initials, type Employee } from "@/lib/employees";
import { getPeopleAtRisk, getDepartmentRisk, type AtRiskEmployee } from "@/services/attrition";
import { getHeadcountByDepartment } from "@/services/headcount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({
    meta: [
      { title: "Employees Directory — PeopleLens" },
      {
        name: "description",
        content: "Browse and filter employees across all departments in PeopleLens.",
      },
      { property: "og:title", content: "Employees Directory — PeopleLens" },
      {
        property: "og:description",
        content: "Browse and filter employees across all departments in PeopleLens.",
      },
    ],
  }),
  component: EmployeesPage,
});

interface UnifiedEmployee {
  id: string;
  name: string;
  department: string;
  positionTitle: string;
  designation?: string;
  jobLevel?: string;
  workMode?: "On-site" | "Hybrid" | "Remote" | string;
  employeeStatus?: string;
  yearsInCompany?: number;
  riskScore?: number;
  positionCriticality?: string;
}

function EmployeesPage() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Endpoints: Live people-at-risk, department risk, and headcount
  const peopleRiskQuery = useQuery({
    queryKey: ["attrition", "people-at-risk"],
    queryFn: () => getPeopleAtRisk(200),
  });

  const departmentRiskQuery = useQuery({
    queryKey: ["attrition", "department-risk"],
    queryFn: getDepartmentRisk,
  });

  const headcountDeptQuery = useQuery({
    queryKey: ["headcount", "dept"],
    queryFn: () => getHeadcountByDepartment(),
  });

  // Combine and deduplicate employees from local mock + live API
  const allEmployees: UnifiedEmployee[] = useMemo(() => {
    const map = new Map<string, UnifiedEmployee>();

    // 1. Base local employees
    for (const emp of localEmployees) {
      map.set(emp.id.toLowerCase(), {
        id: emp.id,
        name: emp.name,
        department: emp.department,
        positionTitle: emp.positionTitle,
        designation: emp.designation,
        jobLevel: emp.jobLevel,
        workMode: emp.workMode,
        employeeStatus: emp.employeeStatus,
        yearsInCompany: emp.yearsInCompany,
        riskScore: emp.riskScore,
        positionCriticality: emp.positionCriticality,
      });
    }

    // 2. Incorporate any live employees from people-at-risk endpoint
    if (peopleRiskQuery.data?.employees) {
      for (const apiEmp of peopleRiskQuery.data.employees) {
        const key = apiEmp.employee_id.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.riskScore = apiEmp.risk_score_percent;
          if (apiEmp.position_criticality) existing.positionCriticality = apiEmp.position_criticality;
          if (apiEmp.position_title) existing.positionTitle = apiEmp.position_title;
          if (apiEmp.department) existing.department = apiEmp.department;
        } else {
          map.set(key, {
            id: apiEmp.employee_id,
            name: apiEmp.employee_name,
            department: apiEmp.department,
            positionTitle: apiEmp.position_title || apiEmp.designation || "Staff",
            designation: apiEmp.designation,
            jobLevel: apiEmp.job_level,
            workMode: "On-site",
            employeeStatus: "Active",
            yearsInCompany: undefined,
            riskScore: apiEmp.risk_score_percent,
            positionCriticality: apiEmp.position_criticality,
          });
        }
      }
    }

    return Array.from(map.values());
  }, [peopleRiskQuery.data]);

  // Compute all available departments with employee counts
  const departmentsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Count employees per department
    for (const emp of allEmployees) {
      const dept = emp.department?.trim();
      if (dept) {
        counts[dept] = (counts[dept] || 0) + 1;
      }
    }

    // Also ensure departments from API are included even if zero in sample
    if (departmentRiskQuery.data?.departments) {
      for (const d of departmentRiskQuery.data.departments) {
        if (!(d.department in counts)) {
          counts[d.department] = d.total_employees || 0;
        }
      }
    }

    if (headcountDeptQuery.data?.records) {
      for (const r of headcountDeptQuery.data.records) {
        if (r.department && !(r.department in counts)) {
          counts[r.department] = r.actual_employee_count || 0;
        }
      }
    }

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [allEmployees, departmentRiskQuery.data, headcountDeptQuery.data]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    let result = allEmployees;

    if (selectedDepartment) {
      result = result.filter(
        (emp) => emp.department.toLowerCase() === selectedDepartment.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (emp) =>
          emp.name.toLowerCase().includes(q) ||
          emp.positionTitle.toLowerCase().includes(q) ||
          emp.department.toLowerCase().includes(q) ||
          emp.id.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allEmployees, selectedDepartment, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
            <Users className="h-3.5 w-3.5" />
            <span>Staff Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Employees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter by department to explore personnel, positions, and profile details.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 font-medium shadow-xs">
            Total Staff: <strong className="text-foreground">{allEmployees.length}</strong>
          </span>
          <span className="rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 font-medium shadow-xs">
            Departments: <strong className="text-foreground">{departmentsWithCounts.length}</strong>
          </span>
        </div>
      </div>

      {/* ── Two-Sided Panel Layout ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── SIDE 1: Departments Filter ── */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 self-stretch flex flex-col">
          <div className="sticky top-20 flex flex-col h-[calc(100vh-11rem)] min-h-[500px] rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md p-4 sm:p-5 shadow-xs">
            {/* Department Panel Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border/80">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm text-foreground">Departments</span>
              </div>
              <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {departmentsWithCounts.length}
              </span>
            </div>

            {/* "All Departments" Button */}
            <div className="pt-3 pb-2">
              <button
                type="button"
                onClick={() => setSelectedDepartment(null)}
                className={cn(
                  "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all text-left cursor-pointer",
                  selectedDepartment === null
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4" />
                  <span>All Departments</span>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold transition-colors",
                    selectedDepartment === null
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {allEmployees.length}
                </span>
              </button>
            </div>

            {/* Department List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1 mt-1 scrollbar-thin">
              {departmentsWithCounts.map((dept) => {
                const isSelected = selectedDepartment?.toLowerCase() === dept.name.toLowerCase();
                return (
                  <button
                    key={dept.name}
                    type="button"
                    onClick={() => setSelectedDepartment(dept.name)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all text-left cursor-pointer group",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0 transition-colors",
                          isSelected ? "bg-primary-foreground" : "bg-muted-foreground/30 group-hover:bg-primary/70"
                        )}
                      />
                      <span className="truncate">{dept.name}</span>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ml-2 transition-colors",
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted/80 text-muted-foreground group-hover:bg-muted"
                      )}
                    >
                      {dept.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Department Filter Footer / Reset */}
            {selectedDepartment && (
              <div className="pt-3 border-t border-border/80 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDepartment(null)}
                  className="w-full gap-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear Department Filter</span>
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* ── SIDE 2: Employee Cards Grid ── */}
        <section className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Controls Bar: Search & Status indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md p-3 sm:px-4 shadow-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search employees by name, position, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 rounded-xl border-border/80 bg-background text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {selectedDepartment && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary font-semibold">
                  <span>{selectedDepartment}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDepartment(null)}
                    className="grid h-4 w-4 place-items-center rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                    aria-label="Remove filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <span>
                Showing <strong>{filteredEmployees.length}</strong> of {allEmployees.length}
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No employees found</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                No staff members match the selected department{" "}
                {selectedDepartment ? `"${selectedDepartment}"` : ""} or your search keyword.
              </p>
              <div className="mt-4 flex gap-2">
                {selectedDepartment && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDepartment(null)}
                    className="rounded-xl text-xs"
                  >
                    Reset Department
                  </Button>
                )}
                {searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="rounded-xl text-xs"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEmployees.map((employee) => {
                const avatarInitials = initials(employee.name);

                return (
                  <Link
                    key={employee.id}
                    to="/employee/$employeeId"
                    params={{ employeeId: employee.id }}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl cursor-pointer"
                  >
                    {/* Top Row: Avatar & Metadata Badges */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 font-bold text-primary border border-primary/15 shadow-xs text-sm transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          {avatarInitials}
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <span className="font-mono text-[11px] font-medium text-muted-foreground bg-muted/80 px-2.5 py-0.5 rounded-full border border-border/50">
                            {employee.id}
                          </span>

                          {employee.riskScore !== undefined && employee.riskScore >= 70 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <ShieldAlert className="h-3 w-3" />
                              <span>At Risk</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Name (MAIN THING CLEARLY VISIBLE) */}
                      <div className="mt-3.5">
                        <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug">
                          {employee.name}
                        </h3>

                        {/* Second Most Important: Position & Department */}
                        <div className="mt-1">
                          <p className="text-xs font-medium text-muted-foreground leading-snug">
                            {employee.positionTitle}
                          </p>

                          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary">
                            <Building2 className="h-3 w-3" />
                            <span>{employee.department}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Additional attributes & View profile arrow */}
                    <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2.5">
                        {employee.workMode && (
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <Laptop className="h-3 w-3 text-muted-foreground/70" />
                            <span>{employee.workMode}</span>
                          </span>
                        )}

                        {employee.yearsInCompany !== undefined && (
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <Clock className="h-3 w-3 text-muted-foreground/70" />
                            <span>{employee.yearsInCompany} yrs</span>
                          </span>
                        )}
                      </div>

                      <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
