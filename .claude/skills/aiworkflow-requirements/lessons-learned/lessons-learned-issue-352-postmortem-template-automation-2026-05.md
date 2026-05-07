# Lessons Learned — Issue #352 Postmortem Template Automation（2026-05-05）

> task: `issue-352-postmortem-template-automation`（unassigned `task-09c-postmortem-template-automation-001` から正式昇格）
> 関連 spec: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
> 関連 source: `scripts/postmortem/generate-postmortem.ts`、`scripts/postmortem/__tests__/generate-postmortem.test.ts`、`docs/30-workflows/runbooks/postmortem/template.md`、`docs/30-workflows/runbooks/postmortem/README.md`
> 関連 reference: `references/workflow-issue-352-postmortem-template-automation-artifact-inventory.md`、`references/task-workflow-active.md`（task-09c implemented-local 行）、`indexes/quick-reference.md`（Issue #352 早見）、`indexes/resource-map.md`（postmortem workflow row）

## 教訓一覧

### L-352-001: unassigned-task → formal workflow 昇格時は **同一 wave** で 5 ファイルを更新する

- **背景**: `task-09c-postmortem-template-automation-001` は当初 `unassigned-task/` に stub として滞留しており、Issue #352 として正式昇格した際に skill 側 inventory のみ追加し、`quick-reference` / `resource-map` / `task-workflow-active` / 旧 unassigned stub の close-out が後追いになった。Phase-12 audit で「同一 wave 同期不備」として検出。
- **教訓**: unassigned → formal workflow 昇格時は **必ず同一コミット wave** で以下を更新する: ① `references/` の artifact inventory 新規作成、② `indexes/resource-map.md` の current canonical set 行追加、③ `indexes/quick-reference.md` の早見導線、④ `references/task-workflow-active.md` の implemented-local 行、⑤ `unassigned-task/` 元 stub の `completed-tasks/` 移動（または closed 注記）。1 つでも遅れると inventory が陳腐化する。
- **将来アクション**: skill-feedback-report.md「Workflow Improvements」セクションを `task-specification-creator` Phase-12 checklist に同期し、昇格時の 5 点同期を Phase-12 strict 検証項目に組み込む。

### L-352-002: NON_VISUAL タスクでも Phase 9 / 11 / 13 evidence は **artifact 宣言があれば必須生成**

- **背景**: 本タスクは `NON_VISUAL`（CLI のみ）で UI スクリーンショットが存在しないため、当初 Phase 11 evidence を「不要」と誤判断していた。Phase-12 strict 検証で `outputs/phase-09/coverage-summary.md`・`outputs/phase-11/script-execution.md`・`outputs/phase-11/rollback-evidence-warning.md`・`outputs/phase-13/main.md` (blocked placeholder) の欠落を検出し、PASS 不可と判定された。
- **教訓**: `NON_VISUAL` であっても **artifacts.json で宣言された evidence file は必須生成**。特に Phase 11 は「CLI smoke 実行ログ」「warning パス踏破ログ」を `script-execution.md` / `rollback-evidence-warning.md` 等で代替し、Phase 13 は user approval 待ちでも `blocked_pending_user_approval` placeholder を main.md に残す。`VISUAL_ON_EXECUTION` ではない＝evidence 不要、ではない。
- **将来アクション**: `task-specification-creator` の `phase-11-non-visual-alternative-evidence.md` reference を Phase-09 / Phase-11 / Phase-13 共通の必須 evidence chart として更新し、artifacts.json と outputs/ の 1:1 整合を Phase-12 compliance check に組み込む。

### L-352-003: TS CLI runner は worktree 並列環境では `node --experimental-strip-types` を採用する

- **背景**: 本タスクの初期実装で `tsx` 経由実行を試みたが、worktree 並列セットアップにおいて `tsx` が依存する `esbuild` の host binary（プロジェクトローカル）と global binary がバージョンミスマッチを起こし、`tsx` 実行が断続的に失敗した。`scripts/cf.sh` が `ESBUILD_BINARY_PATH` で同問題を解決しているが、ad-hoc CLI には適用されていなかった。
- **教訓**: monorepo + worktree 並列環境で TS を直接実行する CLI は `tsx` ではなく **Node 22+ の `node --experimental-strip-types`** を採用する。`package.json` の script では `node --experimental-strip-types scripts/postmortem/generate-postmortem.ts` の形で固定し、`tsx` 依存を増やさない。Cloudflare Workers / Wrangler は `scripts/cf.sh` の `ESBUILD_BINARY_PATH` 経由で別 lane を維持する。
- **将来アクション**: 新規 ad-hoc CLI（`scripts/**/*.ts`）は `node --experimental-strip-types` 起動を default とする方針を `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` の「TS CLI 実行ポリシー」項に明記し、`scripts/cf.sh` の Cloudflare 用ラッパーと住み分ける。

## メタ

- workflow root: `docs/30-workflows/completed-tasks/issue-352-postmortem-template-automation/`
- closed unassigned stub: `docs/30-workflows/completed-tasks/task-09c-postmortem-template-automation-001.md`
- Phase-12 verdict: PASS（strict 7 files / artifacts parity / 4 conditions all PASS）
- 同一 wave 同期完了日: 2026-05-05
