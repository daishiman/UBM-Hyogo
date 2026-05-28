import type { AttendanceZone } from "@ubm-hyogo/shared";

export function buildAttendanceExportUrlClient(f: {
  periodFrom: string | null;
  periodTo: string | null;
  zones: readonly AttendanceZone[];
}): string {
  const params = new URLSearchParams();
  if (f.periodFrom) params.set("periodFrom", f.periodFrom);
  if (f.periodTo) params.set("periodTo", f.periodTo);
  if (f.zones.length > 0) params.set("zone", f.zones.join(","));
  const q = params.toString();
  return `/api/admin/dashboard/attendance/export${q ? `?${q}` : ""}`;
}
