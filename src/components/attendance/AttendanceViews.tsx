import React, { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Filter,
  Download,
  Plus,
  MapPin,
  Laptop,
  Building2,
  CalendarDays,
  ShieldCheck,
  Lock,
  Check,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Trash2,
  Palmtree,
  Scale,
  SlidersHorizontal,
  TrendingUp,
  AlertTriangle,
  FileCheck2,
  LogIn,
  LogOut,
  Sliders,
  Settings,
  ArrowRight,
  Timer,
  Coffee,
  Play,
  UserCheck,
  UserX,
  Hourglass,
  Plane,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  Info,
  Send,
  ExternalLink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employees } from "@/lib/employees";
import { cn } from "@/lib/utils";

// ==========================================
// 1. ATTENDANCE DASHBOARD VIEW
// ==========================================
// ==========================================
// 1. ATTENDANCE DASHBOARD VIEW (Exact Spec from Screenshot)
// ==========================================
interface DepartmentAttendanceRow {
  department: string;
  total: number;
  p: number; // Present
  l: number; // Late
  eo: number; // Early Out
  hd: number; // Half Day
  a: number; // Absent
  lwp: number; // Leave Without Pay
  lv: number; // Leave
  od: number; // On Duty
  h: number; // Holiday
  wo: number; // Weekly Off
}

