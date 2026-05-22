# Phase 12: ドキュメント更新 / 状態昇格

## 0. 必須 6 タスク（task-specification-creator skill 規約）

| Task | 出力ファイル | 内容 |
| --- | --- | --- |
| 12-1 | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベル |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements / parent task-03 / observability-monitoring 更新サマリ |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | canonical absolute path 列挙 |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク 0 件でも出力必須 |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` | テンプレ / ワークフロー / ドキュメント 3 観点 |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 6 必須タスク + 7 ファイル実体監査 |

## 1. Task 12-1: 実装ガイド（Part 1 / Part 2）

### Part 1（中学生レベル）

> 「Sentry というエラー監視サービスに、本番でエラーが出たときにメールや画面で気づけるよう、staging（本番のテスト環境）で“ちゃんと届くか”を実際に試してみる回。鍵（DSN）は秘密の場所（Cloudflare Secrets）に入れて、キーの名前だけログに残す。SSR と Browser の 2 通りで“わざとエラーを出して”、Sentry に 2 件届けば成功。最後に、Browser 用 SDK が SSR に紛れ込んでいないかをビルドの中身を grep して確認する。」

### Part 2（技術者レベル）

- env schema 拡張: `SENTRY_DSN_WEB` / `NEXT_PUBLIC_SENTRY_DSN` を optional URL、`SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE` を required、`NEXT_PUBLIC_SENTRY_ENVIRONMENT` を optional enum として `apps/web/src/lib/env.ts` に反映
- wrangler vars: `[env.staging.vars]` / `[env.production.vars]` に環境ラベル + sample rate を非機密として格納
- secret: `cf.sh secret put` で staging に `SENTRY_DSN_WEB` を投入。production secret / deploy は本タスク scope out
- staging deploy + curl HTTP 200 + Sentry dashboard event ≥1（server / browser）
- grep gate: `apps/web/.open-next/worker.js` への `requestIdleCallback` / `@sentry/nextjs` 推移混入 0 件再確認
- 状態昇格: parent `task-03-w2-par-sentry-workers-sdk-unify.md` 冒頭メタを `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` に更新

## 2. Task 12-2: システム仕様書更新

### 更新対象（canonical absolute path）

- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-184740-wt-13/.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-184740-wt-13/.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（差分 small: `SENTRY_DSN_WEB` 命名統一の 1 行）
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-184740-wt-13/.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-184740-wt-13/.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-184740-wt-13/.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-184740-wt-13/.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-184740-wt-13/.claude/skills/aiworkflow-requirements/references/workflow-issue-559-task-03-followup-001-sentry-staging-runtime-evidence-artifact-inventory.md`
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-184740-wt-13/docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md`（冒頭メタ「状態」更新 + `runtime-evidence-ref` 行追加）

### 1-A / 1-B / 1-C ルール適用

- 1-A（既存項目更新）: observability-monitoring に Sentry Web staging evidence 取得手順サブセクション追加
- 1-B（新規項目）: なし（既存ファイル拡張で完結）
- 1-C（index 同期）: `quick-reference.md` / `resource-map.md` / `task-workflow-active.md` / artifact inventory に workflow state と evidence boundary を追加。`topic-map.md` / `keywords.json` は既存 search-spec 対象語に収まるため今回 no-op とする

## 3. Task 12-3: documentation-changelog.md（canonical absolute path 必須）

```
- /Users/dm/.../task-03-w2-par-sentry-workers-sdk-unify.md  状態 PENDING→VERIFIED + runtime-evidence-ref 追加
- /Users/dm/.../observability-monitoring.md                  Sentry Web staging evidence 手順追加
- /Users/dm/.../deployment-secrets-management.md             SENTRY_DSN_WEB 命名 1 行追加
- /Users/dm/.../aiworkflow-requirements/LOGS/_legacy.md      issue-559 ワークフロー参照行追加
- /Users/dm/.../indexes/quick-reference.md                   issue-559 runtime evidence gate 追加
- /Users/dm/.../indexes/resource-map.md                      issue-559 workflow row 追加
- /Users/dm/.../references/task-workflow-active.md           issue-559 active workflow row 追加
- /Users/dm/.../references/workflow-issue-559-...md          artifact inventory 新規作成
- /Users/dm/.../issue-559-.../outputs/phase-11/...           runtime evidence 5 点 + screenshot 2 点
- /Users/dm/.../issue-559-.../outputs/phase-12/...           Phase 12 6 ファイル
```

## 4. Task 12-4: 未タスク検出

- 0 件期待。production deploy は別 follow-up（scope out 明示）で扱うため、本タスク Phase 12 の未タスクには **計上しない**（既存タスク化済み or 別 issue 相当）
- 出力ファイルには「coverage layer 表」もしくは「0 件」明示で代替

## 5. Task 12-5: skill feedback

- テンプレ改善: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `VERIFIED` 昇格を扱う follow-up タスクのテンプレ命名規約を skill に追加提案
- ワークフロー改善: G1〜G5 5 段階承認の汎用化（secret 投入を伴う runtime evidence 取得タスクの共通フォーマット）
- ドキュメント改善: observability-monitoring.md と deployment-secrets-management.md の DSN 命名統一（`SENTRY_DSN` vs `SENTRY_DSN_WEB`）

## 6. Task 12-6: コンプライアンスチェック

| 監査項目 | 期待 |
| --- | --- |
| 6 必須タスク 出力 | 全 6 ファイル存在 |
| 7 ファイル実体（index / phase-01..13 / artifacts） | 15 ファイル存在 |
| canonical absolute path 使用 | documentation-changelog.md で 100% |
| skill-feedback 3 観点 | テンプレ / ワークフロー / ドキュメント 全埋め |
| state 据え置き | G0〜G5 PASS までは root `workflow_state=spec_created` / parent `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持。実測後だけ root を `implemented-local`、parent を VERIFIED に進める |

## 7. workflow_state 遷移

- 本ワークフロー root: `spec_created` →（G0〜G5 PASS 後）→ `implemented-local` →（Phase 13 PR merge 後 別サイクル）→ `completed`
- parent task-03: G0〜G5 PASS までは `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持し、実測後の Phase 12 だけで `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` に書き換える
