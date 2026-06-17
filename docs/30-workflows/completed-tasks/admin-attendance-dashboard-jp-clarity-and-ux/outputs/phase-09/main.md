# Phase 9 品質保証 — 一括判定方針とコマンド一覧

> 型 / lint / focused vitest / build を一括判定し、各検証の PASS 条件を明示する。本タスク固有の中核ゲート（英語・専門語残存ゼロ / AC-5・6・7 機械検証）は `outputs/phase-09/token-audit.md` に分離して正本化する。

## 1. 型 / lint / focused vitest / build 一括判定

```bash
# 1) 型チェック（monorepo 全体）
mise exec -- pnpm typecheck
# 2) lint（boundary / deps / no-inline-style 等）
mise exec -- pnpm lint
# 3) focused vitest（attendance feature テスト配下に限定）
#    ※ リポジトリルートが root のため apps/web フルパス + --root=. --config 指定が必須（メモリ既知の罠）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/attendance/__tests__
# 4) production build（OpenNext 互換 = webpack 正本）
mise exec -- pnpm build
```

| # | 検証 | コマンド | PASS 条件 |
| --- | --- | --- | --- |
| 1 | 型整合 | `pnpm typecheck` | exit 0。`formatDelta` 戻り型（string）が `pt`→`ポイント` 変更で不変 |
| 2 | lint | `pnpm lint` | exit 0。inline style / boundary 違反 0 件 |
| 3 | focused vitest | 上記フルパス指定 | exit 0。既存追従（T-01〜T-06）+ 回帰テストが全 PASS |
| 4 | build | `pnpm build` | exit 0。`next build --webpack`（OpenNext 互換）で build 成功 |

> 4 件すべて exit 0 を Phase 10（GO/NO-GO）の必須入力にする。1 件でも FAIL なら Phase 5/8 へ差し戻す。

## 2. line budget / link / mirror parity 判定

| 観点 | 判定方針 | 期待 |
| --- | --- | --- |
| line budget | 本タスクは表現層の文言置換 + 軽微 CSS のため、変更行数は限定的（12 実装 + テスト追従）。docs（本 workflow 配下）は phase-NN 標準サイズに収める | 過大な diff（無関係ファイルの巻き込み）が無い |
| link 健全性 | 本 workflow の index.md / phase-NN.md / outputs の相互リンクが解決すること（`verify:phase12-compliance` の link 検査に委ねる） | dangling link 0 件 |
| mirror parity | `.claude/skills` と `.agents/skills` のハードリンク parity（本タスクは skill を編集しないため影響なし） | 本タスクで skill mirror に変更を持ち込まない |

> 本タスクは apps/web 表現層に閉じるため、line budget / mirror parity は「無関係ファイルを巻き込まない」確認が主眼。link 健全性は Phase 12 の compliance gate と重複担保する。

## 3. 判定サマリ（Phase 10 への引き継ぎ）

| ブロック | 検証 | 正本 |
| --- | --- | --- |
| 型/lint/build | §1 の 1〜4 | 本書 |
| focused vitest | §1 の 3 | 本書 + Phase 7 ac-matrix |
| token / primitive / diff | AC-5 / AC-6 / AC-7 | token-audit.md |
| 英語・専門語残存ゼロ | AC-1 / AC-2 / AC-3 | token-audit.md §4 |

> いずれかが FAIL の場合は Phase 10 を NO-GO とし、token=Phase 9 / 機能=Phase 5 / テスト=Phase 6 / 設計=Phase 2 の戻り先に従う。
