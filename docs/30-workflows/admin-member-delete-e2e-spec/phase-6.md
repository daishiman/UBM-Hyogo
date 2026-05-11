# Phase 6: リファクタリング

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. 方針

本タスクは E2E spec 175 行 + SSR fixture gate + 削除後 UI 反映補強の小差分のため、リファクタリング余地は最小限。以下のみ実施対象とする。

| # | 観点 | 判定 |
|---|------|------|
| 1 | mock helper の外部抽出（`apps/web/playwright/helpers/admin-mocks.ts`） | **本タスク範囲外**（Phase 8 別タスクで Stage 2 横断的に抽出） |
| 2 | fixture 定数の重複 | spec 内 inline で完結。重複なし |
| 3 | selector の重複 | dialog 内 selector はチェーン化（`dialog.getByLabel(...)` / `dialog.getByRole(...)`）で重複削減 |
| 4 | `expect` assertion の冗長性 | test #3 で UI disabled と API 到達 0 を明示的に固定 |

## 2. 命名規則の最終チェック

| 対象 | 規則 |
|------|------|
| ファイル名 | `admin-member-delete.spec.ts`（kebab-case + `.spec.ts`、既存 `admin-pages.spec.ts` と整合） |
| describe 名 | `/admin/members × delete`（route × 動詞） |
| test 名 | 日本語可（既存 `admin-pages.spec.ts:11` 準拠） |
| fixture 定数 | `memberListFixture` / `memberDeleteResponse` / `auditEntry`（camelCase + 役割サフィックス） |

## 3. 削除すべきもの

| # | 対象 | 理由 |
|---|------|------|
| 1 | `// debug` `console.log` | テストコードに残さない |
| 2 | 未使用 import | `pnpm lint` で検出。Auto-fix で削除 |
| 3 | TODO のうち Stage 3 持越し以外 | `// TODO(stage-3)` 1 件のみ許容 |

## 4. 受け入れ基準

| # | 基準 |
|---|------|
| R1 | `pnpm lint` warning = 0 |
| R2 | spec 内 `console.log` / `debugger` = 0 |
| R3 | TODO コメントは `// TODO(stage-3)` 1 件のみ |
| R4 | 行数 175 前後を維持し、helper 抽出で過剰設計にしない |
