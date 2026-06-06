# Phase 11 — 手動テスト（VISUAL・runtime screenshot は user-gated / pending）

**[実装区分: 実装仕様書 / implementation_mode: new]**

> **タスク種別宣言: VISUAL（admin パネルに dry-run preview ボタン + 影響件数表示を追加）。** Phase 1 で確定した分類を踏襲する。
> ただし `/admin/sync-status` は **admin session 必須**のため runtime screenshot の実 capture は
> runtime capture は **user-gated / pending**。本 Phase は 3 層評価（Semantic / Visual / AI UX）のうち
> Visual を static UI contract PNG で present、authenticated runtime を pending とし、
> Semantic / AI UX は自動テスト（TC-B1..B12 / preview schema）で担保する。
> [Feedback 3]（UI/docs-only 判定）を踏まえ Phase 1 分類 = VISUAL を再参照済み。

---

## 1. VISUAL 宣言と screenshot pending の理由（[Feedback 4] / [Feedback W1-02b-1]）

| 項目 | 内容 |
|------|------|
| タスク種別 | **VISUAL**（`ManualFormResyncPanel` に preview ボタン・件数表示・confirm 文言の実数埋め込みが UI として描画される） |
| `screenshot-plan.json` の `mode` | `"VISUAL"` を宣言する（NON_VISUAL にしない）。[Feedback W1-02b-1] screenshot-plan は VISUAL |
| `visualEvidence` | `VISUAL_ON_EXECUTION`（設計上 capture 計画は確定・実描画は user 承認後の runtime で取得） |
| 実 capture 状態 | **static UI contract present / authenticated runtime pending** |
| capture しない理由（必須明記） | `/admin/sync-status` は admin session が無いとアクセスできず、認証フローの実行・seed・`SYNC_ADMIN_TOKEN` 投入は user-gated。Claude Code はシークレット投入・実ブラウザ認証を勝手に行わない（CONST_002） |
| 証跡の主ソース（必須明記） | 自動テスト = `ManualFormResyncPanel.spec.tsx`（TC-B1..B12）+ `sync-schemas.spec.ts`（preview schema 正常/異常）+ backend contract（`previewResponseSync` count/no-write/capped・route `?dryRun=true` 分岐）+ static UI contract（DOM 構造） |

> `outputs/phase-11/` に作る `manual-test-result.md` のメタ情報には、上記「証跡の主ソース（自動テスト名 / 件数）」と
> 「runtime screenshot を今 capture しない理由 = 認証必須・user-gated」を**必ず**明記する（空メタ禁止）。

---

## 2. 3 層評価の割り当て

| 層 | 状態 | 担保手段 |
|----|------|---------|
| **Semantic**（意味・契約） | **PASS（自動テストで担保）** | `SyncPreviewRunResponseSchema` / `SyncPreviewResultSchema` の zod 受理・reject（preview schema test）。`SyncResultSchema` の不退行（既存 TC-S 系）。preview 失敗時の `parseError`（schema mismatch / HTTP error）。backend `previewResponseSync` が D1 write ゼロ・件数のみ返す（contract test） |
| **Visual**（見た目） | **PASS（static UI contract present / runtime pending）** | `outputs/phase-11/` に 4 状態 PNG を保存済み。authenticated runtime screenshot は user 承認後に capture |
| **AI UX**（操作体験） | **PASS（コード + テストで担保）** | preview（variant=soft）→ 件数提示 → 全件 backfill（variant=danger）の staged 2 段。preview 成功後のみ backfill enable（`canBackfill`）。confirm 文言に実数埋め込み。confirm キャンセルで不実行（AC-4）。差分 sync 実行で preview 無効化（staleness gate） |

---

## 3. 自動テスト証跡（主ソース・実装サイクルで全 pass にする対象）

### 3.1 パネル test — `ManualFormResyncPanel.spec.tsx`

| TC | 観点 | AC 対応 |
|----|------|---------|
| TC-B1 | 差分 sync 実行 → writeCount / 差分モード表示（既存・不変） | AC-3 |
| TC-B2 | 全件 backfill は **preview → confirm 承認後**に実行（staged 化・更新理由を test コメントへ記録） | AC-1 / AC-5 |
| TC-B3 | confirm キャンセル時は backfill を実行しない（既存・不変） | AC-4 |
| TC-B4 | pending 中は全ボタンが disabled（既存 + preview ボタン追加） | AC-3 |
| TC-B5 | 409 sync_in_progress を検知し結果テーブルを描画しない（既存・不変） | AC-3 |
| TC-B6 | HTTP error 時はテーブル非描画 + error 文言表示（既存・不変） | AC-3 |
| TC-B7 | schema mismatch 時は parseError 表示 + テーブル非描画（既存・不変） | AC-3 |
| TC-B8 | 差分成功時に `onSynced` を検証済み結果で呼ぶ（既存・不変） | AC-3 |
| TC-B9 | preview 成功 → `responseCount` / `estimatedWrites`（推定ラベル）/ `pagesScanned` 表示・backfill ボタン enable | AC-1 / AC-2 |
| TC-B10 | preview 成功後の confirm 文言に実数（`全 N 件…推定 M write`）が埋め込まれる | AC-1 / AC-2 |
| TC-B11 | preview 失敗（schema mismatch / HTTP error）時は `parseError`（role=alert）で件数取得不可を表示し backfill ボタン disabled | AC-1 |
| TC-B12 | preview 後に差分 sync を実行すると `canBackfill=false` になり backfill ボタンが再び disabled（staleness gate） | AC-1（安全側） |

