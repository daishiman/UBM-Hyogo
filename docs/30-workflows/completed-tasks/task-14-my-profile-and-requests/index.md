# task-14: my-profile-and-requests — Phase 1-13 実装仕様書パッケージ

> 改訂日: 2026-05-09
> 起票元: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/06-screens-member/task-14-w5-par-my-profile-and-requests.md`
> 実装区分: **実装仕様書**（CONST_004 デフォルト適用）
> taskType: `implementation`
> visualEvidence: `VISUAL_ON_EXECUTION`
> workflow_state: `IMPLEMENTED_LOCAL_RUNTIME_PENDING`
> implementation_status: `implemented_local_runtime_pending`
> 出力先 dir: `docs/30-workflows/task-14-my-profile-and-requests/`
> 対象 PR base: `dev`

---

## 0. パッケージ概要

`/profile`（会員マイページ）を prototype 準拠の **4 領域構成**にリビルドし、
公開状態 3 値（public / member_only / hidden）と pending 申請を OKLch tokens のみで描画する task-14 を、
task-specification-creator skill の **Phase 1-13** に分解した実装仕様書パッケージ。

> **重要不変条件**:
> - `apps/api/src/routes/me/*` および `apps/web/app/api/me/*` の API surface 追加・変更 0 件
> - 本人プロフィール本文の編集 UI は描画しない（MVP は Form 再回答が更新経路）
> - HEX 直書き禁止・OKLch tokens 経由のみ
> - 楽観的 UI は採用しない（pending は `router.refresh()` で server から再取得）

---

## 1. Phase 一覧

| Phase | 文書 | 目的 |
|-------|------|------|
| 1 | [phase-1.md](./phase-1.md) | 要件定義 / ゴール・非ゴール・DoD |
| 2 | [phase-2.md](./phase-2.md) | ドメイン分析 / 用語・状態・不変条件 |
| 3 | [phase-3.md](./phase-3.md) | アーキテクチャ設計 / 4 領域構造 / DAG 配置 |
| 4 | [phase-4.md](./phase-4.md) | データ設計 / 型・DTO・adapter |
| 5 | [phase-5.md](./phase-5.md) | API 契約 / 既存 surface（参照のみ） |
| 6 | [phase-6.md](./phase-6.md) | UI / Component 設計（Props・状態） |
| 7 | [phase-7.md](./phase-7.md) | テスト設計 / Vitest / Playwright / a11y |
| 8 | [phase-8.md](./phase-8.md) | 実装計画 / 順序・ファイル table |
| 9 | [phase-9.md](./phase-9.md) | 実装ガイド（コードレベル詳細） |
| 10 | [phase-10.md](./phase-10.md) | 品質検証 / lint・typecheck・tokens gate |
| 11 | [phase-11.md](./phase-11.md) | デプロイ / staging smoke 手順 |
| 12 | [phase-12.md](./phase-12.md) | 中学生レベル概念解説（教育用） |
| 13 | [phase-13.md](./phase-13.md) | クローズアウト / PR 本文・受け入れチェック |

---

## 2. 1 サイクル完了原則（CONST_007）

本パッケージの全 phase は **後続 03.実装.md の 1 サイクル内で完了するスコープ**。
phase 分割は「関心ごとの分離」であり、先送り目的ではない。
未タスク / バックログ送りは存在しない。

---

## 3. 触れるファイル全列挙（write 対象）

```
apps/web/app/profile/page.tsx                                   M
apps/web/app/profile/_components/PublicVisibilityBanner.tsx     C (new)
apps/web/app/profile/_components/StatusSummary.tsx              M (rebuild)
apps/web/app/profile/_components/RequestActionPanel.tsx         M (minor)
apps/web/app/profile/_components/VisibilityRequestDialog.tsx    M (Dialog primitive 化)
apps/web/app/profile/_components/DeleteRequestDialog.tsx        M (Dialog primitive 化)
apps/web/app/profile/_components/RequestPendingBanner.tsx       M (minor)
apps/web/app/profile/_components/RequestErrorMessage.tsx        M (minor)
apps/web/app/profile/_components/__tests__/*                    M / C
e2e/profile-smoke.spec.ts                                       M (append)
```

read（参照のみ・変更禁止）:
- `apps/web/app/api/me/[...path]/route.ts`
- `apps/web/app/api/me/visibility-request/route.ts`
- `apps/web/app/api/me/delete-request/route.ts`
- `apps/api/src/routes/me/{index,services,schemas}.ts`
- `apps/web/src/lib/api/me-types.ts`
- `apps/web/src/lib/fetch/authed.ts`

---

## 4. 完了 DoD（パッケージ全体）

| ID | 条件 |
|----|------|
| D-1a | 5 `data-region` selector が local 実装に反映される |
| D-1b | 4 領域すべてが prototype 準拠で描画される（Phase 11 screenshot 取得後に判定） |
| D-2 | profile token grep gate pass（HEX 直書き 0） |
| D-3 | `pnpm typecheck` / `pnpm lint` green |
| D-4 | Vitest（component / dialog / banner）green |
| D-5 | Playwright `e2e/profile-smoke.spec.ts` 全 case green |
| D-6 | a11y: jest-axe critical violation 0 |
| D-7 | `apps/api/src/routes/me/*` git diff 0 / `apps/web/app/api/me/*` 追加 0 |
| D-8 | 未ログインで `/profile` 踏む → `/login?redirect=/profile` redirect |

---

## 5. 実行境界 / user gate

このパッケージは **実装仕様書の正本化**までを完了状態とする。`apps/web` 実装、Playwright visual/runtime evidence、staging deploy、production smoke、24h Sentry observation、commit、push、PR 作成はすべてユーザー明示承認後に実行する。

runtime evidence 未取得のため root state は `completed` ではなく `IMPLEMENTED_LOCAL_RUNTIME_PENDING` とする。Phase 11 は `runtime_pending`、Phase 13 は `pending_user_approval` で固定する。
