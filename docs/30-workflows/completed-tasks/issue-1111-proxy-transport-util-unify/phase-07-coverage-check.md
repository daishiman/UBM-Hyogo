# Phase 07 — カバレッジ確認

## 1. カバレッジ対象の限定（FB-BEFORE-QUIT-002）

本タスクは pure refactor であり、カバレッジ判定は**変更したファイル / ブロックのみ**を対象とする。リポジトリ全体・既存無関係コードのカバレッジは判定対象外（変更していないため数値変動の責任を負わない）。

| 区分 | 対象 | カバレッジ目標 |
| --- | --- | --- |
| **対象（新規）** | `apps/web/src/lib/fetch/transport-select.ts`（`stripTrailingSlash` / `resolveServiceBinding` / `selectAndFetch`） | line / branch **100%** |
| **対象（変更ブロック）** | `route.ts` の transport 分岐部（`resolveServiceBinding` 呼び出し + `selectAndFetch` + base-unavailable→500） | 変更行が回帰 spec で実行される |
| **対象（変更ブロック）** | `server-fetch.ts` の transport 分岐部（binding 解決 + `selectAndFetch` + log 注入） | 変更行が回帰 spec で実行される |
| **対象（変更ブロック）** | `public.ts` の transport 分岐部（binding 解決 + `selectAndFetch` + log 注入） | 変更行が回帰 spec で実行される |
| **対象外** | 上記以外の既存コード（secret/header 構築・404 warn・cache bypass 実装・env アクセサ本体・その他 web 層） | 本タスクで触れないため数値変動を判定しない |

## 2. `transport-select.ts` の branch 網羅マッピング

util の全 branch を Phase 04/06 のどのケースが踏むかを明示し、100% を機械的に裏づける。

| util の branch | 踏むケース |
| --- | --- |
| `stripTrailingSlash`: 末尾 `/` あり | T-1 / T-3 |
| `stripTrailingSlash`: 末尾 `/` なし | T-2 |
| `resolveServiceBinding`: `disableBinding === true`（→ undefined） | T-4 / T-7 |
| `resolveServiceBinding`: `disableBinding === false`（→ binding） | T-5 / T-6 |
| `selectAndFetch`: `binding` truthy（service-binding 経路） | T-8 / T-11 / T-13 / T-14 / T-15 |
| `selectAndFetch`: `binding` falsy → `base !== null`（http-fallback 経路） | T-9 / T-12 / T-16 |
| `selectAndFetch`: `binding` falsy → `base === null`（base-unavailable 経路） | T-10 |
| `selectAndFetch`: `bindingUrlPrefix ?? DEFAULT` の default 側 | T-8〜T-13（prefix 未指定） |
| `selectAndFetch`: `bindingUrlPrefix` 明示側 | T-14 |
| `selectAndFetch`: `log?.(...)` opt-in 呼ぶ側 | T-8 / T-9 |
| `selectAndFetch`: `log?.(...)` opt-in 渡さない側（optional chaining 短絡） | T-11 / T-12 |

→ 3 関数の全分岐・default 引数・optional chaining の両側を T-1〜T-16 が網羅。未踏 branch ゼロ。

## 3. 実測の取り方

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts --coverage \
  apps/web/src/lib/fetch/__tests__/transport-select.spec.ts \
  apps/web/app/api/admin/[...path]/route.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts \
  apps/web/src/lib/fetch/public.spec.ts
```

実測値は**該当行のみ**を抜粋して記録する（全体サマリではなく対象ファイル行）:

- `apps/web/src/lib/fetch/transport-select.ts` の `% Stmts` / `% Branch` / `% Funcs` / `% Lines` と `Uncovered Line #s`（空であること）。
- `route.ts` / `server-fetch.ts` / `public.ts` は、変更した transport 分岐行が `Uncovered Line #s` に含まれないことを確認（既存無関係行の数値は判定に用いない）。

## 4. Phase 07 完了条件

- [ ] `transport-select.ts` が line / branch **100%**（`Uncovered Line #s` 空）。§2 の branch マッピングが実測と整合。
- [ ] `route.ts` / `server-fetch.ts` / `public.ts` の**変更した transport 分岐行**が回帰 spec によって実行され、uncovered に含まれない。
- [ ] 対象外（既存無関係コード）の数値はカバレッジ判定に用いていない（FB-BEFORE-QUIT-002）。
- [ ] 実測値（対象ファイル該当行のカバレッジサマリと Uncovered Line #s）を Phase 07 出力に残している。
