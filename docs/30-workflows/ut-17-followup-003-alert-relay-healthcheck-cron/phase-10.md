# Phase 10: 後付けリファクタ（最小スコープ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) |
| タスクID | ut-17-followup-003-alert-relay-automated-healthcheck-cron |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 後付けリファクタ（小規模タスク用最小スコープ） |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 9 (staging 動作確認 / 受入) |
| 次 Phase | 11 (受入テスト・evidence) |
| 状態 | pending |
| GitHub Issue | #635 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | scheduled handler の private helper 抽出と既存 `slack-sender.ts` との重複排除を「実コード変更」として確定する Phase。本タスクは小規模であるが、`verifySlackResponse` / `sendFallbackMail` の責務分離方針は再利用 / 監査性で本番影響が出るため実装仕様書として残す。 |

---

## 目的

Phase 9 で実機 staging 受入を通過した `apps/api/src/scheduled/healthcheck.ts` を対象に、
**最小スコープのリファクタ**のみを行う。本タスクは小規模であるため、以下の方針で過剰リファクタを抑止する:

- 公開 API（`runAlertRelayHealthcheck` / `scheduled` export）は変更しない
- 既存 `apps/api/src/lib/slack-sender.ts` の動作を変更しない（healthcheck 経路は body 検証が必要だが、本番 alert-relay 経路に影響しない形で分離）
- リファクタは **handler 内 private helper の整理** と **重複排除** に限る

---

## 10-1. リファクタ判定マトリクス

Phase 9 までに実装された scheduled handler が肥大化していれば private helper を抽出する。
判定は以下のマトリクスで行う:

| 観点 | 判定基準 | 該当時の対応 |
| --- | --- | --- |
| `scheduled` handler 本体の行数 | 80 行超 | `verifySlackResponse` / `sendFallbackMail` を private 関数に抽出 |
| 同 cyclomatic complexity | 8 超 | 同上 |
| `verifySlackResponse` の重複呼出 | scheduled handler 内 2 箇所以上 | 1 関数に集約 |
| `slack-sender.ts` 内 body 検証ロジック | 本番 alert-relay 経路に **存在しない**（status のみで判定している） | healthcheck 専用の検証は scheduled 側に閉じ、`slack-sender.ts` は触らない |
| `sendFallbackMail` の Resend 呼出 | 同関数内に inline されている | private 関数として閉じれば十分。`apps/api/src/lib/` への切り出しは不要 |

> **結論方針**: 抽出は `apps/api/src/scheduled/healthcheck.ts` 内 **private**（同ファイル内 module-local 関数）にとどめる。
> `apps/api/src/lib/` への新規ファイル追加は、再利用候補が他に出てくるまで **行わない**（過剰抽象化の回避）。

---

## 10-2. 抽出候補と判定

### 候補 A: `verifySlackResponse(status: number, bodyText: string): boolean`

| 項目 | 内容 |
| --- | --- |
| 抽出先 | `apps/api/src/scheduled/healthcheck.ts` 内 private |
| 理由 | Phase 9 AC-3 / AC-4 の判定核心ロジック。テスト容易性のため pure 関数化が望ましい |
| 既存 `slack-sender.ts` との関係 | `slack-sender.ts` の `sendSlackMessage` は status のみで OK 判定する。本関数は **healthcheck 専用の追加検証**であり、`slack-sender.ts` には組み込まない（本番 alert-relay 経路に副作用を出さない） |
| シグネチャ | `function verifySlackResponse(status: number, bodyText: string): boolean` |
| 実装 | `return status === 200 && bodyText.trim() === "ok";` |
| テスト | `verifySlackResponse(200, "ok") === true` / `verifySlackResponse(200, "no_service") === false` / `verifySlackResponse(404, "ok") === false` / 前後空白付き `" ok "` で true |

### 候補 B: `sendFallbackMail(env: ApiEnv, reason: string): Promise<void>`

| 項目 | 内容 |
| --- | --- |
| 抽出先 | `apps/api/src/scheduled/healthcheck.ts` 内 private |
| 理由 | Resend API への POST はテストで mock fetch を差し替える必要があり、helper 化しないと scheduled handler 本体の test が肥大化する |
| 既存重複 | なし。`apps/api` に Resend 経由のメール送信は本タスクで初導入 |
| シグネチャ | `async function sendFallbackMail(env: ApiEnv, reason: string): Promise<void>` |
| 実装方針 | `env.RESEND_API_KEY` / `env.HEALTHCHECK_FALLBACK_EMAIL` のいずれかが未設定なら no-op。両方設定済みなら Resend `POST https://api.resend.com/emails` で件名 `UT-17 healthcheck failed at <ISO>` / 本文 `reason=<reason>` を送信 |
| エラー処理 | Resend 側も throw する可能性があるが、scheduled handler 全体で catch して `console.error("fallback_mail_throw")` を残し、handler 自体は `ok=false` で正常 return（throw を re-raise しない＝Cloudflare retry で multi-mail を防止） |

