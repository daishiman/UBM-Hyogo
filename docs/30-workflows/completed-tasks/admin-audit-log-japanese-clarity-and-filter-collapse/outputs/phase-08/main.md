# Phase 8 — リファクタリング方針（main.md）

> Phase 7 で「未カバー AC ゼロ・既存 spec 追従済み」を確認した状態を前提に、挙動を一切変えずに duplicate と命名 drift を削減する。

## 1. 削減対象 1: duplicate（ラベル変換の重複）

実装直後の状態では、「コード → 日本語」の変換ロジックが複数 component に散らばるリスクがある:

- `AuditLogCard.tsx` の action / targetType 表示
- `AuditLogPanel.tsx` の datalist / フォームラベル
- `auditAppliedFilters.ts` のチップ生成

**方針**: 変換は `auditGlossary.ts` の `describeAuditAction` / `describeAuditTargetType` / `describeAuditField` を**唯一の変換点**とする。各 component は helper を呼ぶだけにし、`Record<string,string>` のルックアップやインライン三項を component 側に重複させない。これにより「用語を変えたい時の修正点が 1 箇所（glossary の 3 マップ）」になる。

## 2. 削減対象 2: 命名 drift（日本語ラベル文字列の散在）

- 日本語ラベル（"操作の種類" / "出席を追加" 等）の文字列リテラルが component 側に直書きされると、表記ゆれ（"対象ID" vs "対象 ID" など）が起きやすい。
- **方針**: 日本語ラベルの正本を `auditGlossary.ts` の 3 マップに一本化し、component には文字列リテラルを残さない（`auditId` → 「ログID」のような単発ラベルのみ component に残るが、これは glossary 管轄外の固定 UI 文言として許容。チップ / フォーム / カードの action・targetType・field は全て helper 経由）。

## 3. 削減対象 3: globals.css の minmax 漂流

- `.admin-audit-glossary`（`minmax(170px,1fr)`）/ `.admin-audit-card__meta`（`minmax(150px,1fr)`）の最小幅が不揃いで、画面幅により列数がばらつき整列が破綻する。
- **方針**: 最小幅を統一感のある値（glossary 200px / meta 180px）へ整理し、`align-items` を明示して行高を揃える。`.chip-row` の wrap は既存共通定義（L2189-2196）を再利用し**再宣言しない**（重複定義の削減）。

## 4. 挙動不変の機械確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/auditGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx
```

- Phase 7 の TC が全 PASS であればリファクタで挙動は変わっていない。
- testid（`audit-log-card` / `audit-applied-filters`）が grep で維持されていることを確認する。

## 5. 不変条件の維持

- リファクタは表現層に閉じ、`<input name>` / query param キー / `apps/api` / `packages/shared` に触れない（AC-9）。
- 新規 primitive を作らない（AC-10）。HEX を増やさない（AC-8）。
