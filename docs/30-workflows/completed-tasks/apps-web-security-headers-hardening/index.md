# apps-web-security-headers-hardening

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=NON_VISUAL]`（CONST_004: 防御層を `apps/web` に追加する目的達成にコード変更が必須のため実装仕様書として作成）

## 目的

ブラウザコンソールに観測された 3 系統のノイズ（うち 2 系統は browser extension / Google 配信スクリプト起因、1 系統は未配信）に対し、`apps/web` Workers レスポンスに**明示的なセキュリティヘッダ**（CSP / Permissions-Policy / Trusted Types）を追加して防御層を確立する。

## 背景

報告されたエラー:
- `POST http://127.0.0.1:8888/ ERR_CONNECTION_REFUSED` (`content.js:21`) — 拡張機能起因
- `prepare.js: TrustedScript assignment blocked` — 拡張機能起因
- `Permissions-Policy: 'browsing-topics' unrecognized` — Google 配信スクリプト起因

切り分け（`rg -n "8888|browsing-topics|trusted-types|Permissions-Policy|Content-Security-Policy" apps/web` 全てヒット 0）により `apps/web/src` への焼き込みは存在しない。CLAUDE.md 不変条件には違反していないが、現状 `apps/web` は **CSP / Permissions-Policy / Trusted Types を一切出力していない**。本ワークフローでは防御層を整備する。

## スコープ

| 含む | 含まない |
|------|---------|
| `apps/web` Workers レスポンスヘッダへの CSP / Permissions-Policy / Trusted Types 追加 | `apps/api` 側のヘッダ追加 |
| OpenNext Workers / `middleware.ts` ベースのヘッダ注入機構 | 既存 API endpoint 変更 |
| task-18 regression smoke grep gate との整合確認 | D1 schema 変更 |
| Playwright smoke での header presence 確認 | 拡張機能側の挙動修正（不可） |

## 不変条件

1. `apps/web` env 参照は `getEnv()` / `getPublicEnv()` 経由のみ（task-02）
2. 既存 D1 直接アクセス禁止（`apps/web` から）
3. `127.0.0.1:8888` を `apps/web/src` に焼き込まない（task-18 grep gate）
4. CSP は最初 **report-only** で導入し、production 影響観測後に enforce 切替（段階導入）

## Phase 構成

| Phase | 名称 | 成果物 |
|-------|------|--------|
| 1 | 要件定義 | `outputs/phase-1/requirements.md` |
| 2 | 設計 | `outputs/phase-2/design.md` |
| 3 | 設計レビュー | `outputs/phase-3/design-review.md` |
| 4 | テスト作成 | `outputs/phase-4/test-plan.md` |
| 5 | 実装 | `outputs/phase-5/implementation-plan.md`（P1/P2/P3 を section 分割） |
| 6 | テスト実装結果 | `outputs/phase-6/test-implementation-result.md` |
| 7 | 統合結果 | `outputs/phase-7/integration-result.md` |
| 8 | 品質ゲート | `outputs/phase-8/quality-gate.md` |
| 9 | QA | `outputs/phase-9/qa-result.md` |
| 10 | 最終レビュー | `outputs/phase-10/final-review.md` |
| 11 | 手動テスト | `outputs/phase-11/manual-test-result.md`（NON_VISUAL header 出力検証） |
| 12 | ドキュメント更新 | strict 7 canonical outputs |
| 13 | PR 作成 | user 明示承認後 |

## 並列実行単位（Phase 5 内）

P1 / P2 / P3 は同一ファイル群（`apps/web/middleware.ts` または `apps/web/src/lib/security-headers.ts`（新規））を編集するため、**段階的直列実行**を推奨。並列化する場合は section 分割で conflict 回避。

## 関連タスク

- task-02 wrangler-env-injection
- task-18 regression smoke grep gate
- ui-prototype-alignment-mvp-recovery

## 実装結果

- `apps/web/src/lib/security-headers.ts`: CSP report-only / Permissions-Policy / Referrer-Policy / X-Content-Type-Options / X-Frame-Options の純関数。
- `apps/web/middleware.ts`: 全 route matcher に拡張し、既存 admin/profile 認証 response と通常 response の双方へ security headers を付与。
- `apps/web/src/lib/security-headers.spec.ts`: Phase 4 TC-01〜08。
- `apps/web/playwright/tests/security-headers.spec.ts`: HTTP response header smoke。
