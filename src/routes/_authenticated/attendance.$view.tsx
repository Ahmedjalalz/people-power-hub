import { createFileRoute } from "@tanstack/react-router";
import {
  AttendanceDashboardView,
  AttendanceRegisterView,
  ApplyLeaveView,
  PunchesView,
  MonthEndCloseView,
  AttendanceSetupView,
} from "@/components/attendance/AttendanceViews";

export const Route = createFileRoute("/_authenticated/attendance/$view")({
  head: ({ params }) => {
    const titles: Record<string, string> = {
      dashboard: "Attendance Dashboard — PeopleLens",
      register: "Attendance Register — PeopleLens",
      "apply-leave": "Apply Leave — PeopleLens",
      punches: "Punches & Time Clock — PeopleLens",
      "month-end-close": "Month-End Close — PeopleLens",
      setup: "Attendance Setup — PeopleLens",
    };
    return {
      meta: [
        {
          title: titles[params.view] || "Attendance — PeopleLens",
        },
      ],
    };
  },
  component: AttendanceViewPage,
});

function AttendanceViewPage() {
  const { view } = Route.useParams();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
      {(() => {
        switch (view) {
          case "dashboard":
            return <AttendanceDashboardView />;
          case "register":
            return <AttendanceRegisterView />;
          case "apply-leave":
            return <ApplyLeaveView />;
          case "punches":
            return <PunchesView />;
          case "month-end-close":
            return <MonthEndCloseView />;
          case "setup":
            return <AttendanceSetupView />;
          default:
            return <AttendanceDashboardView />;
        }
      })()}
    </div>
  );
}
