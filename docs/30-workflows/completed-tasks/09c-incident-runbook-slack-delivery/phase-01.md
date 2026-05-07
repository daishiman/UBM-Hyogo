# Phase 1: 要件定義 — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

判定根拠: 本タスクは Slack `chat.postMessage` API への HTTP 呼び出し、GitHub Actions（または Cloudflare Workers Cron）の YAML 定義追加、TypeScript / shell スクリプト新規実装、`docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/` への JSON 永続化、`.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` への正本追記、09c Phase 11 share-evidence 参照差し替え（既存ドキュメント編集）を伴う。CONST_004 に従い「ファイル新規追加・編集・外部 API 副作用が発生する」ため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-incident-runbook-slack-delivery |
| phase | 1 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-06 |
| 関連 Issue | #349（CLOSED のまま正本昇格） |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| 想定実行者 | Claude Code（実装）+ 人間オペレーター（user approval / production channel 配信承認） |

## 目的（Why）

09c production deploy execution の Phase 11 `share-evidence` は、incident response runbook の URL / Email を **手動 placeholder** で記載しているのみで、

- 配信されたか（message timestamp）
- 誰の channel に届いたか（channel id）
- 後から再取得できる permalink

の証跡が残らない。incident 発生時には「最新の runbook はどこか？誰が共有したか？」の確認から始まり、初動が遅れる。

本タスクで Slack bot による自動配信に置換し、message timestamp / channel id / permalink を `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-*.json` に永続化することで、初動時に即座に runbook を参照できる体制を作る。

ビジネス価値: production release 直後の incident 対応 MTTA（Mean Time To Acknowledge）を短縮し、UBM 兵庫支部会のサービス可用性 SLA 達成に寄与する。

## 達成定義（What）

09b/09c の incident response runbook を **Slack bot で指定 channel に配信**し、`message timestamp` と `evidence path` を `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/` に保存する運用 workflow を、後続実行者がそのまま実装・実行できる粒度で定義する。

成果物としての配信機構:

1. 配信トリガー: 09c production deploy 後の hook（GitHub Actions の `workflow_run` トリガー、または手動 `workflow_dispatch`）
2. 配信先: dry-run channel → user approval → production channel の二段
3. message body: Slack Block Kit による構造化メッセージ（release version / deployed_at / runbook permalink / oncall handle）
4. evidence: `chat.postMessage` の response JSON（`ts`, `channel`, `permalink`）を全て保存

## 入力（Inputs）

| 種別 | 値 |
| --- | --- |
| 上流タスク evidence | 09c production deploy execution の Phase 11 `share-evidence` placeholder（置換対象） |
| runbook 本文 | aiworkflow `quick-reference.md` §Cron Monitoring / Release Runbook から current canonical path を解決する。旧 `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/` は現 worktree で削除差分中のため hard-code しない |
| Slack workspace | `team_id = w1618436027-ek2505248`（ユーザー指定） |
| channel naming プレフィックス | `ubm-hyogo-`（ユーザー指示原文「UBM標語」を支部正式名称「UBM兵庫」と整合化） |
| Slack bot token 正本 | 1Password vault: `op://UBM-Hyogo/Slack Bot - Incident Runbook/credential` |
| 派生 secret 配置先 | GitHub Secrets: `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` / GitHub Variables: `SLACK_INCIDENT_RUNBOOK_CHANNEL_ID`, `SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID` |
| 仕様正本 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` |

## 出力（Outputs）

### 永続化される evidence（Phase 11 で生成。本 Phase ではパスと命名規則のみ確定）

| # | 種別 | 保存先 |
| --- | --- | --- |
| 1 | dry-run 配信 response JSON | `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json` |
| 2 | production 配信 response JSON | `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-production.json` |
| 3 | redacted message body sample | `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-message-rendered.md` |
| 4 | secret resolution log | `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/secret-resolution.log`（token 値は **MASKED** のみ） |
| 5 | dry-run smoke コマンド出力 | `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/dryrun-smoke.log` |

### コード成果物（Phase 6 で実装、Phase 11 で実 evidence 取得）

| # | 種別 | パス | 変更種別 |
| --- | --- | --- | --- |
| 1 | GitHub Actions workflow | `.github/workflows/incident-runbook-slack-delivery.yml` | 新規 |
| 2 | 配信スクリプト | `scripts/notify/slack-incident-runbook.ts` | 新規 |
| 3 | 配信スクリプト ラッパー | `scripts/notify/slack-incident-runbook.sh` | 新規（`scripts/with-env.sh` 経由で `op run` ラップ） |
| 4 | message template | `scripts/notify/slack-incident-runbook.template.json`（Block Kit） | 新規 |
| 5 | evidence 書き出しユーティリティ | `scripts/notify/save-slack-evidence.ts` | 新規 |
| 6 | 単体テスト | `scripts/notify/__tests__/slack-incident-runbook.test.ts` | 新規 |
| 7 | secret 正本追記 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 |
| 8 | 09c Phase 11 share-evidence 参照差し替え | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md` | 編集 |
| 9 | aiworkflow indexes 再生成 | `.claude/skills/aiworkflow-requirements/indexes/` | 自動生成（`pnpm indexes:rebuild`） |

