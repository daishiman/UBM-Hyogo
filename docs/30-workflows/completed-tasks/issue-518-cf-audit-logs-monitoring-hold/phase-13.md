# Phase 13: PR 作成（commit / push / PR）

`[実装区分: 実装仕様書]`

判定根拠: 実装変更の commit / push / PR 作成は実装仕様書の最終 Phase。git 操作とユーザー承認ゲートを明示する必要がある。

---

## 目的

Phase 5-12 の変更を 1 つの PR として作成し、`Refs #518, Refs #408` で Issue にリンクする（Issue は CLOSED 維持）。

## 変更対象ファイル

なし（git 操作のみ）。

## 前提（承認ゲート）

- ユーザーから「PR 作成」の明示的指示があること（CONST_002）
- Phase 9 の静的検証 evidence が完了していること
- Phase 10 は user-approved runtime dry-run gate のため、PR 作成前の必須前提にしない
- Phase 11 は post-merge runtime observation のため、PR 作成時点では `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として残すこと
- Phase 12 のドキュメント反映が完了していること

## 実行手順

```bash
# 1. ブランチ整合
git status --short
git diff main...HEAD --name-only

# 2. main 取り込み
git fetch origin main
git merge --no-ff origin/main || (echo "コンフリクト解消後 commit"; exit 1)

# 3. 検証（最終）
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
actionlint .github/workflows/cf-audit-log-monitor.yml

# 4. push
git push -u origin spec/issue-518-cf-audit-logs-monitoring-hold

# 5. PR 作成
gh pr create \
  --base main \
  --title "spec(#518): Cloudflare Audit Logs 監視を HOLD 化し週次手動確認運用へ縮退" \
  --body "$(cat <<'EOF'
## Summary

- Issue #518 の HOLD 方針を実装。`.github/workflows/cf-audit-log-monitor.yml` から hourly schedule を削除し、`workflow_dispatch` の `dry_run` 既定値を `true` に変更
- HOLD 中の公開 Issue 起票を防ぐため、`dry_run=false` は workflow 側で拒否
- `.github/workflows/cf-audit-log-monitor-watchdog.yml` を削除（schedule 停止により監視対象が消失）
- 週次手動確認 runbook を新規作成（`docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md`）
- 親 spec（completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-...）に HOLD 反映行追記
- `scripts/cf-audit-log/*.ts` および既存テストは無編集保持（手動・local 実行で再利用可能）

## Refs

- Refs #518（CLOSED 維持 / 再 OPEN しない）
- Refs #408（親実装）
- Related #514, #515, #516

## Test plan

- [ ] `actionlint .github/workflows/cf-audit-log-monitor.yml` PASS
- [ ] `pnpm typecheck` / `pnpm lint` PASS
- [ ] `pnpm vitest run scripts/cf-audit-log` PASS（regression なし）
- [ ] user approval 後に `gh workflow run cf-audit-log-monitor.yml` を `dry_run=true` で発火し、Issue 起票なしを確認
- [ ] merge 後 1 時間で schedule 起源 run が 0 件（AC-10）
- [ ] watchdog YAML が GitHub 上から削除されていることを API で確認
EOF
)"
```

## 関数 / シグネチャ

該当なし。

## 入出力 / 副作用

- リモート push（`spec/issue-518-cf-audit-logs-monitoring-hold` ブランチ）
- PR 作成（`Refs #518, Refs #408`）
- Issue #518 は CLOSED 維持（再 OPEN しない）

## テスト方針

PR 作成後の CI gate（`required_status_checks`）が PASS することを確認。

## ローカル実行・検証コマンド

```bash
gh pr view --json url,state,baseRefName,headRefName,title
gh pr checks
```

## DoD

- 1 PR が main 向けに作成
- 全 AC（AC-1..AC-10）が PR description に整合
- CI gate PASS
- Issue #518 は CLOSED 維持
- merge 後 Phase 11 の runtime evidence を取得し artifacts.json を `completed` に更新
