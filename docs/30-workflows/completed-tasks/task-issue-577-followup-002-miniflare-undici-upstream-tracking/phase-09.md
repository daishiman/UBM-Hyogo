# Phase 9: 品質保証

## secret hygiene

### 禁止事項

- `GH_TOKEN` / `CLOUDFLARE_API_TOKEN` / OAuth token 値を `echo` / `cat` / `printenv` で出力しない
- evidence ファイルに環境変数の dump（`env`、`printenv`）を残さない
- triage 結果に repo の private token を含む URL を貼らない

### 検証コマンド

```bash
# evidence に secret 様の文字列が混入していないか
grep -rE "ghp_[A-Za-z0-9]{36,}|cf_[A-Za-z0-9]+|CLOUDFLARE_API_TOKEN=" \
  outputs/phase-11/evidence/ \
  | tee outputs/phase-11/evidence/secret-hygiene-grep.log

# 期待: 0 行（grep 終了コード 1）
```

検知時の対応:
1. 該当ファイル即削除
2. token rotate
3. 再生成 evidence で再 grep

## coverage 閾値保証

### 不変条件

- vitest coverage 閾値（既存 `vitest.config.ts` 設定）を**下げない**
- A/B 採用後も coverage が現行水準を維持していること

### 検証

```bash
# 採用 N の最終 run log で coverage 行を確認
grep -E "All files\s+\|.*\|.*\|.*\|" outputs/phase-11/evidence/ab-{N}-run-3.log
```

数値が現行 baseline より下がっていた場合は採用しない（並列起因の collection 漏れ疑い）。

## 品質 gate 一覧

| gate | 判定 | 失敗時 |
| --- | --- | --- |
| secret hygiene grep 0 件 | AC-5 | 該当 evidence 削除 + token rotate |
| 133/133 PASS（採用判定時） | AC-4 | 該当 N 不採用 |
| 0 EADDRNOTAVAIL（採用判定時） | AC-4 | 該当 N 不採用 |
| coverage 閾値維持 | 不変条件 | 該当 N 不採用 |
| apps/api/src 不変 | AC-6 | スコープ違反として作業中断 |
| apps/api/migrations 不変 | AC-6 | 同上 |

## 不変条件再確認

- 本タスクで触れていいファイルは `apps/api/package.json#scripts.test:coverage` のみ（A/B 採用時）
- `apps/api/src/**` / `apps/api/migrations/**` / `apps/web/**` / `apps/api/wrangler.toml` は対象外
- D1 binding / schema / API contract 変更なし

## 次フェーズへの引き継ぎ事項

Phase 10 で GO/NO-GO 最終レビューに進む。
