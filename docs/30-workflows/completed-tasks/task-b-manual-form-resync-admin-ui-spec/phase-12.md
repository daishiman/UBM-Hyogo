# Phase 12 — ドキュメント更新（strict 7 成果物の close-out）

**[実装区分: 実装仕様書 / implementation_mode: verify_existing]**

> Phase 12 実行時に `outputs/phase-12/` 配下へ strict 7 成果物を作成する手順と実行結果を定義する。
> 本 cycle で成果物の実体も配置済みであり、`phase12-task-spec-compliance-check.md` を root evidence とする。
> 本タスクは VISUAL かつ `verify_existing`（landed in `745c95115` / #1064）。apps コードは
> dev に landed 済みで apps/packages 差分はゼロ（docs/skill 正本同期のみ）である点を前提に各成果物を記述する。

---

## 0. Phase 12 着手前チェック（[Feedback 2] / [Feedback 3]）

1. **artifact 名 parity**: `outputs/artifacts.json` と各 `phase-*.md` 記載の artifact 名を 1 対 1 で突合し、
   不一致があれば着手前に修正する。
2. **タスク分類の再参照**: Phase 1 で確定した分類 = **VISUAL** を Phase 11 / Phase 12 で再参照する。
   runtime screenshot は user-gated・pending である旨を implementation-guide の `## 視覚証跡` へ反映する。
3. **current facts の固定**: implementation-guide / system-spec-update を書く前に
   `ManualFormResyncPanel.client.tsx` / `manual-sync.ts` / `route.ts` / `env.ts` の current 識別子を
   grep 確認し、旧方針の混入（drift D1..D9）を排除する。

---

## Task 12-1: 実装ガイド作成（`outputs/phase-12/implementation-guide.md`・2 パート構成）

### Part 1（中学生レベル・例え話必須）

- 「なぜ必要か」を先に説明: 入会フォームの回答が届いても、サイトに自動で出ない場合がある。管理者が
  「もう一度取り込みボタン」を押せる窓口がこれまで無かった、を日常の例え（郵便受けから手紙を居間へ運ぶ）で説明する。
- 「何をするか」: ボタン 2 つ（差分 = 新しい分だけ / 全件 = 最初から全部やり直し）と、結果（何件取り込んだか）の表示。
- 専門用語を使う場合は即座に言い換える（例: token = 合言葉、proxy = 受付係）。

### Part 2（技術者レベル）

- **schema / 型**: `diagnostics/manual-sync.ts` の `SyncResultSchema`（`status / jobId / processedCount / writeCount / cursor / skippedReason?`・`.strict()`）、`SyncRunResponseSchema`（200 = `{ ok:true, result }` / 409 = `{ ok:false, result.status==="skipped" }` を `.refine()` で強制）、定数 `SYNC_RESPONSES_PATH`。
- **proxy（mutation API）**: `app/api/admin/[...path]/route.ts` の `needsSyncAdminBearer`（`path[0]==="sync"` かつ `path[1] ∈ {schema, responses, backfill-publish-state, diagnostics}`）が `SYNC_ADMIN_TOKEN` を server-only に Bearer 注入。未設定時 `500 sync_admin_token_missing`。
- **mutation**: `useAdminMutation`（POST 非冪等 overload・`timeoutMs:60000`・`refreshOnSuccess:false`）を run / backfill の 2 インスタンス。差分=`?fullSync=false` / 全件=`?fullSync=true`。
- **エラーハンドリング / エッジ**: 409 → `parseInProgress` で `role="status"`、schema mismatch → `parseError` で `role="alert"` + テーブル非描画、HTTP error → error 文言。confirm キャンセルで backfill 中止。
- **設定可能パラメータ**: `SYNC_ADMIN_TOKEN`（env optional）、`timeoutMs`、`onSynced?` callback。
- **`## 視覚証跡`**: 「VISUAL タスクだが runtime screenshot は admin 認証必須のため user-gated・pending」と明記し、Phase 11 の screenshot canonical 名（`manual-form-resync-panel-{idle,result,confirm,inprogress}.png`）と「主証跡=自動テスト TC-B1..B8 / TC-S1..S7」を参照する。識別子は実コードから grep して引用（手書き snippet を避ける）。

---

## Task 12-2: システム仕様書更新（`outputs/phase-12/system-spec-update-summary.md`）

