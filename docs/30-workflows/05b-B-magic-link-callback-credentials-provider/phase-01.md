# Phase 1: 要件定義 - 05b-B-magic-link-callback-credentials-provider

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-B-magic-link-callback-credentials-provider |
| phase | 1 / 13 |
| wave | 05b-fu |
| status | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| canonical root | docs/30-workflows/05b-B-magic-link-callback-credentials-provider/ |

## 目的

Magic Link メールのリンククリックから Auth.js session 確立までをつなぐ領域を、実装可能な最小スコープに固定する。

## Current Facts

- 05b 本体は `POST /auth/magic-link/verify`、apps/web proxy、`magic_tokens` lifecycle、`SessionUserAuthGateState` を実装済み。
- メール本文の URL は `/api/auth/callback/email?token=&email=` を指し、本 workflow で apps/web 側 callback route と Auth.js Credentials Provider を実装する。
- `apps/web` は D1 を直接参照せず、verify は apps/api 経由で行う。
- 本 workflow は仕様書作成であり、アプリケーションコード、deploy、commit、push、PR 作成は含めない。

## Scope In

- `apps/web/app/api/auth/callback/email/route.ts` の GET handler。
- Auth.js Credentials Provider の `authorize()` と JWT session callback。
- Magic Link verify 結果から `SessionUser` を session cookie へ反映する契約。
- 失敗 reason から `/login?error=...` への redirect mapping。
- unit / route contract / NON_VISUAL smoke evidence の定義。

## Scope Out

- Google OAuth の置換。
- Magic Link 発行 API、mail provider、D1 schema の変更。
- production secret 値の記録。
- Phase 13 の commit / push / PR 自動実行。

## Acceptance Criteria

| AC | 内容 | Evidence |
| --- | --- | --- |
| AC-1 | `/api/auth/callback/email?token=&email=` が 404 にならない | route test / curl log |
| AC-2 | 正しい token/email で session cookie が確立される | callback route test / browser smoke |
| AC-3 | 不正 token/email は `/login?error=...` へ戻る | failure matrix test |
| AC-4 | apps/web は D1 を直接参照しない | static boundary check |
| AC-5 | Auth.js helper が placeholder ではなく本実装を参照する | focused unit test / typecheck |

## 依存関係

| 種別 | 対象 | 扱い |
| --- | --- | --- |
| Depends On | 05b-A-auth-mail-env-contract-alignment | env 名と mail URL 契約の上流 |
| Depends On | 05b Magic Link 発行・検証 API | verify endpoint の上流 |
| Depends On | 06b member login UI | login error 表示と redirect の連携先 |
| Blocks | 06b-C-profile-logged-in-visual-evidence | logged-in profile capture 前提 |
| Blocks | 08b-A-playwright-e2e-full-execution | auth E2E の前提 |
| Blocks | 09a-A-staging-deploy-smoke-execution | staging auth smoke の前提 |

## 実行タスク

1. Phase固有の判断と成果物を確認する。
2. `index.md`、`artifacts.json`、Phase 12成果物との整合を確認する。
3. 実装・deploy・commit・push・PRを実行しない境界を確認する。

## 参照資料

- `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/index.md`
- `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/artifacts.json`
- `docs/30-workflows/unassigned-task/task-05b-authjs-callback-route-credentials-provider-001.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 実行手順

- Current canonical root is `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/`.
- Old root `docs/30-workflows/02-application-implementation/05b-B-magic-link-callback-credentials-provider/` is legacy path only.
- Runtime implementation evidence is separated into Phase 11 reserved paths.

## 統合テスト連携

- Upstream: 05b-A auth mail env, 05b Magic Link verify API, 06b login UI.
- Downstream: 06b-C logged-in profile evidence, 08b auth E2E, 09a staging auth smoke.
- Boundary: apps/web must not access D1 directly.

## 成果物

- `outputs/phase-01/main.md`

## 完了条件

- [x] 実装領域、AC、依存、実行禁止操作が明記されている。
- `outputs/phase-01/main.md` が spec-only evidence として存在する。
