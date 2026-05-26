---
task_root: docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/
synced_at: 2026-05-24
state: implemented_local_runtime_pending / implementation / VISUAL
related_lessons:
  - lessons-learned-07c-followup-002-attendance-visual-smoke-2026-05.md
  - lessons-learned-runtime-smoke-staging-mint-recurrence-2026-05.md
  - lessons-learned-issue-494-09a-A-exec-staging-smoke-runtime-2026-05.md
related_specs:
  - docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/index.md
  - .claude/skills/task-specification-creator/references/phase-11-screenshot-guide.md
  - .claude/skills/aiworkflow-requirements/references/workflow-issue-874-login-staging-visual-smoke-artifact-inventory.md
follow_ups:
  - staging deploy / staging smoke 実行 / 7 PNG 取得 / visual diff 目視 (user-gated)
  - commit / push / PR は user-gated
---

# issue-874 login staging visual smoke の苦戦箇所

> 対象 workflow: `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/`
> 同期日: 2026-05-24
> 実装範囲:
> - `apps/web/playwright/tests/login-smoke.spec.ts`（`PLAYWRIGHT_EVIDENCE_DIR` env override 1 行追加。local default 維持）
> - `scripts/run-login-staging-smoke.sh`（新規。`--project=staging --grep 'renders LoginCard|captures mobile input' --reporter=line`）
> - `apps/web/playwright.config.ts` は **無改変**（既存 staging project rule をそのまま流用）

## L-LOGIN-STG-001: spec env-override は config を弄らず spec 1 行で済ませる

**症状/事象**: local baseline 8 PNG が既に運用中で、staging 撮影先を分離する必要があった。playwright.config.ts に staging-specific output path 設定を追加する案も検討したが、既存 local test の振る舞いに影響しうる。

**Why**: playwright.config.ts は CI / local / staging で共有される起点ファイル。staging 固有の path 注入を config 階で行うと、loc test 実行時の副作用を毎回 env で抑制する必要が出てくる。spec 内 `process.env.PLAYWRIGHT_EVIDENCE_DIR ? resolve(...) : <local default>` の三項分岐 1 行で、未設定時の挙動が変わらないことを spec の同一視点で保証できる。

**How to apply**: 既存 spec の出力パスを env で上書き可能化する場合、config を変更せず spec 内三項で済ませる。default 側は元の literal を維持し、grep で「default が無変化」を CI gate に出来る形にする。

## L-LOGIN-STG-002: staging evidence は local baseline と物理分離する

**症状/事象**: local baseline と staging 撮影を同じ `staging-screenshots/` に共存させると、目視 diff で baseline 上書き事故が起きうる。

**Why**: visual smoke の AC は「local と staging の見た目が同じ」。撮影先が同 dir だと、片方の更新でもう片方が上書きされ、diff 元が消える。

**How to apply**: staging 撮影は workflow 直下の `outputs/phase-11/staging-screenshots/` に置き、local baseline (`apps/web/playwright/baseline/` 等) と物理的に別 dir で管理する。artifact-inventory にも「staging screenshots / staging smoke log / visual diff note」を別行で列挙し、保管先が混在しないことを inventory 段で表現する。

## L-LOGIN-STG-003: 親 workflow の unassigned-task-detection.md は live ledger として consumed trace を残す

**症状/事象**: FU-LOGIN-003 を昇格 workflow (issue-874) に取り込んだ際、親 (`completed-tasks/login-page-prototype-alignment/`) 側に「誰が消費したか」が残らないと、後から FU の出自を追えなくなる。

**Why**: completed-tasks 配下の `unassigned-task-detection.md` は「過去の検出ログ」ではなく live ledger。子 workflow が立ち上がった時点で `consumed by <path>` を追記しないと、unassigned-task 一覧から消えた followup の追跡が失われる。

**How to apply**: 未タスク昇格時は次の 3 点を同 wave で更新する:
1. 親 workflow の `outputs/phase-12/unassigned-task-detection.md` の対象行を `consumed by docs/30-workflows/.../<child-workflow>/` に書き換える
2. `docs/30-workflows/unassigned-task/<file>.md` の `status: pending` → `consumed`、`canonical_workflow` を子 workflow path に
3. 子 workflow の `outputs/phase-12/unassigned-task-detection.md` の Consumed Source 節に両 path を列挙

子 workflow の completed-tasks 移動後は、これら参照を「（consumed → moved from unassigned-task/）」付きで現在 path に補正する（spec-historical phase-1/5/13 の literal は audit trail として残す）。

## L-LOGIN-STG-004: staging deploy / smoke 実行は user-gated 境界

**症状/事象**: helper script を作る際、deploy を含めるべきか議論になりがち。

**Why**: `scripts/cf.sh deploy` は本番影響をもつ実行。AI 側で deploy を helper に含めると、ローカル `pnpm` 経路から人手承認なしで staging を書き換えうる。

**How to apply**: helper の責務は「既存の staging 環境に対し読み取り visual smoke を実行する」のみに限定する。deploy / migrations / secret 操作は helper の外側に置き、artifact-inventory の gates 注釈で `external_ops` に分離する。
