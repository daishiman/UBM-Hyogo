# Phase 11 — Manual Test Result

## 1. 視覚証跡区分

**NON_VISUAL + legal chrome screenshot sanity** — 本 workflow の主目的は Playwright e2e テスト追加だが、実装レビューで `/privacy` / `/terms` に public header/footer を戻したため、legal pages の header 表示だけスクリーンショットで補助確認した。

| screenshot | 状態 |
|------------|------|
| `outputs/phase-11/screenshots/privacy-guest-public-header.png` | present |
| `outputs/phase-11/screenshots/terms-guest-public-header.png` | present |

## 2. 自動テスト結果サマリー

| 項目 | 期待値 | 実測値 |
|------|--------|--------|
| setup-auth project 結果 | 3 setup pass（guest / member / admin storageState 生成） | PASS（2026-05-29） |
| auth-slot-coverage project 結果 | 25 TC pass（21 matrix + 4 fail/regression） | PASS（25/25、dependency setup 含め 28/28） |
| 実行時間 | < 5 min（local）/ < 15 min（CI） | 1m25s |
| storageState JSON 生成 | `apps/web/playwright/.auth/{guest,member,admin}.json` 3 ファイル | PASS（`.auth/.gitignore` により未追跡） |
| 既存 desktop-chromium project regression | 0 件（test --list overlap 0） | PASS（auth-slot specs は既存 projects の `testIgnore` に分離） |
| legal page screenshot sanity | `/privacy` / `/terms` に guest public header が表示される | PASS（Playwright CLI screenshot） |

## 3. TC 別結果

| TC ID | state | path | 期待 | 実測 | 備考 |
|-------|-------|------|------|------|------|
| TC-G01 | guest | `/` | render | PASS | `data-auth-state="guest"` |
| TC-G02 | guest | `/members` | render | PASS | - |
| TC-G03 | guest | `/register` | render | PASS | - |
| TC-G04 | guest | `/privacy` | render | PASS | legal page header restored |
| TC-G05 | guest | `/terms` | render | PASS | legal page header restored |
| TC-G06 | guest | `/profile` | redirect | PASS | `/login?redirect=/profile` |
| TC-G07 | guest | `/admin` | redirect | PASS | `/login?gate=admin_required` |
| TC-M01〜TC-M07 | member | (各) | (各) | PASS | `/admin` は `/login?gate=forbidden` |
| TC-A01〜TC-A07 | admin | (各) | (各) | PASS | `/admin` で `public-return` 可視 |
| TC-F01 | guest+invalid | `/profile` | redirect | PASS | invalid cookie fail-closed |
| TC-F02 | guest+expired | `/profile` | redirect | PASS | expired cookie fail-closed |
| TC-R01 | guest | `/` | literal 3 値 | PASS | `guest/member/admin` のみ |
| TC-R03 | guest | `/` | public-return count=0 | PASS | admin shell 専用 |

## 4. troubleshooting log（実行時記録）

| 症状 | 解決 |
|------|------|
| `/` 初回が mock API 未起動で timeout | `auth-slot-coverage.spec.ts` を既存 `../fixtures/auth` に切替し、`mockApi.reset()` を各 TC で実行 |
| `/privacy` / `/terms` に header が無く `data-auth-state` 未検出 | legal pages に `PublicHeader` / `PublicFooter` を追加 |
| member `/admin` が URL `/admin` のまま | middleware の non-admin admin guard を `/login?gate=forbidden` redirect へ統一 |

## 5. PII redaction 確認

| 項目 | 状態 |
|------|------|
| cookie 値の log 出力 | 確認: spec / fixtures 共に `console.log` なし |
| storageState JSON のコミット混入 | 確認: `.gitignore` で除外 |
| reporter json-summary に cookie 値 | PASS（console/log に cookie 値なし、storageState は `.auth/.gitignore` 管理） |

## 6. user-gated 項目

| 項目 | 承認者 | 状態 |
|------|--------|------|
| Playwright 実 実行 | daishiman | completed locally |
| CI auth-slot job dry-run | daishiman | pending remote CI |
| Gate-B 承認 | daishiman | passed locally |
