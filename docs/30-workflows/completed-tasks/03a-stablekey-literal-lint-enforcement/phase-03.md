# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-stablekey-literal-lint-enforcement |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 8b (lint config follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 で確定した「ESLint custom rule + filepath glob allow-list + 既存 lint job 統合」案を、3 つの代替案と比較し、PASS / MINOR / MAJOR の 3 段階で正式採用する。MINOR 改善は Phase 5 runbook / Phase 8 パフォーマンス検証へ吸収する。

## 代替案比較

| # | 案 | 概要 | 強み | 弱み | コスト | 判定 |
| --- | --- | --- | --- | --- | --- | --- |
| A | ESLint custom rule（採用候補） | `@typescript-eslint/utils` AST 走査で `Literal` ノードを検査し、既知 stableKey 集合と完全一致するものを allow-list 外で error 報告 | IDE 即時 feedback / monorepo lint pipeline に自然統合 / 開発者 DX 良 | rule 実装の初期コスト / `known_stablekey_set` 構築の build time 解析が必要 | 中 | **PASS（採用）** |
| B | ts-morph 静的検査スクリプト | `scripts/check-stablekey-literals.ts` を独立 CLI として CI から起動 | 型情報を伴う高度な判定（symbol 解決 / declared origin 追跡）が容易 / rule 実装より柔軟 | IDE 即時 feedback なし / CI 走行時間が独立 / 開発者は CI まで気づかない | 中〜高 | MINOR（不採用、補助案） |
| C | runtime guard（実行時検証） | アプリ起動時に stableKey 値を検証し、未知値で例外 | 実装単純 / runtime で確実に検出 | 静的検査ではない（CI fail にならない） / production 影響リスク / AC-1「lint レベルで CI fail」を満たさない | 低（ただし AC 不満足） | **MAJOR（不採用）** |

## レビュー観点

- **再現性**: 案 A は IDE / pre-commit / CI のすべてで同一 rule が走り、開発者の手元から CI まで一貫検出。案 B は CI 段階のみで feedback が遅延、案 C は実行時のみで CI fail にならない。
- **AC 充足**: 案 A は AC-1（lint レベル CI fail）/ AC-3（既存 PASS）/ AC-4（違反 fixture FAIL）/ AC-7（false positive 0）すべてに直接適合。案 C は AC-1 を満たさないため失格。
- **開発者 DX**: 案 A が最良（VSCode squiggle）。案 B は CI 走行待ちのフィードバックで DX が劣る。
- **保守性**: 案 A の rule は ESLint 9 flat config + `@typescript-eslint/utils` で 1 ファイル化が容易。allow-list を json で外出しすれば設定変更コストが低い。
- **拡張性**: 案 A は将来 consent 系や他 enum の重複防止 rule を同一基盤で追加しやすい。
- **不変条件適合**: 案 A は不変条件 #1 を CI 段階で構造的に閉塞。案 C は #1 を runtime までずらすため AC-7「fully enforced」要件を満たさない。

## PASS / MINOR / MAJOR

| 評価項目 | 結果 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 不変条件 #1 を CI 静的検査で恒久保護、AC-1〜7 すべてに直接適合 |
| 実現性 | PASS | wave 8b lint config 完了後に既知 ESLint パターンで実装可能 |
| 整合性 | PASS | 既存 lint job への統合で済み、CI 構造への侵襲ゼロ |
| 運用性 | MINOR | `known_stablekey_set` 構築の精度（build time 解析 vs 手動 manifest）が運用負荷に影響。Phase 5 runbook で構築方式を確定し、Phase 8 で走行時間を計測 |
| DX | PASS | IDE 即時 feedback / 明確なエラーメッセージ |

総合: **PASS（軽微改善あり、Phase 5 runbook と Phase 8 パフォーマンス計測に吸収）**

## MINOR 改善要望（次 Phase へ伝達）

