# Phase 12 — ドキュメント更新（strict 7 成果物の close-out）

**[実装区分: 実装仕様書 / implementation_mode: new]**

> Phase 12 実行時に `outputs/phase-12/` 配下へ strict 7 成果物を作成する手順と実行結果を定義する。
> 本タスクは **新規実装仕様書（implementation_mode: new）** として開始し、レビュー前の実装状況は `spec_created` だった。
> Phase 12 レビューで implementation target が明確かつ実装可能と判定したため、同一 cycle で
> `apps/api` / `apps/web` 実コード・テスト・strict 7 を完了し、状態を
> `implemented_local_runtime_pending` へ昇格する。
> `phase12-task-spec-compliance-check.md` を root evidence とする。

---

## 0. Phase 12 着手前チェック（[Feedback 2] / [Feedback 3]）

1. **artifact 名 parity**: `artifacts.json` と `outputs/artifacts.json`、各 `phase-*.md` 記載の artifact 名を
   1 対 1 で突合し、不一致があれば着手前に修正する。
2. **タスク分類の再参照**: Phase 1 で確定した分類 = **VISUAL** を Phase 11 / Phase 12 で再参照する。
   runtime screenshot は user-gated・pending である旨を implementation-guide の `## 視覚証跡` へ反映する。
3. **設計 SSOT の固定**: implementation-guide / system-spec-update を書く前に phase-2.md（backend §2 / frontend §3）の
   識別子（`ResponseSyncPreview` / `previewResponseSync` / `SyncPreviewResultSchema` / `SyncPreviewRunResponseSchema` /
   `manual-sync-backfill-preview` / `canBackfill`）を SSOT として固定し、drift を排除する。

---

## Task 12-1: 実装ガイド作成（`outputs/phase-12/implementation-guide.md`・2 パート構成）

### Part 1（中学生レベル・例え話必須）

- 「なぜ必要か」を先に説明: 全件 backfill は「全部を最初からやり直す」操作で、間違えると大きく書き換わってしまう。
  これまでは「本当に実行しますか?」と聞くだけで、**何件書き換わるか**を先に見せられなかった。
- 例え話（必須）: 「**全部を上書きする前に、『これから何件のノートを書き換えます』と先に黒板に出してから消しゴムを渡す確認画面**」。
  まず「影響件数を確認」ボタンで件数だけ数えて見せ（ノートは触らない＝下書きの確認）、納得したら「全件 backfill」で実行する。
- 「何をするか」: ボタン 3 つ（差分 = 新しい分だけ / **影響件数を確認** = 数えるだけで何も書き換えない / 全件 backfill = 最初から全部やり直す）。
  「影響件数を確認」を押さないと全件 backfill ボタンは押せない（先に件数を見てから実行する仕組み）。
- 専門用語を使う場合は即座に言い換える（例: dry-run = 下書き確認、token = 合言葉、proxy = 受付係）。

### Part 2（技術者レベル）

- **backend 型 / 関数**: `ResponseSyncPreview` 型（`status:"preview"` / `dryRun:true` / `responseCount` / `estimatedWrites` / `pagesScanned` / `capped`・phase-2.md §2.1）。
  `previewResponseSync(env, options): Promise<ResponseSyncPreview>` シグネチャ（phase-2.md §2.2）。read-only 規約（lock / ledger / `processResponse` を呼ばない・D1 write ゼロ）。
