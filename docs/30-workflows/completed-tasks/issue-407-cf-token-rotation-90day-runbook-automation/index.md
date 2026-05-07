# issue-407-cf-token-rotation-90day-runbook-automation

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | post-U-FIX-CF-ACCT-01 |
| mode | sequential（Wave 1 runbook → Wave 2 自動化） |
| owner | - |
| 状態 | implemented-local / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 13 blocked_until_user_approval |
| visualEvidence | NON_VISUAL |
| taskType | implementation |
| issue | #407（CLOSED 状態だがタスク仕様書として継続） |

## purpose

長命 Cloudflare API Token を 90 日サイクルで rotation する手順を runbook 化し、staging-first / 24h 並行運用 / rollback 経路を含む決定論的なオペレーション手順を確立する。さらに Wave 2 で「85 日経過時点で GitHub Issue を自動起票する」`schedule` トリガー workflow まで導入し、初回 rotation 期日（最小 scope Token の本番投入から 90 日）を逃さない仕組みを今サイクル内に完成させる（CONST_007 — Wave 1/2 を分割せず本タスクで完結）。

## why this is implementation, not docs-only

本タスクは以下のコード/ファイル変更を伴うため、CONST_004/005 に従い実装仕様書として扱う:

- `docs/30-workflows/operations/cf-token-rotation-runbook.md`（新規作成）
- `docs/30-workflows/operations/cf-token-rotation-log.md`（新規作成、実施記録テンプレ）
- `.github/workflows/cf-token-rotation-reminder.yml`（新規作成、`schedule` トリガー Issue 自動起票 workflow）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（rotation runbook へのリンク追記、必要時のみ）

runbook 文書は単なるドキュメントではなく、実運用の手順正本（手順違反が即 secret 漏洩リスクに直結する）として `docs/30-workflows/operations/` に置く実装成果物である。

## scope in / out

### Scope In

- 手動 rotation runbook の章立て設計（staging → production の順、24h 並行運用、旧 Token 無効化、rollback）
- runbook の評価ゲート（staging smoke 全 PASS で production rotation 実行可）
- 1Password の Token expiry 90 日 reminder 設計（参照のみ。値は記録しない）
- rotation 実施記録テンプレ（実施日、旧 Token 失効日、検証結果。Token 値 / Token ID / scope 値は含めない）
- `.github/workflows/cf-token-rotation-reminder.yml` 設計（`schedule: cron`、`workflow_dispatch` dry-run、permissions、Issue 起票 step、発行日メタ取得元）
- 起票 Issue の本文テンプレ（runbook リンク + 前回実施記録リンク + assignee）

### Scope Out

- Token 値そのものの自動発行（Cloudflare API は提供するが scope 設計の人手レビューを残す。CONST_007 の例外条件として scope creep 防止のため明示）
- short-lived credential 化 / OIDC 化（U-FIX-CF-ACCT-01-DERIV-01 で扱う）
- D1 health DB token rotation（task-ut-06-fu-h-health-db-token-rotation-sop-001 / #245 が別領域として扱う）
- Phase 1 の仕様作成時点における runbook 本文の完成扱い — タスク全体では Phase 5 で本文を作成し、Phase 11/12 で検証・同期する
- Cloudflare Token ID / scope 値 / API Token 文字列の文書化

## dependencies

### Depends On

- U-FIX-CF-ACCT-01（最小 scope Token が本番投入されていること）
- 1Password vault に Cloudflare API Token Item が存在すること
- `.github/workflows/` への workflow 追加権限（GitHub Actions schedule trigger）
- `scripts/cf.sh` ラッパー（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）

### Blocks

- U-FIX-CF-ACCT-01-DERIV-01（OIDC 化）— OIDC 化後は rotation 概念が変化するため、本 runbook が成立してから DERIV-01 で改訂対象とする

### Related

- task-ut-06-fu-h-health-db-token-rotation-sop-001（#245）— D1 health DB token rotation 知見の共有元
- UT-25-DERIV-04 — secret 自動配置 workflow との統合可能性
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

