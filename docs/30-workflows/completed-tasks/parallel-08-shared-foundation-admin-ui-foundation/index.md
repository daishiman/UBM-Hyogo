# parallel-08-shared-foundation-admin-ui-foundation

## メタ情報

| 項目 | 値 |
|------|----|
| taskId | `parallel-08-shared-foundation-admin-ui-foundation` |
| workflow | `ui-prototype-alignment-mvp-recovery` |
| 実装区分 | **実装仕様書**（コード変更を伴う） |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `implemented_local_evidence_captured` |
| implementation_status | `implementation_complete_pending_pr` |
| implementationCategory | `standard` |
| createdDate | 2026-05-15 |
| 依存 | serial-05/step-01 より**前**に完了必須（後続 import を unblock） |
| 並列性 | parallel-01..07 と独立 |

## 実装区分判定根拠

ソース spec は構造宣言が主目的だが、以下が**コード変更**であるため実装仕様書に分類する:

1. `apps/web/app/layout.tsx` の root に `ToastProvider` を実配置（modify）
2. `apps/web/src/features/admin/hooks/useAdminMutation.ts` を**新規作成**（type signature + skeleton）
3. `apps/web/src/features/admin/hooks/index.ts` を**新規作成**（barrel export）

確認のみで終わるのは `middleware.ts` / `(admin)/admin/error.tsx` / API error contract の 3 点で、これらは Phase 1 inventory で実測 evidence を残す。

## スコープ

### 含む
- root layout への `ToastProvider` 配置
- `useAdminMutation` 型シグネチャ宣言（implementation は `throw new Error("implementation in step-01")` の skeleton）
- `hooks/index.ts` での barrel export
- `(admin)/admin/error.tsx` / `middleware.ts` / API error response inventory の整合確認

### 含まない
- `useAdminMutation` の実装本体（serial-05/step-01 責任）
- 新規 API endpoint / D1 schema 変更
- OKLch token 変更 / Tailwind 直書き HEX

## 変更対象ファイル一覧

| Path | 種別 | 概要 |
|------|------|------|
| `apps/web/app/layout.tsx` | modify | `<body>` 直下を `<ToastProvider>` で wrap |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | create | hook 型 + skeleton |
| `apps/web/src/features/admin/hooks/index.ts` | create | barrel export |
| `apps/web/app/(admin)/admin/error.tsx` | confirm | 既存実装の reset button / メッセージ確認 |
| `apps/web/middleware.ts` | confirm | `/admin/:path*` matcher / isAdmin guard 確認 |
| API error response | confirm | 既存 `{ error: string }` / `{ ok: false, error: string }` 形の棚卸し |

> ソース spec の `(admin)/error.tsx` は誤記。**正は `(admin)/admin/error.tsx`** で本仕様書に反映。

## 参照

- ソース spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md`
- 既存 ToastProvider: `apps/web/src/components/ui/Toast.tsx`
- middleware: `apps/web/middleware.ts`
- admin error boundary: `apps/web/app/(admin)/admin/error.tsx`
- design tokens 不変条件: CLAUDE.md `apps/web env アクセス不変条件` / OKLch tokens 正本化

## Phase 構成

| Phase | 名称 | 状態 |
|-------|------|------|
| 1 | 要件定義 | completed |
| 2 | 設計 | completed |
| 3 | 設計レビュー | completed |
| 4 | テスト作成 | completed |
| 5 | 実装 | completed |
| 6 | テスト実行 | completed |
| 7 | リファクタリング | completed |
| 8 | 統合テスト | completed |
| 9 | ドキュメント更新 | completed |
| 10 | レビュー | completed |
| 11 | NON_VISUAL evidence | completed |
| 12 | Phase 12 strict outputs | completed |
| 13 | PR / 引継ぎ | pending（ユーザー承認待ち） |

## 状態

`workflow_state: implemented_local_evidence_captured`
`implementation_status: implementation_complete_pending_pr`
