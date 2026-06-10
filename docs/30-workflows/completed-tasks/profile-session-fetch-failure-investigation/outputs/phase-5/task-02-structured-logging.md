# task-02: `/me` 取得失敗の構造化ログ出力（server-side 観測性）

`[実装区分: 実装仕様書（診断・観測性向上のコード変更を含む）]`

> 判定根拠: CONST_004 に従う。本タスクは `apps/web/src/lib/server-fetch/safe-fetch.ts`（編集）とテスト 1 ファイル（新規）を変更し、`/me` 取得失敗時に `status` / `code` / `path` を server-side で構造化ログ出力することで、UI 観測（T01）と相補的に root cause（H3/H4/H5）を判別可能にする観測性向上のコード変更を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ワークフロー | `profile-session-fetch-failure-investigation` |
| 親 Phase | Phase 5（実装） |
| タスク ID | T02 |
| ブランチ | `feat/profile-session-fetch-failure-investigation` |
| 起点 | `origin/dev` (b59a9b450) |
| visualEvidence | NON_VISUAL（server log の構造化出力で判定） |
| 想定 PR base | `dev` |
| 並列性 | T01 / T03 と相互非依存（並列実装可） |
| 紐づく AC | AC-4（`status`/`code`/`path` 構造化ログ・memberId 非露出）/ AC-7（spec で固定）/ D2 |

## 背景

`safeServerFetch`（`apps/web/src/lib/server-fetch/safe-fetch.ts`）は `thunk()` の失敗を `normalizeError` で `{ code, message }` に正規化し、ユーザー画面へは `SectionError` の安全文言だけが表示される（T01）。しかし **server-side では失敗の `status` / `code` / `path` がどこにも記録されない**ため、staging で 410/5xx/transport のどれが起きたかをログから確認できない。Cloudflare Workers の `console.error` は wrangler tail / dashboard ログに残るため、構造化ログを挿入すれば DevTools が使えない server runtime でも切り分け可能になる（H6 是正の server 側半分・SSOT §3 D2）。

不変条件 #11 により `/me/*` は memberId を response / ログに露出してはならない。`normalizeError` の `message`（例 `fetchAuthed failed: 503`）には memberId は含まれないが、将来 message に PII が混入しても漏れないよう、**ログには `status` / `code` / `path` の分類値のみを出し、生 `message` 全文や member 識別子は出さない**設計とする。

## 目的

`safeServerFetch` に `onError` フックを追加し、`/me` 取得失敗時に `status`（HTTP status または `null`）/ `code`（`MEMBER_SESSION_<status>` 等）/ `path`（呼び出し元が指定する論理パス。例 `"/me"`）を **構造化 JSON で `console.error` 出力**する。memberId・生 message 全文・cookie・token は出力しない。既存の `safeServerFetch` 呼び出しは `onError` / `path` を渡さなければ従来どおり（後方互換）。

## 1. 変更対象ファイル一覧（CONST_005 必須）

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/lib/server-fetch/safe-fetch.ts` | 編集 | `SafeServerFetchOptions` に optional `path?: string` を追加。`normalizeError` で得た `code` と `statusFromError` の `status` を構造化ログ出力する内部関数 `logServerFetchFailure` を追加し、失敗時（rethrow しないパス）に呼ぶ |
| `apps/web/app/(member)/profile/page.tsx` | 編集 | `/me` 取得の `safeServerFetch` 呼び出しに `path: "/me"` を渡す（ログに path 文脈を与えるため。1 引数追加のみ・分岐ロジックは T01 で扱う） |
| `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | 新規（テスト） | 構造化ログの `status`/`code`/`path` 出力・memberId 非露出・rethrow 時非出力・成功時非出力を検証 |

それ以外のファイルは無編集。`apps/api`・D1 schema・`/me` shape は不変。

> `page.tsx` への `path: "/me"` 追加は T01 の編集と同一ファイルだが行が別（T01 は分岐 66-74、T02 は fetch オプション 41-44）。実装サイクルでは両タスクの差分を 1 ファイルに統合適用する。

## 2. 主要な関数・型・モジュールのシグネチャまたは構造（CONST_005 必須）

```ts
// apps/web/src/lib/server-fetch/safe-fetch.ts（追加分のシグネチャ）

export interface SafeServerFetchOptions {
  readonly codePrefix?: string;
  readonly rethrowOn?: ReadonlyArray<RethrowableError>;
  readonly unknownMessage?: string;
  /** 追加: 構造化ログに出す論理パス（例 "/me"）。未指定なら "unknown" */
  readonly path?: string;
}

/** 構造化ログ payload（PII を含めない固定キーのみ） */
interface ServerFetchFailureLog {
  readonly event: "server_fetch_failure";
  readonly path: string; //  呼び出し元指定（"/me" 等）。member 識別子を含めない契約
  readonly code: string; //  MEMBER_SESSION_410 / _5xx / _FAILED 等
  readonly status: number | null; // HTTP status（transport 失敗時は null）
}

/**
 * 失敗時に status/code/path を構造化 JSON で console.error 出力する。
 * memberId / 生 message 全文 / cookie / token は出力しない（不変条件 #11）。
 */
function logServerFetchFailure(
  err: unknown,
  error: SafeResultError,
  opts: SafeServerFetchOptions,
): void {
  const status =
    err instanceof Error ? statusFromError(err) : null; // 既存 statusFromError を再利用
  const payload: ServerFetchFailureLog = {
    event: "server_fetch_failure",
    path: opts.path ?? "unknown",
    code: error.code,
    status,
  };
  console.error(JSON.stringify(payload));
}
```

