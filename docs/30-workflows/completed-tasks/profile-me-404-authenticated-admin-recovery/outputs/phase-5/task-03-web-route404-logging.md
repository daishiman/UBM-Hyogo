# task-03: apps/web route-404 を `server_fetch_failed` に明示記録

`[実装区分: 実装仕様書]`

> 判定根拠（CONST_004）: 本タスクは `apps/web/src/lib/server-fetch/safe-fetch.ts` の `logServerFetchFailure` を編集する**コード変更**を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ワークフロー | `profile-me-404-authenticated-admin-recovery` |
| 親 Phase | Phase 5（実装） |
| タスク ID | T03 |
| ブランチ | `fix/profile-me-404-authenticated-admin-recovery`（起点 `origin/dev`） |
| visualEvidence | NON_VISUAL（focused vitest green + ログ payload 固定で判定） |
| 並列性 | **T01 後・T02 と並列**。対象ファイルが T01/T02/T04 と排他 |
| 紐づく AC / F / S | AC-4（web route-404 ログ）/ AC-6・AC-9（UI 不変・secret 非転記）/ F-9（404 は fallback せず即確定）/ S2（service-binding vs http 切り分け） |

## 概要 / 対象タスク（T03）

web→api の `GET /me` が 404 を返すと `safe-fetch` の `normalizeError` が `MEMBER_SESSION_404` を生成し（F-2）、`session-error-display.ts` が当該 404 専用文言を描画する。現状 `logServerFetchFailure` は `code`/`path`/`status`/`transportKind`/`baseHost` を出すが、**route-not-found（404）であることを明示するフラグ**が無く、S1（http transport が 404）/ S2（service-binding が 404）の切り分けに目視 status 照合が要る。本タスクは `code` が `*_404` のとき `routeNotFound: true` を payload へ追加し、T01（api notFound ログ）と 1:1 突合できるようにする。**UI 文言・分岐・path・shape・transport 挙動は一切変更しない（観測フィールドのみ追加）。**

## 1. 変更対象ファイル一覧（パス・変更種別）

| パス | 変更種別 | 要点 |
| --- | --- | --- |
| `apps/web/src/lib/server-fetch/safe-fetch.ts` | 編集 | `logServerFetchFailure` で `code` が `/_404$/` のとき `routeNotFound:true` を payload へ追加 |
| `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | 編集 | 404 で `routeNotFound:true`・非 404 で付かないこと・既存フィールド不変を assert |

> `authed.ts`・`transport.ts`・`session-error-display.ts`・`page.tsx`・`normalizeError` のロジックは非接触。

## 2. 主要な関数・構造（実コードに即した差分方針）

現状（`safe-fetch.ts:69-82`）:

```ts
function logServerFetchFailure(
  error: SafeResultError,
  opts: SafeServerFetchOptions,
): void {
  if (!opts.logPath) return;

  const statusMatch = error.code.match(/_(\d{3})$/);
  console.error("server_fetch_failed", {
    code: error.code,
    path: opts.logPath,
    status: statusMatch ? Number(statusMatch[1]) : null,
    ...((error as { readonly transport?: ApiTransportDescriptor }).transport ?? {}),
  });
}
```

改修方針（`routeNotFound` は 404 のときのみ付与。404 以外ではキー自体を出さず既存 payload 形状を保つ）:

```ts
function logServerFetchFailure(
  error: SafeResultError,
  opts: SafeServerFetchOptions,
): void {
  if (!opts.logPath) return;

  const statusMatch = error.code.match(/_(\d{3})$/);
  const status = statusMatch ? Number(statusMatch[1]) : null;
  console.error("server_fetch_failed", {
    code: error.code,
    path: opts.logPath,
    status,
    ...(status === 404 ? { routeNotFound: true } : {}),
    ...((error as { readonly transport?: ApiTransportDescriptor }).transport ?? {}),
  });
}
```

> 判定は `status === 404`（`error.code` 末尾 3 桁から抽出した値）で行い、`*_404`（`MEMBER_SESSION_404` / `SERVER_FETCH_404` 等 prefix 非依存）に一様適用する。`status` 抽出ロジック・`transport` spread・`error.code` 生成（`normalizeError`）は不変。

## 3. 入力・出力・副作用の定義

| 区分 | 内容 |
| --- | --- |
| 入力 | `SafeResultError`（`code`/`message`/optional `transport`）+ `SafeServerFetchOptions`（`logPath`） |
| 出力（ログ・追加） | `console.error("server_fetch_failed", { code, path, status, routeNotFound?, transportKind?, baseHost? })`。`routeNotFound` は status=404 のみ `true` |
| 副作用 | ログのみ（既存どおり `opts.logPath` 未指定時は no-op） |
| 不変 | `/me` の path/shape、`normalizeError` の code/transport 正規化、`AuthRequiredError` 経路、`session-error-display.ts` 文言・分岐、`page.tsx` の redirect/notFound（AC-6） |

## 4. テスト方針（既存 `safe-fetch.spec.ts` 編集・`*.spec.ts` のみ）

| TC-ID | ケース | 期待値 |
| --- | --- | --- |
| SF-1 | `code:"MEMBER_SESSION_404"` の error で `logServerFetchFailure`（`logPath` 指定）。`console.error` を spy | 第 2 引数に `routeNotFound: true`・`status: 404`・`code:"MEMBER_SESSION_404"` |
| SF-2（回帰 guard） | `code:"MEMBER_SESSION_410"` | payload に `routeNotFound` キーが**無い**・`status:410`・既存フィールド不変 |
| SF-3（回帰 guard） | `code:"MEMBER_SESSION_FAILED"`（status 抽出不可） | `status:null`・`routeNotFound` 無し |
| SF-4 | `transport:{transportKind:"service-binding",baseHost:"service-binding.local"}` 付き 404 error | `routeNotFound:true` と `transportKind`/`baseHost` が**両方**出る（S2 切り分け） |
| SF-5（回帰 guard） | `opts.logPath` 未指定 | `console.error` が呼ばれない（既存 no-op 維持） |

テスト実装の注意:
- `console.error` を `vi.spyOn(console, "error")` で捕捉し、第 2 引数オブジェクトの key 集合を assert（404 以外で `routeNotFound` キーが存在しないことを `expect(payload).not.toHaveProperty("routeNotFound")` で確認）。
- 既存 `safe-fetch.spec.ts` の transport descriptor 展開テストが回帰しないこと。
- 新規 test は `*.spec.ts` のみ（不変条件 #8）。

## 5. ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint

cd apps/web
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts' \
  'apps/web/app/(member)/profile/page.spec.tsx'   # 404 CTA 回帰 guard
cd ../..

# UI 不変の grep gate
git diff origin/dev...HEAD -- 'apps/web/app/(member)/profile'   # 空であること
```

