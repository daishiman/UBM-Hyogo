# 実装ガイド — issue-863-admin-error-alert-policy-iac

> issue: [#863](https://github.com/daishiman/UBM-Hyogo/issues/863)（CLOSED のまま仕様書化）
> タスク種別: NON_VISUAL / 状態: `implemented_local_runtime_pending`

## Part 1: 中学生向け概念説明（なぜ必要か → 何をするか）

なぜ必要か。学校の教室には火災報知器が付いている。煙を感知したら自動でベルが鳴り、先生がすぐ駆けつけられる仕組みだ。
もしこの報知器の「どれくらいの煙で鳴らすか」「どの教室を見張るか」という設定が、先生個人のメモ帳に手書きでメモしてあるだけだったら、
メモを無くしたり、誰かが勝手に設定を変えても、誰も気づけない。これは安全のうえでとても困る。

このサイトには会員さんが使う公開ページと、運営の人だけが使う「事務室」のような管理画面がある。
これまで、管理画面でエラー（不具合）が起きたときに知らせる「報知器の設定」が、きちんとした台帳ではなくバラバラの場所にあって、
「どのくらいの頻度で鳴らすか」を後から確認したり、変更の履歴を追ったりできなかった。

何をするか。そこで、報知器の設定書を「メモ帳」ではなく「台帳」で管理することにする。
台帳とは、設定をちゃんとした書類（ファイル）に書き残し、誰がいつ何を変えたかが全部分かる仕組みのことだ。
この「設定を書類で管理して、書類どおりに自動で反映する」やり方を IaC（設定の書類化）と呼ぶ。
具体的には、エラーの煙を感知する部品に「どの教室で起きたか」「何番の事故か」という札を確実に付け、
「管理画面で同じ番号の事故が短時間に何回も起きたらベルを鳴らす」という設定を台帳ファイルに書き、
台帳どおりかを毎月自動で見張る役（CI）を置く。これで人が気づく前にチャットへ自動通知が飛ぶようになる。

### 今回作ったもの

今回作ったものは 4 つある。1 つ目は、管理画面のエラーに `scope=admin` と `digest` の札を付けて Sentry に送る logger の修正。
2 つ目は、Sentry の alert rule を台帳化する `infra/sentry-alerts/` の JSON / schema / CLI。
3 つ目は、台帳と Sentry の実設定がズレていないかを毎月見る GitHub Actions。
4 つ目は、通知が鳴ったときに最初に何を見るかをまとめた runbook。

## Part 2: 技術者向け詳細

### 型定義

`apps/web/src/lib/logger.ts` の `emit()` で、`captureException` / `captureMessage` に渡す `tags` を `Record<string, string>` の
`sentryTags` に集約する。`merged.scope` / `merged.digest` は `LogFields` の index signature（`[key: string]: unknown`）由来のため、
`typeof merged.scope === "string"` / `typeof merged.digest === "string"` の guard を通したときのみ `sentryTags` へ昇格する。
IaC 側の型は `infra/sentry-alerts/lib/types.ts` に `CanonicalSentryPolicy` / `SentryAlertFilter` / `SentryAlertFrequency` / `SentryAlertAction` / `SentryRuleListEntry` を定義する。

```ts
export interface SentryAlertFilter {
  field: "event" | "scope" | "runtime" | "digest";
  value: string;
}
export interface SentryAlertFrequency {
  window_minutes: number;
  threshold: number;
}
export interface SentryAlertAction {
  type: "slack";
  target: string;
  workspace_id_env: string;
  channel_id_env?: string;
  tags: string[];
}
export interface CanonicalSentryPolicy {
  name: string;
  description: string;
  environment: "production" | "staging";
  action_match: "all";
  filter_match: "all";
  filters: SentryAlertFilter[];
  frequency: SentryAlertFrequency;
  actions: SentryAlertAction[];
  notification_interval_minutes: number;
}
```

### Sentry alert rule JSON

`infra/sentry-alerts/policies/admin-error-boundary.json` を正本とする。`filters` は `event=error.boundary.caught` と
`scope=admin` の AND、`frequency` は `window_minutes=5 / threshold=3`、`actions` は `slack → #ubm-hyogo-incidents`。
digest は logger で Sentry tag に昇格し、Slack 通知の表示 tags に含める。Sentry Issue Alert API には任意 tag での group-by 指定がないため、
rule 自体は Sentry issue grouping + 5 分 3 回の frequency condition を正本とし、digest は一次切り分け用の通知 tag として扱う。

```json
{
  "$schema": "../schema/policy.schema.json",
  "name": "admin-error-boundary",
  "description": "Admin scope error.boundary.caught alert (regression guard for SSR render error digest=167275886)",
  "action_match": "all",
  "filter_match": "all",
  "filters": [
    { "field": "event", "value": "error.boundary.caught" },
    { "field": "scope", "value": "admin" }
  ],
  "frequency": { "window_minutes": 5, "threshold": 3 },
  "notification_interval_minutes": 5,
  "actions": [
    {
      "type": "slack",
      "target": "#ubm-hyogo-incidents",
      "workspace_id_env": "SENTRY_SLACK_WORKSPACE_ID",
      "tags": ["environment", "event", "scope", "digest"]
    }
  ],
  "environment": "staging"
}
```

### APIシグネチャ

`infra/sentry-alerts/lib/` は `infra/cloudflare-alerts/lib/` をミラーする。主要シグネチャは次のとおり。

```ts
export function loadExpected(repoRoot: string): CanonicalSentryPolicy[];
export function canonicalizeSentryPolicy(input: unknown): CanonicalSentryPolicy;
export function diffPolicy(
  expected: CanonicalSentryPolicy[],
  actual: CanonicalSentryPolicy[],
): Drift[];
export function listAlertRules(): Promise<SentryRuleListEntry[]>;
export function createAlertRule(body: CanonicalSentryPolicy): Promise<void>;
export function updateAlertRule(id: string, body: CanonicalSentryPolicy): Promise<void>;
export async function runCli(argv: string[]): Promise<number>; // list|diff|plan|apply
```

### 使用例

```bash
pnpm test:sentry-alerts
SENTRY_ALERTS_MOCK_DIR=tests/fixtures/sentry-alerts pnpm sentry-alerts:diff --ci --json
SENTRY_SLACK_WORKSPACE_ID=293854098 pnpm sentry-alerts:apply --yes
```

`list` / `diff` は read token、`apply --yes` は operator 承認後の write-capable token で実行する。
PR CI は manifest と diff logic の unit test のみを実行し、schedule / workflow_dispatch は read-only diff だけを実行する。

### エラーハンドリング

logger 側は fail-soft を維持する。capture が同期 throw しても `try/catch` で握り、logger 本体は throw しない（ユーザー画面に観測系失敗を伝播させない）。
CLI 側 exit code は cloudflare-alerts と同一: `0`=success/no-drift/dry-run、`2`=drift detected、`64`=usage error、`78`=config error（env 不足）。
`apply --ci` は read-only CI 境界を壊すため拒否する。`canonicalize` は server 生成キー（`id` / `dateCreated` / `dateUpdated` / `$schema` / `actorId`）を strip し、`filters` を `field+value` で sort して順序非依存比較を可能にする。

### エッジケース

Sentry API が返す Issue Alert rule は `actionMatch` / `filterMatch` / `conditions` / `actions` の camelCase 形で、repo の manifest は読みやすい snake_case 形で保持する。
そのため `canonicalizeSentryPolicy()` が API response と manifest を同じ canonical form に変換してから diff する。
Slack workspace ID や channel ID は secret / environment value なので manifest に実値を置かず、`workspace_id_env` / `channel_id_env` の環境変数名だけを置く。
実 API apply 時に env が欠けていれば config error として exit 78 にする。

### 設定項目と定数一覧

| パラメータ | 値 / 供給元 |
|---|---|
| `SENTRY_ORG` / `SENTRY_PROJECT` | GitHub Variables（CI）/ `.env`（op:// 参照経由） |
| `SENTRY_AUTH_TOKEN`（read scope） | `SENTRY_AUTH_TOKEN_READ` GitHub Secret / op:// 参照 |
| apply 用 write token | op:// 参照のみ。CI Secret には登録しない |
| `SENTRY_SLACK_WORKSPACE_ID` / `SENTRY_SLACK_CHANNEL_ID` | apply 時のみ operator 環境から供給。repo には実値を保存しない |
| `SENTRY_ALERTS_MOCK_DIR` | unit test / mock 切替（cloudflare `CF_ALERTS_MOCK_DIR` ミラー） |
| frequency.window_minutes / threshold | `5` / `3`（policy JSON） |
| Slack target | `#ubm-hyogo-incidents`（09b-A 連携済み） |

### テスト構成

`apps/web/src/lib/__tests__/logger.spec.ts` は `scope` / `digest` が Sentry tags に昇格され、非 string 値は tag に入らないことを確認する。
`infra/sentry-alerts/lib/__tests__/schema-contract.spec.ts` は manifest schema の許容 field と secret 混入禁止を確認する。
`load.spec.ts` は policy JSON の canonical load、`diff.spec.ts` は missing / extra / changed の drift 検出を確認する。
`tests/fixtures/sentry-alerts/rules.json` は Sentry Issue Alert API の response 形を模した mock で、`SENTRY_ALERTS_MOCK_DIR=... pnpm sentry-alerts:diff --ci --json` が `[]` を返すことを確認する。

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。本タスクは logger telemetry の内部構造変更と IaC ファイル群であり、
レンダリング対象を持たない。代替証跡は自動テスト（`logger.spec.ts` の tag 検証 + `infra/sentry-alerts/lib/__tests__/*` の unit）であり、
詳細は [../phase-11/manual-test-result.md](../phase-11/manual-test-result.md) を参照する。
