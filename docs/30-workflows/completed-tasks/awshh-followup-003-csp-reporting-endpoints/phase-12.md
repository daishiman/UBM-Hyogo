# Phase 12: ドキュメント更新

## 目的

実装結果（Reporting-Endpoints / Report-To / report-to）をドキュメントに反映し、元 placeholder を consumed trace 化する。aiworkflow-requirements の current task inventory に本 workflow を登録する。

## 必須出力ファイル（7 つ）

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ |
| `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベル |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 仕様書遵守チェック（9 canonical headings） |
| `outputs/phase-12/system-spec-update-summary.md` | system spec 更新サマリ |
| `outputs/phase-12/skill-feedback-report.md` | skill フィードバック |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 unassigned task の検知（0 件でも出力） |
| `outputs/phase-12/documentation-changelog.md` | ドキュメント changelog |

## 更新対象

### 1. 元 placeholder の consumed trace 化

元: `docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-003-reporting-endpoints.md`
→ 本 workflow `outputs/phase-12/unassigned-task-detection.md` に consumed trace ヘッダーを記載し、本 workflow ディレクトリへ吸収済みであることを明示。

### 2. aiworkflow-requirements 同期

- 本 workflow を inventory に追加（implemented_local_evidence_captured）
- `mise exec -- pnpm indexes:rebuild` で indexes 再生成

### 3. system spec 更新（本サイクルで判定）

- 新規 interface（`buildReportingEndpointsHeader` / `reportEndpoint`）追加のため Step 2 該当。security-headers 仕様を記す system spec があれば反映。

### 4. runbook（retention / privacy）

Phase 11 の `privacy-review.md` を runbook 化し、Sentry retention / data scrubbing / U-AWSHH-001 着手前提条件を明記。

## 不変条件再確認

- AC-6: `git diff --stat -- apps/api apps/api/migrations` 0 件
- 不変条件 #5: D1 binding 不変
- CONST_007: 受信先確定済み・先送りなし

## 完了条件

- [ ] 7 ファイル全存在
- [ ] 元 placeholder の consumed trace 化
- [ ] aiworkflow-requirements indexes 登録
- [ ] changelog 反映
- [ ] runbook に retention / privacy 記載

## 次フェーズ引き継ぎ

Phase 13 で user 承認後に PR 作成。base=dev。Issue #868 は CLOSED のまま（再オープンしない）。
