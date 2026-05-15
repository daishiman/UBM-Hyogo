# Phase 13: PR・振り返り

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 名称 | PR・振り返り |
| タスク | UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) |
| GitHub Issue | #635（Refs として参照、`Closes` は使わない） |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | Phase 1〜12 で完成した cron healthcheck 実装 + Resend メールフォールバック + 月次 runbook 役割分担追記 + skill 同期を 1 PR にまとめ、`dev` にマージ可能な状態にする最終 Phase |

---

## 目的

Phase 1〜12 の全成果物（コード + 設計書 + skill 同期 + runbook 追記）を 1 PR に集約し、
`dev` ブランチへのマージ準備を完了させる。

> ⚠️ **承認ゲート**: CLAUDE.md「PR作成の完全自律フロー」が適用される依頼（「PR作成」「PR出して」「diff-to-pr」等）の場合は確認質問を挟まず実行する。それ以外はユーザーから明示承認を得てから実行する。

---

## 13-1. PR 基本情報

| 項目 | 値 |
| --- | --- |
| PR タイトル | `feat(api): add UT-17 alert-relay weekly healthcheck cron (issue-635)` |
| ベースブランチ | `dev`（CLAUDE.md「既定ブランチは dev」遵守） |
| 作業ブランチ | `feat/ut-17-followup-003-healthcheck-cron`（または同等の slug） |
| PR 種別 | feature（コード実装あり / NON_VISUAL） |
| 関連 Issue | `#635`（Refs として参照） |

---

## 13-2. 実行手順

### ステップ 1: ローカルチェック

```bash
# 全体型チェック / Lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# apps/api ユニットテスト
mise exec -- pnpm --filter @ubm-hyogo/api test

# 新規 / 編集ファイル変更確認
git status
git diff dev...HEAD --name-only

# 機密値スキャン（Slack URL / Resend API key / 実メールアドレス）
git grep -E "hooks\.slack\.com/services/[A-Z0-9/]+" -- ':!.dev.vars.example' ':!*.md'
git grep -E "re_[A-Za-z0-9]{20,}" -- ':!.dev.vars.example'
git grep -E "HEALTHCHECK_FALLBACK_EMAIL\s*=\s*[^\"\\s]+@" -- ':!.dev.vars.example'
# 期待: いずれも 0 件

# mirror parity（.claude ↔ .agents）
diff -r .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements 2>/dev/null | head
# 期待: 差分なし
```

### ステップ 2: 変更ファイル確認

確認:
- コード変更（`apps/api/`）と docs / skill 同期 / runbook 追記が含まれている
- `apps/web/` 配下に変更がない
- 機密値（Webhook URL / Resend API key / 実メールアドレス）が含まれていない

### ステップ 3: コミット整理

| # | コミットメッセージ |
| --- | --- |
| 1 | `feat(api): add weekly alert-relay healthcheck scheduled cron with Monday gate (issue-635)` |
| 2 | `feat(api): add Resend-based mail fallback for healthcheck failure (issue-635)` |
| 3 | `test(api): cover healthcheck Monday gate / Slack body validation / mail fallback (issue-635)` |
| 4 | `chore(api): extend env Env interface with healthcheck optional bindings (issue-635)` |
| 5 | `docs(runbook): demote monthly ut-17 healthcheck to backup after cron automation (issue-635)` |
| 6 | `docs(ut-17-followup-003): finalize phase 11-13 source-of-truth sync (issue-635)` |

### ステップ 4: push と PR 作成

