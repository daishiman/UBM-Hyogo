# Phase 10: リスク再評価

## 10.1 残存リスク

| リスク | 影響度 | 発生確率 | 対策 | 本タスクでの対応 |
| --- | --- | --- | --- | --- |
| 既存 references との記述重複により、正本がかえって分散する | 中 | 中 | 既存 reference からは link のみとし、定義本体は新 reference に一本化 | Phase 5 Step 5 で link のみを追加し、既存 reference 内に状態定義の重複を作らない |
| 状態語彙が将来追加された際、新 reference が陳腐化する | 中 | 中 | SKILL-changelog.md に version 行を追記する運用を最初の version 行で明示 | vocabulary 末尾に「状態追加時は本ファイルを唯一の正本として更新し、SKILL-changelog.md に version 行を追加する」と明記 |
| hook / CI gate なしでは drift 防止が人間規律のみに依存する | 高 | 中 | 「機械的強制が必要」と reference 末尾に明記し、後続タスク（hook 化）の発見トリガーとする | vocabulary §7「機械的強制が必要な観点」に明示。Phase 12 unassigned-task-detection に後続タスクとして登録 |
| 命名が長い状態語彙の誤用（`PASS` 単独表記）が継続する | 中 | 中 | 禁止表記を reference 冒頭に明示し、phase-template-phase11.md からも link する | 禁止表記節を vocabulary 上位章に置き、phase-template-phase11.md から link を追加 |
| indexes:rebuild の差分が aiworkflow-requirements 以外に波及する | 低 | 低 | rebuild 後の diff を必ず確認し、想定外なら commit 前にユーザー報告 | Phase 7.5 にフォールバック手順を記載 |
| Phase 12 close-out で workflow_state を据え置きすべきところを `completed` に書き換える誤運用 | 中 | 中 | vocabulary §「Phase 開始時 reclassify ルール」に「docs-only / spec_created タスクは workflow root を据え置き、phases[].status のみ更新」を明記 | Phase 5 Step 2 で記述 |

## 10.2 リスク受容判断

- 「機械的強制なし」については本タスクでは文書化に閉じ、後続タスクで hook 化を分離（CONST_007 に従い、明確に範囲外の理由を記述）
- 「indexes drift の波及」は確率が低く、フォールバック手順で十分

## 10.3 後続タスクへの引き渡し（CONST_007 例外）

本タスクのスコープ外として後続タスクで対応する項目（Phase 12 unassigned-task-detection に登録予定）:

1. **workflow_state の機械的強制** — lefthook / pre-commit / pre-push hook で `artifacts.json.metadata.workflow_state` と phase 進捗の整合を検査する gate 実装
2. **CI gate での compliance-check 自動生成** — phase-12 compliance-check ファイルが存在するかをチェックし、未生成 PR を block する CI workflow

これらは「分量が多い」のではなく「hook 設計と CI 設計を含む独立スコープ」として分離する。文書化のみの本タスクと一括 PR にすると review 観点が混在するため、関心ごとの分離として後続タスクに切り出す。

## DoD

- [ ] 10.1 のリスク表が更新され、各リスクに対する Phase 内での具体的対処が記述されている
- [ ] 10.3 の後続タスク 2 件が Phase 12 unassigned-task-detection に登録される予定

## 次フェーズへの引き渡し

Phase 11 で NON_VISUAL evidence contract を確立し、`outputs/phase-11/` に必要な log を集約する。
