# Phase 7: 結合テスト・全体回帰

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. 単体（spec 単独実行）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-member-delete.spec.ts --project=desktop-chromium
```

期待: 5 pass + 1 skip。

## 2. E2E 全体回帰

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e
```

確認項目:

| # | 観点 | 期待 |
|---|------|------|
| 1 | 既存 spec への影響 | `admin-pages.spec.ts` / `admin-requests.spec.ts` / `admin-identity-conflicts.spec.ts` 等が引き続き pass |
| 2 | skip 累計 | Stage 全体での skip 件数が想定値（cascade preview のみ +1）から増えていない |
| 3 | E2E lines coverage | 現 repo に producer 未接続のため runtime pending。今回の local PASS 条件にしない |

## 3. 静的検証

| 観点 | コマンド | 期待 |
|------|---------|------|
| 型 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
| spec 内 grep ガード | `grep -c "page.route(" apps/web/playwright/tests/admin-member-delete.spec.ts` | ≥ 1 |
| spec 内 fetch ガード | `grep -c "fetch(" apps/web/playwright/tests/admin-member-delete.spec.ts` | = 0 |
| skip 件数 | `grep -c "test.skip" apps/web/playwright/tests/admin-member-delete.spec.ts` | = 1 |
| fixme 件数 | `grep -c "test.fixme" apps/web/playwright/tests/admin-member-delete.spec.ts` | = 0 |

## 4. fixture 差分確認

```bash
git diff apps/web/playwright/fixtures/
```

期待: **diff なし**（新 fixture 追加禁止）。

## 5. API 側未変更確認

```bash
git diff apps/api/src/routes/admin/member-delete.ts apps/api/src/routes/admin/audit.ts
```

期待: **diff なし**（参照のみ・変更禁止）。

## 6. Server Component fixture gate 確認

```bash
git diff apps/web/src/lib/admin/server-fetch.ts apps/web/playwright.config.ts
```

期待: `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1` による `/admin/members` / `/admin/audit` fixture gate と、focused run の evidence dir 分岐のみ。

## 7. 失敗時の対応

| 症状 | 対応 |
|------|------|
| dialog selector が一致しない | プロトタイプ実装の DOM を確認し `getByRole('dialog')` の代替（`getByTestId` 等）を検討。selector 修正のみで spec 構造は維持 |
| delete 後の一覧表示が変わらない | 本 spec は drawer close + POST body を正本 assertion とする。一覧再取得の状態変化は server fixture stateful 化しない |
| reason 空 API 422 が発火しない | 現 UI は disabled で API 到達を抑止する。API 422 は backend contract test 側に責務分離する |
