# runbook: issue-112-02c-followup-api-env-type-helper

`apps/api/src/env.ts` 正本化と `_shared/db.ts` の `ctx()` refactor を再現可能に実行するための独立 runbook。Phase 5 から切り出して保管する。

## 前提

- Node 24.15.0 / pnpm 10.33.2（`.mise.toml` 固定）
- ワークツリー直下で実行
- `mise install` 済（初回のみ）
- `mise exec -- pnpm install` 済

## 環境セットアップ

```bash
mise install
mise exec -- pnpm install
```

## Part A: T1 — `apps/api/src/env.ts` 新規作成

```bash
# A-1. wrangler.toml の binding 棚卸し
grep -nE '^\\[\\[|^\\[|^[A-Z_]+ *=' apps/api/wrangler.toml

# A-2. Phase 2 binding 表との照合
cat docs/30-workflows/issue-112-02c-followup-api-env-type-helper/outputs/phase-02/env-binding-table.md

# A-3. apps/api/src/env.ts を作成（実装フェーズで作業）
#       Env interface に 9 field + 予約欄コメントを配置
#       各 field 直前に // wrangler.toml <section> <key> コメント

# A-4. gate-1: typecheck
mise exec -- pnpm typecheck
```

期待: gate-1 exit 0。

## Part B: T2 — `_shared/db.ts` の `ctx()` refactor

```bash
# B-1. 現行 ctx() 利用箇所の棚卸し
grep -rn "ctx(" apps/api/src --include='*.ts'

# B-2. apps/api/src/repository/_shared/db.ts を編集
#       (a) import type { Env } from "../../env" を追加
#       (b) ctx シグネチャを (env: Pick<Env, "DB">) => DbCtx に変更
#       (c) body を ({ db: env.DB as unknown as D1Db }) に変更
#       D1Db / D1Stmt / DbCtx / helper 群は無変更

# B-3. gate-2: typecheck + test
mise exec -- pnpm typecheck
mise exec -- pnpm test --filter @ubm/api
```

期待: gate-2 exit 0、02c 関連 unit test 全 pass。

## Part C: T3 — implementation-guide.md 追記

```bash
# C-1. 02c 親仕様 implementation-guide.md を特定
find docs/30-workflows -name 'implementation-guide.md' -path '*02c*'

# C-2. _shared/db.ts 節に Hono / Cron handler 使用例を追記
#       （Phase 2 ctx-refactor-contract.md の「後続タスクへの contract 出力」節を転記）

# C-3. 本タスク outputs/phase-12/implementation-guide.md を作成
#       wrangler.toml 変更時の運用手順（env.ts 同時更新ルール）も明記
```

期待: 2 箇所のガイドに使用例反映、secret 実値ゼロ。

## Part D: T4 — boundary lint 確認 / negative test

```bash
# D-1. 禁止トークン現状棚卸し
grep -n "apps/api" scripts/lint-boundaries.mjs || echo 'NO MATCH (要追加)'

# D-2. 必要なら scripts/lint-boundaries.mjs に apps/api/src/env を追加

# D-3. negative test（Phase 9 で実行）
#       apps/web 内にダミー import を一時追加
#       例: apps/web/src/__boundary_negative__.ts に
#           `import type { Env } from "../../api/src/env"`
#       → mise exec -- pnpm lint （exit non-zero 期待）
#       → ダミー削除
```

期待: ダミー import で `pnpm lint` exit non-zero。削除後 exit 0 復帰。

## Part E: gate-final（全 gate 再実行）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test --filter @ubm/api
```

期待: 3 コマンド全て exit 0。

## Part F: secret hygiene check

```bash
# F-1. env.ts コメントに secret 実値が含まれていないことを確認
grep -iE '(token|secret|hmac|bearer|client_secret)' apps/api/src/env.ts

# F-2. ガイド追記分にも実値が含まれていないことを確認
grep -iE '(token|secret|hmac|bearer|client_secret)' \\
  docs/30-workflows/issue-112-02c-followup-api-env-type-helper/outputs/phase-12/implementation-guide.md
```

期待: 実値 hit ゼロ（プレースホルダのみ許容）。

## ロールバック早見表

| case | 検出 | 一次対応 | 最終対応 |
| --- | --- | --- | --- |
| 1: 02c unit test 破壊 | gate-2 fail | fixture に `as Pick<Env, "DB">["DB"]` キャスト追加 | T2 のみ `git revert` |
| 2: Env field 不一致 | typecheck fail | binding 表 ↔ wrangler.toml 再 grep | env.ts に field 追加 / 削除 |
| 3: lint false positive | apps/api 内部 import が lint error | source 条件を `apps/web/**` に絞る | scripts/lint-boundaries.mjs 修正 |
| 4: secret 実値混入 | F-1 / F-2 grep hit | プレースホルダ置換 | 新規 commit で打消し |

## 局所 vs リモート

| 観点 | local | CI |
| --- | --- | --- |
| 起動 | `mise exec -- pnpm <cmd>` | workflow yaml が `pnpm <cmd>` 実行 |
| 範囲 | Part A → B → C → D → E → F を順次 | Part E 相当を全件 |
| 失敗時 | local で修正 → 再 gate | push し直し |
| evidence | `outputs/phase-11/evidence/` 手動保存 | workflow log 参照 |

## evidence 取得点（Phase 11 連携）

| evidence | 取得元 | 形式 |
| --- | --- | --- |
| typecheck.log | Part B-3 / Part E | text |
| test.log | Part B-3 / Part E | text |
| lint.log | Part E | text |
| boundary-lint-negative.log | Part D-3 | text（exit non-zero 観測） |
| secret-hygiene.log | Part F | text（grep 結果） |
