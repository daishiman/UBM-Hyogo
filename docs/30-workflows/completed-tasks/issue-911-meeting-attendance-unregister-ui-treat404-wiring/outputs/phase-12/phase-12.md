**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

# Phase 12: ドキュメント更新 / 集約サマリ

issue #911 (meeting attendance unregister UI / `treat404AsSuccess` 配線) workflow の Phase 1-13 成果物と最終 verdict を集約する。本ファイルは Phase 12 strict 7 のの「サマリ entry」で、ハブ詳細は `main.md` を参照。canonical 9 headings 検証は `phase12-task-spec-compliance-check.md` に分離。

## 1. 状態

- 本仕様書時点: `implemented_local_evidence_captured`（Phase 1-13 全 spec 作成済み・実装完了）
- 実装完了後の終端: `implementation_completed`（PR merge + user approval 後）
- visualEvidence: `NON_VISUAL`

## 2. Part 1: 中学生レベル概念説明

出欠管理の「解除ボタン」を作ります。すでに別の人が解除済みのときは、エラーで止まらず「もう解除済みです」と知らせて、見た目を解除状態にそろえます。裏のデータベース仕組みはそのままで、画面側にひと工夫を入れるだけです。

## 3. Part 2: 技術者レベル要約

- 実装: `MeetingAttendancePanel.tsx` に解除 CTA + 第 2 mutation (`POST attended:false` + `treat404AsSuccess: { toast: "既に解除済みです" }` + `refreshOnSuccess: false`) を追加
- 既存 hook (`useAdminMutation`) / API (`POST /api/admin/meetings/:id/attendances`) は無改変
- spec: `MeetingAttendancePanel.spec.tsx` に A1..A8 既存互換 + B1..B5 unregister cases を追加
- evidence: vitest ログのみで NON_VISUAL 判定

## 4. Local validation

| # | コマンド | 期待 |
|---|---|---|
| 1 | vitest MeetingAttendancePanel | exit 0 / 14 tests pass |
| 2 | vitest useAdminMutation 無回帰 | exit 0 |
| 3 | typecheck | exit 0 |
| 4 | lint | exit 0 |
| 5 | DELETE-race caller 棚卸し | 0 件 or 既知 caller のみ |
| 6 | verify:phase12-compliance | PASS |

## 5. 重要不変条件

1. API endpoint surface 無改変（UI prototype alignment 不変条件 1）
2. `useAdminMutation` hook 本体無改変・`treat404AsSuccess` は component options 渡し
3. register / unregister は別 mutation・`treat404AsSuccess` は unregister 側のみ
4. `*.spec.tsx` 命名強制（CLAUDE.md 不変条件 8）
5. legacy `@/lib/useAdminMutation` 新規参照禁止（CLAUDE.md 不変条件 10）
6. strict 7 を `outputs/phase-12/` に正規ファイル名で配置

## 6. 次 Phase への引き継ぎ

Phase 13 で base=`dev` の PR を user-gated 作成。`Refs #911` 文言は user 承認時に最終確定。completed-tasks 移動・親 workflow back-reference 更新・indexes:rebuild は同 wave で実施。

## 7. 実装ログ

本サイクルで実装済み。Phase 11 local evidence は保存済み。

| 実施日 | コマンド | 結果 | log path |
|---|---|---|---|
| 2026-05-25 | vitest MeetingAttendancePanel | 14 tests PASS | outputs/phase-11/vitest-meeting-attendance-panel.log |
| 2026-05-25 | vitest useAdminMutation | 33 tests PASS | outputs/phase-11/vitest-use-admin-mutation.log |
| 2026-05-25 | web typecheck | PASS | outputs/phase-11/typecheck.log |
| 2026-05-25 | web lint | PASS | outputs/phase-11/lint.log |

## 8. 未解決事項

| 項目 | 状態 |
|---|---|
| 実装完了 | completed |
| vitest / typecheck / lint 実測 | completed |
| commit / push / PR | user-gated 待ち |
| 親 workflow (issue-842) back-reference 更新 | Phase 13 wave で実施 |

## 9. 参考リンク

- 親 workflow: `docs/30-workflows/issue-842-*`（UI prototype alignment serial / meeting attendance 系列）
- 既存 API: `apps/api/src/routes/admin/meetings.ts:200-249`
- 既存 policy: `apps/web/src/features/admin/hooks/useAdminMutation.ts:30-31, 47-48, 240-246`
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/911
