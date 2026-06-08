# Phase 8: リファクタリング

`[実装区分: 実装仕様書]` / status: `completed`

本 Phase は implemented_local_evidence_captured のため、user-gated runtime/staging cycleで適用すべき**リファクタリング指針**を事前に固定する（実コードへの適用はuser-gated runtime/staging cycle）。判定は「PASS・実コード検証はuser-gated runtime/staging cycle」。

## 8.1 対象 / Before / After / 理由 [Feedback RT-03]

| # | 対象 | Before（素朴実装の懸念） | After（採用設計） | 理由 |
|---|------|--------------------------|-------------------|------|
| RT-1 | 3 操作ボタン生成（`TagCatalogRow`） | 行内に reactivate/logical/physical のボタンを `if (active) {...} else {...}` で個別 JSX 直書き → 文言・intent・endpoint が分散し AC-4 の区別が散らばる | `availableOps(active)` で op 配列を得て `lifecycleDescriptor(op)` を `map` し、descriptor 駆動でボタンを生成（data-driven） | descriptor を SSOT 化。文言/intent/method/endpoint の単一情報源化で混同（AC-4）と退化を防ぐ。row は presentational に保つ |
| RT-2 | 409 / 404 文言（`TagCatalogPanel`） | catch 内で `if (status===409) "..." else if (status===404) "..."` を JSX 側に直書き → 文言と分類ロジックが UI に癒着 | 分類は pure `parseTagLifecycleError(status, bodyText)`、文言生成も pure helper（例 `referenceBlockedMessage(n)` / `notFoundMessage()`）へ集約し panel は state→文言を引くだけ | pure 集約で branch test（7.3）が UI を起動せず通る。文言変更が 1 箇所で済む（DRY） |
| RT-3 | status badge class（`TagCatalogRow`） | 新規 `.admin-tag-catalog-badge` を独自配色で定義 → 既存 `.admin-tag-status-badge[data-status]` と規約が二重化 | `[data-status="active"|"inactive"]` 属性駆動 + 既存 `.admin-tag-status-badge`（globals.css L1124）の token 規約に寄せて `.admin-tag-catalog-badge[data-status]` を additive 定義（success/neutral token 共有） | 既存 badge 規約への整合。新規 primitive を生やさない（不変条件 3）。token 重複定義を避ける |
| RT-4 | mutation overload 分岐（`TagCatalogPanel`） | op ごとに `fetch` を直書き or 3 つの呼び出しを別関数に重複展開 | descriptor の `method` / `endpoint(tagId)` を `useAdminMutation` に渡す単一 dispatch（DELETE=idempotent / POST=non-idempotent overload は op で選択） | 呼び出し経路の重複を 1 dispatch に集約。CLAUDE.md 不変条件 #10（useAdminMutation 経由）を満たす |
| RT-5 | pendingTagId ロック解放 | 成功時のみ null 戻し → エラー/キャンセルで pending が残り行が固まる | `finally` 相当（成功/409/404/other/キャンセル全経路）で `pendingTagId=null` に戻す（Phase 2 §2.4 state machine） | ロック変数の全解放経路を保証（STATE-DETAIL-01）。行が詰まらない（AC-7 の「操作が詰まらない」） |

## 8.2 重複削減候補（DRY・3 本柱）

1. **descriptor SSOT 化 → row の data-driven 化（RT-1）**: ボタンの label/intent/method/endpoint/requiresConfirm を `lifecycleDescriptor` に集約。`TagCatalogRow` は `availableOps(active).map(lifecycleDescriptor)` でボタンを生成し、JSX 分岐を排除。3 操作の追加・文言変更が descriptor 1 箇所で完結。
2. **409・404 文言の pure helper 集約（RT-2）**: 分類（`parseTagLifecycleError`）と文言（`referenceBlockedMessage` / `notFoundMessage`）を `tagCatalogLifecycle.ts` に集約。panel は分類結果 state から文言を引くだけにし、UI と文字列定義を分離。
3. **status badge を既存規約へ寄せる（RT-3）**: 独自配色を作らず `.admin-tag-status-badge` の `[data-status]` + OKLch token 規約に整合。`.admin-tag-catalog-badge[data-status="active"|"inactive"]` を additive にし success/neutral token を共有（AC-9）。

## 8.3 navigation drift（新規 route 追加に伴う整合）

新規 route `/admin/tags/catalog` を足すことで、ナビ/パンくずの整合ずれ（drift）が起きないよう以下をuser-gated runtime/staging cycleで確認・調整する。

| 項目 | 対応 | 確認方法（user-gated runtime/staging cycle） |
|------|------|--------------------------|
| sidebar nav 到達導線 | admin nav 定義に `/admin/tags/catalog`（ラベル「タグカタログ」）を additive 追加（AC-0 到達性） | `rg -n "admin/tags\|nav.*items\|SidebarShell" apps/web/src/features/admin` で nav 定義の現物パスを確定し 1 項目追加 |
| 既存 `/admin/tags`（TagQueuePanel）との関係 | 既存 nav 項目は変更しない。catalog は別項目として並列追加（非退化・AC-5） | 既存 nav 項目の label/href を diff で不変確認 |
| breadcrumb / AdminPageHeader | `AdminPageHeader` の title=「タグカタログ」・必要なら親 = 「タグ」を設定。既存 header primitive を再利用し独自 breadcrumb を作らない | `AdminPageHeader` の props 規約に合わせる |
| active 状態ハイライト | nav の現在ページ判定が `/admin/tags` と `/admin/tags/catalog` で誤マッチしないこと（prefix match の取りこぼし） | nav active 判定が完全一致 or 適切な prefix 規則かを確認し、誤ハイライトがないこと |

> drift の主因は「`/admin/tags` の prefix match が `/admin/tags/catalog` も active 扱いしてしまう」「既存 nav の順序/グルーピングが崩れる」の 2 点。additive 追加に徹し、既存項目の構造を触らない。

## 8.4 リファクタリング後の不変条件（退化防止）

- `TagCatalogRow` は internal state / mutation を持たない（presentational・callback 委譲）。
- `tagCatalogLifecycle.ts` は副作用なし（import に React / fetch / DOM を持ち込まない）。
- 既存 `useAdminMutation` / `ConfirmDialog` / `safeServerFetch` / `AdminPageHeader` を再利用し、新規 primitive を生やさない。
- 文言・descriptor・分類は pure 層に集約し UI へ直書きしない（DRY・test 容易性）。

## 8.5 完了条件（Phase 8）

- 対象/Before/After/理由を表形式で固定した（RT-03）。
- 重複削減 3 候補（descriptor SSOT / 文言 pure 集約 / badge 規約整合）を明記した。
- 新規 route 追加に伴う navigation drift の整合観点を固定した（実確認はuser-gated runtime/staging cycle）。
