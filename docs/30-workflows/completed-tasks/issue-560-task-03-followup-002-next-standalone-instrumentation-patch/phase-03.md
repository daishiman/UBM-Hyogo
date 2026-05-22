# Phase 3: 設計（patch script API / CI gate 配線 / runbook 構成）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| Source | `outputs/phase-3/phase-3.md` |
| 状態 | completed |

## 目的

patch script の関数シグネチャ・CI gate 配線・RUN BOOK の章立てを設計し、Phase 4 以降が実装可能な粒度で凍結する。

## 実行タスク

詳細は `outputs/phase-3/phase-3.md` を正本とする。要点:

### 3.1 patch script API（`scripts/patch-next-standalone-instrumentation.mjs`）

```js
// 公開仕様（凍結対象）
//
// 1. 引数: `--verify-only`（copyせず standalone artifact の存在と token を検証）
// 2. cwd guard: process.cwd() の basename が "web" かつ親 dir が "apps" でなければ exit(1)
// 3. 入力: apps/web/.next/server/instrumentation.js / instrumentation.js.map /
//          server/instrumentation.js.nft.json（全て必須）
// 4. trace: `.nft.json` の `files[]` を `server/` 起点で追加 copy
// 5. 出力: apps/web/.next/standalone/apps/web/.next/server/instrumentation.js
//          および map / nft / trace files
// 6. 検証: 出力ファイルに "register" or "Sentry" のいずれかを含むこと（grep）
// 7. exit code: 成功 0 / 失敗 1
// 8. ログ: stdout/stderr は key=value 形式。secret は出力しない
```

### 3.2 `open-next.config.ts` 配線

- `buildCommand` 後段で `node ../../scripts/patch-next-standalone-instrumentation.mjs` を実行
- `cwd` は `apps/web` のまま（変更禁止）

### 3.3 CI gate 配線

- 対象 workflow: `.github/workflows/pr-build-test.yml`
- 追加 step: `verify-web-instrumentation-patch`
  - 直前 step: `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`
  - run: `cd apps/web && node ../../scripts/patch-next-standalone-instrumentation.mjs --verify-only`
  - fail-fast: 不在/未含有なら job fail

### 3.4 RUN BOOK 構成（`docs/runbooks/next-standalone-instrumentation-patch.md`）

1. 背景（Next.js standalone build の制約）
2. patch script 責務 / 入出力境界
3. 起動経路（正規は `open-next.config.ts` `buildCommand` 経由。検証目的の `cd apps/web && node ../../scripts/...` は許可）
4. CI gate の fail 条件 5 種
5. Next.js / OpenNext upgrade 時の追従手順（version bump → trace 構造再確認 → patch 妥当性 → upstream 解決時の本 workaround 撤去判定）
6. トラブルシュート FAQ

## 参照資料

- `outputs/phase-1/phase-1.md`
- `outputs/phase-2/phase-2.md`

## 成果物

- `outputs/phase-3/phase-3.md`

## 完了条件

- patch script の引数 / 入出力 path / trace copy / exit code が表で凍結
- CI gate step 名と実行コマンドが `.github/workflows/pr-build-test.yml` 単位で確定
- RUN BOOK 章立てが 6 章で確定
