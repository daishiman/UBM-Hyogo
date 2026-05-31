<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 4 -->

[実装区分: 実装仕様書]

# Phase 4 — テスト計画

## 1. 方針

本タスクは Playwright visual baseline の **安定化と path 補正**であり、新規 test ファイルは作らない（INV-5）。
検証は既存 spec を cold start で動かして 24 PNG が補正後 path へ確実に生成されることを確認する 4 レイヤーで構成する。

## 2. 検証レイヤー

| # | レイヤー | 前提 | コマンド | 期待結果 |
|---|---------|------|---------|----------|
| ① | static（型/lint） | 依存 install 済 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` / `mise exec -- pnpm lint` | exit 0（型エラー / lint 違反なし） |
| ② | cold-start evidence run | dev server 未起動。CI 相当の `reuseExistingServer` 無効化 | `CI=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/members-ux-clarity.spec.ts --project=desktop-chromium` | exit 0 / 12 test PASS / 24 PNG 生成 / runtime-notes 出力 |
| ③ | path 回帰 | ② 実行後 | `find docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/screenshots -name 'members-ux-clarity-*.png' \| wc -l` および `test ! -d docs/30-workflows/members-list-ux-clarity && echo OK` | PNG 数 = 24 / 旧 active dir が生成されない（`OK`） |
| ④ | 既存 run 非回帰（config diff レビュー観点） | config 差分レビュー | `git diff apps/web/playwright.config.ts` を目視 | 追加 flag / 三項分岐の追加のみで、既存 `is*` flag・default project・`maxDiffPixelRatio` 等の既存挙動が無変更であること |

## 3. ready URL `/members` fail-soft 前提確認

webServer の ready URL を `/members` にする設計は、`/members` page.tsx が `safeServerFetch` を使い mock API 未起動でも 200 を返す（fail-soft）ことに依存する。
evidence run 開始前に以下を確認する:

1. `apps/web/src/app/(public)/members/page.tsx` が `safeServerFetch`（または同等の fail-soft fetch）経由であること。
2. ② の cold-start run で webServer が members UX clarity 専用 `timeout: 180_000` 内に ready 判定されること（200 待機が成立すること）。
3. 万一 ready URL が 5xx を返し webServer 起動が timeout する場合は、Phase 5 の fallback（ready URL を `/` に戻し `beforeAll` warm-up のみに依存）へ切替える。

## 4. 各検証の判定基準

- ① はゲート。fail 時は Phase 5 step を修正して再実行する。
- ② の exit 0 が AC-1、24 PNG が AC-2/AC-4、runtime-notes が AC-5 を満たす。
- ③ が AC-3 を満たす（補正後 path 生成 + 旧 dir 非生成）。
- ④ が AC-7（既存 run 非破壊）を満たす。

## DoD

- [ ] static / cold-start / path 回帰 / 非回帰の 4 レイヤーを定義した
- [ ] 各レイヤーの前提・コマンド・期待結果を表で明示した
- [ ] ready URL `/members` の fail-soft 前提確認 step を含めた
- [ ] AC-1〜AC-7 と各検証の対応を明記した
