# Phase 3: 設計レビュー — ut-web-cov-02-public-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-02-public-components-coverage |
| phase | 3 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 設計に対して整合性レビュー、CONST_005 必須項目チェック、coverage 目標達成可能性、不変条件抵触チェックを行う。

## レビュー観点と判定マトリクス

| # | 観点 | 判定 | 根拠 / 是正 |
| --- | --- | --- | --- |
| R-1 | CONST_005 必須項目 (1) 変更対象ファイル | PASS | Phase 2 §1 で 7 test + 1 fixture を列挙 |
| R-2 | CONST_005 必須項目 (2) 関数シグネチャ | PASS | Phase 2 §2 で 7 component の Props/Return を実コードから引用 |
| R-3 | CONST_005 必須項目 (3) 入出力 | PASS | Phase 2 §3 で代表ケース 7 件を例示 |
| R-4 | CONST_005 必須項目 (4) テスト方針 | PASS | Vitest+RTL+jsdom、mock マトリクス、assertion 規約を Phase 2 §4 に記載 |
| R-5 | CONST_005 必須項目 (5) ローカル実行コマンド | PASS | `mise exec -- pnpm --filter @ubm-hyogo/web test -- <pattern>` 形式で 7 + coverage 1 件、ただし実 filter 名 `@ubm-hyogo/web` を注記 |
| R-6 | CONST_005 必須項目 (6) DoD | PASS | Phase 2 §6 で 4 条件を明記 |
| R-7 | coverage 目標 (Stmts/Lines/Funcs ≥85% / Branches ≥80%) 達成可能性 | PASS | 各 component で 3 ケース以上、branch 列挙 (subtitle 有/無、density 3 値、ubmZone null/non-null、entries 0/N、visibility 3+unknown、required 真偽、resetHref 有/無) を揃え、未到達 branch がない |
| R-8 | 不変条件 #2 (responseId/memberId separation) | PASS | fixture が `memberId` のみ生成。responseId フィールド不在 |
| R-9 | 不変条件 #5 (public/member/admin boundary) | PASS | scope は public + feedback のみ。admin/member component を import しない |
| R-10 | 不変条件 #6 (apps/web D1 direct access forbidden) | PASS | mock マトリクスに D1/binding/fetch を含めない (禁止枠) |
| R-11 | shared package 越境 | PASS | shared を import するが mock せず実体を契約として利用 |
| R-12 | coverage.exclude 追記による数値合わせ | PASS | 設計に exclude 追加なし。root vitest.config.ts も変更しない |
| R-13 | snapshot 依存 | PASS | 全テストで `toMatchSnapshot` 不使用。明示 assertion のみ |
| R-14 | test ID / fixture key 重複 | PASS | fixture は overrides 受領のため呼び出し側で衝突回避可能 |
| R-15 | render helper の責務単一性 | PASS | RTL の薄い re-export のみ |

総合判定: **PASS** (条件付き是正なし)

## カバレッジ達成シミュレーション

| component | 主要 branch | 設計テストでの網羅 |
| --- | --- | --- |
| Hero | subtitle 有/無, primaryCta 有/無, secondaryCta 有/無 | happy + empty + variant で 6 branch 全網羅 |
| MemberCard | density 3 値, nickname 有/無, ubmZone 有/無, ubmMembershipType 有/無 | 3 ケースで density=comfy/list 確認 + null variants で fallback branch 網羅。dense ケースを happy 派生で追加可 |
| ProfileHero | nickname 有/無, ubmZone null/value, ubmMembershipType null/value | 3 ケースで全網羅 |
| StatCard | zoneBreakdown 0/N | 3 ケースで両分岐網羅 |
| Timeline | entries 0/N | empty + happy + variant で網羅 (early return 含む) |
| FormPreviewSections | grouped 既存/新規, required 真/偽, visibility 既知/未知 | 3 ケースで grouping 反復・visibility fallback 網羅 |
| EmptyState | description 有/無, resetHref 有/無, resetLabel default/custom, children 有/無 | 3 ケースで全網羅 |

→ Branches ≥80% 達成見込みあり。

## risk register (Phase 4 引き継ぎ用)

| ID | リスク | 影響 | 緩和策 |
| --- | --- | --- | --- |
| RISK-1 | `@ubm-hyogo/shared` の Zod schema 変更で fixture が parse error | 全テスト fail | fixture を Z.parse 経由にしておき即時検出。Phase 5 で固定値を up-to-date に維持 |
| RISK-2 | `MemberCard` density="dense" が 3 ケース内に含まれず branch 漏れ | branch coverage 80% 未満 | dense ケースを happy パラメタライズに追加 (Phase 5 ランブックで明記) |
| RISK-3 | Avatar の hue 計算が DOM 出力に影響し style assertion が fragile | テスト間欠失敗 | style 値ではなく `role="img"` / `aria-label` / `data-size` のみ assert |
| RISK-4 | `apps/web/package.json` に `test` script 不在 | 指示書コマンドが動かない | Phase 5 で `pnpm --filter @ubm-hyogo/web test -- <pattern>` に正規化、または `test` alias を追加 |
| RISK-5 | jsdom 環境で React 19 の警告増加 | ノイズ | `vitest.config.ts` に変更を加えず、必要時のみ test 内で `vi.spyOn(console, 'warn')` |

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- 未実装/未実測を PASS と扱わない
- placeholder と実測 evidence を分離する

## サブタスク管理

- [ ] CONST_005 6 項目を PASS/FAIL マトリクスで判定済み
- [ ] coverage 目標達成可能性をシミュレーション済み
- [ ] 不変条件 #2/#5/#6 を全テスト設計に対して照合済み
- [ ] risk register を Phase 4 に引き渡し可能な形で記録済み
- [ ] outputs/phase-03/main.md を作成済み

## 成果物

- outputs/phase-03/main.md

## 完了条件

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%
- 各 component に happy / empty-or-null-data / interaction-or-prop-variant の最低 3 ケース
- snapshot 依存ではなく明示 assertion
- 既存 web test に regression なし

## タスク100%実行確認

- [ ] レビュー判定マトリクスが PASS で揃っている
- [ ] risk register が Phase 4 (テスト戦略) で参照可能
- [ ] 不変条件 #2/#5/#6 抵触なしを明示

## 次 Phase への引き渡し

Phase 4 へ、PASS マトリクス、カバレッジ達成シミュレーション、risk register、CONST_005 確定設計を渡す。
