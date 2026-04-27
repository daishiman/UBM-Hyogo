# Phase 9 outputs — 品質保証サマリ

## 概要

ut-11 の品質保証ゲート結果をまとめる。`pnpm typecheck` / `pnpm lint` / `pnpm build` の 3 ゲートに加え、line budget / link / mirror parity / gitleaks / 不変条件 #5 違反チェック / 無料枠 / a11y / Edge runtime 互換を一括検査し、Phase 10 の GO/NO-GO 判定の根拠とする。本タスクで対象となる secrets は `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` の 4 種。

## 品質ゲート結果（期待値）

| ゲート | 期待 |
| --- | --- |
| `mise exec -- pnpm typecheck` | error 0 |
| `mise exec -- pnpm lint` | error 0、`node:crypto` import 禁止ルール pass |
| `mise exec -- pnpm build` | apps/web / apps/api 両 success |
| unit test (apps/web filter) | Phase 4 U-XX 全件 green |
| contract test | Phase 4 C-XX 全件 green |
| E2E (mock OAuth) | E-01〜E-06 全件 green |
| a11y (axe-core) | violation 0 |
| gitleaks | finding 0 |

## line budget / link / mirror parity

- 各 phase ファイルが 240 行以下、index.md / outputs main.md が 200 行以下
- 相対パスリンクは全解決、AC 番号が phase-07 と他 phase で一致
- index.md ↔ phase-XX.md ↔ outputs/phase-XX/ の整合（成果物表のパスがすべて存在）
- artifacts.json と phase ファイルの status / wave / 種別が一致

## secret hygiene（gitleaks H-01〜H-08）

| # | 観点 | 期待 |
| --- | --- | --- |
| H-01 | `SESSION_SECRET` 値リポジトリ不在 | finding 0 |
| H-02 | 実 email がドキュメントに不在 | example.com のみ |
| H-03 | `apps.googleusercontent.com` 値不在 | placeholder のみ |
| H-04 | `GOCSPX-*` 不在 | finding 0 |
| H-05 | `.env` / `.dev.vars` 未コミット | 0 件 |
| H-06 | `wrangler.toml` に値直書きなし | name 参照のみ |
| H-07 | 認証値が docs に不在 | 0 件 |
| H-08 | `.dev.vars` が `.gitignore` に存在 | hit |

## 不変条件 #5 違反チェック

| # | 観点 | 期待 |
| --- | --- | --- |
| I5-01 | `apps/web/` で D1 binding 名参照なし | finding 0 |
| I5-02 | `apps/web/wrangler.toml` に `[[d1_databases]]` なし | hit なし |
| I5-03 | `apps/web/` から `apps/api/src/repository/*` 直接 import なし | finding 0 |
| I5-04 | session 検証が JWT Cookie のみで完結 | OK |
| I5-05 | allowlist 参照が Secret 経由（D1 不経由） | OK |

## 無料枠見積もり

| 項目 | 想定 / 上限 | 結論 |
| --- | --- | --- |
| D1 reads / writes | 0 / day | OK |
| Workers requests (auth routes) | 50 / day | OK |
| Workers requests (middleware) | 5,000 / day | OK |
| Google OAuth API call | 50 / day（10,000 上限） | OK |

session を JWT Cookie に閉じることで D1 row 増を完全回避（不変条件 #5 と無料枠を両立）。

## a11y

- login ボタン `aria-label="Google でログイン"`
- gate 拒否表示 `aria-live="polite"`
- keyboard navigation: Tab / Enter
- screen reader: `prompt=select_account` 読み上げ

## Edge runtime 互換

- middleware が `node:fs` / `node:crypto` 等を import しない
- pkce.ts / session.ts が `crypto.subtle` / `crypto.getRandomValues` のみ使用
- callback route の `fetch` が Edge runtime で動作
- lint で `node:crypto` import を error 化

## 次 Phase 引継ぎ

- 各ゲートの結果を集計し、blocker / minor / pass に分類
- 再実行が必要な項目（gitleaks finding が出た場合の再スキャン手順）をリスト化
- Phase 10 の最終レビュー入力として渡す
