# Lessons Learned — Issue #497 Post-release Dashboard 30 Day Conclusion（2026-05-06）

> task: `issue-497-post-release-dashboard-30day-conclusion`
> 関連 spec: `references/deployment-gha.md`（§Post-release dashboard automation / 30 day schedule feedback contract）、`references/task-workflow-active.md`（Issue #497 行）
> 関連 source: `.github/workflows/post-release-dashboard.yml`（変更なし）、`scripts/post-release-dashboard/lib/redaction-check.sh`、`scripts/post-release-dashboard/__tests__/redaction-check.test.sh`、`.github/workflows/ci.yml`、`docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/`
> 関連 reference: `references/workflow-issue-351-09c-post-release-dashboard-automation-artifact-inventory.md`、`changelog/20260506-issue497-30day-feedback.md`、`lessons-learned/lessons-learned-issue-351-post-release-dashboard-2026-05.md`（親）

## 教訓一覧

### L-497-001: 外部時間依存タスクは `spec_created` と `formalized contract` の二相状態を Phase 12 で明示分離する

- **背景**: 本タスクは「30 日連続 schedule run の実測 conclusion 集計」が責務だが、起票時点で運用日数 0 日であり gate 不成立。`spec_created` のまま着手すると runtime evidence が無い状態で Phase 12 を回す必要があり、close-out の意味付けが揺れた（spec 完成と実測完了が同一 state に丸まりやすい）。
- **教訓**: external-time-dependent / cross-system gate を含むタスクは、Phase 12 で `formalization PASS`（spec 構造・同期・契約書化が完了）と `runtime AC PENDING`（gate 通過後に取得する evidence）を **同一 compliance-check 内で 2 表に分離**して記録する。`workflow_state` は gate 通過まで `spec_created` を維持し、`completed` を主張しない。
- **将来アクション**: `task-specification-creator` skill に `EXTERNAL_TIME_DEPENDENT` modifier を追加し、Phase 12 compliance テンプレに `Formalization Checks` / `Runtime Completion Checks` の 2 表分離を default 化する。

### L-497-002: Phase 12 の「7 ファイル存在 PASS」は runtime AC PASS と等価ではない — file-existence と semantic-completion を gate で分ける

- **背景**: 親 Issue #351 の L-351-002（grep gate）を踏まえてもなお、本タスクでは「strict 7 outputs 存在 ⇒ Phase 12 PASS」と読める書き方をすると、30 日 gate 未達の状態で「runtime PASS と誤読」される危険があった。compliance-check 表で `Strict 7 files present: PASS` と `AC-1 30 day coverage: PENDING` が同列で並ぶと評価が混線する。
- **教訓**: Phase 12 compliance-check は「ファイル充足」と「runtime AC 充足」を **別セクションに視覚分離**し、前者の PASS が後者の PASS を含意しないことを冒頭注記で明示する。`state: spec_created / formalized contract` を毎セクションヘッダに繰り返し付ける。
- **将来アクション**: `phase12-task-spec-compliance-check.md` のテンプレ冒頭に "This check validates spec formalization readiness, not runtime completion." の固定 disclaimer を追加。`task-specification-creator` skill 側で同テンプレに昇格する。

### L-497-003: 親タスクの artifact 規約に欠落があれば close-out review で即補修し、CI に gate を追加する（同サイクル hardening）

- **背景**: 30 日 feedback 集計の前提として親 Issue #351 の `redaction-check.sh` を再利用する想定だったが、当初 stdout のみで artifact 出力が無く、後続再現性が担保されなかった。また `post-release-dashboard:test` が CI に組み込まれておらず、collector 退行を CI で検知できなかった。
- **教訓**: 子タスクの review で親契約に欠落（artifact / CI gate）を見つけた場合、**docs-only タスクであっても最小範囲の親 hardening は同サイクルで行い**、`system-spec-update-summary.md` の Step 1-A2 などに scope 拡張として明示記録する。ただし scope 逸脱を避けるため、index.md / phase-12.md の「実装区分」「スコープ」「変更対象ファイル」にも対応する追記を必ず行う。
- **将来アクション**: `task-specification-creator` skill の docs-only テンプレに `Scope Extension: parent-contract-hardening` ブロック雛形を追加し、子タスクが親契約欠落を補修した場合の正規記録経路を提供する。

### L-497-004: schedule 系 workflow の長期 silent failure は redaction artifact + CI test + 30 日 gate の三点で fail-closed にする

- **背景**: `post-release-dashboard.yml` は schedule (`0 0 * * *`) で長期沈黙的失敗（cron 停止 / token 失効 / GraphQL schema drift / artifact retention 漏れ）し得るが、検知系が「Cloudflare metrics 値の人手確認」に依存しがちで、自動化不足だった。本タスクで `redaction-check.md` artifact + CI script test + 30 日連続 conclusion 集計の 3 経路で fail-closed 化する設計が固まった。
- **教訓**: schedule 系 workflow の信頼性は、(1) 各 run が **artifact として PASS/FAIL 報告ファイル**を残す、(2) collector スクリプトの **focused test を CI で必ず走らせる**、(3) **30 日に一度実測 conclusion を集計し references に追記する**、の三点で fail-closed にする。3 経路のうち 1 つでも落ちれば検知できる多重防御にする。
- **将来アクション**: `references/deployment-gha.md` の schedule workflow 章に「3-fence detection model（artifact / CI test / periodic conclusion review）」を追記し、新規 schedule workflow の Phase 9 quality gate のデフォルトとして組み込む。
