# Phase 9: 品質保証 — main

## 1. 目的

Cloudflare 無料枠 / シークレット衛生 / boundary 自動化を最終確認し、Wave 2 完了 PR で安全にマージできる状態であることを示す。詳細は `free-tier.md` / `secret-hygiene.md`。

## 2. 品質ゲート結果

| 項目 | コマンド | 結果 |
| --- | --- | --- |
| 全 typecheck | `mise exec -- pnpm typecheck` | 0 error |
| 全 vitest | `mise exec -- npx vitest run` | 162 / 162 pass |
| repository unit | `vitest run apps/api` | 29 / 29 pass |
| boundary lint | `node scripts/lint-boundaries.mjs` | 0 violation |
| 全 lint（tsc -p tsconfig --noEmit） | `pnpm -r lint` | 0 error |

## 3. 後続 Phase への引き継ぎ

- `dependency-cruiser` バイナリ未導入。Phase 11 / Wave 2 統合 PR で `pnpm add -Dw dependency-cruiser` を実施し、`scripts/dep-cruise.sh` を追加する。
- `_setup.ts` は miniflare 4 を使う。Workers build には不要だが、`tsconfig` の `include` には test ファイルが入るため、prod ビルドで除外する設定を 12-implementation-guide で記述する。

## 4. 完了条件チェック

- [x] 全 typecheck 0 error
- [x] 全 test 162 pass
- [x] boundary lint 0 violation
- [x] secret 導入なし（このタスクで `.env` 改変なし）
- [x] 無料枠影響レビュー（`free-tier.md`）