```bash
git push -u origin feat/ut-17-followup-003-healthcheck-cron

gh pr create --base dev --title "feat(api): add UT-17 alert-relay weekly healthcheck cron (issue-635)" --body "$(cat <<'EOF'
## Summary

- Cloudflare Workers `scheduled` handler で `apps/api` の alert-relay 経路を週次自動 healthcheck
- 既存 daily cron (`0 18 * * *`) に相乗り + scheduled handler 内 Monday gate で free plan の cron 3 本上限を保護
- Slack 戻り値を `status === 200 && body.trim() === "ok"` の両面で検証し、revoke 後の silent failure を検知
- Slack 失敗時は Resend 経由でメールフォールバック（`HEALTHCHECK_FALLBACK_EMAIL` 宛）
- 月次手動 runbook を「四半期確認 + cron 連続 2 回失敗時の deep-dive」用途に降格

## 設計判断

- **cron 戦略**: 新規 cron を追加せず既存 daily cron に相乗り。Workers free plan の cron 3 本上限保護
- **alert-relay 呼び出し**: service binding ではなく Request 偽造（既存 route contract を通し、余分な Worker-to-Worker 境界なし）
- **Slack 成功判定**: `status === 200 && body.trim() === "ok"` 両面（revoke 後の HTTP 200 + `"no_service"` を検知）
- **Mail provider**: Resend を採用（送信元ドメイン検証不要・無料枠 3,000 通/月で最小実装）
- **channel 分離**: `SLACK_WEBHOOK_URL_HEALTHCHECK?` を optional binding として用意。未設定時は `SLACK_WEBHOOK_URL` にフォールバック
- **識別子**: payload に `data.healthcheck: true` を固定で乗せ、本物アラートと区別

## 変更ファイル

### apps/api（新規）
- `src/scheduled/healthcheck.ts` — scheduled handler 本体（`runAlertRelayHealthcheck`）
- `src/lib/healthcheck-mail-fallback.ts` — Resend API ラッパー（`sendHealthcheckFailureMail`）
- `src/scheduled/__tests__/healthcheck.test.ts` — Monday gate / Slack 検証 / mail fallback 分岐の unit test
- `src/lib/__tests__/healthcheck-mail-fallback.test.ts` — Resend mock test

### apps/api（編集）
- `src/index.ts` — `export default { fetch, scheduled }` の形に拡張
- `src/env.ts` — `Env` interface に `SLACK_WEBHOOK_URL_HEALTHCHECK?` / `HEALTHCHECK_FALLBACK_EMAIL?` / `RESEND_API_KEY?` を optional 追加
- `wrangler.toml` — 既存 `[triggers]` `0 18 * * *` / `*/15 * * * *` / `*/5 * * * *` を維持し、新規 cron は追加しない
- local env sample — 対象ファイルなし。本タスクでは追加なし

### docs / runbook
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` — cron 自動化との役割分担追記 + 連続 2 回失敗時の即時実施閾値追加
- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-11.md` / `phase-12.md` / `phase-13.md`
- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-11/visual-verification-skip.md`
- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,unassigned-task-detection}.md`
- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-13/pr-summary.md`

### skill 同期（.claude/skills/）
- `aiworkflow-requirements/references/deployment-cloudflare.md` — 「Workers scheduled cron triggers」追記 + optional secrets 表追加
- `aiworkflow-requirements/indexes/keywords.json` — `cron healthcheck` / `weekly healthcheck` / `Monday gate` / `Resend fallback` / `scheduled handler` 追加
- `aiworkflow-requirements/indexes/topic-map.md` — `monitoring` / `cloudflare-deployment` セクション更新

## 検証手順

### ローカル
- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` PASS
- `mise exec -- pnpm --filter @ubm-hyogo/api lint` PASS
- `mise exec -- pnpm --filter @ubm-hyogo/api test` PASS
- 機密値 grep: 0 件

### staging（外部実施）
1. `bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --env staging`
2. `bash scripts/cf.sh secret put HEALTHCHECK_FALLBACK_EMAIL --env staging`
3. `bash scripts/cf.sh secret put RESEND_API_KEY --env staging`
4. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`
5. Cloudflare Dashboard → Workers → Triggers → 手動発火 → Slack staging channel 到達確認
6. `SLACK_WEBHOOK_URL_HEALTHCHECK` を不正値に差し替えて再発火 → メール受信確認
7. 元の値に戻す

### production（外部実施）
1. 上記 staging と同手順で production env に適用
2. 翌月曜 UTC 18:00 の cron 発火を `bash scripts/cf.sh tail --env production` で観測

## ロールバック

| 範囲 | 手順 |
| --- | --- |
| デプロイ | `bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/api/wrangler.toml --env <env>` |
| scheduled handler 無効化 | `apps/api/src/index.ts` の `scheduled` export を一時削除 → 再 deploy（cron 発火しても no-op 化） |
| cron schedule 撤去 | `apps/api/wrangler.toml` の `[triggers].crons` から該当 schedule を削除 → 再 deploy（既存 daily cron が無ければ） |
| Secrets | optional のため残置可。完全撤去なら `bash scripts/cf.sh secret delete <name> --env <env>` |

## Test plan

- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `pnpm --filter @ubm-hyogo/api test` PASS
- [ ] staging deploy 成功（外部実施）
- [ ] staging Slack channel 到達確認 + screenshot 取得（外部実施）
- [ ] staging Resend mail fallback 受信確認 + screenshot 取得（外部実施）
- [ ] production deploy 成功（外部実施）
- [ ] 翌月曜 cron 発火を wrangler tail で確認（外部実施）
- [x] 機密値 grep 0 件
- [x] `apps/web/` 配下に変更なし

## 不変条件チェック

