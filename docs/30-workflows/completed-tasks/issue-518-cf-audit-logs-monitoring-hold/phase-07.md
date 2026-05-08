# Phase 7: 実装 — 週次手動確認 runbook 新規作成

`[実装区分: 実装仕様書]`

判定根拠: HOLD 後の運用経路と再開手順を runbook として正本化する必要がある。新規 markdown ファイルの作成は実コード変更（リポジトリ追加）に該当する。

---

## 目的

`docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` を新規作成し、週次手動確認手順 / `workflow_dispatch` 起動例 / local 実行例 / 再開条件チェックリスト / 再開手順を集約する。

## 変更対象ファイル

| パス | 種別 |
| --- | --- |
| `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` | 新規 |

## 章立て（Phase 3 詳細設計に準拠）

```markdown
# Cloudflare Audit Logs 週次手動確認 Runbook

## 1. 背景と目的

- 親 Issue: #408（Cloudflare Audit Logs 監視 implementation）
- HOLD Issue: #518
- 関連: #514, #515, #516
- 本 runbook は #518 の HOLD 方針に基づく週次・必要時の手動確認運用を集約する。

## 2. 運用ステータス: HOLD（自動監視停止中）

| 項目 | 状態 |
| --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | schedule 削除済 / `workflow_dispatch` のみ稼働可 |
| `.github/workflows/cf-audit-log-monitor-watchdog.yml` | 削除済 |
| `scripts/cf-audit-log/*.ts` | 保持（手動・local 実行用） |
| GitHub Variable `CF_AUDIT_LAST_SUCCESS_AT` | 保持（HOLD 中は更新停止） |
| Cloudflare Token (`CF_AUDIT_TOKEN_PROD`, `CF_AUDIT_D1_TOKEN_PROD`) | 保持 |

## 3. 週次手動確認手順

### 3.1 前提

- GitHub repo write 権限（`gh workflow run` 用）
- 1Password vault access（`scripts/cf.sh` 経由で local 実行する場合）
- Node 24 / pnpm 10（`mise exec -- ...`）

### 3.2 経路 A: workflow_dispatch（推奨 / dry_run=true 必須）

```bash
gh workflow run cf-audit-log-monitor.yml \
  -f dry_run=true \
  -f since="$(date -u -d '7 days ago' +%Y-%m-%dT%H:00:00Z)" \
  -f until="$(date -u +%Y-%m-%dT%H:00:00Z)"
gh run list --workflow=cf-audit-log-monitor.yml --limit=3
gh run view <RUN_ID> --log
```

`dry_run=true` のため Issue 起票は発生しない。analyze ログを目視確認。

### 3.3 経路 B: local 実行

```bash
bash scripts/cf.sh -- mise exec -- pnpm exec tsx scripts/cf-audit-log/fetch.ts \
  --since "$(date -u -d '7 days ago' +%Y-%m-%dT%H:00:00Z)" \
  --until "$(date -u +%Y-%m-%dT%H:00:00Z)"
bash scripts/cf.sh -- mise exec -- pnpm exec tsx scripts/cf-audit-log/analyze.ts \
  --window 7d --dry-run
```

### 3.4 確認すべき検知パターン

| パターン | 確認ポイント |
| --- | --- |
| 認証失敗（401 / 403）の急増 | 1 日あたり N 件超過 |
| 想定外 IP からの認証成功 | known IP allowlist との突合 |
| 想定外時刻（業務時間外）の Token 利用 | UTC 時刻分布 |
| scope 不足エラー（403） | 想定外 resource アクセス試行 |

## 4. 関連 GitHub Variables / Secrets

| 名前 | 種別 | HOLD 中の扱い |
| --- | --- | --- |
| `CF_AUDIT_LAST_SUCCESS_AT` | Variable | 更新停止（保持） |
| `CF_AUDIT_TOKEN_PROD` | Secret | 保持・手動使用 |
| `CF_AUDIT_D1_TOKEN_PROD` | Secret | 保持・手動使用 |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | 保持 |

## 5. 再開条件チェックリスト

以下のいずれかを満たす場合に HOLD 解除を再検討する（Issue #518 準拠）。

- [ ] Cloudflare token misuse の具体的な兆候が出た
- [ ] private な監視証跡置き場を用意できた
- [ ] 無料枠を超えない実行頻度と保存先を明確に設計できた
- [ ] 監視結果を公開 Issue に出さない alerting 経路を用意できた

## 6. 再開手順（HOLD 解除）

1. `.github/workflows/cf-audit-log-monitor.yml` に下記を復元
   ```yaml
   on:
     schedule:
       - cron: '0 * * * *'
     workflow_dispatch:
   ```
2. `inputs.dry_run.default` を `false` に戻す
3. `git checkout <PRE_518_MERGE_SHA> -- .github/workflows/cf-audit-log-monitor-watchdog.yml` で watchdog YAML を restore
4. ファイル冒頭の HOLD コメントを削除
5. PR 作成 / merge → 初回 hourly tick で `gh run list --workflow=cf-audit-log-monitor.yml` で発火確認
6. 本 runbook を `docs/30-workflows/runbooks/_archive/` に移動

## 7. 関連リンク

- 親 spec: `docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md`
- HOLD 仕様: `docs/30-workflows/issue-518-cf-audit-logs-monitoring-hold/index.md`
- Issue: https://github.com/daishiman/UBM-Hyogo/issues/518
```

## 関数 / シグネチャ

該当なし（markdown のみ）。

## 入出力 / 副作用

- 新規 markdown ファイル 1 件追加
- 他ファイルへの参照は `index.md` および `phase-08.md` で追加（リンク張りのみ）

## テスト方針

- markdown lint: `pnpm exec markdownlint docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md`（プロジェクトに markdownlint 設定あれば）
- リンク先存在確認: `cf-audit-log-monitor.yml`、親 spec、Issue URL の存在
- ヘッダ階層: H1 が 1 つ、各 H2/H3 がツリー構造として正しい

## ローカル実行・検証コマンド

```bash
test -f docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md
grep -E '^## ' docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md | wc -l   # 7 章
```

## DoD

- AC-5: ファイルが新規作成され、章 1-7 がすべて存在
- 再開条件 4 件チェックリストが Issue #518 と完全一致
- 再開手順が Phase 5 / 6 の rollback 手順と整合
