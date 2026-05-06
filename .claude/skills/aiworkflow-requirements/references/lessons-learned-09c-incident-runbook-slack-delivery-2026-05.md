# lessons-learned: 09c Incident Runbook Slack Delivery 苦戦箇所（2026-05-06）

> 対象タスク: `docs/30-workflows/completed-tasks/09c-incident-runbook-slack-delivery/`
> 状態: `spec_created` / NON_VISUAL / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
> 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,skill-feedback-report,phase12-task-spec-compliance-check,unassigned-task-detection}.md`
> 関連 Issue: #349 (CLOSED, `Refs #349` のみで履歴完結)

09c incident runbook Slack delivery は本番デプロイ直後に runbook permalink を Slack へ自動配信する spec である。次回の Slack/外部チャネル配信系タスクで同じ判断を短時間で再現するため、苦戦箇所を promotion target 付きで固定する。

## L-09C-IRSD-001: `workflow_run` トリガーは `github.event.inputs` を使えないので context 派生 job を立てる

**苦戦箇所**: `workflow_run` で連鎖発火させると、`workflow_dispatch` 用に書いた `${{ github.event.inputs.* }}` が空文字になり、release_version / deployed_at / runbook_path などが欠損したまま Slack 投稿が走る。

**5分解決カード**: `derive-context` job を最初に置き、`github.event_name` で分岐して、`workflow_run` のときは `github.sha` / 直近 release tag / 既定 dry-run runbook path を `outputs.*` として固定値化する。`workflow_dispatch` のときだけ `github.event.inputs.*` を採用する。後続 job は必ず `needs.derive-context.outputs.*` を読む。

**promoted-to**: `aiworkflow-requirements/references/deployment-gha.md` (workflow_run inputs 制約セクション)

## L-09C-IRSD-002: dry-run → production の二段ゲートは GitHub Environment + bool 入力で多重防御する

**苦戦箇所**: production に直接 `chat.postMessage` できる token を握らせると、誤 dispatch / リプレイ実行で本番 channel に意図せず投稿が飛ぶ。Environment approval だけでは「dry-run の証跡を見たうえで approve した」かは保証されない。

**5分解決カード**: (1) `environment: production-slack-delivery` で必須 reviewer を設定、(2) `workflow_dispatch.inputs.dryrun_evidence_confirmed: boolean` を立て、production モード時に `if: inputs.dryrun_evidence_confirmed == true` を gate に加える、(3) dry-run 専用 channel ID (`SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID`) と production channel ID を **別 variable** にし、token も用途別に分離可能にしておく。

**promoted-to**: `aiworkflow-requirements/references/deployment-gha.md` (二段環境ゲート設計), `aiworkflow-requirements/references/deployment-secrets-management.md` (Slack incident runbook 配信契約)

## L-09C-IRSD-003: Slack 配信 evidence は `chat.getPermalink` で固定リンク化してから保存する

**苦戦箇所**: `chat.postMessage` のレスポンスに含まれる `ts` / `channel` だけを保存しても、後から人が監査するとき URL が組み立て直しになり、private channel ではアクセス不能なケースもある。Slack の channel rename / archive で再現性も失う。

**5分解決カード**: `chat.postMessage` 直後に `chat.getPermalink` を呼び、戻ってくる `permalink` を evidence schema (`SlackEvidence.message.permalink`) に必ず格納する。schema は `ok / mode / ts / channel / message.permalink / commitSha / runbookPermalink / deliveredAt` を最小セットとする。evidence は `outputs/phase-11/evidence/slack-delivery-{dryrun,production}.json` の決定パスに保存し、token 値・raw response body は保存しない。

**promoted-to**: `aiworkflow-requirements/references/observability-monitoring.md` (Slack 配信 evidence schema), `task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`

## L-09C-IRSD-004: CLOSED Issue 由来の execution-spec は `Refs #N` のみで完結させる

**苦戦箇所**: 起票元 Issue がすでに CLOSED の状態で execution-only spec を切ると、PR 本文に `Closes #N` を書いてしまい reopen / duplicated close 状態になる。本タスクも Issue #349 が CLOSED 起点。

**5分解決カード**: source issue が CLOSED の場合、(1) PR 本文は `Refs #N` のみ、`Closes` は使わない、(2) Phase 12 `system-spec-update-summary.md` の Step 1 系に `Issue: #N remains CLOSED` を必ず記録、(3) `unassigned-task/` に存在した起票元 task ファイルは `consumed pointer` (tombstone) として canonical workflow への絶対参照のみに書き換える。L-09C-EXEC-005 と同方針で、incident-runbook 系でも踏襲する。

**promoted-to**: `task-specification-creator/references/phase-13-spec.md` (PR body issue reference rule、L-09C-EXEC-005 と統合)

## L-09C-IRSD-005: secret 契約は spec 公開前に `deployment-secrets-management.md` へ promote する

**苦戦箇所**: Slack bot token / channel ID variable を新規導入する際、aiworkflow secret-management canonical spec に未掲載のまま spec が回ると、後段 wave が secret 契約を二重定義しドリフトする。skill-feedback-report で `promoted` 判定を出した。

**5分解決カード**: 新 secret / variable を導入する spec は Phase 12 で必ず `deployment-secrets-management.md` に対象 wave / token name / channel name / 1Password 正本 / rotation 手順 / 取扱原則を 1 セクションにまとめて promote する。Step 2 発火条件 (新 configuration name 追加) と一致するため、`PASS_WITH_OPEN_SYNC` ではなく **同 wave で完了** させる運用とする。

**promoted-to**: `aiworkflow-requirements/references/deployment-secrets-management.md` (Slack incident runbook delivery 節)
