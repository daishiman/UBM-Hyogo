# Phase 9: 品質保証

| 項目 | 値 |
| --- | --- |
| 実装区分 | 実装仕様書（本サイクルで guard test 実装済み。下記コマンドは本サイクルで実行） |
| free-tier | 依存追加 0 / paid 機能なし / runtime deploy なし |

## 実行コマンド（本サイクルで実行する 3 点）

```bash
# 1. guard spec のみ実行（ファイル path 指定）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts

# 2. 型チェック（全 workspace）
mise exec -- pnpm typecheck

# 3. リント（全 workspace）
mise exec -- pnpm lint
```

> いずれも `mise exec --` 経由で Node 24 / pnpm 10 を保証する（CLAUDE.md セットアップ節）。

## DoD チェックリスト

| # | DoD 項目 | 検証手段 | 合格条件 |
| --- | --- | --- | --- |
| D-1 | 新規 spec `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` が存在 | `git status --short apps/api/src/sync/` | 当該ファイルが追跡対象に出る |
| D-2 | TC 全 pass | `pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` | TC-1..7（サブケース含む）すべて pass・fail 0 |
| D-3 | typecheck green | `pnpm typecheck` | エラー 0 で完了 |
| D-4 | lint green | `pnpm lint` | 違反 0 で完了 |
| D-5 | guard が 4 本目 cron 追加で fail | 一時的に `wrangler.toml` の任意セクション crons へ `"*/1 * * * *"` を 4 本目として足して test 実行 → TC-4（≤3）と TC-1..3（canonical 不一致）が fail することを確認 → **変更を revert** | 負シナリオで fail する／確認後 revert 済 |
| D-6 | guard が legacy `0 * * * *` 再混入で fail | 一時的に任意セクション crons へ `"0 * * * *"` を足して test 実行 → TC-5（not contain）が fail することを確認 → **変更を revert** | 負シナリオで fail する／確認後 revert 済 |
| D-7 | ADR / 無料枠予算表が implementation-guide に存在 | `outputs/phase-12/implementation-guide.md` を確認 | ADR（再スコープ判断）＋ 解析的予算表が記載されている |

> D-5 / D-6 の負シナリオ確認は、`wrangler.toml` を**一時的に汚して即 revert** する破壊的手順のため、実 cron 値は本サイクルで変更しない（既に canonical）。`git checkout -- apps/api/wrangler.toml` で必ず戻す。

## free-tier 自己監査

| 観点 | 検証手段 | 合格条件 |
| --- | --- | --- |
| 依存追加 0 | `git diff --stat -- pnpm-lock.yaml apps/api/package.json` | **差分 0**（lockfile / package.json 無変更）。spec は `node:fs` / `node:url` / `node:path` 標準 + 既存 `vitest` のみ使用 |
| paid 機能不使用 | spec / wrangler.toml に Durable Objects・Queues・有料 binding 追加が無いこと | 追加 0 |
| runtime deploy なし | 本サイクルで `scripts/cf.sh deploy` を実行しない | 実行 0（deploy は user-gated） |
| cron 本数 ≤ free 上限 | TC-4 が各 env で ≤3 を保証 | 3 本（上限ちょうど・余裕 0 本）を guard が固定 |

## 不変条件 #8（`*.spec.ts` のみ）準拠 grep 確認

```bash
# 新規テストが *.test.ts でないこと（禁止サフィックス検出）
git status --short apps/api/src/sync/ | grep -E '\.test\.(ts|tsx)$' && echo "NG: .test.* 検出" || echo "OK: .test.* なし"

# 追加ファイルが *.spec.ts サフィックスであること
ls apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts
```

| 観点 | 合格条件 |
| --- | --- |
| `*.test.{ts,tsx}` 不在 | grep ヒット 0（lefthook `block-test-suffix` / CI `verify-test-suffix` が reject しない） |
| `*.spec.ts` 命名 | `wrangler-cron-schedule.guard.spec.ts` が存在 |

## 合否基準（総合判定）

- **GO 条件**: D-1..D-7 すべて合格 ＋ free-tier 自己監査 4 項目すべて合格 ＋ 不変条件 #8 grep が OK。
- **NO-GO 条件**: TC fail / typecheck・lint 違反 / lockfile 差分発生 / `.test.*` 混入 のいずれか 1 つでも該当。
- 本サイクル（spec 作成）の合否は「上記チェックリストが本サイクルで再現可能な形で記述済み」であること。
  実コマンド実行と pass 判定は本サイクルで行う（user-gated commit/push の前段）。

## DoD（Phase 9）

- 実行コマンド 3 点（test / typecheck / lint）を提示。
- DoD を D-1..D-7 のチェックリスト化（負シナリオ D-5/D-6 の revert 手順含む）。
- free-tier 自己監査（依存追加 0 を lockfile 差分 0 で確認・paid 不使用・deploy なし）を明記。
- 不変条件 #8（`*.spec.ts`）の grep 確認手順と合否基準を明記。