### 候補 C: `apps/api/src/lib/` への切り出し（実施しない）

| 項目 | 内容 |
| --- | --- |
| 判定 | **実施しない** |
| 根拠 | 現時点で本タスク以外の caller が存在しない。Premature abstraction を避け、再利用候補が現れた時点で別タスクで切り出す（YAGNI） |
| 将来移動条件 | `verifySlackResponse` を本番 alert-relay 経路にも適用したい（= Slack revoke を本番経路でも検知したい）需要が出た場合、`apps/api/src/lib/slack-response-verifier.ts` として切り出す followup を起票 |

---

## 10-3. 既存 `slack-sender.ts` との重複排除方針

### 現状分析

`apps/api/src/lib/slack-sender.ts` の `sendSlackMessage` は:

- status 2xx 全てを `ok: true` と判定（body 未検証）
- 4xx は non-retryable / 429 + 5xx は retry / それ以外も retry
- backoff 指数 retry を持つ

### healthcheck 経路の必要要件

- 単発の POST で十分（retry は 1 回で良い。週次に発火するため次回 cron で自然 retry される）
- status === 200 + body === "ok" の両面検証が必須
- 重い backoff は不要

### 重複排除判定

| パターン | 採否 |
| --- | --- |
| (a) `sendSlackMessage` を healthcheck からも呼び、戻り値の `ok=true` を信用して **追加で body fetch** する | **不採用**。`sendSlackMessage` 内で `res.body` を消費しないため、healthcheck 側で再度 fetch すると Slack に 2 回 POST する事故になる |
| (b) `sendSlackMessage` に optional callback `verifyBody?: (text: string) => boolean` を追加し、healthcheck はその callback を渡す | **不採用**。本番 alert-relay 経路の sendSlackMessage シグネチャに影響を与えるため、UT-17 本体のテストも巻き込む。本タスクスコープ外 |
| (c) healthcheck は `sendSlackMessage` を **使わず**、scheduled handler 内で薄い `fetch` + `verifySlackResponse` を直書きする | **採用**。retry 戦略が違う / body 検証要件が違う / 本番 alert-relay 経路を完全に touch しない 3 点で合理的 |

### 採用結果

scheduled handler 内で:

```ts
const res = await fetch(env.SLACK_WEBHOOK_URL_HEALTHCHECK ?? env.SLACK_WEBHOOK_URL, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(healthcheckMessage),
});
const bodyText = await res.text();
const slackOk = verifySlackResponse(res.status, bodyText);
```

を直書きし、`slack-sender.ts` は **本タスクで一切変更しない**。

---

## 10-4. 変更対象ファイル一覧

| ファイル | 変更内容 |
| --- | --- |
| `apps/api/src/scheduled/healthcheck.ts` | private helper `verifySlackResponse` / `sendFallbackMail` 抽出（既に Phase 2 で inline 実装済みなら関数化のみ）。本体 `runAlertRelayHealthcheck` の行数 / cyclomatic を 10-1 マトリクス基準まで削減 |
| `apps/api/src/scheduled/healthcheck.test.ts` | private helper を export せず、`runAlertRelayHealthcheck` 経由で fetch を mock して網羅。`verifySlackResponse` の table-driven test を `runAlertRelayHealthcheck` の境界ケースで間接的にカバー |
| `apps/api/src/lib/slack-sender.ts` | **変更なし**（10-3 採用結果） |
| `apps/api/src/lib/cloudflare-alert-formatter.ts` | 既存 formatter を healthcheck payload にも流用。**変更なし** または、healthcheck 用の固定 message 生成だけ healthcheck.ts 内 local helper として持つ |

---

## 10-5. 主要関数シグネチャ（リファクタ後）

```ts
// apps/api/src/scheduled/healthcheck.ts

import type { ApiEnv } from "../env";

export interface HealthcheckMailFallbackResult {
  readonly ok: boolean;
  readonly slackStatus: number;
  readonly slackBodyOk: boolean;
  readonly fallbackSent: boolean;
  readonly reason?: string;
}

export async function runAlertRelayHealthcheck(env: ApiEnv): Promise<HealthcheckMailFallbackResult>;

// private helpers (同ファイル内 module-local)
function verifySlackResponse(status: number, bodyText: string): boolean;
function buildHealthcheckMessage(): SlackBlockKitMessage; // 固定 payload 生成
async function sendFallbackMail(env: ApiEnv, reason: string): Promise<void>;
function chooseWebhookUrl(env: ApiEnv): string; // SLACK_WEBHOOK_URL_HEALTHCHECK ?? SLACK_WEBHOOK_URL
```

