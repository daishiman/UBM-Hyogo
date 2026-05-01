# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 (U-UT01-08) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-30 |
| 前 Phase | 6（異常系） |
| 次 Phase | 8（DRY 化 / 仕様間整合） |
| 状態 | spec_created |
| タスク分類 | specification-design（acceptance-traceability） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

`index.md` で定義された AC-1〜AC-8 を、**検証手段 × 関連 Phase × 関連成果物 × PASS 基準** の 4 軸で表に落とし、トレーサビリティを担保する。動作テストではなく文書レビューと grep / 直交性突合 / 4 条件再判定を中心とする。本 Phase は AC が「全 PASS で根拠付き」（AC-7）であることを最終的に裏付ける。

## 完了条件チェックリスト

- [ ] AC-1〜AC-8 の全 8 項目が表に揃っている（index.md と完全一致）
- [ ] 各 AC に「検証手段」が 1 つ以上紐付いている
- [ ] 各 AC に「関連 Phase」「関連成果物パス」が記載されている
- [ ] 各 AC の PASS 基準が客観的に判定可能な形で記述されている
- [ ] AC-7（4 条件評価）と AC-8（Phase 12 の 7 必須成果物）の特殊性が補足されている

## AC マトリクス

| AC | 内容（要約） | 検証手段 | 関連 Phase | 関連成果物 | PASS 基準 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `status` canonical 5 値確定（`pending`/`in_progress`/`completed`/`failed`/`skipped`） | 文書レビュー（採択理由 / 代替案比較が記述されている） | Phase 2 | `outputs/phase-02/canonical-set-decision.md` | 5 値が明示列挙され、採択理由が 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）で根拠付けられている |
| AC-2 | `trigger_type` canonical 3 値確定（`manual`/`cron`/`backfill`）+ `triggered_by` 別カラム分離 | 文書レビュー（軸分離（actor vs mechanism）の論証が記述） | Phase 2 | `outputs/phase-02/canonical-set-decision.md` | 3 値 + `triggered_by` 設計が記述、`admin` の取り扱いが「`manual` 値 + `triggered_by='admin'` 注入」と明示 |
| AC-3 | 既存値 → canonical マッピング表（変換 UPDATE 疑似 SQL 含む） | grep（Phase 4 計画）で抽出した既存値 ⊆ マッピング source、文書レビュー | Phase 2, Phase 4, Phase 5 | `outputs/phase-02/value-mapping-table.md`, `outputs/phase-05/contract-runbook.md` | 全既存値（`running`/`success`/`failed`/`skipped`/`admin`/`cron`/`backfill`）が source 列に網羅、各行に target + 疑似 UPDATE 文が記述 |
| AC-4 | shared 配置先決定（types only / Zod 併設 / U-UT01-10 統合 or 分離） | 文書レビュー（4 案の比較表 + 採択判断） | Phase 2 | `outputs/phase-02/shared-placement-decision.md` | 採択案が 1 つに確定、U-UT01-10 との統合 or 分離方針が明記 |
| AC-5 | 既存実装書き換え対象範囲リスト（ファイル + 行番号 + 変更種別） | grep ベース実測（Phase 4 計画に基づく行番号確定） | Phase 4, Phase 5 | `outputs/phase-05/rewrite-target-list.md` | リストの全行に「ファイル / 行範囲 / 現行値 / canonical 値 / 変更種別 / 担当タスク」6 列が埋まっている、UT-04 / UT-09 / U-UT01-10 が即着手できる粒度 |
| AC-6 | U-UT01-07 / U-UT01-09 / U-UT01-10 との直交関係明記 | 直交性突合（各タスクの「含まない」セクションと本タスク決定を逐一突合） | Phase 4 | `outputs/phase-04/test-strategy.md` § 4 | 3 関連タスクすべてに対し「侵食なし」の根拠（具体的決定事項を挙げて） が記述 |
| AC-7 | 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き | 4 条件再判定（各 Phase 多角的チェック観点を集約） | Phase 1〜10 横断（特に Phase 2, 6, 10） | `outputs/phase-02/*`, `outputs/phase-06/failure-cases.md`, `outputs/phase-10/go-no-go.md` | 4 条件すべてに 1 つ以上の具体根拠（成果物パス + 該当章）が紐付いている |
| AC-8 | Phase 12 で 7 必須成果物確認（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main） | 文書存在確認（ファイルパス確認） | Phase 12 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | 7 ファイルすべてが存在し、各々が空でなく規定の章立てを満たす |