## refs

- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-03-token-rotation-90day-runbook.md`（本タスクの内容ソース）
- `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/phase-12.md`（historical source; current worktree で不在の場合は DERIV-03 source と本 runbook を正本にする）
- `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/outputs/phase-12/implementation-guide.md`（historical source; current worktree で不在の場合は DERIV-03 source と本 runbook を正本にする）
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `scripts/cf.sh`
- `CLAUDE.md`（Cloudflare 系 CLI 実行ルール、`.env` 運用ルール、branch / governance）
- 参考: <https://developers.cloudflare.com/fundamentals/api/get-started/create-token/>

## AC

### Wave 1（runbook）

- runbook (`docs/30-workflows/operations/cf-token-rotation-runbook.md`) が以下章立てを完備していること
  - 概要 / 90 日選定根拠
  - 事前確認（staging Token 残期間 / 1Password expiry 設定 / `cf.sh whoami` 出力）
  - staging rotation 手順（新 Token 発行 → `gh secret set --env staging` → smoke → 24h 観察 → 旧 Token 無効化）
  - production rotation 手順（staging smoke 全 PASS を前提、新 Token 発行 → `gh secret set --env production` → 24h 並行運用 → 旧 Token 無効化 → 24h 後に削除）
  - rollback 手順（旧 Token Dashboard 再有効化 → `gh secret set` 再注入 → 新 Token 失効）
  - 実施記録手順（`cf-token-rotation-log.md` への追記）
- runbook に Cloudflare API Token 値 / Token ID / scope 値が含まれない
- 実施記録テンプレ (`docs/30-workflows/operations/cf-token-rotation-log.md`) に Token 値項目が存在しない
- 1Password に Token expiry 90 日 reminder の設定方法が runbook に明記されている

### Wave 2（自動化）

- `.github/workflows/cf-token-rotation-reminder.yml` が `schedule: cron`（日次）と `workflow_dispatch`（dry-run）両方をサポート
- 発行日メタの取得元（GitHub Variables `CF_TOKEN_ISSUED_AT` を採用予定）が決定し、85 日経過判定ロジックが yaml に定義される
- 85 日経過時点で `gh issue create` 相当の step が Issue を自動起票する（Issue 本文に runbook と前回実施記録へのリンクを含む）
- workflow の `permissions:` が `issues: write` / `contents: read` の最小権限に限定されている
- `workflow_dispatch` 経由で dry-run 実行が可能（実 Issue を起票せず本文プレビューを step summary に出力）
- assignee が CODEOWNERS（`@daishiman`）に設定される

### 共通

- 仕様書冒頭に `[実装区分: 実装仕様書]` が明記されている
- CONST_005 必須項目（変更対象ファイル一覧、関数/yaml 構造、入出力、テスト方針、ローカル実行コマンド、DoD）が Phase 02 / 03 で具体化されている
- CONST_007 に従い、Wave 1 と Wave 2 を本タスクで完結（先送り禁止）

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-13/main.md

## invariants touched

- secret 取り扱い不変条件（CLAUDE.md「シークレット管理」）— Cloudflare API Token 値は op:// 参照のみ、ドキュメント / log / commit に書かない
- branch 戦略（CLAUDE.md「ブランチ戦略」）— solo 運用ポリシーに従い `feature/* → dev → main`、自動起票 Issue は通常レビュー経路に従う
- governance（CLAUDE.md「Governance / CODEOWNERS」）— `.github/workflows/**` は CODEOWNERS の対象 path であり、本タスクで追加する workflow も owner 明示が継承される

## completion definition

13 phase 仕様書が揃い、Wave 1（runbook + 実施記録テンプレ）と Wave 2（自動 Issue 起票 workflow yaml）が Phase 5 で実体化されていること。commit、push、PR 作成は Phase 13 のユーザー承認後まで実行しない。仕様書全体を通じて Cloudflare API Token 値 / Token ID / scope 値が文書化されないこと。
