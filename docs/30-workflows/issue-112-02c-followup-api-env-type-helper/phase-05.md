# Phase 5: 実装計画 / runbook

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-112-02c-followup-api-env-type-helper |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画 / runbook |
| Wave | 2 (follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 4 で分解した T1〜T4 を再現可能な編集順序 / コマンド / 検証手順に展開し、`outputs/phase-05/runbook.md` に独立ファイルとして固定する。局所（ローカル）実行手順とリモート（CI）実行手順を分離し、ロールバック手順を明示する。

## 編集順序（決定版）

```
[T1] apps/api/src/env.ts 新規作成
   ↓
[gate-1] mise exec -- pnpm typecheck （Env 型単独で型エラーがないこと）
   ↓
[T2] apps/api/src/repository/_shared/db.ts の ctx() を Pick<Env, "DB"> に refactor
   ↓
[gate-2] mise exec -- pnpm typecheck （Env 依存追加で apps/api 全体が pass）
       mise exec -- pnpm test --filter @ubm/api （02c unit test 全 pass）
   ↓
[T3] 02c implementation-guide.md / outputs/phase-12/implementation-guide.md 追記
   ↓
[T4] scripts/lint-boundaries.mjs の禁止トークン棚卸し + negative test 手順整備
   ↓
[gate-final] mise exec -- pnpm typecheck && pnpm lint && pnpm test --filter @ubm/api
```

## 各サブタスクの実行コマンド

### T1: `apps/api/src/env.ts` 新規作成

```bash
# 1. 現行 wrangler.toml の binding 棚卸し（変更前 spot check）
grep -nE '^\\[\\[|^\\[|^[A-Z_]+ *=' apps/api/wrangler.toml

# 2. apps/api/src/env.ts を新規作成（Phase 2 設計に従う、9 field + 予約欄コメント）
#    実コード生成は実装フェーズで行う。ここではファイル作成のみ。

# 3. 型単独の typecheck（gate-1）
mise exec -- pnpm typecheck
```

### T2: `_shared/db.ts` の `ctx()` refactor

```bash
# 1. 現行 db.ts の ctx() 利用箇所を確認
grep -rn "ctx(" apps/api/src --include='*.ts'

# 2. db.ts に import type { Env } from "../../env" を追加し、
#    ctx シグネチャを (env: Pick<Env, "DB">) => DbCtx に変更
#    body は ({ db: env.DB as unknown as D1Db }) で D1Db alias bridge を維持

# 3. typecheck + 02c unit test（gate-2）
mise exec -- pnpm typecheck
mise exec -- pnpm test --filter @ubm/api
```

### T3: implementation-guide.md 追記

```bash
# 1. 02c 親仕様 implementation-guide.md の _shared/db.ts 節を特定
find docs/30-workflows -name 'implementation-guide.md' -path '*02c*'

# 2. Hono<{ Bindings: Env }> 使用例 / Cron handler 使用例を追記
#    （Phase 2 ctx-refactor-contract.md「後続タスクへの contract 出力」節を転記）

# 3. 本タスク outputs/phase-12/implementation-guide.md を新規作成
#    （Phase 12 配置だが、コード例は本 Phase で確定）
```

### T4: boundary lint 確認 / negative test

```bash
# 1. 禁止トークン現状棚卸し
grep -n "apps/api" scripts/lint-boundaries.mjs || echo 'NO MATCH'

# 2. 必要なら scripts/lint-boundaries.mjs に apps/api/src/env を明示追加

# 3. negative test 手順（Phase 9 で実行）
#    apps/web 内にダミーで `import type { Env } from "../../api/src/env"` を一時配置
#    → mise exec -- pnpm lint （exit non-zero を期待）
#    → ダミー import を削除
```

### gate-final: 全 gate 再実行

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test --filter @ubm/api
```

## 局所 (local) vs リモート (CI) 手順

| 観点 | local | リモート (CI) |
| --- | --- | --- |
| 実行者 | 開発者ローカル（mise + pnpm） | GitHub Actions（`.github/workflows/*`） |
| 起動コマンド | `mise exec -- pnpm <cmd>` | workflow yaml が `pnpm <cmd>` を直接実行 |
| 実行範囲 | T1 → T2 → T3 → T4 を順次 | gate-final 相当を全件実行 |
| 失敗時 | 当該 T の出力を local で修正 → 再 gate | PR 上で fail → push し直し |
| evidence 保管 | `outputs/phase-11/evidence/` に手動保存 | CI artifacts として workflow ログ参照 |

詳細手順は `outputs/phase-05/runbook.md` を参照。

## ロールバック手順

### case 1: T2 で 02c unit test が破壊された

| ステップ | 手順 |
| --- | --- |
| 検出 | `pnpm test --filter @ubm/api` が fail（ctx() 引数型不一致 / fixture 互換問題） |
| 局所修復 | (a) `D1Db` alias を継続 export していることを確認、(b) test fixture 側で `as Pick<Env, "DB">["DB"]` キャストを追加（ロジック変更なし）、(c) `D1Db` 型と `D1Database` の構造的部分型差分を確認し、`db.ts` の bridge cast を調整 |
| 全面 revert | 局所修復で 30 分以上未解決なら `git revert` で T2 のコミットのみ取消し、T1 / T3 / T4 を保持。02c の `ctx()` 旧シグネチャ（`{ DB: D1Db }`）に戻す |
| 再開 | Phase 6 テスト戦略を再評価 → fixture 互換条件を見直し → T2 再実装 |

### case 2: T1 の `Env` field が wrangler.toml と不一致

| ステップ | 手順 |
| --- | --- |
| 検出 | `pnpm typecheck` が `c.env.<KEY>` の `does not exist on type Env` で fail |
| 修復 | `outputs/phase-02/env-binding-table.md` と `wrangler.toml` を再 grep し、不足 field を追加 / 余剰 field を削除 |
| 再 gate | `pnpm typecheck` exit 0 確認 |

### case 3: T4 boundary lint が false positive

| ステップ | 手順 |
| --- | --- |
| 検出 | apps/api 内部の正常 import（例: `apps/api/src/repository/_shared/db.ts` → `../../env`）が lint error |
| 修復 | `scripts/lint-boundaries.mjs` の禁止条件を「source が `apps/web/**` のときのみ `apps/api/src/env` import を error」に絞り込む |
| 再 gate | `pnpm lint` exit 0（apps/api 内部）+ negative test で exit non-zero（apps/web 由来）の両方を観測 |

### case 4: T3 ガイド追記で secret 実値混入

| ステップ | 手順 |
| --- | --- |
| 検出 | Phase 9 secret hygiene check の grep で `(token|secret|hmac|client_secret|bearer)` の実値（プレースホルダではない）が hit |
| 修復 | 該当箇所をプレースホルダ（`<OAUTH_CLIENT_SECRET>` 等）に置換、git history 確認、必要なら force-push 不可のため新規 commit で打ち消し |
| 再 gate | grep で実値 hit ゼロを確認 |

## 多角的チェック観点

- **不変条件 #5**: gate-final の `pnpm lint` が boundary lint を実行する。T4 negative test は Phase 9 で gate 化。
- **不変条件 #1**: T1 で `Env` に Forms schema 構造を持ち込まないことを Phase 2 設計で確定済。runbook 上は wrangler.toml `[vars]` の key 名のみを反映する手順に限定。
- **後方互換**: T2 のロールバック手順を case 1 として明示。
- **secret hygiene**: T3 のロールバック手順を case 4 として明示。
- **再現性**: 全 gate コマンドを `mise exec --` 経由で固定し、Node 24 / pnpm 10 の環境差を排除。

## 統合テスト連携

| 連携先 Phase | 引き渡す観測 |
| --- | --- |
| Phase 6 | T2 後方互換契約 / 02c unit test fixture 互換条件 |
| Phase 8 | gate-final の 3 コマンドを CI workflow 通過 gate として固定 |
| Phase 9 | T4 boundary lint negative test の手順 |
| Phase 11 | 各 gate の log evidence（typecheck / lint / test / boundary lint）の取得点 |

## 完了条件

- [ ] 編集順序（T1 → gate-1 → T2 → gate-2 → T3 → T4 → gate-final）が明示
- [ ] 各 T の実行コマンドが `mise exec --` 経由で記述
- [ ] 局所 vs リモート手順の差分が表形式で記述
- [ ] ロールバック手順 4 case が記述
- [ ] `outputs/phase-05/main.md` および `outputs/phase-05/runbook.md` に転記

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 5 を completed

## 成果物

- `phase-05.md`（本ファイル）
- `outputs/phase-05/main.md`
- `outputs/phase-05/runbook.md`

## 次 Phase

- 次: Phase 6 (テスト戦略)
- 引き継ぎ: gate コマンド / T2 後方互換契約 / 02c unit test 維持条件