## 異常系カバレッジ補助列（Phase 6 連動）

各 AC が Phase 6 のどの異常 Case を予防するかの補助マッピング:

| AC | 予防する Case | 連動メカニズム |
| --- | --- | --- |
| AC-1 | Case 5（`skipped` 分岐リスク） | 5 値採択を一義化することで分岐を解消 |
| AC-2 | Case 4（trigger 軸ずれ） | mechanism 軸統一 + actor 別カラム化 |
| AC-3 | Case 1（CHECK 制約違反）/ Case 2（集計 silent drift） | 変換 UPDATE 文と source 網羅で漏れを排除 |
| AC-4 | Case 6（ランタイム検証漏れ） | Zod 併設可否を明示決定 |
| AC-5 | Case 2（grep 漏れ） | 行番号レベルで対象を固定 |
| AC-6 | （直接の予防対象なし。スコープクリープ防止） | 関連タスクの責務を侵食しない |

## 検証手段の凡例

| 凡例 | 意味 |
| --- | --- |
| 文書レビュー | 該当成果物を Read し、章立て・必須項目の存在を目視確認 |
| grep | `git grep` / Phase 4 grep 計画パターンを適用し、ヒット件数 / 値集合を機械的に確認 |
| 直交性突合 | 関連タスクの「含まない」セクションと本タスク決定事項を 1:1 で対照 |
| 4 条件再判定 | 価値性 / 実現性 / 整合性 / 運用性 のチェック観点を成果物に対し再走査 |
| 文書存在確認 | ファイルパスの存在 + サイズ > 0 + 規定の見出し存在を確認 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/index.md` § 受入条件 | AC-1〜AC-8 の正本 |
| 必須 | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-02/*` | AC-1, AC-2, AC-3, AC-4 の根拠 |
| 必須 | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-04/test-strategy.md` | AC-3 grep / AC-6 直交性突合 |
| 必須 | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-05/rewrite-target-list.md` | AC-5 |
| 必須 | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-06/failure-cases.md` | AC 補助カバレッジ |

## 成果物

| 成果物 | パス | 概要 |
| --- | --- | --- |
| AC マトリクス | `outputs/phase-07/ac-matrix.md` | AC × 検証手段 × 関連 Phase × 成果物 × PASS 基準 + 異常系カバレッジ補助 |

## 次 Phase への引き渡し

- Phase 8 DRY 化では、AC マトリクスの「関連成果物」列を入力として、成果物間の重複（同一決定が複数ファイルに散在していないか）を検査する。
- Phase 10 最終レビューゲートでは、本マトリクスをチェックリストとして再走査し AC-7 全 PASS の最終判定を行う。

## 多角的チェック観点

- **価値性**: AC ごとに「具体的に何を見れば PASS と判定できるか」が一意か
- **実現性**: 検証手段が文書 / grep / 直交性突合 / 文書存在確認 のみで構成されており、ランタイムテストに依存していないか
- **整合性**: AC-1〜AC-8 が index.md / U-UT01-08 起票仕様 § AC と完全一致しているか
- **運用性**: Phase 10 ゲートでマトリクスをそのまま走査するだけで Go/No-Go 判定できる粒度か

## 注意事項

- 本 Phase は **判定基準の文書化のみ**。実際の PASS 確認は Phase 10 / 11 / 12 で行う。
- AC-8 の 7 必須成果物存在確認は Phase 12 の責務（本 Phase ではパスと項目を予約するのみ）。