---

## 10-6. 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `runAlertRelayHealthcheck` | `ApiEnv` | `HealthcheckMailFallbackResult` | Slack POST 1 回 + 失敗時 Resend POST 1 回 |
| `verifySlackResponse` | status, body | boolean | なし（pure） |
| `buildHealthcheckMessage` | なし | `SlackBlockKitMessage` | なし（pure） |
| `sendFallbackMail` | env, reason | `Promise<void>` | Resend API POST 1 回（env 未設定時 no-op） |
| `chooseWebhookUrl` | env | string | なし（pure） |

---

## 10-7. テスト方針 / 検証コマンド

| 種別 | コマンド | 期待 |
| --- | --- | --- |
| 静的 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| 静的 | `mise exec -- pnpm --filter @ubm-hyogo/api lint` | PASS |
| ユニット | `mise exec -- pnpm --filter @ubm-hyogo/api test -- scheduled` | 既存テストが全 PASS（リファクタは振る舞いを変えない） |
| 行数確認 | `wc -l apps/api/src/scheduled/healthcheck.ts` | `runAlertRelayHealthcheck` 本体 80 行以下 |
| 重複確認 | `grep -n "status === 200 && " apps/api/src/scheduled/healthcheck.ts` | 1 箇所のみ（`verifySlackResponse` 内） |
| 既存 `slack-sender.ts` 無変更確認 | `git diff dev -- apps/api/src/lib/slack-sender.ts` | empty diff |

---

## 10-8. リグレッション防止

| リスク | 対策 |
| --- | --- |
| リファクタ中に Slack 投稿フォーマットが崩れる | Phase 9 で取得した tail.log の Slack 投稿テキストと、リファクタ後の `buildHealthcheckMessage()` 出力 snapshot を比較。差分は **ゼロ** で完了とする |
| Monday gate のロジックを誤って削除 | `apps/api/src/index.ts` の scheduled export 内 gate に変更がないことを `git diff` で確認 |
| `sendFallbackMail` の throw を re-raise してしまい Cloudflare cron retry が連続発火 | `runAlertRelayHealthcheck` の try/catch で `sendFallbackMail` の例外を握り潰し、`reason="fallback_mail_throw"` で `ok=false` を返す。テストで明示的に検証 |
| `slack-sender.ts` を誤って変更 | 10-7 git diff チェックを Phase 10 DoD に含める |

---

## 10-9. DoD

- [ ] 10-1 マトリクス基準で hander 本体が 80 行以下 / cyclomatic 8 以下
- [ ] `verifySlackResponse` / `sendFallbackMail` が private helper として整理されている
- [ ] `slack-sender.ts` に diff がない（`git diff dev -- apps/api/src/lib/slack-sender.ts` が empty）
- [ ] vitest 全 PASS（既存テストの修正は signature 維持のため不要）
- [ ] Phase 9 で取得した Slack 投稿テキストと、リファクタ後の `buildHealthcheckMessage()` snapshot が一致
- [ ] `outputs/phase-10/refactor-summary.md` に before/after の行数 / 抽出関数一覧 / 不採用候補が記録

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 9 | tail.log の Slack 投稿テキストを snapshot 比較に流用 | リグレッション防止 |
| Phase 11 | リファクタ後の scheduled handler を受入テストで再実行 | Phase 11 で再 staging deploy + 1 回 send で snapshot 再確認 |
| UT-17 本体 | `slack-sender.ts` 無変更を維持 | 本番 alert-relay 経路への副作用なし |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/api/src/lib/slack-sender.ts | 既存 sender との責務分離判定根拠 |
| 必須 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-09.md | staging 受入結果 |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md「6.1 Slack 200 = OK ではない問題」 | body 検証必須の根拠 |
| 参考 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-10/refactor-summary.md | UT-17 本体リファクタの記録フォーマット |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/refactor-summary.md | before/after 行数 + 抽出関数一覧 + 不採用候補の根拠 |
| メタ | artifacts.json | phase-10 を completed に更新 |

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-10 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 11（受入テスト・evidence）
- 引き継ぎ事項:
  - `verifySlackResponse` を本番 alert-relay 経路にも展開したい需要が出たら、本ファイル 10-2 候補 C の通り新 followup タスクを起票
  - リファクタ後 snapshot は Phase 11 受入テストで再利用
- ブロック条件: `slack-sender.ts` に diff が入った / `runAlertRelayHealthcheck` のシグネチャが変わった / vitest FAIL のいずれか
