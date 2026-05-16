# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase で確定する要件は、後続 Phase で `apps/web` 配下に新規モジュール（hook / component / test）を実装する前提となる。コード変更を伴う実装タスクの入力定義。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-01 members-note mutation UI |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |
| artifacts.json.metadata.visualEvidence | VISUAL（drawer 内 notes section / form の screenshot を Phase 11 で取得） |

## 目的

step-01-members-note を `apps/web` admin 系 mutation UI の **entry point** として確立し、後続 step-02..08 が共有する `useAdminMutation` hook の I/O 契約・error shape・副作用契約を Phase 1 で固定する。

## 真の論点

### 論点 1: hook の汎用度

**選択肢**:
- **(A) admin 専用 thin hook**: `useAdminMutation` は admin endpoint だけを前提。401/403 を `FetchAuthedError` として throw する。**第一推奨**（step-02..08 がすべて admin 系のため）
- **(B) 汎用 hook**: 任意の endpoint で再利用可能にする。abstraction 過剰で YAGNI。**不採用**
- **(C) endpoint ごとに専用 hook**: 共通化メリットが消失。step-02..05 で 5 hook 重複。**不採用**

→ **(A) を採用**。

### 論点 2: server state 再取得方式

**選択肢**:
- **(A) `router.refresh()` のみ**: Next.js App Router 標準の server component re-render。RSC 流儀。**第一推奨**
- **(B) SWR / React Query 導入**: 既存 stack に存在しない。MVP scope 外。**不採用**
- **(C) 手動 fetch 再実行**: state 管理が hook 利用者側に漏れる。**不採用**

→ **(A) `router.refresh()` を採用**。hook 内で常に実行。

### 論点 3: validation 配置

**選択肢**:
- **(A) client side + server side 両方**: client は zod schema (`body.min(1).max(2000)`)、server は既存 zod。UX 向上のため。**第一推奨**
- **(B) server side のみ**: 422 まで往復が必要で UX が悪い。**不採用**

→ **(A) を採用**。client schema は `apps/web/src/features/admin/components/_members/NoteForm.tsx` 内に閉じる。

### 論点 4: error response の parse 戦略

API 側の error shape (`apps/api/src/routes/admin/member-notes.ts` から確認):
```ts
{ ok: false, error: string, message?: string, details?: unknown }
```

→ hook 内部で `body.message ?? body.error ?? "サーバーエラー"` を toast に表示する。409/422 などは利用側 `onError` で個別マッピング。

## 受入条件 (AC) → index.md 転記

AC-1〜AC-10 は index.md を参照。

## 依存境界と責務

| 種別 | 対象 | 境界 |
| --- | --- | --- |
| 上流（実装済） | `apps/api/src/routes/admin/member-notes.ts` | I/O 契約に従う・改変禁止 |
| 上流（未実装・並列） | parallel-08 ToastProvider | root layout 配置は別タスク。本タスクは toast 関数 import を前提に書く |
| 上流（未実装・並列） | parallel-10 auth-session | `FetchAuthedError` / 401 redirect の責務は別タスク |
| 下流 | step-02..08 | 本 Phase で確定した hook surface を import して使う |
| 対象外 | D1 schema / API 仕様変更 | 変更禁止 |

## 実行タスク

- [ ] 原典 spec.md (`step-01-members-note/spec.md`) を熟読し論点を抽出する
- [ ] API `apps/api/src/routes/admin/member-notes.ts` の正 / 異常応答 shape を `rg` で確定する
- [ ] 既存 `apps/web/src/features/admin/` 配下の hook / component 構造を `ls`+`rg` で確定する
- [ ] toast library 依存（`sonner` / 既存ラッパー）を `package.json` から特定する
- [ ] AC-1〜AC-10 を `outputs/phase-01/requirements.md` に固定する
- [ ] 真の論点 1-4 の採択結果を `outputs/phase-01/논점-decisions.md` に記録する

## 参照資料

- 原典: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-01-members-note/spec.md`
- API 正本: `apps/api/src/routes/admin/member-notes.ts`
- Drawer 拡張対象: `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`
- design token: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション

## 統合テスト連携

Phase 8 統合テストで以下を確認する前提を Phase 1 で記録する:
- POST `/api/admin/members/:memberId/notes` が NoteForm 経由で 201 を返す
- PATCH `/api/admin/members/:memberId/notes/:noteId` が NoteForm 経由で 200 を返す
- `router.refresh()` 後に drawer の note 一覧が更新される

## 多角的チェック観点

- UX: toast 表示位置 / 非同期送信中の disabled / cancel 挙動
- a11y: label↔input の `htmlFor` / aria-invalid / aria-describedby
- security: XSS（textarea の body を sanitize 不要、表示時は React の default escape に依存）
- performance: `router.refresh()` 頻度 (1 mutation = 1 refresh)

## 成果物

- `outputs/phase-01/requirements.md` — AC 固定
- `outputs/phase-01/논점-decisions.md` — 真の論点 4 件の採択
- `outputs/phase-01/api-contract-evidence.md` — API shape の rg 抽出証跡

## 完了条件

- [ ] AC-1〜AC-10 を index.md と requirements.md の両方に同文で記載
- [ ] 論点 1-4 の採択根拠が記録されている
- [ ] API shape を実コード（`apps/api/src/routes/admin/member-notes.ts`）から抜粋して固定
- [ ] toast library / `router.refresh()` の import 元 path が確定
- [ ] coverage AC（Statements/Branches/Functions/Lines >=80%）を AC に明記
- [ ] `bash scripts/coverage-guard.sh` を Phase 6 / 9 / 11 完了条件に紐づける旨を記載

## タスク100%実行確認【必須】

- [ ] 実行タスク全完了
- [ ] 成果物 3 件 commit-ready
- [ ] Phase 2 開始 gate（要件未確定なら NO-GO）

## 次Phase

Phase 2 (設計): hook / component / drawer 拡張の関数シグネチャ・I/O・DI 境界を確定する。
