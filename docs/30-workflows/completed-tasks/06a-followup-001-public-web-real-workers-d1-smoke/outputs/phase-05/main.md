# Phase 5 outputs — 要約

## 要約

local smoke と staging smoke を `scripts/cf.sh` ラッパー経由で統一実行するランブックを定義した。**`wrangler` 直接呼び出しは CLAUDE.md ポリシー違反**として完全禁止し、すべての wrangler 系操作は `bash scripts/cf.sh` 経由とする。

## 実行順序の正本

1. esbuild mismatch 事前確認（`bash scripts/cf.sh whoami`）
2. `apps/api` を local dev 起動（D1 binding を伴う）
3. `apps/web` を `PUBLIC_API_BASE_URL=http://localhost:8787` で起動
4. local curl matrix 実行 → `outputs/phase-11/evidence/local-curl.log` 保存
5. `/members` body に seed member 含有確認
6. `rg -n "D1Database|env\\.DB" app src --glob '!**/*.test.*' --glob '!**/__tests__/**'` 0 件確認（不変条件 #5）
7. staging deploy 状態確認（または `scripts/cf.sh deploy`）
8. staging vars 確認（`PUBLIC_API_BASE_URL`）
9. staging curl matrix 実行 → `staging-curl.log` 保存
10. staging `/members` screenshot 1 枚保存

## 成果物

- `runbook.md`: コマンド列の正本（コピペ実行可能粒度）

## evidence

すべて `outputs/phase-11/evidence/` 配下に Phase 4 命名規則で保存。secret は `redacted` 置換。

## AC trace

- AC-1: 手順 1〜2 の起動成功証跡
- AC-2 / AC-3: 手順 4 / 5
- AC-4 / AC-5: 手順 8 / 9
- AC-6: 全 evidence の `outputs/phase-11/evidence/` 集約
- AC-7: 手順 6
