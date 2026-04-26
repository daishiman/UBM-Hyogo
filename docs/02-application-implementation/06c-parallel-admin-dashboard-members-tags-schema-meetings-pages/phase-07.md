# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 6 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

Phase 1 で確定した AC 10 件 と Phase 4 の verify 手段、Phase 5 の実装、Phase 6 の異常系を一対一で結び、抜け漏れを検出する。

## 実行タスク

1. AC × 検証 × 実装 × 異常系の 4 列マトリクスを作成
2. 各 AC に「測定指標」と「合格しきい値」を記述
3. 抜け漏れ・あいまい AC の修正提案
4. 不変条件 7 件への対応マッピング

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC 10 件 |
| 必須 | outputs/phase-04/admin-test-strategy.md | verify 手段 |
| 必須 | outputs/phase-05/admin-implementation-runbook.md | 実装位置 |
| 必須 | outputs/phase-06/main.md | failure case |

## AC マトリクス

| AC | 内容 | 検証手段 (Phase 4) | 実装位置 (Phase 5) | 異常系 (Phase 6) | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | drawer に profile 本文 input/textarea 不在 | unit test (queryByRole='textbox' === 0 in profile section) | MemberDrawer.tsx readOnly | - | #4, #11 |
| AC-2 | drawer から /admin/tags への導線のみ | unit test (no TagPicker form), E2E (link click) | MemberDrawer.tsx Link | - | #13 |
| AC-3 | schema 解消 UI が /admin/schema のみ | E2E (ナビ確認) | SchemaDiffPanel.tsx | unresolved バナー | #14 |
| AC-4 | attendance Combobox から削除済み除外 | unit (filter test) | MeetingPanel.tsx candidateMembers | 削除済み 404 | #15 |
| AC-5 | attendance 重複登録 disabled + 422 Toast | unit + E2E | MeetingPanel.tsx isDuplicate | 422 case | #15 |
| AC-6 | apps/web → D1 直接 import が ESLint error | lint test | no-restricted-imports rule | - | #5 |
| AC-7 | 未認証/非 admin で `/admin/*` redirect | E2E (auth boundary) | layout.tsx | 401/403 case | 認可 |
| AC-8 | dashboard KPI 4 種が 1 fetch で取得 | network tab (manual) + contract | app/admin/page.tsx | 5xx case | 無料枠 |
| AC-9 | 管理メモが public/member view へ漏れない | contract test (response schema) | NotesSection in drawer のみ | - | #12 |
| AC-10 | drawer に editResponseUrl ボタン | unit (button render) + E2E | MemberDrawer.tsx | - | #4 |

## 不変条件 → AC マッピング

| 不変条件 | 対応 AC | 担保 |
| --- | --- | --- |
| #4 | AC-1, AC-10 | 本文編集 form 不在 + Form 編集導線提供 |
| #5 | AC-6 | ESLint rule |
| #11 | AC-1 | 本文 readOnly |
| #12 | AC-9 | view model 分離 |
| #13 | AC-2 | tag は queue 経由のみ |
| #14 | AC-3 | schema は専用画面のみ |
| #15 | AC-4, AC-5 | 削除済み除外 + 重複防止 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化対象の優先度（AC が同じ component に集中） |
| Phase 10 | gate 判定（AC 全 trace） |
| Phase 12 | spec sync の根拠 |

## 多角的チェック観点

| 不変条件 | チェック | 理由 |
| --- | --- | --- |
| #4, #11 | AC-1 と AC-10 の二重防御（編集 form 不在 + Form 編集導線） | 本人本文編集禁止 |
| #5 | AC-6 の ESLint rule が CI で error | data access boundary |
| #12 | AC-9 が contract test で測定可能 | view model 漏れ防止 |
| #13 | AC-2 が unit + E2E の両方で test | tag queue 経路 |
| #14 | AC-3 が ナビ確認で測定 | schema 集約 |
| #15 | AC-4 と AC-5 が unit + E2E | attendance 整合 |

## 抜け漏れチェック

- ✅ 全 10 AC に検証手段
- ✅ 全 10 AC に実装位置
- ✅ 不変条件 7 件すべてに対応 AC
- ⚠️ AC-8 の「1 fetch」は Server Component の network 数を確認する必要 → manual + contract 併用

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC マトリクス | 7 | pending | 4 列 |
| 2 | 不変条件マッピング | 7 | pending | 7 → 10 |
| 3 | 抜け漏れ検出 | 7 | pending | 修正提案 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | サマリー |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 × 異常系 |
| メタ | artifacts.json | Phase 7 を completed |

## 完了条件

- [ ] AC 10 件 × 4 列のマトリクス完成
- [ ] 不変条件 7 件 → AC のマッピング完成
- [ ] 抜け漏れがゼロ、または修正提案付き
- [ ] 各 AC に「合格しきい値」が quantitative

## タスク100%実行確認

- 全 AC に行が存在
- 全 不変条件に対応 AC
- artifacts.json で phase 7 を completed

## 次 Phase

- 次: 8 (DRY 化)
- 引き継ぎ: AC が同一 component に集中している箇所を抽出 → DRY 化候補
- ブロック条件: 抜け漏れ未解消なら差し戻し
