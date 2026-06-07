# issue-1111-proxy-transport-util-unify — Workflow Entry

## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | `issue-1111-proxy-transport-util-unify` |
| 由来 Issue | [#1111 admin-meetings-attendance-followup-002: admin API proxy の transport 選択ロジックを共通 util に抽出する (FU-AMA-002)](https://github.com/daishiman/UBM-Hyogo/issues/1111) |
| Issue state | `CLOSED`（未実施のまま close されている。closed のまま本ワークフローで実装仕様を作成する） |
| workflow_state | `implemented_local_evidence_captured`（実装済み・ローカル証跡取得済み。commit・PR は user 明示承認後） |
| taskType | `refactoring` |
| visualEvidence | `NON_VISUAL`（transport 選択ロジックの内部抽出。UI/UX 変更なし） |
| implementation_mode | `new`（共通 util `transport-select.ts` を新規作成し、既存 3 呼び出し側を import 切替） |
| 親 workflow | `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/` |
| 元 unassigned-task spec | issue #1111 body（`docs/30-workflows/completed-tasks/admin-meetings-attendance-followup-002-proxy-transport-util-unify.md` 相当） |
| 兄弟参照（先行 transport 設計） | `task-05a-fetchpublic-service-binding-001`（`public.ts` の逆方向 fallback 設計） / `staging-api-url-and-session-recovery`（server-side fetch の service-binding 統一） |
| 優先度 | 低（issue label: `priority:low` / `scale:small`） |
| PR base | `dev` |

## 実装区分

**[実装区分: 実装完了（ローカル証跡取得済み）]**

判定根拠（CONST_004）:

- 対象タスクは `apps/web/src/lib/fetch/transport-select.ts`（新規共通 util）の作成と、`route.ts` / `server-fetch.ts` / `public.ts` の transport 選択ロジックの import 切替という **コード変更**を伴う。
- 「transport 選択の判断点を 1 箇所に集約する（動作させる・drift を根絶する）」性質のタスクであり、ドキュメント変更だけでは Issue #1111 の目的（transport 仕様変更時の同期漏れ再発防止）は達成不能。
- 元 issue は admin 2 箇所（`route.ts` / `server-fetch.ts`）限定の pure refactor を想定していたが、**現在のコードでは同型 transport 選択イディオムが `public.ts`（public read）にも独立複製されており（YAGNI 解除条件成立・§Issue 最適化参照）**、スコープを admin + public の汎用 util 化へ拡張する（ユーザー承認済み・2026-06-06）。

## 実装サマリ（2026-06-06）

| 項目 | 状態 |
| --- | --- |
| 新規 util | `apps/web/src/lib/fetch/transport-select.ts` を追加（`resolveServiceBinding` / `stripTrailingSlash` / `selectAndFetch`） |
| 新規 util spec | `apps/web/src/lib/fetch/__tests__/transport-select.spec.ts` を追加（9 tests） |
| 呼び出し側切替 | `route.ts` / `server-fetch.ts` / `public.ts` を util 経由へ切替 |
| 挙動境界 | env 判定・fallback base・ログ shape・request 構築は呼び出し側に保持し、pure refactor を維持 |
| 検証 | focused Vitest 6 files / 44 tests PASS、web typecheck PASS、web lint PASS、Phase 12 compliance PASS |

## Issue #1111 現状調査サマリ（最新コード基準・2026-06-06）

| 項目 | 状態 |
| --- | --- |
| Issue 状態 | CLOSED（2026-06-05 close、本ワークフローは closed のまま spec 作成） |
| 共通 util（`apps/web/src/lib/fetch/transport-select.ts`） | 調査時点では未実装。本サイクルで `transport-select.ts` を新規作成し、3 呼び出し側を import 切替済み |
| admin mutation proxy（`route.ts`） | transport 選択ロジック現存（`LOCAL_DEV_FALLBACK` / `isTestOrPlaywright` / `apiBase` / `adminServiceBinding` / 分岐 96-113）。**transport ログ無し** |
| admin read（`server-fetch.ts`） | transport 選択ロジック現存（`resolveApiBase` / `isTestOrPlaywright` / `getAdminServiceBinding` / `logAdminTransport` / 分岐 554-562） |
| public read（`public.ts`） | **同型イディオムを独立複製**（`isTestOrPlaywright` / `getServiceBinding` / `getBaseUrl` / `logTransport` / 分岐 66-77）。env var が `PUBLIC_API_BASE_URL` で admin と異なる |
| auth session-resolve（`auth.ts`） | 軽量変種（`service ?? { fetch: fetchImpl }` 三項・124-132）。isTestOrPlaywright / fallback-base を持たない |
| 結論 | リファクタ未実施。YAGNI 解除条件（3 箇所目の同型イディオム出現）は `public.ts` の存在で成立。closed のまま実装仕様書を作成 |

## Issue 最適化（古い前提の現行コードへの再スコープ）

issue body は起票時（2026-06-03）の前提に基づくため、現行コード（2026-06-06）へ以下のとおり最適化する。

| # | issue 原文の前提 | 現行コードの事実 | 最適化 |
| --- | --- | --- | --- |
| O1 | YAGNI で意図的に見送り中。利用箇所が 3 箇所目に増えたときにのみ着手 | `public.ts`（public read）が `isTestOrPlaywright` + binding 優先→HTTP fallback + transport ログを独立に丸ごと再実装済み = 3 箇所目の同型イディオム | **YAGNI 解除条件成立**と判定。着手可能（Rule of Three）。AC-1 の gate を「成立」に確定 |
| O2 | 共通 util の対象は admin 2 箇所（`route.ts` / `server-fetch.ts`）。配置案 `apps/web/src/lib/admin/transport.ts` | 同型イディオムは admin（INTERNAL）と public（PUBLIC）の双方に拡散 | **配置を `apps/web/src/lib/fetch/transport-select.ts`（admin/public 中立）へ変更**。3 呼び出し側が共有 |
| O3 | 行番号 `route.ts:96-113` / `server-fetch.ts:554-562` 等 | 現行も同位置（route.ts:96-113 / server-fetch.ts:554-562 / public.ts:66-77）。行番号は陳腐化しうるため**アンカー（関数名・分岐構造）で特定** | 行番号依存を排し関数名アンカーで記述 |
| O4 | `auth.ts` は対象外（言及なし） | `auth.ts` は軽量変種（fallback-base / isTestOrPlaywright を持たない別形状） | **`auth.ts` は本タスクのスコープ外**（§スコープに理由明記）。同型 4 値 transport 選択ではないため統合すると挙動が変わる |
| O5 | `LOCAL_DEV_FALLBACK = http://127.0.0.1:8787`（route.ts のみ）/ `DEFAULT_BASE_URL = http://localhost:8787`（public.ts）/ server-fetch は fallback なし | 3 者の fallback 戦略が**全て異なる**（fail-fast null / default localhost / なし） | util は「fallback 戦略を呼び出し側ごとに引数で切替可能」な形に整理（§設計・§苦戦箇所） |

## アーキテクチャ決定（Issue「苦戦箇所」への回答）

issue の「苦戦箇所」を現行コードの事実に基づき以下のとおり決定する。**全決定の上位制約は「pure refactor（外部観測挙動の完全不変）」**。

| 苦戦箇所 | 決定 | 根拠 |
| --- | --- | --- |
| 症状1: `isTestOrPlaywright` 判定経路の差異（route.ts は `process.env` 直接 + `ENVIRONMENT==="local"` / server-fetch・public は env アクセサ経由・`local` 条件なし） | **判定述語を util に潰さず、各呼び出し側が自分の `disableBinding: boolean` を計算して util に渡す**。route.ts の `ENVIRONMENT==="local"` + `process.env` 併用は呼び出し側に保持 | 単純に片方へ寄せると真理値が変わり pure refactor を破る。util は「binding を無効化するか否か」の結果 boolean のみ受け取り、判定ロジック自体は移送しない。真理値表は phase-01 §4 に固定 |
| 症状2: binding 無効化条件の差異（route.ts: `isTestOrPlaywright(env) && env.INTERNAL_API_BASE_URL` / public: `isTestOrPlaywright() && env.PUBLIC_API_BASE_URL`） | **`resolveServiceBinding({ binding, disableBinding })` を util 共通化**。`disableBinding` は呼び出し側が `isTestOrPlaywright && <自分の baseVar>` で計算 | 無効化の「形」は共通（test 時に明示 base があれば binding を捨てる）。base var の違い（INTERNAL/PUBLIC）は呼び出し側 boolean に吸収。fixture 経路（server-fetch.binding.spec / public.spec）は呼び出し側に残し回帰確認 |
| 症状3: fallback base 解決の差異（route.ts: LOCAL_DEV_FALLBACK + staging/prod で null fail-fast / server-fetch: 末尾 `/` 除去のみ / public: DEFAULT_BASE_URL localhost） | **`resolveBase: () => string \| null` を呼び出し側が渡す**。util は base が null のとき「base 不在」を呼び出し側へ通知し、route.ts は 500、その他は呼ばれない（常に string） | 3 つの fallback 戦略を単一関数に潰さない。util は base 解決を委譲し、null fail-fast は route.ts のみが持つ。`stripTrailingSlash` のみ共有ヘルパー化 |
| 症状4: ローカル限定エンドポイント焼き込み gate（task-18） | **`LOCAL_DEV_FALLBACK`（127.0.0.1:8787）は route.ts 呼び出し側に残し util へ移送しない**。util には 127.0.0.1 系文字列を一切焼き込まない | task-18 grep gate（`127.0.0.1:8888` 禁止）対象は `apps/web/src`。util を `src/lib/fetch/` に置くため、`8787` も含め util へは移送せず route.ts 内に留める。`8888` への誤改変を静的検証 |
| transport ログの非対称（route.ts はログ無し / server-fetch は `scope:admin` / public は scope 無し） | **`logTransport` は optional 引数**。route.ts は渡さない（ログ無しを維持）。server-fetch は `scope:"admin"` 付きログ、public は scope 無しログを呼び出し側が構成して渡す | route.ts へのログ新規追加は「挙動変更」。pure refactor を守るため util の log は opt-in。ログ shape（`{ transport, scope?, path, status }`）の差異は呼び出し側が log fn を渡すことで吸収 |

## 共通 util 設計（`apps/web/src/lib/fetch/transport-select.ts`）

`isTestOrPlaywright` 判定・fallback base 解決・transport ログ shape は**呼び出し側固有**として残し、util は「binding 優先 → HTTP fallback の選択 + 実行 + ログ呼び出し」という**制御構造の骨格のみ**を共通化する。

```ts
// apps/web/src/lib/fetch/transport-select.ts （新規）
export type TransportKind = "service-binding" | "http-fallback";

/** binding を無効化するか否かを呼び出し側が計算して渡す（症状1/2 を吸収） */
export interface ResolveBindingInput {
  readonly binding: { fetch: typeof fetch } | undefined; // env.API_SERVICE
  readonly disableBinding: boolean;                      // isTestOrPlaywright && <baseVar 明示>
}
export function resolveServiceBinding(
  input: ResolveBindingInput,
): { fetch: typeof fetch } | undefined;

/** 末尾スラッシュ除去（server-fetch / route.ts 共通の base 正規化） */
export function stripTrailingSlash(base: string): string;

/** transport 選択 + 実行 + 任意ログ。base 不在は呼び出し側へ通知（症状3/4） */
export interface SelectTransportConfig {
  readonly binding: { fetch: typeof fetch } | undefined; // resolveServiceBinding の戻り
  readonly resolveBase: () => string | null;             // 呼び出し側固有の fallback 戦略
  readonly bindingUrlPrefix?: string;                    // default "https://service-binding.local"
  readonly log?: (kind: TransportKind, path: string, status: number) => void; // opt-in（route.ts は渡さない）
}
export type SelectTransportResult =
  | { readonly kind: "service-binding" | "http-fallback"; readonly response: Response }
  | { readonly kind: "base-unavailable" }; // resolveBase() === null（route.ts のみ到達しうる）

export async function selectAndFetch(
  cfg: SelectTransportConfig,
  path: string,
  init: RequestInit,
): Promise<SelectTransportResult>;
```

呼び出し側の使い分け:

| 呼び出し側 | binding 解決 | resolveBase | log | base-unavailable 時 |
| --- | --- | --- | --- | --- |
| `route.ts` | `resolveServiceBinding({ binding: env.API_SERVICE, disableBinding: isTestOrPlaywright(env) && !!env.INTERNAL_API_BASE_URL })` | `() => apiBase(env)`（LOCAL_DEV_FALLBACK + staging/prod null） | 渡さない | 500 Response を返す（現状維持） |
| `server-fetch.ts` | `resolveServiceBinding({ binding: env.API_SERVICE, disableBinding: isTestOrPlaywright() && !!env.INTERNAL_API_BASE_URL })` | `() => resolveApiBase()`（常に string） | `(k,p,s) => logAdminTransport(k,p,s)`（scope:admin） | 到達しない（base 常在） |
| `public.ts` | `resolveServiceBinding({ binding: env.API_SERVICE, disableBinding: isTestOrPlaywright() && !!env.PUBLIC_API_BASE_URL })` | `() => getBaseUrl()`（DEFAULT localhost） | `(k,p,s) => logTransport(k,p,s)`（scope 無し） | 到達しない（base 常在） |

> `public.ts` の PLAYWRIGHT cache bypass（`effectiveInit`）と `route.ts` の secret/header 構築は **呼び出し側に残す**。util は transport 選択のみを担い、request 構築・cache 制御・auth header には手を入れない。

## 13 Phase 成果物一覧

| Phase | 区分 | 成果物 |
| --- | --- | --- |
| 01 | 要件整理（真理値表含む） | `phase-01-requirements.md` |
| 02 | 設計（util surface / 呼び出し側差替） | `phase-02-design.md` |
| 03 | 設計レビュー | `phase-03-design-review.md` |
| 04 | テスト作成計画 | `phase-04-test-creation.md` |
| 05 | 実装計画 | `phase-05-implementation.md` |
| 06 | テスト拡張 | `phase-06-test-expansion.md` |
| 07 | カバレッジ確認 | `phase-07-coverage-check.md` |
| 08 | リファクタ | `phase-08-refactoring.md` |
| 09 | 品質保証 | `phase-09-quality-assurance.md` |
| 10 | 最終レビュー | `phase-10-final-review.md` |
| 11 | 手動テスト/Evidence 計画（NON_VISUAL） | `phase-11-manual-test.md` |
| 12 | 実装ガイド（strict 7 成果物） | `outputs/phase-12/*.md` |
| 13 | PR 作成 | `phase-13-pr-creation.md` |

## スコープ（CONST_007: 1 サイクル完了原則）

本ワークフローは **本実行サイクル内で transport-select.ts 新規作成 + 3 呼び出し側切替 + 回帰確認まで完了**するスコープに収めた。先送り（バックログ送り）は行わない。

### 含むもの

- 新規 `apps/web/src/lib/fetch/transport-select.ts`（`resolveServiceBinding` / `stripTrailingSlash` / `selectAndFetch`）
- `route.ts` / `server-fetch.ts` / `public.ts` の transport 分岐を util 経由へ切替（挙動完全不変）
- 新規 `apps/web/src/lib/fetch/__tests__/transport-select.spec.ts`（util 単体テスト）
- 既存回帰テスト（`route.spec.ts` / `server-fetch.binding.spec.ts` / `server-fetch.http-fallback.spec.ts` / `server-fetch.env.spec.ts` / `public.spec.ts`）を緑のまま維持

### 含まないもの

| 項目 | 理由 | 実施場所 |
| --- | --- | --- |
| `auth.ts` session-resolve の統合 | 軽量変種（`service ?? { fetch }` 三項）で isTestOrPlaywright / fallback-base / transport ログを持たない別形状。汎用 util に潰すと staging-only ログ・edge runtime 挙動が変わり pure refactor を破る | 将来 `auth.ts` の transport が isTestOrPlaywright + fallback を要するようになった時点で別 Issue 化（現時点では gap ではない） |
| transport の挙動変更（binding 無効化条件・fallback 解決規則・route.ts へのログ新規追加） | issue AC「挙動不変」と衝突。pure refactor のスコープ外 | （挙動変更が必要になった時点で別タスク） |
| 新規 endpoint / `apps/api` 変更 / D1 schema / Google Form 仕様変更 | 本タスクは web 層の内部抽出のみ | 対象外 |
| `INTERNAL_API_BASE_URL` 実値修正・環境変数注入経路の変更 | 別件 | 対象外 |

> **CONST_007 注記**: `auth.ts` 除外は「分量先送り」ではなく、**同型 4 値 transport 選択ではない別形状を無理に統合すると挙動が変わる（pure refactor 違反）**という技術的理由による。per-caller 真理値の保存が AC「挙動不変」の必須条件であり、`auth.ts` は統合対象に含めない方が整合する。

## 不変条件

1. **pure refactor**: binding 優先→HTTP fallback の分岐結果、fallback base 解決、test/playwright 時の binding 無効化条件、各 transport ログの出力内容が抽出前後で完全不変（issue AC）
2. env 参照は `apps/web/src/lib/env.ts` の公開アクセサ（`getAdminFetchEnv` / `getPublicFetchEnv` / `getEnv` / `getAuthEnv`）経由のみ。`process.env.*` 直接参照を**新規に増やさない**（CLAUDE.md task-02。route.ts の既存 `process.env` 併用は現状維持で増やさない）
3. `LOCAL_DEV_FALLBACK`（`http://127.0.0.1:8787`）の扱いを変えない。`127.0.0.1:8888` 等の禁止文字列を `apps/web/src` 配下へ新規焼き込みしない（task-18 grep gate 維持）
4. D1 直接アクセス禁止（`apps/web` から `apps/api` 経由のみ・不変条件 #5）
5. test file は `*.spec.ts` のみ（`*.test.*` 禁止・不変条件 #8）
6. 既存 `route.spec.ts` / server-fetch 系 spec / `public.spec.ts` の contract を破壊しない（回帰緑維持）

## 参照リンク

- Issue: https://github.com/daishiman/UBM-Hyogo/issues/1111
- 親 workflow: `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/`
- 重複対象1（admin mutation）: `apps/web/app/api/admin/[...path]/route.ts`（`LOCAL_DEV_FALLBACK` / `apiBase` / `adminServiceBinding` / `isTestOrPlaywright` / 分岐 96-113）
- 重複対象2（admin read）: `apps/web/src/lib/admin/server-fetch.ts`（`resolveApiBase` / `getAdminServiceBinding` / `isTestOrPlaywright` / `logAdminTransport` / 分岐 554-562）
- 重複対象3（public read・3 箇所目）: `apps/web/src/lib/fetch/public.ts`（`getServiceBinding` / `getBaseUrl` / `isTestOrPlaywright` / `logTransport` / 分岐 66-77）
- 軽量変種（スコープ外）: `apps/web/src/lib/auth.ts`（session-resolve・124-132）
- env アクセサ正本: `apps/web/src/lib/env.ts`（`getAdminFetchEnv` / `getPublicFetchEnv` / `getEnv` / `getAuthEnv`）
- 既存回帰テスト: `apps/web/app/api/admin/[...path]/route.spec.ts` / `apps/web/src/lib/admin/__tests__/server-fetch.*.spec.ts` / `apps/web/src/lib/fetch/public.spec.ts`
- 不変条件: `CLAUDE.md`（task-02 env アクセサ経由 / task-18 ローカル限定エンドポイント焼き込み禁止 grep gate）
