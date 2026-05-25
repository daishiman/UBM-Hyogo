# Phase 11: NON_VISUAL 手動テスト結果

## タスク種別と NON_VISUAL 宣言

| 項目 | 値 |
|------|-----|
| task_id | TASK-AWSHH-FU-001-CSP-ENFORCE-CUTOVER |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 非視覚的理由 | CSP モード切替はレスポンスヘッダの変更のみであり、UI 描画・レイアウト・コンポーネントに変化が生じない |
| 代替証跡の方針 | 自動テスト（Vitest / Playwright）の合否と curl コマンド検証手順を証跡とする |

スクリーンショットを取得しない理由: ヘッダ変更は HTTP レスポンスレベルの変更であり、ブラウザの画面描画に差異が生じないため、スクリーンショットはエビデンスとして無意味である。`outputs/phase-11/` 配下に screenshots ディレクトリは作成しない。

---

## 自動テスト証跡（取得済み）

以下の各コマンドは green（exit 0）を確認済み。

### TC-01〜04: getSecurityHeaderEnv 単体テスト（env.spec.ts）

| TC ID | テストケース名 | 検証内容 |
|-------|-------------|---------|
| TC-01 | CSP_MODE 未設定時のデフォルト値 | `getSecurityHeaderEnv()` の `cspMode` が `"report-only"` であること |
| TC-02 | CSP_MODE=enforce 注入時の値 | `cspMode` が `"enforce"` であること |
| TC-03 | apiBaseUrl の解決 | `NEXT_PUBLIC_API_BASE_URL` が `apiBaseUrl` として返ること |
| TC-04 | 不正値注入時の throw | `CSP_MODE="invalid"` を注入すると zod parse が throw すること |

実行コマンド:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- env.spec
```

結果: TC-01〜04 全件 PASS。

### TC-05/06: middleware CSP ヘッダ切替（security-headers.spec.ts）

| TC ID | テストケース名 | 検証内容 |
|-------|-------------|---------|
| TC-05 | enforce モード時のヘッダ名 | `Content-Security-Policy` ヘッダが存在し `Content-Security-Policy-Report-Only` が不在であること |
| TC-06 | report-only モード時のヘッダ名 | `Content-Security-Policy-Report-Only` ヘッダが存在し `Content-Security-Policy` が不在であること |

実行コマンド（既存 security-headers.spec.ts の enforce 回帰も含む）:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- security-headers.spec
```

結果: TC-05/06 を含む全件 PASS。

### TC-07/08: Playwright モード追従テスト（security-headers.spec.ts）

| TC ID | テストケース名 | 検証内容 |
|-------|-------------|---------|
| TC-07 | CSP_MODE 追従 + 反対ヘッダ absent | `process.env.CSP_MODE` から期待するヘッダ名を導出し、HTTP レスポンスに正しいヘッダが存在し反対側が不在であること |
| TC-08 | connect-src ディレクティブ | CSP に `connect-src` ディレクティブが含まれること（enforce / report-only 双方） |

実行コマンド（enforce モード検証）:

```bash
CSP_MODE=enforce PLAYWRIGHT_BASE_URL=http://127.0.0.1:3108 \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/security-headers.spec.ts --project=desktop-chromium
```

実行コマンド（report-only モード検証）:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3107 \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/security-headers.spec.ts --project=desktop-chromium
```

結果: TC-07/08 を含む全件 PASS。

---

## 代替証跡テーブル

以下のローカル証跡が green を満たすことを確認済み。

| Evidence | コマンド | 期待結果 |
|----------|----------|--------|
| Vitest（env.spec.ts TC-01〜04 / security-headers 回帰 / middleware） | `mise exec -- pnpm --filter @ubm-hyogo/web test -- env.spec security-headers.spec middleware.spec` | PASS（136 passed / 1 skipped files; 963 passed / 1 skipped tests） |
| Playwright（TC-07/08、enforce 注入） | `CSP_MODE=enforce PLAYWRIGHT_BASE_URL=http://127.0.0.1:3108 ... playwright test security-headers.spec.ts --project=desktop-chromium` | PASS（6/6） |
| Playwright（TC-07/08、report-only） | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3107 ... playwright test security-headers.spec.ts --project=desktop-chromium` | PASS（6/6） |
| Typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| Lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | PASS |
| Build | `ENVIRONMENT=local ... mise exec -- pnpm --filter @ubm-hyogo/web build` | PASS（env 必須契約のため local env を明示） |
| grep ガード（ハードコード禁止） | `rg -n "cspMode.*report-only.*hard" apps/web/src/middleware.ts` | hit 0 |

---

## 手動 curl 検証手順（ローカル）

ローカル開発サーバーを起動した状態で以下を実行する。

### enforce モード確認

```bash
# CSP_MODE=enforce でローカルサーバーを起動（方法は実装者が確認）
curl -I http://localhost:3000/ | grep -i "content-security-policy"
```

期待: `content-security-policy:` 行が出力され、`content-security-policy-report-only:` 行が出力されないこと。

### report-only モード確認（デフォルト）

```bash
# CSP_MODE 未指定でローカルサーバーを起動
curl -I http://localhost:3000/ | grep -i "content-security-policy"
```

期待: `content-security-policy-report-only:` 行が出力され、`content-security-policy:` 行（enforce 版）が出力されないこと。

---

## Staging / Production deploy 後の curl 検証（user-gated）

以下の手順は runtime boundary であり、ユーザー明示承認後にのみ実行する。

```bash
# staging（CSP_MODE=enforce が設定されている）
curl -I https://<staging-url>/ | grep -i "content-security-policy"
# 期待: content-security-policy ヘッダが存在

# production（CSP_MODE=report-only が設定されている）
curl -I https://<production-url>/ | grep -i "content-security-policy"
# 期待: content-security-policy-report-only ヘッダが存在
```

---

## Phase 11 evidence file inventory

| Status | Path | 内容 |
|--------|------|------|
| present / PASS | `apps/web/src/lib/env.spec.ts` | getSecurityHeaderEnv TC-01〜04 |
| present / PASS | `apps/web/playwright/tests/security-headers.spec.ts` | TC-07/08 mode追従 + connect-src |
| 実装済み（変更禁止） | `apps/web/src/lib/security-headers.spec.ts` | enforce 回帰ガード（既存） |
| n/a | screenshots | NON_VISUAL のため不要 |
