# Phase 3: Design Review

## メタ情報
- workflow: issue-776-schema-alias-bulk-resolve

## 目的
Phase 2 設計が要件・不変条件・既存実装と整合するかを最終確認する。

## レビュー観点と結論

### R1. CLAUDE.md 不変条件適合
- [x] 不変条件1（既存 API only）: 採用案 C は既存 `POST /admin/schema/aliases` のみ呼ぶ。OK。
- [x] 不変条件3（OKLch token のみ）: design section で新規 token 追加なし、既存 token のみ参照。OK。
- [x] 不変条件8（`*.spec.*` のみ）: test ファイル命名は phase-04 / 06 / 07 で `*.spec.tsx` / `*.spec.ts` に統一。OK。
- [x] D1 直接アクセス禁止: client fan-out は `apps/web` から `apps/api` の既存 endpoint を経由。OK。

### R2. 既存 contract 影響
- `postSchemaAlias` の signature / behavior は変更しない（新規 `postSchemaAliasBulk` を並走）→ 親 workflow の single-resolve spec 全件は変更不要。
- `SchemaDiffPanel.tsx` への破壊的変更は最小化（trigger toggle と checkbox 描画分岐のみ）。

### R3. state 管理の妥当性
- bulk 専用 hook + sub-component 分離は SRP に適合。`SchemaDiffPanel` の責務膨張を回避。
- `useSchemaDiffBulkSelection` 内の state は `selectedIds` (Set) / `rows` (array) / `modalOpen` / `isSubmitting` のみで、reducer は不要（useState で十分）。

### R4. UX エッジケース
- `added` / `removed` 行で checkbox 非表示 → R: OK（design 仕様明示）
- 0 件選択で confirm 押下 → R: ボタン disabled、modal 開けない（実装でガード）
- modal 表示中に親が refetch → R: modal 中は parent refetch を block（`isSubmitting=true` の間は parent refresh trigger を抑止）
- 30 件以上の超過 selection → R: 上限 50 件（UI でガード、超過時は警告 toast）

### R5. パフォーマンス
- 30 件 bounded fan-out（concurrency 8） → Workers の sub-request 上限（50/req）/ D1 binding rate limit に抵触しないか
  - 各 row は別 HTTP 往復（browser → Workers → D1）。Workers の同時 sub-request 制約は受けない（fan-out は client 側）
  - Cloudflare API plane の rate limit（1200 req/5min）は admin 単独操作の 30-50 件レベルでは余裕
  - 結論: 30 件 / 50 件上限内であれば問題なし。Phase 9 で実測。`202 backfill_cpu_budget_exhausted` は retryable 行として modal に残す。

### R6. a11y
- modal focus trap / keyboard navigation / aria-live は jest-axe で violation 0 を Phase 06 で検証

## 残課題（次サイクル送りでない範囲で対応）

- なし。すべて本サイクル内で処理。

## 完了条件
- [ ] R1..R6 が全件 OK / 対応済
- [ ] Phase 4 以降に進める粒度で設計が固定
