# Phase 1: 要件定義

[実装区分: 実装仕様書 / 判定根拠: コード修正 (TypeScript ソース) を伴うため CONST_004 のデフォルトに従い実装仕様書とする]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| 機能名 | task-alert-relay-global-scope-fix-001 |
| 作成日 | 2026-05-21 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_evidence_captured |
| scope | `apps/api/src/routes/internal/alert-relay.ts` と focused regression test |

## 真の論点

Cloudflare Workers runtime は global scope で `crypto.randomUUID()` / `fetch()` / `setTimeout()` 等の async I/O・乱数生成・タイマー操作を禁止している (validation error 10021)。`apps/api/src/routes/internal/alert-relay.ts:17` で module top-level に `const isolateId = crypto.randomUUID();` が記述されており、`apps/api` の **deploy 全体** が反復的に reject される。

## スコープ (in)

- `apps/api/src/routes/internal/alert-relay.ts` の `isolateId` 初期化を lazy 化する
- 既存 vitest spec (`apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`) の `isolateId` 関連 assertion を維持しつつ、global scope での randomUUID 呼び出しが発生しないことを契約化する追加テストを書く
- staging deploy validation pass を `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` 相当で確認する

## スコープ (out)

- 他の `crypto.randomUUID()` 呼び出し箇所 (repository / use-cases / jobs 配下) — すべて関数内呼び出しのため影響なし (grep verify 済み: §既存実装調査)
- D1 schema / Hono route surface / KV namespace 構成
- `apps/web` 側の deploy 設定
- `apps/api` の他ファイルの module top-level 初期化 (今回の deploy fail に直接寄与する箇所のみ修正)

## 受入条件

| ID    | 条件                                                                                 |
| ----- | ------------------------------------------------------------------------------------ |
| AC-01 | `wrangler deploy --env staging` が validation error 10021 を出さずに完了する        |
| AC-02 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` の全既存ケースが pass  |
| AC-03 | 新規 regression test で module load 時に `crypto.randomUUID` が呼ばれないことを契約化 |
| AC-04 | `emitKvOperationError` の log payload `isolateId` が依然として UUID 形式の string |
| AC-05 | `pnpm typecheck` / `pnpm lint` がいずれも pass する                                  |

## 既存実装調査

```bash
$ grep -n "crypto.randomUUID\|^const " apps/api/src/routes/internal/alert-relay.ts
17:const isolateId = crypto.randomUUID();    # ← module top-level (NG)
18:const textEncoder = new TextEncoder();    # ← TextEncoder は global scope OK (CF docs)
19:const KV_OP_FAILED_EVENT = "alert_relay_kv_op_failed";
```

他ファイル (`rg -n "crypto.randomUUID" apps/api/src`) は全て関数内呼び出し。今回のエラーに寄与するのは line 17 のみ。

### Phase 1 baseline evidence

| コマンド | 結果 | 扱い |
| --- | --- | --- |
| `rg -n "crypto.randomUUID\\|^const " apps/api/src/routes/internal/alert-relay.ts` | line 17 の top-level `crypto.randomUUID()` を検出 | 修正対象 |
| `rg -n "crypto.randomUUID" apps/api/src` | `alert-relay.ts` line 17 以外は handler / service / test 内呼び出し | 今回 scope 外 |

## 関連ドキュメント

- Cloudflare Workers Handlers: https://developers.cloudflare.com/workers/runtime-apis/handlers/
- Validation Errors 10021: https://developers.cloudflare.com/workers/observability/errors/#validation-errors-10021
- 失敗 deploy ログ: PR #505 backend-ci deploy-staging job
