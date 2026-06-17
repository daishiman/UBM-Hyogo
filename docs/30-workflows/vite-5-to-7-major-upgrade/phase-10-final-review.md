# Phase 10: Final Review（最終レビュー）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vite-5-to-7-major-upgrade |
| 前提 | phase-01〜phase-09 |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| 目的 | 全 AC（AC-1〜AC-8）の最終判定・MINOR 指摘の未タスク化判断・blocker エスカレーション判定・CONST_007 1サイクル完了の最終確認 |

## 最終レビューの位置づけ

Phase 4〜9 で実装・テスト・カバレッジ・リファクタリング・QA を終えた成果物を、Phase 1 の受入条件（AC-1〜AC-8）に照らして **合否を確定** する段階。本 Phase では新たな実装はせず、判定と申し送り（未タスク化 / エスカレーション）のみを行う。

> 本サイクルで Vite 7 依存追加・lockfile 再生成・local evidence 採取まで実行したため、Phase 10 は判定基準だけでなく実測結果も参照する。

## 受入条件（AC-1〜AC-8）最終判定テーブル

判定の枠組みは「観点 | 判定 | 根拠」とし、実行結果（コマンド出力・ログ）を根拠列に記録して PASS/FAIL を確定する。AC の確定定義は phase-09-quality-assurance.md の一括判定表を正本とする。

| AC | 観点 | 判定基準（PASS の条件） | 根拠に記載するもの |
| --- | --- | --- | --- |
| AC-1 | vite 直接依存追加 | root `package.json` の `devDependencies` に `"vite": "^7.0.0"` が直接追加されている | `package.json` 該当行 diff |
| AC-2 | lockfile 単一 7.x 解決 | `pnpm-lock.yaml` で vite が単一 7.x に解決され、5系/7系の重複がない | `pnpm why vite` 出力 |
| AC-3 | 型チェック green | `mise exec -- pnpm typecheck` が exit 0 | typecheck ログ末尾 |
| AC-4 | lint green | `mise exec -- pnpm lint` が exit 0 | lint ログ末尾 |
| AC-5 | 全 shard green | api-unit / api-d1 / web / og / packages / scripts / infra の全 7 shard で fail 0 | shard 別実行結果（件数・green） |
| AC-6 | deprecation 警告ゼロ | vitest 実行ログに Vite 6/7 削除 API（`splitVendorChunkPlugin` / `legacy` / `resolve.conditions` 等）由来の警告が残っていない | 警告 grep 結果（0 件） |
| AC-7 | D1 設計維持 | `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` が維持され、port exhaustion なく完走 | api-d1 shard 完走ログ + config grep |
| AC-8 | apps/web build 健全 | `next build --webpack`（OpenNext）が成功し、deploy bundle に `[project]/...` 仮想 specifier 混入なし | build ログ + bundle grep |

> 全 AC が PASS で初めて Phase 11 へ進む。1 件でも FAIL があれば、該当 Phase（4〜9）へ差し戻すか、下記 blocker 判定へ進む。

## 破壊的変更カテゴリ（V1〜V8）対応の最終確認

| カテゴリ | 確認観点 | PASS 基準 |
| --- | --- | --- |
| V1 解決機構 | devDep `vite ^7` 追加で 5.4.21→7.x 引き上げ完了 | `pnpm why vite` が 7.x（AC-1/AC-2） |
| V2 resolve.alias / optimizeDeps | react subpath 解決が等価維持で green | 該当 shard green（AC-5） |
| V3 @vitejs/plugin-react interop | `plugins:[react()]` の v7 連携 warning 0 | runtime warning 0（AC-6） |
| V4 deprecation / removed API | 削除済み API 警告 0（current config 未使用） | 警告 grep 0 件（AC-6） |
| V5 esbuild 整合 | `overrides.esbuild=0.27.3` と v7 が peer 破壊なく解決 | install 成功（不整合時のみ Phase 3 エスカレーション） |
| V6 Node engine 要件 | Node 24.15.0 が v7 要件（20.19+/22.12+）を充足 | 環境前提で充足（対応不要） |
| V7 vite-node / 重複 | 単一 7.x 解決・D1 singleFork 維持 | 重複 0 / D1 完走（AC-2/AC-7） |
| V8 apps/web ビルド非影響 | Next webpack ビルドが Vite 非依存で健全 | OpenNext bundle 健全（AC-8） |

## 不変条件（SSOT §8 全 9 件）最終保持確認

phase-09 の不変条件チェック表で確認した全 9 件が、最終成果物で保持されていることを再確認する。特に以下を重点確認する。

