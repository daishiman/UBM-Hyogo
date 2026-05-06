# Phase 7: AC マトリクス

実装区分: 実装仕様書

## 7.1 AC × test × 不変条件 × evidence

| AC | 内容 | tests | 不変条件 | evidence |
| --- | --- | --- | --- | --- |
| AC-1 | 既存 `addAttendance` / `removeAttendance` contract を write 正本化 | T1 | #5 | `attendance.test.ts` PASS、`attendance.ts` 現行実装 |
| AC-2 | `upsert` の事前チェック + UNIQUE 違反 → duplicate | T1, T2, T3, T4, T5 | #4, #5 | 単体テスト PASS |
| AC-3 | `softRemove` 冪等動作 | T6, T7 | #5 | 単体テスト PASS |
| AC-4 | `AttendanceRecordId` / Writer 抽象を導入せず、実 contract を維持 | T8 | interface 不変 | typecheck PASS、grep evidence |
| AC-5 | admin route が 05a gate 経由 + audit log 必須 | T9, T10, T13 | admin gate 中継 | route テスト PASS、audit_log 確認クエリ |
| AC-6 | 削除済み meeting / 削除済み member / unknown → 404 / 409 | T3, T4, T5, T11, T12 | #4 | route テスト PASS、curl evidence |
| AC-7 | 楽観排他 / softRemove 冪等のテスト網羅 | T2, T6, T7 | #5 | 単体テスト PASS |
| AC-8 | upsert 直後の read 観測、softRemove 直後の read 不在 | T14, T15 | MemberProfile.attendance 不変 | 統合テスト PASS |
| AC-9 | typecheck / lint / build / test 全通過 | T16, T17 | — | CI green |
| AC-10 | curl evidence 4 ケース | — | — | `outputs/phase-11/evidence/api-curl/*.json` |
| AC-11 | 02a Phase 12 unassigned-task 解消反映 | — | — | `outputs/phase-12/unassigned-task-detection.md` |

## 7.2 トレース完全性チェック

- AC-1〜11 すべてが少なくとも 1 つの test または evidence にマップされている → ✅
- 不変条件 #1, #4, #5, MemberProfile.attendance, admin gate がそれぞれ 1 つ以上の AC にマップされている → ✅
- 13 phases の各 phase outputs に該当 AC の根拠が残る → ✅

## 7.3 完了判定

- 7.1 マトリクスの全行が green（実装後に評価）
- 不足列があれば Phase 5 ランブックに戻り test を追加

## 7.4 DoD

- マトリクスが Phase 5 完了後に全 cell 充足
- Phase 11 evidence が AC-10 を満たす
- Phase 12 が AC-11 を満たす
