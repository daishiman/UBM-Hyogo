# Phase 4: テスト戦略 — ut-05a-fetchpublic-service-binding-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-fetchpublic-service-binding-001 |
| task_id | UT-05A-FETCHPUBLIC-SERVICE-BINDING-001 |
| phase | 4 / 13 |
| wave | Wave 5 |
| mode | serial |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #387 (CLOSED) |

## 目的

`apps/web` の `fetchPublic` を Cloudflare Workers の service-binding
(`env.API_SERVICE.fetch(...)`) 優先 + HTTP fallback 経路に統一した実装に対し、
ユニット / ローカル smoke / staging deploy / production deploy / tail 観測の
役割分担と各 AC の検証戦略を確定する。

## 実行タスク

1. service-binding 分岐 / HTTP fallback 分岐の選択ロジックを Vitest で検証する設計を確定する。
2. ローカル `pnpm dev` における `PUBLIC_API_BASE_URL` 経由 fallback の手動 smoke 手順を定める。
3. staging / production deploy 後の curl smoke ステータス確認を AC-3 / AC-4 に割り当てる。
4. `bash scripts/cf.sh tail` で `transport: 'service-binding'` 観測を確認する手段を定める。
5. PII / token redaction の責務を log evidence の PASS 条件に紐付ける。

## 参照資料

- apps/web/src/lib/fetch/public.ts（実コード・編集禁止）
- apps/web/src/lib/auth.ts（既存 service-binding 実装の参照）
- apps/web/wrangler.toml（services binding 設定）
- docs/30-workflows/unassigned-task/task-05a-fetchpublic-service-binding-001.md
- scripts/cf.sh / scripts/with-env.sh

## テスト戦略

### Layer 1: ユニットテスト（Vitest）

- 対象 AC: AC-1
- 範囲:
  - `env.API_SERVICE` が定義されているケース → `binding.fetch(url, init)` が呼ばれ、URL が `https://service-binding.local{path}` 形式であること
  - `env.API_SERVICE` が undefined のケース → `globalThis.fetch` が `${PUBLIC_API_BASE_URL}{path}` で呼ばれること
  - `getCloudflareContext()` が throw するケース → fallback で `process.env.PUBLIC_API_BASE_URL` を採用
  - 5xx / 404 を返した場合の `fetchPublic` / `fetchPublicOrNotFound` の throw 形（`FetchPublicNotFoundError` を含む）
- 手段: `getCloudflareContext` を mock し、mock Fetcher を `env.API_SERVICE` として注入

### Layer 2: ローカル smoke（HTTP fallback 経路）

- 対象 AC: AC-6
- 手順:
  - `.dev.vars` に `PUBLIC_API_BASE_URL` を設定
  - `mise exec -- pnpm --filter web dev`
  - localhost で `/` `/members` が 200 を返すこと
- evidence: `outputs/phase-11/local-dev-fallback.log`

### Layer 3: staging deploy 後 curl smoke

- 対象 AC: AC-3
- 手段:
  - `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` 実行後
  - `curl -s -o /dev/null -w "%{http_code}\n" https://<staging-host>/`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://<staging-host>/members`
- evidence: `outputs/phase-11/staging-curl.log`

### Layer 4: production deploy 後 curl smoke

- 対象 AC: AC-4
- 手段:
  - user 明示 GO 後に `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production`
  - `/` `/members` curl 200 を確認
- evidence: `outputs/phase-11/production-curl.log`

### Layer 5: `wrangler tail` 観測

- 対象 AC: AC-5
- 手段: `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging` のログに
  `transport: 'service-binding'` 文字列が含まれること
- evidence: `outputs/phase-11/wrangler-tail-staging.log`

### AC ↔ Layer 対応

| AC | 内容 | Layer | 主コマンド | evidence path |
| --- | --- | --- | --- | --- |
| AC-1 | service-binding 優先 + HTTP fallback の実装（コード仕様） | Layer 1 | `pnpm --filter web test fetch/public` | `outputs/phase-11/code-diff-summary.md` |
| AC-2 | wrangler.toml の `[[env.*.services]]` 設定 | Layer 3 / Layer 4（deploy 成功で間接検証） | `bash scripts/cf.sh deploy ...` | `outputs/phase-11/code-diff-summary.md` |
| AC-3 | staging `/` `/members` 200 | Layer 3 | `curl -s -o /dev/null -w "%{http_code}\n"` | `outputs/phase-11/staging-curl.log` |
| AC-4 | production `/` `/members` 200 | Layer 4 | 同上 | `outputs/phase-11/production-curl.log` |
| AC-5 | tail log に `transport: 'service-binding'` | Layer 5 | `bash scripts/cf.sh tail ...` | `outputs/phase-11/wrangler-tail-staging.log` |
| AC-6 | local fallback regression なし | Layer 2 | `mise exec -- pnpm --filter web dev` | `outputs/phase-11/local-dev-fallback.log` |

## 統合テスト連携

- `apps/web/src/lib/auth.ts` の `fetchSessionResolve` と同じ service-binding 利用パターンを参照。Phase 8 で DRY 化検討。
- `apps/api` 側の health 応答仕様に依存しない（経路観測のみが本タスク範囲）。

## 多角的チェック観点

- ハッピーパス（service-binding 経路 200）のみで PASS にしない
- HTTP fallback の局所 regression を AC-6 の独立 evidence で必ず確認する
- redaction 漏れ（tail / curl log への token 混入）を PASS 条件に含める

## サブタスク管理

- [ ] AC-1〜AC-6 に Layer を割り当てる
- [ ] ユニットテストの mock 構造を定義する
- [ ] ローカル fallback smoke の `.dev.vars` 必須キーを列挙する
- [ ] redaction checklist を log evidence の PASS 条件に紐付ける
- [ ] outputs/phase-04/main.md を作成する

## 成果物

- outputs/phase-04/main.md

## 完了条件

- AC-1〜AC-6 がいずれかの Layer で検証可能になっている
- Layer 別のコマンド・evidence path が `outputs/phase-11/` 配下と一致している
- redaction の責務が log evidence の PASS 条件に組み込まれている

## タスク100%実行確認

- [ ] AC ↔ Layer の割当に漏れがない
- [ ] ユニット / smoke / deploy / tail の役割分担が明確である
- [ ] redaction ルールが含まれている

## 次 Phase への引き渡し

Phase 5 へ、AC ↔ Layer 割当・ユニットテスト構造・ローカル fallback smoke 手順・staging/production deploy 後 curl 手順を渡す。
