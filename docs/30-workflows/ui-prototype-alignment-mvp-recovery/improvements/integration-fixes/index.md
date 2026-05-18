# integration-fixes — improvements の並列タスク接続検証で検出された 7 件のギャップ

**[実装区分: 実装仕様書群]** — 全タスクともコード変更を伴う

## 1. 背景

`improvements/` 配下の parallel-01..10 を個別 PR (#737, #740, #743, #744, #745, #750 他) で順次マージしたが、
**各タスクが宣言した「外部接続点（exports / hooks / providers / 動線 / class）」が他タスクから実際に
利用されているか** は単体マージ時点では検証されない。

本ワークフローは、コード実体での依存接続検証（実 grep / file read）で検出された 7 件の未接続/部分接続を
管理する。2026-05-16 時点では i01 のみ `docs/30-workflows/completed-tasks/i01-toastprovider-root-mount/` で実装完了し、i02〜i07 は本 index 配下の active integration-fix spec として残る。

## 2. 検出結果（接続検証 evidence）

| # | 検出ギャップ | 該当 parallel | 実コード evidence |
|---|-------------|--------------|------------------|
| i01 | (完了) `ToastProvider` が root layout に配置済み | p-08 DoD 達成 | `apps/web/app/layout.tsx` が `<ToastProvider>{children}</ToastProvider>` で wrap |
| i02 | `useAdminMutation` が独自 `AdminMutationHttpError` を定義し `FetchAuthedError` / `AuthRequiredError` と乖離 | p-08 ↔ p-10 | `apps/web/src/features/admin/hooks/useAdminMutation.ts:58` で独自 class 定義 / `apps/web/src/lib/fetch/authed.ts:17,24` に既存 error class |
| i03 | dialog の `router.refresh()` 呼び出し位置が spec と乖離（close 後発火リスク） | p-02 spec 違反 | `RequestActionPanel.tsx:57` で `refresh()` を onSubmitted callback に置く実装。spec は dialog 内で close 前 |
| i04 | (完了) `CallToActionCTA` を HomePage に実装済み | p-06 DoD 達成 | `apps/web/app/page.tsx` が `CallToActionCTA` を mount、`apps/web/src/components/public/CallToActionCTA.tsx` 作成済み、Phase 11 screenshot 3 件保存 |
| i05 | `/login/loading.tsx` 未作成 + `/login/error.tsx` の focus 管理 / Card layout 未適用 | p-07 DoD 未達 | `apps/web/app/login/loading.tsx` 不在 / `error.tsx` は `useRef` / `tabIndex` なし |
| i06 | root `error.tsx` の h1 自動 focus 未実装 | p-07 spec 4.3 未達 | `apps/web/app/error.tsx` で `useRef` / `headingRef.current?.focus()` なし |
| i07 | `/profile/loading.tsx` が簡素テキストのみで OKLch skeleton 未適用 | p-07 spec 4.5 未達 | `apps/web/app/profile/loading.tsx` は `<p aria-live="polite">読み込み中…</p>` のみ |

## 3. ディレクトリ構成

```
integration-fixes/
├─ index.md  (本書)
├─ parallel-i01-toastprovider-root-mount/spec.md
├─ parallel-i02-admin-error-type-unify/spec.md
├─ parallel-i03-dialog-refresh-order/spec.md
├─ parallel-i04-homepage-cta/spec.md
├─ parallel-i05-login-loading-and-error-focus/spec.md
├─ parallel-i06-root-error-focus/spec.md
└─ parallel-i07-profile-loading-skeleton/spec.md
```

## 4. 並列性

7 件すべて編集対象ファイルが分離しており並列実行可能。

| spec | 主要編集ファイル | 衝突可能性 |
|------|----------------|----------|
| i01 | `apps/web/app/layout.tsx` | なし |
| i02 | `apps/web/src/features/admin/hooks/useAdminMutation.ts`, `apps/web/src/lib/fetch/authed.ts`（型 export 拡張のみ） | なし |
| i03 | `apps/web/app/profile/_components/VisibilityRequestDialog.tsx`, `DeleteRequestDialog.tsx`, `RequestActionPanel.tsx` | なし |
| i04 | `apps/web/app/page.tsx`, `apps/web/src/components/public/CallToActionCTA.tsx` (新規) | なし |
| i05 | `apps/web/app/login/loading.tsx` (新規), `apps/web/app/login/error.tsx` | なし |
| i06 | `apps/web/app/error.tsx` | なし |
| i07 | `apps/web/app/profile/loading.tsx` | なし |

## 5. 完了条件（workflow DoD）

- [ ] 各 spec の DoD がすべて満たされる
- [ ] `pnpm typecheck` / `pnpm lint` がローカル PASS
- [ ] 単体接続確認:
  - i01: `ToastProvider` mount 後、`useToast()` が context resolved 状態（hook console.warn なし）— local build/static evidence PASS、authenticated visual smoke は user-session gate
  - i02: `useAdminMutation` の 401/403 path で共有 error type が throw されること（test PASS）
  - i03: dialog 内で `router.refresh() → onSubmitted → onClose` の順序で呼び出されること（test PASS）
  - i04: `/` 訪問時に CTA section が render されること
  - i05: `/login/loading.tsx` 存在 + `/login/error.tsx` で h1 focus が当たること
  - i06: root `error.tsx` で h1 focus が当たること
  - i07: `/profile/loading.tsx` が skeleton で render され role=status を持つこと

## 6. 不変条件（継承）

`improvements/index.md` の 5 条件すべて継承（既存 API surface のみ / OKLch / prototype 正本 / D1 直接禁止 / `.spec.{ts,tsx}` 命名）。

## 7. 残タスク追跡

本 i01 close-out の範囲は `ToastProvider` root mount のみ。i02〜i07 は別 active spec として同ディレクトリ配下に残し、formal task は `docs/30-workflows/unassigned-task/` に登録済み。

| spec | 状態 | 追跡場所 |
| --- | --- | --- |
| i01 | completed locally | `docs/30-workflows/completed-tasks/i01-toastprovider-root-mount/` |
| i02 | spec_ready_implementation_pending | `parallel-i02-admin-error-type-unify/spec.md` / `docs/30-workflows/unassigned-task/integration-fixes-i02-admin-error-type-unify.md` |
| i03 | spec_ready_implementation_pending | `parallel-i03-dialog-refresh-order/spec.md` / `docs/30-workflows/unassigned-task/integration-fixes-i03-dialog-refresh-order.md` |
| i04 | completed locally | `docs/30-workflows/integration-fixes-i04-homepage-cta-implementation/` / `parallel-i04-homepage-cta/spec.md` / `docs/30-workflows/unassigned-task/integration-fixes-i04-homepage-cta.md` |
| i05 | spec_ready_implementation_pending | `parallel-i05-login-loading-and-error-focus/spec.md` / `docs/30-workflows/unassigned-task/integration-fixes-i05-login-loading-and-error-focus.md` |
| i06 | spec_ready_implementation_pending | `parallel-i06-root-error-focus/spec.md` / `docs/30-workflows/unassigned-task/integration-fixes-i06-root-error-focus.md` |
| i07 | spec_ready_implementation_pending | `parallel-i07-profile-loading-skeleton/spec.md` / `docs/30-workflows/unassigned-task/integration-fixes-i07-profile-loading-skeleton.md` |

## 8. 参照

- 上位: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/index.md`
- 検証元 PR: #737, #740, #743, #744, #745, #750（および p-01..p-04 単独 merge）
- 各 parallel spec の DoD（i01〜i05 で個別参照）