| # | 重点確認観点 | PASS 基準 |
| --- | --- | --- |
| 2 / 3 | config（alias / optimizeDeps / pool / singleFork）が等価維持 | diff レビューで破壊なし |
| 4 | `pnpm.overrides.esbuild = "0.27.3"` 維持 | 残存（V5 不整合時のみエスカレーション） |
| 7 / 8 | skip 増加なし / coverage 閾値低下なし | baseline 比較で非増加・非低下 |
| 9 | `next build --webpack` 正本維持（Turbopack 混入なし） | bundle 健全 |

## MINOR 指摘 → 未タスク化ルールの確認

- Phase 10 レビュー前に `unassigned-task-guidelines`（task-specification-creator skill の未タスク判定基準）を確認し、MINOR 指摘を未タスク化するか即時修正するかを判断する。
- **本サイクルで修正できる MINOR は本サイクル内で修正する**（CONST_007 1サイクル完了原則）。先送りは原則しない。
- 1サイクル完了を破綻させない範囲外の改善（例: Vitest 4.x 化 / Vite 8 化 / @vitejs/plugin-react のメジャーアップ）は、未タスク（baseline 候補）として Phase 12 の `unassigned-task-detection.md` に記録し、本 PR には含めない（SSOT §7「含まないもの」と整合）。
- MINOR 指摘は「指摘内容 | 即時修正 or 未タスク化 | 根拠」の形式で記録する。
- **MINOR 指摘が 0 件であっても**、Phase 12 の unassigned-task-detection に「current 検出 0 件 / baseline 候補（Vitest 4 化・Vite 8 化等）」を必ず記録する（検出ゼロの事実を明示的に残す）。

## blocker 判定基準（エスカレーション）

Phase 3 のエスカレーション条件（CONST_007 例外の発火点）と整合させ、以下のいずれかを検知したら実装を止めてユーザーへエスカレーションする。

| blocker | 兆候 | アクション |
| --- | --- | --- |
| 大規模 fail | 単一の破壊的変更（V2〜V4）で数百件規模のテスト書き換えが必要（局所修正で収まらない） | 実装中断 → ユーザー確認（スコープ再設定の可否） |
| プロダクトコード巻き込み | プロダクトコード（`apps/*/src` / `packages/*/src`）の挙動変更なしには green にできない fail がある | 実装中断 → ユーザー確認（責務境界の例外可否） |
| esbuild 整合崩れ | `pnpm.overrides.esbuild = "0.27.3"` を維持したまま vite 7 が install/解決できない（V5 不整合） | 実装中断 → ユーザー確認（override 変更の可否） |
| 閾値低下 | coverage 閾値を実測ずれの範囲を超えて下げないと通らない | 実装中断 → ユーザー確認（品質低下の許容可否） |

> いずれも SSOT §2/§3 の事前調査では発生可能性は低い（@vitejs/plugin-react@4.7.0 と vitest@3.2.6 が既に Vite 7 を peer/dep サポート済み・apps/web は Vite 非依存）。発火した場合のみ Phase 11 以降へ進まず停止する。

## CONST_007（1サイクル完了原則）の最終確認

| 確認項目 | PASS 基準 |
| --- | --- |
| 含むもの全完了 | vite ^7 追加 + lockfile 再生成 + 単一解決確認 + deprecation 採取 + config 最小修正（必要時）+ 全 shard green + apps/web sanity + typecheck/lint/grep の締め（SSOT §7）が**本サイクル内**で完了 |
| 先送りなし | バックログ送り / 別 PR / Phase 2 への先延ばしが発生していない |
| 例外発火の有無 | RED で想定外の大規模 fail が判明した場合のみ Phase 3 でエスカレーション（CONST_007 例外）。発火していなければ 1サイクル完了 |

## 最終レビュー判定の記録形式

本 Phase の結論は `implemented_local_evidence_captured`。commit / push / PR は Phase 13 の user gate に残す。

- **PASS**: 全 AC が PASS かつ blocker なし → Phase 11 へ進行。
- **CONDITIONAL**: MINOR 指摘ありだが即時修正で解消 → 修正後 PASS として進行。
- **BLOCKED**: blocker 検知 → 実装中断、ユーザーエスカレーション。

## 完了条件

- [ ] AC-1〜AC-8 の最終判定テーブルが判定基準とともに記載されている
- [ ] 破壊的変更カテゴリ V1〜V8 の最終確認観点が記載されている
- [ ] 不変条件 SSOT §8 全 9 件の最終保持確認が記載されている
- [ ] MINOR 指摘 → 未タスク化ルール（unassigned-task-guidelines 確認）が記載され、0 件でも Phase 12 unassigned-task-detection に記録する旨が明記されている
- [ ] blocker 判定基準（大規模 fail / プロダクトコード巻き込み / esbuild 整合崩れ / 閾値低下）が Phase 3 と整合して記載されている
- [ ] CONST_007 1サイクル完了の最終確認項目が記載されている
- [ ] 最終レビュー判定の記録形式（PASS / CONDITIONAL / BLOCKED）が固定されている
