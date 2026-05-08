# タスク仕様書: Issue #553 — Live audit-correlation endpoint（GitHub fetch + 定期 correlation）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-553-live-audit-correlation-endpoint |
| タスクコード | U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-01 |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/553 (CLOSED — そのまま据え置き / 再オープン操作は本仕様書では行わない) |
| 起票元 source | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-01-live-audit-correlation-endpoint.md` |
| 親タスク | `U-FIX-CF-ACCT-01-DERIV-04-FU-04`（issue #516） |
| 親ワークフロー | `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/` |
| 配置先 | `docs/30-workflows/issue-553-live-audit-correlation-endpoint/` |
| 作成日 | 2026-05-08 |
| artifacts | `artifacts.json` + `outputs/artifacts.json` mirror |
| 状態 | spec_created |
| workflow_state | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装仕様書]** — root cause: Cloudflare Worker route / cron trigger / Slack incoming webhook 通知 / D1 もしくは R2 永続化 / CI grep gate を成立させるには `apps/api/src/routes/audit-correlation/`、`apps/api/src/audit-correlation/{persist,notify-slack}.ts`、`apps/api/wrangler.toml`、`scripts/audit-correlation/`、`.github/workflows/audit-correlation-verify.yml`、`docs/runbooks/audit-correlation.md` 配下のコード／設定変更が必須。docs-only では cron trigger 設定・Slack webhook 投稿・D1 schema migration を実体化できない。Issue は CLOSED だが「fixture-only から live wiring への follow-up」として実装スコープを保持しているため、後続実装サイクルでコード変更を伴う。 |
| 親 Issue 状態維持 | **CLOSED のまま据え置き**。本仕様書での再オープン / クローズ操作は行わない。Issue は親 #516 完了時点で close 済みであり、live wiring follow-up はこの仕様書 + Phase 13 PR で完結させる。再 open が必要な場合はユーザー判断のみで実施。 |
| 優先度 | 中（`priority:medium`） |
| 規模 | 中規模（`scale:medium`） |
| ラベル | `priority:medium`, `scale:medium`, `type:security`, `status:unassigned` |
| 想定 PR 数 | 1（apps/api live wiring + wrangler cron + scripts + workflow + runbook + SSOT 同期） |
| coverage AC | `apps/api/src/audit-correlation/{persist,notify-slack}.test.ts` の focused vitest が green、`apps/api/src/routes/audit-correlation/run.ts` の Hono route 契約テストが green、`scripts/audit-correlation/run.sh` の bats / shellcheck clean、`.github/workflows/audit-correlation-verify.yml` は actionlint clean、grep gate（secret / full IP / full email / full UA / salt literal / Slack webhook URL 非保存）が CI で恒久化、staging 1 回 dry-run 成功 evidence あり |

## GitHub label / tag（Claude Code / Codex 共有用）

| 用途 | 値 |
| --- | --- |
| Issue 参照 | `#553`（`Refs: #553` を PR 本文に必ず含める。親 #516 も `Refs: #516` で併記） |
| GitHub Issue labels（継承） | `priority:medium`, `scale:medium`, `type:security` |
| PR に付与する labels | `priority:medium`, `scale:medium`, `type:security` |
| `gh pr create` 引数 | `--label priority:medium --label scale:medium --label type:security` |
| ブランチ名 | `feat/issue-553-live-audit-correlation-endpoint` |
| PR タイトル | `feat(security): issue-553 live audit-correlation endpoint (GitHub fetch + cron + Slack)` |
| 親タスク参照 | `U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-01` / 親 `U-FIX-CF-ACCT-01-DERIV-04-FU-04` |
| PR base | `dev`（CLAUDE.md「既定の PR base ブランチは `dev`」に整合） |

## 目的

Issue #516 で fixture-only として実装した `apps/api/src/audit-correlation/` の cross-source correlation engine を、Cloudflare Worker 上で「production GitHub `/orgs/{org}/audit-log` への live 接続」と「定期実行 cron trigger」と「HIGH severity finding の Slack runbook 通知」と「finding 履歴の redact-safe 永続化」まで自動化することで、HIGH alert の検知遅延を 30 分以内に短縮する。

