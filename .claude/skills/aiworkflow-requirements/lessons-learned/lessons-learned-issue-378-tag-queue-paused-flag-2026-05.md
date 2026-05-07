# Lessons Learned — Issue #378 Tag Queue Paused Flag（2026-05-06）

> task: `issue-378-tag-queue-paused-flag`
> 関連 spec: `docs/00-getting-started-manual/specs/11-admin-management.md`、`docs/00-getting-started-manual/specs/12-search-tags.md`
> 関連 source: `apps/api/src/env.ts`、`apps/api/wrangler.toml`、`apps/api/src/workflows/tagCandidateEnqueue.ts`、`apps/api/src/workflows/tagCandidateEnqueue.test.ts`、`apps/api/src/jobs/sync-forms-responses.ts`、`apps/api/src/jobs/sync-forms-responses.test.ts`、`docs/30-workflows/runbooks/tag-queue-pause.md`
> 関連 reference: `references/workflow-issue-378-tag-queue-paused-flag-artifact-inventory.md`、`references/environment-variables.md`、`references/deployment-cloudflare.md`、`changelog/20260506-issue378-tag-queue-paused-flag.md`

## 教訓一覧

### L-378-001: 緊急停止 flag は「非シークレット Cloudflare variable」+「strict parser」+「D1 read/write 前の早期 return」の三点セットで設計する

- **背景**: tag queue の緊急停止経路として、admin UI toggle（runtime gate に時間がかかる）や secret（rotation コストと運用ノイズ）ではなく、deploy-gated な非シークレット Cloudflare variable を選択した。`"true"` 完全一致のみ停止する strict parser を採用し、`"True"` / `"1"` / `"yes"` 等の人間入力ゆらぎでは停止しないことを契約として固定。pause 時は D1 read/write を一切行わず `{ enqueued: false, reason: "paused" }` と structured log `UBM-TAGQ-PAUSED` を返す。
- **教訓**: 緊急停止の即応性 (deploy で revert 可能) と誤動作耐性 (strict parser による暗黙的停止抑止) を両立するには、「非シークレット var + strict parser + 早期 return + structured log code」の四点を **同一 wave** で配置する。テストは「未設定 / `false` / `true` / 大文字 / 数値 / D1 非呼び出し / log 出力」の 7 種を最低担保にする。
- **将来アクション**: 同種の緊急停止 flag を新設する際は、本 inventory（`references/workflow-issue-378-tag-queue-paused-flag-artifact-inventory.md`）の Runtime Contract セクションをテンプレとして参照し、`environment-variables.md` の Non-secret Cloudflare variables セクションに同形式で登録する。

### L-378-002: pause の境界は「Forms sync candidate enqueue のみ」に固定し、resolve / retry tick / admin UI / `member_tags` write を巻き込まない

- **背景**: 旧 issue-109 系ドキュメントには「`TAG_QUEUE_PAUSED` で 503 短絡」「admin queue listing も停止」のような記述があったが、Issue #378 の正本契約は **Forms sync candidate enqueue のみ pause** である。resolve / reject / retry tick / 既存 queue 行の処理 / admin UI 操作 / `member_tags` 書き込みは pause の影響を受けない。これらの旧記述は stale-current として明示撤回した（issue-109 の phase-12.md / phase-13.md にマーク追記）。
- **教訓**: pause flag の **境界（scope）** は仕様書とコード両側で明文化し、「pause しないもの」を inventory / runbook / system-spec-update-summary に列挙する。旧仕様の曖昧記述は同サイクルで stale-current 分類して current source を明示する。
- **将来アクション**: pause / kill-switch 系仕様の Phase 12 では、`system-spec-update-summary.md` に **Stale-current Classification 表** を必ず作成し、`Reference / Classification / Current Source` の 3 列で旧記述の撤回経路を残す。本 issue では同表が機能した。

### L-378-003: 緊急停止系タスクは admin UI toggle を後回しにすることで責務を最小化し、deploy gate のみで完結させる

- **背景**: 当初 unassigned task（`task-issue-109-tag-queue-pause-flag-001.md`）には admin UI toggle 案が含まれ得たが、Issue #378 では UI toggle を入れず deploy-only で確定した。runbook (`docs/30-workflows/runbooks/tag-queue-pause.md`) で緊急 pause / recovery 手順を固定し、Phase 12 unassigned-task-detection.md では log sampling / admin UI toggle / 汎用 parser 等の後続候補を 0 件で却下した。
- **教訓**: 緊急停止系の MVP は「deploy で切る」「runbook で復旧手順を固定する」の 2 経路で十分なケースが多い。admin UI toggle は runtime authorization gate / audit / role 設計の追加コストが高く、緊急性に対して overshoot しがち。後続候補は **0 件却下** を明示することでスコープ膨張を防ぐ。
- **将来アクション**: 緊急停止系タスクの Phase 12 では `unassigned-task-detection.md` に「検討して却下した候補」を 1 行ずつ却下理由付きで残す。後続再検討時の根拠として参照可能にする。

### L-378-004: skill 定義変更不要の判断は skill-feedback-report.md に明示し、リソース（inventory / lessons / changelog）追加とは区別する

- **背景**: Issue #378 では `skill-feedback-report.md` で task-specification-creator / aiworkflow-requirements / automation-30 の **skill 定義** 変更不要を明記した。一方で aiworkflow-requirements skill 配下の inventory / lessons-learned / changelog は spec sync の一部として追加した（本 lesson はその 1 ファイル）。両者は別レイヤーであり混同しない。
- **教訓**: skill-feedback-report.md は **skill 定義（SKILL.md / indexes / references の責務構造）** の変更要否を判定するファイルであり、issue 固有の **同期リソース**（artifact-inventory / lessons-learned / changelog の 3 件）追加とは区別する。前者を「変更不要」と書いても、後者は通常 1 wave で追加される。
- **将来アクション**: Phase 12 review 時には skill-feedback-report.md と spec sync resource 追加の 2 経路を並列に確認する。inventory / lessons / changelog の 3 件不在は spec sync の取りこぼしを示唆するため、Phase 12 strict outputs に **resource sync checklist** として加えることを task-specification-creator の将来改善候補とする（本 issue では未提案）。
