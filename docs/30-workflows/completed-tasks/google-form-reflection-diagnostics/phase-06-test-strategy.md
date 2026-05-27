---
phase: 6
title: テスト方針 — contract spec (D1 lane) / unit / Playwright env-gated
workflow_id: google-form-reflection-diagnostics
status: spec_created
---

# Phase 6 — テスト方針

[実装区分: 実装仕様書]

## 1. テスト層構成

| 層 | フレームワーク | 設定 | 配置 |
| --- | --- | --- | --- |
| unit | vitest | `apps/api/vitest.config.ts` | `apps/api/src/diagnostics/*.spec.ts` (非 contract) |
| contract (D1) | vitest | `apps/api/vitest.d1.config.ts` (singleFork) | `apps/api/src/diagnostics/*.contract.spec.ts` |
| Playwright smoke | Playwright | `apps/web/playwright/playwright.config.ts` (env-gated) | `apps/web/playwright/tests/admin/sync-status.spec.ts` |

## 2. テストアカウント

| 役割 | email |
| --- | --- |
| admin | `manjumoto.daishi@senpai-lab.com` |
| 一般会員 | `manju.manju.03.28@gmail.com` |

これらは staging 環境の実アカウント。ローカル / contract spec では D1 fixture seeding により対応する識別子を使用する。

## 3. contract spec (D1 lane) のテスト項目

### 3.1 `forms-pipeline.contract.spec.ts`

| ID | 検証内容 | seeding |
| --- | --- | --- |
| C-FP-01 | `sync_jobs` 空 → `H1_ingestNeverRanOrAllErrors=true`、`latestSyncRuns=[]` | 空 D1 |
| C-FP-02 | `sync_jobs` 直近 5 件すべて status='failed' → `H1=true` | failed 5 件 seed |
| C-FP-03 | `sync_jobs` success 1 件、`publicConsentTrue=0` → `H3_allHiddenByPublishState=true` | success + member_status 5 with consent=0 |
| C-FP-04 | `schema_diff_queue` queued N>0 → `H4_aliasPendingNonZero=true`、`aliasPendingCount=N` | schema diff seed |
| C-FP-05 | response に secrets 実値が含まれない | env で API key を seed し、response JSON を grep して string が現れないこと |
| C-FP-06 | secretsReadiness の各フィールドが `boolean` (zod parse 通過) | env 有/無切り替え |
| C-FP-07 | non-admin role で 403 | session mock |
| C-FP-08 | 未認証で 401 | cookie なし |

### 3.2 `member-diagnosis.contract.spec.ts`

| ID | 検証内容 |
| --- | --- |
| C-MD-01 | member 存在 + identity match なし → `H2_identityMissing=true` |
| C-MD-02 | publicConsent=false → `H3_hiddenByConsentOrPublish=true` |
| C-MD-03 | response_fields が 28 件 → `missingFieldKeys.length=3`、`H4_missingFieldsNonEmpty=true` |
| C-MD-04 | 存在しない memberId → 404 |
| C-MD-05 | 一般会員 session で 403 |

## 4. unit spec

### 4.1 `forms-pipeline.spec.ts`

純関数として hypothesis flag 導出ロジックを切り出し、入力カウント値の組み合わせから期待する flag を真理値表的に検証する (8-12 ケース)。

## 5. Playwright env-gated smoke

### 5.1 `sync-status.spec.ts`

- 起動条件: `process.env.STAGING_SMOKE === '1'` のとき実行 (CI / local 双方で gating)
- 認証: 既存 staging cookie mint 経路 (admin: `manjumoto.daishi@senpai-lab.com`) を再利用
- 検証:
  - `/admin/sync-status` を開き 200 で render される
  - H1-H4 のラベルが DOM に少なくとも 1 つ表示されている
  - screenshot を `outputs/phase-11/screenshots/sync-status-screen.png` として保存
- member drawer: `manju.manju.03.28@gmail.com` 相当の id をクエリで指定し、診断タブ DOM 確認 + screenshot

## 6. テスト実行コマンド

```bash
# diagnostics focused unit + D1 route contracts
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/diagnostics/forms-pipeline.spec.ts apps/api/src/diagnostics/forms-pipeline.contract.spec.ts apps/api/src/diagnostics/member-diagnosis.contract.spec.ts

# Playwright env-gated (staging credentials が揃ったときのみ)
STAGING_SMOKE=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin/sync-status.spec.ts
```

## 7. coverage 期待

- unit + contract で `apps/api/src/diagnostics/` の statement coverage 90% 以上
- Playwright は smoke のため coverage 計上対象外

## 8. テスト追加時の不変条件

- ファイル拡張子は `.spec.ts` のみ (`.test.ts` 禁止 — CLAUDE.md 不変条件 #8)
- contract spec は D1 lane (`vitest.d1.config.ts`) でのみ実行されること (unit config から除外される命名 `*.contract.spec.ts` を踏襲)
- secrets 実値を fixture / mock に絶対に書かない (placeholder のみ)
