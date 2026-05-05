# 06b-A-me-api-authjs-session-resolver

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 06b-fu |
| mode | parallel wave / serial-gated dependency |
| owner | - |
| 状態 | implemented-local / implementation / Phase 1-12 completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| current path | docs/30-workflows/06b-A-me-api-authjs-session-resolver/ |
| legacy path | docs/30-workflows/02-application-implementation/06b-A-me-api-authjs-session-resolver/ |

## purpose

`/profile` が本番 Auth.js session cookie で `/me/*` API を利用できるよう、apps/api の session resolver 差し替え漏れを実装する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、ソースコード上で確認できた Auth.js session と /me API の接続漏れだけを扱う。

`apps/web/app/profile/page.tsx` は cookie を `apps/api` に転送して `/me` と `/me/profile` を呼ぶ。しかし `apps/api/src/index.ts` の `/me` mount は development かつ `x-ubm-dev-session: 1` の dev token だけを session として解決している。Auth.js cookie/JWT を読む production resolver が未接続のため、ログイン済み profile 画面は本番/staging で 401 になる可能性が高い。これは visual evidence 不足ではなく backend 接続実装漏れである。

## scope in / out

### Scope In
- `apps/api` `/me/*` 用 Auth.js JWT/cookie session resolver 実装
- `authjs.session-token` / `__Secure-authjs.session-token` から JWT を抽出して `AUTH_SECRET` で検証
- dev resolver と production resolver の責務分離
- `/me` `/me/profile` の cookie-based route tests
- staging profile smoke の前提更新

### Scope Out
- profile UI の再設計
- Auth.js Google OAuth provider の置換
- Magic Link callback 実装そのもの
- production secret 値の記録
- 未承認 commit/push/PR

## dependencies

### Depends On
- 05a Auth.js Google OAuth session JWT
- 05b Magic Link callback follow-up
- 04b /me route implementation
- AUTH_SECRET shared between apps/web and apps/api

### Blocks
- 06b-B-profile-self-service-request-ui（後続: 申請 UI smoke は production session が前提）
- 06b-C-profile-logged-in-visual-evidence（後続: logged-in visual は production session が前提）
- 08b profile/auth E2E
- 09a staging authenticated smoke

### 内部依存（同 wave 内 serial 実行を明示）
- 表記は parallel wave だが、実依存は **06b-A → 06b-B → 06b-C** の serial。
- 本タスクが session resolver の単独 SRP を担い、後続 2 タスクの前提条件を確定する。

## refs

- apps/api/src/index.ts
- apps/api/src/routes/me/index.ts
- apps/api/src/middleware/session-guard.ts
- apps/api/src/middleware/require-admin.ts
- packages/shared/src/auth.ts
- apps/web/src/lib/fetch/authed.ts
- apps/web/app/profile/page.tsx

## AC

- production/staging の `/me` が Auth.js cookie/JWT で 200 を返す
- 未ログインまたは不正 JWT は 401 を返す
- 削除済み member は 410、rules 未同意は authGateState で表現される
- apps/web は D1 直参照せず cookie forwarding のまま成立する
- dev-only `x-ubm-dev-session` 経路は production で無効のまま維持される

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-11/manual-smoke-log.md
- outputs/phase-11/link-checklist.md
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md
- outputs/artifacts.json

## invariants touched

- #5 apps/web D1 direct access forbidden
- #7 memberId/responseId separation
- #11 profile SSR auth gate
- #15 Auth session boundary

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
