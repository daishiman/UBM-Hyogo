# 手動テスト手順 — publish-state-backfill-admin-ui

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| 実行環境 | staging（admin login 必須） |
| 前提 | Task B の proxy `Authorization: Bearer ${SYNC_ADMIN_TOKEN}` server-only 注入が完了していること（NO-GO-1） |
| ステータス | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING（runtime 実行は user-gated） |

## 前提条件

- Task B の admin catch-all proxy（`apps/web/app/api/admin/[...path]/route.ts`）が `Authorization` を注入済み。未注入なら backfill endpoint が 401 で到達不能（実行不可）。
- staging に「公開同意済み（`public_consent='consented'`）かつ `publish_state='member_only'`」の会員が 1 件以上存在すること（dry-run 候補を発生させるため）。

## 手順

| # | 操作 | 期待結果 | 対応 ST |
|---|------|----------|---------|
| 1 | admin として staging にログイン | admin 画面へ遷移 | — |
| 2 | `/admin/sync-status` を開く | ページ末尾に「公開状態 backfill」カード（`AdminSectionCard`）が表示される。dry-run=enabled / apply=disabled | ST-1 |
| 3 | dry-run ボタンを押下 | `<dl>` に `mode=dryRun` / `scanned` / `candidates` / `applied(=0)` / `skipped.*` × 4 が表示される | ST-2 |
| 4 | members 一覧で対象会員の `publish_state` を確認 | dry-run では DB が無変更（`member_only` のまま） | AC-A1 |
| 5 | dry-run の `candidates > 0` を確認 | apply ボタンが enabled になる | ST-3 解除 |
| 6 | apply ボタンを押下 → confirm で「OK」 | `<dl>` に `mode=apply` / `applied`（昇格件数）が表示される | ST-4 |
| 7 | members 一覧で対象会員の `publish_state` を再確認 | 同意済み×member_only が `public` へ昇格している | AC-A2 |
| 8 | apply 押下 → confirm で「キャンセル」 | 何も実行されない（no-op）。直近の結果がそのまま残る | TC-A2c |
| 9 | （異常系）endpoint を 5xx に擬似 → dry-run | `<p role="alert">` に error message。結果 `<dl>` 非表示 | ST-5 |
| 10 | （異常系）不正レスポンスを返す | `<p role="alert">` に `backfill result schema mismatch`。結果 `<dl>` 非表示 | ST-6 |

## 撤退条件

- 手順 6 で意図しない会員（admin override / is_deleted）が昇格した場合は即時停止し、`skipped.{adminExplicit,deleted}` のカウントを再確認（AC-A3 違反の疑い）。

## runtime evidence

- 本手順は staging user-gated。本サイクルでは実行せず、screenshot は `screenshot-plan.json`（全 pending）の通り後続で取得。
