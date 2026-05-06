# issue-402 production apply 切替運用ゲート

## メタ情報

```yaml
issue_number: 402
```

| 項目         | 内容                                                          |
| ------------ | ------------------------------------------------------------- |
| タスクID     | task-issue-402-production-apply-enable-001                    |
| タスク名     | retention purge `RETENTION_PURGE_MODE=apply` の production 切替 |
| 分類         | runtime-operation / destructive                               |
| 対象機能     | admin request retention physical delete (production cron)     |
| 優先度       | High                                                          |
| 見積もり規模 | 中規模                                                        |
| ステータス   | 未実施（Gate C: production destructive apply）                |
| 発見元       | issue-402 Phase 12 unassigned-task-detection                  |
| 発見日       | 2026-05-06                                                    |

---

## 1. 概要

issue-402 retention purge cron を **production 環境で `dry-run` から `apply` へ切り替える** 運用タスク。production 上の `members` および子テーブル行を物理削除するため、Gate C（production destructive apply）に該当し user 承認・rollback 手順・オペレーション窓を事前合意する必要がある。

## 2. 背景

issue-402 の deploy 直後は安全側として production の `RETENTION_PURGE_MODE=dry-run` 固定で運用開始する設計（Phase 9 / Phase 12 で SSOT 化済）。dry-run の cron 発火と監視結果に問題なく、staging runtime evidence (`task-issue-402-staging-runtime-evidence-001`) も完了したのち、production を apply に切替えて初めて retention purge が実発動する。

## 3. 目的

production の cron を **dry-run → apply に切替え、初回 apply の影響範囲を観測し、必要なら即時 rollback できる** 運用ゲートを定義し実行する。

## 4. スコープ

### 含むもの (in)

- 切替前 readiness チェックリスト (staging evidence / dry-run 安定運用 N 日以上 / 監視ダッシュボード整備)
- 切替手順 (`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` で `RETENTION_PURGE_MODE=apply` を反映するルート)
- production session bookmark 取得 (rollback 起点)
- 初回 apply 後の audit_log / 削除件数の確認手順
- rollback 手順 (apply → dry-run へ即時戻す deploy + bookmark を使った D1 row 復元)
- オペレーション窓 (低トラフィック時間帯 / 障害対応者待機 / 連絡経路) の合意フォーマット

### 含まないもの (out)

- staging evidence 取得 (`task-issue-402-staging-runtime-evidence-001`)
- audit_log 自体の retention (`task-issue-402-audit-log-retention-followup-001`)
- approve email 文言反映 (`task-issue-402-approve-email-template-001`)

## 5. 苦戦箇所として想定される観点

| 項目             | 内容                                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 不可逆操作 (Gate C) | apply 後に削除された row は bookmark + cron 履歴がなければ復元不可。staging より緊張度が高く、bookmark を取らずに deploy する手順が成立してはならない |
| user-gate 境界   | Claude 自律で `wrangler deploy --var RETENTION_PURGE_MODE:apply --env production` を発火しない明示ガード                                             |
| SSOT 同期        | wrangler.toml の env.production.vars と本タスク手順書、`data-retention-policy.md` の運用節が三位一体で更新されないと dry-run/apply の正本が分裂する  |
| 監視ギャップ     | production cron の実行成功 / 失敗 / 削除件数を観測する手段（Workers Logpush or Cloudflare Logs）が事前に整っていないと apply 直後の異常検知が遅れる   |
| 復元シナリオ     | 7 日復旧境界（approve 後 grace period）を超過した row が apply で消える前提だが、ユーザー由来の取り消し申請が apply 直後に来た場合の運用フロー       |

## 6. リスクと対策

| リスク                                                          | 影響度 | 発生確率 | 対策                                                                                                                |
| --------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------- |
| 切替直後に大量 row が apply で削除される                        | 高     | 中       | 切替前に dry-run 出力で対象 ID 数を確認し、想定 N 件を超える場合は user 承認必須                                    |
| 切替手順での env var typo (`apply` 以外の値)                    | 高     | 低       | wrangler.toml への commit + PR レビューを通すルートを正規化、CLI `--var` 上書きを禁止                              |
| rollback bookmark 取得失敗                                      | 高     | 低       | 切替前 24 時間以内の D1 export (`bash scripts/cf.sh d1 export --env production`) を常備                            |
| apply 開始直後にユーザーから復旧申請が来る                      | 中     | 中       | 7 日復旧境界の運用窓と apply 切替時刻のギャップを 0 にしない (=切替前に 7 日窓を完全に閉じてある対象だけが消える)   |
| 監視ダッシュボード未整備での切替                                | 中     | 中       | 切替の readiness checklist に「Cloudflare Logs で `retention_purge` job tag が観測可能」を必須項目化                |

## 7. 検証方法

### 受け入れ基準

- production wrangler.toml の `[env.production.vars]` で `RETENTION_PURGE_MODE = "apply"` がコミット済み
- 切替 deploy の version id が記録されており、dry-run に戻す rollback が `bash scripts/cf.sh rollback <VERSION_ID>` 一発で可能
- 切替後 N 日（例: 7 日）の cron 実行ログが Cloudflare Logs に揃っている
- 初回 apply で削除された row 数 / 子テーブル連鎖件数が staging で観測した値とオーダーずれしていない
- audit_log の差分行に PII が含まれない (`grep` 0 件)

### 実行手順（概要）

```bash
# 0. readiness 確認
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup-$(date +%Y%m%d).sql

# 1. dry-run 結果を最新化
wrangler cron trigger --env production  # 現在 dry-run

# 2. apply に切替（PR 経由で wrangler.toml をマージ）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production

# 3. 初回 apply 観測
wrangler tail --env production --format pretty | tee apply-runtime.log

# 4. 異常時 rollback
bash scripts/cf.sh rollback <PRE_APPLY_VERSION_ID> --config apps/api/wrangler.toml --env production
```

## 8. 関連

- `docs/30-workflows/issue-402-admin-request-retention-physical-delete/outputs/phase-9/main.md`
- `docs/30-workflows/issue-402-admin-request-retention-physical-delete/outputs/phase-12/system-spec-update-summary.md`
- `task-issue-402-staging-runtime-evidence-001.md` (前提タスク)
- `.claude/skills/aiworkflow-requirements/references/data-retention-policy.md`
- `apps/api/wrangler.toml`
- `CLAUDE.md` `Cloudflare 系 CLI 実行ルール` 節（`scripts/cf.sh` 経由必須）

## 9. 備考

| 項目 | 内容 |
| ---- | ---- |
| 苦戦箇所 | Phase 12 段階で production 切替手順は SSOT 化したが、実切替は staging evidence 取得後のオペレーション判断に依存し本ワークフロー内では完了不能。Gate C を独立タスクに切り出した |
| 原因 | 不可逆 apply の影響範囲が staging より広く、user の運用合意 (オペレーション窓) を要する |
| 対応 | spec のみを起票し、staging evidence 取得後に user 主導で実行する運用に分離 |
| 再発防止 | data-retention-policy.md の運用節に「production apply 切替は別タスクで Gate C 必須」を明記済 |
