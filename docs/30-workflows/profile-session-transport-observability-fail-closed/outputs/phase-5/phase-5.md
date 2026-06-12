# Phase 5: 実装手順インデックス

## メタ情報
正本: `outputs/phase-5/phase-5.md` / 上位 SSOT: `../../_shared-context.md`

参照: `../phase-2/phase-2.md`（§1 レーン設計）/ `../phase-4/phase-4.md`（I/O 契約・テスト期待値表）/ `../../_shared-context.md`（§4 変更対象・§11 タスク分解）

## 目的
T01-T04 の実装タスク本体（`task-0N-*.md`）への索引を提供し、依存順・レーン・各タスクの責務境界を固定する。各 task 本体は CONST_005 の 6 必須項目（変更対象ファイル一覧と種別 / 主要シグネチャ / 入出力・副作用 / テスト方針 / ローカル実行コマンド / DoD）を持つ。

---

## 1. タスク一覧と本体リンク

| タスク | 領域 | レーン | 本体 | 概要 |
|--------|------|--------|------|------|
| T01 | `apps/web/src/lib/fetch`（transport.ts / errors.ts / authed.ts） | A | [`task-01-fetch-transport-fail-closed-and-descriptor.md`](./task-01-fetch-transport-fail-closed-and-descriptor.md) | `resolveApiFetch` fail-closed + `describeTransport` + `ApiTransportError` + `FetchAuthedError` 診断メタ拡張 + authed 配線 |
| T02 | `apps/web/src/lib`（env.ts） | A（前段・直列） | [`task-02-env-environment-resolution.md`](./task-02-env-environment-resolution.md) | `getEnvironmentResolution` 追加（環境解決 + 明示注入判定） |
| T03 | `apps/web/src/lib/server-fetch`（safe-fetch.ts） | B | [`task-03-safe-fetch-transport-log.md`](./task-03-safe-fetch-transport-log.md) | `server_fetch_failed` ログに `transportKind`/`baseHost` 追加 + `transportFromError` |
| T04 | `scripts/`（diagnose-profile-session.sh） | C | [`task-04-diagnose-script-transport-echo.md`](./task-04-diagnose-script-transport-echo.md) | transport 確認手順 echo 追加（read-only・冪等） |

---

## 2. 依存順（実装着手順）

```
T02 (env.getEnvironmentResolution)
  └─→ T01 (transport fail-closed + authed 配線が T02 の戻り値を入力に使う)   [レーン A 直列]

T03 (safe-fetch ログ拡張)   [レーン B] ── T01 が定義する error 診断メタ shape（Phase 4 §5 で契約固定済）に依存。契約は確定済のため実装は並列着手可
T04 (diagnose echo)         [レーン C] ── 完全独立・並列
```

- **レーン A（T02 → T01）**: `getEnvironmentResolution` の戻り値 `{ environment, explicit }` を `authed.ts` が `resolveApiFetch` の `environment` / `environmentExplicit` に配線するため、T02 を先に確定させる。
- **レーン B（T03）**: `FetchAuthedError`/`ApiTransportError` の診断メタ shape（Phase 4 §5）に依存するが、shape は契約として固定済のため T01 と並列で実装してよい。最終結合確認（authed → safe-fetch の実 error フロー）は Phase 9 直列 validation で締める。
- **レーン C（T04）**: コードに依存しないシェルスクリプト変更。独立並列。

## 3. 共通の不変条件（全 task 共通・SSOT §6）

1. 既存 API endpoint surface 不変・`apps/api` 非接触（diff 空が DoD）。
2. env 参照は `env.ts` 公開アクセサ経由のみ。`process.env` 直接参照禁止。
3. `127.0.0.1` / `localhost` / `8787` / `8888` の新規リテラル焼き込み禁止（`verify-no-localhost-bake` gate）。既存 `localhost-allow:local-fallback` コメント規約を維持。
4. memberId / cookie / secret / token をログに出力しない（host とステータスのみ）。
5. 新規 test ファイルは作らず既存 spec に追記。新規 test ファイルを作る場合は `*.spec.{ts,tsx}` のみ。
6. 公開シグネチャ後方互換（`safeServerFetch` / `getEnvironment` / `FetchAuthedError` constructor）。`resolveApiFetch` の localhost fallback は明示 local（`environmentExplicit === true`）だけに制限する。

## 4. レーン横断の結合点（Phase 3 で特定・Phase 4 で契約固定）

唯一の結合点は「transport 解決 → 診断メタ生成（`describeTransport`）→ error に付与（authed）→ ログ出力（safe-fetch）」の一方向フロー。契約は Phase 4 §4/§5 に固定済。各 task は契約の自分の担当部分のみ実装し、shape を勝手に変えない。

## 統合テスト連携
各 task の focused spec（T1-T5）は Phase 4 のテスト期待値表に従う。Phase 9 で全 focused run + `verify-no-localhost-bake --src-only` + `git diff --stat apps/api`（空）を直列実行して締める。実機統合は Phase 11（`wrangler tail` を `scripts/cf.sh` 経由・user-gated）。

## 参照資料
- `../phase-2/phase-2.md`（レーン設計）/ `../phase-4/phase-4.md`（I/O 契約）/ `../../_shared-context.md`
- `task-01-fetch-transport-fail-closed-and-descriptor.md` / `task-02-env-environment-resolution.md` / `task-03-safe-fetch-transport-log.md` / `task-04-diagnose-script-transport-echo.md`

## 成果物
- `outputs/phase-5/phase-5.md`
- `outputs/phase-5/task-01-fetch-transport-fail-closed-and-descriptor.md`
- `outputs/phase-5/task-02-env-environment-resolution.md`
- `outputs/phase-5/task-03-safe-fetch-transport-log.md`
- `outputs/phase-5/task-04-diagnose-script-transport-echo.md`

## 完了条件
- [x] T01-T04 のレーン・依存順・本体リンクを索引化した。
- [x] 共通不変条件と結合点契約参照を固定した。
- [x] 各 task 本体（CONST_005 6 項目）への導線を整備した。
