# Phase 3 成果物 — ut-web-cov-02-public-components-coverage

- status: ready (spec)
- purpose: 設計レビュー (PASS/FAIL マトリクス + risk register)

## レビュー結果サマリ

| 区分 | 件数 |
| --- | --- |
| PASS | 15 |
| FAIL | 0 |
| 総合判定 | **PASS** |

## レビュー判定マトリクス

| # | 観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| R-1 | CONST_005 (1) 変更対象ファイル | PASS | 7 test + 1 fixture + 1 helper を Phase 2 で列挙 |
| R-2 | CONST_005 (2) 関数シグネチャ | PASS | 7 component の Props/Return を実コードから引用 |
| R-3 | CONST_005 (3) 入出力 | PASS | 各 component で代表入出力を例示 |
| R-4 | CONST_005 (4) テスト方針 | PASS | Vitest+RTL+jsdom、mock マトリクス、assertion 規約あり |
| R-5 | CONST_005 (5) ローカル実行コマンド | PASS | 個別 7 + coverage 1 件、filter 名注記済み |
| R-6 | CONST_005 (6) DoD | PASS | green / coverage / regression / snapshot 0 件 |
| R-7 | coverage 目標達成可能性 | PASS | branch シミュレーション (下表) で全 component が 80%+ 見込み |
| R-8 | 不変条件 #2 responseId/memberId separation | PASS | fixture が memberId のみ生成 |
| R-9 | 不変条件 #5 public/member/admin boundary | PASS | scope は public + feedback のみ |
| R-10 | 不変条件 #6 D1 直接アクセス禁止 | PASS | mock マトリクスで D1/binding/fetch を禁止枠に分類 |
| R-11 | shared package 越境 | PASS | mock せず実体を契約として利用 |
| R-12 | coverage.exclude 追加 | PASS | 設計に exclude 追加なし |
| R-13 | snapshot 依存 | PASS | 全テストで `toMatchSnapshot` 不使用 |
| R-14 | test ID / fixture key 重複 | PASS | overrides で衝突回避可能 |
| R-15 | render helper 責務単一性 | PASS | RTL の薄い re-export のみ |

## カバレッジ達成シミュレーション

| component | 主要 branch | 設計テストでの網羅 | 想定 Stmts/Lines/Funcs | 想定 Branch |
| --- | --- | --- | --- | --- |
| Hero | subtitle, primaryCta, secondaryCta 各 有/無 | 3 ケース | 100% | 100% |
| MemberCard | density 3 値, nickname/zone/status 各 null | 3 ケース (+ dense は variant 派生) | 95%+ | 85%+ |
| ProfileHero | nickname/zone/status 各 null | 3 ケース | 100% | 100% |
| StatCard | zoneBreakdown 0/N | 3 ケース | 100% | 100% |
| Timeline | entries 0/N | 3 ケース (early return 含む) | 100% | 100% |
| FormPreviewSections | grouping, required 真/偽, visibility 既知/未知 | 3 ケース | 95%+ | 85%+ |
| EmptyState | description/resetHref/resetLabel/children | 3 ケース | 100% | 100% |

→ 全件 AC-1 (Stmts/Lines/Funcs ≥85%, Branches ≥80%) 達成見込み。

## 不変条件抵触チェック

| 不変条件 | 抵触有無 | 検証根拠 |
| --- | --- | --- |
| #2 responseId/memberId separation | なし | fixture で memberId のみ生成、responseId フィールド不在 |
| #5 public/member/admin boundary | なし | admin/member component を import せず、public + feedback に限定 |
| #6 apps/web D1 direct access forbidden | なし | mock マトリクスで D1/binding/fetch を禁止枠。Phase 9 で grep 検証 |

## risk register

| ID | リスク | 発生確率 | 影響 | 緩和策 | owner |
| --- | --- | --- | --- | --- | --- |
| RISK-1 | shared Zod schema 変更で fixture parse error | 低 | 全テスト fail | fixture を `Z.parse` 経由で固定値生成し即時検出 | Phase 5 |
| RISK-2 | MemberCard density="dense" の branch 漏れ | 中 | branch <80% | dense ケースを happy 派生で追加し 4 ケース化 | Phase 5 |
| RISK-3 | Avatar style 値の fragility | 低 | 間欠失敗 | style ではなく `role`/`aria-label`/`data-size` のみ assert | Phase 5 |
| RISK-4 | `test` script 不在 | 高 | コマンド失敗 | Phase 5 で alias 追加 or `test -- <pattern>` に正規化 | Phase 5 |
| RISK-5 | React 19 + jsdom 警告ノイズ | 低 | レビューノイズ | 必要時のみ `vi.spyOn(console,'warn')`、`vitest.config.ts` は変更しない | Phase 5 |
| RISK-6 | FormPreviewSections の grouping 順序依存 | 低 | 間欠失敗 | Map 挿入順を fixture で固定し `within(section)` で局所 assert | Phase 5 |

## 承認

- 設計判定: PASS。Phase 4 (テスト戦略) に risk register を引き渡す。
- approval gate: なし (内部レビュー)。

## 引き渡し

Phase 4 へ、PASS マトリクス・カバレッジシミュレーション・risk register・CONST_005 確定設計を渡す。
