# Implementation Guide — issue-1089 backfill 影響件数プレビュー

> 全件 backfill（`?fullSync=true`）の破壊的実行前に、Forms API の**実カウント**を根拠に
> 「何件の回答が再取込されるか」を提示する dry-run プレビューを新設した実装の記録。
> 仕様書（Phase 1〜13）の SSOT に厳密に従い、参考正本 `BackfillPublishStatePanel` の
> staged dry-run パターンを `ManualFormResyncPanel` / `POST /admin/sync/responses` へ踏襲した。

- ブランチ: `docs/issue-1089-backfill-impact-preview-spec`
- ベース: `dev`
- issue: #1089（CLOSED のまま）
- implementation_mode: `new`（現行コードに未実装だった機能の新規実装）

---

## 1. 何を実装したか（中学生にも分かる説明）

「全件 backfill」は Google フォームの回答を**全部もう一度取り込み直す**操作で、データベースに
たくさん書き込みが走る "重い・取り消しにくい" ボタン。これまでは押すと
「再取込します。実行しますか?」という**件数の入らない固定メッセージ**しか出なかった。

今回、その横に「**影響件数を確認**」ボタンを足した。これを押すと、サーバーが
フォーム API を**読み取り専用で数えるだけ**（書き込みゼロ）走り、「いま何件が対象か」を
実数で返す。管理者はその実数を見てから「全件 backfill」を押せるようになり、確認ダイアログにも
`全 N 件の回答を再取込します（推定 M write）。実行しますか?` と**実数が埋め込まれる**。

つまり「数を見てから、納得して実行する」という安全な 2 段階フロー（staged flow）にした。

---

## 2. 変更ファイル（実装 4 + テスト 4 = 8 ファイル）

| パス | 区分 | 内容 |
|------|------|------|
| `apps/api/src/jobs/sync-forms-responses.ts` | 実装 | `ResponseSyncPreview` / `ResponseSyncPreviewOptions` 型 + `previewResponseSync()` を追加。pagination helper（`parseHighWaterCursor` / `isAfterHighWater` / `estimateResponseWrites` / `parseAutoPublishFlag`）を `runResponseSync` と共有 |
| `apps/api/src/routes/admin/responses-sync.ts` | 実装 | `?dryRun=true` 分岐を追加し `previewResponseSync` を呼んで `{ ok:true, preview }` を返す。失敗は `{ ok:false, error:"preview_failed" }` 500 |
| `apps/web/src/features/admin/diagnostics/manual-sync.ts` | 実装 | `SyncPreviewResultSchema` / `SyncPreviewRunResponseSchema` / 型を追加 |
| `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 実装 | 「影響件数を確認」ボタン + preview 件数表示 + `canBackfill` gate + confirm 文言への実数埋め込み |
| `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | テスト | TC-PV1..PV10 追加（件数 / no-write / no-lock / no-ledger / capped / estimatedWrites / formId throw / cursor 伝播） |
| `apps/api/src/routes/admin/responses-sync.contract.spec.ts` | テスト | TC-RT1..RT5 追加（dryRun 200 / preview_failed 500 / 認証前段 / fullSync 伝播 / 後方互換） |
| `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | テスト | TC-S8..S14 追加（preview schema 正常 / status / dryRun / strict / nonnegative / wrapper） |
| `apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx` | テスト | TC-B2 を staged 化、TC-B9..B12（+B9b）追加（preview 表示 / canBackfill / confirm 実数埋込 cancel / schema mismatch / capped 注記） |

> D1 migration / Google Form schema / `processResponse` の挙動変更はゼロ。既存契約
> （`SyncResultSchema` / `?fullSync=true|false` run 経路）は 1 文字も変更していない（AC-3）。

---

## 3. 受け入れ基準（AC）の充足

| AC | 充足内容 |
|----|---------|
| AC-1 | preview ボタン → preview パネルに `responseCount` / `estimatedWrites` / `pagesScanned` / `capped` を表示。schema mismatch 時は `role="alert"` で「件数取得不可」を明示 |
| AC-2 | `responseCount` は backend `previewResponseSync` が Forms API `listResponses` を実際にページングして数えた実数。UI では推定しない。`estimatedWrites` は「推定 write 数」とラベル明示 |
| AC-3 | `SyncResultSchema` / `SyncRunResponseSchema` / `?fullSync` run 経路は不変。preview は新規 schema / 新規 route 分岐として**追加のみ**。TC-S1..S7 / TC-B1,B5..B8 / 既存 route テスト全 green |
| AC-4 | `runBackfill` は confirm cancel で early return。preview 後でも cancel で `?fullSync=true` を呼ばない（TC-B3 / TC-B11） |
| AC-5 | TC-B2 を「preview → confirm 承認 → `?fullSync=true`」の staged flow へ更新し等価の承認保証を担保（更新理由を test 内コメントに記録） |

---

## 4. read-only 不変条件（preview の安全性）

`previewResponseSync` は不変条件 #3（read-only）を厳守する。テストで機械的に保証している:

- `acquireSyncLock` を呼ばない → TC-PV5（`db.syncLocks` 0 件）
- `start` / `succeed` / `fail`（sync_jobs ledger）を呼ばない → TC-PV6（`db.syncJobs` 0 件）
- `processResponse`（D1 write）を呼ばない → TC-PV4（responses/identities/status/fields/diff/tagQueue 全 0 件）
- PII（responseEmail / responseId / questionId）を返さない → TC-PV1（返却 object は 6 キーのみ）
- 暴走防止: `safetyCounter > 100` で `capped=true` 打ち切り → TC-PV7

---

## 5. ローカル検証結果（全 green）

| コマンド | 結果 |
|---------|------|
| `pnpm --filter @ubm-hyogo/api typecheck` | エラー 0 |
| `pnpm --filter @ubm-hyogo/web typecheck` | エラー 0 |
| backend contract（d1 config・2 files） | **40 passed**（既存 30 + 新規 TC-PV/TC-RT） |
| frontend（unit config・2 files） | **31 passed**（schema 18 + UI 13） |
| `pnpm lint`（design-token / dep-cruiser / inline-style 含む） | 違反 0・exit 0 |

`git diff dev...HEAD --name-only` は §2 の 8 ファイルのみ（実装 4 + テスト 4）。

---

## 6. 視覚的検証（Phase 11・VISUAL_ON_EXECUTION）

本機能は `/admin` 配下の管理パネルであり、**認証付き runtime screenshot は staging deploy +
`SYNC_ADMIN_TOKEN` 投入が前提**のため user-gated（CONST_002）。本実装サイクルでは
authenticated runtime screenshot は取得していない（pending）。代替として `outputs/phase-11/` に static UI contract PNG 4 枚を保存済み。UI 契約は以下で担保:

- DOM 構造・staged flow・confirm 文言・preview パネル描画は jsdom の UI テスト（TC-B9..B12）で検証済み。
- 色は OKLch トークン（`var(--ubm-color-*)`）のみ。HEX 直書きなし（lint `verify-design-tokens` 通過）。
- 新規 primitive を生やさず `Button`（variant=soft）/ `AdminSectionCard` を再利用。

> staging での authenticated screenshot 取得が必要な場合はユーザー承認後に実施する。

---

## 7. 未タスク・先送り

なし。issue #1089 のスコープ（AC-1..AC-5）は本サイクルで実装完了。
commit / PR / push / staging deploy / `SYNC_ADMIN_TOKEN` 投入 / authenticated screenshot は
ユーザー明示指示まで実行しない（CONST_002）。
