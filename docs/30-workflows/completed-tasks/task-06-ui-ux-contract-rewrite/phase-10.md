# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-06-ui-ux-contract-rewrite |
| Wave | 2 |
| 実行種別 | parallel |
| Phase 番号 | 10 / 13 |
| 作成日 | 2026-05-07 |
| 上流 Phase | 9 (品質保証) |
| 下流 Phase | 11 (手動 smoke) |
| 状態 | completed |

## 目的

Phase 1〜9 の成果を統合レビューし、`docs/00-getting-started-manual/specs/09-ui-ux.md` の契約のみ書き換えが後続 task-07 / task-08 / task-09 / task-10 / task-11..17 に GO 渡し可能であるかを最終判定する。本タスクは Wave 2 の parallel 実行であり、task-07（prototype-mapping-table）/ task-08（design-tokens-doc）と相互排他の責務分担で並走するため、ここで NO-GO だと後続実装 wave が「契約の正本」を欠いた状態で着手することになり、19 routes の props / state / a11y 整合が取れない。

## 実行タスク

1. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）の最終確認
2. 元仕様書 §9 リスク表の緩和策が Phase 1〜9 で全件カバーされたか確認
3. 元仕様書 §8 DoD 13 項目すべての設計 trace
4. 後続 task への引き渡し可能性確認（task-07 / task-08 並列性 / task-09 / task-10 / task-11..17）
5. blocker 一覧の作成（あれば）
6. GO / NO-GO 判定
7. outputs/phase-10/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/main.md | AC マトリクス |
| 必須 | outputs/phase-09/main.md | 品質保証 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-06-w2-par-ui-ux-contract-rewrite.md | 元仕様（§8 DoD / §9 リスク） |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | 正本順位・diff scope 規律 |
| 参照 | docs/00-getting-started-manual/specs/09-ui-ux.md | 書き換え対象（現行版） |

## 実行手順

### ステップ 1: 4 条件評価の最終確認
- 価値性: 19 routes contract が grep 1 行で実装側に降りる経路が確保されているか
- 実現性: 1.0 人日（Tech Writer 単独）の見積に整合するか
- 整合性: phase-3 §2 API 接続表との完全一致 / 09a / 09b / Storybook 正本の link 一貫性
- 運用性: 視覚詳細混入 grep gate が pre-commit / 手動で運用可能か

### ステップ 2: §9 リスク表 4 件の緩和策確認
| リスク | 緩和策 | Phase で確認 |
|--------|--------|--------------|
| 視覚詳細削除によるレビュアー反発 | §1 / §7 で Storybook + 09a 正本明記 | Phase 5 / 8 |
| 19 routes フォーマット揺れ | §4.3 サンプル表を template 化 | Phase 5 / 7 |
| primitives 列挙漏れ | §4.5 を checklist 化 | Phase 6 / 7 |
| API trace 漏れ | §6.4 phase-3 §2 完全一致 | Phase 4 / 9 |

### ステップ 3: §8 DoD 13 項目の trace
1. 章立て §1〜§10（300〜420 行）
2. §2 で 19 routes contract 表（列構成統一 10 列）
3. §3 で 13 primitives + feature components props 表
4. §4.2 login 5 状態列挙
5. §5 a11y 契約（dialog / drawer / form / live region 全カバー）
6. §6 視覚値の決定権 09b 明記 + HEX 直書き禁止
7. §7 Storybook 正本主義段落
8. §6.2 grep で視覚詳細 0 件
9. §4.5 の 19 行 prototype 由来契約取り込み
10. §4.6 の 4 不採用項目明記
11. phase-3 §2 と §2 API 列完全一致
12. markdown lint error 0
13. 09a / 09b への link path 確定

### ステップ 4: 後続 task への引き渡し可能性
- task-07: §0.7 grep 見出しから 09a-prototype-map.md の構造を導出可能
- task-08: §6.3 token prefix 規則から 09b-design-tokens.md 名前空間を導出可能
- task-09: §6 token 参照規則から tailwind v4 設定を導出可能
- task-10: §3 primitives 表を実装の正本として参照
- task-11..17: §2 routes 表 1 行 → 1 画面の決定論的対応

### ステップ 5: blocker 抽出
### ステップ 6: GO/NO-GO 判定
### ステップ 7: outputs/phase-10/main.md 作成

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定後に NON_VISUAL 縮約 smoke（grep gate / markdown lint / trace check）実施 |
| Phase 13 | PR 作成可否の根拠 |
| 後続 task-07 / 08 | 並列実行のため「本契約が確定した時点で着手可能」を明示 |
| 後続 task-09 / 10 / 11..17 | 本契約 §2 / §3 を実装の正本として参照 |

## 多角的チェック観点（不変条件参照）

- **CLAUDE.md #1**（schema 固定回避）: 契約に Google Form schema を直接焼き込まない記述になっているか
- **CLAUDE.md #2**（consent キー統一）: §2.1.4 register 契約に `publicConsent` / `rulesConsent` のみ記述
- **CLAUDE.md #3**（responseEmail = system field）: contract 上で system field 扱い明記
- **CLAUDE.md #5**（apps/web → D1 禁止）: 契約上も apps/api 経由 API 接続のみ
- **CLAUDE.md #6**（GAS prototype 非昇格）: §4.6 で gas-prototype 由来不採用明記
- **task-06 元仕様 §0.5 不変条件 4**: 視覚詳細値 0 件を §6.2 grep gate で保証

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 4 条件評価 | 10 | completed | 全 PASS 目標 |
| 2 | §9 リスク 4 件確認 | 10 | completed | 緩和策 trace |
| 3 | §8 DoD 13 項目 trace | 10 | completed | 設計 trace |
| 4 | 後続 5 task 引き渡し確認 | 10 | completed | 07/08/09/10/11..17 |
| 5 | blocker 抽出 | 10 | completed | 0 件目標 |
| 6 | GO/NO-GO | 10 | completed | GO 目標 |
| 7 | outputs 作成 | 10 | completed | outputs/phase-10/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | 最終レビュー + GO/NO-GO |
| メタ | artifacts.json | Phase 10 を completed |

## 完了条件

- [ ] 4 条件評価結果が記録（全 PASS）
- [ ] §9 リスク 4 件の緩和策確認済み
- [ ] §8 DoD 13 項目すべて trace 済み
- [ ] 後続 5 系統 task への引き渡し可能性が記録
- [ ] GO/NO-GO 判定が明示

## タスク 100% 実行確認【必須】

- [ ] 全 7 サブタスク completed
- [ ] outputs/phase-10/main.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 11（NON_VISUAL 縮約 manual smoke）
- 引き継ぎ事項: GO 判定 → grep gate / markdown lint / trace check evidence 取得
- ブロック条件: NO-GO の場合 Phase 11 不可

## GO/NO-GO 判定

### 4 条件評価

| 条件 | 結果 | 根拠 |
| --- | --- | --- |
| 価値性 | TBD | 19 routes contract が単一ファイル grep で降りる |
| 実現性 | TBD | 1.0 人日見積 / 全面書き換え 1 ファイル |
| 整合性 | TBD | phase-3 §2 / 09a / 09b / Storybook の link 整合 |
| 運用性 | TBD | §6.2 grep gate が pre-commit 運用可能 |

### Blocker 一覧

（spec phase 想定 0 件。task-07 / task-08 が新規ファイル path のみ確定すれば link 解決は完了扱い）

### 最終判定

**GO（spec phase）想定**: Phase 1〜9 の設計に blocker なし。後続 task-07 / 08 は本 task と並列で着手可能、task-09 / 10 / 11..17 は本契約マージ後に GO。
