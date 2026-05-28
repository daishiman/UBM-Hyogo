# Phase 11: 手動テスト（NON_VISUAL）

## 11.1 NON_VISUAL 宣言（WEEKGRD-03 / Feedback 4 準拠）

| 項目                  | 値                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------- |
| タスク種別            | NON_VISUAL（バックエンド env 参照経路バグ + Server Component error handling 整流化、UI 表示物の意匠変更なし） |
| スクリーンショット    | 不要（既存 profile UI は変更なし）                                                          |
| 代替証跡 (主ソース)   | (1) staging 実機 `curl -I /profile` の `200 OK` 応答                                      |
|                       | (2) `wrangler tail` で `error.boundary.caught (scope=profile, digest=398449091)` が新規発生しないこと |
|                       | (3) focused Vitest spec の PASS ログ                                                       |
| 作らない理由          | 表示要素・レイアウト・トークン・配色いずれにも変更がないため。runtime 200 で機能継続を担保 |
| 関連 `ui-sanity-visual-review.md` | NON_VISUAL のため非該当（冒頭に「NON_VISUAL宣言・非視覚的バグ修正・代替証跡=staging 200 + tail clean」を記載） |

## 11.2 staging 再現テスト手順

```bash
# 1. staging に deploy
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# 2. tail を起動（別 terminal）
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging --format pretty

# 3. ブラウザで /profile を開く（要 login 済み cookie）
#    https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile

# 4. 期待:
#    - 200 で render される（/profile/error.tsx boundary に到達しない）
#    - tail に `error.boundary.caught` (scope=profile, digest=398449091) が出ない
#    - プロフィール本体（ProfileHeader / StatusBanner / VisibilitySummary / ProfileFields 等）が表示される
```

エビデンスは `outputs/phase-11/manual-test-result.md` に記録。

## 11.3 Phase 11 evidence 表

| Classification | Path | Status | Result |
| --- | --- | --- | --- |
| focused Vitest | outputs/phase-11/evidence/focused-vitest.log | present | PASS: 3 files / 43 tests |
| web typecheck | outputs/phase-11/evidence/typecheck.log | present | PASS: `pnpm --filter @ubm-hyogo/web typecheck` |
| web lint | outputs/phase-11/evidence/web-lint.log | present | PASS: `pnpm --filter @ubm-hyogo/web lint` |
| staging `/profile` curl | outputs/phase-11/evidence/staging-profile-curl.log | pending_user_approval | placeholder |
| `wrangler tail` clean (scope=profile) | outputs/phase-11/evidence/staging-profile-tail.log | pending_user_approval | placeholder |
| grep gate (`process.env[` 0 / `127.0.0.1` 0) | outputs/phase-11/evidence/static-source-guard.log | present | PASS |

## 11.4 manual-test-result.md テンプレート

`outputs/phase-11/manual-test-result.md` に local evidence を記録済み。staging deploy 後に runtime evidence 行のみ追記する。テンプレートは admin 側 `docs/30-workflows/fix-admin-server-components-render-error-stg/outputs/phase-11/manual-test-result.md` に準拠する。

## 11.5 Phase 11 着手チェック（Feedback 3）

- Phase 1 で記録した分類: NON_VISUAL → Phase 11 着手時の判定と一致。再分類不要。
