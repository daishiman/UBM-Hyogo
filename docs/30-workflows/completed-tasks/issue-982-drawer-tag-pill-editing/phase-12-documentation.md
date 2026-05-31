# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`


## 目的

implementation guide / system spec sync / 未タスク検出 / skill feedback / compliance を完了する（6 成果物必須）。

## 必須成果物（`outputs/phase-12/`）

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `implementation-guide.md` | Part 1（中学生レベル例え話）+ Part 2（型/API/コード例）+ 視覚証跡 |
| 2 | `system-spec-update-summary.md` | Step 1-A/1-B/1-C + Step 2 判定 |
| 3 | `documentation-changelog.md` | 全 Step 結果（workflow-local / global skill sync を別ブロック） |
| 4 | `unassigned-task-detection.md` | 0 件でも出力。Phase 10 MINOR 候補を記録 |
| 5 | `skill-feedback-report.md` | 改善点なしでも出力 |
| 6 | `phase12-task-spec-compliance-check.md` | root evidence |

> 本仕様書作成 close-out では、この 6 ファイルに `main.md` を加えた strict 7 を物理生成する。実装完了後の Phase 12 では同じファイルを実測 evidence で更新する。

## Task 1: implementation-guide（2 パート）

- **Part 1（中学生レベル）**: 「会員カードに『興味タグ』のシールを貼ったり剥がしたりできるようにする。今までは見えるだけで貼れなかったシールを、係の人（管理者）が直接貼り外しできるようにし、誰がいつ貼ったかメモ（audit）も残す」。
- **Part 2（技術者）**: `MemberTagsResponse` 型、3 endpoint シグネチャ、`member_tags` schema、audit action、`useAdminMutation` 楽観更新、`Idempotency-Key`、409/404 分岐。識別子は実コードから grep 引用（手書き snippet 回避 / W1-02b-3）。
- **視覚証跡**: Phase 11 の `member-drawer-tag-edit.png` 参照（user-gated 時は保留明記）。

## Task 2: system spec update

| Step | 内容 |
| --- | --- |
| 1-A | 完了タスク記録 + LOGS.md ×2 + topic-map（aiworkflow-requirements / task-specification-creator 両 LOGS） |
| 1-B | 実装状況テーブル: `implemented_local_runtime_pending`（staging visual / commit / push / PR は user-gated） |
| 1-C | 関連タスクテーブル更新（#982 / #981 / #983 のステータス） |
| Step 2 | **更新要**: 新規 endpoint 3 本 + invariant #13 再定義 → `01-api-schema.md` + aiworkflow-requirements `api-*.md` 更新 |

- Step 2 で `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を実行（index stale 防止）。

## Task 4: 未タスク検出

- Phase 10 scope 外候補（master pagination / bulk assign / #981 data source 共有）を「今回サイクル内で完了すべき未タスク」から分離して記録。
- 関連タスク差分確認: #981（list enrichment）/ #983（photo avatar）と重複しないことを明記。
- 本タスク内で完了すべき項目を未タスクへ逃がさない（CONST_007）。先送り 0 件が原則。

## Task 5: skill feedback

- テンプレート/ワークフロー改善点（例: 「CLOSED issue を最新コードへ最適化してから spec 化する」フローの定型化）を記録。

## artifacts parity

- `artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する。root が編集正本、outputs 側は Phase evidence mirror として同値維持する。

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- `outputs/phase-12/` の 6 ファイル

## 参照資料

- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- 6 成果物すべて存在
- Step 1-A/1-B/1-C + Step 2 判定が記録
- 未タスク検出が `current`/`baseline` 分離で記録
- `artifacts.json` parity OK
