# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 1 / 13 |
| 実装区分 | 実装仕様書 |
| taskType | implementation（existing-hardening / 既存実装の正本記述） |
| visualEvidence | VISUAL_ON_EXECUTION |
| created | 2026-06-01 |

## 目的

`admin/sync-status` 画面に「公開状態 backfill」操作パネルを与え、**公開同意済みで `publish_state='member_only'` のまま滞留している会員**を、
管理者が画面操作だけで救済（dry-run 確認 → apply 昇格）できる状態にする。実救済ロジックは実装済み endpoint
`POST /admin/sync/backfill-publish-state`（変更不要）に委ね、本タスクは **web の UI 導線のみ**を責務とする。

## Step 0: P50 チェック（既存実装状態の確定）【必須】

`git log` / `ls` で対象ファイルの実装状態を確認した結果、**Task A は既に実装され dev へマージ済み**である。

```
$ git log --oneline -1 -- apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx
745c95115 feat(member-publish-recovery): Google Form 反映運用 + Admin Link 導線を dev へ統合 (#1064)
```

| 成果物 | 実パス | 実装状態 |
|--------|--------|----------|
| zod schema + 型 + path 定数 | `apps/web/src/features/admin/diagnostics/backfill.ts` | 実装済み |
| 操作パネル | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` | 実装済み |
| パネル単体テスト | `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx`（TC-A1..A7） | 実装済み |
| schema テスト | `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | 実装済み（co-located） |
| page mount | `apps/web/app/(admin)/admin/sync-status/page.tsx:6,128` | 実装済み |
| 救済 endpoint（変更不要） | `apps/api/src/routes/admin/sync-backfill-publish-state.ts` + mount `apps/api/src/index.ts:287` | 実装済み |

> **本仕様書の位置づけ**: greenfield 新規実装ではなく、landed 実装を Phase 1-13 の正本タスク仕様書として記述する。
> 後続実装者が再実装する場合も、本仕様書の手順で同一の成果物に収束する（再実装は実コードへ no-op）。

### 元タスクファイルとの乖離補正（実コードを正本とする）

| 項目 | 元タスクファイル A | 実コード（正本） |
|------|-------------------|------------------|
| proxy path 定数 | `"/api/admin/sync/responses?fullSync=true-publish-state"`（文字列破損） | `"/api/admin/sync/backfill-publish-state"` |
| schema テスト配置 | `diagnostics/__tests__/backfill.spec.ts`（新規） | `diagnostics/__tests__/sync-schemas.spec.ts`（既存に co-locate） |
| apply ガード | 記述なし | dry-run 先行必須（`canApply`）+ `globalThis.confirm` |
| 結果描画 | `<table>` | `<dl>` グリッド |
| ボタン busy 表示 | 記述なし | `activeMode` state で in-flight 操作を分離し押下ボタンのみ busy 表示 |

## 実行タスク

1. 公開判定 3 条件 AND の根本原因を確定する（RC-1..RC-4）。
2. 救済 endpoint のレスポンス契約（`BackfillResult`）を確定する。
3. UI の責務境界（endpoint 不変・web のみ）を確定する。
4. AC-A1..A4 を番号付きで定義する。

## 根本原因（確定）

| # | 事実 | 根拠 |
|---|------|------|
| RC-1 | 公開判定は `public_consent='consented' AND publish_state='public' AND is_deleted=0` の 3 条件 AND | `apps/api/src/repository/publicMembers.ts:37-39` |
| RC-2 | `publish_state` 初期値は `member_only`。public 昇格は auto-publish + sync 実行時のみ | `apps/api/migrations/0002_admin_managed.sql:13`, `apps/api/src/lib/policies/auto-publish.ts` |
| RC-3 | 「以前許可した」会員は consent 済みでも `member_only` のまま滞留しうる | RC-1/RC-2 から導出 |
| RC-4 | 救済 endpoint は実装済みだが web UI 導線が無い（本タスクで付与） | `apps/api/src/routes/admin/sync-backfill-publish-state.ts` |

## 受け入れ基準（AC）

- **AC-1（=AC-A1）**: 管理者が `admin/sync-status` から **dry-run** を実行し、`scanned / candidates / skipped` の内訳を確認できる（DB 無変更）。
- **AC-2（=AC-A2）**: 管理者が **apply** を実行し、同意済み×`member_only` が `public` へ昇格、`applied` 件数が表示される。
- **AC-3（=AC-A3）**: apply は admin override（hidden / 非 system updated_by）と is_deleted を尊重しスキップする。`skipped.{alreadyPublic, adminExplicit, consentNotMet, deleted}` を結果に可視化する。
- **AC-4（=AC-A4）**: mutation は `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10）。legacy `@/lib/useAdminMutation` を import しない。

## スコープ外（やらないこと）

- API endpoint・D1 schema・migration・Google Form schema の変更（親 AC-G2）。`apps/api` に触れない。
- Task B（手動 form sync UI）/ Task C（SLA 表示）/ Task D（外部リンク）の責務。
- 新規 primitive の追加（既存 `Button` / `AdminSectionCard` を再利用、不変条件 §3）。

## 参照資料

| 参照 | パス | 内容 |
|------|------|------|
| 親要件 | `../task-member-publish-recovery-form-ops-and-admin-link/phase-1.md` | §3 Task A AC-A1..A4 |
| 元タスクファイル | `../task-member-publish-recovery-form-ops-and-admin-link/tasks/A-publish-state-backfill-admin-ui.md` | Task A 原文 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | consent / publish 項目 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/` | 既存設計整合 |

## 統合テスト連携

- 本タスクは web 単体（admin UI）。endpoint 側 contract は `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts`（D1 in-memory）が担保済み。
- web 側は `BackfillResultSchema.safeParse` による契約検証 + パネル単体テスト（jsdom）で endpoint を信頼しない。

## 多角的チェック観点（AIが判断）

- proxy 経由で `Authorization: Bearer SYNC_ADMIN_TOKEN` が server-only 注入される前提（Task B に集約）への依存を Phase 2 で明示する。
- `useAdminMutation` の `endpointOverride` 第2引数で dry-run/apply の query 切替が成立するか（hook 1 インスタンス）。

## サブタスク管理

| ID | 内容 | Phase |
|----|------|-------|
| S-1 | schema + path 定数（`backfill.ts`） | 5 |
| S-2 | 操作パネル（`BackfillPublishStatePanel.client.tsx`） | 5 |
| S-3 | page mount | 5 |
| S-4 | パネル単体テスト + schema テスト | 4 / 6 |

## 成果物

- `outputs/phase-1` 相当の本ファイル（要件確定）。

## 完了条件

- [x] P50 で既存実装状態を確定した（implemented / merged via #1064）。
- [x] AC-1..AC-4 を番号付きで定義した。
- [x] 元タスクファイルの corrupted endpoint path を実コードへ補正した。
- [x] スコープ外（endpoint/D1/Form 不変）を固定した。
- [x] coverage AC（apps/web 既定閾値 >=80%）を適用対象として宣言した。

## タスク100%実行確認【必須】

- [x] 要件・根本原因・AC・スコープ外を全て記述。
- [x] Phase 4 着手前ゲート（Phase 1-3 完了必須）を明記。

## 次Phase

Phase 2（設計）。Phase 1-3 完了まで Phase 4 へ進まない。
