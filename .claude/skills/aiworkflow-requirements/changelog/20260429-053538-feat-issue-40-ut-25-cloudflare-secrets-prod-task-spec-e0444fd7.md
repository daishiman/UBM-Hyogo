---
timestamp: 2026-04-29T05:35:38Z
branch: feat/issue-40-ut-25-cloudflare-secrets-prod-task-spec
author: daishimanju@gmail.com
type: changelog
---
# aiworkflow-requirements changelog (2026-04-29)

UT-25 Cloudflare Secrets production deploy 完了に伴う本 skill の SKILL 機能差分を記録する。

## Added

- `indexes/resource-map.md` Topic Index に「Cloudflare Secrets 本番投入（UT-25）」エントリを 1 行追加。canonical `GOOGLE_SERVICE_ACCOUNT_JSON` / legacy alias `GOOGLE_SHEETS_SA_JSON` / `resolveServiceAccountJson(env)` ヘルパー / `op read | bash scripts/cf.sh secret put --config apps/api/wrangler.toml --env <env>` stdin 経由 / staging-first → production / `--env` 必須 / `.dev.vars` の `op://` 参照ルールを参照先表に集約
- `indexes/quick-reference.md`「Cloudflare デプロイ・本番運用」ブロックに 3 行追加:
  - 本番 Secrets 投入の直行行（`bash scripts/cf.sh secret put` + op stdin、`wrangler` 直叩き禁止、staging-first / `--env` 必須）
  - canonical `GOOGLE_SERVICE_ACCOUNT_JSON` ↔ legacy alias `GOOGLE_SHEETS_SA_JSON` の優先順位解決行（`resolveServiceAccountJson(env)` ヘルパー言及）
  - `.dev.vars` の `op://Vault/Item/Field` 参照のみルール行
- `lessons-learned/20260429-053538-feat_issue-40-ut-25-cloudflare-secrets-prod-task-spec-e0444fd7.md` を新規作成。L-UT25-010〜012 の 3 苦戦点を fragment 1 ファイルに集約

## Changed

- canonical secret 名を `GOOGLE_SERVICE_ACCOUNT_JSON` に統一する方針が skill 早見表（resource-map / quick-reference）に反映された。旧 `GOOGLE_SHEETS_SA_JSON` は legacy alias として互換維持されることを各 lookup から参照可能にした

## References

- 実装変更: `apps/api/src/jobs/sync-sheets-to-d1.ts`（`resolveServiceAccountJson(env)` 追加）, `apps/api/src/jobs/sync-sheets-to-d1.test.ts`
- 仕様変更（既に main で更新済み・本 PR では非変更）: `references/deployment-cloudflare.md` / `references/deployment-secrets-management.md` / `references/environment-variables.md` / `indexes/topic-map.md`
- タスク成果物: `docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/`
- 後続未タスク: `docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md`
- knowledge-capture: 本 fragment と同 PR 内の `lessons-learned/20260429-053538-feat_issue-40-ut-25-cloudflare-secrets-prod-task-spec-e0444fd7.md`

## Notes

- `references/legacy-ordinal-family-register.md` は本タスクで rename を伴わないため非変更
- `indexes/topic-map.md` および 3 reference（`deployment-cloudflare.md` / `deployment-secrets-management.md` / `environment-variables.md`）は別経路で同期済みのため本 PR では非変更
- skill 改修候補（task-specification-creator の Phase 11/12 ガイド更新）は本 fragment の lessons-learned 内に issue 化候補として記録
