# Phase 5: 実装ランブック

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-419-pages-project-dormant-delete-after-355 |
| phase | 05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| 親 Issue | #355 (CLOSED — `Refs #355` のみ使用、`Closes #355` 禁止) |
| 対象 Issue | #419 |

## 目的

Cloudflare Pages プロジェクト dormant 経過後の物理削除を、後続 runtime cycle（user 明示承認付き）が
迷わず実行できる粒度で手順化する。本 Phase は「設計済み・runtime 未実行」の境界を保ち、
destructive コマンドの実行は本サイクルでは行わない。

## 入力（参照ドキュメント）

- `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md`（同タスク未タスク仕様）
- `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/outputs/phase-12/implementation-guide.md`（rollback / Phase 11 evidence 境界）
- `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/outputs/phase-12/unassigned-task-detection.md` U-3
- `scripts/cf.sh`（Cloudflare CLI ラッパ正本）
- `CLAUDE.md` の「Cloudflare 系 CLI 実行ルール」セクション

## 変更対象ファイル一覧

| パス | 種別 | 差分方針 |
| --- | --- | --- |
| `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/runbook.md` | 新規 | 本 Phase 5 ステップを実行可能な手順書として転記。番号付き 7 ステップ、各ステップの evidence 出力先を併記 |
| `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/phase-11/preflight-ac1-ac2.md` | 新規 (skeleton) | AC-1 / AC-2 の事前確認テンプレ。`PENDING_RUNTIME_EXECUTION` ヘッダ付き |
| `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/phase-11/workers-pre-version-id.md` | 新規 (skeleton) | rollback 戻り先 1段目の VERSION_ID 記録テンプレ |
| `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/phase-11/dormant-period-log.md` | 新規 (skeleton) | 観察期間（≥2週間）の開始/週次サンプル/終了テンプレ |
| `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/phase-11/user-approval-record.md` | 新規 (skeleton) | AC-4 user 明示承認文言の貼付欄 |
| `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/phase-11/deletion-evidence.md` | 新規 (skeleton) | 削除コマンド実行ログ（redacted）テンプレ |
| `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/phase-11/post-deletion-smoke.md` | 新規 (skeleton) | Workers production 200 OK 維持確認テンプレ |
| `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/phase-11/redaction-check.md` | 新規 (skeleton) | redaction grep 0件確認テンプレ |
| `scripts/cf.sh` | 編集（必要時のみ） | 既存実装は wrangler 引数を素通りさせる設計のため `pages` サブコマンドは追加実装不要。pre-flight で挙動を確認し、必要であればコメントのみ追記（破壊的変更は行わない） |

> 注: `scripts/cf.sh` は `exec "$WRANGLER_BIN" "$@"` で wrangler に引数を素通りさせる。`bash scripts/cf.sh pages project list`
> 等は追加実装なしで動作する（既存 d1 / deploy と同一経路）。`pages` 専用 helper 関数は今回追加しない。

## 関数・モジュールのシグネチャ

新規 shell 関数追加なし（`scripts/cf.sh` の既存 passthrough を流用）。
runbook.md と evidence skeleton のみ。

## 入出力・副作用

- 入力: ユーザー明示承認文言（PR description または Issue comment）
- 出力: `outputs/phase-11/*.md`（redacted evidence）
- 副作用 (本 Phase): なし。runtime cycle で実行されるコマンド（pre-flight / deletion / smoke）は
  本仕様書では文書化のみ。Cloudflare API 副作用は runtime cycle に委譲する。

## ステップ手順

### Step 1: Pre-flight（AC-1 / AC-2 確認）

```bash
# 認証確認
bash scripts/cf.sh whoami

# Workers production deployment 履歴と最新 VERSION_ID 取得
bash scripts/cf.sh deployments list \
  --config apps/web/wrangler.toml --env production

# Pages プロジェクト一覧と dormant 対象の確認
bash scripts/cf.sh pages project list

# Pages プロジェクトの custom domain attachment が空であること
bash scripts/cf.sh pages project list  # 出力で domain 列を確認
# 必要ならば API 経由で詳細取得
bash scripts/cf.sh api-get /client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects
```

- 出力を redact してから `outputs/phase-11/preflight-ac1-ac2.md` に保存する。
- redaction 対象: `CLOUDFLARE_API_TOKEN` / `Bearer ` / `account_id` 値 / sink URL の token クエリ。

