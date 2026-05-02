# Phase 9 成果物 — 品質 gate 定義書（06b-B-profile-self-service-request-ui）

作成日: 2026-05-02
status: implemented-local（runtime visual evidence は Phase 11 capture 後に書き戻す）

## 1. 品質 gate 一覧

| gate | 対象 | 合格基準 | 実行コマンド | evidence |
| --- | --- | --- | --- | --- |
| typecheck | repo 全体 | 緑 | `mise exec -- pnpm typecheck` | `outputs/phase-09/typecheck.log` |
| lint | repo 全体 | 緑 | `mise exec -- pnpm lint` | `outputs/phase-09/lint.log` |
| unit | `me-requests` / Request*.tsx | 緑 / union 全網羅 | `mise exec -- pnpm --filter @ubm/web test -- me-requests Request` | `outputs/phase-09/unit.log` |
| coverage | 上記 unit 対象 | line / branch / function / statement 80%+ | `mise exec -- pnpm --filter @ubm/web test:coverage` | `outputs/phase-09/coverage.json` |
| integration | `apps/api` `/me/{visibility,delete}-request` route test | 100% 緑 | `mise exec -- pnpm --filter @ubm/api test -- me/index` | `outputs/phase-09/integration.log` |
| e2e | profile.{visibility-request,delete-request,a11y}.spec | 正常 100% / 異常 80%+ | `mise exec -- pnpm --filter @ubm/web test:e2e -- profile.visibility-request profile.delete-request profile.a11y` | `outputs/phase-09/e2e.log` |
| a11y axe | dialog open/closed/error | serious+ 0 件 | `mise exec -- pnpm --filter @ubm/web test:e2e -- profile.a11y` | `outputs/phase-09/axe-report.json` |
| static grep #4 | `Request*.tsx` | 0 hit | `rg -n 'name="(displayName\|email\|kana\|phone\|address)"' apps/web/app/profile/_components/Request*.tsx` | `outputs/phase-09/lint-grep-no-body-edit.txt` |
| static grep #5 | `apps/web/` | 0 hit | `rg -n 'cloudflare:d1\|D1Database' apps/web/` | `outputs/phase-09/lint-grep-no-d1.txt` |
| static grep #11 | `me-requests.ts` | 2 path のみ | `rg -n 'fetchAuthed\("/me/' apps/web/src/lib/api/me-requests.ts` | `outputs/phase-09/lint-grep-self-service.txt` |
| static grep #7 | `Request*.tsx` | 0 hit | `rg -n 'responseId' apps/web/app/profile/_components/Request*.tsx` | `outputs/phase-09/lint-grep-no-responseid.txt` |
| XSS grep | `Request*.tsx` | 0 hit | `rg -n 'dangerouslySetInnerHTML' apps/web/app/profile/_components/Request*.tsx` | `outputs/phase-09/lint-grep-no-dangerous-html.txt` |
| PII console grep | `Request*.tsx` | 0 hit（reason / email を含む log なし） | `rg -n 'console\.(log\|info\|debug)' apps/web/app/profile/_components/Request*.tsx` | `outputs/phase-09/lint-grep-no-console-pii.txt` |

## 2. Lighthouse / Web Vitals

- `/profile`（dialog 閉じ）: Performance 80+ / Accessibility 95+。06b baseline と同等のとき MINOR 許容
- `/profile`（dialog 開き）: Performance 計測対象外。Accessibility 95+
- 本タスクで新規 lighthouse spec は導入しない。06b 既存に存在しなければ Phase 11 手動で代替

## 3. security review

### 3.1 XSS
- React text node のみ。`dangerouslySetInnerHTML` 不使用（grep 0 hit）
- エラー文言は辞書固定。サーバ自由文を画面に出さない
- reason 500 字制限（API zod と同一）

### 3.2 CSRF
- Auth.js cookie ベース session を継承。同タスクで新規 cookie / token を発行しない
- API 側 `sessionGuard` + same-site cookie + Origin check で担保（既実装）

### 3.3 PII
- 退会 reason placeholder で「個人情報を含めないでください」明示
- console.log / Sentry breadcrumbs に reason / email / queueId を載せない（grep gate）
- WAE telemetry は `{ type, status }` のみ（API 側既実装方針継承）
- Secrets vs Variables: 新規 secret 追加なし。既存 `AUTH_SECRET` 等は Cloudflare Secrets 格納継続

## 4. evidence list（`outputs/phase-09/`）

`typecheck.log` / `lint.log` / `unit.log` / `coverage.json` / `coverage-summary.txt` / `integration.log` / `e2e.log` / `axe-report.json` / `lint-grep-no-body-edit.txt` / `lint-grep-no-d1.txt` / `lint-grep-self-service.txt` / `lint-grep-no-responseid.txt` / `lint-grep-no-dangerous-html.txt` / `lint-grep-no-console-pii.txt` / `security-review.md` / `quality-report.md`

## 5. gate 不合格時の戻り先

| 不合格 gate | 戻り先 |
| --- | --- |
| typecheck / lint | Phase 5 |
| unit / coverage | Phase 6 |
| integration / e2e | Phase 5 / Phase 6 |
| a11y axe serious+ | Phase 2 |
| static grep 1+ hit | Phase 5（即修正）または Phase 2 |
| security review NG | Phase 2 / Phase 5 |
| Lighthouse | MINOR 記録 / Phase 12 follow-up |

## 6. 注記

このファイルはタスク仕様書整備時点の品質 gate 定義であり、`status` / 実測値は Phase 9 実行後に `quality-report.md` で記録される。