## 機能要件（FR）

- FR-01: Slack `chat.postMessage` API を bot token 認証で呼び出す
- FR-02: dry-run channel と production channel を環境変数で切り替える
- FR-03: production channel への送信は GitHub Actions environment `production-slack-delivery` の手動 approve を経由する
- FR-04: 配信成功時に response JSON（`ok`, `ts`, `channel`, `message.permalink`）を evidence file に保存する
- FR-05: 配信失敗時は exit code 非 0 で workflow を fail させ、stderr に Slack API error を redacted で出力する
- FR-06: bot token はログ・evidence ファイル・stdout に **絶対に出力しない**（必ずマスク）
- FR-07: message body には release version / deployed_at / runbook permalink / oncall handle / 配信モード（dryrun/prod）を含める
- FR-08: runbook permalink は GitHub blob URL を `git rev-parse HEAD` の commit SHA で固定する（main moving tip ではなく immutable URL）

## 非機能要件（NFR）

- NFR-01: 配信スクリプト 1 回の実行時間は 10 秒以内
- NFR-02: token は 1Password から `op run --env-file=.env` で揮発的に注入（`scripts/cf.sh` と同方式 = `scripts/with-env.sh`）
- NFR-03: evidence file は 10 KB 以下（response JSON のみ。本文は別 markdown）
- NFR-04: workflow は Node 24 / pnpm 10（`mise.toml` 準拠）で実行
- NFR-05: aiworkflow-requirements skill の `verify-indexes-up-to-date` CI gate を pass（`pnpm indexes:rebuild` drift なし）

## 制約 / 不変条件

- CONST-RUN-01: Slack token 値は **どのファイル・log・PR description にも書かない**。1Password 参照のみ
- CONST-RUN-02: production channel への配信は user approval 後のみ。dry-run を経由せず直接 production に送る経路を作らない
- CONST-RUN-03: incident runbook **本文**は本タスクで変更しない（参照のみ）
- CONST-RUN-04: `.env` ファイルに実値を記載しない（`op://` 参照のみ。CLAUDE.md「ローカル `.env` の運用ルール」遵守）
- CONST-RUN-05: 09c production deploy 本体ロジックは変更しない。Phase 11 share-evidence の参照差し替えのみ

## 受入基準（AC）

- AC-01: dry-run channel への `chat.postMessage` が ローカル/CI で 200 / `ok=true` を返す
- AC-02: production channel への配信は GitHub Actions environment 承認なしで失敗する
- AC-03: 配信後 `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-{dryrun,production}.json` に `ts` / `channel` / `permalink` が保存される
- AC-04: token 値が evidence・log・PR diff のいずれにも含まれない（`rg -F "xox[b]-"` で 0 hit）
- AC-05: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` に Slack secret 名が追記され、`pnpm indexes:rebuild` で drift 0
- AC-06: 09c Phase 11 の share-evidence placeholder が本タスク evidence path への相対参照に置換される
- AC-07: `pnpm typecheck` / `pnpm lint` / `pnpm --filter @repo/scripts test`（または相当の単体テスト経路）すべて pass

## ステークホルダー

| 役割 | 担当 |
| --- | --- |
| 仕様策定 | Claude Code |
| 実装 | Claude Code（後続の 03.実装 サイクル） |
| Slack workspace 管理 | UBM 兵庫支部会 admin（bot 招待・channel 作成は実装前に手動で完了する前提） |
| production channel 配信承認 | release oncall（GitHub Actions environment approver） |

## リスクと前提

| リスク | 対策 |
| --- | --- |
| Slack token 漏洩 | 1Password 正本、log マスク、`rg` での自動 leak check |
| 誤って production channel に dryrun message が届く | env var で channel id を分離、unit test で channel id assertion |
| GitHub Actions 上で `op run` が動かない | OIDC 経由ではなく GitHub Secrets 経由で token を注入。`op run` はローカル/手動のみ |
| runbook permalink が main 移動で古くなる | commit SHA で URL を pin（`git rev-parse HEAD`） |
| aiworkflow indexes drift | Phase 12 で `pnpm indexes:rebuild` を必ず実行し、`verify-indexes` CI gate を pass させる |

## Definition of Done（Phase 1）

- [ ] 本ファイルが存在し、実装区分 / 入力 / 出力 / FR / NFR / AC / リスク / 制約がすべて埋まっている
- [ ] `outputs/phase-01/main.md` に Phase 1 サマリ（本ファイルの要点）が保存されている
- [ ] artifacts.json の `phases[0].status` が `spec_created` である

## 参照

- index.md
- artifacts.json
- `docs/30-workflows/unassigned-task/task-09c-incident-runbook-slack-delivery-001.md`（昇格元）
- Issue #349
