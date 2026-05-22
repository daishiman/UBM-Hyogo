# Phase 13: PR 作成（multi-stage approval gate: G1 runtime / G2 D1 apply / G3 secrets / G4 commit-push-PR）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| Source | `outputs/phase-13/phase-13.md` |
| 区分 | リリース（4 段独立承認 gate） |
| 想定所要 | 0.5 人日 |
| PR base | `dev`（CLAUDE.md 明文化済） |
| ブランチ | `feat/issue-553-live-audit-correlation-endpoint` |
| 親 Issue 操作 | **CLOSED のまま据え置き**（Issue #553 / 親 #516 ともに本 Phase で操作しない） |
| visualEvidence | NON_VISUAL（スクリーンショット項目を PR 本文に**作らない**） |

## 目的

Phase 1〜12 の成果物を 1 PR にまとめ、`dev` ブランチを base に PR を作成する。CLAUDE.md「PR 作成の完全自律フロー」に従いつつ、live wiring 固有の runtime / D1 / Secrets の 3 段事前承認を G1〜G3 で取得し、すべて完了した後に G4 で commit / push / PR 作成を実行する。

各ゲートは**独立承認**とし、合算承認は禁止する。承認待ちの間は `blocked_pending_user_approval` 状態に据え置く。

## multi-stage approval gate（4 段独立承認）

### G1: runtime deploy gate

| 項目 | 内容 |
| --- | --- |
| 内容 | staging 環境への Worker deploy が成功し、cron trigger が 1 回以上完走した evidence を承認 |
| 必要 evidence | `outputs/phase-11/evidence/staging-cron-1run.log`（invocation 1 件以上、`Status: OK`、例外なし）と `outputs/phase-11/evidence/wrangler-dev-scheduled.log`（local scheduled handler 完走） |
| 承認方式 | ユーザーが evidence を確認し明示承認 |
| ブロック解除条件 | invocation 失敗時は再実行し成功 evidence を再取得。secret 未注入によるエラーは G3 完了後に再試行 |

production runtime evidence は本 G1 では取得しない（production deploy は G4 commit-push-PR 後の merge-time にユーザー判断で実施）。

### G2: D1 apply gate

| 項目 | 内容 |
| --- | --- |
| 内容 | staging に migration `NNNN_audit_correlation_findings.sql` が apply 済、production への apply はユーザー承認後に実行 |
| 必要 evidence | `outputs/phase-11/evidence/d1-migration-apply-staging.log`（`Migrations to apply: 1` → `Applied`）と `outputs/phase-11/evidence/d1-parity-{staging,production,diff}.{log,md}`（drift 0 件もしくは followup task 発行済み） |
| production apply コマンド | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`（**ユーザー明示承認後に実行**） |
| 承認方式 | staging apply 結果と production apply 計画をユーザーが個別承認 |
| ブロック解除条件 | drift 検出時は Phase 12 Task 4 で followup task が発行されており、本 PR スコープと別途切り出されている |

### G3: secrets injection gate

| 項目 | 内容 |
| --- | --- |
| 内容 | Cloudflare Secrets 4 種が staging / production 両方に投入済を承認 |
| 対象 secret | `GITHUB_AUDIT_PAT` / `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` / `AUDIT_CORRELATION_INTERNAL_TOKEN` / `AUDIT_CORRELATION_SALT` |
| 投入コマンド | `bash scripts/cf.sh secret put <NAME> --config apps/api/wrangler.toml --env staging` および `--env production`（値は 1Password 参照経由で動的注入） |
| 確認コマンド | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` / `--env production` で 4 種の name 行が存在することを確認（**値は表示しない / ログに残さない**） |
| 必要 evidence | secret list 出力の **name のみ** を抜粋した summary を `outputs/phase-13/secrets-injection-summary.md` に記録（値・hash・preview を一切書かない） |
| 承認方式 | staging / production それぞれを個別承認 |

#### redact-safe 不変条件（G3）

- secret value を evidence / PR 本文 / commit message / log に**一切書かない**
- `op://` 1Password 参照のみ仕様書・`.dev.vars.example` に記載可
- `wrangler login` でローカル OAuth トークンを保持しない（`.env` の op 参照に一本化）

### G4: commit-push-PR gate（G1〜G3 完了後のみ実行可）

| 項目 | 内容 |
| --- | --- |
| 前提条件 | G1 / G2 / G3 すべてが個別承認済（合算承認禁止） |
| commit | 変更を意味単位でコミット（実装 / migration / wrangler / scripts / workflow / docs / SSOT を分けても良い）。`--no-verify` 不使用 |
| push | `git push -u origin feat/issue-553-live-audit-correlation-endpoint` |
| PR 作成 | `gh pr create --base dev --label priority:medium --label scale:medium --label type:security` |
| 承認方式 | ユーザー明示承認後に実行 |

