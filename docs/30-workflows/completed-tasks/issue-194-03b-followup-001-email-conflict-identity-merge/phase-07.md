# Phase 7: AC マトリクス — issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書]

本 Phase は index.md の AC を実装ファイル / テストケース / 手動検証手順に一対一で紐づける。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-194-03b-followup-001-email-conflict-identity-merge |
| phase | 7 / 13 |
| wave | 04c-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| 更新日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 状態 | implementation-complete |
| 上流 | Phase 5 / Phase 6 |
| 下流 | Phase 8 DRY 化 |

## 目的

index.md の全 AC を、実装ファイル・自動テスト・手動 smoke 手順の三点でトレース可能にする。

## 参照資料

- docs/30-workflows/issue-194-03b-followup-001-email-conflict-identity-merge/index.md
- docs/30-workflows/issue-194-03b-followup-001-email-conflict-identity-merge/phase-05.md
- docs/30-workflows/issue-194-03b-followup-001-email-conflict-identity-merge/phase-06.md

## AC マトリクス（index.md AC 順）

| # | AC | 実装ファイル | 自動テスト | 手動検証手順 |
| -- | --- | --- | --- | --- |
| 1 | 完全一致判定基準 (`name` AND `affiliation`) が spec 化 | `apps/api/src/services/admin/identity-conflict-detector.ts` | `services/admin/identity-conflict-detector.test.ts` (5 件) | spec 本ドキュメント Phase 5 Step 3 を参照 |
| 2 | `GET /admin/identity-conflicts` が候補一覧を返す（pagination 対応） | `apps/api/src/routes/admin/identity-conflicts.ts` (L38) + `apps/api/src/repository/identity-conflict.ts:listIdentityConflicts` | `repository/__tests__/identity-conflict.test.ts > listIdentityConflicts` | staging で `curl -H Cookie: <admin>` `/admin/identity-conflicts?limit=50` |
| 3 | `POST /admin/identity-conflicts/:id/merge` が単一 D1 transaction で atomic | `apps/api/src/repository/identity-merge.ts:mergeIdentities` (`db.batch`) + `routes/admin/identity-conflicts.ts` (L54) | `identity-merge.test.ts > identity_aliases / identity_merge_audit / audit_log を atomic に書き込む` | UI で merge 実行 → 3 テーブル row 確認 |
| 4 | `POST /admin/identity-conflicts/:id/dismiss` が再検出から除外 | `apps/api/src/repository/identity-conflict.ts:dismissIdentityConflict` + route (L91) | `identity-conflict.test.ts > dismiss 後は候補から除外される` | dismiss 後に GET 一覧から消えることを確認 |
| 5 | merge 実行時に `identity_aliases.source_member_id -> target_member_id` が永続化、raw response 本文は移動・編集されない | `apps/api/migrations/0011_identity_aliases.sql` + `mergeIdentities` (INSERT only) | `identity-merge.test.ts` 全件で `member_responses` / `response_fields` への UPDATE 発行ゼロを assert | merge 後に `member_responses` row が pre-state と一致 |
| 6 | merge 完了後に canonical target が引ける | `apps/api/src/repository/identity-merge.ts:resolveCanonicalMemberId` | `identity-merge.test.ts > resolveCanonicalMemberId で merge 後 target が引ける` | API 応答と DB row 突合 |
| 7 | `identity_merge_audit` に actor / source / target / reason / merged_at が永続化 | migration 0010 + `mergeIdentities` step 6 | `identity-merge.test.ts > identity_aliases / identity_merge_audit / audit_log を atomic に書き込む` | row 検査 SQL で 5 列の値を確認 |
| 8 | admin UI で候補確認 / merge 二段階確認 / 別人マークができる | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` + `apps/web/src/components/admin/IdentityConflictRow.tsx` (stage state machine: idle → merge-confirm → merge-final) | — (manual smoke) | Phase 11 の visual evidence 取得手順 |
| 9 | 全 admin endpoint が require-admin で保護される（不変条件 #11/#13 二段防御） | `routes/admin/identity-conflicts.ts` L36 `app.use("*", requireAdmin)` + apps/web layout level admin gate | `require-admin` 既存 middleware test | 非 admin session で 401/403 を確認 |
| 10 | apps/web は D1 直参照せず apps/api 経由（不変条件 #5） | `app/(admin)/admin/identity-conflicts/page.tsx` が `fetchAdmin` を経由、generic `app/api/admin/[...path]/route.ts` proxy のみ使用 | コードレビューで自明 | grep で apps/web 配下に D1 binding 直参照なし |
| 11 | responseEmail は admin UI 上で部分マスク表示（不変条件 #3） | `packages/shared/src/schemas/identity-conflict.ts:maskResponseEmail` | `identity-conflict.test.ts` 内で API 応答に raw email を含めない assert | UI 描画で `u***@example.com` 形式を視認 |
| 12 | merge `reason` 内の email / 電話パターンは `[redacted]` に redact | `identity-merge.ts` 内 `redactReason` | `identity-merge.test.ts > PII redaction` | 手動: reason に email を含めて merge し audit row が `[redacted]` を含む |

## 検証実行コマンド

```bash
mise exec -- pnpm --filter @repo/api test
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 多角的チェック観点

- #1 / #3 / #5 / #11 / #13 すべての AC 行に紐づくこと（上記表で複数行カバー）
- 全 AC が「実装ファイル」「自動テストまたは手動検証」両方に紐づく

## 完了条件 (DoD)

- 全 12 AC が表に揃っている
- 各 AC 行が実装ファイルパス + テスト名 / 手動手順を持つ
- 不在の AC（実装漏れ）がない

## サブタスク管理

- [x] index.md AC を 1〜12 に正規化
- [x] 各 AC を実装ファイルとテストに紐付け
- [x] 手動検証手順が必要な AC を区別
- [x] outputs/phase-07/main.md を更新

## 成果物

- outputs/phase-07/main.md

## タスク100%実行確認

- [x] CONST_005 必須セクション充足
- [x] AC ↔ 実装 ↔ テスト の三方向トレースが成立
- [x] 03b 本体未改修（acceptance criteria 範囲外）

## 次 Phase への引き渡し

Phase 8 へ DRY 観点での Before / After 抽出基盤を渡す。
