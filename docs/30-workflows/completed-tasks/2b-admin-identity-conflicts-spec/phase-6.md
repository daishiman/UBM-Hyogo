# Phase 6 — fixture 標準形 / I/O 仕様

## 1. `identityConflictItem`（list 要素）

| field | 型 | 例 / 備考 |
|------|----|----------|
| `conflictId` | `string` | `'cf_001'`（route `:id` と整合する固定値） |
| `sourceMemberId` | `string` | `'m_src_01'` |
| `candidateTargetMemberId` | `string` | `'m_dst_01'` |
| `matchedFields` | `('name' \| 'affiliation')[]` | `['name', 'affiliation']` |
| `detectedAt` | `string (ISO8601)` | `'2026-05-08T00:00:00Z'` |
| `responseEmailMasked` | `string` | `'t***@example.com'` |
| `syncJobId` | `string \| null` | `'sync_001'` or `null` |

> 配列件数 **2 件以上**（一覧 render の sort 表面化のため）。

## 2. merge response shape

| field | 型 | 例 |
|------|----|-----|
| `targetMemberId` | `string` | `'m_dst_01'` |
| `archivedSourceMemberId` | `string` | `'m_src_01'` |
| `mergedAt` | `string (ISO8601)` | `'2026-05-09T00:00:00Z'` |
| `auditId` | `string` | `'aud_merge_001'` |

> ⚠️ `mergedMemberId` は **絶対に含めない**（Phase 4 Q1）。

## 3. dismiss response shape

| field | 型 | 例 |
|------|----|-----|
| `dismissedAt` | `string (ISO8601)` | `'2026-05-09T00:00:00Z'` |

## 4. refresh boundary（M4 専用）

merge / dismiss 成功後の実 UI は `router.refresh()` のみを実行する。`/admin/members/:id` を明示 fetch しないため、test 4 は member detail response ではなく server-side list refresh の再取得境界を確認する。

## 5. I/O テーブル

| 項目 | 内容 |
|------|------|
| 入力 | `test` / `expect` を `../fixtures/auth` から import し、`adminPage` / `memberPage` / `anonymousPage` fixture を test callback 引数で受ける |
| 出力 | spec ファイル 1 件 / Playwright test report 6 件 |
| 副作用 | 実 API・実 D1 は叩かない。初期 list は non-production gated fixture、mutation は `page.route()` |
| 環境変数 | `PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1` を当該 spec 実行時のみ webServer に注入 |
| ネットワーク | 初期 list は server-side fetch のため mock API server または fixture DB。browser `page.route()` は `/api/admin/identity-conflicts/*/{merge,dismiss}` のみ |
