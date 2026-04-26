# Skill Feedback Report

## 対象スキル

| スキル | フィードバック |
| --- | --- |
| `task-specification-creator` | Phase 12 の必須成果物名と task root の `outputs/phase-12/` 実体突合を先に行うチェックが有効。今回 `system-spec-update-summary.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` の不足を後段レビューで検出した。 |
| `aiworkflow-requirements` | 新規 integration package の env secret、public API、completed task discoverability を same-wave で同期する運用が必要。 |

## 改善提案

| 優先度 | 提案 | 理由 |
| --- | --- | --- |
| P1 | Phase 12開始時に `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` を固定リストで存在確認する | 必須成果物漏れを早期に検出できる |
| P1 | package export と implementation guide の import path を同一チェックに含める | テストが相対 import で通っても下流が使えない問題を防ぐ |
| P2 | non_visual task でも Phase 11 に「スクリーンショット不要」の根拠ファイルを必須化する | UI証跡要否の判断を後から追える |

## 今回反映した改善

- `@ubm-hyogo/integrations/sheets-auth` subpath export を追加
- root export から `getAccessToken` / 型 / `SheetsAuthError` を再公開
- implementation guide を Part 1 / Part 2 構成へ更新
- KV cache key を Service Account ごとに分離
- Token Endpoint error body を例外 message へ含めないよう修正
