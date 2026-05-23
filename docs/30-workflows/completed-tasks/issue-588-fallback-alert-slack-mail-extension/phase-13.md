# Phase 13: PR 作成

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## ブランチと base

- 作業ブランチ: `feat/issue-588-fallback-alert-slack-mail-extension`（または同等）
- base: `dev`（CLAUDE.md 規定）

## PR タイトル（70 字以内）

```
feat(cf-audit): fallback alert に Slack / mail 通知拡張 (#588)
```

## PR 本文テンプレ

```markdown
## Summary
- 親 #549 で実装済みの fallback rate alert（GitHub Issue 起票）に Slack / mail 通知 dispatcher を追加
- env 経由で webhook URL を渡す optional 構造。secret 未設定時は no-op で skip
- 通知 payload は redaction を経由（hash / userId / tenantId / Bearer / hooks.slack.com URL を `[REDACTED]`）
- failure isolation: Slack / mail の throw は握り、GitHub Issue 起票は throw 伝播（必須通知優先）

Refs #588 (CLOSED retroactive), parent #549

## 変更
- `scripts/cf-audit-log/observation/fallback-rate-alert.ts`: dispatcher / redaction / evaluateAndAlert 拡張
- `scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts`: TC-01〜TC-12 追加
- `.github/workflows/cf-audit-log-monitor.yml`: env に SLACK_WEBHOOK_INCIDENT / EMAIL_WEBHOOK_URL / EMAIL_FROM / EMAIL_TO 追加
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`: 通知有効化セクション追記
- `docs/30-workflows/issue-588-fallback-alert-slack-mail-extension/`: Phase 1-13 仕様書
- `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md`: supersede 注記

## Test plan
- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm vitest run scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts`
- [ ] dry-run smoke で Slack/mail HTTP が発火しないことを確認
- [ ] secret-grep.txt で webhook 実値が outputs/ に含まれない（0 件）
- [ ] `actionlint .github/workflows/cf-audit-log-monitor.yml`

## Production runtime verification
production で fallback rate 5% × 3h 連続超過は意図的に発生させない。次回自然発生時に Slack / mail 通知の到達を確認し、本 PR を `IMPLEMENTED_LOCAL_RUNTIME_PENDING` → `completed` に昇格する。
```

## 実行コマンド

```bash
# branch
git checkout -b feat/issue-588-fallback-alert-slack-mail-extension

# 実装＋commit（user 承認後）
git add scripts/cf-audit-log/observation/fallback-rate-alert.ts \
        scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts \
        .github/workflows/cf-audit-log-monitor.yml \
        docs/00-getting-started-manual/specs/15-infrastructure-runbook.md \
        docs/30-workflows/issue-588-fallback-alert-slack-mail-extension/ \
        docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md
git commit -m "feat(cf-audit): fallback alert に Slack / mail 通知拡張 (#588)"

# push & PR（user 承認後）
git push -u origin feat/issue-588-fallback-alert-slack-mail-extension
gh pr create --base dev --title "feat(cf-audit): fallback alert に Slack / mail 通知拡張 (#588)" \
  --body-file docs/30-workflows/issue-588-fallback-alert-slack-mail-extension/outputs/phase-12/implementation-guide.md
```

## 注意事項

- Issue #588 は CLOSED 状態のまま retroactive 実装。PR 本文では `Refs #588` で参照のみ（`Closes #588` は使わない／既に閉じているため）
- secret 投入（`gh secret set`）は user 明示承認後のみ実行
- workflow YAML 編集後は `actionlint` で構文確認

## 出力

- `outputs/phase-13/main.md`
