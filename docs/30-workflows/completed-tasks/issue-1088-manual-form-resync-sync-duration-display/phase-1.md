# Phase 1 — 要件定義

**[実装区分: 実装仕様書 / implementation_mode: new]**

## 1. メタ情報

| 項目 | 値 |
|------|----|
| Workflow ID | `issue-1088-manual-form-resync-sync-duration-display` |
| GitHub Issue | #1088 |
| 親タスク | Task B（手動 Google Form 再取込 管理UI）の follow-up |
| タスク分類 | UI task（管理パネル結果テーブルに表示行追加）+ backend producer 追加 |
| 視覚分類 | VISUAL（`ManualFormResyncPanel` 結果テーブルに durationMs 行が新規表示される） |
| implementation_mode | `new`（current branch に durationMs 実装が frontend/backend いずれにも存在しない） |
| スコープ層 | apps/api（producer）+ apps/web（consumer・表示） |
| 実装サイクル数 | 1（両輪を 1 サイクルで完了。先送り禁止 = CONST_007） |
| D1 schema 変更 | なし |
| Google Form 仕様変更 | なし |

## 2. 真の論点

- **主問題（1文）**: 管理者が手動再取込を実行したとき、取込が何ミリ秒かかったか（`durationMs`）を結果テーブルで確認できない。値そのものが backend で計測・返却されていないため、UI に「行を足すだけ」では表示できない。
- **why now**: Task B で再取込 UI が landed したが、運用観点の所要時間メトリクスが欠落しており、性能劣化の早期検知ができない。
- **why this way**: 計時は処理の実行主体（producer = `runResponseSync()`）が所有するのが整合的。route/UI は計測せず素通し/表示に徹する（責務境界）。
- **案件の切り分け**: 本タスクには backend の値生成（producer）と frontend の表示（consumer）の 2 案件が含まれるが、**同一の関心事（durationMs の end-to-end 供給）の不可分な両輪**であり、片方だけでは価値が成立しない。よって 1 実装サイクル 1 PR で完了させる。

## 3. スコープ

### 含む

| # | 内容 | 層 |
|---|------|----|
| S-1 | `runResponseSync()` の 3 経路（succeeded/failed/skipped）すべてで `durationMs` を計測し `ResponseSyncResult` に含めて返す | apps/api |
| S-2 | `ResponseSyncResult` interface に `readonly durationMs: number` を追加 | apps/api |
| S-3 | `SyncResultSchema`（zod）に `durationMs: z.number().int().nonnegative().optional()` を追加し `.strict()` を維持 | apps/web |
| S-4 | `ManualFormResyncPanel` の `resultRows()` に durationMs 行を追加（欠落時 `-` fallback） | apps/web |
| S-5 | panel spec / sync-schemas spec / responses-sync.contract.spec に durationMs 回帰テストを追加 | apps/api + apps/web |

### 含まない（scope out）

| # | 除外項目 | 理由 |
|---|---------|------|
| O-1 | `apps/api/src/routes/admin/responses-sync.ts` の変更 | route は `result` を `c.json({ ok, result })` で素通しするため、`ResponseSyncResult` に durationMs が入れば自動で含まれて返る。変更不要 |
| O-2 | `sync/types.ts` の `DiffSummary.durationMs` / `sync/audit.ts` `withSyncMutex` | 別 sync パターン（diff sync）であり resync 経路は非経由。本タスクのスコープ外 |
| O-3 | `sync/manual.ts:87` の `durationMs: 0` ハードコード | 別関心（別 sync 経路）。本タスクで触らない |
| O-4 | D1 schema への durationMs 永続化 | sync_jobs ledger への列追加は AC に含まれず、Task B 軽量方針に反する。将来タスク候補 |
| O-5 | durationMs の閾値アラート / 性能監視連携 | 表示のみが本タスクの価値。監視連携は将来層 |

## 4. 受け入れ基準（AC）

| AC | 内容 | 検証層 |
|----|------|--------|
| AC-1 | `runResponseSync()` が succeeded/failed/skipped の 3 経路すべてで `durationMs`（処理開始〜終了のミリ秒・非負整数）を `ResponseSyncResult` に含めて返す | apps/api |
| AC-2 | `SyncResultSchema` に `durationMs: z.number().int().nonnegative().optional()` を追加し `.strict()` を維持する | apps/web |
| AC-3 | `ManualFormResyncPanel` の `resultRows()` に durationMs 行を追加し、実際に backend から供給された値を表示する。欠落時は `-` fallback | apps/web |
| AC-4 | 既存 mode/status/jobId/processedCount/writeCount/cursor/skippedReason 表示、409 skipped メッセージ、`.strict()` 契約、`SyncRunResponseSchema` union が退化しない | apps/web |
| AC-5 | panel spec / sync-schemas spec に durationMs 回帰テストを追加し green | apps/web |
| AC-6 | `responses-sync.contract.spec.ts` が durationMs 込み result でも green（route 素通し確認） | apps/api |

