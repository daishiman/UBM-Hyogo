# Workflow: 2b-admin-identity-conflicts-spec

> **[実装区分: 実装仕様書]**
> 後続成果物は実コード `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`（200-240 行）。
> 親ソース仕様: `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2b-admin-identity-conflicts.md`

## メタ情報

| key | value |
|-----|-------|
| workflow ID | `2b-admin-identity-conflicts-spec` |
| 親 workflow | `e2e-quality-uplift-stage-2` |
| 対象 sub-task | 2b |
| 対象 route | `/admin/identity-conflicts` |
| 出力ファイル | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`（新規）+ support changes |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| coverageTier | standard |
| Implementation Mode | `new` |
| 行数目安 | 200-240 |
| workflow_state | `runtime_pending`（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`） |
| Phase 12 status | `completed`（strict 7 outputs 作成済み、local runtime evidence 取得済み） |

## スコープ（CONST_007 準拠）

本 workflow が生成する全 Phase は **後続実装プロンプト（03.実装.md）の 1 サイクル内で完了するスコープ**に収める。

| 含む | 含まない |
|------|---------|
| `admin-identity-conflicts.spec.ts` 新規作成（6 test）/ server-side fixture gate / Playwright evidence routing / shared schema strict 化 / DoD 検証 | API endpoint 実装・D1 schema 変更・新 Playwright fixture 追加・新 endpoint 追加・cascade preview skip（2c 責務） |

先送り・別 PR 化なし。すべて 1 PR で完結。

## 不変条件

1. 既存 API endpoint surface のみ利用（GET/MERGE/DISMISS の 3 endpoint）
2. OKLch トークン正本化（HEX / `bg-[#xxx]` 直書き禁止、`getByRole` / `getByTestId` 優先）
3. プロトタイプ正本順位（新 primitive 生成禁止）
4. `apps/web` から D1 直接アクセス禁止（初期 list は `PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1`、mutation は `page.route()` mock）
5. 新規 fixture 追加禁止（`auth.ts` の既存 3 ロール fixture のみ）
6. `mergedMemberId` 文字列の使用禁止（merge response は `targetMemberId` 系で固定）

## 正本同期

| 項目 | 状態 |
|------|------|
| aiworkflow quick-reference / resource-map / task-workflow-active | 同一 wave で登録済み |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-2b-admin-identity-conflicts-spec-artifact-inventory.md` |
| 元 unassigned task | `docs/30-workflows/unassigned-task/e2e-stage-2-2b-admin-identity-conflicts-001.md` を `formalized_and_implemented_local` に更新 |
| runtime boundary | 実コード生成 + local chromium E2E 6 PASS 取得済み。firefox / webkit / staging / CI / commit / push / PR は後続ユーザー承認 gate |

## Phase 構成

| Phase | 目的 | 成果物 |
|-------|------|-------|
| 1 | 要件定義・スコープ確定 | `phase-1.md` |
| 2 | 既存資産インベントリ・依存解析 | `phase-2.md` |
| 3 | アーキテクチャ・モジュール設計 | `phase-3.md` |
| 4 | Open Questions 解決 | `phase-4.md` |
| 5 | 実装ガイド（test 構造 / mock pattern） | `phase-5.md` |
| 6 | fixture 標準形 / I/O 仕様 | `phase-6.md` |
| 7 | テスト方針 / selector 規約 | `phase-7.md` |
| 8 | セキュリティ / 認可境界 | `phase-8.md` |
| 9 | CI/CD / lint / typecheck gate | `phase-9.md` |
| 10 | ローカル実行・検証手順 | `phase-10.md` |
| 11 | Phase 11 evidence（NON_VISUAL 縮約） | `phase-11.md` |
| 12 | Close-out compliance（7 outputs） | `phase-12.md` |
| 13 | PR 作成（dev base） | `phase-13.md` |

## 参照

- 親仕様: `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2b-admin-identity-conflicts.md`
- 完了済 親 workflow: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/`
- skill: `.claude/skills/task-specification-creator/`
- system spec: `CLAUDE.md` UI alignment 不変条件 1-5