## 6. 完了条件（DoD）

| ID | 条件 | 検証 |
| --- | --- | --- |
| DoD-T03-1 | `code` が `*_404` のとき `server_fetch_failed` payload に `routeNotFound:true` が載る | SF-1 |
| DoD-T03-2 | 404 以外（410/5xx/FAILED）では `routeNotFound` キーが付かない | SF-2 / SF-3 |
| DoD-T03-3 | `transportKind`/`baseHost`/`status` の既存フィールドが不変 | SF-4 |
| DoD-T03-4 | `safe-fetch.spec.ts`（SF-1〜SF-5）+ `page.spec.tsx` 404 分岐が全 PASS | §5 vitest |
| DoD-T03-5 | `pnpm typecheck` / `pnpm lint` exit 0 | §5 |
| DoD-T03-6 | `git diff origin/dev...HEAD -- apps/web/app/(member)/profile` が空（UI 不変・AC-6） | §5 grep |

## 7. 不変条件

- `/me` の path・shape、`session-error-display.ts` の文言・分岐、`page.tsx` の redirect/notFound 挙動を変更しない（AC-6）。
- `normalizeError` の code/transport 正規化・`AuthRequiredError` 経路を変更しない（観測フィールドのみ追加）。
- env 参照はアクセサ経由のみ・`process.env` 直接参照禁止（AC-7）。
- D1 直接アクセス禁止（`apps/web` は fetchAuthed 経由のみ・不変条件 #5）。
- secret/cookie/JWT/memberId をログ・コードに転記しない（AC-9）。
- 新規 test は `*.spec.ts` のみ（不変条件 #8）。
- commit/PR/push/deploy は user-gated（CONST_002）。

## 8. ロールバック手順

```bash
git checkout origin/dev -- apps/web/src/lib/server-fetch/safe-fetch.ts apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts
```
`logServerFetchFailure` を元の payload（`routeNotFound` 無し）へ戻す。T01/T02/T04 とはコード非依存のため単独 revert 可能（web ログでの route-404 明示は失われるが status での目視照合は可能）。
