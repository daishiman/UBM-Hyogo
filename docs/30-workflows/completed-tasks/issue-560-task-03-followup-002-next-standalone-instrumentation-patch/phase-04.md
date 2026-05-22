# Phase 4: テスト設計（unit + post-build assertion）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| Source | `outputs/phase-4/phase-4.md` |
| 状態 | completed |

## 目的

patch script の unit test と CI 上の post-build assertion を test-first で設計する。

## 実行タスク

詳細は `outputs/phase-4/phase-4.md` を正本とする。要点:

### 4.1 unit test（`scripts/__tests__/patch-next-standalone-instrumentation.test.mjs`）

実行: `node --test scripts/__tests__/patch-next-standalone-instrumentation.test.mjs`（または `pnpm vitest scripts`）

| ID | ケース | 期待 |
| --- | --- | --- |
| TC-01 | `cwd` が `apps/web` 以外で起動 | exit code 1 / stderr に `cwd guard failed` |
| TC-02 | 入力 `.next/server/instrumentation.js` / `.map` / `.nft.json` のいずれか不在 | exit code 1 / stderr に `missing` |
| TC-03 | 正常系（fixture `.next/server` 配置済み） | exit code 0 / `.next/standalone/apps/web/.next/server/instrumentation.js` が作成される |
| TC-04 | trace files copy | `.nft.json` の `files[]` に列挙された server 起点 file が standalone 側へ copy される |
| TC-05 | 出力先既存（overwrite） | 上書き成功 / stale content が残らない |
| TC-06 | `--verify-only` mode | 既存 file 不在で exit 1 / 含有なしで exit 1 / 両方 OK で exit 0 |
| TC-07 | malformed trace JSON | `.nft.json` が壊れている場合に exit 1 / stderr に `trace_failed` と `invalid_json` |

### 4.2 CI post-build assertion

- `.github/workflows/pr-build-test.yml` の `build-test` job で `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` 完了直後に `cd apps/web && node ../../scripts/patch-next-standalone-instrumentation.mjs --verify-only` を実行
- 失敗時は CI job 全体を fail させ、log に「Sentry server instrumentation missing in standalone build artifact」を出力

### 4.3 test fixture 配置

- `scripts/__tests__/fixtures/patch-next-standalone-instrumentation/`（必要に応じ）
- 一時ディレクトリで `apps/web` 構造を mock し `cwd` を switch する helper を test 内に同梱

## 参照資料

- `outputs/phase-3/phase-3.md`

## 成果物

- `outputs/phase-4/phase-4.md`（test ケース表 + fixture 設計）

## 完了条件

- TC-01〜TC-07 が ID 付きで確定
- post-build assertion の起動コマンドが workflow に書ける粒度
- fixture 配置 path が確定
