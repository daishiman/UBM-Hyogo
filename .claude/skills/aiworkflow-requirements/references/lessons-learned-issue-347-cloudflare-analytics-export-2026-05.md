# Issue #347 Cloudflare Analytics Long-term Evidence Export Lessons (2026-05)

## Scope

Workflow: `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/`

Task type: `decision / docs-only / external-saas-dependent / NON_VISUAL`

Source: `outputs/phase-12/skill-feedback-report.md`、`outputs/phase-12/system-spec-update-summary.md`、`outputs/phase-12/implementation-guide.md`、`outputs/phase-12/unassigned-task-detection.md`

## Lessons

### L-347-001: docs-only decision cycle では Phase 11 evidence を representative sample / runtime production sample に分離する

- Symptom: `taskType=decision / docs-only` で Cloudflare dashboard session / API token を持たない wave において、Phase 11 を「実測値 PASS」と書きたくなり、後続 runtime cycle で差し替え忘れが起きる。
- Cause: Phase 11 の evidence concept を「実測値 1 種類」と固定していた。
- Recurrence condition: 外部 SaaS（Cloudflare / GitHub / Stripe など）の認証が docs-only cycle 内で利用不可な状態で、aggregate / schema レベルの仕様化のみを行う decision task。
- 5-minute resolution: Phase 11 outputs を **(a) representative schema sample**（aggregate field set + 命名規約のみ固定）と **(b) runtime production sample**（後続 implementation cycle で取得）の 2 段に分離する。docs-only cycle では (a) と redaction-check のみを配置し、(b) は `task-issue-347-cloudflare-analytics-export-automation-001.md` に明示委譲する。
- Evidence path: `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/outputs/phase-11/evidence/sample-export/`、`outputs/phase-12/skill-feedback-report.md` F-1、`.claude/skills/task-specification-creator/references/phase-template-phase11.md`「外部 SaaS / Cloudflare dashboard 制約確認型 docs-only Phase 11」セクション

### L-347-002: Free plan 制約は Phase 9 で constraints file を先に作る

- Symptom: Phase 2 decision matrix を組んだ後に Cloudflare Logpush / R2 / Workers Analytics Engine が Free plan 外と判明し、選択肢の再構築が発生する。
- Cause: Free plan 制約調査を Phase 5 以降の runbook に押し込み、decision matrix と independence 評価を後戻りさせた。
- Recurrence condition: Cloudflare / GitHub / Notion など Free plan と Paid plan で機能境界が大きく異なる外部 SaaS を採用判断する decision task。
- 5-minute resolution: Phase 9 で `free-plan-constraints.md` を **先に**作成し、(1) 利用可能 endpoint / quota、(2) 利用不可な機能リスト、(3) チェック済み URL と日付、(4) plan boundary、(5) runtime boundary を固定する。decision matrix は constraints file を引いて評価する。
- Evidence path: `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/outputs/phase-09/free-plan-constraints.md`、`outputs/phase-12/skill-feedback-report.md` F-2、`.claude/skills/task-specification-creator/references/task-type-decision.md`「外部 SaaS 認証依存 docs-only decision task」セクション

### L-347-003: aggregate-only storage policy は redaction grep で機械検証する

- Symptom: 「aggregate のみ保存」のポリシーを文字列で書くと、後続 implementation で IP / UA / URL query / email / member ID / session token が混入したか目視確認に依存し、人為ミスを許す。
- Cause: storage policy と検証手段（redaction-check）を分離せず、policy 文書のみで安全を主張した。
- Recurrence condition: PII / sensitive field を構造的に除外する必要がある analytics export / log shipping / event streaming 系。
- 5-minute resolution: Phase 5 で aggregate field の **allowlist**（`requests` / `totalRequests` / `errors5xx` / `readQueries` / `writeQueries` / `invocations`）を固定し、Phase 6 で **redaction grep pattern**（`(email|member_id|session|ip_address|user_agent|url_query)` 等）を仕様化する。runtime cycle は grep ヒット件数 0 を機械的 PASS 条件に組み込む。
- Evidence path: `outputs/phase-05/storage-policy.md`、`outputs/phase-06/redaction-rules.md`、`outputs/phase-11/evidence/sample-export/analytics-export-schema-sample.redaction-check.md`

