## Summary

- `apps/api/src/routes/internal/alert-relay.ts` の Cloudflare KV `get` / `put` 失敗を、固定 schema の構造化 JSON ログとして `console.warn` 経由で 1 行 emit
- `event: "alert_relay_kv_op_failed"` を後段 logpush / Workers Logs filter の固定文字列契約として予約（UT-17-FU-006 dashboard 化の入力契約）
- `KV.get` 失敗時を従来 unhandled（→ 500）から fail-open（dedup skip して Slack 配信続行）へ意図的に変更
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` に 4 ケース（get throw / dedupeKeyHash 再現性 / put throw / 成功路）追加
- monthly healthcheck runbook に「KV 操作エラーログの確認」セクション追記（grep 例 / しきい値 / schema 表）

## 技術契約（schema 固定）

```ts
type AlertRelayKvOpFailedLog = {
  event: "alert_relay_kv_op_failed"; // 固定リテラル
  op: "get" | "put";
  errorClass: string;          // err instanceof Error ? err.constructor.name : typeof err
  dedupeKeyHash: string;       // SHA-256 first 12 hex chars (lowercase)
  isolateId: string;           // crypto.randomUUID() — module top で 1 回採番
  ts: string;                  // new Date().toISOString()
};
```

- `event` 文字列は後段 logpush filter / Workers Logs grep の固定キー。**改名は破壊的変更**として扱う
- `dedupeKeyHash` は SHA-256 first 12 hex chars に短縮。**raw `dedupeKey` はログに出さない**
- `isolateId` は module top で 1 回採番（handler 内採番なし）

## behaviour change（意図的）

| 観点 | 改修前 | 改修後 |
| --- | --- | --- |
| `KV.get(dedupeKey)` 失敗時 | try/catch 無し → handler まで例外伝播 → 500 / unhandled | try/catch + `logKvOperationError("get", err, dedupeKey)` + `seen = null` 相当で通常処理続行（**fail-open**） |
| `KV.put(...)` 失敗時 | 既存 catch 内で plain object を `console.warn` | 既存 catch 内で `logKvOperationError("put", err, dedupeKey)` 呼び出し。レスポンス（`dedupPersisted: false`）は不変 |
| dedupe TTL / Slack 配信路 / レスポンス body | 不変 | 不変（`get` failure path のみ 500 → 200 系に変化）|

`get` failure path の fail-open 化は通知系の一般原則（「鳴らさない」より「鳴らす」に倒す）に基づく意図的変更。

## 変更ファイル

### apps/api（編集）

- `src/routes/internal/alert-relay.ts` — module top で `isolateId = crypto.randomUUID()` 採番、private helper `sha256Hex12` / `logKvOperationError` 追加、`KV.get` を try/catch で包み fail-open 化、`KV.put` 既存 catch を helper 呼び出しに置換
- `src/routes/internal/__tests__/alert-relay.spec.ts` — 4 ケース追加: (a) `KV.get` throw → warn 1 回 emit + payload assert, (b) 同一 dedupeKey の dedupeKeyHash 再現性, (c) `KV.put` throw → warn 1 回 emit + payload assert, (d) 成功路 → warn 0 回。`afterEach(() => vi.restoreAllMocks())` 追加

### docs / runbook

- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` — 「KV 操作エラーログの確認」セクション追加（grep 例 / 直近 1 時間で 10 件超のしきい値 / schema 表）
- `docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/` — Phase 1-13 仕様書群（`phase-{01..13}.md` / `outputs/phase-{01..13}/*` / `artifacts.json` / `outputs/artifacts.json`）

### 変更なし（明示）

- `apps/web/` 配下: 変更なし
- `apps/api/wrangler.toml`: 変更なし（`[triggers]` / `[vars]` / `[env.*]` / `ALERT_DEDUP_KV` binding は既存設定を参照のみ）
- `apps/api/src/env.ts`: 変更なし（`ALERT_DEDUP_KV` 型は既存定義を参照のみ）
- D1 schema / Google Form schema / Slack 配信路 / dedupe TTL: 変更なし

## 検証手順

### ローカル

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
```

期待: 全 PASS。`@ubm-hyogo/api` のパッケージ名は `apps/api/package.json#name` の実態に置換可。

### 機密値スキャン（PASS 期待 = 0 件）

```bash
git grep -E "hooks\.slack\.com/services/[A-Z0-9/]+" -- ':!.dev.vars.example' ':!*.md'
```

### staging / production（外部実施 / user-gated）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production

# emit 観測（イベント発生時のみ出力・未発生は正常）
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \
  | grep alert_relay_kv_op_failed
```

## ロールバック

| 範囲 | 手順 |
| --- | --- |
| デプロイ | `bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/api/wrangler.toml --env <env>` |
| コード（fail-open 解除）| `KV.get` の try/catch 除去で改修前挙動に戻る（通知系 sage 観点で非推奨）|
| ログ schema 変更 | `event` 文字列は本 PR で予約済み。変更は UT-17-FU-006 以降で follow-up issue を先に立てる |

## post-merge アクション

1. `docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md` を `docs/30-workflows/completed-tasks/` へ `git mv`
2. UT-17-FU-006（KV usage dashboard 化）の unassigned-task ファイル起票（本 PR で予約した `event` 文字列を入力契約として明記）
3. external ops: staging deploy → production deploy → wrangler tail で emit 観測（未発生 = 正常）
4. dev → main の昇格 PR を別途作成

## Test plan

- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `pnpm --filter @ubm-hyogo/api test` PASS
- [x] 機密値 grep 0 件
- [x] `apps/web/` 配下に変更なし
- [x] `event` 文字列が `"alert_relay_kv_op_failed"` リテラルとして固定
- [x] `isolateId` が module top で 1 回採番（handler 内採番なし）
- [x] `dedupeKeyHash` が 12 hex chars（raw `dedupeKey` はログ payload に含まれない）
- [ ] staging deploy 成功（外部実施）
- [ ] production deploy 成功（外部実施）
- [ ] wrangler tail で emit 観測可能であることを確認（外部実施 / イベント発生時のみ）

## 不変条件チェック

- [x] fail-open 維持（`get` failure 時も Slack 配信は止めない）
- [x] alert-relay 主機能（dedupe TTL / `formatCloudflareAlertToSlack` / Slack 配信 retry）に変更なし
- [x] D1 直接アクセスを追加していない
- [x] Secret は 1Password → Cloudflare Secrets / `.env` に実値なし
- [x] Cloudflare CLI は `bash scripts/cf.sh` 経由のみ（PR 内で `wrangler` 直接実行なし）
- [x] `apps/web/` 配下に変更がない
- [x] 既存 runbook の上書きなし（追記方式）

## スクリーンショット

NON_VISUAL タスクのため UI スクリーンショットなし。Workers Logs での emit 観測は
external ops 実施時に follow-up コミットで `outputs/phase-11/` 配下に追加する想定
（本 PR では空のまま）。

## 関連 Issue

Refs #701（CLOSED / completed marked / 実コードは本 PR で初実装）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
