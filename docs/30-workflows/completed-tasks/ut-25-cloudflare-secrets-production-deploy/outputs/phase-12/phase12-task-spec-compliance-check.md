# phase12-task-spec-compliance-check — 本ワークフロー全体の skill 適合チェック

## 対象 skill

- `.claude/skills/task-specification-creator/`
- `.claude/skills/aiworkflow-requirements/`

## 実測サマリー

| 項目 | 結果 |
| --- | --- |
| Phase ファイル | PASS: `phase-01.md`〜`phase-13.md` の 13 件あり |
| outputs ディレクトリ | PASS: `outputs/phase-01/`〜`outputs/phase-13/` の 13 件あり |
| Phase 11 outputs | PASS: `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 件あり |
| Phase 12 outputs | PASS: `main.md` + 6 補助成果物 = 7 件あり |
| Phase 13 outputs | PASS: `main.md` / `deploy-runbook.md` / `rollback-runbook.md` / evidence template 2 件あり |
| `outputs/artifacts.json` | PASS: root `artifacts.json` と同じ内容を配置済み |

## 7 観点チェック

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 1. SRP | PASS | 本タスクは Cloudflare Workers Secret `GOOGLE_SERVICE_ACCOUNT_JSON` 配置 runbook に閉じ、UT-26 / UT-09 / key 発行 / Workers 作成を分離 |
| 2. Phase 1〜13 完全性 | PASS | 13 Phase と各 outputs が揃う |
| 3. AC マトリクス | PASS | AC-1〜AC-11 は Phase 1 / 3 / 7 / 10 / 13 に trace 済み |
| 4. NON_VISUAL evidence | PASS | screenshot ディレクトリなし。CLI name 確認と manual log template に限定 |
| 5. unassigned-task 検出 | PASS | `unassigned-task-detection.md` に current 5 件 + deferred 2 件を記録 |
| 6. skill feedback | PASS | `skill-feedback-report.md` に改善提案 3 件を記録 |
| 7. docs sync | PASS | `system-spec-update-summary.md` に正本 3 ファイルへの反映結果を記録し、aiworkflow-requirements references を同一 wave で更新 |

## 4 条件ゲート（automation-30）

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | Phase 11 は実走ではなくユーザー承認後の staging smoke template に補正。Phase 13 も PR 作成ではなく PR 情報整理までに補正 |
| 漏れなし | PASS | task-specification-creator の Phase 12 7 成果物、Phase 11/13 outputs、`outputs/artifacts.json` を補完 |
| 整合性あり | PASS | 「仕様書整備」と「ユーザー承認後の実投入」を分離し、status は `spec_created` / `pending` 境界で扱う |
| 依存関係整合 | PASS | UT-03 / 01b / 01c を上流、UT-26 / UT-09 を下流に固定。production は Phase 13 runbook 経由に限定 |

## 注意付き PASS

本チェックは **仕様書整備 + 正本最小反映として PASS**。実 Cloudflare Secret 配置、`bash scripts/cf.sh secret list` の実 name evidence、PR 作成は本ワークフロー外で、ユーザーの明示指示が必要。aiworkflow-requirements 正本反映は Phase 12 review で実施済み、index は `generate-index.js` で再生成済み。

## コード互換変更

`apps/api/src/jobs/sync-sheets-to-d1.ts` は `GOOGLE_SERVICE_ACCOUNT_JSON` を canonical secret として参照し、移行期間のみ `GOOGLE_SHEETS_SA_JSON` legacy alias を fallback として許容する。`resolveServiceAccountJson` の単体テストで canonical 優先順位を検証する。

## 実装ディレクトリ確認

ユーザー指定の `apps/desktop/` / `apps/backend/` は本ワークツリーに存在しない。現行構成は `apps/api/` / `apps/web/` / `packages/shared/` であり、UT-25 の実装影響は `apps/api/` の Sheets sync secret 参照に限定される。`packages/shared/` に今回の secret 配置仕様で必要な変更はない。

## 検証コマンド

```bash
ls docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-*.md | wc -l
ls -d docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-*/ | wc -l
ls docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-11/ | wc -l
ls docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-12/ | wc -l
ls docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/ | wc -l
test -f docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/artifacts.json
```
