# Phase 5: 環境準備 / 前提セットアップ

> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-04-w3-window-guard-and-logger |
| Phase 番号 | 5 / 13 |
| 作成日 | 2026-05-08 |
| 上流 Phase | Phase 4（タスク分解 / 実装ステップ計画）|
| 下流 Phase | Phase 6（実装手順詳細）|
| 状態 | completed |

---

## 0. 目的

Phase 6（実装）に着手する前に、ローカル環境・依存関係・上流 task 成果物・lint / test 設定が揃っていることを **コマンドで自動検証可能** な形で確定する。本 Phase は read-only 検証のみで、実装ファイルは作成しない。

---

## 1. 必要な依存（既存）

| 依存 | バージョン / 範囲 | 入手元 | 備考 |
| --- | --- | --- | --- |
| Node.js | 24.15.0 | `mise install`（`.mise.toml`）| CLAUDE.md 既定 |
| pnpm | 10.33.2 | mise 経由 | CLAUDE.md 既定 |
| `next` | 既存 `apps/web/package.json` で固定 | pnpm install | 新規追加なし |
| `react` | 既存 | pnpm install | 新規追加なし |
| `vitest` | 既存（@ubm-hyogo/web の devDep）| pnpm install | jsdom env を使う |
| `@vitest/coverage-v8` | 既存 | pnpm install | カバレッジ計測 |
| `jsdom` | 既存 devDep | pnpm install | `// @vitest-environment jsdom` 用 |
| Sentry SDK（`@sentry/nextjs` 等）| task-03 が導入済 | task-03 完了で確認 | 本 task では新規追加しない |

> **新規依存追加禁止**: 本 task では `package.json` への dep 追加は行わない。logger / is-browser は標準 API（`console`, `JSON.stringify`, `typeof`）と task-03 が用意した `lib/sentry/capture.ts` のみで完結する。

---

## 2. ローカル実行コマンド（CLAUDE.md 既定）

```bash
# 依存解決（必ず mise exec 経由で Node 24 を保証）
mise exec -- pnpm install

# 型チェック（環境健全性確認）
mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit

# lint 現状確認（Phase 6 着手前のベースライン）
mise exec -- pnpm --filter @ubm-hyogo/web lint

# 既存テスト pass 確認
mise exec -- pnpm --filter @ubm-hyogo/web test
```

すべて exit 0 で抜けることが Phase 6 着手の前提。

---

## 3. 上流 task（task-03）成果物の存在チェック

logger は task-03 の `apps/web/src/lib/sentry/capture.ts` に依存する。本 Phase で **存在 + 公開 API シグネチャ** を確認する。

### 3.1 ファイル存在チェック

```bash
test -f apps/web/src/lib/sentry/capture.ts && echo "OK" || echo "BLOCKED: task-03 incomplete"
```

期待: `OK` が出力されること。`BLOCKED` の場合は本 task を pending に戻し、task-03 の完了を待つ。

### 3.2 公開 API シグネチャチェック

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n \
  'export (async )?function (captureException|captureMessage)' \
  src/lib/sentry/capture.ts
```

期待出力（行番号は実装次第）:

```
src/lib/sentry/capture.ts:NN:export function captureException(error: unknown, ctx?: ...): string | undefined
src/lib/sentry/capture.ts:NN:export function captureMessage(message: string, ctx?: ...): string | undefined
```

両 export が解決すれば logger 実装に進める。

### 3.3 二重 init ガード変数の確認（参照のみ）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '__ubmSentryInitialized__' src/
```

期待: `apps/web/src/instrumentation.ts` で 1 件以上ヒット。logger からは触らない（参照すらしない）が、task-03 が確定した命名であることを確認する。

---

## 4. Vitest（jsdom env）動作確認

logger / is-browser のテストは jsdom env で `window` が定義されていることを前提とする。Phase 6 / 7 で書くテストが正しく env 切替できるかを **空テストで先に確認** する。