- **API**: `POST /admin/sync/responses?dryRun=true&fullSync=true` 分岐（`c.req.query("dryRun")==="true"` で `previewResponseSync` を呼び `{ ok:true, preview }`・例外時 `{ ok:false, error:"preview_failed" }` 500・PII 非露出・phase-2.md §2.3）。`?fullSync` 既存経路は不変。
- **schema / 型（frontend）**: `diagnostics/manual-sync.ts` に `SyncPreviewResultSchema`（`.strict()`）/ `SyncPreviewRunResponseSchema`（`{ ok:true, preview }`）追加。`SyncResultSchema` / `SyncRunResponseSchema` / `SYNC_RESPONSES_PATH` は不変（AC-3）。
- **UI staged flow**: `manual-sync-backfill-preview` ボタン（variant=soft）→ `runPreview()` → `mode="preview"`。`canBackfill = previewResult!==null && mode==="preview"`（staleness gate）。`runBackfill` は confirm 文言へ実数（`全 N 件…推定 M write`）を埋め込み、cancel で early return（AC-4）。
- **エラーハンドリング / エッジ**: preview schema mismatch → `parseError`（`role="alert"`・件数取得不可表示）/ preview HTTP error → 同上 / 差分 sync・backfill 実行で `setPreviewResult(null)` し `canBackfill=false`（preview consume）/ `capped=true` で「上限到達: 一部のみ集計」注記。
- **`## 視覚証跡`**: 「VISUAL タスクだが runtime screenshot は admin 認証必須のため user-gated・pending」と明記し、Phase 11 の screenshot canonical 名（`manual-form-resync-panel-{default,preview-result,backfill-confirm,preview-error}.png`）と「主証跡 = 自動テスト TC-B1..B12 / preview schema / backend contract」を参照する。識別子は phase-2.md SSOT から引用（手書き snippet を避ける）。

---

## Task 12-2: システム仕様書更新（`outputs/phase-12/system-spec-update-summary.md`）

| Step | 内容 |
|------|------|
| Step 1-A | 完了タスク記録（「完了タスク」セクション + 関連ドキュメントリンク + 変更履歴）+ **LOGS.md ×2**（aiworkflow-requirements / task-specification-creator）+ **topic-map** をすべて same-wave 更新 |
| Step 1-B | 実装状況テーブル = **`implemented_local_runtime_pending`**（apps コード・focused tests は完了。runtime screenshot / staging / PR は user-gated）。`spec_created` ではない |
| Step 1-C | 関連タスクテーブル更新（親 Task B `ManualFormResyncPanel` / 参考 `BackfillPublishStatePanel` dry-run パターンとの関係を current facts へ） |
| Step 2 | **更新要（Step2）**: 新規インターフェースを追加するため aiworkflow-requirements の API 系仕様へ preview 契約を反映する — (1) backend `ResponseSyncPreview` 型 + `previewResponseSync` 関数、(2) `POST /admin/sync/responses?dryRun=true` query 分岐（後方互換 opt-in）、(3) `apps/web` UI 側 `SyncPreviewResultSchema` / `SyncPreviewRunResponseSchema` の zod 再宣言。これらを「新規追加された公開経路 / 契約」として system spec へ記録する。既存 `SyncResultSchema` / `?fullSync` は不変のため不退行注記のみ |

> Step 1-A / Step 2 完了後に `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` と
> `node .claude/skills/task-specification-creator/scripts/generate-index.js --workflow docs/30-workflows/issue-1089-backfill-impact-preview --regenerate` を実行し index stale を防ぐ。

---

## Task 12-3: ドキュメント更新履歴（`outputs/phase-12/documentation-changelog.md`）

- 全 Step（1-A / 1-B / 1-C / Step 2）の結果を個別に明記する（「該当なし」も記録）。
- workflow-local 同期と global skill sync を別ブロックで記録する（[Feedback BEFORE-QUIT-003]）。
- `generate-documentation-changelog.js` を利用可。

---

## Task 12-4: 未タスク検出（`outputs/phase-12/unassigned-task-detection.md`・**0 件でも出力必須**）

- ソース: 元タスク（スコープ外）/ Phase 3・10 の MINOR / Phase 11 発見 / TODO・FIXME / `describe.skip` 残存。
- Phase 10 申し送りの将来 UX 改善候補を current/baseline を分離して記録する:
  - 候補-1: preview 件数結果の短時間キャッシュ（Forms API 呼数削減）
  - 候補-2: preview 実行中のキャンセル操作
  - 候補-3: preview レイテンシ実測 baseline（将来 UX）
  いずれも AC 充足に影響しない非 BLOCKER として扱い、起票要否を current/baseline 分離で判定する。
