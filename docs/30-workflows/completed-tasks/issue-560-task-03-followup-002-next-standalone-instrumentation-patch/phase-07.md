# Phase 7: RUN BOOK 執筆 + CI workflow 編集

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| Source | `outputs/phase-7/phase-7.md` |
| 状態 | completed |

## 目的

`docs/runbooks/next-standalone-instrumentation-patch.md` を新規執筆し、`.github/workflows/pr-build-test.yml` に `build:cloudflare` と `verify-web-instrumentation-patch` step を追加する。

## 実行タスク

### 7.1 RUN BOOK

Phase 3 の 6 章構成で執筆:

1. 背景: Next.js standalone build は `instrumentation.ts` を出力に自動 copy しないため、Sentry の server-side init が標準では届かない（公式 docs 未掲載の制約）
2. patch script 責務 / 入出力境界（Phase 3.1 参照）
3. 起動経路: 正規は `apps/web/open-next.config.ts` `buildCommand` 経由。検証目的の `cd apps/web && node ../../scripts/...` は許可し、root 直叩きは cwd guard で拒否する
4. CI gate fail 条件 5 種（Phase 1 の SSOT を再掲）
5. Next.js / OpenNext upgrade 追従:
   - upgrade PR を切る前に `apps/web/.open-next/` の trace 構造（`.nft.json`）を再確認
   - patch 対象 target path に変更がないか grep
   - upstream で本問題が解決した release が出た場合は本 workaround 撤去判定（撤去 PR は別タスクで起票）
6. トラブルシュート FAQ（`cwd guard failed` / `instrumentation source missing` / `verify failed` 各エラーへの対処）

### 7.2 CI workflow 編集

- 対象: `.github/workflows/pr-build-test.yml`
- step 追加位置: web build step の直後
- step 例:
  ```yaml
  - name: verify-web-instrumentation-patch
    working-directory: apps/web
    run: node ../../scripts/patch-next-standalone-instrumentation.mjs --verify-only
  ```
- failure 時の log 行に `Sentry server instrumentation missing in standalone build artifact` を含める

## 参照資料

- `outputs/phase-3/phase-3.md`
- `outputs/phase-6/phase-6.md`

## 成果物

- `docs/runbooks/next-standalone-instrumentation-patch.md`
- `.github/workflows/pr-build-test.yml`（`build:cloudflare` + step 追加）
- `outputs/phase-7/phase-7.md`

## 完了条件

- RUN BOOK が 6 章揃って配置済
- CI workflow YAML が schema 上 valid（`gh workflow view` または `actionlint` で確認）
- step 名 `verify-web-instrumentation-patch` が job log に出現することを Phase 11 で確認できる
