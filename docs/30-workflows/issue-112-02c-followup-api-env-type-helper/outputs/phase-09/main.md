# Phase 9 outputs main — セキュリティ / boundary 検証 サマリ

## 検査ゲート

| gate | 内容 | 合格基準 |
| --- | --- | --- |
| H-1 | env.ts secret hygiene | `grep -nEi '(token\|secret\|bearer\|api[_-]?key\|oauth)' apps/api/src/env.ts` の hit は binding 名のみ |
| H-2 | evidence secret hygiene | `grep -REi '(eyJ[A-Za-z0-9_-]{20,}\|sk-[A-Za-z0-9]{20,}\|Bearer [A-Za-z0-9._-]+\|cf-token)' outputs/phase-11/evidence/` exit=1 |
| B-1 | boundary lint positive | apps/api 内部 import → `node scripts/lint-boundaries.mjs` exit 0 |
| B-2 | boundary lint negative | apps/web に probe 配置 → exit 1 + `contains forbidden token: apps/api` |
| O-1 | 1Password / op 経路無影響 | `scripts/cf.sh` / `.env` diff 0 行 |

## boundary lint 改修要否

`scripts/lint-boundaries.mjs` の `forbidden` 配列に `"apps/api"` 既存。`apps/api/src/env` 文字列は `body.includes("apps/api")` で自動検知される。**追加改修不要**。

## negative test 手順（再現可能）

1. `apps/web/__boundary_probe__.ts` を一時作成、本文 `import type { Env } from "apps/api/src/env";`
2. `node scripts/lint-boundaries.mjs 2>&1 ; echo "exit=$?"`
3. 出力に `apps/web/__boundary_probe__.ts contains forbidden token: apps/api` を確認、exit=1
4. probe を削除（commit しない）

## op / 1Password 経路評価

本タスクは binding 型のみで secret 値を扱わない。`scripts/cf.sh` / `.env` / `wrangler secret put` フローは無変更。**影響なし**。

## NON_VISUAL での #5 確認

screenshot は取らず、B-1 / B-2 の log と H-1 / H-2 の grep 結果を Phase 11 evidence として保存（5 ファイル: boundary-positive.log / boundary-negative.log / secret-hygiene-env.log / secret-hygiene-evidence.log / op-path-diff.log）。
