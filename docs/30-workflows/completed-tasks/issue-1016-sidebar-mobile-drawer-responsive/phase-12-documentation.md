# Phase 12 — ドキュメント整備（spec）

[実装区分: 実装 / VISUAL / workflow_state = implemented_local_runtime_pending]

本ファイルは Phase 12 で **実施する手順の spec**（実行ログではない）。Task 12-1〜12-6 に従い strict 7 成果物を生成し、artifacts parity / indexes drift を確認する。

## 0. 前提

- 本サイクルは実コード + focused Vitest + local screenshot まで完了。staging visual・commit / push / PR は未実行であり staging runtime PASS を主張しない。
- Issue [#1016](https://github.com/daishiman/UBM-Hyogo/issues/1016) は CLOSED 維持・Refs 運用。
- taskType=`implementation` / visualEvidence=`VISUAL`。Phase 11 local screenshot は `present`。

## Task 12-1: strict 7 成果物の生成計画

`outputs/phase-12/` に以下 7 ファイルを生成する。

| # | ファイル | 内容 | 状態 |
|---|---------|------|------|
| 1 | `main.md` | Phase 12 概要サマリ（strict 7 リスト / workflow_state / Gate 状態 / Issue 運用） | present |
| 2 | `implementation-guide.md` | Part 1（中学生）/ Part 2（技術者: `SidebarDrawerProps` 型・Trigger/Drawer API・`useSidebarState` route-close/md collapsed・エッジケース・設定パラメータ）/ 視覚証跡 | present |
| 3 | `system-spec-update-summary.md` | Step 1-A〜1-C / Step 2 = N/A（新規公開 IF なし） | present |
| 4 | `documentation-changelog.md` | workflow-local（Block A）と global skill sync（Block B）を分離記録 | present |
| 5 | `unassigned-task-detection.md` | MINOR M-1 / M-2 / M-3 は全て baseline 解消、関連タスク差分確認 | present |
| 6 | `skill-feedback-report.md` | テンプレート / ワークフロー / ドキュメント改善の 3 観点 | present |
| 7 | `phase12-task-spec-compliance-check.md` | root evidence（先行作成済・本サイクル不変更） | present |

> 識別子は phase-02-design.md から逐語引用し手書き drift を排除する（FB-W1-02b-3）。

## Task 12-2: implementation-guide の 2 パート構成検証

- Part 1（中学生レベル）: drawer を「机の引き出し」に例え、なぜ必要か（スマホ画面が狭い）→ 何をするか の順で本文 3 行以上。
- Part 2（技術者レベル）: `SidebarDrawerProps` 型、`SidebarMobileTrigger` / `SidebarDrawer` API、`useSidebarState` の `usePathname` route-close と matchMedia md 初期 collapsed、SSR hydration / listener cleanup のエッジケース、breakpoint（768/1024px）/ storage key（`ubm:shell:collapsed`）/ body 属性（`data-shell-drawer-open`）/ dialog id（`shell-drawer`）。
- 各 Part に背景 / 実装ステップ / 検証コマンド / 既知制限を含め heading-only を排除（CI fail 回避）。
- `## 視覚証跡` に Phase 11 screenshot 4 枚（canonical 名）を `present` で参照。

## Task 12-3: artifacts parity 確認計画

root `artifacts.json` と `outputs/artifacts.json` の byte 一致を確認する。

| 確認項目 | 期待 |
|---------|------|
| `workflow_state` | 両者 `implemented_local_runtime_pending` で一致 |
| `metadata.workflow_state` | `implemented_local_runtime_pending` |
| `phases` | 実コード + focused test present / local screenshot present / staging pending の境界で一致 |
| root ↔ outputs byte 一致 | parity OK |

```bash
diff docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/artifacts.json \
     docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/outputs/artifacts.json
```

## Task 12-4: index.md Phase 表整合確認

`index.md` の Phase 一覧と `artifacts.json.phases` を同値に保つ。Phase 11 は focused test present / local screenshot present。Phase 12 行が `phase-12-documentation.md` を指すことを確認する。

## Task 12-5: compliance-check との無矛盾確認

先行作成済 `phase12-task-spec-compliance-check.md`（root evidence）と矛盾しないことを確認する。

| 観点 | 整合点 |
|------|--------|
| workflow_state | `implemented_local_runtime_pending`（両者一致） |
| Phase 11 screenshot | 4 枚 canonical 名 `present`（両者一致） |
| Step 2（新規公開 IF） | N/A（system-spec-update-summary と compliance-check 一致） |
| Issue 運用 | #1016 CLOSED / Refs（両者一致） |
| user-gated 境界 | staging visual / PR を未実行と明記（両者一致） |

## Task 12-6: indexes:rebuild 実行計画

global skill 反映は本サイクルで実施済み。index rebuild は必要に応じて後続の正規 pipeline で実行する。

```bash
mise exec -- pnpm indexes:rebuild   # keywords / topic-map 再生成（冪等確認）
```

> 本サイクルで indexes drift は発生しない（skill 反映なし）。CI `verify-indexes-up-to-date` は本サイクル変更対象外。

## 完了条件

- [ ] strict 7 成果物を `outputs/phase-12/` に生成（compliance-check は既存・不変更）
- [ ] implementation-guide が Part 1 / Part 2 / 視覚証跡を含み heading-only でない
- [ ] root / outputs `artifacts.json` parity OK
- [ ] index.md Phase 表と `artifacts.json.phases` 同値
- [x] compliance-check と無矛盾（implemented_local_runtime_pending / screenshot present / Step 2 = N/A / Issue CLOSED-Refs）
- [x] global skill sync を本サイクルで実施
- [x] `apps/` 配下のコード差分を Phase 12 に反映
