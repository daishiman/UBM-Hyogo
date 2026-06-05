# Phase 12 — ドキュメント更新（strict 7 成果物の close-out）

**[実装区分: 実装仕様書 / implementation_mode: new]**

> Phase 12 実行時に `outputs/phase-12/` 配下へ strict 7 成果物を作成する手順と実行結果を定義する。
> 本タスクは VISUAL かつ `new`（durationMs は未実装ベースラインから backend + frontend 両輪を 1 サイクルで実装済み）。
> 本 workflow は **implemented_local_evidence_captured**。実コード変更・focused tests・typecheck/lint は完了し、
> runtime screenshot・commit・PR は user-gated。
> 各成果物は durationMs 追加の current contract（実装済み正本）を記述する。

---

## 0. Phase 12 着手前チェック（[Feedback 2] / [Feedback 3]）

1. **artifact 名 parity**: `outputs/artifacts.json` と各 `phase-*.md` 記載の artifact 名を 1 対 1 で突合し、
   不一致があれば着手前に修正する。
2. **タスク分類の再参照**: Phase 1 で確定した分類 = **VISUAL**（結果テーブルに行追加）を Phase 11 / Phase 12 で再参照する。
   runtime screenshot は user-gated・pending である旨を implementation-guide の `## 視覚証跡` へ反映する。
3. **current facts の固定**: implementation-guide / system-spec-update を書く前に
   `ResponseSyncResult` / `runResponseSync` / `SyncResultSchema` / `resultRows` の current 識別子を
   grep 確認し、durationMs 追加箇所（`sync-forms-responses.ts:99-107` と 3 return paths、`manual-sync.ts:3-12`、`ManualFormResyncPanel.client.tsx:34-42`）を固定する。

---

## Task 12-1: 実装ガイド作成（`outputs/phase-12/implementation-guide.md`・2 パート構成）

### Part 1（中学生レベル・例え話必須）

- 「なぜ必要か」を先に説明: 管理者がフォーム回答の再取込ボタンを押したとき、何件取り込んだかは出るが
  「どれくらい時間がかかったか」が分からない。負荷感・進行感がつかめない、を日常の例え（料理の「何分かかったか」が
  分かると次の段取りが立つ）で説明する。
- 「何をするか」: 取込が終わったときに「かかった時間（ミリ秒）」を結果表に 1 行足す。専門用語は即座に言い換える
  （例: durationMs = 取込にかかった時間をミリ秒で表したもの、schema = 受け取ってよいデータの形の決まり）。

### Part 2（技術者レベル）

- **backend producer**: `apps/api/src/jobs/sync-forms-responses.ts` の `ResponseSyncResult` interface に
  `readonly durationMs: number;` を追加。`runResponseSync()` 冒頭（`const now = ...` 直後）で `const startedAt = now().getTime();`
  を記録し、3 つの return（skipped / failed / succeeded）すべてで `durationMs: now().getTime() - startedAt` を返す。
  `now` は注入可能（`options.now`）でテスト決定論的。
- **route**: `apps/api/src/routes/admin/responses-sync.ts` は `runResponseSync()` の result を素通しするため**変更不要**
  （durationMs は自動で `{ ok, result }` に含まれて返る）。
- **frontend schema**: `apps/web/src/features/admin/diagnostics/manual-sync.ts` の `SyncResultSchema` に
  `durationMs: z.number().int().nonnegative().optional()` を追加（`.strict()` 維持）。backend 返却前でも optional のため parse 安全。
- **frontend UI**: `ManualFormResyncPanel.client.tsx` の `resultRows()` に `["durationMs", result.durationMs ?? "-"]` 行を追加。
  欠落時 `-` fallback で既存 `<dt>/<dd>` パターンを踏襲。
- **エラーハンドリング / エッジ**: failed / skipped でも durationMs が返る。schema mismatch（`parseError`）・409 skipped（`parseInProgress`）の既存分岐は不変。
- **設定可能パラメータ**: なし（durationMs は計測値・固定追加）。`onSynced?` callback の payload に durationMs が含まれるようになる。
- **`## 視覚証跡`**: 「VISUAL タスクだが runtime screenshot は admin 認証 + runtime sync 必須のため user-gated・pending」と明記し、
  Phase 11 の screenshot canonical 名（`manual-form-resync-panel-result-with-duration.png`）と「主証跡=自動テスト（panel spec / sync-schemas spec / responses-sync.contract spec）」を参照する。識別子は実コードから grep して引用。

---

## Task 12-2: システム仕様書更新（`outputs/phase-12/system-spec-update-summary.md`）

