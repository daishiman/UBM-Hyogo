# Phase 6: コードレビュー観点

## レビュー観点（必須チェックリスト）

### secret hygiene

- [ ] `scripts/smoke/runtime-attendance-provider.sh` 内に bearer / cookie の **default 値**が hardcode されていない
- [ ] `echo` / `printf` に bearer 変数を直接展開していない（`$STAGING_ADMIN_BEARER` を log に渡さない）
- [ ] curl の `-D -` (header dump) は redact フィルタを必ず通してから保存される
- [ ] `set -x` を使っていない（trace で bearer が漏れる）

### shell 安全性

- [ ] `set -euo pipefail` を必ず先頭で宣言
- [ ] 全変数を `"$VAR"` で quote
- [ ] `${1:?env required}` で必須引数チェック
- [ ] production の env 引数を明示拒否（`exit 2`）
- [ ] `mkdir -p` で evidence ディレクトリを冪等作成

### 冪等性 / 副作用最小化

- [ ] GET smoke は副作用なし
- [ ] POST smoke（visibility-request / delete-request）は実行しない。DB write を伴う route は runtime smoke 対象から除外されている
- [ ] 失敗時に部分 evidence が残っても再実行で上書きされる（`: > "$OUT_LOG"` で初期化）

### 不変条件遵守

- [ ] D1 binding を直接叩いていない（HTTP API のみ）
- [ ] `wrangler` を直接呼んでいない（`scripts/cf.sh` のみ）
- [ ] production 環境への smoke 実行が code path として到達不能
- [ ] `apps/api` source の改修がない（git diff で apps/api/src/ 配下が空）

### evidence / redact filter 健全性

- [ ] `runtime-smoke.log` に raw response body を書かず、status / contract / count summary のみを残す
- [ ] email / fullName / profile / edit URL / memberId 実値が persistent evidence に残らない
- [ ] `redact.sh` は補助 filter として token / cookie を置換できる
- [ ] grep-gate が secret / PII pattern 拡張に追従している

## 完了条件

- 上記チェックリストが `outputs/phase-06/code-review.md` または本ファイル末尾の checklist で全 PASS マーク
- レビュー指摘があれば Phase 5 へ差し戻し
