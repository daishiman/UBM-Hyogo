# Phase 10 — 最終レビュー（AC 充足判定 / blocker 判定）

**[実装区分: 実装仕様書 / implementation_mode: new]**

> Phase 1〜9 で固定した scope / AC / 設計 SSOT（特に phase-2.md の backend・frontend 契約）を、
> 本タスクで **これから実装する** 設計が AC-1..AC-5 を充足するかへ写像し、最終 PASS/FAIL を判定する。
> 本タスクは issue #1089 の新規実装仕様書として開始し、phase-1.md §0 時点では preview 経路は **未実装**だった。
> Phase 12 レビュー cycle で実装済みに昇格したため、本 Phase の設計 PASS は実コード・focused tests により後続検証された。
> MINOR 指摘は [Feedback]「Phase 10 MINOR は必ず未タスク化対象」に従い Phase 12 Task 12-4 の検出対象とする。

---

## 1. レビュー前提（Phase 10 着手チェック）

- Phase 1 で確定したタスク分類 = **UI task（VISUAL）** を再確認した。preview ボタン・件数表示は
  admin パネルに描画される UI 追加であり、runtime screenshot は `/admin/sync-status` の admin session 必須のため
  user-gated・pending（Phase 11 で扱う）。
- レビュー直前に MINOR 判定 → 未タスク化ルールを確認した（「機能に影響なし」は不要判定の理由にならない）。
- 設計 SSOT は phase-2.md（backend 契約 §2 / frontend 契約 §3 / 設計判断 DD1..DD6）である点を再確認した。
  本 Phase の判定は phase-2.md の定義を超える新仕様を導入しない。

---

## 2. AC 充足判定（設計 SSOT への写像）

| AC | 内容 | 充足箇所（設計上の根拠） | 判定 |
|----|------|-------------------------|------|
| AC-1 | 全件 backfill 承認フローの前段に、影響見込み件数（または「件数取得不可」明示）が表示される | preview ボタン `data-testid="manual-sync-backfill-preview"`（phase-2.md §3.2）→ `runPreview()` → `mode==="preview"` で `responseCount` / `estimatedWrites` / `pagesScanned` / `capped` を表示。失敗時は `parseError` を `role="alert"` で「件数取得不可」表示（phase-2.md §3.2 表示）。backfill ボタンは `canBackfill` gate で preview 成功後のみ enable（DD4） | **PASS** |
| AC-2 | プレビュー件数は backend dry-run / count-only 経路の実数であり UI 推定値でない | `responseCount` は `POST /admin/sync/responses?dryRun=true&fullSync=true` が `listResponses` を実ページングして数えた実カウント（phase-2.md §2.2 実装規約 6）。UI 側に集計ロジックを置かない（責務境界 §1「混在禁止」）。`estimatedWrites` のみ「推定」ラベルを明示（DD2） | **PASS** |
| AC-3 | 既存差分 sync（`?fullSync=false`）/ 全件 backfill（`?fullSync=true`）→ `POST /admin/sync/responses` と `SyncResultSchema`（status/jobId/processedCount/writeCount/cursor + optional skippedReason）が退化しない | `SyncResultSchema` / `SyncRunResponseSchema` / `SYNC_RESPONSES_PATH` は **1 文字も変更しない**（phase-2.md §3.1）。dry-run は新規 `SyncPreviewResultSchema` / route の `dryRun` 分岐として **追加のみ**（phase-2.md §2.3）。`?fullSync` 経路は無改変 | **PASS** |
| AC-4 | confirm キャンセル相当で backfill が実行されない（TC-B3 相当の不実行保証を維持） | `runBackfill` 内の `globalThis.confirm(msg)` が false なら early return（phase-2.md §3.2 backfill 実行・`if (!globalThis.confirm(msg)) return;`）。preview 後でも confirm cancel で `?fullSync=true` を呼ばない（DD3） | **PASS** |
| AC-5 | `ManualFormResyncPanel.spec.tsx`（TC-B1..B8、特に TC-B2）が green、または件数プレビュー導入に合わせ TC-B2 が更新されても等価の承認保証を担保 | TC-B1..B8 維持。TC-B2 は「preview → confirm 承認 → `?fullSync=true`」の staged flow へ更新し、承認保証を等価に担保（更新理由を test 内コメント + phase-4.md に記録）。新規 TC-B9..B12（preview/staged backfill）を追加（phase-1.md §5） | **PASS** |

