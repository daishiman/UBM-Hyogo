# Phase 12: Skill Feedback Report

## テンプレ改善

- `taskType` と `visualEvidence` の混線を防ぐため、Phase 1 メタ情報表に両方を明示する必要がある。

## ワークフロー改善

- Phase 4 のコマンドは package name 実態（`@ubm-hyogo/web`）に照合してから記録する。
- `NEXT_PUBLIC_API_ORIGIN` のような未存在 env 名は Phase 1 current baseline grep で検出し、仕様内に残さない。

## ドキュメント改善

- aiworkflow 正本同期対象は Phase 2 時点で列挙し、Phase 12 で strict 7 と同時に反映する。
