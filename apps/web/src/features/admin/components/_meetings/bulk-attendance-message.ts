import type { ImportAttendanceSummary } from "../../../../lib/admin/api";

export function bulkFailureMessage(summary: ImportAttendanceSummary): string {
  const details = [
    summary.duplicate > 0 ? `出席済 ${summary.duplicate}` : null,
    summary.deletedMember > 0 ? `削除済 ${summary.deletedMember}` : null,
    summary.unknownMember > 0 ? `不明 ${summary.unknownMember}` : null,
    summary.invalid > 0 ? `不正 ${summary.invalid}` : null,
  ].filter(Boolean);

  if (details.length === 0) {
    return "一括追加できませんでした。選択内容を確認してください";
  }
  return `一括追加できませんでした（${details.join(" / ")}）`;
}
