# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

unit / contract / E2E / a11y の test を 4 ルートに対して設計し、AC-1〜AC-12 を test ID と紐付ける。

## 実行タスク

1. URL query zod の unit test
2. 4 page の RSC fetch contract test（msw or fixture）
3. Playwright E2E（4 ルート × desktop / mobile）
4. `window.UBM` / `localStorage` 不在の static check
5. stableKey 直書き禁止 lint

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-02/url-query-contract.md | zod schema |
| 必須 | outputs/phase-02/data-fetching.md | fetch 設計 |
| 参考 | doc/00-getting-started-manual/specs/09-ui-ux.md | 検証マトリクス |

## 実行手順

### ステップ 1: verify suite

| layer | 対象 | tool | 担当 |
| --- | --- | --- | --- |
| unit | URL query zod, search-params parser | vitest | 本 task |
| contract | 4 page の fetch 入出力 | vitest + msw | 08a |
| E2E | 4 ルート × desktop / mobile | Playwright | 08b |
| static | `window.UBM`, `localStorage` 不在 | grep + ESLint | 本 task |
| static | stableKey 直書き禁止 | ESLint custom rule | 本 task |
| a11y | axe-core | Playwright | 08b |

### ステップ 2: unit test 行列

| ID | 入力 | 期待 |
| --- | --- | --- |
| U-01 | `?q=hello&zone=0_to_1` | parsed = { q:"hello", zone:"0_to_1", ... defaults } |
| U-02 | `?zone=invalid` | zone fallback = "all" |
| U-03 | `?density=compact` | density fallback = "comfy"（unknown 値拒否） |
| U-04 | `?tag=ai&tag=dx` | tag = ["ai","dx"] |
| U-05 | `?tag=` 6 件 | 5 件で truncate（Q2 確定値） |
| U-06 | `?q=  hello   world  ` | q = "hello world"（trim + 空白 1 つ正規化） |

### ステップ 3: contract test

| ID | route | fixture | 期待 |
| --- | --- | --- | --- |
| C-01 | `/` | stats + members 6 件 | Hero + StatCard + MemberCard ×6 |
| C-02 | `/members?q=web` | filtered list | カード count = fixture と一致 |
| C-03 | `/members/[id]` 不存在 | 404 fixture | notFound(), 404 page |
| C-04 | `/members/[id]` public | 1 member | ProfileHero + KVList（public field のみ） |
| C-05 | `/register` | form-preview fixture | section count 6 + visibility 表示 |

### ステップ 4: Playwright E2E

| ID | viewport | シナリオ |
| --- | --- | --- |
| E-01 | desktop | `/` Hero / Stats / CTA が崩れない |
| E-02 | mobile | `/` 同上 |
| E-03 | desktop | `/members` filter 操作で URL 更新 + 結果反映 |
| E-04 | mobile | `/members` 同上、横はみ出しなし |
| E-05 | desktop | `/members/[id]` public 表示のみ |
| E-06 | mobile | `/members/[id]` 同上 |
| E-07 | desktop | `/register` form-preview + responderUrl リンク |

### ステップ 5: static check

| ID | check | 期待 |
| --- | --- | --- |
| S-01 | `grep -r "window.UBM" apps/web` | 0 件（AC-7） |
| S-02 | `grep -r "localStorage" apps/web` | route/session/data に関する用途で 0 件（テーマ等の補助は別途許可リスト） |
| S-03 | ESLint custom rule で `questionId` 文字列直書き禁止 | error 0 |
| S-04 | `grep -r "no-access" apps/web/app` | 0 件 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | test ID を runbook 完了条件に組み込む |
| Phase 6 | 異常系に C-03 を拡張 |
| Phase 7 | AC × test ID 表 |
| 08a | C-01〜C-05 |
| 08b | E-01〜E-07 |

## 多角的チェック観点

- 不変条件 #1: S-03 で stableKey 直書き禁止
- 不変条件 #5: contract test で 04a 経由のみを確認
- 不変条件 #6: S-01 で `window.UBM` 不在
- 不変条件 #8: U-03 で localStorage 復活を阻止する density 仕様
- 不変条件 #9: S-04 で `/no-access` 不在
- 不変条件 #10: E2E 実行 / staging で D1 read 数を見積もる

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit test (U-01〜U-06) | 4 | pending | URL zod |
| 2 | contract test (C-01〜C-05) | 4 | pending | 4 page |
| 3 | Playwright (E-01〜E-07) | 4 | pending | desktop + mobile |
| 4 | static check (S-01〜S-04) | 4 | pending | grep + ESLint |
| 5 | a11y axe | 4 | pending | 08b 連携 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | サマリ |
| ドキュメント | outputs/phase-04/test-matrix.md | AC × test ID |
| メタ | artifacts.json | phase 4 status |

## 完了条件

- [ ] AC-1〜AC-12 が test ID と対応
- [ ] unit / contract / E2E / static の 4 layer が定義
- [ ] AC-7, AC-8, AC-9, AC-11 のための static check が含まれる

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- 2 種ドキュメント配置
- 不変条件 #1, #5, #6, #8, #9, #10 への対応 test を含む
- 次 Phase へ test ID を引継ぎ

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ事項: test ID を runbook 完了条件として参照
- ブロック条件: AC × test ID 対応未完なら進まない

## verify suite

| layer | tool | scope | 期待件数 |
| --- | --- | --- | --- |
| unit | vitest | URL query zod | 6 件 |
| contract | vitest + msw | 4 page fetch | 5 件 |
| E2E | Playwright | 4 ルート × viewport | 7 件 |
| static | grep + ESLint | window.UBM / localStorage / questionId / no-access | 4 件 |
| a11y | axe via Playwright | 4 ルート | 4 件 |
