# Phase 12 Task 12-5: Skill Feedback Report（改善点なしでも出力必須）

## 対象 skill

- `task-specification-creator`
- `aiworkflow-requirements`

## フィードバック

| 観点 | 記録内容 |
| --- | --- |
| テンプレート改善（候補あり） | legacy umbrella pattern 専用テンプレを `task-specification-creator/references/` に追加する候補（例: `legacy-umbrella-template.md`）。本タスクの構造（責務移管表 / stale↔正本表 / schema ownership / 移植要件） を雛形化すれば、将来の同種 close-out が高速化する |
| ワークフロー改善（候補あり） | `audit-unassigned-tasks.js` に `--detect-legacy-umbrella` フラグを追加する候補。現状は 9 セクションと filename / 苦戦箇所の検証のみ。legacy umbrella 文脈では「direct 残責務 0 件の表が存在するか」も検出できると good |
| ドキュメント改善（候補あり） | `docs/30-workflows/unassigned-task/` の README に「legacy umbrella としての close-out 手順」セクションを追加する候補。現状は新規 unassigned task の起票手順のみ |
| Phase 11 NON_VISUAL 縮約テンプレ | `phase-11-non-visual-alternative-evidence.md` の章立て（audit / stale path / conflict marker / git diff / spec dry-read / table rendering）が本タスクで有効に機能した。継続採用を推奨 |
| Phase 12 必須 5 + Task 6 | `phase-12-completion-checklist.md` のチェック粒度が docs-only にも適合した。`metadata.workflow_state` を据え置く運用（spec_created のまま）の明記は特に有用 |
| 良かった点（記録） | (a) docs-only / NON_VISUAL の分岐が明確、(b) Phase 12 必須成果物リストが網羅的、(c) AC matrix の positive/negative 軸が legacy close-out にも適合 |
| 追加未タスク | あり。`task-sync-forms-d1-legacy-followup-cleanup-001` に stale 正本掃除・逆リンク反映・legacy umbrella skill 改善をまとめて登録 |

## 詳細: 改善候補 1（legacy umbrella テンプレ）

| 項目 | 内容 |
| --- | --- |
| 提案 | `task-specification-creator/references/legacy-umbrella-template.md` を追加 |
| 含めるべき節 | 責務移管表 / stale↔正本対応 7 観点 / schema ownership 宣言 / 4 案比較（A/B/C/D） / NON_VISUAL evidence bundle / spec_created 据え置き運用 |
| 効果 | 同種 close-out（例: 別 legacy task）の Phase 仕様生成時間を短縮 |
| 優先度 | low（本タスクが reference example として機能するため、当面は本タスクを参照する運用で代替可能） |

## 詳細: 改善候補 2（audit-unassigned-tasks.js 拡張）

| 項目 | 内容 |
| --- | --- |
| 提案 | `--detect-legacy-umbrella` フラグ |
| 検出ロジック | (a) `legacy umbrella` 表記の有無、(b) 責務移管表の存在、(c) `direct 残責務.*0 件` 文字列の hit |
| 効果 | legacy umbrella 文脈の docs を自動的に検出し、新規実装タスクと区別できる |
| 優先度 | low |

## 詳細: 改善候補 3（unassigned-task README）

| 項目 | 内容 |
| --- | --- |
| 提案 | README に「legacy umbrella close-out 手順」を追加 |
| 含めるべき節 | (a) 適用条件、(b) 責務移管の確認手順、(c) NON_VISUAL evidence、(d) `metadata.workflow_state` 据え置きルール |
| 効果 | 新規メンバーが legacy umbrella の運用を独立して判断できる |
| 優先度 | medium（follow-up task で回収） |

## 出力義務

本ファイルは Phase 12 必須成果物。改善点 0 件でも出力する（phase-12.md Task 12-5 規定）。
