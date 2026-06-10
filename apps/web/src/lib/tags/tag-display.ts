import type { PublicMemberTag } from "@ubm-hyogo/shared";

const TAG_LABEL_OVERRIDES: Record<string, string> = {
  int_0to1: "0→1",
  int_1to10: "1→10",
  int_10to100: "10→100",
};

const CARD_CATEGORY_ORDER: Record<string, number> = {
  interest: 0,
  business: 1,
  skill: 2,
};

const HIDDEN_CATEGORIES = new Set(["region", "role", "status"]);

export interface CardTag {
  code: string;
  label: string;
  category: string;
  isPhase: boolean;
}

export function normalizeTagLabel(
  tag: Pick<PublicMemberTag, "code" | "label">,
): string {
  return TAG_LABEL_OVERRIDES[tag.code] ?? tag.label;
}

export function selectCardTags(
  tags: readonly PublicMemberTag[] | undefined,
  density: "comfy" | "dense" | "list",
): CardTag[] {
  if (!tags || tags.length === 0) return [];

  const visible = tags
    .filter((tag) => {
      if (HIDDEN_CATEGORIES.has(tag.category)) return false;
      return Object.prototype.hasOwnProperty.call(CARD_CATEGORY_ORDER, tag.category);
    })
    .map((tag) => ({
      code: tag.code,
      label: normalizeTagLabel(tag),
      category: tag.category,
      isPhase: tag.category === "interest",
    }))
    .sort(
      (a, b) =>
        CARD_CATEGORY_ORDER[a.category] - CARD_CATEGORY_ORDER[b.category] ||
        a.code.localeCompare(b.code),
    );

  const phase = visible.filter((tag) => tag.isPhase);
  const rest = visible.filter((tag) => !tag.isPhase);
  if (density === "list") return phase.slice(0, 1);

  const restLimit = density === "dense" ? 2 : 3;
  return [...phase.slice(0, 1), ...rest.slice(0, restLimit)];
}

export function phaseTone(code: string): "cool" | "warm" | "amber" | "stone" {
  if (code === "int_0to1") return "cool";
  if (code === "int_1to10") return "warm";
  if (code === "int_10to100") return "amber";
  return "stone";
}
