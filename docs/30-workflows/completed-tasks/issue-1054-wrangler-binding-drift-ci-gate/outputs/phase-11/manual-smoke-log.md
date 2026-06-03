# Phase 11 — CLI スモークログ（NON_VISUAL）

> **状態**: completed。CLI スモークの実測値を今回サイクルで記録する。commit / push / PR / Issue mutation のみ user-gated。

## 環境前提

- Node 24.15.0 / pnpm 10.33.2（`.mise.toml` 正本）。必ず `mise exec -- pnpm ...` 経由で実行する。
- vitest はリポジトリルートから実行する（CLAUDE.md / MEMORY 教訓）。

## スモーク手順と expected / actual

| # | 手順 | コマンド | expected | actual |
| --- | --- | --- | --- | --- |
| S-1 | 是正前 gate（現存ドリフト検出） | 棚卸し表に MEMBER_PHOTOS 行が無い fixture | **exit 1 相当**。`INVENTORY_MISSING` + `MEMBER_PHOTOS` を含む decisive drift | PASS。focused spec が棚卸し表 1 行削除 fixture で `INVENTORY_MISSING / MEMBER_PHOTOS` を検出 |
| S-2 | 是正後 gate（現行 repo green / AC-10） | `mise exec -- pnpm verify:wrangler-binding-drift` | **exit 0**。drift **0 件** | PASS。`OK: wrangler.toml, Env, and Cloudflare inventory are aligned` |
| S-3 | 回帰 spec | `mise exec -- pnpm exec vitest run scripts/__tests__/verify-wrangler-binding-drift.spec.ts` | **TC-01〜TC-10 全 PASS**。(a) 是正後 exit 0 / (b) env.ts 削除 fixture で型欠落 fail / (c) 棚卸し表 1 行削除 fixture で棚卸し欠落 fail / (d) 棚卸し Kind 不一致 fixture で fail / (e) applied:false を fail させない / (f) env-prefixed 重複の 1 エントリ集約 | PASS。12 tests |
| S-4 | read-only 確認 | `rg -n "writeFileSync\|writeFile\|appendFile\|fetch\(\|child_process\|execSync\|spawn" scripts/verify-wrangler-binding-drift.mjs` | **ヒット 0 件**（AC-7 / D-7） | PASS。ヒット 0 件（rg exit 1 は期待通り） |
| S-5 | 型チェック | `mise exec -- pnpm typecheck` | **error 0** | PASS |
| S-6 | lint | `mise exec -- pnpm lint` | **error 0** | PASS |

## 代替証跡（NON_VISUAL）

- 視覚証跡（screenshot）は画面が無いため取得しない。
- 一次証跡 = S-1 / S-2 の exit code（1 → 0）。
- 回帰証跡 = S-3 の vitest 結果。
- read-only 証跡 = S-4 の grep 0 件。

## 実行記録

- 実行者: Codex
- 実行日時: 2026-06-02
- ブランチ / コミット: local worktree / commit 未作成
- 総合判定（PASS / FAIL）: PASS
