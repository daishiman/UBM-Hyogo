# Skill Feedback Report

## Template Improvements

- `spec_created` / `implemented_local_evidence_captured` の表記ゆれを early gate で検出する価値がある。今回の初期仕様は `spec-created` hyphen 表記で drift していた。

## Workflow Improvements

- 実装仕様書が apps/packages 変更対象を明記し、同サイクルで実装可能な場合は spec-only close-out にしない。CONST_004/005 と task-specification-creator の same-wave sync 方針に従い、実コード・テスト・正本同期まで完了させる。

## Documentation Improvements

- 既存 follow-up が物理ファイルとして存在しない場合でも、親/aiworkflow に参照が残っていれば consumed pointer を明示的に作成し、stale 参照を残さない。

## Applied 30-Pattern Compact Evidence

30 種思考法は、仕様だけで閉じる案を棄却し、typed error + 既存 cooldown timer 再利用 + focused specs + same-wave sync に収束させるために適用した。詳細は final summary と Phase 12 compliance check に記録する。