## 実行タスク

1. [ ] **G1 承認取得**: Phase 11 の `staging-cron-1run.log` / `wrangler-dev-scheduled.log` をユーザーに提示し承認取得
2. [ ] **G2 承認取得**: `d1-migration-apply-staging.log` / `d1-parity-{staging,production,diff}` を提示し staging apply 結果を承認 → production apply 計画を別途承認 → production apply 実行
3. [ ] **G3 承認取得**: 4 種 secret を staging / production に投入し、`secrets-injection-summary.md`（name のみ）を提示して個別承認
4. [ ] **G4 承認取得後**: `dev` 同期 → 作業ブランチへ merge → typecheck / lint clean → commit → push → PR 作成
5. [ ] PR URL を `outputs/phase-13/phase-13.md` に記録
6. [ ] 親 Issue #553 / #516 は CLOSED / OPEN 状態を**操作しない**

## ブランチ / コミット / PR

### ブランチ戦略

- 作業ブランチ: `feat/issue-553-live-audit-correlation-endpoint`
- base: **`dev`**（CLAUDE.md「既定ブランチは dev」明文化済）
- `dev` を作業ブランチに merge してから push

### PR タイトル

```
feat(security): issue-553 live audit-correlation endpoint (GitHub fetch + cron + Slack)
```

### PR labels

```
priority:medium, scale:medium, type:security
```

### PR 本文必須要素

- `Refs: #553` （親 Issue）
- `Refs: #516` （親ワークフロー Issue）
- spec_created close-out PR では Phase 12 strict 7 成果物と実装仕様の完成を説明し、実装済みチェックボックスを `[x]` にしない。
- implementation wave PR では G1〜G3 evidence が揃った後に下記テンプレートを使う。
- 概要（live wiring の目的: HIGH alert 30 分以内検知）
- 変更点サマリ（`outputs/phase-12/implementation-guide.md` Part 2 から抜粋）
- 検証ログへのリンク（`outputs/phase-11/main.md` および `outputs/phase-11/evidence/` 配下）
- multi-stage gate 完了状況（G1 / G2 / G3 すべて承認済の旨）
- redact-safe 不変条件チェック結果（grep gate PASS）
- **スクリーンショット項目は作らない**（NON_VISUAL）

## PR 本文テンプレート（implementation wave / HEREDOC）

```bash
gh pr create \
  --base dev \
  --title "feat(security): issue-553 live audit-correlation endpoint (GitHub fetch + cron + Slack)" \
  --label priority:medium \
  --label scale:medium \
  --label type:security \
  --body "$(cat <<'EOF'
## Summary
- Cloudflare Worker 上で `/orgs/{org}/audit-log` を 15 分おきに live fetch し、Cloudflare audit との cross-source correlation を自動化
- HIGH severity finding を Slack incoming webhook（dry-run / production channel 切替）に runbook URL 付きで通知
- finding を D1 `audit_correlation_findings` table に redact-safe 列のみで永続化（fingerprint_hash_prefix / fingerprint_version / actor_domain / ip_prefix / ua_bucket / severity / event_type / observed_at）
- secret / full IP / full email / full UA / salt literal / webhook URL を露出させない grep gate を CI で恒久化

## 変更点
- `apps/api/src/routes/audit-correlation/{run,index}.ts` — Hono route + internal token authz
- `apps/api/src/audit-correlation/{scheduled,run-correlation,persist,notify-slack,runbook-url}.ts` — orchestration / D1 persist / Slack notify
- `apps/api/src/audit-correlation/__tests__/*.test.ts` — vitest 契約テスト
- `apps/api/wrangler.toml` — `[triggers]` cron `*/15 * * * *` / secrets binding
- `apps/api/migrations/NNNN_audit_correlation_findings.sql` — D1 schema
- `scripts/audit-correlation/run.sh` — `--mode=live` flag
- `scripts/audit-correlation/__tests__/live-mode.bats` — bats 契約テスト
- `.github/workflows/audit-correlation-verify.yml` — live mode grep gate
- `docs/runbooks/audit-correlation.md` — Live wiring / salt rotation / fingerprintVersion またぎ / cron 監視
- `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` — Live wiring 章
- `.claude/skills/aiworkflow-requirements/indexes/{keywords.json,quick-reference.md,resource-map.md,topic-map.md}` — index 同期

## Test plan
- [x] pnpm typecheck / lint clean
- [x] vitest 全件 green（route / persist / notify-slack / run-correlation）
- [x] bats grep-gate / live-mode green
- [x] actionlint clean
- [x] shellcheck clean
- [x] staging cron 1 回完走（wrangler tail）
- [x] HIGH alert Slack dry-run 投稿成功（redact-safe payload 確認）
- [x] D1 staging migration apply 成功 / parity drift 0 件
- [x] grep-gate で secret / full IP / full email / full UA / salt literal / webhook URL 検出 0 件

## Multi-stage approval gate
- [x] G1: runtime deploy gate（staging cron 1run 承認済）
- [x] G2: D1 apply gate（staging apply 完了 / production apply ユーザー承認済）
- [x] G3: secrets injection gate（GITHUB_AUDIT_PAT / SLACK_AUDIT_INCIDENT_WEBHOOK_URL / AUDIT_CORRELATION_INTERNAL_TOKEN / AUDIT_CORRELATION_SALT を staging / production 両方に投入済 / 値非露出）
- [x] G4: commit-push-PR gate（本 PR 作成）

## Evidence
- outputs/phase-11/main.md
- outputs/phase-12/implementation-guide.md

Refs: #553
Refs: #516
EOF
)"
```