## 5. inventory（変更対象ファイル一覧）

| # | パス | 種別 | 変更内容 |
|---|------|------|---------|
| F-1 | `apps/api/src/jobs/sync-forms-responses.ts` | 編集 | `ResponseSyncResult` に `durationMs` 追加 / `runResponseSync()` 冒頭に `startedAt` 計測 / 3 経路の return に `durationMs: now().getTime() - startedAt` を追加 |
| F-2 | `apps/web/src/features/admin/diagnostics/manual-sync.ts` | 編集 | `SyncResultSchema` に `durationMs: z.number().int().nonnegative().optional()` 追加（`.strict()` 維持） |
| F-3 | `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 編集 | `resultRows()` に `["durationMs", result.durationMs ?? "-"]` 行を追加 |
| F-4 | `apps/api/src/routes/admin/responses-sync.contract.spec.ts` | 編集 | 既存 mock result に `durationMs` を含めても 200/409 が green（素通し確認）。回帰テスト追加 |
| F-5 | `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | 編集 | durationMs あり/なし両方が parse 成功すること、`.strict()` で未知キー reject が維持されることを検証（TC-S 追加） |
| F-6 | `apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx` | 編集 | durationMs 行が表示されること、欠落時 `-` fallback を検証（TC-B 追加） |

> `apps/api/src/routes/admin/responses-sync.ts` は **変更不要**（O-1）。route は result を素通しするため、新フィールドは自動伝播する。

## 6. 命名規則分析（[FB-SDK-07-4]）

| 既存フィールド | ケース |
|---------------|--------|
| `processedCount` | camelCase |
| `writeCount` | camelCase |
| `jobId` | camelCase |
| `skippedReason` | camelCase |
| `cursor` | lowercase 単語 |

- **結論**: 新規フィールドは `durationMs` とし、既存 camelCase に整合させる。既存計時基盤 `DiffSummary.durationMs`（`sync/types.ts`）も同名 camelCase であり命名が一貫している。命名ドリフトなし。

## 7. 未実装ベースライン確認（P50 チェック）

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch に実装が存在する | **No** | 通常の new 実装 Phase とする |
| upstream（dev/main）にマージ済み | No（frontend/backend いずれにも durationMs 未実装。提供調査と一次資料 `sync-forms-responses.ts` L99-107 / `manual-sync.ts` L3-12 で確認済み） | 未マージとして扱う |
| 前提タスク（Task B 再取込 UI）が完了済み | Yes（`ManualFormResyncPanel.client.tsx` / `responses-sync.ts` が landed 済み） | 依存解消タスク不要 |

→ `implementation_mode: "new"`。Phase 4 = TDD Red 設計、Phase 5 = 新規実装。

## 8. issue 本文 drift 補正

- issue #1088 は「再取込結果テーブルに取込所要時間を表示」と要望するが、**durationMs の producer（値の生成主体）が未定義**である。一次資料確認により、producer = sync use-case 関数 `runResponseSync()` / 返却型 `ResponseSyncResult`（`apps/api/src/jobs/sync-forms-responses.ts`）に pin する。
- 「表示行追加」だけでは値が存在しないため成立しない。よって backend の値生成を本タスクスコープに含める（CONST_007: 先送り禁止）。
- consumer（表示主体）= `ManualFormResyncPanel`（`apps/web`）に pin する。

## 9. carry-over 確認

- 直近コミット（`git log --oneline -5`）は admin members / public search / profile / attendance dashboard / shell 系であり、本タスク（manual form resync duration）と重複なし。新規 workflow として独立。

## 10. 不変条件チェック

| 不変条件 | 本タスクでの扱い |
|---------|----------------|
| D1 直接アクセスは apps/api に閉じる | durationMs は apps/api の `runResponseSync()` で生成。apps/web は D1 非経由（schema parse のみ）。遵守 |
| HEX 直書き禁止（OKLch トークン正本） | 本タスクは色を扱わない。durationMs 行は既存 `<dt>/<dd>` の token 化済みスタイルを再利用（`var(--ubm-color-text-muted)`）。遵守 |
| 実装の「実行」はしない | 本仕様書は手順のみ記載。commit/PR/staging は user-gated |