- [x] D1 直接アクセスを追加していない（本タスクは D1 アクセスなし）
- [x] Secret は 1Password → Cloudflare Secrets / `.env` に実値なし
- [x] Cloudflare CLI は `bash scripts/cf.sh` 経由のみ
- [x] UT-08-IMPL（WAE custom alerts）と責務重複なし
- [x] `apps/web/` 配下に変更がない
- [x] 既存 runbook の上書きなし（追記方式）

## スクリーンショット

NON_VISUAL タスクのため UI スクリーンショットなし（`outputs/phase-11/visual-verification-skip.md` 参照）。
Slack 実投稿 / Resend メール受信 / wrangler tail ログは external ops 実施時に
`outputs/phase-11/screenshots/` 配下に追加する（本 PR では空のまま）。

## 関連 Issue

Refs #635

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 13-3. post-merge アクション

PR が `dev` にマージされた後に実施:

| # | アクション | 担当 |
| --- | --- | --- |
| 1 | `docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md` を `docs/30-workflows/completed-tasks/` 配下へ `git mv` | 手動 |
| 2 | external ops（secrets 投入 / staging deploy / 手動 cron 発火確認 / production deploy）を実施 | プロジェクトオーナー |
| 3 | external ops 完了後、status を `completed` に更新（`outputs/phase-12/system-spec-update-summary.md` 参照） | 手動 |
| 4 | staging で取得した screenshot 2 枚 + cron 発火ログを `outputs/phase-11/screenshots/` および `outputs/phase-11/cron-fire-log.txt` にコミット | follow-up PR |
| 5 | dev → main の昇格 PR を別途作成（CLAUDE.md「main は dev→main リリース時のみ」） | 別タスク |
| 6 | 翌月曜 UTC 18:00 の初回 cron 発火を wrangler tail で観測し、運用記録に追記 | プロジェクトオーナー |

---

## 13-4. 振り返りチェック

| 観点 | 内容 |
| --- | --- |
| 計画精度 | 「小規模」見積もりに対する実工数の差分 |
| 不変条件 | CONST_005（変更ファイル一覧 / シグネチャ / 入出力 / テスト / コマンド / DoD）違反が PR レビューで指摘されたか |
| Lessons Learned | Slack revoke パターン検知 / Workers cron 3 本上限回避 / Resend 採用判断が将来タスクに転用できるか |
| 後続タスク | UT-17 親 workflow / followup-001/002/004 への明示的な引き継ぎ（独立性確認）が記録されたか |
| 運用 | 月次 runbook の役割分担降格が混乱なく運用に乗ったか |

---

## 13-5. 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| dev → main 昇格 PR | 本 PR マージ後、別 PR で本番反映 | 本タスクスコープ外 |
| ut-17-followup-001/002/004 PR | 独立。並走 / 順次どちらも可 | 先行マージ側に rebase で追従 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-12/implementation-guide.md` | PR 本文「変更ファイル / 設計判断 / 検証 / ロールバック」の元データ |
| 必須 | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-12/unassigned-task-detection.md` | post-merge アクション 1 番の元データ |
| 必須 | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-13/pr-summary.md` | gh pr create 本文の参照元 |
| 必須 | CLAUDE.md「PR作成の完全自律フロー」 | PR 作成プロトコル |
| 必須 | CLAUDE.md「ブランチ戦略」 | dev base 運用 |
| 参考 | `docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-13.md` | フォーマット参考 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-13/pr-summary.md` | PR 本文の正本（gh pr create 引数の元データ） |
| PR | GitHub Pull Request | レビュー / マージ |

---

## 完了条件

- [ ] ユーザー承認（または PR 自律フロー適用条件）が成立している
- [ ] ローカルチェック全 PASS（typecheck / lint / test / 機密値 grep）
- [ ] PR が GitHub 上に作成され URL が記録されている
- [ ] PR base が `dev` である
- [ ] PR タイトルが `feat(api): add UT-17 alert-relay weekly healthcheck cron (issue-635)` である
- [ ] PR 本文に `Refs #635` が記載されている
- [ ] 機密値（Webhook URL / Resend API key / 実メールアドレス）が PR 本文 / コミット / コードに含まれていない
- [ ] 振り返り（13-4 セクション）が記録されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] PR URL が `outputs/phase-13/pr-summary.md` 末尾に記録
- [ ] post-merge アクション 6 件のうち 1 番（unassigned-task 移動）の git mv コマンドが用意されている
- [ ] external ops が「外部実施」として明示分離されている

---

## 次 Phase

- なし（Phase 13 が最終 Phase）
- post-merge: 13-3 の 6 アクションを実施
- ブロック条件: ローカルチェック FAIL / 機密値混入 / `apps/web` 変更混入 / `wrangler` 直接実行履歴混入の場合は実行しない