具体的には以下 4 点を満たす:

1. **Live Worker route**: `POST /internal/audit-correlation/run` を `apps/api/src/routes/audit-correlation/run.ts` に追加。`require-admin` 同等の internal token authz を通し、手動 trigger でも cron trigger でも同一 entry から起動できる。
2. **定期 cron trigger**: `apps/api/wrangler.toml` の `[triggers]` に `crons = ["*/15 * * * *"]` を追加し、Worker scheduled handler から live route を起動する。
3. **Slack 通知**: HIGH severity finding を検出した場合、Slack incoming webhook（`SLACK_AUDIT_INCIDENT_WEBHOOK_URL`）に runbook URL 付きで通知する。redact-safe 出力（fingerprintHash の prefix 8 文字 + actorDomain + ipPrefix + uaBucket）のみを payload に含める。
4. **永続化**: finding を D1 `audit_correlation_findings` table に redact-safe 列のみで保存する（保存可リストは Phase 1 で確定）。

親タスクで「fixture-only から live wiring への移行で salt rotation / fingerprintVersion またぎが未文書化のまま着手し、Phase 8 governance で後追い章追加が必要だった」手戻りが発生したため、本仕様書では Phase 1 で「live wiring 固有の salt rotation 手順」「fingerprintVersion またぎ運用」「Cloudflare Worker scheduled handler の retry-after 制約」を最優先で確定する。

## スコープ

### 含む

- `apps/api/src/routes/audit-correlation/run.ts` 新規実装（Hono route + internal token authz + scheduled handler 共通 entry）
- `apps/api/src/audit-correlation/persist.ts` 新規実装（D1 redact-safe 永続化 / Drizzle schema or raw SQL いずれか Phase 2 で確定）
- `apps/api/src/audit-correlation/notify-slack.ts` 新規実装（Slack incoming webhook + runbook URL 組み立て + dry-run / production channel 切替）
- `apps/api/src/audit-correlation/scheduled.ts` 新規実装（Worker `scheduled` event handler から run.ts 共通 entry を呼ぶ）
- `apps/api/src/audit-correlation/__tests__/{persist,notify-slack,run-route}.test.ts` 新規追加（vitest 契約テスト）
- `apps/api/wrangler.toml` 編集（`[triggers]` に `crons = ["*/15 * * * *"]` 追加 + 環境別 vars / secrets binding 追加）
- `apps/api/migrations/NNNN_audit_correlation_findings.sql` 新規（D1 schema migration: `audit_correlation_findings` table）
- `scripts/audit-correlation/run.sh` 編集（live mode flag を追加、fixture mode は据え置き）
- `scripts/audit-correlation/__tests__/live-mode.bats` 新規（live mode の grep gate / dry-run 成功）
- `.github/workflows/audit-correlation-verify.yml` 編集（live mode の grep gate / Slack webhook URL 非保存検証を追加）
- `docs/runbooks/audit-correlation.md` 編集（live wiring 手順 / salt rotation / fingerprintVersion またぎ / cron trigger 監視 を追記）
- `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` 編集（live wiring 章 / cron / Slack / D1 schema を追記）
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json` 編集（`live wiring` / `cron trigger` / `audit-correlation slack` キーワード追加）
- `.claude/skills/aiworkflow-requirements/indexes/{quick-reference.md,resource-map.md,topic-map.md}` 編集（live wiring 参照を index 化）

### 含まない

- `fingerprintVersion=2` への自動 migrate 実装（後続 FU-03 の責務。本仕様書では「またぎ運用手順を runbook に書く」までで完結）
- branch protection 必須化（FU-02 の責務）
- Cloudflare 側 redaction ロジック再設計（Issue #408 の責務）
- Slack 以外の通知経路（メール / PagerDuty / OpsGenie）
- `audit_correlation_findings` table のレポート UI（admin 画面表示）

> **CONST_007 整合**: 上記「含まない」3 件はすべて「今回サイクル内で完了させると技術的・整合性的に破綻する明確な理由がある」ものに限定: FU-02/03 は別 Issue として既に存在し独立スコープ、Cloudflare 側 redaction は親 #408 owner、Slack 以外通知 / レポート UI は本タスクの目的（HIGH alert 30 分以内検知）の達成に不要。「分量が多い」「念のため切り出す」は理由として採用していない。

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Issue #516（github audit log cross-source correlation） | fixture engine / type 定義 / fingerprint hash 計算ロジックが live wiring の前提 |
| 上流 | Issue #408（cf audit logs monitoring） | Cloudflare 側 finding の正規化済み入力 schema が前提 |
| 上流 | GitHub Org Owner 権限 / `audit_log` scope の PAT | `/orgs/{org}/audit-log` の live fetch に必須 |
| 上流 | 1Password `op://CloudflareSecurity/GitHubAuditPAT/credential` 登録 | `GITHUB_AUDIT_PAT` を Cloudflare Secrets に注入する経路の正本 |
| 上流 | 1Password `op://CloudflareSecurity/SlackAuditIncidentWebhook/url` 登録 | `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` の正本 |
| 下流 | `docs/runbooks/audit-correlation.md`（live 手順追記） | HIGH alert 時の運用 |
| 下流 | aiworkflow-requirements `audit-correlation` reference | SSOT 反映先 |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| `gh` CLI が認証済 | `gh auth status` |
| Node 24 / pnpm 10 が使用可能 | `mise exec -- node -v && mise exec -- pnpm -v` |
| Issue #516 の fixture verify が main にマージ済 | `test -d docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation` |
| `apps/api/src/audit-correlation/` の既存 module が存在 | `test -f apps/api/src/audit-correlation/correlate.ts` |
| `actionlint` / `shellcheck` / `bats` が利用可能 | `which actionlint shellcheck bats` |
| `bash scripts/cf.sh whoami` が成功 | Cloudflare CLI ラッパー動作確認 |
| 1Password 参照が解決可能 | `op item get GitHubAuditPAT --vault CloudflareSecurity` の存在確認（**値は表示しない**） |