`safeServerFetch` 本体（失敗パスにフック挿入）:

```ts
export async function safeServerFetch<T>(
  thunk: () => Promise<T>,
  opts: SafeServerFetchOptions = {},
): Promise<SafeResult<T>> {
  try {
    return { ok: true, data: await thunk() };
  } catch (err) {
    if (shouldRethrow(err, opts.rethrowOn ?? [])) throw err; // rethrow パスはログ出力しない
    const error = normalizeError(err, opts);
    logServerFetchFailure(err, error, opts); // 追加: 構造化ログ
    return { ok: false, error };
  }
}
```

> `statusFromError` は既存の private 関数を再利用（`err.status` 優先 → message の `/\bfailed:?\b.*\b(\d{3})\b/` 抽出）。`rethrowOn`（`AuthRequiredError` = 401）に該当する場合は throw されて redirect 経路に乗るため、**ログは出さない**（401 はエラーでなく認証フローのため、ノイズを避ける）。

## 3. 入力・出力・副作用の定義（CONST_005 必須）

| 区分 | 内容 |
| --- | --- |
| 入力 | 失敗した `err`（Error / 非 Error）、`normalizeError` 結果 `{ code, message }`、`opts.path` |
| 出力（ログ） | `console.error(JSON.stringify({ event, path, code, status }))`。固定キーのみ。Workers runtime では wrangler tail / dashboard に残る |
| 出力（戻り値） | 従来どおり `{ ok: false, error }`（shape 不変・後方互換） |
| 副作用 | `console.error` への 1 行出力のみ。D1・fetch・外部状態を触らない |
| 非出力（不変条件 #11 厳守） | memberId / responseId / email / cookie / token / 生 `message` 全文を出力しない。`message` の status 抽出値（数値）のみ `status` として出す |
| rethrow 時 | `shouldRethrow` が true（401 AuthRequiredError 等）の場合はログを出さず即 throw |
| 成功時 | ログを出さない（`ok: true`） |

## 4. 編集差分（unified diff・抜粋）

```diff
--- a/apps/web/src/lib/server-fetch/safe-fetch.ts
+++ b/apps/web/src/lib/server-fetch/safe-fetch.ts
@@
 export interface SafeServerFetchOptions {
   readonly codePrefix?: string;
   readonly rethrowOn?: ReadonlyArray<RethrowableError>;
   readonly unknownMessage?: string;
+  readonly path?: string;
 }
@@
+interface ServerFetchFailureLog {
+  readonly event: "server_fetch_failure";
+  readonly path: string;
+  readonly code: string;
+  readonly status: number | null;
+}
+
+function logServerFetchFailure(
+  err: unknown,
+  error: SafeResultError,
+  opts: SafeServerFetchOptions,
+): void {
+  const status = err instanceof Error ? statusFromError(err) : null;
+  const payload: ServerFetchFailureLog = {
+    event: "server_fetch_failure",
+    path: opts.path ?? "unknown",
+    code: error.code,
+    status,
+  };
+  console.error(JSON.stringify(payload));
+}
+
 export async function safeServerFetch<T>(
   thunk: () => Promise<T>,
   opts: SafeServerFetchOptions = {},
 ): Promise<SafeResult<T>> {
   try {
     return { ok: true, data: await thunk() };
   } catch (err) {
     if (shouldRethrow(err, opts.rethrowOn ?? [])) throw err;
-    return { ok: false, error: normalizeError(err, opts) };
+    const error = normalizeError(err, opts);
+    logServerFetchFailure(err, error, opts);
+    return { ok: false, error };
   }
 }
```

```diff
--- a/apps/web/app/(member)/profile/page.tsx
+++ b/apps/web/app/(member)/profile/page.tsx
@@
     meResult = await safeServerFetch(
       () => fetchAuthed<MeSessionResponse>("/me"),
-      { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] },
+      { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError], path: "/me" },
     );
```

> Sentry 経路について: 現状 `apps/web` の server-fetch 経路に Sentry 連携は無い（既存 `safe-fetch.ts` は `console.*` も呼んでいない）。将来 Sentry が導入された場合は `logServerFetchFailure` 内で `Sentry.captureMessage(JSON.stringify(payload), "error")` を併記する拡張点を 1 箇所に閉じておく（本タスクでは `console.error` のみ・Sentry 追加は範囲外）。

## 5. テスト方針（CONST_005 必須）

新規 test は `*.spec.ts`（不変条件 #8）。`vi.spyOn(console, "error")` で出力をキャプチャし、JSON を parse して固定キーを assert する。`fetchAuthed` 相当の失敗は `FetchAuthedError` 風スタブ（`status` プロパティ + `message: "fetchAuthed failed: 410"`）で再現する。

