# 実装ガイド: CSP 違反レポートの集約（Reporting-Endpoints / Report-To / report-to）

## Part 1: 中学生にもわかる説明

### なぜ必要？

ウェブサイトには「このサイトでは決められた場所からしか画像やプログラムを読み込みません」というルール（CSP）があります。いまはこのルールを「破ってもブロックはしないけど、本当はダメだよ」という**お試しモード**で動かしています。

ところが、ルール違反が起きても**それを誰も受け取っていない**状態です。ノートに記録せずに「違反があったかも」と言っているだけなので、本当に違反があったのか、どこで起きたのか分かりません。

### 何をする？

違反が起きたら、その報告を**Sentry という記録ノート（すでに使っているサービス）**に自動で送るようにします。ブラウザに「違反を見つけたら、この住所（Sentry）に手紙を送ってね」と教えるための住所ラベル（`Reporting-Endpoints` と互換用 `Report-To`）を貼り、ルール本体にも「報告先はそのラベルだよ」（`report-to`）と書き添えます。

これで違反の数や内容が記録され、「お試しモード」から「本気でブロックするモード」に安全に切り替える判断ができるようになります。

### たとえ話

学校の落とし物ルールを「破っても怒らないお試し期間」にしているけれど、落とし物の報告箱が無い状態。報告箱（Sentry）を置いて、「落とし物を見つけたらこの箱に入れてね」と貼り紙（Reporting-Endpoints）をするのが今回の作業です。

## Part 2: 技術者向け詳細

### 変更概要

`apps/web/src/lib/security-headers.ts` に `Reporting-Endpoints` / legacy `Report-To` レスポンスヘッダと CSP `report-to`（+ レガシー `report-uri`）を追加し、CSP violation report を既存導入済み Sentry の CSP security endpoint へ集約する。受信側実装は不要（SaaS）。

### 型定義 / シグネチャ

```ts
export interface SecurityHeaderConfig {
  cspMode: SecurityHeaderMode;
  apiBaseUrl: string;
  authOrigin: string;
  reportEndpoint?: string; // CSP 違反送信先。未設定なら report 系を出力しない
}

const CSP_REPORT_GROUP = "csp-endpoint"; // report-to と Reporting-Endpoints / Report-To のグループ名を一致させる正本
const CSP_REPORT_MAX_AGE_SECONDS = 10886400;

export const buildSentryCspReportUrl = (
  dsn: string | undefined,
): string | undefined => {
  // public/browser DSN から Sentry CSP security endpoint を導出する。
};

export const buildReportingEndpointsHeader = (
  cfg: SecurityHeaderConfig,
): string | null =>
  cfg.reportEndpoint ? `${CSP_REPORT_GROUP}="${cfg.reportEndpoint}"` : null;

export const buildReportToHeader = (
  cfg: SecurityHeaderConfig,
): string | null => {
  // legacy Report-To JSON。未設定なら null。
};
```

`buildCspDirective`: `reportEndpoint` 設定時のみ `report-to ${CSP_REPORT_GROUP}` と `report-uri ${cfg.reportEndpoint}` を append。
`buildSecurityHeaders`: `buildReportingEndpointsHeader` / `buildReportToHeader` が非 null のとき `Reporting-Endpoints` / `Report-To` ヘッダを set。

### env / 設定

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN` | 既存公開 env（非機密） | Sentry public/browser DSN。`PublicEnvSchema` に追加し、`getPublicEnv()` 経由で middleware が参照。`buildSentryCspReportUrl()` で CSP security endpoint URL を導出 |

新規 CSP 専用 URL env は増やさない。local や未設定環境では report 系未出力となり後方互換を保つ。public key は DSN 内公開値のため、導出後の CSP report URL も secret 扱いしない。

### 出力ヘッダ例（reportEndpoint 設定時）

```
Reporting-Endpoints: csp-endpoint="https://o123.ingest.sentry.io/api/456/security/?sentry_key=abc"
Report-To: {"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"https://o123.ingest.sentry.io/api/456/security/?sentry_key=abc"}],"include_subdomains":true}
Content-Security-Policy-Report-Only: default-src 'self'; ...; report-to csp-endpoint; report-uri https://o123.ingest.sentry.io/api/456/security/?sentry_key=abc
```

### エラーハンドリング / エッジケース

- `reportEndpoint` が `undefined` / `""`: report 系ヘッダ・ディレクティブを一切出力しない（fail-soft、例外なし）。
- 不正 URL: `env.ts` の `z.string().url()` が parse 時に弾く（getEnv が throw → `app/error.tsx` boundary が補足）。security-headers 側で二重バリデーションしない。
- enforce モード: `report-to` / `Reporting-Endpoints` / `Report-To` は report-only / enforce 双方で出力される。

### 設定可能パラメータ / 定数

| 名前 | 値 | 役割 |
| --- | --- | --- |
| `CSP_REPORT_GROUP` | `"csp-endpoint"` | グループ名の単一正本（drift 防止） |
| `CSP_REPORT_MAX_AGE_SECONDS` | `10886400` | legacy `Report-To` max_age |
| `reportEndpoint` | URL or undefined | 送信先。未設定で無効化 |

### テスト

`apps/web/src/lib/security-headers.spec.ts` に TC-1〜9。実行: `mise exec -- pnpm --filter @ubm-hyogo/web test -- security-headers`。

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要（NON_VISUAL）。代替証跡は `outputs/phase-11/evidence/reporting-endpoints-curl.log`（staging ヘッダ到達）と `privacy-review.md`（user-gated runtime 実行時に生成）。