## 想定アーキテクチャ概要（変更対象モジュール一覧）

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/api/src/routes/audit-correlation/run.ts` | 新規 | Hono route: `POST /internal/audit-correlation/run`、internal token authz、`runCorrelation()` 共通 entry を呼ぶ |
| `apps/api/src/routes/audit-correlation/index.ts` | 新規 | barrel export + Hono `app.route('/internal/audit-correlation', auditCorrelationRouter)` への登録 |
| `apps/api/src/audit-correlation/scheduled.ts` | 新規 | Cloudflare Worker `scheduled` event handler。`runCorrelation()` を呼ぶ薄い entry |
| `apps/api/src/audit-correlation/run-correlation.ts` | 新規 | route と scheduled の共通 orchestration。`github-fetch` → `correlate` → `persist` → `notify-slack` を順に呼ぶ |
| `apps/api/src/audit-correlation/persist.ts` | 新規 | D1 binding 経由で `audit_correlation_findings` row を redact-safe insert |
| `apps/api/src/audit-correlation/notify-slack.ts` | 新規 | Slack incoming webhook 投稿（HIGH のみ。redact-safe payload） |
| `apps/api/src/audit-correlation/runbook-url.ts` | 新規 | finding 種別 → runbook anchor URL 組み立て純関数 |
| `apps/api/src/audit-correlation/__tests__/run-correlation.test.ts` | 新規 | orchestration の契約テスト（mock D1 + mock fetch + mock Slack） |
| `apps/api/src/audit-correlation/__tests__/persist.test.ts` | 新規 | redact-safe insert の契約テスト + grep gate |
| `apps/api/src/audit-correlation/__tests__/notify-slack.test.ts` | 新規 | Slack payload の redact-safe 検証 + dry-run channel 切替 |
| `apps/api/src/audit-correlation/__tests__/run-route.test.ts` | 新規 | Hono route の internal token authz / 401 / 200 ケース |
| `apps/api/src/index.ts` | 編集 | `auditCorrelationRouter` を `app.route(...)` でマウント、`scheduled` export を追加 |
| `apps/api/wrangler.toml` | 編集 | `[triggers]` `crons = ["*/15 * * * *"]`、`[env.staging.triggers]` / `[env.production.triggers]` 追加。secrets binding に `GITHUB_AUDIT_PAT` / `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` / `AUDIT_CORRELATION_INTERNAL_TOKEN` 追加 |
| `apps/api/migrations/NNNN_audit_correlation_findings.sql` | 新規 | D1 schema: `audit_correlation_findings (id INTEGER PK, fingerprint_hash_prefix TEXT, fingerprint_version INTEGER, actor_domain TEXT, ip_prefix TEXT, ua_bucket TEXT, severity TEXT, event_type TEXT, observed_at INTEGER, created_at INTEGER)` |
| `scripts/audit-correlation/run.sh` | 編集 | `--mode=live` flag 追加（既存 fixture mode 据え置き） |
| `scripts/audit-correlation/__tests__/live-mode.bats` | 新規 | live mode flag の grep gate / dry-run |
| `.github/workflows/audit-correlation-verify.yml` | 編集 | live mode の grep gate ジョブ追加（Slack webhook URL / PAT literal 検出） |
| `docs/runbooks/audit-correlation.md` | 編集 | live wiring 手順 / salt rotation / fingerprintVersion またぎ / cron 監視 |
| `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` | 編集 | live wiring 章追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | `live wiring` / `cron trigger` / `audit-correlation slack` 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/{quick-reference.md,resource-map.md,topic-map.md}` | 編集 | live wiring 参照 |