### L-347-004: decision workflow と automation follow-up は同 wave に詰めない

- Symptom: GitHub Actions cron + fetch script + secret 注入を decision wave に含めると、code review / runtime validation / secret rotation の責務が docs-only spec に紛れ込み Phase 12 compliance check が肥大化する。
- Cause: decision の合意形成と automation の実装を 1 タスクと見なした。
- Recurrence condition: 仕様策定とその仕様に基づく runtime / CI 実装が同時に必要な topic（特に外部 SaaS 連携・analytics・observability）。
- 5-minute resolution: decision workflow は (a) 採用案・(b) storage policy・(c) redaction rules・(d) evidence path を docs-only で確定し、cron / fetch / secret / commit 自動化は `task-issue-347-cloudflare-analytics-export-automation-001.md` に切り出す。decision wave 側は task pointer を `references/task-workflow-active.md` と `unassigned-task/` に同 wave 同期するのみ。
- Evidence path: `docs/30-workflows/completed-tasks/task-issue-347-cloudflare-analytics-export-automation-001.md`、`outputs/phase-12/unassigned-task-detection.md`、`references/task-workflow-active.md`

### L-347-005: 未タスクテンプレ 4 必須セクションは decision-origin でも省略しない

- Symptom: 「decision workflow から派生した follow-up」というだけで、未タスクファイルに `Why / What / Acceptance Criteria / Boundary` のみを書き、`苦戦箇所【記入必須】 / リスクと対策 / 検証方法 / スコープ（含む / 含まない）` を省略しがち。Phase 13 commit 時に compliance check で検出される。
- Cause: `Acceptance Criteria` が「検証方法」の代替になると誤認した。AC は完了の定義（What 系）であり、検証方法（How 系）とは別責務。
- Recurrence condition: docs-only decision / spec_created タスクから派生する implementation follow-up を未タスク化するとき。
- 5-minute resolution: `unassigned-task-required-sections.md` の 4 必須セクションを decision-origin でも例外なく満たす。AC ≠ 検証方法、Boundary ≠ スコープ含む含まない の責務分離を維持する。Phase-12 compliance check に「unassigned task 必須 4 セクション準拠」軸を追加する。
- Evidence path: `.claude/skills/task-specification-creator/references/unassigned-task-required-sections.md`、`docs/30-workflows/completed-tasks/task-issue-347-cloudflare-analytics-export-automation-001.md`

## Downstream boundaries

- 実 `scripts/fetch-cloudflare-analytics.ts` 実装、GitHub Actions monthly cron、`op run` 経由 token 注入、redaction grep CI 組込み、長期エビデンスディレクトリへの commit 自動化は `docs/30-workflows/completed-tasks/task-issue-347-cloudflare-analytics-export-automation-001.md` が owner。
- runtime production sample（実 Cloudflare GraphQL レスポンス）の Phase 11 evidence 差し替えは automation task の runtime cycle 完了時に別 PR で実施する。docs-only decision wave では schema sample のみを正本扱いする。
- Free plan 境界の変更検知（Logpush / R2 / Workers Analytics Engine の Free plan 開放など）は `references/deployment-cloudflare.md` の変更履歴と本ファイル L-347-002 を再評価のトリガーとする。
- aggregate field allowlist / redaction grep pattern の変更は Phase 5 storage-policy.md / Phase 6 redaction-rules.md を canonical とし、本 lessons-learned からは fact ではなく方針のみを参照する。

## 関連リソース

- `references/deployment-cloudflare.md`「Long-term Analytics Evidence」セクション
- `references/deployment-cloudflare-opennext-workers.md` §14「Long-term analytics evidence」
- `references/task-workflow-active.md` `issue-347-cloudflare-analytics-export-decision` 行
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`「外部 SaaS / Cloudflare dashboard 制約確認型 docs-only Phase 11」
- `.claude/skills/task-specification-creator/references/task-type-decision.md`「外部 SaaS 認証依存 docs-only decision task」
- `.claude/skills/task-specification-creator/references/unassigned-task-required-sections.md`
