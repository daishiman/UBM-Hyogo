# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_visual_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

implementation guide / system spec sync / 未タスク検出 / skill feedback / compliance を完了する（6 成果物 + `main.md` の strict 7 必須）。
apps/web 実装は本サイクルで完了済み。`outputs/phase-12/` の strict 7 は実測 evidence と正本同期結果で更新済みとする。

## 必須成果物（`outputs/phase-12/`）

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `implementation-guide.md` | Part 1（中学生レベル例え話）+ Part 2（状態機械 / API 契約 / component props / error code）+ 視覚証跡 |
| 2 | `system-spec-update-summary.md` | Step 1-A/1-B/1-C + Step 2 判定（新規 endpoint 無し） |
| 3 | `documentation-changelog.md` | Step 1-A/1-B/1-C + Step 2 を個別記録 |
| 4 | `unassigned-task-detection.md` | 0 件でも出力。current/baseline 分離。Phase 10 MINOR があれば未タスク化 |
| 5 | `skill-feedback-report.md` | 改善点なしでも出力 |
| 6 | `phase12-task-spec-compliance-check.md` | root evidence |

> この 6 ファイルに `main.md` を加えた strict 7 を `outputs/phase-12/` に物理生成済み。実装完了後 evidence で更新済み。

## Task 1: implementation-guide（2 パート）

- **Part 1（中学生レベル）**: 「会員カードのタグ欄に『新しいシールをその場で作るボタン』を付ける。今までは別の管理ページに行かないと作れなかったタグを、会員カードを開いたまま名前を打って作り、そのまま貼れるようにする。同じ名前のシールが既にあったら、新しく作らず元のシールを選んだ状態にする」。
- **Part 2（技術者）**:
  - 状態機械: inline-create form の `idle → editing → submitting → success / conflict / error` 遷移。
  - API 契約: 既存 tag create endpoint と member tag assign endpoint のシグネチャ（新規 endpoint 無し）。409 conflict 応答 → 既存 tag 解決 → assign の回収フロー。
  - component props: 新規 `MemberTagInlineCreate.tsx` の props（onCreated / existing tag 集合 / member 識別子等）と `MemberDrawer.tsx` 側の配線。
  - error code: 409（既存 tag conflict 回収）/ validation error（空名・不正名）。
  - 識別子は実コードから grep 引用する（手書き snippet 回避）。
- **視覚証跡**: Phase 11 の `member-tag-inline-create-form-desktop.png` / `member-tag-inline-create-form-mobile.png` を参照（staging user-gated のため保留明記）。409 conflict は component test C-T5 を主証跡にする。

## Task 2: system spec update

| Step | 内容 |
| --- | --- |
| 1-A | 完了タスク記録 + LOGS.md（aiworkflow-requirements / task-specification-creator 両 LOGS）+ topic-map |
| 1-B | 実装状況テーブル: `implemented_local_visual_pending`（staging visual / commit / push / PR は user-gated） |
| 1-C | 関連タスクテーブル更新（#1068 / #982 編集 UI / tag master endpoints のステータス） |
| Step 2 | **該当なし**: 新規 endpoint 無し（apps/api 変更 0）。`01-api-schema.md` 更新不要。admin tag UI 境界が aiworkflow-requirements の既存記述で充足するかのみ同期判定し、変更不要なら「同期不要」と記録 |

- `apps/api` 変更なしのため API schema 更新は **該当なし** を明記する。
- aiworkflow-requirements の admin tag UI 境界記述に変更が必要な場合のみ `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を実行（index stale 防止）。変更不要なら実行不要を記録。

## Task 4: 未タスク検出

- current（今回サイクル内で完了すべき未タスク）と baseline（将来検討候補）を分離して記録する。先送り 0 件が原則（CONST_007）。
- Phase 10 の scope 外候補（inline-create からの拡張属性編集 / bulk inline-create / master 画面側導線）を baseline として記録。
- Phase 10 に MINOR 指摘がある場合は理由・実施場所・時期を付して未タスク化する。
- 関連タスク差分確認: #982（既存 drawer pill 編集）と重複しないことを明記する。

## Task 5: skill feedback

- テンプレート / ワークフロー改善点を記録（改善点なしでも出力）。例: 「CLOSED issue（#1068）を最新コードへ最適化してから spec 化する」フローの定型化。

## artifacts / mirror parity

- `artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する。root が編集正本、outputs 側は Phase evidence mirror として同値維持する。
- `.claude` 正本 → `.agents` mirror parity を `diff -qr .claude/skills .agents/skills` で確認する。

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- `outputs/phase-12/` の 6 ファイル + `main.md`（strict 7）

## 参照資料

- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- strict 7 成果物すべて存在
- Step 1-A/1-B/1-C 記録 + Step 2 が「該当なし（apps/api 変更 0 / 新規 endpoint 無し）」と判定記録
- 未タスク検出が current/baseline 分離で記録
- `artifacts.json` parity OK / `.claude` → `.agents` mirror parity OK