## Phase 構成（13 Phase）

| Phase | 目的 | 状態 |
| --- | --- | --- |
| [1](phase-01.md) | 要件定義 / live wiring SSOT 確定（salt rotation / fingerprintVersion またぎ / retry-after 制約）/ GO 判定 | spec_created |
| [2](phase-02.md) | アーキテクチャ設計 / route / scheduled / persist / notify-slack のモジュール配置とデータフロー | spec_created |
| [3](phase-03.md) | 詳細設計 / インタフェース契約 / 型定義 / D1 schema / Slack payload schema | spec_created |
| [4](phase-04.md) | テストファースト / 契約テスト設計（route / persist / notify-slack / orchestration） | spec_created |
| [5](phase-05.md) | コア実装（route / scheduled / run-correlation / persist / notify-slack / runbook-url） | spec_created |
| [6](phase-06.md) | CLI / runbook 統合（`scripts/audit-correlation/run.sh --mode=live` + runbook 追記） | spec_created |
| [7](phase-07.md) | CI/CD 統合（`audit-correlation-verify.yml` に live mode grep gate 追加） | spec_created |
| [8](phase-08.md) | governance / NON_VISUAL secret hygiene / salt rotation runbook | spec_created |
| [9](phase-09.md) | デプロイ準備 / wrangler env / 1Password 参照 / Cloudflare Secrets 投入 | spec_created |
| [10](phase-10.md) | ローカル / staging 検証 / cron trigger dry-run / Slack dry-run channel 投稿 | spec_created |
| [11](phase-11.md) | NON_VISUAL evidence 収集（typecheck / lint / test / build / grep-gate / staging dry-run） | spec_created |
| [12](phase-12.md) | implementation guide / SSOT sync / changelog / strict 7 成果物 | strict_outputs_present |
| [13](phase-13.md) | PR 作成（multi-stage approval gate: G1 runtime / G2 D1 apply / G3 secrets / G4 commit-push-PR） | spec_created |

## Outputs 導線