- 「関連タスク差分確認」セクションで既存タスク（親 Task B / `BackfillPublishStatePanel` / 親 workflow）との重複チェックを行い、0 件なら 0 件と明記。
- `detect-unassigned-tasks.js` を実行し、リンク生成時は `verify-unassigned-links.js` で `ALL_LINKS_EXIST` を確認する。

---

## Task 12-5: スキルフィードバックレポート（`outputs/phase-12/skill-feedback-report.md`・**改善点なしでも出力必須**）

- テンプレート改善 / ワークフロー改善 / ドキュメント改善の 3 観点。
- `implementation_mode:new + VISUAL + dry-run 契約追加` の組み合わせで「Phase 11 を VISUAL 宣言しつつ runtime screenshot を user-gated pending とし、backend contract test を主証跡に加える」パターンが機能したかを記録する候補。

---

## Task 12-6: phase12-task-spec-compliance-check（`outputs/phase-12/phase12-task-spec-compliance-check.md`・root evidence）

- Phase 12 実行時に作る成果物。`references/patterns-phase12-sync.md` / 該当テンプレート（canonical 9 見出し）に従って作成する。
- 見出しは template の `## Required Sections` 1..9 を逐語（lowercase 正規化で照合されるため大小・語順を一致させる）。
- Phase 11 evidence テーブルの `status` は `present` / `pending` / `n/a` のみ（runtime screenshot は `pending`・自動テストは `present`）。
- implementation-guide 内の識別子（`ResponseSyncPreview` / `previewResponseSync` / `SyncPreviewResultSchema` / `SyncPreviewRunResponseSchema` / `manual-sync-backfill-preview` / `canBackfill` / `SYNC_RESPONSES_PATH`）を phase-2.md SSOT と一致確認する（identifier drift 防止・[Feedback W1-02b-3]）。

---

## Task 12-7: artifacts parity + index 再生成（close-out 必須ゲート）

- `artifacts.json` と `outputs/artifacts.json` を diff し、`phase12_completed` + `phase13_blocked`（user 未承認）が同値であることを確認する（[UT-W3]）。Gate-A passed / Gate-B,C pending、approver schema（outputs gates）を満たすこと。
- `index.md` の Phase 表 / `artifacts.json` / `outputs/artifacts.json` を同一ターンで更新し phase status の二重化を防ぐ（[Feedback 5]）。
- `generate-index.js`（aiworkflow-requirements / task-specification-creator 両方）を実行する。

## 実行結果（spec 作成時点）

| 成果物 | 状態 |
|---|---|
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present・未タスク 0 件 |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present・root evidence |

---

## 完了条件

- [x] Task 12-1 implementation-guide を Part1（中学生向け例え話「上書き前に件数を黒板に出す確認画面」）+ Part2（`ResponseSyncPreview` 型 / `previewResponseSync` シグネチャ / `?dryRun=true` API / エラーハンドリング）+ `## 視覚証跡`（VISUAL だが runtime user-gated）で作成する指示を定義した
- [x] Task 12-2 system-spec-update を Step1-A（完了記録 / LOGS×2 / topic-map）/ Step1-B（`implemented_local_runtime_pending`）/ Step1-C（関連タスク）/ Step2（preview 契約=新規インターフェース追加のため更新要）で定義した
- [x] Task 12-3 documentation-changelog を全 Step 個別記録 + workflow-local/global 分離で定義した
- [x] Task 12-4 unassigned-task-detection を 0 件でも出力・current/baseline 分離（preview キャッシュ / 中キャンセル / レイテンシ baseline）で定義した
- [x] Task 12-5 skill-feedback-report を改善点なしでも出力で定義した
- [x] Task 12-6 phase12-task-spec-compliance-check を root evidence + canonical 9 見出し + identifier grep 確認で定義した
- [x] artifacts.json / outputs/artifacts.json parity と generate-index.js 再生成を必須ゲートとして明記した
