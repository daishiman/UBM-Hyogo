# Issue #616 Miniflare / undici Upstream Tracking Lessons (2026-05)

## Scope

Workflow: `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking/`

Task type: `verified_current_no_code_change_pending_pr / implementation / NON_VISUAL / conditional`

Source: 上位タスクである `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking.md` § 9 「苦戦箇所と教訓」、本サイクルの監査エージェント起案 4 件。

## Lessons

### L-ISSUE616-001: canonical path の二重ルール drift を root 存在チェック gate で防ぐ

- Symptom: 同期サイクル中に全 reference が `docs/30-workflows/task-issue-577-followup-002-miniflare-undici-upstream-tracking/` を canonical として書かれたが、実体は `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking/`。
- Cause: 同一 workflow root 内で「親 Issue #577 は `completed-tasks/`、本 followup-002 は非 `completed-tasks/`」と異なる規約で同期され、慣性で followup を非 completed 配下と仮定した。
- Recurrence condition: 親タスクが `completed-tasks/` に既に存在し、子タスク（followup-XXX）が同 wave で spec 化される場合、または taskType が `verified_current_no_code_change_pending_pr` のように「実装不要だが docs で完結」する場合。
- 5-minute resolution: `task-workflow-active.md` 登録前に `test -d <workflow_root>` を必ず実行する Phase 12 gate を追加。canonical 候補は `docs/30-workflows/<slug>/` と `docs/30-workflows/completed-tasks/<slug>/` の両方を `test -d` し、ヒットした方を採用する。両方 hit / 両方 miss はエラーで停止。
- Evidence path: `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking.md` § 9, `.claude/skills/aiworkflow-requirements/references/workflow-issue-616-miniflare-undici-upstream-tracking-artifact-inventory.md`

### L-ISSUE616-002: consumed trace の移送先と参照規約の不一致

- Symptom: unassigned-task → `completed-tasks/` 直下の `.md` ファイル単体移送（ディレクトリではなく単独ファイルが `completed-tasks/` に置かれる）は本サイクルで初出。inventory の Validation Chain に登録された `test -f` path が古い `docs/30-workflows/unassigned-task/...` のままで stale になりかけた。
- Cause: consumed trace の移送は通常「ディレクトリごと `completed-tasks/` に入る」前提で path 規約が設計されていたため、ファイル単体移送パターンが未文書化。
- Recurrence condition: 評価・追跡型（conditional / no-code-change）タスクで、artifact が単一の指示書ファイルしかない workflow を consumed → completed する場合。
- 5-minute resolution: consumed trace を移送する場合、artifact-inventory の Validation Chain に `test -f` を新 path に追従させる。移送前に `before path` / `after path` の組を inventory に列挙し、`test -f <after>` が PASS することを sync 完了 gate にする。
- Evidence path: `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking.md` メタ情報 `consumed_by` / `consumed_at`

### L-ISSUE616-003: conditional implementation の workflow_state 終端定義を schema と同 wave 同期する

- Symptom: 本 workflow で導入した workflow_state 終端値 `verified_current_no_code_change_pending_pr` は新規だが、`task-specification-creator/schemas/artifact-definition.json` の `workflow_state` description（L213 周辺）に未追記。これにより spec creator が当該 state を validation で reject しうる drift が発生。
- Cause: 実装カテゴリ `conditional` を新設する際、Phase 12 で文書側だけ更新し schema 側 enum / description を後追いに回した。
- Recurrence condition: 「実装不要だが evidence で current 維持を主張する」conditional / no-code-change カテゴリの spec を新規に書くとき、または workflow_state enum を増やすとき全般。
- 5-minute resolution: 実装カテゴリ `conditional` 追加と同 wave で `task-specification-creator/schemas/artifact-definition.json` の `workflow_state` enum / description にも追記する。schema PR / spec PR が分かれる場合は同一 PR か直列 PR で扱い、跨 PR drift を作らない。
- Evidence path: `.claude/skills/task-specification-creator/schemas/artifact-definition.json` L213 周辺, `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking/outputs/phase-12/phase12-task-spec-compliance-check.md`

### L-ISSUE616-004: 月次トリアージの運用化は Phase 1 で手動 vs cron を確定する gate を入れる

- Symptom: 本 workflow 本体で「月次 + Miniflare メジャー更新時にトリアージ」と定義したが、`.github/workflows/` 配下に対応する schedule cron が無く、運用が暗黙の手動実行に依存している。
- Cause: read-only triage の「運用化」を Phase 1 要件で明示せず、Phase 12 まで「人手で月次に見る」前提のまま進めた。
- Recurrence condition: 追跡・評価系 / read-only triage / 監視ベースラインのような「定期実行が必要だが本体コード変更を伴わない」タスク全般。
- 5-minute resolution: read-only triage 系タスクの Phase 1 で「手動実行 vs cron 化」のどちらにするかを必ず確定する gate を入れる。cron 化を選ぶ場合は Phase 5 / Phase 13 で `.github/workflows/*.yml` の schedule entry を declared artifact として明示。手動運用を選ぶ場合は責任者と発火条件（カレンダー / 上流リリース watch）を Phase 1 outputs に書く。
- Evidence path: `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking/outputs/phase-01/`（該当する場合）, `.github/workflows/`（schedule cron 不在）

## Downstream boundaries

- 実 worker cap 緩和（`--maxWorkers=2 → 4 → auto`）の adoption 実行は本 lessons の owner 対象外。`apps/api/package.json#scripts.test:coverage` と CI 実測 evidence を伴う別 implementation wave で扱う。
- workflow_state enum schema 追記の実 PR は `task-specification-creator` skill owner に委譲。
- 月次トリアージ cron 化を採用する場合の `.github/workflows/` 配線は別 unassigned task で fork する。

## 関連リソース

- `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking/`
- `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-616-miniflare-undici-upstream-tracking-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（Issue #616 行）
- `.claude/skills/task-specification-creator/schemas/artifact-definition.json`

## 検索キーワード（indexes rebuild 用）

miniflare, undici, EADDRNOTAVAIL, worker cap, maxWorkers, issue-616, issue-577, followup-002, conditional implementation, verified_current_no_code_change_pending_pr, canonical path drift, completed-tasks 規約, consumed trace, workflow_state enum, 月次トリアージ, cron 配線, upstream tracking
