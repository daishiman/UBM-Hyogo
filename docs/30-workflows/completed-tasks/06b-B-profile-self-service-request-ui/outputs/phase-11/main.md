# Output Phase 11: 手動 smoke / 実測 evidence

## status

IMPLEMENTED_AWAITING_VISUAL_CAPTURE（実装は完了、実 screenshot / E2E artifact 取得は manual smoke 段階で実施）

実装完了内容（2026-05-02 時点）:

- 追加ファイル
  - `apps/web/app/profile/_components/RequestActionPanel.tsx`
  - `apps/web/app/profile/_components/VisibilityRequestDialog.tsx`
  - `apps/web/app/profile/_components/DeleteRequestDialog.tsx`
  - `apps/web/app/profile/_components/RequestPendingBanner.tsx`
  - `apps/web/app/profile/_components/RequestErrorMessage.tsx`
  - `apps/web/src/lib/api/me-requests.ts`
  - `apps/web/src/lib/api/me-requests.types.ts`
  - `apps/web/app/api/me/visibility-request/route.ts`（同一 origin proxy）
  - `apps/web/app/api/me/delete-request/route.ts`（同一 origin proxy）
  - `apps/web/playwright/tests/profile-visibility-request.spec.ts`（`describe.skip` で待機）
  - `apps/web/playwright/tests/profile-delete-request.spec.ts`（`describe.skip` で待機）
- 変更ファイル
  - `apps/web/app/profile/page.tsx`（`<RequestActionPanel />` 差し込み）
  - `apps/web/src/__tests__/static-invariants.test.ts`（S-04 を本文項目限定 grep に再構成 + S-04b 追加）
- 自動検証結果
  - `pnpm --filter @repo/web test` 全 153 件 PASS
  - `pnpm typecheck` clean
  - `pnpm lint` / boundary lint clean

## テスト方式

SCREENSHOT + E2E（Playwright）。VISUAL_ON_EXECUTION ポリシーに従い、実装完了後にローカル
（`pnpm --filter @repo/web dev`）または staging Cloudflare Pages 上で `/profile` を実操作し、
SS と Playwright artifact を取得する。dark mode は本タスクで provide しないため対象外（N/A）。

## Pre-conditions（実行前必須）

| GATE | 条件 |
| --- | --- |
| PRE-1 | Phase 10 が PASS / MINOR 判定 |
| PRE-2 | 06b-A-me-api-authjs-session-resolver が completed、staging で session に user.memberId が含まれる |
| PRE-3 | ローカル / staging で `/profile` が起動可能 |
| PRE-4 | API Worker が staging で 202 / 409 / 422 を返却 |
| PRE-5 | rulesConsent=consented のテスト会員（public / hidden 各 1 名）が staging D1 に存在 |

## 環境

| 項目 | 値 |
| --- | --- |
| ブラウザ | Chrome stable（Playwright bundled chromium） |
| viewport | 1280 × 800 |
| テーマ | light（dark 非対応のため N/A） |

## 取得対象 screenshot 一覧と命名規則

保存先: `outputs/phase-11/screenshots/`
ファイル名規則: `TC-{番号}-{state}-{theme}.png`（テーマは `light` 固定）

| TC | 状態 | 操作 | ファイル名 | 紐付く AC | 取得状態 |
| --- | --- | --- | --- | --- | --- |
| TC-01 | profile 申請パネル初期表示（public） | `/profile` 表示直後 | `TC-01-request-panel-default-public-light.png` | AC-1, AC-2 | 取得待ち |
| TC-02 | profile 申請パネル初期表示（hidden、再公開ボタン） | hidden 会員で `/profile` | `TC-02-request-panel-default-hidden-light.png` | AC-2 | 取得待ち |
| TC-03 | 公開停止 dialog 開いた状態 | 「公開を停止する」クリック | `TC-03-visibility-dialog-open-light.png` | AC-1 | 取得待ち |
| TC-04 | 退会 dialog 開いた状態（チェック未完） | 「退会を申請する」クリック | `TC-04-delete-dialog-open-light.png` | AC-3 | 取得待ち |
| TC-05 | 退会 dialog 二段確認チェック完了 | 確認チェック ON | `TC-05-delete-dialog-confirmed-light.png` | AC-3 | 取得待ち |
| TC-06 | 二重申請 409 エラー表示 | pending 状態で再 submit | `TC-06-duplicate-409-light.png` | AC-4 | 取得待ち |
| TC-07 | 申請成功後の pending banner | 公開停止 submit → 202 | `TC-07-pending-banner-after-submit-light.png` | AC-1 | 取得待ち |
| TC-08 | dialog focus trap | TC-03 で Tab 操作 | `TC-08-dialog-focus-trap-light.png` | AC-7 | 取得待ち |
| TC-09 | エラー role=alert（network failure / 5xx） | DevTools で API block | `TC-09-error-alert-light.png` | AC-7 | 取得待ち |

