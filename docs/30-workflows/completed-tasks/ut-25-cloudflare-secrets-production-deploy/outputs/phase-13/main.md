# Phase 13 main — PR 作成 / ユーザー承認後 secret 投入

## user_approval_required: **true**

本 Phase は **タスク仕様書整備に閉じる**。実 `wrangler secret put` の staging / production 投入は **ユーザーが本人で** `deploy-runbook.md` に従って実走する。Claude Code は実投入を行わない。

---

## ユーザー承認チェックリスト（実投入前に全 ✅ 確認）

### Phase 13 blocked 条件（phase-03.md §Phase 13 blocked 条件 から再掲）

- [ ] UT-03 が completed（`apps/api/src/jobs/sheets-fetcher.ts` が `env.GOOGLE_SERVICE_ACCOUNT_JSON` を参照）
- [ ] 1Password に SA JSON key が保管済み（`op read "op://<Vault>/<Item>/<Field>"` で取得可能）
- [ ] `apps/api` Workers の staging / production 環境作成済み（`apps/api/wrangler.toml` に `[env.staging]` / `[env.production]` 宣言あり）
- [ ] `apps/api/.dev.vars` が `.gitignore` 除外されている（`git check-ignore -v apps/api/.dev.vars` で確認済み）
- [ ] Phase 11 staging smoke が PASS（`outputs/phase-11/manual-smoke-log.md` の全 STEP が PASS）

### NO-GO 条件（phase-03.md §NO-GO 条件 から再掲）

- [ ] cf.sh ラッパー以外の経路（直接 `wrangler`）が手順から排除されている
- [ ] staging-first 順序（staging → production）が deploy-runbook.md で守られている
- [ ] 投入経路が tty インタラクティブ入力でない（必ず `op read | bash scripts/cf.sh secret put` の stdin 経路）
- [ ] rollback 経路が「delete + 再 put」（上書き put 単独でない）
- [ ] `.dev.vars` の `.gitignore` 除外確認手順がある
- [ ] `wrangler secret list` の name 確認手順がある

### Phase 12 引き渡し確認

- [ ] `outputs/phase-12/implementation-guide.md` を読み、UT-26 引き渡し条件を理解した
- [ ] `outputs/phase-12/unassigned-task-detection.md` の派生タスク 5 件を別 issue として登録予定として認識
- [ ] `outputs/phase-12/system-spec-update-summary.md` の正本反映結果をPR説明に含める

### 環境確認

- [ ] 1Password の SA JSON が最新（key rotation 直後でない / 失効していない）
- [ ] 実投入時の作業環境が `mise exec --` 経由で Node 24 / pnpm 10 を使う
- [ ] `set +o history` / `HISTFILE=/dev/null` を実行する準備ができている
- [ ] `wrangler login` でローカル OAuth トークンを保持していない（`.env` の op 参照に一本化）

---

## Phase 13 で Claude Code が行うこと（仕様書整備のみ）

| # | 内容 | 完了状況 |
| --- | --- | --- |
| 1 | `deploy-runbook.md` 作成 | done |
| 2 | `rollback-runbook.md` 作成 | done |
| 3 | `secret-list-evidence-staging.txt` テンプレート配置 | done |
| 4 | `secret-list-evidence-production.txt` テンプレート配置 | done |
| 5 | `main.md`（本ファイル）にユーザー承認チェックリスト記載 | done |
| 6 | PR タイトル・本文案の整理（実 PR 作成はユーザー明示指示まで禁止） | done |

## Phase 13 で Claude Code が行わないこと（境界）

- ❌ 実 `bash scripts/cf.sh secret put --env staging` の実走
- ❌ 実 `bash scripts/cf.sh secret put --env production` の実走
- ❌ `wrangler secret list` の実 name 出力を `secret-list-evidence-*.txt` に貼付
- ❌ aiworkflow-requirements 正本（`deployment-secrets-management.md` / `environment-variables.md`）の実反映
- ❌ UT-26 への引き渡し（Sheets API E2E 疎通テスト）
- ❌ `wrangler login` でのローカル OAuth トークン保持

---

## 実投入境界（ユーザー本人タスク）

| step | 担当 | 内容 | 参照 |
| --- | --- | --- | --- |
| 1 | ユーザー | `deploy-runbook.md` STEP 1 を実走（staging） | outputs/phase-13/deploy-runbook.md |
| 2 | ユーザー | `secret-list-evidence-staging.txt` のプレースホルダを実 `wrangler secret list` の name 出力に置換 | outputs/phase-13/secret-list-evidence-staging.txt |
| 3 | ユーザー | `deploy-runbook.md` STEP 2 を実走（production） | outputs/phase-13/deploy-runbook.md |
| 4 | ユーザー | `secret-list-evidence-production.txt` のプレースホルダを置換 | outputs/phase-13/secret-list-evidence-production.txt |
| 5 | ユーザー | UT-26 へ引き渡し（Sheets API E2E 疎通） | UT-26 ワークフロー |
| 6 | 別 workflow | aiworkflow-requirements 正本反映 | outputs/phase-12/system-spec-update-summary.md |
| 7 | プロダクトマネジメント | `unassigned-task-detection.md` の派生タスクを issue 登録 | outputs/phase-12/unassigned-task-detection.md |

---

## PR 構成（Claude Code が作成）

| 項目 | 値 |
| --- | --- |
| ベースブランチ | dev |
| タイトル | `chore(secrets): apply UT-25 cloudflare secrets deployment runbook` |
| 本文 | 本 main.md の §ユーザー承認チェックリスト + §実投入境界 + §Phase 13 で Claude Code が行わないこと |
| ラベル | `task:UT-25` / `secrets-deploy` / `requires-user-approval` |

> PR 本文に **secret 値・JSON 内容・OAuth トークンを書かない**。

---

## セキュリティ最優先（再掲）

- 実 secret 値は文書に絶対書かない
- 1Password 参照は `op://Vault/Item/Field` のテンプレ表記
- `secret-list-evidence-*.txt` は name 行のみ（`wrangler secret list` 出力）。実値・key 内容は転記禁止
- `wrangler login` でローカル OAuth トークンを保持しない