| Step | 内容 |
|------|------|
| Step 1-A | 完了タスク記録（「完了タスク」セクション + 関連ドキュメントリンク + 変更履歴）+ **LOGS.md ×2**（aiworkflow-requirements / task-specification-creator）+ **topic-map** をすべて same-wave 更新 |
| Step 1-B | 実装状況テーブル = **`completed`（landed in `745c95115` / #1064）**。`spec_created` ではなく landed 済みとして記録 |
| Step 1-C | 関連タスクテーブル更新（Task A `BackfillPublishStatePanel` 隣接 / Task C SLA / Task D 外部リンク との関係を current facts へ） |
| Step 2 | **更新要**: 新規インターフェースが 2 件ある — (1) `SYNC_ADMIN_TOKEN` env（`env.ts` optional・`getAuthEnv()` 経由）、(2) `SyncResult` / `SyncRunResponse` UI schema（`apps/web` 側 zod 再宣言）。両者を「新規追加された公開経路 / 設定値」として system spec へ記録する。`apps/api` の endpoint・型は不変のため backend 側 spec 変更はなし |

> Step 1-A / Step 2 完了後に `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` と
> `node .claude/skills/task-specification-creator/scripts/generate-index.js --workflow docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec --regenerate` を実行し index stale を防ぐ。

---

## Task 12-3: ドキュメント更新履歴（`outputs/phase-12/documentation-changelog.md`）

- 全 Step（1-A / 1-B / 1-C / Step 2）の結果を個別に明記する（「該当なし」も記録）。
- workflow-local 同期と global skill sync を別ブロックで記録する（[Feedback BEFORE-QUIT-003]）。
- `generate-documentation-changelog.js` を利用可。

---

## Task 12-4: 未タスク検出（`outputs/phase-12/unassigned-task-detection.md`・**0 件でも出力必須**）

- ソース: 元タスク（スコープ外）/ Phase 3・10 の MINOR / Phase 11 発見 / TODO・FIXME / `describe.skip` 残存。
- Phase 10 申し送りの将来 UI 改善候補（durationMs 可視化 / backfill 影響件数プレビュー）を current/baseline を分離して記録。AC 充足に影響しない非 BLOCKER として扱う。
- 「関連タスク差分確認」セクションで既存タスク（Task A/C/D・親 workflow）との重複チェックを行い、0 件なら 0 件と明記。
- `detect-unassigned-tasks.js` を実行し、リンク生成時は `verify-unassigned-links.js` で `ALL_LINKS_EXIST` を確認する。

---

## Task 12-5: スキルフィードバックレポート（`outputs/phase-12/skill-feedback-report.md`・**改善点なしでも出力必須**）

- テンプレート改善 / ワークフロー改善 / ドキュメント改善の 3 観点。
- `verify_existing + VISUAL + 認証必須 route` の組み合わせで「Phase 11 を VISUAL 宣言しつつ runtime screenshot を user-gated pending とする」パターンが機能したかを記録する候補。

---

## Task 12-6: phase12-task-spec-compliance-check（`outputs/phase-12/phase12-task-spec-compliance-check.md`・root evidence）

- Phase 12 実行時に作る成果物。`references/patterns-phase12-sync.md` / 該当テンプレート（canonical 9 見出し）に従って作成する。
- implementation-guide 内の識別子（`ManualFormResyncPanel` / `runSync` / `runBackfill` / `parseInProgress` / `SYNC_RESPONSES_PATH` / `needsSyncAdminBearer` / `applyResponse`）を現行コードで grep 確認する（identifier drift 防止・[Feedback W1-02b-3]）。

---

## Task 12-7: artifacts parity + index 再生成（close-out 必須ゲート）

- `artifacts.json` と `outputs/artifacts.json` を diff し、`phase12_completed` + `phase13_blocked`（user 未承認）が同値であることを確認する（[UT-W3]）。
- `index.md` の Phase 表 / `artifacts.json` / `outputs/artifacts.json` を同一ターンで更新し phase status の二重化を防ぐ（[Feedback 5]）。
- `generate-index.js`（aiworkflow-requirements / task-specification-creator 両方）を実行する。

## 実行結果（2026-06-01）

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

- [x] Task 12-1 implementation-guide を Part1（中学生向け例え話）+ Part2（schema / proxy / mutation API）+ `## 視覚証跡`（VISUAL だが runtime user-gated）で作成する指示を定義した
- [x] Task 12-2 system-spec-update を Step1-A（完了記録 / LOGS×2 / topic-map）/ Step1-B（`implemented_local_evidence_captured`・landed）/ Step1-C（関連タスク）/ Step2（`SYNC_ADMIN_TOKEN` env + `SyncResult` UI schema 追加）で定義した
- [x] Task 12-3 documentation-changelog を全 Step 個別記録 + workflow-local/global 分離で定義した
- [x] Task 12-4 unassigned-task-detection を 0 件でも出力・current/baseline 分離で定義した
- [x] Task 12-5 skill-feedback-report を改善点なしでも出力で定義した
- [x] Task 12-6 phase12-task-spec-compliance-check を root evidence + identifier grep 確認で定義した
- [x] artifacts.json / outputs/artifacts.json parity と generate-index.js 実行を必須ゲートとして明記した
