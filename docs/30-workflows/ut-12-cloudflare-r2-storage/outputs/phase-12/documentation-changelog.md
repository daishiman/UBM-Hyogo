# Documentation Changelog — UT-12

## 変更ファイル一覧

| 日付 | 種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-27 | 新規 | `docs/30-workflows/ut-12-cloudflare-r2-storage/index.md` | タスク仕様書インデックス（`spec_created` 境界・AC 状態定義） |
| 2026-04-27 | 新規 | `docs/30-workflows/ut-12-cloudflare-r2-storage/artifacts.json` | 機械可読サマリー（docs-only metadata / canonical dependency path） |
| 2026-04-27 | 新規 | `docs/30-workflows/ut-12-cloudflare-r2-storage/phase-01.md` 〜 `phase-13.md` | Phase 1〜13 仕様書 13 本 |
| 2026-04-27 | 新規 | `outputs/phase-01/requirements.md` | 要件定義・タスクタイプ判定 |
| 2026-04-27 | 新規 | `outputs/phase-02/r2-architecture-design.md` / `cors-policy-design.md` / `token-scope-decision.md` | R2 設計・CORS 設計・Token スコープ判断 |
| 2026-04-27 | 新規 | `outputs/phase-03/design-review.md` | 設計レビュー / Phase 4 進行可否 |
| 2026-04-27 | 新規 | `outputs/phase-04/precheck-runbook.md` | 事前検証手順 |
| 2026-04-27 | 新規 | `outputs/phase-05/r2-setup-runbook.md` / `binding-name-registry.md` | R2 セットアップ runbook / バインディング名定義 |
| 2026-04-27 | 新規 | `outputs/phase-06/` | 異常系検証ノート（CORS 不許可 origin / Token 失効） |
| 2026-04-27 | 新規 | `outputs/phase-07/` | 検証項目網羅性 |
| 2026-04-27 | 新規 | `outputs/phase-08/dry-applied-diff.md` | wrangler.toml DRY 化差分 |
| 2026-04-27 | 新規 | `outputs/phase-09/` | 品質保証 |
| 2026-04-27 | 新規 | `outputs/phase-10/review-decision.md` | 最終レビュー PASS 判定 / MINOR 申し送り |
| 2026-04-27 | 拡充 | `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` | NON_VISUAL 必須 3 点（PUT/GET/DELETE / CORS curl / cors get / リンク整合） |
| 2026-04-27 | 拡充 | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル概念 + Part 2 技術詳細（wrangler.toml / CORS / R2 API / runbook / ロールバック / AC 表） |
| 2026-04-27 | 拡充 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A〜1-C / Step 2 N/A 理由 |
| 2026-04-27 | 拡充 | `outputs/phase-12/unassigned-task-detection.md` | 5 件検出（実作成 / AllowedOrigins / UT-17 / Presigned URL / apps-web guard） |
| 2026-04-27 | 拡充 | `outputs/phase-12/skill-feedback-report.md` | 3 スキルへのフィードバック |
| 2026-04-27 | 拡充 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 1〜6 + same-wave + NON_VISUAL + ファイル名照合 |
| 2026-04-27 | 更新 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | R2 prod/staging bucket、`R2_BUCKET` binding、private + presigned URL、CORS template、未適用境界を追記 |
| 2026-04-27 | 更新 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` / `keywords.json` | `generate-index.js` で R2 仕様索引を再生成 |
| 2026-04-27 | 更新 | `docs/30-workflows/LOGS.md` / `.claude/skills/aiworkflow-requirements/LOGS.md` / `.claude/skills/task-specification-creator/LOGS.md` | UT-12 `spec_created` / Phase 12 hardening 記録 |
| 2026-04-27 | 更新 | `docs/30-workflows/ut-12-cloudflare-r2-storage/artifacts.json` / `outputs/artifacts.json` | Phase 1〜12 を `spec_completed`、Phase 13 は `pending` に同期。実環境未適用は `acceptanceStatus` に分離 |

## 検証コマンド例

```bash
# 1. 計画系文言 残存確認（compliance-check 自身は除外）
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' \
  || echo "計画系文言 なし"

# 2. 未タスク検出リンク整合
node .claude/skills/task-specification-creator/scripts/verify-unassigned-links.js \
  --source docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-12/unassigned-task-detection.md

# 3. Phase 出力 validator
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/ut-12-cloudflare-r2-storage

# 4. ワークフロー全体 validator
node .claude/skills/task-specification-creator/scripts/verify-all-specs.js \
  --workflow docs/30-workflows/ut-12-cloudflare-r2-storage

# 5. 機密情報 残存確認（実 Account ID / 実 Token / 実本番ドメインの直書き禁止）
rg -n "[A-Fa-f0-9]{32}|cloudflare\\.com/.*account" \
  docs/30-workflows/ut-12-cloudflare-r2-storage/ \
  || echo "機密情報直書き なし"
```
