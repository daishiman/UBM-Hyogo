# fix-admin-server-components-render-error-stg

[実装区分: 実装仕様書]

> 判定根拠: 報告事象は staging /admin の Server Components render error（digest=167275886）。
> Phase 5 でコード修正（env 参照経路の是正・fallback 撤去・既存ハンドラの整流化）を行わない限り解消しないため、
> ドキュメント・調査のみで完結する余地はなく、CONST_004 のデフォルト（実装仕様書）に該当する。

## メタ情報

| 項目                  | 値                                                                       |
| --------------------- | ------------------------------------------------------------------------ |
| Task ID               | TASK-FIX-ADMIN-SCR-ERR-STG-001                                           |
| Feature 名            | fix-admin-server-components-render-error-stg                             |
| Task type             | implementation                                                          |
| visualEvidence        | NON_VISUAL（runtime/infra bugfix、UI 表示物の意匠変更なし）              |
| implementation_mode   | `new`                                                                    |
| workflow_state        | `implemented_local_runtime_pending`                                      |
| 影響 surface          | apps/web `/admin` 配下（layout + dashboard page + admin server-fetch）   |
| 関連 PR               | #849（admin dashboard runtime smoke via Playwright + mock-api）          |
| 発生環境              | Cloudflare Workers staging (`ubm-hyogo-web-staging.daishimanju.workers.dev`) |
| エラー digest         | `167275886`                                                              |
| 想定 1 cycle 完了     | はい（調査→修正→staging 再現確認→regression smoke 追加までを 1 PR）      |

## 報告事象（一次情報）

```
6622-77ebef8703bc834b.js:41 Error: An error occurred in the Server Components render.
The specific message is omitted in production builds to avoid leaking sensitive details.
A digest property is included on this error instance which may provide additional details
about the nature of the error.

global-error boundary log:
  scope: admin
  digest: 167275886
  event: error.boundary.caught
  ts: 2026-05-23T00:24:25.584Z
```

## 真の論点（task-specification-creator 思考法）

1. **真の論点**: production build 下では digest しか出ないため、まず stack trace を入手する経路（`wrangler tail` / Sentry）を仕様化することが先。原因仮説のコード修正に直行すると別の例外を踏む可能性がある。
2. **依存関係・責務境界**: `/admin` (admin/page.tsx) → `fetchAdmin()` → `process.env` 直接参照、という構造は **CLAUDE.md 不変条件「`apps/web` ランタイムでの env 参照は `getEnv()` 経由のみ・`process.env.*` 直接禁止」** に違反している。Cloudflare Workers + `@opennextjs/cloudflare` ランタイムでは `process.env` 経由で `[vars]` を読めない（または不完全な）ことが既知。
3. **価値とコストの不均衡**: env 参照経路の是正は単一 helper 修正で済む。認証フロー (`auth.ts`) は既存 `getCloudflareContext().env` / request header injection を持つ別境界なので、本タスクは `fetchAdmin` の env 参照修正＋fallback 撤去に絞る。
4. **改善優先順位**: ① stack trace 取得 → ② `fetchAdmin` の env 参照を `getEnv()` 経由に置換 → ③ `127.0.0.1:8787` fallback 撤去 → ④ staging 再現テスト → ⑤ regression smoke (Playwright admin dashboard runtime + 既存 #849) 追加。
5. **4条件評価**:
   - 価値性: admin 全機能の staging アクセス不能を解消、回帰防止
   - 実現性: 修正範囲は server-fetch.ts ＋ 必要なら同型違反ファイル 1〜2 個
   - 整合性: 既存 `getEnv()` schema・Cloudflare bindings・既存 API surface と整合
   - 運用性: regression smoke と sentry alert で再発検出可能

## Phase 構成

| Phase | 名称                 | 状態     | 出力先                                |
| ----- | -------------------- | -------- | ------------------------------------- |
| 1     | 要件定義             | completed | outputs/phase-1/phase-1.md            |
| 2     | 設計                 | completed | outputs/phase-2/phase-2.md            |
| 3     | 設計レビュー         | completed | outputs/phase-3/phase-3.md            |
| 4     | テスト作成           | completed | outputs/phase-4/phase-4.md            |
| 5     | 実装                 | completed | outputs/phase-5/phase-5.md            |
| 6     | テスト拡充           | completed | outputs/phase-6/phase-6.md            |
| 7     | カバレッジ確認       | completed | outputs/phase-7/phase-7.md            |
| 8     | リファクタリング     | completed | outputs/phase-8/phase-8.md            |
| 9     | 品質保証             | completed | outputs/phase-9/phase-9.md            |
| 10    | 最終レビュー         | completed | outputs/phase-10/phase-10.md          |
| 11    | 手動テスト           | runtime_pending | outputs/phase-11/phase-11.md          |
| 12    | ドキュメント更新     | completed | outputs/phase-12/phase-12.md          |
| 13    | PR作成               | pending_user_approval | outputs/phase-13/phase-13.md          |

## 不変条件（CLAUDE.md より）

- `apps/web` ランタイムの env 参照は `getEnv()` / `getPublicEnv()` 経由のみ（`process.env.*` 直接禁止）
- 127.0.0.1 等ローカル限定エンドポイントの `apps/web/src` 配下への焼き込み禁止
- D1 直接アクセスは `apps/api` に閉じる（`apps/web` から直接アクセス禁止）
- admin mutation は `@/features/admin/hooks/useAdminMutation` 経由
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ
- 既存 API endpoint surface のみ利用（新 endpoint 追加禁止）
- Cloudflare Workers production build (`next build --webpack`) 互換性維持

## DoD（Definition of Done）

- staging で `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin` が 200 で render される
- `error.boundary.caught` (scope=admin) が runtime smoke で発生しない
- 既存 Playwright admin dashboard runtime smoke（#849）が pass
- `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` が pass
- 新規 regression test (`*.spec.ts`) が追加され `getEnv()` 経由の Cloudflare env binding と localhost fallback 撤去を固定する
- `process.env["INTERNAL_API_BASE_URL"]` の `apps/web/src/lib/admin/` での参照が 0 件