export function AttendanceDashboardView() {
  const [selectedDate, setSelectedDate] = useState<string>("2026-09-08");
  const [activeDateTab, setActiveDateTab] = useState<"today" | "pick">("today");
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Departments & headcounts directly from screenshot sample
  const unprocessedDepartments: DepartmentAttendanceRow[] = useMemo(
    () => [
      { department: "Customer Success", total: 285, p: 0, l: 0, eo: 0, hd: 0, a: 285, lwp: 0, lv: 0, od: 0, h: 0, wo: 0 },
      { department: "Engineering", total: 296, p: 0, l: 0, eo: 0, hd: 0, a: 296, lwp: 0, lv: 0, od: 0, h: 0, wo: 0 },
      { department: "Executive", total: 269, p: 0, l: 0, eo: 0, hd: 0, a: 269, lwp: 0, lv: 0, od: 0, h: 0, wo: 0 },
      { department: "Finance", total: 260, p: 0, l: 0, eo: 0, hd: 0, a: 260, lwp: 0, lv: 0, od: 0, h: 0, wo: 0 },
      { department: "Human Resources", total: 277, p: 0, l: 0, eo: 0, hd: 0, a: 277, lwp: 0, lv: 0, od: 0, h: 0, wo: 0 },
      { department: "Marketing", total: 230, p: 0, l: 0, eo: 0, hd: 0, a: 230, lwp: 0, lv: 0, od: 0, h: 0, wo: 0 },
      { department: "Operations", total: 271, p: 0, l: 0, eo: 0, hd: 0, a: 271, lwp: 0, lv: 0, od: 0, h: 0, wo: 0 },
      { department: "Product", total: 287, p: 0, l: 0, eo: 0, hd: 0, a: 287, lwp: 0, lv: 0, od: 0, h: 0, wo: 0 },
      { department: "Sales", total: 278, p: 0, l: 0, eo: 0, hd: 0, a: 278, lwp: 0, lv: 0, od: 0, h: 0, wo: 0 },
    ],
    []
  );

  const processedDepartments: DepartmentAttendanceRow[] = useMemo(
    () => [
      { department: "Customer Success", total: 285, p: 254, l: 12, eo: 4, hd: 5, a: 4, lwp: 1, lv: 8, od: 3, h: 0, wo: 0 },
      { department: "Engineering", total: 296, p: 278, l: 8, eo: 2, hd: 2, a: 2, lwp: 0, lv: 6, od: 2, h: 0, wo: 0 },
      { department: "Executive", total: 269, p: 258, l: 4, eo: 1, hd: 1, a: 1, lwp: 0, lv: 3, od: 4, h: 0, wo: 0 },
      { department: "Finance", total: 260, p: 242, l: 7, eo: 3, hd: 3, a: 2, lwp: 1, lv: 6, od: 1, h: 0, wo: 0 },
      { department: "Human Resources", total: 277, p: 260, l: 6, eo: 2, hd: 2, a: 1, lwp: 0, lv: 8, od: 2, h: 0, wo: 0 },
      { department: "Marketing", total: 230, p: 208, l: 9, eo: 3, hd: 4, a: 2, lwp: 1, lv: 5, od: 2, h: 0, wo: 0 },
      { department: "Operations", total: 271, p: 248, l: 11, eo: 5, hd: 3, a: 3, lwp: 2, lv: 6, od: 1, h: 0, wo: 0 },
      { department: "Product", total: 287, p: 269, l: 7, eo: 2, hd: 2, a: 2, lwp: 0, lv: 7, od: 2, h: 0, wo: 0 },
      { department: "Sales", total: 278, p: 245, l: 14, eo: 6, hd: 4, a: 3, lwp: 1, lv: 7, od: 5, h: 0, wo: 0 },
    ],
    []
  );

  const departments = isProcessed ? processedDepartments : unprocessedDepartments;

  const totalProcessed = useMemo(() => {
    return departments.reduce((sum, d) => sum + d.total, 0);
  }, [departments]);

  const presentCount = useMemo(() => departments.reduce((s, d) => s + d.p, 0), [departments]);
  const absentCount = useMemo(() => departments.reduce((s, d) => s + d.a, 0), [departments]);
  const lateCount = useMemo(() => departments.reduce((s, d) => s + d.l, 0), [departments]);
  const halfDayCount = useMemo(() => departments.reduce((s, d) => s + d.hd, 0), [departments]);
  const leaveCount = useMemo(() => departments.reduce((s, d) => s + d.lv + d.lwp, 0), [departments]);
  const holidayCount = useMemo(() => departments.reduce((s, d) => s + d.h + d.wo, 0), [departments]);

  const presentPct = totalProcessed > 0 ? Math.round((presentCount / totalProcessed) * 100) : 0;
  const absentPct = totalProcessed > 0 ? Math.round((absentCount / totalProcessed) * 100) : 0;
  const latePct = totalProcessed > 0 ? Math.round((lateCount / totalProcessed) * 100) : 0;
  const halfDayPct = totalProcessed > 0 ? Math.round((halfDayCount / totalProcessed) * 100) : 0;
  const leavePct = totalProcessed > 0 ? Math.round((leaveCount / totalProcessed) * 100) : 0;
  const holidayPct = totalProcessed > 0 ? Math.round((holidayCount / totalProcessed) * 100) : 0;

  const handleProcessDay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsProcessed((prev) => !prev);
    }, 600);
  };

  const renderVal = (v: number) => {
    if (v === 0) return <span className="text-muted-foreground/50">—</span>;
    return <span className="font-semibold text-foreground">{v}</span>;
  };

  // Format date as MM/DD/YYYY for input display matching screenshot
  const displayFormattedDate = useMemo(() => {
    try {
      const [year, month, day] = selectedDate.split("-");
      return `${month}/${day}/${year}`;
    } catch {
      return "09/08/2026";
    }
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Attendance
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Daily attendance status across the organisation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleProcessDay}
            disabled={isProcessing}
            className="gap-2 rounded-xl border-border bg-card px-4 text-foreground shadow-2xs hover:bg-muted"
          >
            {isProcessing ? (
              <RotateCw className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>{isProcessed ? "Reset raw state" : "Process day"}</span>
          </Button>

          <Link to="/attendance/$view" params={{ view: "register" }}>
            <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs font-medium px-4">
              <Calendar className="h-4 w-4" />
              <span>Register</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Date & Process Status Controls ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* Date Picker Input */}
          <div className="relative flex items-center">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-2xs">
              <span className="font-medium text-foreground">{displayFormattedDate}</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            {/* Native hidden date input for interactive selection */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  setActiveDateTab("pick");
                }
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
              title="Select date"
            />
          </div>

          {/* Quick Date Pills */}
          <div className="flex items-center rounded-xl border border-border/80 bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => {
                setSelectedDate("2026-09-08");
                setActiveDateTab("today");
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                activeDateTab === "today"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setActiveDateTab("pick")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                activeDateTab === "pick"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pick a day
            </button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground sm:text-sm">
          <span className="font-medium text-foreground">{totalProcessed.toLocaleString()}</span>{" "}
          employee-days processed
        </div>
      </div>

      {/* ── 6 Top Metric Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* 1. Present */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Present</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
            {presentCount.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{presentPct}% of the day</div>
        </div>

        {/* 2. Absent */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Absent</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
            {absentCount.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{absentPct}% of the day</div>
        </div>

        {/* 3. Late */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Late</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
            {lateCount.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{latePct}% of the day</div>
        </div>

        {/* 4. Half day */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Half day</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Hourglass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
            {halfDayCount.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{halfDayPct}% of the day</div>
        </div>

        {/* 5. Leave */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Leave</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-pastel-teal text-primary">
              <Plane className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
            {leaveCount.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{leavePct}% of the day</div>
        </div>

        {/* 6. Off / Holiday */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Off / Holiday</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-pastel-lavender/80 text-foreground">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
            {holidayCount.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{holidayPct}% of the day</div>
        </div>
      </div>

      {/* ── Section: Who is in ── */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-foreground sm:text-lg">Who is in</h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            The day at a glance — present against everybody expected.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {[
            { label: "Present", count: presentCount, pct: presentPct, barColor: "bg-primary" },
            { label: "Absent", count: absentCount, pct: absentPct, barColor: "bg-rose-500/80" },
            { label: "Late", count: lateCount, pct: latePct, barColor: "bg-amber-500/80" },
            { label: "Half day", count: halfDayCount, pct: halfDayPct, barColor: "bg-orange-500/80" },
            { label: "Leave", count: leaveCount, pct: leavePct, barColor: "bg-primary/70" },
            { label: "Off / Holiday", count: holidayCount, pct: holidayPct, barColor: "bg-muted-foreground/60" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 font-medium text-foreground text-xs sm:w-28 sm:text-sm">
                {item.label}
              </span>

              {/* Progress track with rounded pill indicator */}
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-muted/60 dark:bg-muted/40">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    item.barColor
                  )}
                  style={{
                    width: `${Math.max(item.pct, item.count > 0 ? 3 : 0.8)}%`,
                    minWidth: "6px",
                  }}
                />
              </div>

              <span className="w-24 shrink-0 text-right font-semibold text-foreground text-xs sm:w-28 sm:text-sm">
                {item.count.toLocaleString()} people
              </span>

              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground sm:w-14">
                {item.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section: By department ── */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div className="border-b border-border/80 pb-4">
          <h2 className="text-base font-bold text-foreground sm:text-lg">By department</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {selectedDate} · {totalProcessed} processed
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/70 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
              <tr>
                <th className="px-4 py-3 min-w-[180px]">Department</th>
                <th className="px-4 py-3 text-center min-w-[70px]">Total</th>
                <th className="px-3 py-3 text-center min-w-[45px]">P</th>
                <th className="px-3 py-3 text-center min-w-[45px]">L</th>
                <th className="px-3 py-3 text-center min-w-[45px]">EO</th>
                <th className="px-3 py-3 text-center min-w-[45px]">HD</th>
                <th className="px-3 py-3 text-center min-w-[45px]">A</th>
                <th className="px-3 py-3 text-center min-w-[50px]">LWP</th>
                <th className="px-3 py-3 text-center min-w-[45px]">LV</th>
                <th className="px-3 py-3 text-center min-w-[45px]">OD</th>
                <th className="px-3 py-3 text-center min-w-[45px]">H</th>
                <th className="px-3 py-3 text-center min-w-[45px]">WO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {departments.map((row) => (
                <tr key={row.department} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3.5 font-medium text-foreground">
                    {row.department}
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-foreground">
                    {row.total}
                  </td>
                  <td className="px-3 py-3.5 text-center">{renderVal(row.p)}</td>
                  <td className="px-3 py-3.5 text-center">{renderVal(row.l)}</td>
                  <td className="px-3 py-3.5 text-center">{renderVal(row.eo)}</td>
                  <td className="px-3 py-3.5 text-center">{renderVal(row.hd)}</td>
                  <td className="px-3 py-3.5 text-center">{renderVal(row.a)}</td>
                  <td className="px-3 py-3.5 text-center">{renderVal(row.lwp)}</td>
                  <td className="px-3 py-3.5 text-center">{renderVal(row.lv)}</td>
                  <td className="px-3 py-3.5 text-center">{renderVal(row.od)}</td>
                  <td className="px-3 py-3.5 text-center">{renderVal(row.h)}</td>
                  <td className="px-3 py-3.5 text-center">{renderVal(row.wo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. ATTENDANCE REGISTER VIEW (Exact Spec from Screenshot)
// ==========================================
interface MusterEmployee {
  id: string;
  name: string;
  department: string;
  branch?: string;
  company?: string;
}

const defaultMusterEmployees: MusterEmployee[] = [
  { id: "EMP-2642", name: "Ahmed Ahmed", department: "Human Resources", branch: "Headquarters", company: "PeopleLens Global" },
  { id: "EMP-3091", name: "Ahmed Akhtar", department: "Sales", branch: "Headquarters", company: "PeopleLens Global" },
  { id: "EMP-2988", name: "Ahmed Akhtar", department: "Engineering", branch: "Tech Park", company: "PeopleLens Global" },
  { id: "EMP-3320", name: "Ahmed Akhtar", department: "Executive", branch: "Headquarters", company: "PeopleLens Global" },
  { id: "EMP-2449", name: "Ahmed Ali", department: "Product", branch: "Tech Park", company: "PeopleLens Global" },
  { id: "EMP-1029", name: "Ahmed Ansari", department: "Product", branch: "Tech Park", company: "PeopleLens Global" },
  { id: "EMP-1223", name: "Ahmed Ansari", department: "Product", branch: "Tech Park", company: "PeopleLens Global" },
  { id: "EMP-3059", name: "Ahmed Ansari", department: "Marketing", branch: "Headquarters", company: "PeopleLens Global" },
  { id: "EMP-2719", name: "Ahmed Aslam", department: "Customer Success", branch: "Headquarters", company: "PeopleLens Global" },
  { id: "EMP-2810", name: "Sarah Chen", department: "Engineering", branch: "Tech Park", company: "PeopleLens Global" },
  { id: "EMP-1402", name: "Marcus Vance", department: "Marketing", branch: "Headquarters", company: "PeopleLens Global" },
  { id: "EMP-2150", name: "Elena Rostova", department: "Sales", branch: "Headquarters", company: "PeopleLens Global" },
  { id: "EMP-3120", name: "Devon Miles", department: "Operations", branch: "Headquarters", company: "PeopleLens Global" },
  { id: "EMP-1904", name: "David Kim", department: "Finance", branch: "Headquarters", company: "PeopleLens Global" },
  { id: "EMP-2218", name: "Rachel Adams", department: "Human Resources", branch: "Headquarters", company: "PeopleLens Global" },
];

export function AttendanceRegisterView() {
  const [selectedMonth, setSelectedMonth] = useState<number>(7); // 7 = August (0-indexed)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const monthsList = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ];

  // Calculate days in the selected month & year
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Generate day items: day number, weekday, and isSunday
  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const date = new Date(selectedYear, selectedMonth, dayNum);
      const weekdayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const weekday = weekdayNames[date.getDay()];
      const isSunday = weekday === "SUN";
      const isSaturday = weekday === "SAT";
      return { dayNum, weekday, isSunday, isSaturday };
    });
  }, [daysInMonth, selectedYear, selectedMonth]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return defaultMusterEmployees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === "all" || emp.department === selectedDept;
      const matchesBranch = selectedBranch === "all" || emp.branch === selectedBranch;
      const matchesCompany = selectedCompany === "all" || emp.company === selectedCompany;
      return matchesSearch && matchesDept && matchesBranch && matchesCompany;
    });
  }, [searchTerm, selectedDept, selectedBranch, selectedCompany]);

  type AttendanceStatusCode = "WO" | "P" | "A" | "L" | "EO" | "HD" | "LWP" | "LV" | "OD" | "H";

  // Dedicated showcase sequence for August (31 days) to guarantee all 10 codes appear in one row
  const augustShowcaseSchedule: AttendanceStatusCode[] = [
    "P",   // Day 1 (Sat)
    "WO",  // Day 2 (Sun)
    "P",   // Day 3 (Mon)
    "L",   // Day 4 (Tue)
    "P",   // Day 5 (Wed)
    "EO",  // Day 6 (Thu)
    "P",   // Day 7 (Fri)
    "HD",  // Day 8 (Sat)
    "WO",  // Day 9 (Sun)
    "A",   // Day 10 (Mon)
    "LWP", // Day 11 (Tue)
    "LV",  // Day 12 (Wed)
    "OD",  // Day 13 (Thu)
    "H",   // Day 14 (Fri - Holiday)
    "P",   // Day 15 (Sat)
    "WO",  // Day 16 (Sun)
    "P",   // Day 17 (Mon)
    "L",   // Day 18 (Tue)
    "P",   // Day 19 (Wed)
    "OD",  // Day 20 (Thu)
    "P",   // Day 21 (Fri)
    "P",   // Day 22 (Sat)
    "WO",  // Day 23 (Sun)
    "LV",  // Day 24 (Mon)
    "P",   // Day 25 (Tue)
    "EO",  // Day 26 (Wed)
    "P",   // Day 27 (Thu)
    "HD",  // Day 28 (Fri)
    "P",   // Day 29 (Sat)
    "WO",  // Day 30 (Sun)
    "P",   // Day 31 (Mon)
  ];

  // Compute status for an employee on a given day
  const getDayStatus = (
    empIndex: number,
    day: { dayNum: number; isSunday: boolean; isSaturday: boolean }
  ): AttendanceStatusCode => {
    // In August (Month index 7):
    if (selectedMonth === 7) {
      // Row 0 (Ahmed Ahmed) is the dedicated display example containing ALL 10 codes:
      if (empIndex === 0) {
        return augustShowcaseSchedule[day.dayNum - 1] || "P";
      }

      // Other employees in August have a varied random distribution across the 10 codes:
      if (day.isSunday) return "WO";
      if (day.dayNum === 14) return "H";

      const r = ((empIndex + 3) * 19 + day.dayNum * 23) % 100;
      if (r < 50) return "P";
      if (r < 60) return "L";
      if (r < 68) return "EO";
      if (r < 75) return "HD";
      if (r < 82) return "LV";
      if (r < 88) return "OD";
      if (r < 94) return "A";
      return "LWP";
    }

    // Other months (e.g. March)
    if (day.isSunday) return "WO";

    if (!isProcessed) {
      // In raw unprocessed state (matching the screenshot exactly): all weekdays are "A"
      return "A";
    }

    // In processed state: realistic attendance
    const seed = (empIndex + 1) * 17 + day.dayNum * 13;
    if (seed % 41 === 0) return "LWP";
    if (seed % 37 === 0) return "EO";
    if (seed % 31 === 0) return "OD";
    if (seed % 29 === 0) return "A";
    if (seed % 23 === 0) return "LV";
    if (seed % 19 === 0) return "HD";
    if (seed % 13 === 0) return "L";
    return "P";
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Employee ID",
      "Employee Name",
      "Department",
      ...daysArray.map((d) => `${d.dayNum} (${d.weekday})`),
      "P",
      "A",
      "L",
    ];

    const rows = filteredEmployees.map((emp, empIdx) => {
      let pCount = 0;
      let aCount = 0;
      let lCount = 0;

      const dayStatuses = daysArray.map((day) => {
        const st = getDayStatus(empIdx, day);
        if (st === "P" || st === "OD") pCount++;
        else if (st === "A") aCount++;
        else if (st === "LV" || st === "LWP" || st === "HD") lCount++;
        return st;
      });

      return [
        `"${emp.id}"`,
        `"${emp.name}"`,
        `"${emp.department}"`,
        ...dayStatuses,
        pCount,
        aCount,
        lCount,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Attendance_Muster_Roll_${selectedYear}_${monthsList[selectedMonth].label}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process month simulation
  const handleProcessMonth = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsProcessed((prev) => !prev);
    }, 600);
  };

  // Badge stylings for status codes
  const renderStatusBadge = (code: string) => {
    switch (code) {
      case "WO":
        return (
          <span className="grid h-6 w-7 place-items-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            WO
          </span>
        );
      case "A":
        return (
          <span className="grid h-6 w-7 place-items-center rounded-md bg-rose-50 text-[11px] font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            A
          </span>
        );
      case "P":
        return (
          <span className="grid h-6 w-7 place-items-center rounded-md bg-emerald-50 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            P
          </span>
        );
      case "L":
        return (
          <span className="grid h-6 w-7 place-items-center rounded-md bg-amber-50 text-[11px] font-semibold text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            L
          </span>
        );
      case "EO":
        return (
          <span className="grid h-6 w-7 place-items-center rounded-md bg-orange-50 text-[11px] font-semibold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
            EO
          </span>
        );
      case "HD":
        return (
          <span className="grid h-6 w-7 place-items-center rounded-md bg-orange-50 text-[11px] font-semibold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
            HD
          </span>
        );
      case "LV":
        return (
          <span className="grid h-6 w-7 place-items-center rounded-md bg-pastel-teal text-[11px] font-semibold text-primary dark:bg-primary/20 dark:text-primary">
            LV
          </span>
        );
      case "LWP":
        return (
          <span className="grid h-6 w-7 place-items-center rounded-md bg-rose-50/80 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            LWP
          </span>
        );
      case "OD":
        return (
          <span className="grid h-6 w-7 place-items-center rounded-md bg-teal-50 text-[11px] font-semibold text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
            OD
          </span>
        );
      case "H":
        return (
          <span className="grid h-6 w-7 place-items-center rounded-md bg-purple-50 text-[11px] font-semibold text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
            H
          </span>
        );
      default:
        return (
          <span className="grid h-6 w-7 place-items-center rounded-md bg-muted text-[11px] font-medium text-muted-foreground">
            {code}
          </span>
        );
    }
  };

  return (
    <div ref={containerRef} className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Attendance Register
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Monthly muster roll — one row per employee, one cell per day.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="gap-2 rounded-xl border-border bg-card px-3.5 text-xs sm:text-sm text-foreground shadow-2xs hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>

          <Button
            variant="outline"
            onClick={toggleFullscreen}
            className="gap-2 rounded-xl border-border bg-card px-3.5 text-xs sm:text-sm text-foreground shadow-2xs hover:bg-muted"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span>{isFullscreen ? "Exit" : "Full screen"}</span>
          </Button>

          <Button
            onClick={handleProcessMonth}
            disabled={isProcessing}
            className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 shadow-2xs text-xs sm:text-sm"
          >
            {isProcessing ? (
              <RotateCw className="h-4 w-4 animate-spin text-primary-foreground" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>{isProcessed ? "Reset raw month" : "Process month"}</span>
          </Button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-xs">
        {/* Month Selector */}
        <div className="w-[125px]">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(val) => setSelectedMonth(parseInt(val, 10))}
          >
            <SelectTrigger className="h-9 rounded-xl border-border bg-card text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthsList.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()} className="text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Input */}
        <div className="w-[85px]">
          <Input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10) || 2026)}
            className="h-9 rounded-xl border-border bg-card text-xs"
          />
        </div>

        {/* Company Dropdown */}
        <div className="w-[145px]">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="h-9 rounded-xl border-border bg-card text-xs">
              <SelectValue placeholder="All companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All companies</SelectItem>
              <SelectItem value="PeopleLens Global" className="text-xs">PeopleLens Global</SelectItem>
              <SelectItem value="Acme Corp" className="text-xs">Acme Corp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Branch Dropdown */}
        <div className="w-[135px]">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="h-9 rounded-xl border-border bg-card text-xs">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All branches</SelectItem>
              <SelectItem value="Headquarters" className="text-xs">Headquarters</SelectItem>
              <SelectItem value="Tech Park" className="text-xs">Tech Park</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Department Dropdown */}
        <div className="w-[155px]">
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="h-9 rounded-xl border-border bg-card text-xs">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All departments</SelectItem>
              <SelectItem value="Human Resources" className="text-xs">Human Resources</SelectItem>
              <SelectItem value="Sales" className="text-xs">Sales</SelectItem>
              <SelectItem value="Engineering" className="text-xs">Engineering</SelectItem>
              <SelectItem value="Executive" className="text-xs">Executive</SelectItem>
              <SelectItem value="Product" className="text-xs">Product</SelectItem>
              <SelectItem value="Marketing" className="text-xs">Marketing</SelectItem>
              <SelectItem value="Customer Success" className="text-xs">Customer Success</SelectItem>
              <SelectItem value="Operations" className="text-xs">Operations</SelectItem>
              <SelectItem value="Finance" className="text-xs">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 rounded-xl border-border bg-card pl-8 text-xs"
          />
        </div>
      </div>

      {/* ── Status Code Legend ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
        <div className="text-[11px]">
          {selectedMonth === 7 ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              August muster roll — showcasing all 10 standard attendance status codes:
            </span>
          ) : (
            <span>Muster status codes:</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold">
          <span className="text-emerald-600 dark:text-emerald-400" title="Present (P)">P</span>
          <span className="text-amber-600 dark:text-amber-400" title="Late (L)">L</span>
          <span className="text-orange-500 dark:text-orange-400" title="Early Out (EO)">EO</span>
          <span className="text-orange-600 dark:text-orange-400" title="Half Day (HD)">HD</span>
          <span className="text-rose-600 dark:text-rose-400" title="Absent (A)">A</span>
          <span className="text-rose-700 dark:text-rose-300" title="Leave Without Pay (LWP)">LWP</span>
          <span className="text-primary" title="Leave (LV)">LV</span>
          <span className="text-teal-600 dark:text-teal-400" title="On Duty (OD)">OD</span>
          <span className="text-purple-600 dark:text-purple-400" title="Holiday (H)">H</span>
          <span className="text-slate-600 dark:text-slate-400" title="Weekly Off (WO)">WO</span>
        </div>
      </div>

      {/* ── Muster Roll Table Grid ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-bold text-muted-foreground">
                {/* Fixed Left Column: Employee */}
                <th className="sticky left-0 z-20 min-w-[210px] bg-card px-4 py-2.5 uppercase tracking-wider shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                  Employee
                </th>

                {/* Day Columns: Day number (top) & Weekday (bottom) */}
                {daysArray.map((day) => (
                  <th
                    key={day.dayNum}
                    className={cn(
                      "px-1 py-1.5 text-center min-w-[34px]",
                      day.isSunday ? "text-amber-600 dark:text-amber-400 font-bold bg-amber-500/5" : ""
                    )}
                  >
                    <div className="text-[12px] font-semibold text-foreground">{day.dayNum}</div>
                    <div
                      className={cn(
                        "text-[9px] font-bold uppercase",
                        day.isSunday
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground/80"
                      )}
                    >
                      {day.weekday}
                    </div>
                  </th>
                ))}

                {/* Right Summary Columns: P, A, L */}
                <th className="px-2.5 py-2 text-center font-bold text-emerald-600 dark:text-emerald-400 min-w-[34px]">
                  P
                </th>
                <th className="px-2.5 py-2 text-center font-bold text-rose-600 dark:text-rose-400 min-w-[34px]">
                  A
                </th>
                <th className="px-2.5 py-2 text-center font-bold text-primary min-w-[34px]">
                  L
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-border/60">
              {filteredEmployees.map((emp, empIdx) => {
                let pTotal = 0;
                let aTotal = 0;
                let lTotal = 0;

                const dayStatuses = daysArray.map((day) => {
                  const status = getDayStatus(empIdx, day);
                  if (status === "P" || status === "OD") pTotal++;
                  else if (status === "A") aTotal++;
                  else if (status === "LV" || status === "LWP" || status === "HD") lTotal++;
                  return status;
                });

                return (
                  <tr key={emp.id} className="transition-colors hover:bg-muted/30">
                    {/* Sticky Employee Details */}
                    <td className="sticky left-0 z-10 bg-card px-4 py-2.5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground text-xs">{emp.name}</span>
                        {empIdx === 0 && selectedMonth === 7 && (
                          <span className="rounded-full bg-pastel-teal px-1.5 py-0.5 text-[9px] font-semibold text-primary border border-primary/20 whitespace-nowrap">
                            Example (All 10 Codes)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground/80">
                        {emp.id} · {emp.department}
                      </div>
                    </td>

                    {/* Day Cells */}
                    {dayStatuses.map((status, idx) => (
                      <td key={idx} className="p-1 text-center">
                        <div className="grid place-items-center">
                          {renderStatusBadge(status)}
                        </div>
                      </td>
                    ))}

                    {/* Summary Columns */}
                    <td className="px-2 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {pTotal}
                    </td>
                    <td className="px-2 text-center font-bold text-rose-600 dark:text-rose-400">
                      {aTotal}
                    </td>
                    <td className="px-2 text-center font-bold text-primary">
                      {lTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. APPLY LEAVE VIEW (Exact Spec from Screenshot)
// ==========================================
interface ApplyLeaveEmployee {
  id: string;
  name: string;
  department: string;
  branch: string;
  company: string;
}

const applyLeaveEmployeesData: ApplyLeaveEmployee[] = [
  { id: "EMP-3600", name: "Usman Raza", department: "Sales", branch: "BR Islamabad F-7", company: "PeopleLens Global" },
  { id: "EMP-3599", name: "Saba Dar", department: "Marketing", branch: "North Regional Office", company: "PeopleLens Global" },
  { id: "EMP-3598", name: "Omar Yousaf", department: "Product", branch: "CF Plant Faisalabad", company: "PeopleLens Global" },
  { id: "EMP-3597", name: "Rehan Ali", department: "Engineering", branch: "BR Lahore City", company: "PeopleLens Global" },
  { id: "EMP-3596", name: "Nida Rana", department: "Sales", branch: "North Regional Office", company: "PeopleLens Global" },
  { id: "EMP-3595", name: "Zeeshan Raja", department: "Operations", branch: "BR Islamabad F-7", company: "PeopleLens Global" },
  { id: "EMP-2642", name: "Ahmed Ahmed", department: "Human Resources", branch: "Headquarters", company: "PeopleLens Global" },
  { id: "EMP-3091", name: "Ahmed Akhtar", department: "Sales", branch: "BR Islamabad F-7", company: "PeopleLens Global" },
  { id: "EMP-2988", name: "Ahmed Akhtar", department: "Engineering", branch: "BR Lahore City", company: "PeopleLens Global" },
  { id: "EMP-3320", name: "Ahmed Akhtar", department: "Executive", branch: "Headquarters", company: "PeopleLens Global" },
  { id: "EMP-2449", name: "Ahmed Ali", department: "Product", branch: "CF Plant Faisalabad", company: "PeopleLens Global" },
  { id: "EMP-1029", name: "Ahmed Ansari", department: "Product", branch: "CF Plant Faisalabad", company: "PeopleLens Global" },
  { id: "EMP-1223", name: "Ahmed Ansari", department: "Product", branch: "CF Plant Faisalabad", company: "PeopleLens Global" },
  { id: "EMP-3059", name: "Ahmed Ansari", department: "Marketing", branch: "North Regional Office", company: "PeopleLens Global" },
  { id: "EMP-2719", name: "Ahmed Aslam", department: "Customer Success", branch: "BR Islamabad F-7", company: "PeopleLens Global" },
  { id: "EMP-2810", name: "Sarah Chen", department: "Engineering", branch: "BR Lahore City", company: "Acme Corp" },
  { id: "EMP-1402", name: "Marcus Vance", department: "Marketing", branch: "North Regional Office", company: "Acme Corp" },
  { id: "EMP-2150", name: "Elena Rostova", department: "Sales", branch: "North Regional Office", company: "Acme Corp" },
  { id: "EMP-3120", name: "Devon Miles", department: "Operations", branch: "CF Plant Faisalabad", company: "Acme Corp" },
  { id: "EMP-1904", name: "David Kim", department: "Finance", branch: "Headquarters", company: "PeopleLens Global" },
  { id: "EMP-2218", name: "Rachel Adams", department: "Human Resources", branch: "Headquarters", company: "PeopleLens Global" },
];

export function ApplyLeaveView() {
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [empSearch, setEmpSearch] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");

  const [leaveType, setLeaveType] = useState<string>("Annual Leave (AL)");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [skipWeekoffs, setSkipWeekoffs] = useState<boolean>(true);
  const [remarks, setRemarks] = useState<string>("");

  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{
    count: number;
    leaveType: string;
    fromDate: string;
    toDate: string;
    workingDays: number;
    totalDays: number;
    skippedDays: number;
  } | null>(null);

  // Filter employees based on search, company, branch, department
  const filteredEmployees = useMemo(() => {
    return applyLeaveEmployeesData.filter((emp) => {
      const matchSearch =
        emp.name.toLowerCase().includes(empSearch.toLowerCase()) ||
        emp.id.toLowerCase().includes(empSearch.toLowerCase());
      const matchCompany = selectedCompany === "all" || emp.company === selectedCompany;
      const matchBranch = selectedBranch === "all" || emp.branch === selectedBranch;
      const matchDept = selectedDept === "all" || emp.department === selectedDept;
      return matchSearch && matchCompany && matchBranch && matchDept;
    });
  }, [empSearch, selectedCompany, selectedBranch, selectedDept]);

  // Toggle single employee selection
  const toggleEmployee = (id: string) => {
    setValidationError(null);
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk toggle filtered employees
  const handleToggleSelectFiltered = () => {
    setValidationError(null);
    const filteredIds = filteredEmployees.map((e) => e.id);
    const allSelected = filteredIds.every((id) => selectedEmpIds.includes(id));
    if (allSelected) {
      setSelectedEmpIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedEmpIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedEmpIds([]);
    setValidationError(null);
  };

  // Calculate day metrics
  const calculateLeaveMetrics = () => {
    if (!fromDate || !toDate) {
      return { totalDays: 0, skippedDays: 0, workingDays: 0 };
    }
    const start = new Date(fromDate + "T00:00:00");
    const end = new Date(toDate + "T00:00:00");
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return { totalDays: 0, skippedDays: 0, workingDays: 0 };
    }

    let totalDays = 0;
    let skippedDays = 0;
    const cur = new Date(start);
    while (cur <= end) {
      totalDays++;
      const isSunday = cur.getDay() === 0;
      // Example public holiday in August
      const isHoliday = cur.getMonth() === 7 && cur.getDate() === 14;
      if (isSunday || isHoliday) {
        skippedDays++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    const workingDays = skipWeekoffs ? Math.max(0, totalDays - skippedDays) : totalDays;
    return { totalDays, skippedDays, workingDays };
  };

  const metrics = calculateLeaveMetrics();

  // Handle Preview
  const handlePreview = () => {
    if (selectedEmpIds.length === 0) {
      setValidationError("Please select at least one employee from the list.");
      return;
    }
    if (!fromDate || !toDate) {
      setValidationError("Please select both 'From' and 'To' dates.");
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      setValidationError("'To' date cannot be earlier than 'From' date.");
      return;
    }
    setValidationError(null);
    setPreviewOpen(true);
  };

  // Handle Apply Leave
  const handleApplyLeave = () => {
    if (selectedEmpIds.length === 0) {
      setValidationError("Please select at least one employee from the list.");
      return;
    }
    if (!fromDate || !toDate) {
      setValidationError("Please select both 'From' and 'To' dates.");
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      setValidationError("'To' date cannot be earlier than 'From' date.");
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess({
        count: selectedEmpIds.length,
        leaveType,
        fromDate,
        toDate,
        workingDays: metrics.workingDays,
        totalDays: metrics.totalDays,
        skippedDays: metrics.skippedDays,
      });
      setSelectedEmpIds([]);
      setRemarks("");
    }, 450);
  };

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedEmpIds.includes(emp.id));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Apply leave
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mark leave on behalf of employees — the days are written into the attendance register and count against the entitlement.
        </p>
      </div>

      {/* Validation Message */}
      {validationError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3 animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {submitSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in-50">
          <div className="flex items-start sm:items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">
                Leave Successfully Applied!
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Marked <span className="font-medium text-foreground">{submitSuccess.leaveType}</span> for{" "}
                <span className="font-medium text-foreground">{submitSuccess.count} employee(s)</span> from{" "}
                <span className="font-medium text-foreground">{submitSuccess.fromDate}</span> to{" "}
                <span className="font-medium text-foreground">{submitSuccess.toDate}</span> (
                {submitSuccess.workingDays} working days each). Updated in the attendance register.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/attendance/$view"
              params={{ view: "register" }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
            >
              <span>View in register</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSubmitSuccess(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Employee Selection Card */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
          {/* Header & Filter Controls Row 1 */}
          <div className="p-3.5 border-b border-border/70 flex flex-wrap items-center gap-2.5">
            {/* Title & Selected Badge */}
            <div className="flex items-center gap-2 pr-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm text-foreground">Employees</span>
              <span className="rounded-full bg-pastel-teal px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                {selectedEmpIds.length} selected
              </span>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[170px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name or code..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="h-9 rounded-xl pl-8 text-xs border-border bg-card"
              />
            </div>

            {/* Company Dropdown */}
            <div className="w-[125px]">
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="h-9 rounded-xl border-border bg-card text-xs">
                  <SelectValue placeholder="All companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All companies</SelectItem>
                  <SelectItem value="PeopleLens Global" className="text-xs">PeopleLens Global</SelectItem>
                  <SelectItem value="Acme Corp" className="text-xs">Acme Corp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branch Dropdown */}
            <div className="w-[125px]">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="h-9 rounded-xl border-border bg-card text-xs">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All branches</SelectItem>
                  <SelectItem value="BR Islamabad F-7" className="text-xs">BR Islamabad F-7</SelectItem>
                  <SelectItem value="North Regional Office" className="text-xs">North Regional Office</SelectItem>
                  <SelectItem value="CF Plant Faisalabad" className="text-xs">CF Plant Faisalabad</SelectItem>
                  <SelectItem value="BR Lahore City" className="text-xs">BR Lahore City</SelectItem>
                  <SelectItem value="Headquarters" className="text-xs">Headquarters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Controls Row 2: Department + Quick Select */}
          <div className="px-3.5 py-2.5 bg-muted/20 border-b border-border/70 flex items-center justify-between gap-2.5">
            <div className="w-[145px]">
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="h-8 rounded-xl border-border bg-card text-xs">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All departments</SelectItem>
                  <SelectItem value="Sales" className="text-xs">Sales</SelectItem>
                  <SelectItem value="Marketing" className="text-xs">Marketing</SelectItem>
                  <SelectItem value="Product" className="text-xs">Product</SelectItem>
                  <SelectItem value="Engineering" className="text-xs">Engineering</SelectItem>
                  <SelectItem value="Human Resources" className="text-xs">Human Resources</SelectItem>
                  <SelectItem value="Operations" className="text-xs">Operations</SelectItem>
                  <SelectItem value="Customer Success" className="text-xs">Customer Success</SelectItem>
                  <SelectItem value="Finance" className="text-xs">Finance</SelectItem>
                  <SelectItem value="Executive" className="text-xs">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleToggleSelectFiltered}
                className="font-medium text-primary hover:underline cursor-pointer"
              >
                {allFilteredSelected ? "Deselect page" : "Select all filtered"}
              </button>
              {selectedEmpIds.length > 0 && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Clear selection
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Scrollable Employee List */}
          <div className="max-h-[460px] overflow-y-auto divide-y divide-border/60">
            {filteredEmployees.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No employees match your search or filter criteria.
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isChecked = selectedEmpIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleEmployee(emp.id)}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-3 cursor-pointer transition-colors select-none",
                      isChecked ? "bg-pastel-teal/20 hover:bg-pastel-teal/30" : "hover:bg-muted/40"
                    )}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleEmployee(emp.id)}
                      className="h-4 w-4 rounded-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-foreground truncate">
                        {emp.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground/80 truncate">
                        {emp.id} · {emp.department} · {emp.branch}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Leave Application Card */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
          {/* Leave Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Leave type</label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger className="h-10 rounded-xl border-border bg-card text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Annual Leave (AL)" className="text-xs">Annual Leave (AL)</SelectItem>
                <SelectItem value="Casual Leave (CL)" className="text-xs">Casual Leave (CL)</SelectItem>
                <SelectItem value="Sick Leave (SL)" className="text-xs">Sick Leave (SL)</SelectItem>
                <SelectItem value="Compensatory Off (CO)" className="text-xs">Compensatory Off (CO)</SelectItem>
                <SelectItem value="Maternity Leave (ML)" className="text-xs">Maternity Leave (ML)</SelectItem>
                <SelectItem value="Paternity Leave (PL)" className="text-xs">Paternity Leave (PL)</SelectItem>
                <SelectItem value="Leave Without Pay (LWP)" className="text-xs">Leave Without Pay (LWP)</SelectItem>
                <SelectItem value="On Duty (OD)" className="text-xs">On Duty (OD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range: From & To */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">From</label>
              <div className="relative">
                <Input
                  type="date"
                  placeholder="Select date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setValidationError(null);
                  }}
                  className="h-10 rounded-xl border-border bg-card pr-3 text-xs [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">To</label>
              <div className="relative">
                <Input
                  type="date"
                  placeholder="Select date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setValidationError(null);
                  }}
                  className="h-10 rounded-xl border-border bg-card pr-3 text-xs [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70"
                />
              </div>
            </div>
          </div>

          {/* Skip weekly-offs and holidays */}
          <div className="flex items-start gap-2.5 pt-1">
            <Checkbox
              id="skipWeekoffs"
              checked={skipWeekoffs}
              onCheckedChange={(val) => setSkipWeekoffs(Boolean(val))}
              className="mt-0.5 h-4 w-4 rounded-sm"
            />
            <label htmlFor="skipWeekoffs" className="cursor-pointer space-y-0.5">
              <div className="font-semibold text-xs text-foreground">
                Skip weekly-offs and holidays
              </div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                Non-working days in the range won't consume entitlement.
              </div>
            </label>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Remarks</label>
            <Input
              placeholder="e.g. approved by HOD (optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="h-10 rounded-xl border-border bg-card text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              className="flex-1 gap-2 rounded-xl border-border bg-card text-xs sm:text-sm font-medium hover:bg-muted shadow-2xs"
            >
              <Info className="h-4 w-4 text-muted-foreground" />
              <span>Preview</span>
            </Button>

            <Button
              type="button"
              onClick={handleApplyLeave}
              disabled={isSubmitting}
              className="flex-1 gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs sm:text-sm shadow-2xs"
            >
              {isSubmitting ? (
                <RotateCw className="h-4 w-4 animate-spin text-primary-foreground" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{isSubmitting ? "Applying..." : "Apply leave"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Leave Preview Dialog ── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Leave Impact Preview
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review deduction summary and employee entitlement impact before applying.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Leave Type:</span>
                <span className="font-semibold text-foreground">{leaveType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date Range:</span>
                <span className="font-semibold text-foreground">{fromDate} → {toDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Calendar Days:</span>
                <span className="font-semibold text-foreground">
                  {metrics.totalDays} day{metrics.totalDays !== 1 ? "s" : ""}
                </span>
              </div>
              {skipWeekoffs && (
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                  <span>Non-working Days Excluded:</span>
                  <span className="font-semibold">
                    -{metrics.skippedDays} day{metrics.skippedDays !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              <div className="border-t border-border/80 pt-2 flex items-center justify-between font-bold text-foreground">
                <span>Deduction per Employee:</span>
                <span className="text-primary">
                  {metrics.workingDays} working day{metrics.workingDays !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center justify-between font-bold text-foreground">
                <span>Total Org Entitlement Impact:</span>
                <span className="text-primary">
                  {metrics.workingDays * selectedEmpIds.length} days ({selectedEmpIds.length} employee{selectedEmpIds.length !== 1 ? "s" : ""})
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-foreground mb-1.5">
                Selected Employees ({selectedEmpIds.length}):
              </div>
              <div className="max-h-36 overflow-y-auto rounded-xl border border-border p-2 divide-y divide-border/60 text-xs bg-muted/10">
                {applyLeaveEmployeesData
                  .filter((e) => selectedEmpIds.includes(e.id))
                  .map((emp) => (
                    <div key={emp.id} className="py-1.5 flex items-center justify-between">
                      <span className="font-medium text-foreground">{emp.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {emp.id} · {emp.department}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(false)}
              className="rounded-xl border-border bg-card text-xs hover:bg-muted"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => {
                setPreviewOpen(false);
                handleApplyLeave();
              }}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium"
            >
              Confirm & Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// 4. PUNCHES VIEW (Exact Spec from Screenshot)
// ==========================================
interface RawPunchRecord {
  id: string;
  name: string;
  code: string;
  punchTime: string;
  direction: "In" | "Out";
  source: "Biometric" | "Manual" | "Web Clock";
  reason: string;
}

const initialRawPunches: RawPunchRecord[] = [
  { id: "P-101", name: "Laiba Hussain", code: "EMP-1256", punchTime: "5 Aug 2026, 23:40", direction: "Out", source: "Biometric", reason: "seed" },
  { id: "P-102", name: "Haris Zafar", code: "EMP-1394", punchTime: "5 Aug 2026, 23:40", direction: "Out", source: "Biometric", reason: "seed" },
  { id: "P-103", name: "Rehan Iqbal", code: "EMP-1374", punchTime: "5 Aug 2026, 23:40", direction: "Out", source: "Biometric", reason: "seed" },
  { id: "P-104", name: "Danish Aslam", code: "EMP-1186", punchTime: "5 Aug 2026, 23:40", direction: "Out", source: "Biometric", reason: "seed" },
  { id: "P-105", name: "Noman Raza", code: "EMP-1271", punchTime: "5 Aug 2026, 23:40", direction: "Out", source: "Biometric", reason: "seed" },
  { id: "P-106", name: "Ayesha Ali", code: "EMP-1035", punchTime: "5 Aug 2026, 23:40", direction: "Out", source: "Biometric", reason: "seed" },
  { id: "P-107", name: "Bushra Hashmi", code: "EMP-1037", punchTime: "5 Aug 2026, 23:40", direction: "Out", source: "Biometric", reason: "seed" },
  { id: "P-108", name: "Taha Bhatti", code: "EMP-1333", punchTime: "5 Aug 2026, 23:40", direction: "Out", source: "Biometric", reason: "seed" },
  { id: "P-109", name: "Usman Raza", code: "EMP-3600", punchTime: "5 Aug 2026, 09:02", direction: "In", source: "Biometric", reason: "seed" },
  { id: "P-110", name: "Saba Dar", code: "EMP-3599", punchTime: "5 Aug 2026, 09:05", direction: "In", source: "Biometric", reason: "seed" },
  { id: "P-111", name: "Omar Yousaf", code: "EMP-3598", punchTime: "5 Aug 2026, 09:12", direction: "In", source: "Biometric", reason: "seed" },
  { id: "P-112", name: "Ahmed Ahmed", code: "EMP-2642", punchTime: "5 Aug 2026, 09:15", direction: "In", source: "Manual", reason: "Gate card lost" },
  { id: "P-113", name: "Rehan Ali", code: "EMP-3597", punchTime: "5 Aug 2026, 18:30", direction: "Out", source: "Biometric", reason: "seed" },
  { id: "P-114", name: "Sarah Chen", code: "EMP-2810", punchTime: "5 Aug 2026, 09:00", direction: "In", source: "Biometric", reason: "seed" },
];

export function PunchesView() {
  const [punches, setPunches] = useState<RawPunchRecord[]>(initialRawPunches);
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>("all");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>("all");
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);

  // Manual Punch Form state
  const [manualEmployee, setManualEmployee] = useState<string>("EMP-1256|Laiba Hussain");
  const [manualDate, setManualDate] = useState<string>("2026-08-05");
  const [manualTime, setManualTime] = useState<string>("09:00");
  const [manualDirection, setManualDirection] = useState<"In" | "Out">("In");
  const [manualReason, setManualReason] = useState<string>("Missed swipe at gate");

  // Filter punches
  const filteredPunches = useMemo(() => {
    return punches.filter((p) => {
      const matchEmp =
        selectedEmpFilter === "all" ||
        p.code === selectedEmpFilter ||
        p.name === selectedEmpFilter;
      const matchSource =
        selectedSourceFilter === "all" || p.source === selectedSourceFilter;
      return matchEmp && matchSource;
    });
  }, [punches, selectedEmpFilter, selectedSourceFilter]);

  // Handle submit manual punch
  const handleSaveManualPunch = (e: React.FormEvent) => {
    e.preventDefault();
    const [code, name] = manualEmployee.split("|");

    // Format date string for table
    const dateObj = new Date(manualDate + "T" + manualTime);
    const day = dateObj.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[dateObj.getMonth()] || "Aug";
    const year = dateObj.getFullYear();
    const formattedPunchTime = `${day} ${month} ${year}, ${manualTime}`;

    const newPunch: RawPunchRecord = {
      id: `P-${Date.now().toString().slice(-4)}`,
      name,
      code,
      punchTime: formattedPunchTime,
      direction: manualDirection,
      source: "Manual",
      reason: manualReason || "Manual correction",
    };

    setPunches([newPunch, ...punches]);
    setIsManualModalOpen(false);
    setManualSuccessMsg(
      `Manual punch recorded for ${name} (${code}) — ${manualDirection} at ${formattedPunchTime}. Added to immutable log.`
    );
    setTimeout(() => setManualSuccessMsg(null), 6000);
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Punches
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Raw punch log — immutable. Corrections are added as new manual punches, never edits.
          </p>
        </div>

        <Button
          onClick={() => setIsManualModalOpen(true)}
          className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 shadow-2xs text-xs sm:text-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Manual punch</span>
        </Button>
      </div>

      {/* Manual Punch Success Alert */}
      {manualSuccessMsg && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-xs flex items-center justify-between gap-3 animate-in fade-in-50">
          <div className="flex items-center gap-2.5 text-xs text-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{manualSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setManualSuccessMsg(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Employee Filter */}
          <div className="w-[180px]">
            <Select value={selectedEmpFilter} onValueChange={setSelectedEmpFilter}>
              <SelectTrigger className="h-9 rounded-xl border-border bg-card text-xs">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All employees</SelectItem>
                <SelectItem value="EMP-1256" className="text-xs">Laiba Hussain (EMP-1256)</SelectItem>
                <SelectItem value="EMP-1394" className="text-xs">Haris Zafar (EMP-1394)</SelectItem>
                <SelectItem value="EMP-1374" className="text-xs">Rehan Iqbal (EMP-1374)</SelectItem>
                <SelectItem value="EMP-1186" className="text-xs">Danish Aslam (EMP-1186)</SelectItem>
                <SelectItem value="EMP-1271" className="text-xs">Noman Raza (EMP-1271)</SelectItem>
                <SelectItem value="EMP-1035" className="text-xs">Ayesha Ali (EMP-1035)</SelectItem>
                <SelectItem value="EMP-1037" className="text-xs">Bushra Hashmi (EMP-1037)</SelectItem>
                <SelectItem value="EMP-1333" className="text-xs">Taha Bhatti (EMP-1333)</SelectItem>
                <SelectItem value="EMP-3600" className="text-xs">Usman Raza (EMP-3600)</SelectItem>
                <SelectItem value="EMP-2642" className="text-xs">Ahmed Ahmed (EMP-2642)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div className="w-[145px]">
            <Select value={selectedSourceFilter} onValueChange={setSelectedSourceFilter}>
              <SelectTrigger className="h-9 rounded-xl border-border bg-card text-xs">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All sources</SelectItem>
                <SelectItem value="Biometric" className="text-xs">Biometric</SelectItem>
                <SelectItem value="Manual" className="text-xs">Manual</SelectItem>
                <SelectItem value="Web Clock" className="text-xs">Web Clock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Total Count */}
        <div className="text-xs font-medium text-muted-foreground pr-2">
          {selectedEmpFilter === "all" && selectedSourceFilter === "all"
            ? "17584 punches"
            : `${filteredPunches.length.toLocaleString()} punches`}
        </div>
      </div>

      {/* ── Raw Punch Log Table Grid ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 min-w-[200px]">EMPLOYEE</th>
                <th className="px-4 py-3 min-w-[170px]">PUNCH TIME</th>
                <th className="px-4 py-3 min-w-[120px]">DIRECTION</th>
                <th className="px-4 py-3 min-w-[130px]">SOURCE</th>
                <th className="px-4 py-3 min-w-[140px]">REASON / BATCH</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-border/60">
              {filteredPunches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No punch records found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredPunches.map((punch) => (
                  <tr key={punch.id} className="transition-colors hover:bg-muted/30">
                    {/* Employee */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-xs text-foreground">{punch.name}</div>
                      <div className="text-[11px] text-muted-foreground/80">{punch.code}</div>
                    </td>

                    {/* Punch Time */}
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      {punch.punchTime}
                    </td>

                    {/* Direction */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "font-medium",
                          punch.direction === "In"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        )}
                      >
                        {punch.direction}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3.5">
                      {punch.source === "Biometric" ? (
                        <span className="inline-block rounded-full bg-pastel-teal px-2.5 py-0.5 text-[11px] font-medium text-primary border border-primary/20">
                          Biometric
                        </span>
                      ) : punch.source === "Manual" ? (
                        <span className="inline-block rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Manual
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
                          Web Clock
                        </span>
                      )}
                    </td>

                    {/* Reason / Batch */}
                    <td className="px-4 py-3.5 text-muted-foreground text-xs font-mono">
                      {punch.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Manual Punch Dialog ── */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Add Manual Punch
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Raw punch log is immutable. This entry will be appended as a new manual punch correction.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveManualPunch} className="space-y-4 py-2">
            {/* Employee */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Employee *</label>
              <Select value={manualEmployee} onValueChange={setManualEmployee}>
                <SelectTrigger className="h-10 rounded-xl border-border bg-card text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMP-1256|Laiba Hussain" className="text-xs">Laiba Hussain (EMP-1256)</SelectItem>
                  <SelectItem value="EMP-1394|Haris Zafar" className="text-xs">Haris Zafar (EMP-1394)</SelectItem>
                  <SelectItem value="EMP-1374|Rehan Iqbal" className="text-xs">Rehan Iqbal (EMP-1374)</SelectItem>
                  <SelectItem value="EMP-1186|Danish Aslam" className="text-xs">Danish Aslam (EMP-1186)</SelectItem>
                  <SelectItem value="EMP-1271|Noman Raza" className="text-xs">Noman Raza (EMP-1271)</SelectItem>
                  <SelectItem value="EMP-1035|Ayesha Ali" className="text-xs">Ayesha Ali (EMP-1035)</SelectItem>
                  <SelectItem value="EMP-1037|Bushra Hashmi" className="text-xs">Bushra Hashmi (EMP-1037)</SelectItem>
                  <SelectItem value="EMP-1333|Taha Bhatti" className="text-xs">Taha Bhatti (EMP-1333)</SelectItem>
                  <SelectItem value="EMP-3600|Usman Raza" className="text-xs">Usman Raza (EMP-3600)</SelectItem>
                  <SelectItem value="EMP-2642|Ahmed Ahmed" className="text-xs">Ahmed Ahmed (EMP-2642)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Date *</label>
                <Input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="h-10 rounded-xl border-border bg-card text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Time *</label>
                <Input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="h-10 rounded-xl border-border bg-card text-xs"
                  required
                />
              </div>
            </div>

            {/* Direction */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Direction *</label>
              <Select
                value={manualDirection}
                onValueChange={(val: "In" | "Out") => setManualDirection(val)}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-card text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In" className="text-xs">In (Arrival / Check-in)</SelectItem>
                  <SelectItem value="Out" className="text-xs">Out (Departure / Check-out)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason / Batch */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Reason / Batch *</label>
              <Input
                placeholder="e.g. Card forgotten, gate reader offline"
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                className="h-10 rounded-xl border-border bg-card text-xs"
                required
              />
            </div>

            <DialogFooter className="flex gap-2 pt-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsManualModalOpen(false)}
                className="rounded-xl border-border bg-card text-xs hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-2xs"
              >
                Record punch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// 5. MONTH-END CLOSE VIEW
// ==========================================
interface MonthlySummaryRow {
  id: string;
  name: string;
  code: string;
  department: string;
  working: number;
  present: number;
  absent: number;
  late: number;
  half: number;
  lwp: number;
  otHrs: number;
  payableDays: number | string;
}

const initialMonthlySummaries: MonthlySummaryRow[] = [
  { id: "1", name: "Usman Raza", code: "EMP-3600", department: "Sales", working: 26, present: 0, absent: 26, late: 0, half: 0, lwp: 26, otHrs: 0, payableDays: 4 },
  { id: "2", name: "Saba Dar", code: "EMP-3599", department: "Marketing", working: 26, present: 0, absent: 26, late: 0, half: 0, lwp: 26, otHrs: 0, payableDays: 4 },
  { id: "3", name: "Omar Yousaf", code: "EMP-3598", department: "Product", working: 26, present: 0, absent: 26, late: 0, half: 0, lwp: 26, otHrs: 0, payableDays: 4 },
  { id: "4", name: "Rehan Ali", code: "EMP-3597", department: "Engineering", working: 26, present: 0, absent: 26, late: 0, half: 0, lwp: 26, otHrs: 0, payableDays: 4 },
  { id: "5", name: "Laiba Hussain", code: "EMP-1256", department: "Product Design", working: 26, present: 21, absent: 1, late: 0, half: 0, lwp: 1, otHrs: 0, payableDays: 25 },
  { id: "6", name: "Haris Zafar", code: "EMP-1394", department: "Engineering", working: 26, present: 22, absent: 0, late: 2, half: 0, lwp: 0, otHrs: 12, payableDays: 26 },
  { id: "7", name: "Rehan Iqbal", code: "EMP-1374", department: "QA", working: 26, present: 24, absent: 0, late: 0, half: 1, lwp: 0, otHrs: 8, payableDays: 25.5 },
  { id: "8", name: "Danish Aslam", code: "EMP-1186", department: "Operations", working: 26, present: 20, absent: 2, late: 1, half: 0, lwp: 2, otHrs: 6, payableDays: 24 },
  { id: "9", name: "Noman Raza", code: "EMP-1271", department: "Marketing", working: 26, present: 26, absent: 0, late: 0, half: 0, lwp: 0, otHrs: 0, payableDays: 26 },
  { id: "10", name: "Ayesha Ali", code: "EMP-1035", department: "People Operations", working: 26, present: 24, absent: 0, late: 0, half: 0, lwp: 0, otHrs: 0, payableDays: 26 },
  { id: "11", name: "Bushra Hashmi", code: "EMP-1037", department: "Finance", working: 26, present: 25, absent: 1, late: 0, half: 0, lwp: 1, otHrs: 0, payableDays: 25 },
  { id: "12", name: "Taha Bhatti", code: "EMP-1333", department: "Engineering", working: 26, present: 22, absent: 2, late: 1, half: 0, lwp: 2, otHrs: 14, payableDays: 24 },
];

export function MonthEndCloseView() {
  const [selectedMonth, setSelectedMonth] = useState<string>("September");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Filtered rows by search query
  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return initialMonthlySummaries;
    const q = searchQuery.toLowerCase();
    return initialMonthlySummaries.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Handle Generate Summaries
  const handleGenerateSummaries = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setAlertNotice(`Monthly summaries refreshed for ${selectedMonth} ${selectedYear}.`);
      setTimeout(() => setAlertNotice(null), 4000);
    }, 800);
  };

  // Confirm Lock
  const handleConfirmLock = () => {
    setIsLocked(true);
    setIsConfirmModalOpen(false);
    setAlertNotice(
      `Period ${selectedMonth} ${selectedYear} successfully locked and frozen for payroll processing.`
    );
    setTimeout(() => setAlertNotice(null), 6000);
  };

  // Export Payroll CSV
  const handleExportCSV = () => {
    const headers = [
      "EMPLOYEE ID", "EMPLOYEE NAME", "DEPARTMENT", "WORKING", "PRESENT",
      "ABSENT", "LATE", "HALF", "LWP", "OT HRS", "PAYABLE DAYS", "LOCKED"
    ];
    const rows = filteredSummaries.map((r) => [
      r.code, `"${r.name}"`, `"${r.department}"`, r.working, r.present,
      r.absent, r.late, r.half, r.lwp, r.otHrs, r.payableDays, isLocked ? "Yes" : "No"
    ].join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Monthly_Summary_${selectedMonth}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Month-End Close
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Freeze the month: generate the monthly summary payroll consumes, then lock the period.
          </p>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="w-[140px]">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-10 rounded-xl border-border bg-card text-xs sm:text-sm font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex h-10 w-20 items-center justify-center rounded-xl border border-border bg-card px-3 text-xs sm:text-sm font-medium text-foreground shadow-2xs">
            {selectedYear}
          </div>
        </div>
      </div>

      {/* Alert Notice Banner */}
      {alertNotice && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 shadow-xs flex items-center justify-between gap-3 animate-in fade-in-50">
          <div className="flex items-center gap-2.5 text-xs text-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{alertNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertNotice(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── 5 Metric Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Processed Rows */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            PROCESSED ROWS
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            73590
          </div>
        </div>

        {/* Absent Days */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            ABSENT DAYS
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-500 sm:text-3xl">
            63778
          </div>
        </div>

        {/* Summaries */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            SUMMARIES
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            2600
          </div>
        </div>

        {/* Locked Rows */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            LOCKED ROWS
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {isLocked ? "2600" : "0"}
          </div>
        </div>

        {/* Period Status */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            PERIOD STATUS
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {isLocked ? (
              <>
                <Lock className="h-5 w-5 text-primary stroke-[1.8]" />
                <span>Locked</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground stroke-[1.8]" />
                <span>Open</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Action & Warning Card ── */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-foreground">
            {selectedMonth} {selectedYear}
          </h2>
          <p className="text-xs text-muted-foreground">
            Generate summaries to review payable days, then lock to freeze the month for payroll handoff.
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>63778 absent day(s) — confirm as leave/LWP before locking.</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateSummaries}
            disabled={isGenerating}
            className="gap-2 rounded-xl border-border bg-card text-xs font-medium hover:bg-muted"
          >
            <RotateCw className={cn("h-3.5 w-3.5", isGenerating && "animate-spin text-primary")} />
            <span>{isGenerating ? "Generating..." : "Generate summaries"}</span>
          </Button>

          {isLocked ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleExportCSV}
                className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Payroll CSV</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLocked(false)}
                className="rounded-xl border-border bg-card text-xs text-muted-foreground hover:text-foreground"
                title="Unlock period for edits"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                <span>Unlock</span>
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => setIsConfirmModalOpen(true)}
              className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-2xs"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Lock period</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Monthly Summary Table Card ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        {/* Table Card Topbar */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-base text-foreground">Monthly summary</h3>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              2600
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 rounded-xl border-border bg-card text-xs"
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/20 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 min-w-[200px]">EMPLOYEE</th>
                <th className="px-3 py-3 text-center min-w-[70px]">WORKING</th>
                <th className="px-3 py-3 text-center min-w-[70px]">PRESENT</th>
                <th className="px-3 py-3 text-center min-w-[70px]">ABSENT</th>
                <th className="px-3 py-3 text-center min-w-[70px]">LATE</th>
                <th className="px-3 py-3 text-center min-w-[70px]">HALF</th>
                <th className="px-3 py-3 text-center min-w-[70px]">LWP</th>
                <th className="px-3 py-3 text-center min-w-[70px]">OT HRS</th>
                <th className="px-4 py-3 text-center min-w-[100px]">PAYABLE DAYS</th>
                <th className="px-3 py-3 text-center min-w-[70px]">LOCKED</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No summary records found matching &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-muted/20">
                    {/* Employee */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-xs text-foreground">{row.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {row.code} &middot; {row.department}
                      </div>
                    </td>

                    {/* Working */}
                    <td className="px-3 py-3 text-center text-muted-foreground">
                      {row.working}
                    </td>

                    {/* Present */}
                    <td className="px-3 py-3 text-center text-muted-foreground">
                      {row.present}
                    </td>

                    {/* Absent */}
                    <td className="px-3 py-3 text-center text-muted-foreground">
                      {row.absent}
                    </td>

                    {/* Late */}
                    <td className="px-3 py-3 text-center text-muted-foreground">
                      {row.late}
                    </td>

                    {/* Half */}
                    <td className="px-3 py-3 text-center text-muted-foreground">
                      {row.half}
                    </td>

                    {/* LWP */}
                    <td className="px-3 py-3 text-center">
                      <span className={cn(
                        "font-semibold",
                        row.lwp > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                      )}>
                        {row.lwp}
                      </span>
                    </td>

                    {/* OT Hrs */}
                    <td className="px-3 py-3 text-center text-muted-foreground">
                      {row.otHrs}
                    </td>

                    {/* Payable Days */}
                    <td className="px-4 py-3 text-center font-bold text-foreground">
                      {row.payableDays}
                    </td>

                    {/* Locked */}
                    <td className="px-3 py-3 text-center text-muted-foreground">
                      {isLocked ? (
                        <span className="inline-flex items-center justify-center text-primary">
                          <Lock className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span>&mdash;</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Lock Confirmation Modal ── */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card p-6 shadow-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Lock className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold text-foreground">
                Lock Period &mdash; {selectedMonth} {selectedYear}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to freeze and lock attendance for <strong>{selectedMonth} {selectedYear}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-xl border border-amber-300/60 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong>Warning:</strong> 63,778 absent day(s) detected across summaries. Please ensure all leave adjustments and LWP regularizations are approved before locking.
              </div>
            </div>

            <p className="text-muted-foreground text-[11px]">
              Once locked, all 2,600 monthly summaries will be frozen and immutable. The dataset will be ready for payroll processing handoff.
            </p>
          </div>

          <DialogFooter className="flex gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
              className="rounded-xl border-border bg-card text-xs hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmLock}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-2xs gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Confirm &amp; Lock</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// 6. ATTENDANCE SETUP VIEW (WITH INNER SIDEBAR)
// ==========================================
interface ShiftRecord {
  id: string;
  name: string;
  code: string;
  timing: string;
  grace: string;
  fullDay: string;
  isDefault: boolean;
  status: "Active" | "Trash";
}

const initialShiftsData: ShiftRecord[] = [
  {
    id: "shift-1",
    name: "General (9–6)",
    code: "GEN",
    timing: "09:00–18:00",
    grace: "15/15 min",
    fullDay: "8.0h",
    isDefault: true,
    status: "Active",
  },
  {
    id: "shift-2",
    name: "Morning (6–2)",
    code: "MORN",
    timing: "06:00–14:00",
    grace: "10/10 min",
    fullDay: "7.5h",
    isDefault: false,
    status: "Active",
  },
  {
    id: "shift-3",
    name: "Night (22–6)",
    code: "NIGHT · night",
    timing: "22:00–06:00",
    grace: "15/15 min",
    fullDay: "7.3h",
    isDefault: false,
    status: "Active",
  },
];

export function AttendanceSetupView() {
  const [activeSubsection, setActiveSubsection] = useState<string>("shifts");
  const [shifts, setShifts] = useState<ShiftRecord[]>(initialShiftsData);
  const [shiftFilterTab, setShiftFilterTab] = useState<"Active" | "Trash">("Active");
  const [shiftSearch, setShiftSearch] = useState<string>("");
  const [isNewShiftModalOpen, setIsNewShiftModalOpen] = useState<boolean>(false);

  // New Shift Form State matching screenshots
  const [newShiftName, setNewShiftName] = useState<string>("");
  const [newShiftCode, setNewShiftCode] = useState<string>("");
  const [newShiftStart, setNewShiftStart] = useState<string>("09:00");
  const [newShiftEnd, setNewShiftEnd] = useState<string>("18:00");
  const [newShiftBreak, setNewShiftBreak] = useState<string>("");
  const [newShiftGraceIn, setNewShiftGraceIn] = useState<string>("15");
  const [newShiftGraceOut, setNewShiftGraceOut] = useState<string>("15");
  const [newShiftHalfDay, setNewShiftHalfDay] = useState<string>("");
  const [newShiftFullDayMin, setNewShiftFullDayMin] = useState<string>("480");
  const [newShiftMinOT, setNewShiftMinOT] = useState<string>("");
  const [onlyTotalHours, setOnlyTotalHours] = useState<boolean>(false);
  const [orgWideFallback, setOrgWideFallback] = useState<boolean>(false);
  const [newShiftDescription, setNewShiftDescription] = useState<string>("");

  // Navigation Items with categories matching media_1788890500656.png
  const navSections = [
    {
      group: "SHIFTS",
      items: [
        { id: "shifts", label: "Shifts", icon: Clock, count: shifts.filter((s) => s.status === "Active").length },
        { id: "shift-assignments", label: "Shift assignments", icon: SlidersHorizontal, count: 0 },
      ],
    },
    {
      group: "CALENDAR",
      items: [
        { id: "holiday-calendars", label: "Holiday calendars", icon: Calendar, count: 2 },
        { id: "holidays", label: "Holidays", icon: Palmtree, count: 0 },
        { id: "weekly-off-rules", label: "Weekly-off rules", icon: CalendarDays, count: 1 },
      ],
    },
    {
      group: "LEAVE",
      items: [
        { id: "leave-types", label: "Leave types", icon: Palmtree, count: null },
        { id: "leave-entitlements", label: "Leave entitlements", icon: Scale, count: null },
      ],
    },
    {
      group: "RULES",
      items: [
        { id: "attendance-policies", label: "Attendance policies", icon: Sliders, count: 1 },
      ],
    },
  ];

  // Filtered shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      const matchTab = s.status === shiftFilterTab;
      const matchSearch =
        !shiftSearch.trim() ||
        s.name.toLowerCase().includes(shiftSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(shiftSearch.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [shifts, shiftFilterTab, shiftSearch]);

  // Handle Save New Shift
  const handleSaveNewShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftName.trim()) return;

    const fullDayHours = newShiftFullDayMin
      ? `${(Number(newShiftFullDayMin) / 60).toFixed(1)}h`
      : "8.0h";

    const graceText = `${newShiftGraceIn || "15"}/${newShiftGraceOut || "15"} min`;

    const newRecord: ShiftRecord = {
      id: `shift-${Date.now()}`,
      name: newShiftName,
      code: newShiftCode || newShiftName.slice(0, 4).toUpperCase(),
      timing: `${newShiftStart}–${newShiftEnd}`,
      grace: graceText,
      fullDay: fullDayHours,
      isDefault: orgWideFallback,
      status: "Active",
    };

    setShifts([...shifts, newRecord]);
    setIsNewShiftModalOpen(false);

    // Reset Form
    setNewShiftName("");
    setNewShiftCode("");
    setNewShiftStart("09:00");
    setNewShiftEnd("18:00");
    setNewShiftBreak("");
    setNewShiftGraceIn("15");
    setNewShiftGraceOut("15");
    setNewShiftHalfDay("");
    setNewShiftFullDayMin("480");
    setNewShiftMinOT("");
    setOnlyTotalHours(false);
    setOrgWideFallback(false);
    setNewShiftDescription("");
  };

  // Export Shifts CSV
  const handleExportShiftsCSV = () => {
    const headers = ["SHIFT NAME", "CODE", "TIMING", "GRACE", "FULL DAY", "DEFAULT", "STATUS"];
    const rows = filteredShifts.map((s) => [
      `"${s.name}"`, s.code, s.timing, s.grace, s.fullDay, s.isDefault ? "Default" : "No", s.status
    ].join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Attendance_Shifts_Setup.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Attendance Setup
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Shifts, assignments, holidays, weekly-off rules and attendance policies &mdash; the reference data behind attendance.
        </p>
      </div>

      {/* ── Two-Column Layout: Inner Sidebar + Main View ── */}
      <div className="flex flex-col gap-6 md:flex-row items-start">
        {/* ── LEFT INNER SIDEBAR ── */}
        <aside className="w-full md:w-60 lg:w-64 shrink-0 space-y-6">
          {navSections.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {group.group}
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSubsection === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSubsection(item.id)}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all text-left",
                        isActive
                          ? "bg-pastel-teal/70 font-semibold text-foreground dark:bg-pastel-teal/20"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.count !== null && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            isActive
                              ? "bg-pastel-teal text-primary font-bold dark:bg-primary/20 dark:text-primary"
                              : "text-muted-foreground/80"
                          )}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* ── RIGHT MAIN SUB-VIEW CONTENT ── */}
        <div className="flex-1 min-w-0 w-full">
          {/* ========================================= */}
          {/* 1. SHIFTS SUBVIEW (As shown in screenshot) */}
          {/* ========================================= */}
          {activeSubsection === "shifts" && (
            <div className="space-y-4">
              {/* Subsection Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Shifts</h2>
                  <p className="text-xs text-muted-foreground">
                    A shift whose end time is on/before its start crosses midnight (night shift).
                  </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExportShiftsCSV}
                    className="gap-2 rounded-xl border-border bg-card text-xs font-medium hover:bg-muted"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsNewShiftModalOpen(true)}
                    className="gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-3.5 shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New shift</span>
                  </Button>
                </div>
              </div>

              {/* Filter Row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search shifts..."
                    value={shiftSearch}
                    onChange={(e) => setShiftSearch(e.target.value)}
                    className="h-9 pl-9 pr-3 rounded-xl border-border bg-card text-xs"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShiftFilterTab("Active")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                      shiftFilterTab === "Active"
                        ? "bg-pastel-teal text-primary font-semibold dark:bg-pastel-teal/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <span>Active</span>
                    <span className="text-[11px] font-bold">
                      {shifts.filter((s) => s.status === "Active").length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShiftFilterTab("Trash")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                      shiftFilterTab === "Trash"
                        ? "bg-pastel-teal text-primary font-semibold dark:bg-pastel-teal/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Trash</span>
                    <span className="text-[11px] font-bold">
                      {shifts.filter((s) => s.status === "Trash").length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Shifts Table */}
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/20 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3 min-w-[160px]">SHIFT</th>
                        <th className="px-4 py-3 min-w-[120px]">TIMING</th>
                        <th className="px-4 py-3 min-w-[120px]">GRACE IN/OUT</th>
                        <th className="px-4 py-3 min-w-[100px]">FULL DAY</th>
                        <th className="px-4 py-3 min-w-[100px]">DEFAULT</th>
                        <th className="px-4 py-3 min-w-[100px]">STATUS</th>
                        <th className="px-3 py-3 text-right min-w-[60px]"></th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border/60">
                      {filteredShifts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">
                            No shifts found matching current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredShifts.map((shift) => (
                          <tr key={shift.id} className="transition-colors hover:bg-muted/20">
                            {/* Shift */}
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-xs text-foreground">{shift.name}</div>
                              <div className="text-[11px] text-muted-foreground font-mono">{shift.code}</div>
                            </td>

                            {/* Timing */}
                            <td className="px-4 py-3.5 text-muted-foreground font-medium">
                              {shift.timing}
                            </td>

                            {/* Grace In/Out */}
                            <td className="px-4 py-3.5 text-muted-foreground">
                              {shift.grace}
                            </td>

                            {/* Full Day */}
                            <td className="px-4 py-3.5 text-muted-foreground">
                              {shift.fullDay}
                            </td>

                            {/* Default */}
                            <td className="px-4 py-3.5">
                              {shift.isDefault ? (
                                <span className="inline-block rounded-full bg-pastel-teal px-2.5 py-0.5 text-[11px] font-medium text-primary">
                                  Default
                                </span>
                              ) : (
                                <span className="text-muted-foreground">&mdash;</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span>{shift.status}</span>
                              </div>
                            </td>

                            {/* Action Menu */}
                            <td className="px-3 py-3.5 text-right">
                              <button
                                type="button"
                                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="More options"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
                  <div>Showing 1&ndash;{filteredShifts.length} of {filteredShifts.length}</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      className="p-1 rounded-lg text-muted-foreground/50 cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-medium text-foreground">1/1</span>
                    <button
                      type="button"
                      disabled
                      className="p-1 rounded-lg text-muted-foreground/50 cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* 2. SHIFT ASSIGNMENTS SUBVIEW */}
          {/* ========================================= */}
          {activeSubsection === "shift-assignments" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Shift assignments</h2>
                  <p className="text-xs text-muted-foreground">
                    Map individual employees, departments, or operations teams to designated shifts.
                  </p>
                </div>
                <Button className="gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Assign shift</span>
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="divide-y divide-border/60">
                  {[
                    { name: "Usman Raza", code: "EMP-3600", dept: "Sales", shift: "General (9–6)", date: "01 Sep 2026 – Ongoing" },
                    { name: "Saba Dar", code: "EMP-3599", dept: "Marketing", shift: "General (9–6)", date: "01 Sep 2026 – Ongoing" },
                    { name: "Omar Yousaf", code: "EMP-3598", dept: "Product", shift: "General (9–6)", date: "01 Sep 2026 – Ongoing" },
                    { name: "Rehan Ali", code: "EMP-3597", dept: "Engineering", shift: "Night (22–6)", date: "15 Aug 2026 – Ongoing" },
                    { name: "Haris Zafar", code: "EMP-1394", dept: "Engineering", shift: "Morning (6–2)", date: "01 Aug 2026 – Ongoing" },
                  ].map((emp, i) => (
                    <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <div className="font-semibold text-xs text-foreground">{emp.name}</div>
                        <div className="text-[11px] text-muted-foreground">{emp.code} &middot; {emp.dept}</div>
                      </div>
                      <div className="text-right">
                        <span className="rounded-full bg-pastel-teal px-2.5 py-0.5 text-xs font-medium text-primary">
                          {emp.shift}
                        </span>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{emp.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* 3. HOLIDAY CALENDARS SUBVIEW */}
          {/* ========================================= */}
          {activeSubsection === "holiday-calendars" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Holiday calendars</h2>
                  <p className="text-xs text-muted-foreground">
                    Regional, national, and location-based paid holiday schedules.
                  </p>
                </div>
                <Button className="gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium">
                  <Plus className="h-3.5 w-3.5" />
                  <span>New calendar</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">Standard Corporate Calendar 2026</span>
                    <span className="rounded-full bg-pastel-teal px-2.5 py-0.5 text-xs font-semibold text-primary">
                      Default
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Applies to all Headquarters, Tech Operations, and Remote personnel.
                  </p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60 text-muted-foreground">
                    <span>14 gazetted holidays</span>
                    <span>2,480 Employees</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">Plant &amp; Facility Calendar 2026</span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      Regional
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customized operational schedule for plant, logistics, and warehouse personnel.
                  </p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60 text-muted-foreground">
                    <span>11 gazetted holidays</span>
                    <span>120 Employees</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* 4. HOLIDAYS SUBVIEW */}
          {/* ========================================= */}
          {activeSubsection === "holidays" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Holidays</h2>
                  <p className="text-xs text-muted-foreground">
                    Public, religious, and gazetted paid holidays declared for the 2026 year.
                  </p>
                </div>
                <Button className="gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add holiday</span>
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="divide-y divide-border/60">
                  {[
                    { date: "01 Jan 2026", name: "New Year's Day", type: "Gazetted", status: "Upcoming" },
                    { date: "23 Mar 2026", name: "Pakistan Day", type: "Gazetted", status: "Completed" },
                    { date: "01 May 2026", name: "Labour Day", type: "Gazetted", status: "Completed" },
                    { date: "14 Aug 2026", name: "Independence Day", type: "Gazetted", status: "Completed" },
                    { date: "09 Nov 2026", name: "Iqbal Day", type: "Optional", status: "Upcoming" },
                    { date: "25 Dec 2026", name: "Quaid-e-Azam / Christmas", type: "Gazetted", status: "Upcoming" },
                  ].map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-pastel-teal/50 text-primary font-bold text-xs grid place-items-center">
                          {h.date.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-foreground">{h.name}</div>
                          <div className="text-[11px] text-muted-foreground">{h.date} &middot; {h.type}</div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {h.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* 5. WEEKLY-OFF RULES SUBVIEW */}
          {/* ========================================= */}
          {activeSubsection === "weekly-off-rules" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Weekly-off rules</h2>
                  <p className="text-xs text-muted-foreground">
                    Define rest days, standard weekend schedules, and rotating shift weekend off days.
                  </p>
                </div>
                <Button className="gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium">
                  <Plus className="h-3.5 w-3.5" />
                  <span>New rule</span>
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-foreground">
                    Standard Corporate Weekend (Saturday &amp; Sunday Off)
                  </div>
                  <span className="rounded-full bg-pastel-teal px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Default
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard 5-day work week rule with Saturday and Sunday designated as non-working paid rest days.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                    Monday &ndash; Friday: Full Day Working
                  </span>
                  <span className="rounded-lg bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-xs font-medium">
                    Saturday: Weekly Off (WO)
                  </span>
                  <span className="rounded-lg bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-xs font-medium">
                    Sunday: Weekly Off (WO)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* 6. LEAVE TYPES SUBVIEW */}
          {/* ========================================= */}
          {activeSubsection === "leave-types" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Leave types</h2>
                  <p className="text-xs text-muted-foreground">
                    Paid and unpaid leave classifications, encashment policy, and carry-forward caps.
                  </p>
                </div>
                <Button className="gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium">
                  <Plus className="h-3.5 w-3.5" />
                  <span>New leave type</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { name: "Annual / Earned Leave", code: "AL", quota: "18 days/yr", carry: "Max 10 days", encash: "Encashable at retirement" },
                  { name: "Casual Leave", code: "CL", quota: "10 days/yr", carry: "No carry forward", encash: "Lapses annually" },
                  { name: "Sick / Medical Leave", code: "SL", quota: "12 days/yr", carry: "No carry forward", encash: "Requires medical cert >2d" },
                  { name: "Leave Without Pay", code: "LWP", quota: "As requested", carry: "Deduction", encash: "Deducts 1 day payable" },
                ].map((lt, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{lt.name}</span>
                      <span className="font-mono text-xs font-bold text-primary bg-pastel-teal px-2 py-0.5 rounded-md">
                        {lt.code}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 pt-1">
                      <div>Quota: <strong>{lt.quota}</strong></div>
                      <div>Carry-forward: {lt.carry}</div>
                      <div>Rule: {lt.encash}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* 7. LEAVE ENTITLEMENTS SUBVIEW */}
          {/* ========================================= */}
          {activeSubsection === "leave-entitlements" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Leave entitlements</h2>
                  <p className="text-xs text-muted-foreground">
                    Seniority and employment tier quota allotments across staff cadres.
                  </p>
                </div>
                <Button className="gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Allocate quota</span>
                </Button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/20 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3">EMPLOYEE TIER</th>
                      <th className="px-3 py-3 text-center">ANNUAL (AL)</th>
                      <th className="px-3 py-3 text-center">SICK (SL)</th>
                      <th className="px-3 py-3 text-center">CASUAL (CL)</th>
                      <th className="px-4 py-3 text-center font-bold">TOTAL DAYS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {[
                      { tier: "Executive / Leadership (Tier 1)", al: 22, sl: 12, cl: 10, total: 44 },
                      { tier: "Senior Management (Tier 2)", al: 18, sl: 12, cl: 10, total: 40 },
                      { tier: "Professional & Staff (Tier 3)", al: 14, sl: 12, cl: 10, total: 36 },
                      { tier: "Contract / Intern Staff", al: 10, sl: 6, cl: 6, total: 22 },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-semibold text-foreground">{row.tier}</td>
                        <td className="px-3 py-3 text-center text-muted-foreground">{row.al}</td>
                        <td className="px-3 py-3 text-center text-muted-foreground">{row.sl}</td>
                        <td className="px-3 py-3 text-center text-muted-foreground">{row.cl}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* 8. ATTENDANCE POLICIES SUBVIEW */}
          {/* ========================================= */}
          {activeSubsection === "attendance-policies" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Attendance policies</h2>
                  <p className="text-xs text-muted-foreground">
                    Late-arrival grace limits, half-day deduction rules, biometric obligations, and OT multipliers.
                  </p>
                </div>
                <Button className="gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium">
                  <Plus className="h-3.5 w-3.5" />
                  <span>New policy</span>
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Standard Enterprise Attendance Policy 2026</h3>
                    <p className="text-xs text-muted-foreground">Active organizational attendance ruleset</p>
                  </div>
                  <span className="rounded-full bg-pastel-teal px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="font-semibold text-foreground">Grace Arrival Threshold</div>
                    <div className="text-muted-foreground mt-0.5">15 minutes past designated shift start</div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="font-semibold text-foreground">Late Arrival Penalty</div>
                    <div className="text-muted-foreground mt-0.5">3 late marks allowed/month; 4th mark = 0.5 day LOP</div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="font-semibold text-foreground">Half-Day Calculation</div>
                    <div className="text-muted-foreground mt-0.5">Less than 4.5 hours worked triggers half-day (HD)</div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="font-semibold text-foreground">Overtime Eligibility</div>
                    <div className="text-muted-foreground mt-0.5">Minimum 45 minutes past shift with manager approval</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add New Shift Modal ── */}
      <Dialog open={isNewShiftModalOpen} onOpenChange={setIsNewShiftModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl border-border bg-card p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              New Shift
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveNewShift} className="space-y-4 pt-2">
            <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-4">
              {/* Row 1: Shift name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Shift name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. General (9–6)"
                    value={newShiftName}
                    onChange={(e) => setNewShiftName(e.target.value)}
                    className="h-10 rounded-xl border-border bg-card text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Code</label>
                  <Input
                    placeholder="GEN"
                    value={newShiftCode}
                    onChange={(e) => setNewShiftCode(e.target.value)}
                    className="h-10 rounded-xl border-border bg-card text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Start time & End time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Start time <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="09:00"
                    value={newShiftStart}
                    onChange={(e) => setNewShiftStart(e.target.value)}
                    className="h-10 rounded-xl border-border bg-card text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    End time <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="18:00"
                    value={newShiftEnd}
                    onChange={(e) => setNewShiftEnd(e.target.value)}
                    className="h-10 rounded-xl border-border bg-card text-sm"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    End &le; start = night shift.
                  </p>
                </div>
              </div>

              {/* Row 3: Break & Grace in */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Break (min, unpaid)
                  </label>
                  <Input
                    type="number"
                    placeholder=""
                    value={newShiftBreak}
                    onChange={(e) => setNewShiftBreak(e.target.value)}
                    className="h-10 rounded-xl border-border bg-card text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Grace in (min)
                  </label>
                  <Input
                    type="number"
                    placeholder=""
                    value={newShiftGraceIn}
                    onChange={(e) => setNewShiftGraceIn(e.target.value)}
                    className="h-10 rounded-xl border-border bg-card text-sm"
                  />
                </div>
              </div>

              {/* Row 4: Grace out & Half-day threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Grace out (min)
                  </label>
                  <Input
                    type="number"
                    placeholder=""
                    value={newShiftGraceOut}
                    onChange={(e) => setNewShiftGraceOut(e.target.value)}
                    className="h-10 rounded-xl border-border bg-card text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Half-day threshold (min)
                  </label>
                  <Input
                    type="number"
                    placeholder=""
                    value={newShiftHalfDay}
                    onChange={(e) => setNewShiftHalfDay(e.target.value)}
                    className="h-10 rounded-xl border-border bg-card text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Worked below this = half day.
                  </p>
                </div>
              </div>

              {/* Row 5: Full day & Min OT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Full day (min)
                  </label>
                  <Input
                    type="number"
                    placeholder=""
                    value={newShiftFullDayMin}
                    onChange={(e) => setNewShiftFullDayMin(e.target.value)}
                    className="h-10 rounded-xl border-border bg-card text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Min OT (min)
                  </label>
                  <Input
                    type="number"
                    placeholder=""
                    value={newShiftMinOT}
                    onChange={(e) => setNewShiftMinOT(e.target.value)}
                    className="h-10 rounded-xl border-border bg-card text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    OT counted only beyond this.
                  </p>
                </div>
              </div>

              {/* Row 6: Toggles / Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div
                  onClick={() => setOnlyTotalHours(!onlyTotalHours)}
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3.5 cursor-pointer hover:border-border transition-colors select-none"
                >
                  <span className="text-xs font-medium text-foreground">
                    Only total hours checked (no late/early)
                  </span>
                  <Checkbox
                    checked={onlyTotalHours}
                    onCheckedChange={(c) => setOnlyTotalHours(!!c)}
                    className="ml-2"
                  />
                </div>

                <div
                  onClick={() => setOrgWideFallback(!orgWideFallback)}
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3.5 cursor-pointer hover:border-border transition-colors select-none"
                >
                  <span className="text-xs font-medium text-foreground">
                    Org-wide fallback shift
                  </span>
                  <Checkbox
                    checked={orgWideFallback}
                    onCheckedChange={(c) => setOrgWideFallback(!!c)}
                    className="ml-2"
                  />
                </div>
              </div>

              {/* Row 7: Description */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-foreground">Description</label>
                <Textarea
                  rows={3}
                  placeholder=""
                  value={newShiftDescription}
                  onChange={(e) => setNewShiftDescription(e.target.value)}
                  className="rounded-xl border-border bg-card text-sm resize-y"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <DialogFooter className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsNewShiftModalOpen(false)}
                className="rounded-xl text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium px-5 py-2 shadow-2xs"
              >
                Create shift
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
