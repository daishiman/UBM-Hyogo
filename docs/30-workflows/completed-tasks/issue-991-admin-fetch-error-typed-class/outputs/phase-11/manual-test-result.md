# Phase 11 手動テスト結果 — AdminFetchError typed class

**[実装区分: 実装仕様書]**

## 証跡メタ情報（FB-Feedback-4 準拠）

| 項目 | 内容 |
| --- | --- |
| タスク分類 | NON_VISUAL |
| 証跡の主ソース | focused Vitest（新規 `admin-fetch-error.spec.ts` の TC-AFE-01〜12 + safe-fetch の TC-SF-STATUS/INT/FALLBACK + regression 5 spec） |
| スクリーンショットを作らない理由 | UI/UX 変更なし。視覚的差分が存在しない |
| 実施状態 | **implemented_local_evidence_captured** — ローカル実装・focused Vitest・typecheck・lint 実測済み |

## 自動テスト結果

| カテゴリ | spec | 期待 | 実測 |
| --- | --- | --- | --- |
| 新規（製品コード） | `apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts` | typed fields / 256 vs 500 / type guard / PII redaction PASS | PASS（5 tests） |
| 新規（共通層） | `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`（TC-SF-STATUS/INT/FALLBACK 追記） | PASS | PASS（8 tests） |
| 回帰（byte-identical guard） | `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts` | 既存 PASS 不変（:89/:101 の ` body=` assertion） | PASS（4 tests） |
| 回帰 | `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts` | 既存 PASS 不変（`ADMIN_FETCH_404` 等） | PASS（6 tests） |
| 回帰 | `apps/web/src/lib/admin/__tests__/safe-server-fetch-404-vs-401.spec.ts` | 既存 PASS 不変 | PASS（4 tests） |
| 回帰 | `apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts` | 既存 PASS 不変 | PASS（4 tests） |

実行コマンド:

```bash
mise exec -- pnpm exec vitest run apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts apps/web/src/lib/admin/__tests__/safe-server-fetch-404-vs-401.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts
```

結果: **Test Files 6 passed / Tests 31 passed**。

## ソースレベル確認（WEEKGRD-01: 製品コードと環境を分離）

- [x] `grep -n "throw new Error(\`admin api" apps/web/src/lib/admin/server-fetch.ts` = 0 件（旧 untyped throw 撤去）
- [x] `grep -n "AdminFetchError" apps/web/src/lib/server-fetch/safe-fetch.ts` = 0 件（共通層の admin 非依存 / 責務境界）
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` green
- [x] `mise exec -- pnpm lint` green

### 環境ブロッカー（製品コードと別カテゴリ）
- worktree 直後の esbuild darwin バイナリ mismatch（FB-MSO-002）→ `pnpm install` で解消。製品コードの問題ではない。

## 既知制限
- runtime（staging deploy / wrangler tail での `[admin/server-fetch] 404` ログ観測）確認は user-gated。
- commit / push / PR は user-gated。
