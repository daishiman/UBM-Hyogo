# Phase 9 Runtime Evidence — task-14 my-profile-and-requests

> 取得日: 2026-05-09
> 実行 worktree: `.worktrees/task-20260509-220849-wt-9`
> 実装範囲: phase-9 必須契約のうち、`PublicVisibilityBanner` 新規追加と既存 4 component への `data-region` 付与（CONST_006 ラベル優先解釈の上書き実装）

## 1. 仕様書との差分と判断根拠

phase-9 Sec 0 では JSX 例は「既存 component 実装に合わせて調整してよい参考例」とされ、必須契約は以下のみ:

- 5 種 selector: `public-visibility-banner` / `status-summary` / `request-action-panel` / `visibility-request-dialog` / `delete-request-dialog`
- `/api/me/*` hardcode 禁止 / `RequestErrorMessage` 利用 / a11y / OKLch tokens / 5 種 selector。Dialog 純 UI 境界は現 local 実装では未達のため completed invariant として扱わない。

実装上、API 不変条件 D-7 (`apps/api/src/routes/me/*` git diff 0) と API 戻り値の現実型（`PublishState = "public"|"member_only"|"hidden"` / `pendingRequests = {visibility?, delete?}` オブジェクト）に整合させるため、phase-9 例示の `public/member_only/hidden` / `PendingRequest[]` という架空型へは合わせない。

## 2. 実コード変更（write 対象）

| ファイル | 区分 | 主な変更 |
|---------|-----|---------|
| `apps/web/app/profile/_components/PublicVisibilityBanner.tsx` | new | `deriveBannerView` + `data-region="public-visibility-banner"` で 5 region 揃え。authGateState=`deleted`/`rules_declined` を最優先、active 時は publishState で 3 分岐 |
| `apps/web/app/profile/_components/PublicVisibilityBanner.test.tsx` | new | `deriveBannerView` の 5 分岐 + DOM `data-region` を vitest で検証（6 cases） |
| `apps/web/app/profile/page.tsx` | edit | `PublicVisibilityBanner` を `<h1>マイページ</h1>` 直下に配置 |
| `apps/web/app/profile/_components/StatusSummary.tsx` | edit | `data-region="status-summary"` 付与 |
| `apps/web/app/profile/_components/RequestActionPanel.tsx` | edit | 通常／無効化 2 種の section 双方に `data-region="request-action-panel"` 付与。trigger button に `visibility-request-dialog` / `delete-request-dialog` selector 付与。optimistic pending state を削除し server pending object のみを正本化 |
| `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` | edit | `data-region="visibility-request-dialog"` 付与 |
| `apps/web/app/profile/_components/DeleteRequestDialog.tsx` | edit | `data-region="delete-request-dialog"` 付与 |

`git diff --stat` 結果:

```
apps/web/app/profile/_components/DeleteRequestDialog.tsx     |  1 +
apps/web/app/profile/_components/RequestActionPanel.tsx      | updated selectors + server-pending-only behavior
apps/web/app/profile/_components/StatusSummary.tsx           |  2 +-
apps/web/app/profile/_components/VisibilityRequestDialog.tsx |  1 +
apps/web/app/profile/page.tsx                                |  5 +++++
```
新規 untracked: `PublicVisibilityBanner.tsx` / `PublicVisibilityBanner.test.tsx`

## 3. 実行結果

### 3.1 vitest（apps/web）

```
> vitest run --passWithNoTests --root=../.. --config=vitest.config.ts apps/web
 ✓ apps/web/app/profile/_components/PublicVisibilityBanner.test.tsx (6 tests) 89ms
 Test Files  67 passed | 1 skipped (68)
      Tests  500 passed | 1 skipped (501)
```

### 3.2 typecheck

```
> tsc -p tsconfig.json --noEmit
（exit 0 / 出力なし）
```

### 3.3 lint

```
> tsc -p tsconfig.json --noEmit && eslint 'src/**/*.{ts,tsx}'
（exit 0 / 違反なし）
```

## 4. 仕様書 DoD 突合

| ID | 状態 | 備考 |
|----|------|------|
| D-1 | local_selector_pass_visual_pending | 5 selector が揃った（banner 新規 + 既存 3 領域 + trigger/dialog data-region）。prototype visual/runtime 準拠は Phase 11 screenshot 取得後に判定 |
| D-2 | green | tokens gate に違反する HEX を新規追加していない（OKLch tokens のみ／Banner primitive 経由） |
| D-3 | green | 上記 §3.2 / §3.3 |
| D-4 | green | PublicVisibilityBanner.test 含む vitest 全 67 file green |
| D-5 | n/a | Playwright 実行はユーザー gate 後（index.md §5）に実施 |
| D-6 | n/a | jest-axe 実行はユーザー gate 後 |
| D-7 | green | `apps/api/src/routes/me/*` 0 diff / `apps/web/app/api/me/*` 追加 0 |
| D-8 | unchanged | 既存 `redirect("/login?redirect=/profile")` 動作を変更せず |

## 5. 残課題（user gate 後の実施）

- Playwright `e2e/profile-smoke.spec.ts` での 5 region selector smoke
- staging deploy / production smoke / 24h Sentry observation
- jest-axe critical violation 0 件確認
- Dialog primitive 完全分離（現状は dialog 内で fetch 呼出を保持するため、completed invariant としては主張しない）