ファイル: `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`（新規）

| TC-ID | 入力（thunk reject） | opts | 期待 |
| --- | --- | --- | --- |
| TC-T02-L1 | `{ status: 410, message: "fetchAuthed failed: 410" }` | `codePrefix:"MEMBER_SESSION", path:"/me"` | `console.error` が 1 回。payload = `{event:"server_fetch_failure", path:"/me", code:"MEMBER_SESSION_410", status:410}` |
| TC-T02-L2 | `{ status: 503, message: "down" }` | 同上 | `code:"MEMBER_SESSION_503"`, `status:503` |
| TC-T02-L3 | `new Error("transport failed")`（status 無） | 同上 | `code:"MEMBER_SESSION_FAILED"`, `status:null` |
| TC-T02-L4 | 非 Error（`"boom"` を throw） | 同上 | `code:"MEMBER_SESSION_UNKNOWN"`, `status:null` |
| TC-T02-L5 | `AuthRequiredError`（rethrowOn 該当） | `rethrowOn:[AuthRequiredError]` | throw され、`console.error` が**呼ばれない**（401 はログ非出力） |
| TC-T02-L6 | 成功（thunk resolve） | 任意 | `console.error` が**呼ばれない** |
| TC-T02-L7 | `{ status: 410, message: "member m_secret leaked", memberId:"m_secret" }` | `path:"/me"` | payload を JSON 文字列化した全体に `"m_secret"` / `memberId` キーを**含まない**（不変条件 #11） |
| TC-T02-L8 | `{ message: "fetchAuthed failed: 500" }` | `path` **未指定** | `path:"unknown"`（呼び出し元が path を渡さない後方互換） |

> TC-T02-L7 は「生 message に PII が混ざっても固定キー（event/path/code/status）以外を出さない」契約の回帰 guard。`logServerFetchFailure` は `error.message` を payload に含めないため、message 全文・memberId は出力されない。

## 6. ローカル実行・検証コマンド（CONST_005 必須）

```bash
# 1. ブランチ確認
git branch --show-current

# 2. 依存
mise exec -- pnpm install

# 3. 型 / lint
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint

# 4. 本タスクのテスト
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  "src/lib/server-fetch/__tests__/safe-fetch.spec.ts"

# 5. 既存 safeServerFetch 利用箇所の非回帰（profile / admin 各 page の spec）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  "app/(member)/profile/page.spec.tsx"
```

## 7. 完了条件（DoD: Definition of Done, CONST_005 必須）

| ID | 条件 | 検証 |
| --- | --- | --- |
| DoD-T02-1 | `safe-fetch.ts` に `path?` option と `logServerFetchFailure` が追加され、失敗パスで `status`/`code`/`path` を構造化出力 | `git diff safe-fetch.ts` |
| DoD-T02-2 | TC-T02-L1〜L4（status/code/path 出力）が PASS | §6 手順 4 |
| DoD-T02-3 | TC-T02-L5（401 rethrow 非出力）/ L6（成功非出力）が PASS | §6 手順 4 |
| DoD-T02-4 | TC-T02-L7（memberId / 生 message 非露出）が PASS（不変条件 #11） | §6 手順 4 |
| DoD-T02-5 | TC-T02-L8（path 未指定 → `"unknown"`）が PASS（後方互換） | §6 手順 4 |
| DoD-T02-6 | `page.tsx` の `/me` 呼び出しに `path:"/me"` が渡る | `git diff page.tsx` |
| DoD-T02-7 | `safeServerFetch` の戻り値 shape を変更していない（既存呼び出し非回帰） | §6 手順 5 |
| DoD-T02-8 | `typecheck` / `lint` が exit 0、`apps/api`・D1 を変更していない | `git diff apps/api` が空 |

## 8. ロールバック手順

本タスクは既存 1 ファイルへの内部関数追加 + 1 行 option 追加のみで、戻り値 shape は不変。問題が出た場合:

```bash
git checkout -- apps/web/src/lib/server-fetch/safe-fetch.ts \
                "apps/web/app/(member)/profile/page.tsx"
git rm apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts
```

revert 後は失敗時の構造化ログが消えるのみで、`safeServerFetch` の戻り値・既存呼び出しは元から無変更。

## 9. 後続タスク・先送り項目

CONST_007 に違反する先送りは **無し**。本タスクのスコープ（構造化ログ出力）は本サイクルで完結する。Sentry 連携の追加・他 `safeServerFetch` 呼び出し（admin 各 page）への `path` 伝播の横展開は本症状の切り分けに不要なため範囲外とし、必要が確定すれば Phase 12 で別途検討する（投機実装しない・CONST_007 例外①）。

## 10. PR 作成方針（実行は別プロンプト）

CONST_002 により本仕様書作成プロンプトでは PR を作成しない。実装サイクル後、`.claude/commands/ai/diff-to-pr.md` のフローに従って user-gated で PR を作成する。base は `dev`。T01 / T03 と同一 PR に束ねるか分割するかは実装サイクルの判断とし、いずれも base=`dev`。
