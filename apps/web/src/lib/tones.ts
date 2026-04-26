export type ChipTone = "stone" | "warm" | "cool" | "green" | "amber" | "red";

export function zoneTone(zone: string): ChipTone {
  if (zone === "0_to_1") return "cool";
  if (zone === "1_to_10") return "warm";
  if (zone === "10_to_100") return "amber";
  return "stone";
}

export function statusTone(status: string): ChipTone {
  if (status === "member") return "green";
  if (status === "academy") return "cool";
  return "stone";
}
