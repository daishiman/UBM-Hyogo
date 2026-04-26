# Phase 6 成果物: 異常系検証

## Failure Cases 一覧

| # | カテゴリ | ケース | 期待 error / exit | 修復手順 |
|---|---------|--------|-------------------|---------|
| 1 | typecheck | MemberId を string として渡す | TS2322 | branded type の brand キーを正しく付与 |
| 2 | typecheck | shared から viewmodel 未実装 import | export not found | 01b で実装後に再 typecheck |
| 3 | lint | apps/web → D1 import | ESLint error: noD1FromWeb | apps/api 経由に書き換え |
| 4 | lint | apps/web → apps/api 直接 import | ESLint error: no-restricted-paths | fetch / RSC 経由に書き換え |
| 5 | lint | primitive で localStorage.setItem | ESLint custom rule warn | サーバー側保存に切替 |
| 6 | unit | tones.test.ts mapping 不一致 | Vitest fail | tones.ts の条件分岐を仕様に合わせる |
| 7 | unit | Avatar smoke で hue が非決定論的 | assert fail | hashStringToHue 確認 |
| 8 | scaffold | pnpm install ERR_PNPM_UNSUPPORTED_ENGINE | pnpm version 不一致 | corepack で pnpm 10.x に固定 |
| 9 | scaffold | apps/api wrangler dev で port 競合 | EADDRINUSE | port 切替 or kill |
| 10 | scaffold | apps/web next dev で @opennextjs/cloudflare 未解決 | module not found | dev dependency 確認 |
| 11 | scaffold | barrel export 漏れ（15 種未満） | AC-5 fail | index.ts に追記 |
| 12 | a11y | Drawer に role="dialog" なし | smoke test fail | role 付与 |
| 13 | a11y | Avatar に aria-label なし | smoke test fail | aria-label 付与 |
| 14 | invariant #1 | shared に Form schema を直書き | code review reject | 01b の zod schema 経由 |
| 15 | invariant #5 | apps/web に D1 binding 設定 | wrangler.toml に binding 検出 | 削除 |
| 16 | invariant #6 | primitive で localStorage 操作 | ESLint warn + review reject | 削除 |
| 17 | invariant #8 | Avatar の hue を Math.random() 化 | smoke test fail（決定論性） | hashStringToHue 維持 |
