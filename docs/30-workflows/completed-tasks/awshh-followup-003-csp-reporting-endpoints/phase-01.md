# Phase 1: 要件定義

## Why（なぜ必要か）

apps-web-security-headers-hardening (#886) で `Content-Security-Policy-Report-Only` を導入したが、`report-to` / `report-uri` 未設定のため CSP 違反イベントが**どこにも送信されず観測不能**。enforce 切替（U-AWSHH-001）の誤検知・許可漏れ origin の判断材料が取れず、放置すると enforce 後に会員機能を壊すリスクが高い。

## 主問題（1 文固定）

「Report-Only CSP を入れたのに違反レポート送信先が無く観測できない」状態を、**受信先を確定（Sentry CSP endpoint）してヘッダ・ディレクティブを実装する**ことで解消する。

## 真の論点 / 切り分け

- 真の論点: 受信先未定が実装ブロッカー → 本サイクルで Sentry に確定し先送りを断つ（CONST_007）。
- 案件の混在排除: enforce 切替（U-AWSHH-001）と受信側内製（apps/api + D1）は本タスクに混ぜない。本タスクは「ヘッダ出力 + 受信先 SaaS 確定 + privacy/retention 文書化」に限定。

## 既存命名規則の分析（実装整合のため記録）

| 対象 | 既存命名 |
| --- | --- |
| 関数 | camelCase（`buildCspDirective` / `buildSecurityHeaders` / `applySecurityHeaders`） |
| 型 | PascalCase（`SecurityHeaderConfig` / `SecurityHeaderMode`） |
| モジュール内定数 | UPPER_SNAKE（`PERMISSIONS_POLICY_DIRECTIVES`） |
| 公開 env | `NEXT_PUBLIC_` prefix + UPPER_SNAKE（`NEXT_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_SENTRY_DSN`） |
| テスト | `*.spec.ts`（不変条件 #8） |

→ 新規定数は `CSP_REPORT_GROUP` / `CSP_REPORT_MAX_AGE_SECONDS`、新規 env は `NEXT_PUBLIC_SENTRY_DSN`、新規関数は `buildReportingEndpointsHeader` / `buildReportToHeader` とする。

## AC（受入条件）

- **AC-1**: `reportEndpoint` 設定時 `buildSecurityHeaders` が `Reporting-Endpoints` / legacy `Report-To` ヘッダを出力。
- **AC-2**: CSP `report-to <group>` の `<group>` が `Reporting-Endpoints` / `Report-To` グループ名と一致（`CSP_REPORT_GROUP` 由来）。
- **AC-3**: CSP に `report-uri <url>` 併記（レガシー互換）。
- **AC-4**: `reportEndpoint` 未設定時は report 系ヘッダ/ディレクティブを一切出力しない（後方互換）。
- **AC-5**: 公開 env は `getEnv()`/`getPublicEnv()` 経由のみ（`process.env` 直接参照を増やさない）。
- **AC-6**: `apps/api` / D1 schema 不変（`git diff --stat -- apps/api apps/api/migrations` 0 件）。
- **AC-7**: CSP payload の個人情報項目と Sentry retention / data scrubbing が runbook 文書化。

## CONST_007 先送り禁止

- 「受信先が決まらないので別 wave」は禁止。本サイクルで Sentry に確定。
- 内製受信（apps/api + D1）は不変条件 #5 と 1 サイクル完結を破るため scope out として明示し、SaaS で受信側実装ゼロにする。

## inventory

| 項目 | 値 |
| --- | --- |
| 変更ファイル | security-headers.ts / env.ts / middleware.ts  / security-headers.spec.ts |
| 新規 endpoint | なし |
| D1 table | なし |
| 新規 secret | なし（CSP report URL は公開値） |

## 次フェーズ引き継ぎ

Phase 2 で関数シグネチャ・グループ名一致設計・env 注入経路を確定する。
