# UT-17-followup-003 PR Summary

[実装区分: 実装仕様書]

## PR メタ情報

| 項目 | 値 |
| --- | --- |
| PR タイトル | `feat(api): add UT-17 alert-relay weekly healthcheck cron (issue-635)` |
| ベースブランチ | `dev` |
| 作業ブランチ | `feat/ut-17-followup-003-healthcheck-cron` |
| 関連 Issue | Refs #635 |
| 種別 | feature / NON_VISUAL |

## gh pr create 実行コマンド

```bash
gh pr create --base dev \
  --title "feat(api): add UT-17 alert-relay weekly healthcheck cron (issue-635)" \
  --body "$(cat <<'EOF'
## Summary

- Cloudflare Workers `scheduled` handler で `apps/api` の alert-relay 経路を週次自動 healthcheck
- 既存 daily cron (`0 18 * * *`) に相乗り + scheduled handler 内 Monday gate で free plan の cron 3 本上限を保護
- Slack 戻り値を `status === 200 && body.trim() === "ok"` の両面で検証し、revoke 後の silent failure を検知
- Slack 失敗時は Resend 経由でメールフォールバック（`HEALTHCHECK_FALLBACK_EMAIL` 宛）
- 月次手動 runbook を「四半期確認 + cron 連続 2 回失敗時の deep-dive」用途に降格

## 設計判断

- **cron 戦略**: 新規 cron を追加せず既存 daily cron に相乗り。Workers free plan の cron 3 本上限保護
- **alert-relay 呼び出し**: service binding ではなく Request 偽造（既存 route contract を通し、余分な Worker-to-Worker 境界なし）
- **Slack 成功判定**: `status === 200 && body.trim() === "ok"` 両面（revoke 後の HTTP 200 + \`"no_service"\` を検知）
- **Mail provider**: Resend を採用（送信元ドメイン検証不要・無料枠 3,000 通/月で最小実装）
- **channel 分離**: \`SLACK_WEBHOOK_URL_HEALTHCHECK?\` を optional binding として用意。未設定時は \`SLACK_WEBHOOK_URL\` にフォールバック
- **識別子**: payload に \`data.healthcheck: true\` を固定で乗せ、本物アラートと区別

## 変更ファイル

### apps/api（新規）
- \`src/scheduled/healthcheck.ts\` — scheduled handler 本体（\`runAlertRelayHealthcheck\`）
- \`src/lib/healthcheck-mail-fallback.ts\` — Resend API ラッパー（\`sendHealthcheckFailureMail\`）
- \`src/scheduled/__tests__/healthcheck.test.ts\` — Monday gate / Slack 検証 / mail fallback 分岐の unit test
- \`src/lib/__tests__/healthcheck-mail-fallback.test.ts\` — Resend mock test

### apps/api（編集）
- \`src/index.ts\` — \`export default { fetch, scheduled }\` の形に拡張
- \`src/env.ts\` — `Env` interface に \`SLACK_WEBHOOK_URL_HEALTHCHECK?\` / \`HEALTHCHECK_FALLBACK_EMAIL?\` / \`RESEND_API_KEY?\` を optional 追加
- \`wrangler.toml\` — 既存 \`[triggers]\` \`crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]\` を維持（本タスクでは変更なし）
- local env sample — 対象ファイルなし。本タスクでは追加なし

### docs / runbook
- \`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md\` — cron 自動化との役割分担追記 + 連続 2 回失敗時の即時実施閾値追加
- \`docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/{phase-11,phase-12,phase-13}.md\`
- \`docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-11/visual-verification-skip.md\`
- \`docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,unassigned-task-detection}.md\`
- \`docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-13/pr-summary.md\`

### skill 同期（.claude/skills/）
- \`aiworkflow-requirements/references/deployment-cloudflare.md\` — 「Workers scheduled cron triggers」追記 + optional secrets 表追加
- \`aiworkflow-requirements/indexes/keywords.json\` — \`cron healthcheck\` / \`weekly healthcheck\` / \`Monday gate\` / \`Resend fallback\` / \`scheduled handler\` 追加
- \`aiworkflow-requirements/indexes/topic-map.md\` — \`monitoring\` / \`cloudflare-deployment\` セクション更新

## 検証手順

### ローカル
- \`mise exec -- pnpm --filter @ubm-hyogo/api typecheck\` PASS
- \`mise exec -- pnpm --filter @ubm-hyogo/api lint\` PASS
- \`mise exec -- pnpm exec vitest run apps/api/src/scheduled/__tests__/healthcheck.test.ts apps/api/src/lib/__tests__/healthcheck-mail-fallback.test.ts\` PASS（7 tests）
- \`mise exec -- pnpm --filter @ubm-hyogo/api test <2 files>\` は package script が \`apps/api\` 全体を走らせ、unrelated Miniflare/D1 contract tests で \`EADDRNOTAVAIL\` FAIL
- 機密値 grep: 0 件

### staging（外部実施）
1. \`bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --env staging\`
2. \`bash scripts/cf.sh secret put HEALTHCHECK_FALLBACK_EMAIL --env staging\`
3. \`bash scripts/cf.sh secret put RESEND_API_KEY --env staging\`
4. \`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging\`
5. Cloudflare Dashboard → Workers → Triggers → 手動発火 → Slack staging channel 到達確認
6. SLACK_WEBHOOK_URL_HEALTHCHECK を不正値に差し替えて再発火 → メール受信確認
7. 元の値に戻す

### production（外部実施）
1. 上記 staging と同手順で production env に適用
2. 翌月曜 UTC 18:00 の cron 発火を \`bash scripts/cf.sh tail --env production\` で観測

## ロールバック

| 範囲 | 手順 |
| --- | --- |
| デプロイ | \`bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/api/wrangler.toml --env <env>\` |
| scheduled handler 無効化 | \`apps/api/src/index.ts\` の \`scheduled\` export を一時削除 → 再 deploy（cron 発火しても no-op 化） |
| cron schedule 撤去 | \`apps/api/wrangler.toml\` の \`[triggers].crons\` から該当 schedule を削除 → 再 deploy（既存 daily cron が無ければ） |
| Secrets | optional のため残置可。完全撤去なら \`bash scripts/cf.sh secret delete <name> --env <env>\` |

## Test plan

- [x] \`pnpm typecheck\` PASS
- [x] \`pnpm lint\` PASS
- [x] direct focused Vitest 2 files PASS
- [ ] full \`pnpm --filter @ubm-hyogo/api test\` PASS（unrelated Miniflare/D1 \`EADDRNOTAVAIL\` で FAIL）
- [ ] staging deploy 成功（外部実施）
- [ ] staging Slack channel 到達確認 + screenshot 取得（外部実施）
- [ ] staging Resend mail fallback 受信確認 + screenshot 取得（外部実施）
- [ ] production deploy 成功（外部実施）
- [ ] 翌月曜 cron 発火を wrangler tail で確認（外部実施）
- [x] 機密値 grep 0 件
- [x] \`apps/web/\` 配下に変更なし

## 不変条件チェック

- [x] D1 直接アクセスを追加していない（本タスクは D1 アクセスなし）
- [x] Secret は 1Password → Cloudflare Secrets / \`.env\` に実値なし
- [x] Cloudflare CLI は \`bash scripts/cf.sh\` 経由のみ
- [x] UT-08-IMPL（WAE custom alerts）と責務重複なし
- [x] \`apps/web/\` 配下に変更がない
- [x] 既存 runbook の上書きなし（追記方式）

## スクリーンショット

NON_VISUAL タスクのため UI スクリーンショットなし。
staging で取得する Slack 投稿 / Resend mail 受信 / wrangler tail cron 発火ログは
\`docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-11/\`
配下に external ops 実施時に追加する。

## 関連 Issue

Refs #635

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## PR URL 記録欄

```
PR URL: （gh pr create 実行後にここに記載）
```

## post-merge アクション（再掲）

1. `docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md` を `docs/30-workflows/completed-tasks/` 配下へ `git mv`
2. external ops（secrets 投入 / staging deploy / 手動 cron 発火確認 / production deploy）を実施
3. external ops 完了後、status を `completed` に更新
4. staging で取得した screenshot 2 枚 + cron 発火ログを follow-up PR でコミット
5. dev → main の昇格 PR を別途作成
6. 翌月曜 UTC 18:00 の初回 cron 発火を wrangler tail で観測し運用記録に追記