## E2E artifact 保存先と命名

| artifact | 保存先 | 取得方法 |
| --- | --- | --- |
| Playwright trace | `outputs/phase-11/e2e/trace/{spec}.zip` | `--trace=on` |
| video | `outputs/phase-11/e2e/video/{spec}.webm` | `use: { video: 'on' }` |
| console log | `outputs/phase-11/e2e/console/{spec}.log` | `page.on('console')` |
| network HAR | `outputs/phase-11/e2e/har/{spec}.har` | `recordHar` |

対象 spec:

- `apps/web/playwright/tests/profile-visibility-request.spec.ts`
- `apps/web/playwright/tests/profile-delete-request.spec.ts`

## 手動 smoke 手順サマリ（詳細は phase-11.md）

1. ログイン（Auth.js Google OAuth or Magic Link）
2. `/profile` を開く
3. 公開停止申請 submit → 202 → pending banner（TC-01/03/07）
4. 退会申請 submit（二段確認）→ 202 → pending banner（TC-04/05）
5. 二重申請 → 409 banner（TC-06）
6. session cookie 削除 → `/login?redirect=/profile` リダイレクト確認（401）
7. axe scan 実行 → critical / serious 0 件
8. network block で role=alert 表示確認（TC-09）

## 実行後に作成する必須成果物

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/main.md`（本ファイル） | 実行サマリ / 結果一覧 / 判定 |
| `outputs/phase-11/manual-test-result.md` | TC-01..TC-09 PASS/FAIL × SS 紐付け |
| `outputs/phase-11/manual-smoke-log.md` | 手動 smoke 実行ログ（コマンド / 環境 / 実測） |
| `outputs/phase-11/screenshot-plan.json` | TC × route × action × theme |
| `outputs/phase-11/screenshot-coverage.md` | 必須 100% / N/A 理由（dark mode 等） |
| `outputs/phase-11/phase11-capture-metadata.json` | taskId / generated-at / capture method |
| `outputs/phase-11/ui-sanity-visual-review.md` | Apple HIG / WCAG AA 観点 |
| `outputs/phase-11/discovered-issues.md` | Blocker / Note / Info（0 件でも） |
| `outputs/phase-11/screenshots/TC-*.png` | 9 枚 |
| `outputs/phase-11/e2e/{trace,video,console,har}/` | Playwright artifact |

現時点では `screenshots/`、PNG、trace、video、HAR、metadata JSON は未作成。dummy / placeholder evidence は置かず、runtime capture 完了まで Phase 11 は `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` のまま維持する。

## 実行サマリテンプレ（Phase 11 実行後に埋める）

| 項目 | 値 |
| --- | --- |
| 実行者 | （記入） |
| 実行日時 | YYYY-MM-DD HH:MM JST |
| 環境 | local / staging |
| commit hash | （記入） |
| viewport | 1280 × 800 |
| テストアカウント | （public 用 / hidden 用） |
| TC PASS 数 | x / 9 |
| axe critical / serious | 0 / 0 |
| 判定 | PASS / FAIL |

## notes

- このファイルは仕様書作成段階の雛形である。実 SS / artifact 取得後に「取得待ち」を取得日時へ書き換え、`status` を `EXECUTED` へ更新する。
- dummy PNG / placeholder 配置は禁止（false green 防止）。実 SS が取得できない場合は `discovered-issues.md` に Blocker として記録し Phase 5 / Phase 10 へ差し戻す。
- capture metadata の `taskId` は `06b-B-profile-self-service-request-ui` でなければ preflight fail。