| Phase | Output |
| --- | --- |
| 1 | `outputs/phase-1/phase-1.md` |
| 2 | `outputs/phase-2/phase-2.md` |
| 3 | `outputs/phase-3/phase-3.md` |
| 4 | `outputs/phase-4/phase-4.md` |
| 5 | `outputs/phase-5/phase-5.md` |
| 6 | `outputs/phase-6/phase-6.md` |
| 7 | `outputs/phase-7/phase-7.md` |
| 8 | `outputs/phase-8/phase-8.md` |
| 9 | `outputs/phase-9/phase-9.md` |
| 10 | `outputs/phase-10/phase-10.md` |
| 11 | `outputs/phase-11/main.md` |
| 12 | `outputs/phase-12/main.md` |
| 13 | `outputs/phase-13/phase-13.md` |

## 完了条件（DoD: spec_created close-out）

- [x] Phase 1〜13 の実装仕様書が root に揃っている。
- [x] root `artifacts.json` に `taskType=implementation` / `visualEvidence=NON_VISUAL` / `workflow_state=spec_created` / Phase 12 strict 7 outputs を記録している。
- [x] `outputs/phase-12/` に strict 7 成果物を固定ファイル名で配置している。
- [x] aiworkflow-requirements の current canonical set に Issue #553 live wiring spec を same-wave sync している。
- [x] Phase 13 の commit / push / PR / Cloudflare runtime mutation は user approval gate 後に限定している。
- [x] 30 種思考法の compact evidence と検証 4 条件を `outputs/phase-12/phase12-task-spec-compliance-check.md` に記録している。

## 完了条件（DoD: 後続 implementation wave）

- [ ] `apps/api/src/routes/audit-correlation/run.ts` と `apps/api/src/audit-correlation/{scheduled,run-correlation,persist,notify-slack,runbook-url}.ts` が実装され、focused vitest が green。
- [ ] `apps/api/wrangler.toml` の `[triggers]` に `*/15 * * * *` cron が追加され、staging で 1 回以上 scheduled invocation が成功している（evidence 記録）。
- [ ] D1 migration `NNNN_audit_correlation_findings.sql` が staging に apply 済み、redact-safe row が 1 件以上格納されている。
- [ ] `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` / `GITHUB_AUDIT_PAT` / `AUDIT_CORRELATION_INTERNAL_TOKEN` / `AUDIT_CORRELATION_SALT` が Cloudflare Secrets に登録され、1Password 参照経由で staging / production に注入される。
- [ ] HIGH alert の Slack dry-run が staging で 1 回成功し、payload に secret / full IP / full email / full UA / salt literal / webhook URL が含まれない grep gate が CI で恒久化されている。
- [ ] `.github/workflows/audit-correlation-verify.yml` の live mode grep gate が green。
- [ ] `docs/runbooks/audit-correlation.md` に live wiring 手順 / salt rotation / fingerprintVersion またぎ / cron 監視が追記されている。
- [ ] aiworkflow-requirements `references/audit-correlation.md` に live wiring 章が追加され、`indexes/keywords.json` 等が drift なし（CI gate `verify-indexes-up-to-date` 通過）。
- [ ] PR に `priority:medium` / `scale:medium` / `type:security` label が付与され、本文に `Refs: #553` と `Refs: #516` を含む。
- [ ] CONST_007 整合: 後続 implementation wave では上記 runtime / code / migration / secrets / CI の全項目を 1 サイクル内で完了する。FU-02/03 等の除外は親 Issue として既存・別スコープ。

## 参照情報

- 起票元: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-01-live-audit-correlation-endpoint.md`
- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/553（CLOSED）
- 親 Issue (workflow): https://github.com/daishiman/UBM-Hyogo/issues/516
- 親ワークフロー: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/`
- 関連 Issue: https://github.com/daishiman/UBM-Hyogo/issues/408（上流）
- GitHub API: `/orgs/{org}/audit-log` (REST v3)
- Cloudflare Workers Cron Triggers: `wrangler.toml` `[triggers]`
- Slack Incoming Webhooks（incoming-webhook 形式 / `chat.postMessage` ではない）
- runbook: `docs/runbooks/audit-correlation.md`
- aiworkflow-requirements: `.claude/skills/aiworkflow-requirements/references/audit-correlation.md`