### 3.2 schema test — `sync-schemas.spec.ts`（preview 追加分）

| TC | 観点 |
|----|------|
| preview-1 | `{ ok:true, preview:{ status:"preview", dryRun:true, responseCount, estimatedWrites, pagesScanned, capped } }` を受理 |
| preview-2 | `status` が `"preview"` 以外 / `dryRun` が `true` 以外は reject |
| preview-3 | 負数（`responseCount:-1` 等 nonnegative 違反）は reject |
| preview-4 | 余剰キー（`.strict()` 違反）は reject |
| preview-5 | `SyncResultSchema` / `SyncRunResponseSchema` が preview 追加で退化していない（既存ケース再 green） |

### 3.3 backend contract test

| ファイル | 観点 |
|---------|------|
| `sync-forms-responses.contract.spec.ts` | `previewResponseSync` が listResponses をページングして `responseCount` を実集計 / D1 write ゼロ（`processResponse` 未呼出）/ lock・ledger 未変更 / `safetyCounter>100` で `capped=true` 打ち切り / `responseEmail` 無し response を数えない |
| `responses-sync.contract.spec.ts` | `?dryRun=true` 分岐が `{ ok:true, preview }`（200）を返す / 例外時 `{ ok:false, error:"preview_failed" }`（500・PII 非露出）/ `?dryRun` 無し既存経路が不退行 |

> 実行（targeted・リポジトリルートから・[FB-UI-02-2] 全件 SIGKILL 回避）:
> ```
> mise exec -- pnpm vitest run \
>   apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx \
>   apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts
> # backend は D1 必須環境で:
> mise exec -- pnpm vitest run \
>   apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
>   apps/api/src/routes/admin/responses-sync.contract.spec.ts
> ```

---

## 4. screenshot canonical 名（capture 時の正本・[FB-LLM-MOD-05-001] `<component>-<state>.png`）

> 実 capture を user 承認後に行う場合、`screenshot-plan.json` / capture script / `phase11-capture-metadata.json` /
> Phase 12 `implementation-guide.md` の 4 か所で以下 canonical 名を一致させる（TC 番号は metadata の `tc` フィールドのみ）。

| canonical 名 | 状態 | 確認観点 |
|-------------|------|---------|
| `manual-form-resync-panel-default.png` | 初期表示（差分 sync / 影響件数を確認 / 全件 backfill の 3 ボタン・backfill は disabled） | preview 前は backfill ボタンが `canBackfill=false` で disabled であること |
| `manual-form-resync-panel-preview-result.png` | 影響件数を確認 成功後の件数パネル | `responseCount`（実数）/ `estimatedWrites`（「推定」ラベル）/ `pagesScanned` / `capped` 注記の表示、backfill ボタンが enable |
| `manual-form-resync-panel-backfill-confirm.png` | 全件 backfill の confirm ダイアログ | confirm 文言に実数（`全 N 件…推定 M write`）が埋め込まれていること |
| `manual-form-resync-panel-preview-error.png` | 件数取得不可（preview 失敗・`role="alert"`） | 件数取得不可の明示、backfill ボタンが disabled のままであること |

---

## 5. capture script 規約（[FB-MSO-003] / 証跡汚染防止）

| 項目 | 内容 |
|------|------|
| browser / server クローズ | capture script は `try/finally` で browser・dev server を必ず close（[FB-MSO-003]）。例外時もリソースリークさせない |
| evidence dir 固定 | `PLAYWRIGHT_EVIDENCE_DIR=docs/30-workflows/issue-1089-backfill-impact-preview/outputs/phase-11/evidence` を明示指定する。未指定だと他 workflow の既定 evidence dir を上書き汚染するため必須（generic staging visual の証跡汚染防止） |
| 認証 | admin storage-state（既存 mint 手順）を流用。`SYNC_ADMIN_TOKEN` 実値投入は user-gated のため、未投入時は preview / backfill が proxy で 500 になる点を metadata に記録 |

---

## 6. 既知の制限（runtime / 環境）

| 項目 | 内容 |
|------|------|
| runtime screenshot | admin 認証必須のため未取得（user-gated）。承認後に §4 の 4 状態を canonical 名で capture することを推奨 |
| `SYNC_ADMIN_TOKEN` | 実値未投入時は proxy が `500`。preview（`?dryRun=true`）も同 proxy 経由のため end-to-end の実 preview / 実 backfill も user-gated |

---

## 完了条件

- [x] タスク種別 = VISUAL（`mode:"VISUAL"` / `visualEvidence:VISUAL_ON_EXECUTION`）を宣言し、runtime screenshot が user-gated / pending である理由を明記した
- [x] 証跡の主ソース（自動テスト名 TC-B1..B12 / preview schema / backend contract・件数）を `manual-test-result.md` メタへ記録する指示を置いた
- [x] 3 層評価（Semantic / Visual / AI UX）で Visual=static present / runtime pending、Semantic / AI UX=test・コード担保と区別した
- [x] 自動テスト証跡（パネル TC-B1..B12 / schema preview / backend contract）を主ソースとして記録した
- [x] screenshot canonical 名（`<component>-<state>.png` 4 状態）と各 state の確認観点を明記した
- [x] capture script の try/finally close と `PLAYWRIGHT_EVIDENCE_DIR` 固定（証跡汚染防止）を明記した
- [x] 既知の制限（runtime / token 未投入）を明記した
