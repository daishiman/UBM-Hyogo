# Lessons Learned — Issue #588 Fallback Alert Slack/Mail Extension（2026-05-10）

> task: `issue-588-fallback-alert-slack-mail-extension`（unassigned `u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md` を supersede）
> 関連 SSOT: `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`、`.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
> 関連 reference: `references/workflow-issue-588-fallback-alert-slack-mail-extension-artifact-inventory.md`、`references/task-workflow-active.md`（issue-588 行）、`indexes/quick-reference.md`、`indexes/resource-map.md`
> 関連 changelog: `changelog/20260510-issue588-fallback-alert-slack-mail-extension.md`

## 教訓一覧

### L-588-001: notification 拡張は **env 名追加だけでなく workflow wiring を同 wave で必ず可視化** する

- **背景**: Issue #588 では `SLACK_WEBHOOK_INCIDENT` / `EMAIL_WEBHOOK_URL` 等の env 名を実装側 (`fallback-rate-alert.ts`) と secrets 管理 reference に追加するだけで完結すると見え、初稿では `.github/workflows/cf-audit-log-monitor.yml` 側の wiring（`analyze.ts` 直後に `Evaluate fallback rate notification` ステップを置く）の追加を後回しにしかけた。env 名だけ揃えても trigger surface が無ければ runtime 上は起動しない。「実装は file を変える、設定だけの change は実装ではない」という task-specification-creator の原則と組み合わせると、env 拡張型タスクは workflow step の差分が成果物として必須になる。
- **教訓**: GitHub Actions / Cloudflare cron 等で実行される notification / observability 系 task は、(a) runtime コード側のディスパッチ実装、(b) 関連 env / secret の宣言、(c) workflow step の wiring（呼び出し条件・dry-run 分岐・guard 含む）の **3 点同期** を default checklist にする。env 追加だけで完了とみなさない。`automation-30` review 時にも「workflow step は wiring されているか」を必ず確認項目として追加する。
- **将来アクション**: `task-specification-creator` の Phase 6 / Phase 11 ガイダンスに「notification / observability 拡張の 3 点同期 checklist」を追記候補。`observability-monitoring.md` の章末にも「env を増やすときは必ず workflow / cron 側 wiring を同 wave で更新する」運用注を追加候補。

### L-588-002: 通知の best-effort isolation は **GitHub Issue を required audit trail、Slack/mail を補助** と明示し、失敗で監査証跡を巻き込まない

- **背景**: 3-hour 連続 fallback 検知時の通知先を増やすにあたり、Slack / mail HTTP webhook 失敗時に GitHub Issue 起票まで失敗扱いになる素朴実装に倒れがちだった。GitHub Issue は監査証跡として最重要の sink であり、補助通知の HTTP error で抑止されるのは設計として後退する。最終的に `dispatchSlack` / `dispatchMail` を try/catch で隔離し、失敗は記録のみして Issue 起票フローは継続する best-effort isolation 設計に確定した。
- **教訓**: 多 sink 通知設計では **「監査必須 sink」と「補助通知 sink」を runtime contract レベルで明示**し、補助 sink の失敗で必須 sink を巻き込まない isolation を default にする。dry-run 分岐も同じ原則で書き、本番副作用を持つのは required sink のみに揃える。runbook / spec にもこの優先順位を明記する。
- **将来アクション**: `observability-monitoring.md` に「multi-sink notification 設計 pattern: required audit trail vs best-effort auxiliary」セクションを追記候補。fallback-rate alert 以外の cron / monitor 系 task でも同じ pattern を再利用する。

### L-588-003: redaction は **テキスト本文の固定 marker 化を実装責任、PII カラム自体の不投入を設計責任** に分けて二重で守る

- **背景**: Slack / mail 本文に user_id / tenant_id / sha256 hash / Bearer token / Slack webhook URL が漏出するリスクをゼロにするため、`[REDACTED:...]` marker による正規表現置換を `fallback-rate-alert.ts` 内に実装した。一方で、置換漏れ・新パターン追加忘れは将来必ず発生する想定の方が安全であり、上流 (`analyze.ts` snapshot) の段階で PII を含むカラムをそもそも payload に載せないという設計レイヤも同時に効かせる必要がある。redaction を実装単独で完結させると、新カラム追加時に sink 側が露出する failure mode が残る。
- **教訓**: 通知系の PII / secret 漏洩防止は (a) sink 直前の本文 redaction（実装責任）と (b) 上流 snapshot で PII カラムを最初から含めない設計（設計責任）の **二重防御**を default にする。test 側でも redaction marker presence と原文不在の両方を assertion して回帰を防ぐ。
- **将来アクション**: `observability-monitoring.md` の redaction セクションに「twin-layer redaction（implementation + upstream design）」の原則を明記候補。`fallback-rate-alert.test.ts` の assertion パターンを reference template として横展開。

### L-588-004: source GitHub Issue が close 済みのとき PR は `Closes #NNN` ではなく `Refs #NNN` を使い、unassigned task は `superseded_by_issue_NNN` で明示的に閉じる

- **背景**: Issue #588 は元 Issue が既に close 済みの状態で workflow を起こしたため、PR で `Closes #588` を書くと「既に閉じた issue を再度 close 扱い」になり semantic に不正。同様に upstream の unassigned task ファイル (`u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md`) は単純 delete でなく、冒頭注記と `status: superseded_by_issue_588` で明示的に supersede 状態を示し、resource-map / artifact inventory の双方から canonical pointer を保つ運用が必要。
- **教訓**: 「source issue closed → workflow re-formalized」ケースの規約を skill 規範化する。(a) PR 説明文は `Refs #NNN`、(b) unassigned-task は `superseded_by_issue_NNN` ステータス + 冒頭注記、(c) artifact inventory の Source 行に supersede 関係を明示、の 3 点同期。これらは task-workflow-active と changelog の双方からも辿れるようにする。
- **将来アクション**: `task-specification-creator` の Phase 13 PR boundary guide に「closed-source issue → Refs / supersede pattern」を追記候補。`unassigned-task/` の README 相当があれば supersede 表記の正本フォーマットを追記。

## メタ

- workflow root: `docs/30-workflows/issue-588-fallback-alert-slack-mail-extension/`
- source unassigned: `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md`（superseded_by_issue_588）
- Phase-12 verdict: IMPLEMENTED_LOCAL_RUNTIME_PENDING（strict 7 outputs all PASS、commit/push/PR/secret mutation/production verification は user gate）
- 同一 wave 同期完了日: 2026-05-10
- deferred follow-ups: notification 拡張 3 点同期 checklist の skill 規範化、multi-sink isolation pattern 追記、twin-layer redaction 原則追記、closed-source issue supersede 規約整理
