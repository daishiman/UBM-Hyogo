[実装区分: 実装仕様書]

# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-06-ui-ux-contract-rewrite |
| Wave | 2 |
| 実行種別 | parallel |
| Phase 番号 | 7 / 13 |
| 作成日 | 2026-05-07 |
| 上流 Phase | 6（異常系検証） |
| 下流 Phase | 8（DRY 化） |
| 状態 | completed |
| 区分 | implementation / NON_VISUAL |

## 目的

元仕様書 §8 DoD（Definition of Done）の各項目を AC として番号付与し、Phase 5 runbook の各 step、
Phase 6 failure case と一対一対応させる。これにより未トレースの DoD / failure case を可視化する。

## 実行タスク

1. 元仕様書 §8 DoD の 12 項目を AC-01〜AC-12 として番号付与
2. AC × Phase 5 step × Phase 6 failure case の 3 軸マトリクス作成
3. 不変条件 #1/#5/#6/#7（および prototype 19 行 / 不採用 4 項目）が AC のいずれかに紐付いているか確認
4. 未トレース項目を blocker としてリストアップ
5. outputs/phase-07/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | 元仕様書 §8 DoD | AC 元文 |
| 必須 | `outputs/phase-05/runbook.md` | step 一覧 |
| 必須 | `outputs/phase-06/main.md` | failure case 一覧 |

## 実行手順

### ステップ 1: DoD 12 項目を AC 化

### ステップ 2: 3 軸マトリクス作成

### ステップ 3: 不変条件マッピング

### ステップ 4: outputs/phase-07/main.md 作成

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化対象（routes 表 / primitives 表の重複列）の特定 |
| Phase 9 | grep gate / lint の自動化方針へ AC を連結 |
| Phase 10 | GO/NO-GO で AC 全 PASS 確認 |
| Phase 12 | implementation-guide.md にマトリクスを転記 |

## 多角的チェック観点（不変条件参照）

- **#1**: AC-08（視覚詳細 0 件）で担保
- **#5**: AC-11（API trace 完全一致）で副次的に担保
- **#6**: AC-10（不採用 4 項目）で担保
- **#7**: AC-05（a11y 契約 dialog/drawer/form/live region）で担保

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | DoD → AC 番号付与 | 7 | completed | 12 項目 |
| 2 | 3 軸マトリクス | 7 | completed | AC × step × failure |
| 3 | 不変条件マッピング | 7 | completed | #1/#5/#6/#7 |
| 4 | 未トレース確認 | 7 | completed | blocker 一覧 |
| 5 | outputs 作成 | 7 | completed | outputs/phase-07/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-07/main.md` | AC マトリクス |
| メタ | `artifacts.json` | Phase 7 を completed |

## 完了条件

- [ ] AC-01〜AC-12 全てが Phase 5 step / Phase 6 failure case のいずれかに紐付き
- [ ] 未トレース AC が 0 件（または blocker として記録）
- [ ] 不変条件 #1/#5/#6/#7 が AC に組み込まれている

## タスク 100% 実行確認【必須】

- [ ] 全 5 サブタスク completed
- [ ] outputs/phase-07/main.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 8（DRY 化）
- 引き継ぎ事項: 重複列構成 / 重複 link の DRY 対象
- ブロック条件: 未トレース AC が残存

## AC マトリクス

| AC | DoD 元文（元仕様書 §8） | Phase 5 step | Phase 6 failure case | 不変条件 |
| --- | --- | --- | --- | --- |
| AC-01 | §4.2 章立てに従い 300〜420 行で書き直し | Step 2 | #25 | - |
| AC-02 | §2 で 19 routes 全てに contract 表（同列構成） | Step 4 | #11, #12, #26 | - |
| AC-03 | §3 で 13 primitives + feature components の props 表 | Step 5 | #13, #14, #15, #28 | - |
| AC-04 | §4.2 で login 5 状態列挙 | Step 6 | #5〜#9, #16 | - |
| AC-05 | §5 a11y 契約が dialog / drawer / form / live region すべてカバー | Step 7 | #14, #22, #23, #24 | #7 |
| AC-06 | §6 で「視覚値の決定権は 09b にある」「HEX 直書き禁止」明記 | Step 8 | #1〜#4 | #1 |
| AC-07 | §7 Storybook 正本主義の段落が存在 | Step 9 | - | - |
| AC-08 | §6.2 grep で視覚詳細値 0 件 | Step 10 | #1, #2, #3, #4, #29 | #1 |
| AC-09 | §4.5 の 19 行 prototype 由来契約が漏れなく取り込まれ | Step 5 | #13〜#17 | - |
| AC-10 | §4.6 の 4 項目（tweaks / photo store / data-theme / gas-prototype）が §8 で「不採用」明記 | Step 9 | #18〜#21 | #6 |
| AC-11 | phase-3.md §2 と新 §2 の API 列が完全一致 | Step 4, Step 10 | #11, #12 | - |
| AC-12 | 09a / 09b へのリンクが contract 表内に存在 | Step 3, Step 4, Step 5 | #27 | - |

## 不変条件 ↔ AC マッピング

| 不変条件 | 該当 AC | 担保方法 |
| --- | --- | --- |
| #1 視覚詳細値の二重管理回避 | AC-06, AC-08 | grep gate で 0 件確認 |
| #5 apps/web → D1 禁止 | AC-11（API 経由のみと整合） | API trace check |
| #6 GAS prototype 非昇格 | AC-10 | §8 で「不採用」明記 |
| #7 dialog/drawer a11y | AC-05 | §5.2 完全文記述 |

## 元仕様書追加要件 ↔ AC マッピング

| 要件 | 該当 AC | 担保方法 |
| --- | --- | --- |
| 19 routes 列構成統一（認可 / layout / 主 component / API / 状態 / 主 props / a11y / token / 視覚詳細 link / 不採用） | AC-02 | Phase 5 Step 4 template コピペ |
| primitives 列構成統一（variants / sizes / props / a11y / state / token / 視覚詳細 link / Storybook） | AC-03 | Phase 5 Step 5 template コピペ |
| token prefix 規則（`--ubm-color-*` 等 8 系統） | AC-06 | §6.3 で集中記述 |
| 09a〜09h index 表配置 | AC-12 | §1 末尾に 8 行 index |
| login 5 状態正本化 | AC-04 | §4.2 で正本化、§2.2.1 は参照のみ |

## 未トレース blocker

なし（全 DoD が AC に番号付与され、Phase 5 step / Phase 6 failure case のいずれかに紐付き済み）。
