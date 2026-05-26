# issue-871-csp-nonce-migration

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=NON_VISUAL]`（CONST_004: `apps/web` の CSP から `'unsafe-inline'` を削除し nonce-based CSP へ移行する目的の達成にはコード変更が必須のため、実装仕様書として作成。issue #871 のラベルは security/followup だが docs-only ではない。）

> **issue 状態**: #871 は **CLOSED**。本仕様書は「クローズドのままタスク仕様書を作成する」という明示指示に従い、issue を再オープンせずに作成する。close-out は実装 PR マージ時にユーザーが判断する。
>
> **実装結果（2026-05-24）**: issue #871 の local implementation を本サイクルで実施済み。staging/production 検証、commit、push、PR は user-gated。
> - `apps/web/src/lib/security-headers.ts` は `SecurityHeaderConfig.nonce?: string` に対応し、`script-src 'self' 'nonce-<n>' 'strict-dynamic'` / `style-src 'self' 'nonce-<n>'` を出力する。
> - `apps/web/middleware.ts` は request ごとに nonce を生成し、request header `x-nonce` / request CSP / response CSP に同一 nonce を注入する。
> - `apps/web/middleware.ts` は `cspMode: "report-only"` 固定を維持する。
> - 既存指示書 `docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-002-csp-nonce-migration.md` はステータス「未実施」。フル Phase 1-13 仕様書は未作成。

## 目的

`apps/web` のレスポンス CSP から `script-src` / `style-src` の `'unsafe-inline'` を削除し、**Next.js 16 App Router の nonce-based CSP** に移行する。request 毎に nonce を発行し、Next.js が生成する inline script / inline style に nonce を伝播させることで、XSS に対する CSP の防御効果（defense-in-depth）を実効化する。

## 背景

親 cycle `apps-web-security-headers-hardening`（#871 の発見元）は CSP 導入時に App Router の inline script/style 互換性を優先し `'unsafe-inline'` を一時許可した。`'unsafe-inline'` を含む CSP は「設定はしているが攻撃者注入 script を実質ブロックできない」状態であり、業界標準では「CSP なし」と同等に評価される。本ワークフローでこれを nonce 化し恒久解消する。

## スコープ最適化（現行コード整合 / 2026-05-24 ユーザー承認済み）

元 issue #871 は「`strict-dynamic` を含まない」「nonce 単独」を前提にしていたが、**現行 Next.js 16 App Router 実態に最適化して以下へ上書きする**（ユーザー承認済み・[Phase 2 design](outputs/phase-2/design.md) に根拠詳細）:

| 観点 | 元 issue | 本仕様（最適化後） | 根拠 |
|------|---------|------------------|------|
| script-src | nonce 単独・strict-dynamic 含まない | `'self' 'nonce-<n>' 'strict-dynamic'` | App Router は動的 chunk を注入するため nonce 単独だと描画破壊。Next.js 公式 CSP ガイド準拠 |
| style-src | nonce 単独 | `style-src` / `style-src-elem` は nonce 化、既存 `style=` 互換は `style-src-attr` に明示分離 | 既存UIの広範な属性styleを同時リファクタせず、script/style element の nonce 化を最小差分で成立させる |
| 完了範囲 | followup 切り出し前提 | local implementation + focused evidence を本サイクルで完了 | 先送り禁止 |

## スコープ

| 含む | 含まない |
|------|---------|
| `apps/web/middleware.ts` での request 毎 nonce 生成・request/response 双方への注入 | CSP report-only → enforce 切替（別 issue AWSHH-FU-001 / U-AWSHH-001 のスコープ） |
| `apps/web/src/lib/security-headers.ts` `buildCspDirective` の nonce 対応（`'unsafe-inline'` 削除 / `'strict-dynamic'` 追加） | `apps/api` 側のヘッダ追加 |
| `apps/web/app/layout.tsx`（root layout）での nonce 取得・伝播 | D1 schema 変更 / API endpoint 追加 |
| 既存 `style=` 属性を `style-src-attr` に分離して互換維持する過渡境界の明文化 | Google Form 仕様変更 |
| 単体テスト・Playwright HTTP smoke の更新（nonce 含有 / `'unsafe-inline'` 不在 / 19 routes violation 0） | `Reporting-Endpoints` / `report-to` 導入（別 followup） |
| `rg "'unsafe-inline'" apps/web/src` を 0 件化する不変条件の grep gate 追加 | nonce 以外の CSP directive 強化（`require-trusted-types-for` 等） |

## 不変条件（CLAUDE.md 整合）

1. `apps/web` env 参照は `getEnv()` / `getPublicEnv()` 経由のみ（task-02）。`process.env` 直接参照禁止。
2. `apps/web` から D1 binding 直接アクセス禁止（不変条件 #5）。
3. `127.0.0.1:8888` を `apps/web/src` に焼き込まない（task-18 grep gate）。
4. production build は OpenNext Workers 互換のため `next build --webpack` を正本とする（Turbopack は local dev 限定）。
5. CSP の mode（report-only / enforce）は本サイクルでは変更しない。nonce 化のみを行う。
6. nonce 化完了後、`'unsafe-inline'` 直書きを将来不変条件として禁止し grep gate で fail 化する。

## Phase 構成

| Phase | 名称 | 成果物 |
|-------|------|--------|
| 1 | 要件定義 | `outputs/phase-1/requirements.md` |
| 2 | 設計 | `outputs/phase-2/design.md` |
| 3 | 設計レビュー | `outputs/phase-3/design-review.md` |
| 4 | テスト計画 | `outputs/phase-4/test-plan.md` |
| 5 | 実装計画 | `outputs/phase-5/implementation-plan.md` |
| 6 | テスト実装結果 | `outputs/phase-6/test-implementation-result.md` |
| 7 | 統合結果 | `outputs/phase-7/integration-result.md` |
| 8 | 品質ゲート | `outputs/phase-8/quality-gate.md` |
| 9 | QA | `outputs/phase-9/qa-result.md` |
| 10 | 最終レビュー | `outputs/phase-10/final-review.md` |
| 11 | 手動テスト | `outputs/phase-11/manual-test-result.md` + `outputs/phase-11/canonical-paths.json` |
| 12 | ドキュメント更新 | strict 7 canonical outputs |
| 13 | PR 作成 | user 明示承認後 |

## 関連タスク

- 発見元 / 親 cycle: `docs/30-workflows/completed-tasks/apps-web-security-headers-hardening/`
- 既存指示書: `docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-002-csp-nonce-migration.md`
- 前提（推奨・必須ではない）: AWSHH-FU-001 / U-AWSHH-001（CSP enforce 切替）
- task-02 wrangler-env-injection / task-18 regression smoke grep gate

## 実装区分の判定根拠（CONST_004）

`'unsafe-inline'` 削除と nonce 配信は `apps/web/middleware.ts` / `security-headers.ts` / `app/layout.tsx` のコード変更なしには達成不可能。「修正する」「移行する」目的が含まれるため、docs-only ではなく **実装仕様書**として作成する。CONST_005 の必須項目（変更対象ファイル・関数シグネチャ・入出力・テスト方針・ローカル実行コマンド・DoD）は各 Phase 成果物に記載する。
