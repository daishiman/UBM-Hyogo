# Phase 10 — 最終レビュー

> SSOT: [`../../shared-context.md`](../../shared-context.md) §4 / §6 を正本とする。

## 1. レビューサマリ

| 観点 | 判定 | 根拠 |
|------|------|------|
| issue #222 の現コード最適化反映 | OK | parser 全体移設（古い AC）ではなく共通プリミティブ抽出へ最適化（SSOT §1.2）。#222 は CLOSED のまま再オープンしない |
| CONST_004（実装区分） | OK | `[実装区分: 実装仕様書]`（コード変更あり） |
| CONST_007（1 cycle 完結） | OK | 新規 3 + 編集 3 ファイル。Lane A/B/C は相互依存だが 1 PR / 1 サイクルで完了。先送り 0 件 |
| 責務境界 | OK | 規約（値集合 / 制限 / 正規化）= shared、受信形式→app DTO 適用 = 各 app。D1 は apps/api 限定維持 |
| 後方互換 | OK | `SortZ` / `DensityZ` re-export、`MEMBERS_SEARCH_LIMITS` 再構築で既存 import / spec 不変 |
| 不変条件遵守（SSOT §7） | OK | D1 非接触 / boundary lint / OKLch 無関係 / `*.spec.ts` のみ |

## 2. acceptance criteria 充足判定表（AC-1〜AC-7）

各 AC を「実装時にこの方法で満たす」形で spec レベルに落とす。

| AC | 内容 | 充足方法（実装時） | 検証 | 判定 |
|----|------|-------------------|------|------|
| AC-1 | `@ubm-hyogo/shared/public-search` が値集合 / 制限値 / 正規化 helper を export | `search-query-primitives.ts` に SSOT §3.1 の identifier 群を定義、barrel `index.ts` で re-export、`package.json` `exports` に `./public-search` を追加 | shared/api/web typecheck（Phase 9 §3 #4-6） | 充足見込 |
| AC-2 | `apps/api` 既存 contract 不変 | parser のローカル定義のみ shared import へ置換、`parsePublicMemberQuery` I/O・返却 shape 不変。`search-query-parser.spec.ts` を無変更で実行 | 既存 api spec 緑（Phase 9 §3 #2） | 充足見込 |
| AC-3 | 不正値が安全側 default に倒れる（`limit=999`→100 / `page<1`→1 / `sort=invalid`→`recent`）。400 ではない | `clampPublicMemberLimit`（min/max clamp）+ `PublicMemberSortZ.catch` + `z.coerce.catch(1)` で silent fallback。挙動は現コードと一致 | shared spec SP-05/06/11 + 既存 api spec | 充足見込 |
| AC-4 | shared unit test pass（境界値: limit clamp / 不正 enum fallback / tag>5 truncate / q>200 切詰） | `search-query-primitives.spec.ts` に SP-01〜SP-12 を実装し全 branch 網羅（Phase 7 §2） | shared spec 緑（Phase 9 §3 #1） | 充足見込 |
| AC-5 | `apps/web` から import 可能・web→api 直接参照ゼロ維持 | web の `members-search.ts` が `@ubm-hyogo/shared/public-search` を import。api への直接参照を増やさない | web typecheck + lint + boundary grep（Phase 9 §3 #6/#7・§4） | 充足見込 |
| AC-6 | `apps/web` 既存 contract 不変 | serializer/parser のローカル定義のみ置換、`parseSearchParams` / `toApiQuery` / `MembersSearch` / `MEMBERS_SEARCH_LIMITS` 不変。`members-search.spec.ts` を無変更で実行 | 既存 web spec 緑（Phase 9 §3 #3） | 充足見込 |
| AC-7 | 値集合 / 制限値の重複定義が web/api から消え SSOT 一本化 | SSOT §1.3 の 8 概念を shared 1 箇所へ集約（Phase 8 §3） | grep gate 0 hit（Phase 9 §3 #8） | 充足見込 |

## 3. blocker 判定

**blocker なし。** Phase 3（設計レビュー）で 4 条件 PASS / GO 判定済み。後方互換戦略・subpath export 方針・3 レーン構成が確定しており、実装着手を阻む未決事項はない。

## 4. MINOR 指摘 / baseline（スコープ外）分離記録

新規の MINOR 指摘は **0 件**。ただし以下を将来課題（baseline・スコープ外）として分離記録する。Phase 12 の unassigned-task-detection では本タスク内の未タスクとして登録しない。

| ID | 内容 | スコープ判定 |
|----|------|-------------|
| baseline-1 | `apps/web` ページング実装時に `clampPublicMemberLimit` を web 側へ配線する（現状は SSOT に定数を置くのみで web 未使用） | スコープ外（06 系別タスク・SSOT §2.2）。shared に SSOT が既に存在するため将来配線は低コスト |
| baseline-2 | `apps/web` の `page`/`limit` を実際に searchParams から解釈する機能拡張 | スコープ外（SSOT §2.2）。本タスクは規約 SSOT 化のみ |

> いずれも「分量 / 複雑さ」を理由に切り出したのではなく、**本質的にドメインが異なる別タスク**（CONST_007 例外チェック済・SSOT §2.3 で先送り 0 件を確認）。

## 5. partial fix の有無（FB-CANCEL-004-1）

**partial fix なし。** consumer wiring は api（Lane B）と web（Lane C）の両方を今サイクルで完了するため、「片側だけ shared へ切替えてもう片側が旧定義のまま」という断絶は発生しない。Lane A の shared SSOT を両 consumer が同 PR で参照する構成のため、SSOT 化が中途半端に止まることはない。

## 6. 承認

- 最終レビュー結果: **approved for implementation**
- 全仕様書ステータス: `spec_created`（SSOT §0 / §8）
- 実装・commit・PR・push は**すべて user-gated**
- 次フェーズ: Phase 11 手動テスト（NON_VISUAL・自動テスト件数を主証跡）

## 7. ゲート

- [ ] AC-1〜AC-7 すべて充足方法が spec レベルで定義済み（§2）
- [ ] blocker 0（§3）
- [ ] MINOR 0・baseline 2 件を分離記録（§4）
- [ ] partial fix なし（§5）

## 完了条件

- [x] AC-1〜AC-7 の充足判定表を提示
- [x] blocker 0・MINOR 0・baseline 2 件を分離記録
- [x] partial fix なし（api/web 両 consumer を今サイクル完了）を確認
