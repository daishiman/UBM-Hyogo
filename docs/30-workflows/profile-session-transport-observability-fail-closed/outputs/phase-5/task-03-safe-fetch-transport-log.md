# T03: safe-fetch.ts のログに transportKind/baseHost を追加（公開シグネチャ不変）

> レーン B。`FetchAuthedError`/`ApiTransportError` の診断メタ shape（Phase 4 §5・T01 が定義）に依存するが、shape は契約として固定済のため T01 と並列で実装してよい。最終結合確認は Phase 9 で締める。

正本参照: `../../_shared-context.md`（§4 F5・§5 入出力）/ `../phase-4/phase-4.md`（§4 ログ出力キー契約・§6 T4）/ `../phase-2/phase-2.md`（§5 ログ拡張設計）

## 変更対象ファイル

| # | ファイル | 種別 | 変更概要 |
|---|---------|------|---------|
| 1 | `apps/web/src/lib/server-fetch/safe-fetch.ts` | 編集 | (a) `transportFromError(err)` ヘルパ追加。(b) catch した元 error から `SafeResultError.transport` へ内部転記。(c) ログ出力に `transportKind`/`baseHost` を flat spread（あるときのみ）追加 |
| 2 | `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | 編集 | T4-1〜T4-4 追加 |

新規ファイルは作らない。**公開関数 `safeServerFetch<T>(thunk, opts?)` のシグネチャは不変**。

## シグネチャ

```ts
// safe-fetch.ts に追加（module-internal）
function transportFromError(err: Error): ApiTransportDescriptor | undefined;

function logServerFetchFailure(error: SafeResultError, opts: SafeServerFetchOptions): void;
```

`safeServerFetch` の公開シグネチャは変更しない。元 error の診断メタは `normalizeError` 内で `SafeResultError.transport` へ移し、ログ関数へは正規化後 error だけを渡す。

## 実装方針（Phase 4 §4・phase-2 §5）

```ts
function transportFromError(err: Error): ApiTransportDescriptor | undefined {
  const transport = (err as { readonly transport?: unknown }).transport;
  if (transport && typeof transport === "object") {
    const t = transport as { transportKind?: unknown; baseHost?: unknown };
    if ((t.transportKind === "service-binding" || t.transportKind === "http") && typeof t.baseHost === "string") {
      return { transportKind: t.transportKind, baseHost: t.baseHost };
    }
  }
  return undefined;
}

function logServerFetchFailure(error, opts): void {
  if (!opts.logPath) return;
  const statusMatch = error.code.match(/_(\d{3})$/);
  console.error("server_fetch_failed", {
    code: error.code,
    path: opts.logPath,
    status: statusMatch ? Number(statusMatch[1]) : null,
    ...(error.transport ?? {}),
  });
}
```

`safeServerFetch` の `catch (err)` ブロックでは `const error = normalizeError(err, opts)` を作り、`logServerFetchFailure(error, opts)` を呼ぶ。

## 入出力・副作用

- `transportFromError`: 純関数。診断メタを持たない error には `undefined` を返す（→ ログにキーが現れない＝従来形維持）。
- `logServerFetchFailure`: 副作用 = `console.error("server_fetch_failed", {...})`。`logPath` 未指定時は何も出力しない（既存挙動）。
- **出力キーは `code`/`path`/`status`/`transportKind?`/`baseHost?` のみ**（Phase 4 §4）。`memberId`/`cookie`/`secret`/`token` を出力しない（不変条件 #11）。`bodyText` や error.message のような自由文は新規にログへ足さない。
- イベント名 `server_fetch_failed` は据え置き（既存解析を壊さない）。

## テスト方針（Phase 4 §6 T4 に厳密一致）

| ケースID | throw する error / opts | 期待ログ |
|----------|--------------------------|----------|
| T4-1 | `Object.assign(new Error("fetchAuthed failed: 410"), { status:410, transport: { transportKind:"service-binding", baseHost:"service-binding.local" } })` / `{ codePrefix:"MEMBER_SESSION", logPath:"/me" }` | `{ code:"MEMBER_SESSION_410", path:"/me", status:410, transportKind:"service-binding", baseHost:"service-binding.local" }` |
| T4-2 | `Object.assign(new Error("transport failed"), { transport: { transportKind:"http", baseHost:"ubm-hyogo-api-staging.daishimanju.workers.dev" } })` / 同 opts | `{ code:"MEMBER_SESSION_FAILED", path:"/me", status:null, transportKind:"http", baseHost:"ubm-hyogo-api-staging.daishimanju.workers.dev" }` |
| T4-3（回帰） | 診断メタ無し error（status=410 のみ・既存「logs structured diagnostics」相当） | `{ code:"MEMBER_SESSION_410", path:"/me", status:410 }`（`transportKind`/`baseHost` キーが現れない） |
| T4-4（漏洩検査） | T4-1 error に `memberId`/`cookie` を付与しても | `JSON.stringify(errorSpy.mock.calls)` に `memberId`/`cookie`/`secret`/`token` を含まない |

- 既存ケース（"returns ok=true on success" / "extracts a status code ..." / "rethrows allowlisted errors" / "does not log diagnostics unless logPath is provided" 等）は**回帰ゼロ**。特に既存「logs structured diagnostics」は診断メタ無し error を投げているため、`transportKind`/`baseHost` キーが出ない＝従来形維持で green（T4-3 と整合）。
- `console.error` は `vi.spyOn(console, "error")` でモック（既存パターン踏襲）。
- T4-1/T4-2 の `baseHost` 文字列は spec 内のテスト値であり src 本体への焼き込みではない（`verify-no-localhost-bake --src-only` 非該当・`service-binding.local` は localhost リテラルでもない）。

TDD: RED → 実装 → GREEN。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm exec vitest run apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-no-localhost-bake.sh --src-only
```

## 完了条件(DoD)

- [ ] `safeServerFetch` 公開シグネチャ不変。
- [ ] `server_fetch_failed` ログに `transportKind`/`baseHost`（error が持つときのみ）と `status` が出力される（T4-1/T4-2）。
- [ ] 診断メタ無し error では従来形 `{code,path,status}` を維持（T4-3 回帰ゼロ）。
- [ ] ログに `memberId`/`cookie`/`secret`/`token` を出力しない（T4-4）。
- [ ] 既存 safe-fetch.spec ケース回帰ゼロ。
- [ ] typecheck / lint green。`verify-no-localhost-bake --src-only` green。
