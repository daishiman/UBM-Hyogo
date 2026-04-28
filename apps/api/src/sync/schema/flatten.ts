// Phase 5 擬似コード: flatten.ts
// RawForm.items[] → FlatQuestion[]（sectionIndex 採番）。
// AC-1: 31 項目・6 セクションの抽出を保証する基盤。
import type { RawFormItem } from "@ubm-hyogo/integrations-google";
import type { FlatQuestion } from "./types";

const detectKind = (item: RawFormItem): string => {
  if (item.questionItem?.question?.choiceQuestion) return "radio";
  if (item.pageBreakItem) return "pageBreak";
  return "shortText";
};

/**
 * RawForm.items[] を flat な質問配列に変換する。
 * - sectionHeaderItem 出現時に sectionIndex を ++ する。
 *   ただし最初の section は index=0 なので、先頭 item に section header が来る場合は
 *   先回りインクリメントを抑止する。
 * - questionItem を持たない item は skip する（pageBreak / sectionHeader は採番にのみ使う）。
 *
 * @param items RawForm.items（undefined の場合は空配列扱い）
 * @returns FlatQuestion[]（position は出力配列のインデックス）
 */
export function flatten(items: readonly RawFormItem[] | undefined): FlatQuestion[] {
  const list = items ?? [];
  const out: FlatQuestion[] = [];
  let sectionIndex = -1;
  let sectionTitle = "";
  let seenAnyQuestion = false;

  for (const item of list) {
    if (item.sectionHeaderItem) {
      sectionIndex += 1;
      sectionTitle = item.sectionHeaderItem.title ?? "";
      continue;
    }
    if (item.pageBreakItem) {
      continue;
    }
    if (!item.questionItem?.question?.questionId) {
      continue;
    }
    // 最初に質問が出る前に sectionHeader が無かった場合、section 0 とみなす。
    if (!seenAnyQuestion && sectionIndex < 0) {
      sectionIndex = 0;
    }
    seenAnyQuestion = true;
    const choiceOptions =
      item.questionItem.question.choiceQuestion?.options
        ?.map((o) => o.value)
        .filter((v): v is string => typeof v === "string") ?? null;
    out.push({
      questionId: item.questionItem.question.questionId,
      itemId: item.itemId ?? null,
      title: item.title ?? "",
      kind: detectKind(item),
      options: choiceOptions,
      sectionIndex: sectionIndex < 0 ? 0 : sectionIndex,
      sectionTitle,
      position: out.length,
      required: item.questionItem.question.required ?? false,
    });
  }

  return out;
}

/**
 * RawForm.items[] のうち sectionHeaderItem の数を数える。AC-1 の section count 検証用。
 */
export function countSections(items: readonly RawFormItem[] | undefined): number {
  return (items ?? []).filter((it) => Boolean(it.sectionHeaderItem)).length;
}
