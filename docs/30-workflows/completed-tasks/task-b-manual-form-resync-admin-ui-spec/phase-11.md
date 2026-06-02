# Phase 11 — 手動テスト（VISUAL・runtime screenshot は user-gated / pending）

**[実装区分: 実装仕様書 / implementation_mode: verify_existing]**

> **タスク種別宣言: VISUAL（admin パネル UI 追加）。** Phase 1 で確定した分類を踏襲する。
> ただし `/admin/sync-status` は **admin session 必須**のため runtime screenshot の実 capture は
> **user-gated / pending**。本 Phase は 3 層評価（Semantic / Visual / AI UX）のうち
> Visual を pending とし、Semantic / AI UX は自動テスト（TC-B1..B8 / TC-S1..S7）とコードで担保する。
> [Feedback 3]（UI/docs-only 判定）を踏まえ Phase 1 分類 = VISUAL を再参照済み。

---

## 1. VISUAL 宣言と screenshot pending の理由（[Feedback 4] / [Feedback W1-02b-1]）

| 項目 | 内容 |
|------|------|
| タスク種別 | **VISUAL**（`ManualFormResyncPanel` の admin パネルが UI として描画される） |
| `screenshot-plan.json` の `mode` | `"VISUAL"` を宣言する（NON_VISUAL にしない） |
| 実 capture 状態 | **user-gated / pending** |
| capture しない理由（必須明記） | `/admin/sync-status` は admin session が無いとアクセスできず、認証フローの実行・seed は user-gated。Claude Code はシークレット投入・実ブラウザ認証を勝手に行わない（CONST_002） |
| 証跡の主ソース（必須明記） | 自動テスト = `ManualFormResyncPanel.spec.tsx`（TC-B1..B8・8 件）+ `sync-schemas.spec.ts`（TC-S1..S7・7 件 + co-located `BackfillResultSchema` TC-B1..B4・4 件） |

> `outputs/phase-11/` に作る `manual-test-result.md` のメタ情報には、上記「証跡の主ソース（自動テスト名 / 件数）」と
> 「runtime screenshot を今 capture しない理由 = 認証必須・user-gated」を**必ず**明記する（空メタ禁止）。

---

## 2. 3 層評価の割り当て

| 層 | 状態 | 担保手段 |
|----|------|---------|
| **Semantic**（意味・契約） | **PASS（自動テストで担保）** | `SyncRunResponseSchema` / `SyncResultSchema` の zod 受理・reject（TC-S1..S7）。409 `result.status==="skipped"` の検知（TC-B5）。schema mismatch 時の `parseError`（TC-B7） |
| **Visual**（見た目） | **pending（user-gated）** | screenshot は user 承認後に capture。代替として DOM 構造（`<dl>` 結果テーブル / `role="alert"` / `role="status"`）をテストで検証済み |
| **AI UX**（操作体験） | **PASS（コード + テストで担保）** | 差分 = 既定操作（variant=primary）/ 全件 = 危険操作（variant=danger + confirm）。pending 中 disabled。二重起動防止。confirm キャンセルで実行しない（TC-B3） |

---

## 3. 自動テスト証跡（主ソース・全 pass 済み）

### 3.1 パネル test — `ManualFormResyncPanel.spec.tsx`

| TC | 観点 | AC 対応 |
|----|------|---------|
| TC-B1 | 差分 sync 実行 → writeCount / 差分モード表示 | AC-B1 / AC-B2 |
| TC-B2 | 全件 backfill は confirm 承認後に実行 | AC-B2 |
| TC-B3 | confirm キャンセル時は backfill を実行しない | AC-B2（安全側） |
| TC-B4 | pending 中は両ボタンが disabled | AC-B3 |
| TC-B5 | 409 sync_in_progress を検知し結果テーブルを描画しない | AC-B3 |
| TC-B6 | HTTP error 時はテーブル非描画 + error 文言表示 | AC-B1（異常系） |
| TC-B7 | schema mismatch 時は parseError 表示 + テーブル非描画 | AC-B1（契約逸脱保護） |
| TC-B8 | 差分成功時に `onSynced` を検証済み結果で呼ぶ | AC-B1（連携契約） |

### 3.2 schema test — `sync-schemas.spec.ts`

| TC | 観点 |
|----|------|
| TC-S1 | 200 result（`SyncResultSchema`）受理 |
| TC-S2 | 200 wrapper `{ ok, result }` の result 枝で parse |
| TC-S3 | 409 wrapper `{ ok:false, result:skipped }` を parse |
| TC-S4 | status enum — `running` は reject（`SyncResult` から除外） |
| TC-S5 | 負数 — `writeCount:-1` 等 nonnegative 違反 reject |
| TC-S6 | `skippedReason` optional — 欠落でも success |
| TC-S7 | `ok:false` + non-skipped result は reject |
| （co-located）TC-B1..B4 | `BackfillResultSchema`（Task A 隣接）valid/policy/負数/skipped 欠落 |

> 実行（targeted・リポジトリルートから）:
> ```
> mise exec -- pnpm vitest run \
>   apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx \
>   apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts
> ```

---

## 4. 既知の制限（runtime / 環境）

| 項目 | 内容 |
|------|------|
| runtime screenshot | admin 認証必須のため未取得（user-gated）。承認後に `差分 sync 押下前 / 結果表示後 / 全件 backfill confirm 表示 / 409 inProgress 表示` の 4 状態を canonical 名で capture することを推奨 |
| `SYNC_ADMIN_TOKEN` | 実値未投入時は proxy が `500 sync_admin_token_missing`。end-to-end の実 sync 実行も user-gated |

---

## 5. screenshot canonical 名（capture 時の正本・[FB-LLM-MOD-05-001] / [FB-VISUAL-CAP-001]）

> 実 capture を user 承認後に行う場合、`screenshot-plan.json` / capture script / `phase11-capture-metadata.json` /
> Phase 12 `implementation-guide.md` の 4 か所で以下 canonical 名を一致させる（TC 番号は metadata の `tc` フィールドのみ）。

| canonical 名 | 状態 |
|-------------|------|
| `manual-form-resync-panel-idle.png` | 初期表示（差分 / 全件ボタン） |
| `manual-form-resync-panel-result.png` | 差分 sync 成功後の結果テーブル |
| `manual-form-resync-panel-confirm.png` | 全件 backfill confirm ダイアログ |
| `manual-form-resync-panel-inprogress.png` | 409 他 sync 実行中の `role="status"` 表示 |

---

## 完了条件

- [x] タスク種別 = VISUAL を宣言し、runtime screenshot が user-gated / pending である理由を明記した
- [x] `screenshot-plan.json` の `mode=VISUAL` 宣言と、実 capture が user-gated である方針を記述した
- [x] 証跡の主ソース（自動テスト名 TC-B1..B8 / TC-S1..S7・件数）を `manual-test-result.md` メタへ記録する指示を置いた
- [x] 3 層評価（Semantic / Visual / AI UX）で Visual=pending、Semantic / AI UX=test・コード担保と区別した
- [x] 自動テスト証跡（全 pass）を主ソースとして記録した
- [x] 既知の制限（runtime / token 未投入）と screenshot canonical 名を明記した
