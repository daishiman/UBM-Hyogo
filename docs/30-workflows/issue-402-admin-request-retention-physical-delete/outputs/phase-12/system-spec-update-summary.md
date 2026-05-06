# System Spec Update Summary — Issue #402

## 更新対象 SSOT

`.claude/skills/aiworkflow-requirements/references/data-retention-policy.md`（**新規作成**）

## 新規 SSOT の章構成

| 章 | 内容 |
| --- | --- |
| 1. 目的と適用範囲 | UBM 兵庫支部会 メンバーサイトの delete request 承認後 PII を物理削除するポリシー定義 |
| 2. retention 期間 | 180 days from `deleted_members.deleted_at` |
| 3. 物理削除対象 row | `datetime(deleted_at, '+180 days') <= datetime('now') AND purged_at IS NULL` |
| 4. 連鎖削除対象テーブル | `member_responses`, `member_identities`, `member_status`（member_id FK） |
| 5. tombstone 戦略 | `deleted_members` row 自体は audit minimum として残し、`purged_at` / `retention_policy_version` を更新する |
| 6. audit_log 差分行 | `action=retention_purge`, `target_id`, `after_json` (`member_id` / `purged_at` / `retention_policy_version` のみ), `created_at` |
| 7. cron 実行 | daily 03:00 JST (`0 18 * * *` UTC), Cloudflare Workers Cron Trigger |
| 8. mode gate | `RETENTION_PURGE_MODE=dry-run` が default。`apply` は staging runtime evidence 後の user-gated operation、`off` は skip |
| 9. rollback 経路 (3 段) | pre-purge: 対象外化または restore operation / 7 日以内: D1 PITR Time Travel / 7 日超過: 復旧不可 |
| 10. member 通知文言 | approve 時 API response / audit に `retentionPurgeScheduledAt` を含め、email / マイページはこの値を表示する |
| 11. 不可逆境界 | 7 日超過後は技術的にも運用的にも復旧手段なし（運用ポリシーで PITR 30 日上限よりも前倒しで境界化） |
| 12. future TODO | `audit_log` 自体の retention 適用 / `member_status` の短期 retention（180 日より前）検討 |

## 既存 SSOT への波及

| ファイル | 影響 | 対応 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/data-retention-policy.md` | Issue #402 retention policy SSOT | 同 wave で新規作成済 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | `RETENTION_PURGE_MODE` / `RETENTION_PURGE_LIMIT` の destructive operation gate | 同 wave で更新済 |
| `docs/00-getting-started-manual/specs/07-edit-delete.md` | 「承認直後は物理削除しない」原則に Issue #402 180 日 retention exception を追加 | 同 wave で更新済 |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | admin management の物理削除禁止記述に retention exception を追加 | 同 wave で更新済 |
| `indexes/resource-map.md`, `indexes/quick-reference.md`, `indexes/topic-map.md` | 新規 SSOT 行追加 | `pnpm indexes:rebuild` で同期 |
| `.claude/skills/aiworkflow-requirements/LOGS/20260506-issue402-retention-purge.md` | aiworkflow-requirements skill 履歴 | 同 wave で追加 |
| `.agents/skills/aiworkflow-requirements/LOGS/20260506-issue402-retention-purge.md` | mirror skill 履歴 | 同 wave で追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260506-issue402-retention-purge.md` | aiworkflow-requirements changelog | 同 wave で追加 |
| `.agents/skills/aiworkflow-requirements/changelog/20260506-issue402-retention-purge.md` | mirror changelog | 同 wave で追加 |

## Phase 12 Task 2 判定

| Step | 判定 | 根拠 |
| --- | --- | --- |
| Step 1-A current canonical location | PASS | retention policy の一次正本は `.claude/skills/aiworkflow-requirements/references/data-retention-policy.md` |
| Step 1-B adjacent specs | PASS | manual specs `07-edit-delete.md` / `11-admin-management.md` と `environment-variables.md` を同 wave 更新 |
| Step 1-C generated indexes | PASS | quick-reference / resource-map / topic-map / keywords に issue-402 と SSOT を登録 |
| Step 1-H skill history | PASS | `.claude` と `.agents` mirror の LOGS / changelog / SKILL.md 変更履歴を追加 |
| Step 2 split/backlog decision | N/A | retention policy SSOT は単独ファイルで 500 行未満。未タスク化は不要 |

## CLAUDE.md への影響

retention 期間 (180 日) は SSOT (`data-retention-policy.md`) を正本とし、CLAUDE.md には記載しない（参照リンクのみ追加するかは判断保留）。

## 同期手順（本 wave）

```bash
# 1. indexes 再生成
mise exec -- pnpm indexes:rebuild

# 2. drift 確認
git diff --stat .claude/skills/aiworkflow-requirements/

# 3. CI gate 確認
mise exec -- pnpm sync:check
```

## 検証

| 確認 | コマンド | 期待 |
| --- | --- | --- |
| SSOT 存在 | `test -f .claude/skills/aiworkflow-requirements/references/data-retention-policy.md` | 存在 |
| index drift | `mise exec -- pnpm indexes:rebuild && git diff --quiet .claude/skills/aiworkflow-requirements/indexes/` | drift なし |
| RETENTION_DAYS 整合 | `grep -n 'RETENTION_DAYS\\s*=\\s*180' apps/api/src/services/retention-policy.ts` + `grep -n '180 days' .claude/skills/aiworkflow-requirements/references/data-retention-policy.md` | 両方 hit |
| production gate 整合 | `grep -n 'RETENTION_PURGE_MODE' apps/api/src/index.ts apps/api/wrangler.toml .claude/skills/aiworkflow-requirements/references/data-retention-policy.md` | default dry-run / apply user-gated |
