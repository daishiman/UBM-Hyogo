# レビューチェックリスト（CODEOWNERS-aligned）

## CODEOWNERS path 影響範囲確認

- [ ] `apps/api/**` 無変更（git diff main...HEAD で確認）
- [ ] `apps/web/**` 無変更
- [ ] `.github/workflows/**` 追加のみ（既存 workflow 改変なし）
- [ ] `docs/30-workflows/**` 本タスク dir のみ
- [ ] `.claude/skills/**/references/**` + `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` の SSOT 3 ファイルのみ

## 機能観点

- [ ] 監視 Token scope = `Account > Audit Logs:Read` only（Phase 9 軸 4 で確認済）
- [ ] deploy Token (`CLOUDFLARE_API_TOKEN`) scope 不変
- [ ] D1 migration が可逆（`DROP TABLE` で完全戻せる、または down migration 同梱）
- [ ] D1 30 日 TTL purge SQL が migration / scheduled job に組み込まれている
- [ ] schedule 設定 `0 * * * *`（毎時 0 分）で過密にならない
- [ ] watchdog の閾値が運用負荷と検知遅延の trade-off で妥当

## 安全性観点

- [ ] secret value / token / 個人情報 が artifact / log / Issue body に出力されない
- [ ] workflow `permissions:` が `issues: write` 最小
- [ ] `scripts/cf.sh` 経由で Cloudflare API 呼び出し（直接 wrangler 呼び出しなし）
- [ ] de-duplication の fingerprint hash が安全（PII 直接ハッシュ化していない、または salt 付き）

## ドキュメント観点

- [ ] SSOT `deployment-secrets-management.md` 更新済（監視 Token entry 追加）
- [ ] SSOT `observability-monitoring.md` / `15-infrastructure-runbook.md` 更新済（alert 受信時の対応フロー追記）
- [ ] source unassigned-task (`U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md`) の status が `linked_to_issue_408` 相当に更新
- [ ] Phase 12 の 7 成果物が完備

## Rollback 経路観点

- [ ] `outputs/phase-10/rollback-runbook.md` の 5 ステップが順序付き・コマンド付きで完備
- [ ] staging dry-run 実施 OR production-direct rollback リスク受容を runbook に明記
- [ ] DROP TABLE 実行前の D1 export が runbook に必須化されている

## 全体 DoD

- [ ] 全項目が check 済（solo dev: self-review で OK）
- [ ] 不備項目があれば本タスク内で修正、または `unassigned-task` に申し送り
