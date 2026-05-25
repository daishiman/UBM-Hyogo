---
phase: 1
title: 要件定義
workflow_id: issue-880-public-segment-error-loading-boundary
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

## 0. 前提

- `apps/web/app/(public)/layout.tsx` 配置済（parallel-03 完了済）
- 親 `apps/web/app/error.tsx` / `loading.tsx` 配置済（serial-05 完了済）
- `(admin)/admin/error.tsx` / `loading.tsx` 配置済（scope `"admin"` パターン確立済）
- OKLch design tokens（task-09）正本稼働中
- `serial-06-form-response-binding` 仕様書では Phase 5 §0 で `(public)/error.tsx` / `loading.tsx` の存在を precondition として grep するが、現コードでは未配置 → drift

## 1. 解決すべき要件

`(public)` segment 専用の error boundary と loading skeleton を明示配置し、`apps/web/app/error.tsx` 継承に依存しない構造に整える。`(admin)` パターンと対称な scope tagging（`scope: "public"`）で logger 連携する。

### 1.1 機能要件

| ID | 要件 | 根拠 |
|----|------|------|
| FR-01 | `apps/web/app/(public)/error.tsx` を新規追加する。`"use client"` 宣言、`{ error, reset }` props、`logger.error({ event: "error.boundary.caught", scope: "public", digest, err })` を含む | `(admin)/admin/error.tsx` 既存パターンに対称化 |
| FR-02 | `apps/web/app/(public)/loading.tsx` を新規追加する。`role="status"` / `aria-busy="true"` / `aria-live="polite"` / skeleton DOM | 親 `apps/web/app/loading.tsx` 既存パターンに整合 |
| FR-03 | error UI に 2 つの導線リンクを含む: `/members`（会員一覧へ戻る）と `/`（トップへ戻る）。`reset()` ボタンも含む | issue #880 完了条件 / unassigned-task §2.4 |
| FR-04 | loading UI は `(public)` AppShell（warm theme）下で違和感のない skeleton を表示し、`data-route="public"` / `data-page="loading"` を持つ | parallel-03 AppShell 整合 |
| FR-05 | error UI は `Card` / `Button` / `Link` primitive のみで構成。新規 primitive を生やさない | プロトタイプ正本順位 / CLAUDE.md 不変条件 |
| FR-06 | Playwright force-throw smoke 1 ケースを追加し、`(public)/error.tsx` が `(public)` AppShell 配下で発火することを assertion する | 完了条件 |
| FR-07 | `serial-06-form-response-binding/phase-12-compliance-check.md` 末尾に「followup-001 backfill 完了」note を追加する | precondition drift 解消 evidence |

### 1.2 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | OKLch トークン正本性。HEX 直書き / `bg-[#xxx]` 禁止（CI `verify-design-tokens` で grep） |
| NFR-02 | テスト suffix は `*.spec.{ts,tsx}` のみ（不変条件 #8） |
| NFR-03 | `mise exec -- pnpm typecheck` / `lint` exit 0 |
| NFR-04 | `bash scripts/verify-pr-ready.sh` exit 0 |
| NFR-05 | `next build --webpack` で OpenNext Workers bundle build green（既存 build 系を破壊しない） |
| NFR-06 | `process.env.*` 直接参照禁止（apps/web は `getEnv()` 経由のみ）。ただし dev 判定 `NODE_ENV !== "production"` は親 `error.tsx` と同パターン許容（既存実装と対称） |
| NFR-07 | a11y: `role="alert"` / `aria-live="assertive"`（error）、`role="status"` / `aria-live="polite"`（loading）。focus 移動は `useAutoFocusOnMount` で heading に当てる |
| NFR-08 | `process.env.NODE_ENV !== "production"` 時のみ stack trace 表示（既存 `error.tsx` と同パターン） |

## 2. 不変条件

CLAUDE.md「UI prototype alignment / MVP recovery」の不変条件継承：

1. 既存 API endpoint のみ接続（本 task は UI-only のため対象外）
2. OKLch トークン正本化
3. プロトタイプ正本順位（既存 `Card` / `Button` のみ使用）
4. D1 直接アクセス禁止（本 task は対象外）

追加:

5. logger scope は `"public"` 固定（admin は `"admin"`、root は無印）
6. `(public)` segment 固有の文言・導線を採用（汎用 root の文言を流用しない）

## 3. ステークホルダー観点

| 系統 | 観点 |
|------|------|
| システム系 | 親 `error.tsx` フォールバックで実害ゼロだが、`(public)` 固有 UI が出せず、将来 register / members 導線追加に boundary 追加から始める手間が残る |
| 戦略系 | 公開導線（`/members` / `/register`）への誘導は MVP 体験の根幹。エラー時にユーザーを公開ディレクトリへ戻す動線が segment-aware である必要 |
| 問題解決系 | 真の論点は「serial-06 precondition との drift を放置するか解消するか」。drift を残すと後続 phase でレビュー摩擦 → 解消が正解 |

## 4. 完了条件

- [ ] FR-01 〜 FR-07 全て満たす
- [ ] NFR-01 〜 NFR-08 全て満たす
- [ ] Phase 11 で Playwright smoke screenshot 取得済
- [ ] Phase 12 で serial-06 への backfill 完了
