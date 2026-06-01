# Phase 9: 品質保証 — issue-230-lefthook-edit-guard

> 実装（Phase 5-8）が AC-1..AC-4 / R-1..R-4 を満たし、既存 quality gate を壊さないことを機械的に検証する。
> NON_VISUAL のため証跡は focused vitest + shell exit code + lint/typecheck の green。

## 9.1 検証コマンド一覧

すべて Node 24 を保証するため `mise exec --` 経由で実行する（CLAUDE.md）。

```bash
# 1. focused vitest（guard / integrity の fixture テスト）
mise exec -- pnpm vitest run \
  scripts/hooks/__tests__/lefthook-edit-guard.spec.ts \
  scripts/__tests__/verify-hook-integrity.spec.ts

# 2. 型チェック（monorepo 全 workspace）
mise exec -- pnpm typecheck

# 3. lint（boundaries / eslint）
mise exec -- pnpm lint

# 4. integrity script 単体実行（exit 0 を期待）
bash scripts/verify-hook-integrity.sh; echo "integrity exit=$?"

# 5. guard 単体実行（clean tree で exit 0 を期待）
bash scripts/hooks/lefthook-edit-guard.sh; echo "guard exit=$?"

# 6. shellcheck（インストール済みの場合のみ。CI/local どちらも任意）
command -v shellcheck >/dev/null 2>&1 \
  && shellcheck scripts/hooks/lefthook-edit-guard.sh scripts/verify-hook-integrity.sh \
  || echo "shellcheck 未インストール: skip（必須ではない）"
```

> shellcheck はインストールされていなければ skip してよい（必須ゲートではない）。インストール済みなら警告 0 を目標とする。

## 9.2 期待結果

| # | コマンド | 期待 |
|---|---------|------|
| 1 | focused vitest | 全 spec ケース green（guard / integrity 双方） |
| 2 | typecheck | エラー 0（spec の `child_process` 型含む） |
| 3 | lint | エラー 0（`pnpm lint --fix` 後の残違反 0） |
| 4 | integrity 単体 | `OK: lefthook.yml integrity verified` + `exit=0` |
| 5 | guard 単体（clean） | block 無し + `exit=0` |
| 6 | shellcheck | 警告 0（未インストール時は skip 可） |

## 9.3 AC / R 充足の検証観点（spec ケース対応）

| 要件 | 検証する spec ケース（Phase 4/6 で実装） | 期待 |
|------|------------------------------------------|------|
| R-1 / AC-1 (local) | fixture repo に lefthook 非管理の手書き `.git/hooks/pre-commit` を置く → guard exit 1 | fail |
| R-1 / AC-1 (CI 面) | integrity: `lefthook.yml` の `run:` 参照先 script を欠落させる → exit 1 / `::error::` 出力 | fail |
| R-2 / AC-2 | `lefthook.yml` を stage、`LEFTHOOK_EDIT_ACK` 未設定 → guard exit 1 ／ `LEFTHOOK_EDIT_ACK=1` 設定 → exit 0 | fail / pass |
| R-3 / AC-3 | block 時の出力に `LEFTHOOK_EDIT_ACK=1` / `CLAUDE.md` / `docs/00-getting-started-manual/lefthook-operations.md` を含む | grep 一致 |
| R-4 / AC-4 | `.git/hooks/pre-commit.sample` のみ存在 → pass ／ lefthook 署名（`LEFTHOOK`）入り hook → pass ／ `MERGE_HEAD` 存在時 → 何があっても exit 0（skip） | pass |

## 9.4 既存 quality gate との非干渉確認

| gate | 確認内容 |
|------|---------|
| `block-test-suffix`（lefthook） / `verify-test-suffix`（CI） | 新規 test が `*.spec.ts` のみ（invariant #8）。`*.test.ts` を追加していない |
| `verify-indexes-up-to-date`（CI） | 本タスクは `.claude/skills/.../indexes` を変更しない（docs/30-workflows + scripts + lefthook.yml + CLAUDE.md のみ） |
| 既存 `pre-commit.parallel: true` | 新 guard は read-only で並列安全。他 command と競合しない |
| `permissions: contents: read`（新 workflow） | `verify-hook-integrity.yml` が既存 verify-*.yml と同じ最小権限（不変条件 #4） |

## 9.5 DoD（Definition of Done）チェックリスト

実装サイクル完了の唯一の判定基準。全項目 ✅ で Phase 10 へ進む。

- [ ] `mise exec -- pnpm vitest run scripts/hooks/__tests__/lefthook-edit-guard.spec.ts scripts/__tests__/verify-hook-integrity.spec.ts` が全 green
- [ ] `bash scripts/hooks/lefthook-edit-guard.sh`（clean tree）が exit 0
- [ ] `bash scripts/verify-hook-integrity.sh` が exit 0（`OK: lefthook.yml integrity verified`）
- [ ] `mise exec -- pnpm lint` が green（`--fix` 後の残違反 0）
- [ ] `mise exec -- pnpm typecheck` が green
- [ ] AC-1（pre-commit local + CI integrity 両面）充足
- [ ] AC-2（lefthook.yml ack ゲート: ack 無で fail / ack 有で pass）充足
- [ ] AC-3（block メッセージに CLAUDE.md 方針 + lefthook-operations.md 導線）充足
- [ ] AC-4（`.sample` / lefthook 署名 / merge・rebase・cherry-pick skip の false positive 抑制）充足
- [ ] `CLAUDE.md`「Git hook の方針」節に guard / CI gate 追記済
- [ ] `docs/00-getting-started-manual/lefthook-operations.md` に新 guard 運用節追記済
- [ ] 両 script が `set -euo pipefail` + shellcheck 準拠（インストール時は警告 0）
- [ ] 新規 test が `*.spec.ts` のみ（invariant #8）

## 完了条件（Phase 9）

- [ ] §9.1 の検証コマンドを全実行し、§9.2 の期待結果と一致したことを記録した
- [ ] §9.3 の R-1..R-4 / AC-1..AC-4 が対応 spec ケースで充足することを確認した
- [ ] §9.4 の既存 gate 非干渉を確認した
- [ ] §9.5 DoD チェックリストの全項目が ✅ になった