- **Phase 5 へ**: `known_stablekey_set` の構築方式を「build time 解析 = `@typescript-eslint/parser` の type info 利用」を一次案、「手動 manifest」を二次案として runbook 化。手動 manifest を採用する場合は manifest と正本の drift を別 CI job で監査する手順も併記。
- **Phase 8 へ**: rule 走行時間（特に大規模 monorepo での AST 走査負荷）を計測し、`pnpm lint` 全体のリードタイムが現状比 +20% を超えないことを確認。
- **Phase 9 へ**: `eslint-disable` コメントによる suppression 監査ポリシー（rule 単独 disable は禁止、ファイル全体 disable は管理者承認）を gate 化。
- **Phase 12 へ**: consent 系（`publicConsent` / `rulesConsent`）の重複防止は本 rule の射程外であることを unassigned-task-detection に記録。

## 案 B（ts-morph）を補助案として保持する理由

案 A の rule で型情報を伴う判定が必要になった場合（symbol 解決 / re-export チェーンを辿る等）、案 B のロジックを参考実装として併用できる。本タスクでは初期 scope に含めないが、Phase 12 で「将来拡張余地」として記録する。

## 案 C（runtime guard）を MAJOR 不採用とする最終理由

- AC-1「lint レベルで CI が fail する」を構造的に満たさない
- 不変条件 #1 の保護を runtime までずらすと、production 段階で初めて違反が顕在化するリスク
- 静的検査での enforce が本タスクの中核要件である

## 実行タスク

- [ ] 3 案比較表を `outputs/phase-03/main.md` に記録
- [ ] PASS / MINOR / MAJOR 判定の根拠記述
- [ ] MINOR 改善要望を Phase 5 / Phase 8 / Phase 9 / Phase 12 にメモ
- [ ] 案 B を補助案として保持する旨を明記
- [ ] 案 C を MAJOR 不採用とする最終根拠を記述

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 設計サマリ |
| 必須 | outputs/phase-02/allow-list-spec.md | allow-list 確定版 |
| 必須 | outputs/phase-02/rule-detection-spec.md | 検出ロジック疑似コード |
| 参考 | docs/30-workflows/completed-tasks/task-03a-stablekey-literal-lint-001.md | 元 unassigned-task spec の推奨アプローチ |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 案 A 採用前提の test matrix（既存 PASS / 違反 FAIL / 例外 PASS / suppression 監査） |
| Phase 5 | MINOR 改善（`known_stablekey_set` 構築方式 runbook 化） |
| Phase 8 | rule 走行時間計測 |
| Phase 9 | suppression 監査 gate |
| Phase 12 | consent 系射程外、案 B 将来拡張余地 |

## 多角的チェック観点

- 不変条件 **#1** 保護: 案 A のみが静的に閉塞
- 不変条件 **#4** 整合: rule が apps/api / apps/web 両方で等しく走る
- DX: IDE feedback の有無
- AC 充足: AC-1 / AC-7 が決定打
- 拡張性: 同一基盤での他 rule 追加可能性

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | 3 案比較表 | 3 | pending |
| 2 | PASS / MINOR / MAJOR 判定 | 3 | pending |
| 3 | MINOR 改善要望伝達 | 3 | pending |
| 4 | 案 B 補助案保持メモ | 3 | pending |
| 5 | 案 C 不採用根拠明記 | 3 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | Phase 3 主成果物（3 案比較 / PASS-MINOR-MAJOR / MINOR 改善要望） |

## 完了条件

- [ ] 3 案比較表完成
- [ ] PASS / MINOR / MAJOR 判定済み
- [ ] MINOR 改善要望が Phase 5 / 8 / 9 / 12 へ伝達
- [ ] 案 A 採用、案 B 補助、案 C 不採用が明確化

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（rule bypass / 例外濫用 / 走行時間悪化）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 3 を completed

## 次 Phase

- 次: Phase 4 (テスト戦略)
- 引き継ぎ: 案 A（ESLint custom rule）採用前提で、既存 PASS / 違反 FAIL / 例外 glob PASS / suppression 監査の 4 軸で test matrix を組む。`known_stablekey_set` 構築方式の決定は Phase 5 runbook で行うが、test matrix では「set が正しく構築されている前提」で PASS / FAIL を網羅する。
- ブロック条件: 案 A 採用 + MINOR 改善要望伝達 が完了するまで Phase 4 不可。
