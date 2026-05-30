# Unassigned Task Detection（Issue #987 dismiss 監査ログ対称化）

未タスク（本サイクルのスコープ外で、別途検討・起票しうる作業）の検出記録。0 件でも本ファイルは必須。

## ソース別確認

| ソース | 確認結果 |
| --- | --- |
| 元仕様書スコープ外の作業 | 新規未タスク 0 件。検討した任意案は根本解決に不要な no-op または user-gated runtime 確認として分類 |
| Phase 3 / Phase 10 の MINOR 指摘 | MINOR-1/2 は下記 no-op 1/2 として明示分類。新規未タスクなし |
| Phase 11 で発見した事項 | NON_VISUAL のため新規 UI 課題なし。staging runtime smoke 自動化は user-gated ops 領域であり、本サイクルの未タスクにはしない |
| TODO / FIXME コメント | 本タスク対象ファイル（`identity-conflict.ts` / `identity-conflicts.ts`）に新規 TODO/FIXME を残さない方針。検出なし |
| `describe.skip` / skip テスト | 追加するテスト（contract spec 2 件）に skip を残さない方針。検出なし |

## 検討した no-op

### follow-up 1（旧 no-op 1 → formalize 上書き）: AuditLogPanel への action プリセット選択肢追加

- 内容: `apps/web/src/components/admin/AuditLogPanel.tsx` の action フィルタに `identity.merge` / `identity.dismiss` のプリセット選択肢（ドロップダウン候補）を追加する UX 改善。
- 当初判定: no-op。既存 action フィルタ（自由入力）で `identity.dismiss` の閲覧は成立するため、根本解決（dismiss を監査ログに残す）には不要。本体実装からは除外。
- **上書き（close-out 時）**: 本体スコープ外の純 UI 改善ではあるが、後続トラッキング対象として **formalize** した。`docs/30-workflows/unassigned-task/task-issue-987-followup-001-audit-log-action-presets.md` + **Issue #1039**（`type:followup` / `area:admin-ui` / `area:web` / `scale:small` / `wave:2-plus` / `priority:low`）。根本解決（dismiss 監査記録）は本サイクルで完了済みであり、本 follow-up は Wave 2+ の操作性改善として独立消化する。boundary 判定が no-op でも close-out で formalize する運用（[[lessons-learned-issue-987-identity-conflicts-audit-log-admin-ui-2026-05]] / L-FU003-UNTASK-002 系）に従う。

### no-op 2: merge / dismiss の audit_log INSERT 共通ヘルパ抽出

- 内容: `identity-merge.ts` と `identity-conflict.ts` で重複する `audit_log` INSERT 文・brand 付与・before/after_json 組み立てを共通ヘルパ（例: `buildAuditLogStmt()`）に抽出するリファクタ。
- 判定: no-op。根本解決（dismiss 対称化）は既存 merge の列順をそのまま踏襲すれば達成でき、共通化は必須ではない。2 箇所だけの抽象化は過剰設計のため起票しない。

### no-op 3: identity.dismiss staging runtime smoke 自動化

- 内容: staging に対する authenticated dismiss → `/admin/audit?action=identity.dismiss` runtime smoke を自動化する。
- 判定: no-op / user-gated runtime 確認。今回の根本解決は repository / route contract と focused D1 Vitest で担保する。staging deploy・認証付き操作・Cloudflare runtime 確認はユーザー承認後の Phase 13 / external ops 境界であり、本サイクル内の未タスクとして起票しない。

## 重複起票チェック / 関連タスク差分確認

| 関連 | 重複判定 |
| --- | --- |
| Issue #989（manualMergeReason schema 拡張） | 別課題（merge reason 入力 UX）。本タスクの dismiss 監査記録とは責務が異なり重複なし |
| 親サイクル `admin-identity-conflicts-prototype-alignment-and-404-fix` の既存 FU 群 | 候補 1/2 は既存 FU と重複しない（既存 FU は UI prototype 整合 / 404 観測系） |
| follow-up 1（action presets）/ no-op 2 / no-op 3 同士 | 互いに独立。follow-up 1 のみ close-out で formalize、no-op 2 は過剰設計、no-op 3 は user-gated runtime 境界 |
| Issue #1039（action presets follow-up） | follow-up 1 を formalize したもの。本タスクの dismiss 監査記録（根本解決）とはスコープが異なり重複なし |

## 判定

本サイクルの根本解決（dismiss を `audit_log.action='identity.dismiss'` へ記録）は完了済み。close-out で formalize した未タスクは **1 件**:

- **follow-up 1 / Issue #1039**: `/admin/audit` action フィルタへの identity 操作プリセット追加（純 UI 改善・Wave 2+・`docs/30-workflows/unassigned-task/task-issue-987-followup-001-audit-log-action-presets.md`）。

残る no-op 2（共通ヘルパ抽出＝過剰設計）/ no-op 3（staging runtime smoke 自動化＝user-gated runtime 境界）は起票せず、TODO コメント・バックログ送りもしない。TODO/FIXME/skip の対象ファイル残存も 0 件。
