# Phase 8: 品質ゲート / セキュリティ / governance

## 目的

production env 切替（`CF_AUDIT_CLASSIFIER=threshold` → `=ml`）を安全に merge するための CI 必須 status check、secret leakage gate、governance（CODEOWNERS / branch protection）、forward-safe rollback 検証スクリプト、`bash scripts/cf.sh` 経由の secret 操作ルールを確定する。実 merge は Gate-A〜C 通過 + rollback approval/governance evidence後に限定する旨を本 Phase で再宣言する。

## 前 Phase 依存

- Phase 1: Gate decision table / 本サイクル scope（env 切替 PR + 7 日観測 + rollback runbook + leakage grep gate）
- Phase 2: `cf-audit-log-monitor.yml` の post-step 挿入位置 / `secret-leakage-grep.ts` の入力契約 / D1 列の現状
- Phase 3: workflow YAML 差分 / observation JSON schema / rollback 3 step / fallback-rate-alert 発火条件

## 完了条件

- [ ] CI 必須 status check 一覧を本 Phase に列挙し、`outputs/phase-08/main.md` に転記する
- [ ] secret leakage gate（Issue body / hourly log / PR diff）の 3 層を確定する
- [ ] governance（CODEOWNERS path / solo dev 運用ポリシー / branch protection drift 確認手順）を明記する
- [ ] forward-safe rollback 検証スクリプト（D1 列残置確認）の I/O を確定する
- [ ] Cloudflare / 1Password 操作は `bash scripts/cf.sh` 経由のみであることを再確認し、禁止事項を明記する

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 08 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 08-1 | CI 必須 status check を本タスク影響範囲で特定する |
| 08-2 | secret leakage gate の 3 層を表化する |
| 08-3 | CODEOWNERS path と solo dev 運用ポリシーの整合を再確認する |
| 08-4 | forward-safe rollback 検証スクリプトの契約を確定する |
| 08-5 | `bash scripts/cf.sh` ラッパー経由の secret 操作ルールを再宣言する |

## 1. CI 必須 status check（本タスク影響範囲）

| status check | 影響 | 失敗時の挙動 |
| --- | --- | --- |
| `pnpm typecheck` | `scripts/cf-audit-log/observation/*.ts` の型整合 | PR merge 不可 |
| `pnpm lint` | observation script の eslint 違反 | PR merge 不可 |
| focused Vitest（`scripts/cf-audit-log/observation/__tests__/`） | hourly snapshot / fallback-rate-alert の単体ロジック | PR merge 不可 |
| `verify-design-tokens` | 影響なし（UI 非対象） | 参照のみ |
| `verify-indexes-up-to-date` | SSOT 3 ファイル追記時の indexes drift | PR merge 不可 |
| GitHub Actions `cf-audit-log-monitor.yml` (workflow_dispatch dry-run) | env 切替 PR で `--dry-run` を 1 回実行し、Issue 起票なしで成功すること | PR レビュー時に失敗ログを確認 |

`required_status_checks` の正本は GitHub branch protection 側であり、CLAUDE.md の運用に従う。本 Phase ではタスク追加分（observation focused test）のみを宣言し、既存 gate を上書きしない。

## 2. Secret leakage gate（3 層）

| 層 | 対象 | gate 実装 | 検出時の挙動 |
| --- | --- | --- | --- |
| L1 | hourly run の Issue body / log artifact | `secret-leakage-grep.ts --exit-on-detect` を `cf-audit-log-monitor.yml` の post-step に組み込む（Phase 3 設計） | hourly run を fail させ、追加 Issue は起票せず、即時 env を `threshold` に戻す runbook を発火 |
| L2 | PR diff（本タスク自身） | CI 上で `rg -n "(\\b[A-Za-z0-9_-]{32,}\\b\|\\b\\d{1,3}(\\.\\d{1,3}){3}\\b\|@[A-Za-z0-9.-]+\\.(com\|jp\|org))" docs/30-workflows/issue-549-cf-audit-ml-production-switch/` を実行し、生 IP / token らしき文字列が PR diff 内に無いことを確認 | 検出時は PR を block。op 参照（`op://...`）形式に書き換える |
| L3 | Issue 起票 body（fallback-rate-alert.ts） | alert Issue の body 生成前に `secret-leakage-grep.ts` を pass-through 適用し、検出時は body を `[REDACTED]` 置換 | redact 後にも検出が残る場合、Issue 起票自体を skip し stderr に severity=NONE を残す |

L1 / L3 は親 #515 の `secret-leakage-grep.ts` 既存実装を再利用する。`--exit-on-detect` オプションが未実装の場合は本タスク内で追加する（Phase 3 / Phase 6 で確定）。

## 3. Governance（CODEOWNERS / branch protection）

CLAUDE.md「Governance / CODEOWNERS」セクションに従う:

- 本タスクが触る governance path:
  - `.github/workflows/cf-audit-log-monitor.yml` → `.github/workflows/**`
  - `docs/30-workflows/issue-549-cf-audit-ml-production-switch/**` → `docs/30-workflows/**`
  - `.claude/skills/aiworkflow-requirements/references/*.md` → `.claude/skills/**/references/**`
- solo dev 運用のため `required_pull_request_reviews=null`（必須レビュアー 0）。
- `require_code_owner_reviews` は **無効化のまま**（自動承認待ちにしない）。
- ownership は CODEOWNERS で文書化のみ。Gate-C は CODEOWNERS required review ではなく、rollback runbook approval / governance evidence と self-merge 事後 audit でカバー。
- branch protection drift 確認手順（UT-GOV-001 適用時）:

```bash
# dev / main の branch protection を個別取得し、運用方針からの drift がないか確認
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | grep -E '"required_pull_request_reviews"|"lock_branch"|"enforce_admins"'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | grep -E '"required_pull_request_reviews"|"lock_branch"|"enforce_admins"'
# 期待:
#   "required_pull_request_reviews": null
#   "lock_branch": false
#   "enforce_admins": true
```

CODEOWNERS 構文検証:

```bash
gh api repos/daishiman/UBM-Hyogo/codeowners/errors
# 期待: {"errors":[]}
```

## 4. Forward-safe rollback 検証スクリプト

production env を `threshold` に戻した後でも D1 追加列（`classifier_used` / `classifier_version` / `confidence`）が残り、再度 `ml` に切り戻す際に migration 不要であることを確認する read-only 検証手順を確定する。

検証コマンド:

```bash
# 1. production の migration 履歴確認（applied 列）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
# 期待: 0016_cf_audit_log_classification が applied 済み

# 2. 列存在の直接確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "PRAGMA table_info(cf_audit_log);"
# 期待: classifier_used / classifier_version / confidence の 3 列が存在

# 3. 直近 24h レコードの classifier 分布
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT classifier_used, COUNT(*) FROM cf_audit_log WHERE created_at >= datetime('now','-24 hours') GROUP BY classifier_used;"
# 期待: rollback 後は threshold が支配的、ml レコードは過去分として残置
```

破壊的 DOWN SQL は **本タスクでは作成・実行しない**。列を残すこと自体が forward-safe の前提。

## 5. Cloudflare / 1Password 操作ルール（再宣言）

CLAUDE.md「Cloudflare 系 CLI 実行ルール」を遵守する:

- すべての Cloudflare 操作は `bash scripts/cf.sh` 経由のみ。`wrangler` 直接実行は禁止。
- `ML_MODEL_PATH` の実値は `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` 参照のみで保持し、`.env` / docs / PR diff / Issue body に転記しない。
- `wrangler login` のローカル OAuth トークンは保持しない（`.env` の op 参照に一本化）。
- secret 投入は次の経路のみ:

```bash
# production の ML_MODEL_PATH を Cloudflare Secrets に投入する場合（worker から参照する場合のみ）
bash scripts/cf.sh secret put ML_MODEL_PATH --config <wrangler.toml> --env production
# repository-level GitHub Actions secret として持つ場合
gh secret set ML_MODEL_PATH --body "$(op read 'op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD')"
```

`op read` の出力をシェル変数や履歴に残さないため、上記 1-liner を直接実行する（中間ファイル禁止）。

## 6. AC との対応

| AC | 担保箇所 |
| --- | --- |
| AC-1（PR diff + rollback approval/governance evidence経路） | §3 Governance |
| AC-2（`bash scripts/cf.sh` 経由） | §5 Cloudflare 操作ルール |
| AC-5（hourly post-step の leakage grep） | §2 L1 |
| AC-7（D1 列 forward-safe 性 staging 確認） | §4 検証スクリプト |
| AC-11（PR 本文 `Refs #549`） | §3 governance / Phase 13 で再確認 |

## 出力

- `outputs/phase-08/main.md`

## Handoff

- Phase 9: 本 Phase の CI gate / leakage 3 層 / forward-safe 検証スクリプトを test plan として `outputs/phase-09/main.md` に展開する。alert 条件（fallback rate / leakage 検出 / hourly run 失敗）と runbook 起動条件を Phase 9 で確定する。
- Phase 10: 本 Phase の rollback 検証コマンドを Definition of Done の検証手順として転記する。

## 参照資料

- `index.md`
- `phase-01.md` / `phase-02.md` / `phase-03.md`
- `CLAUDE.md`（Governance / Cloudflare CLI / Secret 管理）
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/phase-08.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md`

## 統合テスト連携

- Phase 9 にて secret-leakage-grep の `--exit-on-detect` 単体 test、forward-safe 検証コマンドの dry-run、CI gate 動作確認を計画する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 の成果物を上流契約として参照し、Phase 9-13 の入力となる。

## 成果物/実行手順

本 Phase の成果物は `phase-08.md`。leakage / fallback / rollback の実装は Gate 後の実装サイクルで行う。
