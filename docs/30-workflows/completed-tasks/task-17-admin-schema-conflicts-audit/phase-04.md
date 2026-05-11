# Phase 4: テスト作成 (TDD Red)

[実装区分: 実装仕様書]

## 目的

実装前に失敗するテスト (Red) を既存 component / admin helper に対して用意する。

## 事前チェック (FB-MSO-002)

```bash
mise exec -- pnpm install
mise exec -- pnpm -F @ubm-hyogo/web typecheck
```

> esbuild darwin バイナリ mismatch を Phase 4 開始前に解消する。

## テストパターン整合性

Phase 1-3 で記録した current canonical path (`apps/web/src/components/admin/*`, `apps/web/src/lib/admin/*`) と一致する import path でテストを書く。

## test 一覧 (vitest + @testing-library/react + jest-axe)

### helper / route

| ファイル | ケース |
|---------|------|
| `apps/web/src/lib/admin/__tests__/api.test.ts` | (1) `postSchemaAlias()` が `/api/admin/schema/aliases` に `{ questionId, stableKey, diffId? }` を送る。(2) schema alias 202 retryable continuation を `isSchemaAliasRetryableContinuation()` が narrow する。(3) identity merge helper を追加する場合は `{ targetMemberId, reason }` を送る。(4) dismiss helper を追加する場合は `{ reason }` を送る |
| `apps/web/app/(admin)/admin/audit/page.test.ts` | (1) `actorEmail/action/targetType/targetId/from/to/cursor/limit` を URLSearchParams に変換する。(2) 空値は除外。(3) JST local input を UTC ISO query に変換する |

### component

| ファイル | ケース |
|---------|------|
| `SchemaDiffPanel.test.tsx` | (1) `items=[]` で empty state 文言。(2) `added/removed/changed/unresolved` 各 type の表示。(3) `postSchemaAlias` 成功 / 409 / 422 / 202 retryable continuation の表示 |
| `IdentityConflictRow.test.tsx` | (1) masked email のみ表示。(2) merge/dismiss は reason 必須。(3) merge body が `{ targetMemberId, reason }` になる |
| `AuditLogPanel.test.tsx` | (1) `items=[]` で empty。(2) JST 表示。(3) `actorEmail=null` は system 表示。(4) masked JSON disclosure を raw PII なしで表示 |

### a11y (jest-axe)

`SchemaDiffPanel` / `IdentityConflictRow` / `AuditLogPanel` / 各 modal で `expect(await axe(container)).toHaveNoViolations()`。

## ローカル実行コマンド

```bash
# 失敗 (Red) 確認
mise exec -- pnpm -F @ubm-hyogo/web test --run \
  src/components/admin/__tests__/SchemaDiffPanel.test.tsx \
  src/components/admin/__tests__/AuditLogPanel.test.tsx \
  src/lib/admin/__tests__/api.test.ts \
  app/\\(admin\\)/admin/audit/page.test.ts
```

## 注意 (Feedback VSCPKR-02)

- `window.api` 等を mock する場合は `Object.defineProperty(window, "api", { value: mockApi, writable: true })` を使う。
- `vi.stubGlobal("window", ...)` は **使用禁止** (happy-dom で `instanceof HTMLElement` が壊れる)。

## 成果物

- 上記 focused test files (Red 状態で commit 可)
- `outputs/phase-04/test-spec.md` — テストケース一覧 + 期待値表

## DoD

- [ ] focused test files が作成され、ローカル実行で **すべて Red**
- [ ] テストパターンが Phase 1 命名規則と整合
- [ ] a11y テストが canonical admin component で導入
