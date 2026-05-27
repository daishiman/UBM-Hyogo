# issue-924-style-src-attr-retirement

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=VISUAL / workflow_state=local_static_pass_browser_pending]`（CONST_004: `style-src-attr 'unsafe-inline'` を CSP から削除する目的の達成には inline `style={{...}}` 削除と `security-headers.ts` 修正が必須のため、同一サイクルで実装まで実施した。）

> **issue 状態**: #924 は **CLOSED**。本仕様書は「CLOSED のままタスク仕様書を作成する」明示指示に従い、再オープンせずに作成する。close-out は実装 PR マージ時にユーザーが判断する。
>
> 親 issue #871（CSP nonce 化）の follow-up（AWSHH-FU-005）として記録された未解決項目。`apps/web/src/lib/security-headers.ts` の `style-src-attr 'unsafe-inline'` directive と、CSP 対象 DOM に出る React inline style を同一サイクルで撤去した。`ImageResponse` 2 ファイルは PNG 生成専用で CSP 対象外のため grep gate から除外する。

## 目的

`apps/web` の CSP から `style-src-attr 'unsafe-inline'` を撤去し、HTML element の `style="..."` 属性経路を全廃する。これにより CSP の inline 防御を完全成立させ、XSS 注入される `<element style="...">` の評価をブラウザに無効化させる。

## 背景

issue #871 で `script-src` / `style-src` から `'unsafe-inline'` を削除し nonce 化したが、既存 React コードの `style={{...}}` 51 箇所を同時撤去するスコープ膨張を避けるため、属性 style 互換を `style-src-attr 'unsafe-inline'` に**明示分離**して維持した。これは過渡境界であり、followup #924 として独立サイクル化されていた。

## スコープ

| 含む | 含まない |
|------|---------|
| `apps/web` 配下 14 production files の `style={{...}}` 撤去（Tailwind utility / CSS variable / `data-*` 属性 + CSS Module） | `apps/api` 側のヘッダ追加 |
| `apps/web` 配下 3 smoke/harness files の `style={{...}}` 撤去 | D1 schema 変更 / API endpoint 追加 / Google Form 仕様変更 |
| `apps/web/src/lib/security-headers.ts:76` の `style-src-attr 'unsafe-inline'` 行削除 | `Reporting-Endpoints` / `report-to` 仕様変更（別 followup） |
| 動的 style（Avatar hue / Icon size px / ZoneDistribution percentage gradient）の data-attribute + CSS rule への置換 | CSP report-only / enforce mode 切替（既存 mode を維持） |
| 単体テスト `security-headers.spec.ts` への `not.toContain('style-src-attr')` 追加 | nonce 仕様の変更 |
| Playwright smoke `tests/security-headers.smoke.spec.ts` への `style-src-attr` 不在 assert 追加 | 19 routes 全体の visual baseline 全更新（既存 baseline を退行確認用に使用） |
| 新規 grep gate `scripts/verify-no-inline-style.sh`（pre-push + CI）追加 | `style={...}` 以外の CSP 強化 |
| `ImageResponse` 利用の OG 画像（`opengraph-image.tsx` 等）は CSP 対象外として除外 | OG 画像生成パスの変更 |

## 除外 (CSP 対象外)

`ImageResponse` API は PNG として直接配信され HTML DOM を経由しないため、本サイクルでは対象外とする:

- `apps/web/app/opengraph-image.tsx`
- `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`

## 不変条件（CLAUDE.md 整合）

1. CSS は `apps/web/src/styles/tokens.css` 経由（HEX 直書き禁止・`bg-[#xxx]` 禁止・OKLch トークン正本）。
2. 既存 API endpoint surface のみ利用（不変条件 #5 / #1）。
3. `apps/web` から D1 binding 直接アクセス禁止。
4. `127.0.0.1:8888` を `apps/web/src` に焼き込まない。
5. production build は `next build --webpack` を正本（OpenNext Workers 互換）。
6. nonce 仕様（issue #871）は不変。`script-src` / `style-src` / `style-src-elem` の出力は変更しない。
7. 本サイクル完了後、`style={{` を `apps/web/src` / `apps/web/app` へ新規追加することを将来不変条件として禁止し grep gate で fail 化する。

## CONST_007 スコープ判定

51 箇所だが大半は静的 className 置換で機械的。動的ケース 3 種（Avatar hue / Icon size / ZoneDistribution percentage）はそれぞれ単独で局所完結する。**1 サイクル完了可能**と判定。先送り（unassigned 切り出し）は行わない。

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
| 12 | ドキュメント更新 | strict canonical outputs |
| 13 | PR 作成 | user 明示承認後 |

## Phase Links

- [Phase 1](outputs/phase-1/phase-1.md)
- [Phase 2](outputs/phase-2/phase-2.md)
- [Phase 3](outputs/phase-3/phase-3.md)
- [Phase 4](outputs/phase-4/phase-4.md)
- [Phase 5](outputs/phase-5/phase-5.md)
- [Phase 6](outputs/phase-6/phase-6.md)
- [Phase 7](outputs/phase-7/phase-7.md)
- [Phase 8](outputs/phase-8/phase-8.md)
- [Phase 9](outputs/phase-9/phase-9.md)
- [Phase 10](outputs/phase-10/phase-10.md)
- [Phase 11](outputs/phase-11/phase-11.md)
- [Phase 12](outputs/phase-12/phase-12.md)
- [Phase 13](outputs/phase-13/phase-13.md)

## 関連タスク

- 親 cycle: `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/`
- 前提（必須ではない）: issue #871 nonce 化完了（マージ済み）
- task-02 wrangler-env-injection / task-18 regression smoke grep gate
- task-08 design-tokens（OKLch 正本）/ task-09 tokens.css

## 実装区分の判定根拠（CONST_004）

`style-src-attr 'unsafe-inline'` 削除は React コンポーネント 17 ファイルの `style={{...}}` 撤去と `security-headers.ts` 修正なしには達成不可能。「修正する」「撤去する」目的が含まれるため、docs-only ではなく **実装仕様書**として作成する。CONST_005 必須項目（変更対象ファイル・関数シグネチャ・入出力・テスト方針・ローカル実行コマンド・DoD）は Phase 5 と Phase 12 implementation-guide に記載する。
