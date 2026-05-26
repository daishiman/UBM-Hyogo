export type ByZoneKey = "0to1" | "1to10" | "10to100";

export interface ByZoneSlice {
  key: ByZoneKey;
  label: string;
  hint: string;
  count: number;
  total: number;
  tone: "info" | "accent" | "ok";
}

const ZONE_META: Record<ByZoneKey, { label: string; hint: string; tone: ByZoneSlice["tone"] }> = {
  "0to1": { label: "0→1", hint: "立ち上げ", tone: "info" },
  "1to10": { label: "1→10", hint: "拡大", tone: "accent" },
  "10to100": { label: "10→100", hint: "組織化", tone: "ok" },
};

const ZONE_ORDER: ByZoneKey[] = ["0to1", "1to10", "10to100"];

const normalizeRawZone = (raw: string): ByZoneKey | null => {
  const v = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (v === "0→1" || v === "0-1" || v === "0to1") return "0to1";
  if (v === "1→10" || v === "1-10" || v === "1to10") return "1to10";
  if (v === "10→100" || v === "10-100" || v === "10to100") return "10to100";
  return null;
};

export function buildByZoneSlices(
  rawRows: ReadonlyArray<{ zone: string; count: number }>,
  totalMembers: number,
): ByZoneSlice[] {
  const counts: Record<ByZoneKey, number> = { "0to1": 0, "1to10": 0, "10to100": 0 };
  for (const r of rawRows) {
    const key = normalizeRawZone(r.zone);
    if (key === null) continue;
    counts[key] += Math.max(0, Math.trunc(r.count));
  }
  return ZONE_ORDER.map<ByZoneSlice>((key) => ({
    key,
    label: ZONE_META[key].label,
    hint: ZONE_META[key].hint,
    count: counts[key],
    total: Math.max(0, Math.trunc(totalMembers)),
    tone: ZONE_META[key].tone,
  }));
}
