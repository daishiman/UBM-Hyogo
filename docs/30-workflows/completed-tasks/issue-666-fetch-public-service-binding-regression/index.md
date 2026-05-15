# issue-666-fetch-public-service-binding-regression

[実装区分: 実装仕様書]

> ワークフロー: `issue-666-fetch-public-service-binding-regression`
> Wave: e2e-quality-uplift Stage 3b 派生 regression follow-up
> 担当: 単一実装者(solo dev)
> implementation_mode: `implement_new`(新規ガード + 新規 regression test 追加)
> task classification: 実装タスク(コード変更 + テスト追加)
> visual classification: NON_VISUAL
> workflow_state: `implemented_local_evidence_captured`
> implementation_status: `implementation_complete_pending_pr`

---

## 概要

`apps/web/src/lib/fetch/public.ts` の `getServiceBinding()` が、`PUBLIC_API_BASE_URL` 環境変数の存在のみで service binding を skip する現行ロジックを持つ。これは Stage 3b の Playwright E2E mock 差し替え要件のために導入された fallback 優先化であるが、production / staging Cloudflare Workers runtime で `PUBLIC_API_BASE_URL` が誤って `[vars]` に設定された瞬間に service binding が silent に skip され、以下の production-impact regression を生む。

1. 同一 account `workers.dev` への外向き fetch loopback による 404 再発
2. CLAUDE.md 不変条件 #5(D1 直接アクセスは `apps/api` に閉じる)が deploy 時 env 設定に暗黙依存し、外向きトラフィック流出のセキュリティ境界が形骸化

本タスクで `isTestOrPlaywright()` 環境ガードを導入し、production / staging では service binding を必ず最優先にする。あわせて `apps/web/src/lib/fetch/public.spec.ts` に AC-R-01..R-05 regression test を追加して `pnpm test` で gate する。

## Issue / 関連

- GitHub Issue: [#666](https://github.com/daishiman/UBM-Hyogo/issues/666) (state: open)
- 親 Issue: #608 (e2e-quality-uplift Stage 3)
- 関連: #650 (3b parent)、`task-05a-fetchpublic-service-binding-001`(逆方向 fallback 設計)
- 既存単一仕様書(参照元): `docs/30-workflows/unassigned-task/task-e2e-stage3b-fetch-public-service-binding-priority-regression-001.md`

## 対応 routes / 影響モジュール

| 層 | 影響箇所 |
|---|---|
| 公開層 | `/`, `/(public)/members`, `/(public)/members/[id]` の Server Component server-side fetch 経路 |
| 共通 | `apps/web/src/lib/fetch/public.ts`(transport 選択ロジック) |
| テスト | `apps/web/src/lib/fetch/public.spec.ts` |

## Phase 一覧

| Phase | 名称 | ファイル |
|---|---|---|
| 1 | 要件定義 | [phase-1-requirements.md](./phase-1-requirements.md) |
| 2 | 設計 | [phase-2-design.md](./phase-2-design.md) |
| 3 | 設計レビュー | [phase-3-design-review.md](./phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](./phase-4-test-plan.md) |
| 5 | 実装 | [phase-5-implementation.md](./phase-5-implementation.md) |
| 6 | テスト追加 | [phase-6-test-additions.md](./phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](./phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](./phase-8-refactor.md) |
| 9 | QA | [phase-9-qa.md](./phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](./phase-10-final-review.md) |
| 11 | 手動テスト / evidence | [phase-11-manual-test.md](./phase-11-manual-test.md) |
| 12 | ドキュメント | [phase-12-documentation.md](./phase-12-documentation.md) |
| 13 | PR | [phase-13-pr.md](./phase-13-pr.md) |

## 不変条件(全 Phase 共通)

1. D1 直接アクセス禁止(`apps/web` から D1 binding を直接呼ぶ差分を生まない)
2. `apps/web` env 不変条件: env 参照は `getEnv()` / `getPublicEnv()` 経由を基本とし、test runtime 判定(`isTestOrPlaywright()`)はその例外として 1 箇所に閉じる
3. service binding 最優先(production / staging): `PUBLIC_API_BASE_URL` の有無に関わらず production runtime では service binding を skip しない
4. 既存 API endpoint surface 不変(`apps/api` の endpoint 追加・schema 変更を伴わない)
5. `wrangler` 直叩き禁止(`scripts/cf.sh` ラッパー経由のみ。本タスクは CLI 実行なし)
6. 既定 PR base は `dev`
7. CONST_007: 本仕様書群は単一実装サイクル内で完了する(先送り禁止)
