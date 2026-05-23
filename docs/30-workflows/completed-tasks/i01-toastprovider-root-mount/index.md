# i01-toastprovider-root-mount - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/web/app/layout.tsx` への `ToastProvider` import + JSX wrap という具体的なコード変更を伴う。ドキュメント単独では DoD を満たせない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | I01-TOAST-ROOT-MOUNT |
| タスク名 | ToastProvider を root layout に配置（parallel-08 DoD 残務） |
| ディレクトリ | docs/30-workflows/completed-tasks/i01-toastprovider-root-mount |
| 親タスク | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes |
| 原典 spec | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i01-toastprovider-root-mount/spec.md |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 状態 | implemented_local_evidence_captured |
| タスク種別 | implementation / VISUAL_ON_EXECUTION（UI 上 Toast の挙動に影響。authenticated visual smoke は user-session gate） |
| 優先度 | HIGH（serial-05/step-01..07 unblock 条件） |
| GitHub Issue | 未起票（本サイクル内で起票判断） |

## 目的

`parallel-08-shared-foundation` (#745) で導入された `useAdminMutation` hook が内部で `useOptionalToast()` 経由で toast を発火することを前提としているが、root layout (`apps/web/app/layout.tsx`) に `ToastProvider` が**未配置**であるため、context が null のまま hook が動作し、admin mutation の成功/失敗 toast が **silent fail** する状態にある。

本タスクは:
1. root layout に `ToastProvider` を 1 段挟む
2. `Toast.tsx` の client directive 状態を確認した上で適切な import 経路を採用
3. `useAdminMutation` 配下の toast 動作を unit / manual で確認

を完了させ、serial-05/step-01..07 の admin mutation UI 実装が toast 機能を含めて動作する状態を作る。

## スコープ

### 含む

- `apps/web/app/layout.tsx` への `ToastProvider` import + children wrap
- `Toast.tsx` が `"use client"` 未指定だった場合の wrapper component (`ToastProviderClient.tsx`) 新設（条件付き）
- `useAdminMutation` の既存テストが toast context resolved 状態で PASS することの確認
- Phase 11 の visual smoke（admin route で toast を意図的に発火させ目視）

### 含まない

- `Toast.tsx` 本体の API / variant 変更
- 新規 toast a11y 設定変更
- admin 以外の領域での toast 利用拡大
- D1 / API endpoint 変更
- design token / OKLch 変更

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i01-toastprovider-root-mount/spec.md | 原典 spec |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md | p-08 DoD line 172 |
| 必須 | apps/web/app/layout.tsx | 変更対象 root layout |
| 必須 | apps/web/src/components/ui/Toast.tsx | ToastProvider 実体 |
| 必須 | apps/web/src/features/admin/hooks/useAdminMutation.ts | toast consumer |
| 必須 | CLAUDE.md | OpenNext Workers / Next.js 16 制約 |
| 参考 | docs/00-getting-started-manual/claude-design-prototype/ | UI 正本 |

## 受入条件 (AC)

- **AC-1**: `apps/web/app/layout.tsx` で `<ToastProvider>` が `{children}` を wrap している。
- **AC-2**: `Toast.tsx` の client boundary 状態が `outputs/phase-02/client-boundary-decision.md` で判定済みで、採用された import path が記載されている。
- **AC-3**: `useAdminMutation.spec.tsx` の既存テストが、toast を mock しないパスで silent fail（context null warn）を出さない。
- **AC-4**: dev server (`pnpm -F "@ubm-hyogo/web" dev`) で admin route から mutation を発火し、toast が実 DOM に表示されることを目視確認した evidence が `outputs/phase-11/manual-smoke.md` に記録されている。authenticated admin session が必要なため、本サイクルでは root mount + build evidence を local PASS、実ブラウザ toast 表示を user-session runtime gate とする。
- **AC-5**: `pnpm typecheck` / `pnpm lint` が PASS。
- **AC-6**: p-08 spec line 172 の DoD checkbox `[ ] ToastProvider in root layout` が満たされる。
- **AC-7**: hydration mismatch / RSC error が dev / build いずれでも発生しない。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/{client-boundary-decision,wrapper-strategy}.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/design-review.md |
| 4 | タスク分解 | phase-04.md | completed | outputs/phase-04/task-breakdown.md |
| 5 | 実装計画 | phase-05.md | completed | outputs/phase-05/implementation-plan.md |
| 6 | 実装手順 | phase-06.md | completed | outputs/phase-06/implementation-steps.md |
| 7 | テスト計画 | phase-07.md | completed | outputs/phase-07/test-plan.md |
| 8 | ドキュメント更新 | phase-08.md | completed | outputs/phase-08/docs-updates.md |
| 9 | 受入確認 | phase-09.md | completed | outputs/phase-09/acceptance.md |
| 10 | リファクタ | phase-10.md | completed | outputs/phase-10/refactor-summary.md |
| 11 | Visual evidence | phase-11.md | implemented_local_evidence_captured_runtime_visual_pending | outputs/phase-11/manual-smoke.md |
| 12 | 正本同期 | phase-12.md | completed | outputs/phase-12/{main,implementation-guide,phase12-task-spec-compliance-check}.md |
| 13 | PR・振り返り | phase-13.md | blocked_pending_user_approval | outputs/phase-13/pr-summary.md |

## 不変条件

1. `Toast.tsx` の既存 public API は変更しない（破壊変更禁止）
2. RSC ⇄ client boundary の正しい配置（Next.js 16 App Router の規約準拠）
3. `apps/web` から D1 直接アクセス禁止（本タスクの変更には無関係だが継承）
4. HEX 直書き禁止（本タスクの変更には CSS なし、継承）
5. `pnpm typecheck` / `pnpm lint` PASS
6. CONST_007 遵守: 本サイクル内で Phase 1〜12 と local implementation を完了させる。Phase 13 (commit / push / PR) は user-gated

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| `Toast.tsx` が `"use client"` 未指定で server component 配下に置けない | Phase 2 で client wrapper 新設方針を決定 |
| hydration mismatch（context 配下で SSR と client 差分） | Phase 2 で wrapper を最小化（state を持たない pass-through） |
| 既存 `useAdminMutation.spec.tsx` の mock 構造が壊れる | mock は spec 側で provider をテスト wrap している前提を Phase 7 で確認 |
| serial-05 が未着手のため effect を観測しにくい | Phase 11 で admin/members route の delete dialog 等から手動 toast を発火 |

## Phase マップ

```
phase-01 (要件定義)
  └─ outputs/phase-01/requirements.md
       ▼
phase-02 (設計: client boundary)
  ├─ outputs/phase-02/client-boundary-decision.md
  └─ outputs/phase-02/wrapper-strategy.md
       ▼
phase-03 (設計レビュー)
  └─ outputs/phase-03/design-review.md
       ▼
phase-04..10 (タスク分解→実装→リファクタ)
       ▼
phase-11 (visual evidence)
       ▼
phase-12 (正本同期)
       ▼
phase-13 (PR / user-gated)
```

## 注意点

- 本タスクの code 変更は 1〜10 行と極めて小さいが、Phase 1〜13 を踏襲する理由は: p-08 DoD 未達の正規ループ閉鎖と、serial-05 unblock の責任所在を明示するため。
- 本仕様書は `integration-fixes/parallel-i01-toastprovider-root-mount/spec.md` を **mother spec** とし、本 13-phase 文書はその execution 用展開版である。