### Step 2: Workers 前 VERSION_ID 取得（rollback 戻り先 1段目）

```bash
bash scripts/cf.sh deployments list \
  --config apps/web/wrangler.toml --env production
```

- 最新の production VERSION_ID を `outputs/phase-11/workers-pre-version-id.md` に記録する。
- これは Pages 削除後の緊急時 rollback 1段目の戻り先となる（2段目の Pages dormant は削除で消失）。

### Step 3: Dormant 観察期間運用（≥2 週間）

- 開始日を `outputs/phase-11/dormant-period-log.md` に記録（YYYY-MM-DD）。
- 週次（最低 2 サンプル）で以下を記録:
  - Workers production の 4xx / 5xx 率
  - 主要エンドポイントのレイテンシ p50 / p95
  - Pages プロジェクトのトラフィック（0 を維持）
- 終了日を記録し、観察結果（「異常なし」「rollback トリガー無し」など）を明記。

### Step 4: User 明示承認取得（AC-4）

- PR description または Issue comment（Issue #419）に以下のいずれか同等の文言を取得:
  - 「Pages プロジェクト削除を承認します」
  - 「approve Pages project deletion」
- 承認文言・承認者・承認日時・参照 URL を `outputs/phase-11/user-approval-record.md` に記録。
- Claude Code は `bypassPermissions` モードでも単独で削除を実行しない。

### Step 5: 削除コマンド実行

```bash
# 例: project name は dormant 確認で得たものを使用
bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes
```

- 実引数（project name / `--yes` の要否）は wrangler `pages project delete --help` で事前確認する。
- 出力を redact し、exit code とともに `outputs/phase-11/deletion-evidence.md` に保存。
- 出力に Cloudflare account ID 等が混入したら必ずマスクしてからコミットする。

### Step 6: Post-deletion smoke

```bash
# Workers production の 200 OK 維持確認
curl -sS -o /dev/null -w '%{http_code}\n' https://<production-host>/
# staging 側も同等に確認
curl -sS -o /dev/null -w '%{http_code}\n' https://<staging-host>/
```

- 削除実行から 1 時間以内に PASS 化すること。
- 結果を `outputs/phase-11/post-deletion-smoke.md` に記録。

### Step 7: Redaction check

```bash
rg -i '(CLOUDFLARE_API_TOKEN|bearer|token=|sink|secret|account_id)' \
  docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/
```

- 出力 0 件であることを確認。
- 確認結果（コマンド・実行日時・件数 0）を `outputs/phase-11/redaction-check.md` に記録。
- 1 件以上検出された場合は該当 evidence を即修正してから再 grep する。

### Step 8: 正本仕様更新（AC-6）

- `.claude/skills/aiworkflow-requirements/references/` 配下で Pages 言及箇所を grep:
  ```bash
  rg -n "Cloudflare Pages|pages\.dev|pages project" .claude/skills/aiworkflow-requirements/references/
  ```
- 該当箇所を「削除済み（YYYY-MM-DD）」ステータスへ書き換える。
- `mise exec -- pnpm indexes:rebuild` で skill index drift を解消する。

## ローカル実行コマンド

```bash
# 本 Phase の作成物（runbook + skeleton）の整合確認
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm sync:check

# scripts/cf.sh が pages サブコマンドを素通しすることの非破壊確認（dry な help 呼び出し）
bash scripts/cf.sh pages --help
```

## 完了条件 (DoD)

- [ ] `runbook.md` が Step 1〜8 を反映している
- [ ] `outputs/phase-11/` 配下に 7 種の skeleton（preflight / workers-pre-version-id / dormant-period-log / user-approval-record / deletion-evidence / post-deletion-smoke / redaction-check）が存在し、いずれも `PENDING_RUNTIME_EXECUTION` ヘッダ付きであること
- [ ] `scripts/cf.sh` への破壊的変更が無いこと（passthrough 設計を維持）
- [ ] runtime（user 承認付き）で実行する境界（Step 1, 2, 3, 5, 6, 7）が runbook 上で明示されていること

## 実行タスク

- 本 Phase 5 の判断と成果物境界を確定し、`outputs/phase-05/main.md` に記録する。
- 後続 runtime cycle が destructive 実行を行うときの引き金（user 承認文言）を文書化する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)
- `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md`

## 成果物

- `outputs/phase-05/main.md`