## 親 Issue 状態維持

- 親 Issue #553 は **CLOSED のまま据え置き**。本 Phase での再オープン / 再クローズ操作は行わない。
- 親ワークフロー Issue #516 は OPEN / CLOSED 状態に関わらず本 Phase で操作しない。
- PR merge 後の Issue 操作はユーザー判断のみで実施。

## ローカル実行コマンド（G4 commit-push-PR 段階のみ）

```bash
# dev 同期
git fetch origin dev
git checkout dev && git merge --ff-only origin/dev
git checkout -b feat/issue-553-live-audit-correlation-endpoint
git merge dev

# pre-flight
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# commit + push + PR（上記 gh pr create コマンドを実行）
git add -A
git commit -m "feat(security): issue-553 live audit-correlation endpoint (GitHub fetch + cron + Slack)"
git push -u origin feat/issue-553-live-audit-correlation-endpoint
```

## 検証 / 期待出力

- [ ] G1 / G2 / G3 が独立承認済（合算承認していない）
- [ ] PR base = `dev`、ブランチ = `feat/issue-553-live-audit-correlation-endpoint`
- [ ] PR 本文に `Refs: #553` と `Refs: #516` を併記
- [ ] PR labels に `priority:medium` / `scale:medium` / `type:security` を付与
- [ ] PR 本文に secret / webhook URL / salt literal を一切含まない
- [ ] PR 本文にスクリーンショット項目を**作っていない**（NON_VISUAL）
- [ ] 親 Issue #553 は CLOSED のまま、操作なし
- [ ] `outputs/phase-13/secrets-injection-summary.md` は secret name のみ記載（値・hash・preview なし）

## 統合テスト連携

Phase 13 は PR 作成のみで新規テストは追加しない。Phase 11 の evidence を PR 本文 Test plan セクションから参照する。

## 参照資料

- CLAUDE.md「PR 作成の完全自律フロー」（base = `dev`）
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`bash scripts/cf.sh` 経由必須）
- CLAUDE.md「ローカル `.env` の運用ルール（AI 学習混入防止）」
- `.claude/commands/ai/diff-to-pr.md`
- 親ワークフロー Phase 13: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/phase-13.md`
- Phase 11 outputs: `outputs/phase-11/main.md`
- Phase 12 outputs: `outputs/phase-12/implementation-guide.md`

## 成果物

- `outputs/phase-13/phase-13.md`（PR URL / 採用ブランチ / 各 gate の承認時刻 / 自動修復履歴 / 残課題を 1 回だけ記録）
- `outputs/phase-13/secrets-injection-summary.md`（secret name のみの一覧。値・hash・preview を含まない）
- PR URL（GitHub）

## 完了条件（DoD）

- [ ] G1 runtime deploy gate 承認済（staging cron 1run evidence 取得）
- [ ] G2 D1 apply gate 承認済（staging apply 完了 / production apply 承認済）
- [ ] G3 secrets injection gate 承認済（4 種 secret を staging / production 両方に投入 / 値非露出）
- [ ] G4 commit-push-PR gate で commit → push → PR 作成完了
- [ ] PR base = `dev`、PR タイトル / labels / 本文が仕様通り
- [ ] PR 本文に `Refs: #553` / `Refs: #516` を併記
- [ ] PR 本文に NON_VISUAL のためスクリーンショット項目を**作っていない**
- [ ] 親 Issue #553 は CLOSED のまま据え置き（操作なし）
- [ ] secret / webhook URL / salt literal が PR 本文 / commit message / evidence のいずれにも露出していない
- [ ] `outputs/phase-13/phase-13.md` に PR URL / 各 gate 承認記録 / 残課題を記録
