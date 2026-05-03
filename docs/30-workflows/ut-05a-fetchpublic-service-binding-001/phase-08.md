# Phase 8: DRY 化 — ut-05a-fetchpublic-service-binding-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-fetchpublic-service-binding-001 |
| task_id | UT-05A-FETCHPUBLIC-SERVICE-BINDING-001 |
| phase | 8 / 13 |
| wave | Wave 5 |
| mode | serial |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #387 (CLOSED) |

## 目的

`apps/web` 内で service-binding (`env.API_SERVICE.fetch(...)`) を利用する経路は
本タスクの `fetchPublic` 以外にも `fetchSessionResolve` (`apps/web/src/lib/auth.ts`)
が存在する。両者の共通パターンを抽出可能か検討し、共通 helper の設計案を提示する。
本タスクスコープ内での実抽出可否は Phase 10 final review で判断する（CONST_007 — 今回サイクルで完了させる前提でスコープ判断する）。

## 実行タスク

1. `fetchPublic` と `fetchSessionResolve` の service-binding / HTTP fallback 分岐の重複箇所を一覧化する
2. 共通 helper（例: `apps/web/src/lib/fetch/createServiceBindingFetcher.ts`）の interface 案を提示する
3. 抽出時の影響範囲（型・テスト・revalidate 仕様）を明記する
4. 本サイクルで抽出するか否かの判断材料を Phase 10 final review に渡す

## 参照資料

- apps/web/src/lib/fetch/public.ts（実コード・編集禁止）
- apps/web/src/lib/auth.ts（実コード・編集禁止）
- apps/web/wrangler.toml

## DRY 観点

| 重複候補 | `fetchPublic` の該当 | `fetchSessionResolve` の該当 | 対処方針案 |
| --- | --- | --- | --- |
| `getCloudflareContext()` の try/catch ラップ | `readEnv()` | 同等処理 | 共通 helper `readPublicEnv()` に抽出可 |
| `env.API_SERVICE` 取得 | `getServiceBinding()` | 同等処理 | 共通 helper `resolveFetcher(env)` に抽出可 |
| `https://service-binding.local{path}` URL 構築 | `doFetch` | 同等パターン | 抽出時に固定文字列定数化 |
| HTTP fallback base URL 解決 | `getBaseUrl()` | `INTERNAL_API_BASE_URL` ベースで微妙に差異あり | 抽出時に baseUrl 解決を引数化 |
| 404 / 5xx 応答ハンドリング | `FetchPublicNotFoundError` | session 文脈固有のエラー | 抽出対象外（呼び出し側の責務） |

## 共通 helper 設計案

```ts
// apps/web/src/lib/fetch/createServiceBindingFetcher.ts（設計案・本タスクでは作成しない）

import { getCloudflareContext } from "@opennextjs/cloudflare";

interface ServiceBinding { fetch: typeof fetch }

export interface ServiceBindingFetcherOptions {
  /** service-binding 不在時の fallback base URL */
  fallbackBaseUrl: () => string;
  /** service-binding 経由時に使う仮想 host（既定: service-binding.local） */
  virtualHost?: string;
}

export interface CreatedFetcher {
  /** service-binding 優先 + HTTP fallback の fetch */
  fetch: (path: string, init?: RequestInit & { next?: { revalidate: number } }) => Promise<Response>;
  /** どちらの transport で動作したかを観測するためのタグ */
  transport: () => "service-binding" | "http-fallback";
}

export function createServiceBindingFetcher(
  bindingKey: "API_SERVICE",
  options: ServiceBindingFetcherOptions,
): CreatedFetcher;
```

抽出時の利用イメージ:

- `fetchPublic` 側: `fallbackBaseUrl = () => env.PUBLIC_API_BASE_URL ?? process.env.PUBLIC_API_BASE_URL ?? "http://localhost:8787"`
- `fetchSessionResolve` 側: `fallbackBaseUrl = () => env.INTERNAL_API_BASE_URL ?? "http://localhost:8787"`

## 抽出時の影響範囲

- ユニットテスト: 共通 helper のテストへ集約。各呼び出し側は薄いラッパーになる
- 型: `RequestInit & { next?: { revalidate: number } }` を helper シグネチャへ昇格
- 観測: `transport()` の値を `console.log` で `transport: 'service-binding'` 形式で出力する責務を helper に集約 → AC-5 観測も helper 単位で安定化

## スコープ判断（Phase 10 final review に渡す材料）

| 判断軸 | 抽出する側へ寄せる材料 | 抽出しない側へ寄せる材料 |
| --- | --- | --- |
| 安全性 | helper にテストを集中でき、`fetchPublic` / `fetchSessionResolve` の共通ロジックが 1 箇所で固定される | 既存実装は staging / production で動作確認済。共通化により local fallback 系の regression リスクが増える |
| スコープ | 重複箇所が明確で抽出は機械的 | 本タスクのスコープは「経路統一の仕様化」であり、refactor は別 ticket 化可 |
| Phase 11 evidence 整合 | helper 経由でも AC-5 観測語句を一致させられる | 既存実装のまま evidence 取得が最短 |

> 結論案: 本タスクサイクル内では **既存実装そのまま** で AC-1〜AC-6 を満たし、共通 helper 抽出は別タスク（例: `ut-05a-followup-001-extract-service-binding-fetcher`）として起票する案を Phase 10 final review に提出する。CONST_007 に従い、本サイクルでスコープ確定する。

## 多角的チェック観点

- DRY 化により仕様の正本が `apps/web/src/lib/fetch/` に集約されること
- 抽出しない場合でも、`auth.ts` 側の transport 観測が AC-5 と矛盾しないこと
- 共通化は将来の同型 service-binding 経路（admin API 等）にも流用できる構造であること

## 統合テスト連携

共通 helper 抽出を採用する場合は、Phase 11 の `code-diff-summary.md` に抽出差分と呼び出し側の regression 結果を追記する。採用しない場合も、`fetchPublic` と `fetchSessionResolve` の transport 表記が Phase 11 tail evidence と矛盾しないことを確認する。

## サブタスク管理

- [ ] 重複箇所を一覧化
- [ ] 共通 helper interface 案を確定
- [ ] スコープ判断材料を Phase 10 final review に渡す
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- outputs/phase-08/main.md

## 完了条件

- 重複箇所が一覧化されている
- 共通 helper の interface 案が提示されている
- 本サイクルで抽出するか否かの判断材料が Phase 10 final review に渡されている

## タスク100%実行確認

- [ ] 同一仕様を 2 箇所以上に書いていない
- [ ] 既存コード（`public.ts` / `auth.ts` / `wrangler.toml`）を改変する記述が含まれていない

## 次 Phase への引き渡し

Phase 9 へ、共通 helper 設計案とスコープ判断材料を渡す。
