# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
|---|---|
| タスク ID | issue-879-safe-server-fetch-member-public-horizontal-expansion |
| Phase | 1 / 13 |
| 実装区分 | 実装仕様書（CONST_004 デフォルト） |
| タスク分類 | NON_VISUAL（UI コンポーネント追加はあるが視覚回帰なし。既存 OKLch token のみ使用） |
| implementation_mode | new |
| 関連 issue | #879（CLOSED 維持） |
| 依存タスク | `admin-ui-prototype-alignment`（完了済・admin 側 SafeResult 実装の参照元） |

## 目的

issue #879 が指摘した admin 層 / member-public 層の per-section degrade 非対称を 1 サイクル（CONST_007）で解消する。コードレベルで以下 3 server component を SafeResult ベースへ移行し、共通 lib に SSOT 集約する。

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|---|---|---|
| current branch に実装が存在する | No（admin のみ存在・本サイクルで横展開） | 通常実装フロー |
| upstream（dev）に admin SafeResult がマージ済み | Yes（admin-ui-prototype-alignment にて merged） | 再実装しない・共通 lib 抽出のみ |
| 横展開対象 page のパスが issue と一致 | No（`(member)/profile` 表記 vs 実体 `app/profile/`） | 現コードに最適化（実体パスを正本とする） |

## 受入条件（AC）

index.md §4 の AC-1〜AC-8 を正本とする。

## inventory（現行コードベースの確定事実）

| 確認項目 | 実測値 | 根拠 |
|---|---|---|
| 共通 SafeResult 型 | `apps/web/src/lib/result.ts`（layer 中立） | 既存 |
| admin safeServerFetch | `apps/web/src/lib/admin/safe-server-fetch.ts`（admin 専用 fetchAdmin 依存） | 既存 |
| `/profile` 構造 | `Promise.all([fetchAuthed("/me"), fetchAuthed("/me/profile")])` を try/catch、再 throw | `apps/web/app/profile/page.tsx:35-48` |
| `/(public)/members` 構造 | `await listMembers(search, {...})` 単発、catch なし | `apps/web/app/(public)/members/page.tsx:47` |
| `/(public)/members/[id]` 構造 | `fetchPublicOrNotFound` を try/catch、`FetchPublicNotFoundError` のみ notFound、その他 re-throw | `apps/web/app/(public)/members/[id]/page.tsx:25-37` |
| 既存 fetch helper | `apps/web/src/lib/fetch/authed.ts` / `apps/web/src/lib/fetch/public.ts` | 既存（変更しない） |

## 不変条件

1. 既存 API endpoint surface を変更しない（CLAUDE.md UI prototype alignment 不変条件 #1）
2. D1 直接アクセス禁止（CLAUDE.md #5）
3. 新規 primitive / 新規 visual 仕様を導入しない（不変条件 #3）
4. OKLch token 正本化を維持・HEX 直書き禁止（不変条件 #2）
5. test ファイルは `*.spec.{ts,tsx}` のみ（CLAUDE.md #8）
6. admin layer の既存 import path (`@/lib/admin/safe-server-fetch`) を破壊しない

## 成果物

- 本ファイル

## 完了条件

- index.md §4 の AC が確定し、本 Phase で全 AC の検証可能性を確認している
- inventory が現行コードベースの確定事実で埋まっている
