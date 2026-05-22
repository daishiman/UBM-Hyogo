# Phase 6: リファクタリング

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. 方針

本タスクは Vitest contract test 251 行 + route 3 ファイルの schema / response contract export + web fixture id 補正の小差分のため、リファクタリング余地は最小限。以下のみ検討対象とする。

| # | 観点 | 判定 |
|---|------|------|
| 1 | fixture の `apps/api/src/routes/admin/__tests__/fixtures/admin-stage-2.ts` への外部抽出 | **本タスク範囲外**（Stage 2 横断の Phase 8 別タスクで対応。2a/2b/2c の Playwright fixture と統合する場合の責務分担が決まっていないため、Stage 2 では inline 重複許容） |
| 2 | helper 関数の抽出 | inline `parse()` / `expectTypeOf` のみのため不要 |
| 3 | describe / it 名の重複 | 7 describe は endpoint 単位で直交。重複なし |
| 4 | `as const` 固定 | fixture object はすべて `as const` で固定済 |

## 2. 命名規則の最終チェック

| 対象 | 規則 |
|------|------|
| ファイル名 | `contract-stage-2.test.ts`（kebab-case + `.test.ts`、既存 `apps/api/src/audit-correlation/__tests__/contract.test.ts` と整合） |
| describe 名 | `<METHOD> <path>` 形式（例: `POST /admin/identity-conflicts/:id/merge`） |
| it 名 | 日本語可。`<対象> が <期待挙動>` 形式で観測可能性を明示 |
| fixture 定数 | camelCase + 役割サフィックス（`adminRequestItem` / `mergeResponseBody` / `auditEntry`） |

## 3. 削除すべきもの

| # | 対象 | 理由 |
|---|------|------|
| 1 | `console.log` / `debugger` | テストコードに残さない |
| 2 | 未使用 import | `@ubm-hyogo/api` lint で検出。auto-fix で削除 |
| 3 | TODO コメント | 0 件（本 spec は持越しなし） |
| 4 | `z.object(` で書かれた schema | 0 件（CONST_007 重複禁止） |

## 4. 受け入れ基準

| # | 基準 |
|---|------|
| R1 | `@ubm-hyogo/api` lint warning = 0 |
| R2 | spec 内 `console.log` / `debugger` = 0 |
| R3 | TODO コメント = 0 |
| R4 | `z.object(` = 0 |
| R5 | 行数 251 を維持し、外部抽出による過剰設計を避ける |
| R6 | route 3 ファイルの diff が各 +1 字句〜+1 行に収まり、route 内部参照に影響を与えていない |