### 4.1 既存 vitest config の確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n 'environment|jsdom' vitest.config.ts vitest.config.mts 2>/dev/null
```

期待: `apps/web/vitest.config.{ts,mts}` のいずれかに `environment: 'node'`（既定）または環境別設定があること。本 task では **テストファイル冒頭の pragma** で env を切替えるため、global 設定が `node` であっても問題ない。

### 4.2 pragma 切替の動作確認手順

Phase 7 で実装するテストは、ファイル冒頭に以下のいずれかを置く:

```ts
// @vitest-environment jsdom   // is-browser test の jsdom ケース、logger test
```

```ts
// @vitest-environment node    // is-browser test の node ケース
```

`is-browser.test.ts` は jsdom と node の両方を検証するため、**ファイルを 2 つに分ける**か、**1 ファイル内で `vi.stubGlobal('window', undefined)` 等で擬似 SSR 化** する戦略を取る。本 task では Phase 7 で前者（2 ファイル）を採用する。

---

## 5. ESLint 9 flat config（`eslint.config.mjs`）の前提確認

Phase 6 の Step 4 で `no-restricted-globals` を追加するため、現状の flat config 構造を確認する。

```bash
test -f apps/web/eslint.config.mjs && echo "flat config OK" || echo "flat config NOT FOUND"
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n 'no-restricted-globals|files:|ignores:|overrides' apps/web/eslint.config.mjs
```

期待:
- `apps/web/eslint.config.mjs` が存在すること（ESLint 9 flat config）
- `no-restricted-globals` が **未設定** であること（本 task で初導入）
- `files:` / `ignores:` を持つブロックが存在し、追加 override の挿入位置が確定できること

> ESLint 9 flat config では `overrides` キーは廃止され、配列要素として個別の設定オブジェクト（`{ files, ignores, rules }`）を追加する形になる。Phase 6 §4.3 の差分例はこの flat 形式に従う。

---

## 6. window 参照箇所のベースライン取得

Phase 4 Step 5 で書換える対象を、Phase 5 終了時点で **件数と一覧** をスナップショットしておく。Phase 6 完了時の差分検証に使う。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '\bwindow\.' src/ \
  | grep -v 'is-browser.ts' \
  | grep -v 'instrumentation-client.ts' \
  | grep -v 'src/lib/sentry/' \
  > /tmp/window-refs-baseline.txt

wc -l /tmp/window-refs-baseline.txt
```

期待: 件数 N が記録される。Phase 6 Step 5 完了後に再実行し **0 件** に減っていることを確認する。

---

## 7. apps/web 側 `process.env` 直接参照の確認（不変条件）

CLAUDE.md `apps/web env アクセス不変条件` に従い、logger 内で `process.env.*` を直接参照しないよう、`getEnv()` / `getPublicEnv()` 経由のみ使うことを再確認する。本 task の logger は **環境変数を一切読まない**設計（runtime tag は `process.env.NEXT_RUNTIME` を読むが、これは `getEnv()` 管理外の Next.js 内部 hint なので例外）。

```bash
# logger 実装後（Phase 6 完了後）に行う grep（ベースラインとして方針確認のみ）
# mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n 'process\.env\.' src/lib/logger.ts
# → NEXT_RUNTIME 以外がヒットしてはならない
```

---

## 8. ローカル smoke のセットアップ

logger の `error` 呼び出しで Sentry に event が記録されることを **手動 smoke** で確認するため、staging Sentry DSN がローカル `.dev.vars` の op 参照で揃っていることを確認する（実値は読まない / op:// 参照の存在のみ確認）。

```bash
test -f apps/web/.dev.vars.example && \
  mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n 'NEXT_PUBLIC_SENTRY_DSN' apps/web/.dev.vars.example
```

期待: `op://Vault/Item/Field` 形式の参照が 1 件以上ヒット。実値は `bash scripts/cf.sh` 経由のみで注入されるため、本 Phase で読み出す必要はない。

---

## 9. 環境準備チェックリスト（Phase 6 着手ゲート）

| # | チェック項目 | 検証コマンド | 期待 |
| --- | --- | --- | --- |
| 1 | Node 24 + pnpm 10 が解決できる | `mise exec -- node -v` / `mise exec -- pnpm -v` | `v24.15.0` / `10.33.2` |
| 2 | 依存インストール成功 | `mise exec -- pnpm install` | exit 0 |
| 3 | tsc 既存 pass | `mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit` | exit 0 |
| 4 | 既存 lint pass | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 |
| 5 | task-03 capture.ts 存在 | §3.1 のテスト | OK |
| 6 | task-03 capture API export 解決 | §3.2 の rg | 2 export 検出 |
| 7 | flat config 存在 + `no-restricted-globals` 未設定 | §5 の rg | 上記条件一致 |
| 8 | window ベースライン取得 | §6 のコマンド | `/tmp/window-refs-baseline.txt` 生成 |
| 9 | jsdom env が解決可能 | `mise exec -- pnpm --filter @ubm-hyogo/web exec node -e "require('jsdom')"` | exit 0 |

すべて green になった時点で Phase 6 へ進む。1 件でも red の場合は本 Phase に戻る。

---

## 10. 成果物（本 phase）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-05/phase-05.md` | 環境準備手順（本ファイルと同内容）|
| 一時ファイル | `/tmp/window-refs-baseline.txt` | window ベースライン件数 |

---

## 11. 完了条件

- [ ] §9 のチェックリスト 9 項目すべて green
- [ ] task-03 完了が確認できている
- [ ] window 参照ベースラインが取得済み

---

## 12. 次 Phase

- 次: Phase 6（実装手順詳細）
- 引き継ぎ事項: capture API シグネチャ確認結果 / window ベースライン件数
- ブロック条件: §9 で 1 つでも red

## 実行タスク

1. Node / pnpm / Vitest / Sentry capture API の前提を確認する。
2. `window` 参照の baseline grep を採取する。
3. Phase 6 着手可否を判定する。

## 参照資料

| 種別 | パス |
| --- | --- |
| CLAUDE | `CLAUDE.md` |
| upstream | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md` |