---

## 3. 不変条件・横断品質の最終確認

| 観点 | 確認 | 結果 |
|------|------|------|
| `SyncResultSchema` / `?fullSync` 契約不変（AC-3） | 既存 schema・URL 契約に追加のみ・破壊的変更なし（phase-2.md §3.1 / 不変条件 1） | PASS |
| preview 経路 read-only（不変条件 3） | `acquireSyncLock` / `start` / `succeed` / `fail`（ledger）/ `processResponse`（D1 write）を一切呼ばない（phase-2.md §2.2 規約 3-5） | PASS |
| D1 直接アクセス禁止（不変条件 #5） | preview 集計は `apps/api` の job レイヤに閉じる。`apps/web` は `SyncPreviewResultSchema` の zod 再宣言で contract を保持（binding 直参照なし） | PASS |
| mutation 規約（不変条件 #10） | preview / run / backfill すべて `@/features/admin/hooks/useAdminMutation` 経由（legacy 不使用・phase-2.md §3.2） | PASS |
| 色トークン（不変条件 #2） | preview パネル・件数表示は OKLch `var(--ubm-color-*)` のみ。HEX 直書きなし | PASS |
| proxy 認証境界 | `needsSyncAdminBearer` は path 判定のみで query を見ないため `?dryRun=true` でも Bearer 注入が効く・無改変（phase-2.md §2.3） | PASS |
| PII 非露出（不変条件 7） | preview response は件数のみ（responseEmail / responseId / questionId を返さない・phase-2.md §2.2 規約 8） | PASS |

---

## 4. レビュー判定

> **判定: PASS — 全 AC（AC-1..AC-5）を設計 SSOT が構造的に充足。blocker なし。**

- **blocker**: なし。設計上、AC を満たさない構造的欠陥は検出されない。
- **MINOR**: 機能・契約・不変条件いずれも充足のため AC 充足に影響する MINOR はなし。
  将来の UX 改善候補（未タスク化候補・BLOCKER ではない）として下記を Phase 12 Task 12-4 へ申し送る:
  - 候補-1: preview 件数結果の短時間キャッシュ（同一 backfill 前に複数回 preview する際の Forms API 呼数削減）。本タスクは毎回実カウントを取る（stale 回避優先）ため対象外。
  - 候補-2: preview 実行中のキャンセル操作（現状は preview mutation の `busy` 完了待ち）。AC に影響しないため対象外。
  - 候補-3: preview レイテンシ実測 baseline（将来 UX・大量 response 時の応答時間可視化）。現 schema は件数のみのため backend 拡張前提・対象外。
  - これらは AC 充足に影響しないため Phase 10 では PASS を維持し、Task 12-4 で current/baseline を分離して記録する（0 件起票も含めて current/baseline 分離）。

---

## 5. 残留リスク（運用面・スコープ外）

| リスク | 性質 | 扱い |
|--------|------|------|
| runtime screenshot 未取得 | 環境制約（admin 認証必須・user-gated） | Phase 11 で代替証跡（自動テスト + static UI contract）を記録。製品コードの問題ではない |
| `SYNC_ADMIN_TOKEN` 未投入 | 外部運用（Cloudflare Secrets / `.dev.vars`） | proxy が fail-fast（500）で表面化。preview も同 proxy 経由のため投入は user-gated |
| Forms API レイテンシ（大量 response） | 外部 API 依存 | `capped`（100 page 上限）で暴走防止（phase-2.md §2.2 規約 7・DD6）。実測 baseline は MINOR 候補-3 |

---

## 完了条件

- [x] AC-1..AC-5 を設計 SSOT（phase-2.md の backend / frontend 契約）の充足箇所へ写像し全 PASS 判定した
- [x] 不変条件（schema 不変 / read-only / D1 / mutation / トークン / 認証境界 / PII）を最終確認した
- [x] blocker が無いことを確認した
- [x] MINOR 指摘（preview キャッシュ / preview 中キャンセル / preview レイテンシ baseline）を Phase 12 Task 12-4 へ申し送りとして記録した
- [x] 残留リスク（runtime screenshot / token 投入 / Forms API レイテンシ）が環境・運用起因で製品コード問題でないことを明記した
- [x] レビュー判定（PASS）を下した
