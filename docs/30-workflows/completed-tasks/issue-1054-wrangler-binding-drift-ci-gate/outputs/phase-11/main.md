# Phase 11 成果物 — 手動 smoke test（CLI 回帰検証・NON_VISUAL）

## 1. NON_VISUAL 宣言

- **visualEvidence: NON_VISUAL**（index.md / artifacts.json と一致）。
- **タスク種別**: CLI / CI tooling（read-only 解析 gate + 回帰 spec + GitHub Actions workflow）。UI / 画面・導線の変更なし。
- **非視覚的理由**: 成果物にレンダリングされる画面が存在しないため、screenshot による視覚回帰は取得不可（該当なし）。`outputs/phase-11/screenshots/` は作成しない。
- **代替証跡**: (a) CLI exit code（`pnpm verify:wrangler-binding-drift` の 0/1）、(b) vitest 回帰 spec（TC-01〜TC-10）の PASS/FAIL、(c) read-only grep gate（書き込み / ネットワーク / サブプロセス語 0 件）。

## 2. CLI スモーク実行結果

| # | 手順 | コマンド | 結果 |
| --- | --- | --- | --- |
| S-1 | 是正前 gate | 棚卸し表に MEMBER_PHOTOS 行が無い fixture | `scripts/__tests__/verify-wrangler-binding-drift.spec.ts` で `INVENTORY_MISSING / MEMBER_PHOTOS` を検出 PASS |
| S-2 | 是正後 gate | `mise exec -- pnpm verify:wrangler-binding-drift` | PASS。`OK: wrangler.toml, Env, and Cloudflare inventory are aligned` |
| S-3 | 回帰 spec | `mise exec -- pnpm exec vitest run scripts/__tests__/verify-wrangler-binding-drift.spec.ts` | PASS。12 tests |
| S-4 | read-only 確認 | `rg -n "writeFileSync|writeFile|appendFile|fetch\\(|child_process|execSync|spawn" scripts/verify-wrangler-binding-drift.mjs` | ヒット 0 件（rg exit 1 は期待通り） |
| S-5 | 型 / lint | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` | PASS / PASS |

## 3. 代替証跡方針

- S-1 / S-2 の結果が「gate がドリフトを検出し、是正で解消する」一次証跡。
- S-3 の vitest 結果（12 tests PASS）が回帰 guard の証跡。
- S-4 の grep 0 件が read-only（AC-7）の証跡。
- 実測値は `manual-smoke-log.md` に記録済み。

## 4. 結論

本 Phase は NON_VISUAL（CLI tooling）。screenshot は該当なし。CLI exit code + vitest + read-only grep + typecheck/lint を代替証跡として取得済み。補助成果物は `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 件。