| Step | 内容 |
|------|------|
| Step 1-A | 完了タスク記録（「完了タスク」セクション + 関連ドキュメントリンク + 変更履歴）+ **LOGS.md ×2**（aiworkflow-requirements / task-specification-creator）+ **topic-map** をすべて same-wave 更新 |
| Step 1-B | 実装状況テーブル = **`implemented_local_evidence_captured`**（実コード・focused tests は完了。runtime screenshot / commit / PR は user-gated） |
| Step 1-C | 関連タスクテーブル更新（親 Task B `task-b-manual-form-resync-admin-ui-spec` / issue #1088 との関係を current facts へ） |
| Step 2 | **更新要**: 新規フィールドが 2 件 — (1) `ResponseSyncResult.durationMs`（`apps/api` 公開戻り値型）、(2) `SyncResult` / `SyncResultSchema` UI schema の `durationMs`（`apps/web` 側 zod 再宣言）。両者を「新規追加された公開フィールド」として system spec へ記録する。endpoint path・認証境界・既存フィールドは不変 |

> Step 1-A / Step 2 完了後に `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` と
> `node .claude/skills/task-specification-creator/scripts/generate-index.js --workflow docs/30-workflows/completed-tasks/issue-1088-manual-form-resync-sync-duration-display --regenerate` を実行し index stale を防ぐ。

---

## Task 12-3: ドキュメント更新履歴（`outputs/phase-12/documentation-changelog.md`）

- 全 Step（1-A / 1-B / 1-C / Step 2）の結果を個別に明記する（「該当なし」も記録）。
- workflow-local 同期と global skill sync を別ブロックで記録する（[Feedback BEFORE-QUIT-003]）。

---

## Task 12-4: 未タスク検出（`outputs/phase-12/unassigned-task-detection.md`・**0 件でも出力必須**）

- ソース: 元 issue（スコープ外）/ Phase 3・10 の MINOR / Phase 11 発見 / TODO・FIXME / `describe.skip` 残存。
- スコープ外として明示済み（writeRate 等 durationMs 以外のメトリクス、D1 migration、`sync/manual.ts:87` のハードコード 0 修正）を current/baseline を分離して記録。AC 充足に影響しない非 BLOCKER として扱う。
- 「関連タスク差分確認」セクションで親 Task B / issue #1088 との重複チェックを行い、0 件なら 0 件と明記。

---

## Task 12-5: スキルフィードバックレポート（`outputs/phase-12/skill-feedback-report.md`・**改善点なしでも出力必須**）

- テンプレート改善 / ワークフロー改善 / ドキュメント改善の 3 観点。
- 「issue 本文の曖昧な producer 記述（sync use-case）を最新コードの正確な実体へ pin する調査ステップ」が
  `new` 実装仕様書で機能したかを記録する候補。

---

## Task 12-6: phase12-task-spec-compliance-check（`outputs/phase-12/phase12-task-spec-compliance-check.md`・root evidence）

- Phase 12 実行時に作る成果物。canonical 9 見出しに従って作成する。
- implementation-guide 内の識別子（`ResponseSyncResult` / `runResponseSync` / `durationMs` / `SyncResultSchema` / `resultRows` / `SYNC_RESPONSES_PATH`）を現行コードで grep 確認する（identifier drift 防止・[Feedback W1-02b-3]）。

---

## Task 12-7: artifacts parity + index 再生成（close-out 必須ゲート）

- `artifacts.json` と `outputs/artifacts.json` を diff し、`implemented_local_evidence_captured` + Gate-A/B passed / Gate-C pending が同値であることを確認する（[UT-W3]）。
- `index.md` の Phase 表 / `artifacts.json` / `outputs/artifacts.json` を同一ターンで更新し phase status の二重化を防ぐ（[Feedback 5]）。
- `generate-index.js`（aiworkflow-requirements / task-specification-creator 両方）を実行する。

## 実行結果（2026-06-03）

| 成果物 | 状態 |
|---|---|
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

---

## 完了条件

- [x] Task 12-1 implementation-guide を Part1（中学生向け例え話）+ Part2（backend producer / schema / UI）+ `## 視覚証跡`（VISUAL だが runtime user-gated）で作成する指示を定義した
- [x] Task 12-2 system-spec-update を Step1-A（完了記録 / LOGS / topic-map）/ Step1-B（`implemented_local_evidence_captured`）/ Step1-C（関連タスク）/ Step2（`ResponseSyncResult.durationMs` + `SyncResult` UI schema `durationMs` 追加）で定義した
- [x] Task 12-3 documentation-changelog を全 Step 個別記録 + workflow-local/global 分離で定義した
- [x] Task 12-4 unassigned-task-detection を 0 件でも出力・current/baseline 分離で定義した
- [x] Task 12-5 skill-feedback-report を改善点なしでも出力で定義した
- [x] Task 12-6 phase12-task-spec-compliance-check を root evidence + identifier grep 確認で定義した
- [x] artifacts.json / outputs/artifacts.json parity と generate-index.js 実行を必須ゲートとして明記した
