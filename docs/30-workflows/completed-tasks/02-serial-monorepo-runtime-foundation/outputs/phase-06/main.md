# Phase 6: 異常系検証 — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 状態 | completed |
| 作成日 | 2026-04-26 |

## 異常系シナリオ検証結果

| ID | 異常 | 検出方法 | 状態 | 対処 |
| --- | --- | --- | --- | --- |
| A1 | branch drift（develop 混在） | `rg -n "develop" doc/02-serial-monorepo-runtime-foundation` | CLEAR | 全 phase で "dev" ブランチを統一使用 |
| A2 | secret placement ミス（AUTH_SECRET を GitHub Variables に配置） | version-policy.md の環境変数設計表確認 | CLEAR | runtime secret → Cloudflare Secrets, deploy secret → GitHub Secrets を明記済み |
| A3 | source-of-truth 競合（Forms input と D1 が重複） | runtime-topology.md の責務境界確認 | CLEAR | D1 は canonical store, Google Forms は input source として分離済み |
| A4 | downstream blocker 漏れ（03/04/05b への参照が欠落） | foundation-bootstrap-runbook.md の downstream 参照表確認 | CLEAR | 参照表を Phase 5 で作成済み |
| A5 | 無料枠逸脱（Workers バンドル 3MB 超過） | OpenNext build と生成物サイズ確認 | CLEAR | Node v24.15.0 で OpenNext build PASS。`worker.js` 2,278 bytes / assets 約 644KB |
| A6 | pnpm バージョン混在（pnpm 9 使用） | `pnpm --version` | CLEAR | pnpm 10.x 採用を version-policy.md で固定。EOL（2026-04-30）対応済み |
| A7 | Node.js バージョン不一致（22.x 混在） | `.nvmrc` / `package.json#engines` 確認 | CLEAR | Node 24.x を engines と .nvmrc で固定（runbook 記録済み） |
| A8 | @cloudflare/next-on-pages 継続使用 | `rg "@cloudflare/next-on-pages" .` | CLEAR | 不採用。全 phase で @opennextjs/cloudflare を採用済み。廃止理由も phase-03 代替案に記録 |
| A9 | Auth.js NEXTAUTH_* 環境変数の残存 | `rg "NEXTAUTH_" doc/02-serial-monorepo-runtime-foundation` | CLEAR | 全 phase で AUTH_* プレフィックスを統一使用。NEXTAUTH_* は使用しない |

## A5（Workers バンドルサイズ）の詳細

| 項目 | 内容 |
| --- | --- |
| 状態 | CLEAR（Node 24.x 実環境で確認済み） |
| 確認方法 | `pnpm --filter @ubm-hyogo/web build:cloudflare` 後に `.open-next/worker.js` など生成物サイズを確認 |
| 対処A | `@opennextjs/cloudflare` の `optimizePackageImports` オプションで削減 |
| 対処B | 3MB 超過なら Pages Functions（25MB）へ移行 |
| 記録先 | foundation-bootstrap-runbook.md の rollback 手順 |

## 再現手順

| テスト | 手順 |
| --- | --- |
| branch drift | doc/ 配下で `rg -n "develop"` を実行し、"dev" 以外のブランチ記法がないか確認 |
| secret placement | version-policy.md の環境変数設計表を参照し、runtime/deploy の混線がないか確認 |
| @cloudflare/next-on-pages 残存 | `rg "@cloudflare/next-on-pages" doc/ .claude/skills/` で残存を確認 |
| NEXTAUTH_* 残存 | `rg "NEXTAUTH_" doc/ .claude/skills/` で残存を確認 |

## 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | A1〜A9 の異常系を体系的に検証し、下流 task への drift を防ぐ |
| 実現性 | PASS | 実装 skeleton、文書確認、Node 24 typecheck、OpenNext build、bundle size 証跡で確認 |
| 整合性 | PASS | 異常系シナリオと正本仕様が一致。A5 のみ後続 task で実確認 |
| 運用性 | PASS | 再現手順と対処を記録。rollback 手順は runbook に委譲 |

## Phase 6 → Phase 7 handoff

| 引き継ぎ事項 | 内容 |
| --- | --- |
| A5（バンドルサイズ） | Phase 7 の AC マトリクスで AC-1 の確認として記録 |
| MINOR 追跡（Phase 3 M-05） | apps/web/wrangler.toml の @opennextjs/cloudflare 向け設定は解消済み |
| CLEAR 項目 | A1〜A4, A6〜A9 は CLEAR |

## 完了条件チェック

- [x] 主成果物が作成済み
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
