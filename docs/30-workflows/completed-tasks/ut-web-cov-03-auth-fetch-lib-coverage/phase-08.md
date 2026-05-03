# Phase 8: DRY 化 — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

> 当タスクは当初 `docs-only` として起票されたが、目的達成に Vitest テストファイル新規作成 + helper 抽出が必須のため、CONST_004（実態優先）に従い `taskType` を `implementation` に補正している。本 Phase は test 間の重複検出と helper 抽出方針を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 8 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 改訂日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 5-7 で計画された 7 test ファイルから重複 mock setup を抽出し、`apps/web/src/test-utils/` に DRY 化する。命名・配置の規約を確定し、各 test ファイルの差分方針を決める（実コードは書かない、方針のみ）。

## 実行タスク

1. test 間で重複しうる mock pattern を列挙する。
2. DRY 化判定基準（同一 pattern が 3 ファイル以上で再利用される場合のみ抽出）を適用。
3. helper API シグネチャを確定。
4. 抽出後の各 test ファイルからの置換差分方針を記述。
5. 命名規約（`test-utils/<concern>-mock.ts`）を確定。

## 参照資料

- docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/phase-05.md（Step 1-7 mock 雛形）
- docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/phase-06.md（観測 input/output）

## 重複検出マトリクス

| mock pattern | 使用 test file | 出現数 | DRY 判定 | 抽出先 |
|---|---|---|---|---|
| `vi.spyOn(globalThis, "fetch")` + Response factory | magic-link-client / authed / public / auth | **4** | ◯ 抽出 | `test-utils/fetch-mock.ts` |
| `vi.mock("@opennextjs/cloudflare")` cloudflare context | public / authed (env 解決経由) | 2 | × inline | — |
| `vi.mock("next/headers")` cookies stub | authed のみ | 1 | × inline | — |
| `vi.mock("next-auth/react")` signIn stub | oauth-client のみ | 1 | × inline | — |
| Auth.js provider factory mock (`vi.mock("@auth/core/providers/google")`) | auth のみ | 1 | × inline | — |
| `vi.mock("@/lib/auth")` getAuth stub | session のみ | 1 | × inline | — |

判定基準: **3 ファイル以上で再利用される場合のみ抽出**。それ未満は inline で重複を許容（過剰抽出は test の独立性を損なうため）。

## helper API 設計

### `apps/web/src/test-utils/fetch-mock.ts`（新規）

```ts
import type { MockInstance } from "vitest";

/**
 * 単発の fetch レスポンスを mock する。
 * @param status HTTP status code
 * @param body JSON-serializable body
 * @param init 追加 ResponseInit (headers 等)
 * @returns spy instance（追加 assertion 用）
 */
export function mockFetchOnce(
  status: number,
  body: unknown,
  init?: ResponseInit,
): MockInstance;

/**
 * 連続する複数の fetch レスポンスを順番に mock する。
 */
export function mockFetchSequence(
  responses: Array<{ status: number; body: unknown; init?: ResponseInit }>,
): void;

/**
 * fetch がネットワークエラーを throw するように mock する。
 */
export function mockFetchNetworkError(message?: string): void;

/**
 * spy を解除して元の fetch を復元する（afterEach で呼ぶ）。
 */
export function restoreFetch(): void;
```

将来的に cloudflare context mock の利用が 3 ファイル以上に拡張された場合は同じ helper に追記する想定（API 予約のみ）:

```ts
// 予約: 拡張時に同 helper に追加
// export function mockCloudflareContext(env?: Partial<CloudflareEnv>): void;
```

## 命名・配置規約

- 配置: `apps/web/src/test-utils/<concern>-mock.ts`
- 命名: 名詞-mock.ts（例: `fetch-mock.ts`）。動詞 (set/install) は避ける。
- export: 個別関数 named export のみ。default export 禁止。
- 型: `MockInstance` 等は `vitest` から import。`Response` は global 使用。

## 抽出後の置換差分方針

| test file | 置換前 | 置換後 |
|---|---|---|
| `magic-link-client.test.ts` | `vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(...))` | `mockFetchOnce(202, { state: "sent" })` |
| `fetch/authed.test.ts` | 同上 | `mockFetchOnce(401, "")` / `mockFetchNetworkError()` |
| `fetch/public.test.ts` | 同上 | `mockFetchOnce(200, { ok: true })` |
| `auth.test.ts` | 同上（fetchSessionResolve の API call） | `mockFetchOnce(200, { memberId: "m1" })` 等 |

実コードの書き換えは Phase 5 Step 7（auth.test.ts）完了後にまとめて行い、helper 抽出は test 単独緑を確認してから実施する（順序: inline 実装で緑 → helper 抽出 → 再実行で緑維持）。

## DRY 化判定の判断ロジック

- **抽出する**:
  - 3 ファイル以上で同一 pattern。
  - mock 引数が 1-3 個に収まる。
  - test の意図を読みやすくする（assertion focus に集中できる）。
- **抽出しない**:
  - 1-2 ファイルのみで使用。
  - mock 引数が複雑（多数の config option）。
  - test ごとに mock の callback 内ロジックが大きく異なる。

`vi.mock("@/lib/auth")`（session.test.ts のみ）や Auth.js provider factory mock（auth.test.ts のみ）は単一ファイル使用のため抽出しない、と本仕様で明記する。

## ローカル実行コマンド

```bash
# helper 単体に対する型チェック
mise exec -- pnpm typecheck

# helper 抽出後の全 test 緑確認
mise exec -- pnpm --filter web test
mise exec -- pnpm --filter web test:coverage

# lint
mise exec -- pnpm lint
```

## 実行手順

- 対象 directory: docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装時は Phase 5 で全 test 緑にしてから本 Phase の helper を抽出し、再実行で緑維持を確認する。

## 統合テスト連携

- 上流: 05a-authjs-google-oauth-admin-gate, 05b-B-magic-link-callback-credentials-provider
- 関連 quality gate: 06b-A-me-api-authjs-session-resolver; release readiness handoff: 09b-A-observability-sentry-slack-runtime-smoke

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。
- helper 抽出によって test の独立性・読みやすさを損なわない。

## サブタスク管理

- [ ] 重複検出マトリクスを完成させる
- [ ] helper API シグネチャを確定
- [ ] 各 test file の置換差分方針を確定
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- outputs/phase-08/main.md（DRY decision log）

## 完了条件 (DoD)

- `apps/web/src/test-utils/fetch-mock.ts` が API 仕様通り定義されている。
- 4 ファイル（magic-link-client / fetch/authed / fetch/public / auth）が helper を使用するよう置換されている。
- 全 test 再実行で緑維持。
- coverage 維持（≥85% / ≥80%）。
- 単一ファイル使用の mock は inline のままであり、過剰抽出していない。

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] CONST_005 必須項目を該当範囲で具体化済み
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ、helper API 仕様、抽出後の test 構成、coverage 維持確認手順を渡す。
