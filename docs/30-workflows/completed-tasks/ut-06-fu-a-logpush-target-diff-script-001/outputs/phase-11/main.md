# Phase 11 成果物: 手動テスト検証 (NON_VISUAL)

本タスクは visualEvidence = NON_VISUAL のため、スクリーンショットは取得しない。
代わりに redacted text 出力と redaction grep 結果を evidence として記録する。

## 検証 1: smoke run

```
$ bash scripts/observability-target-diff.sh \
  --current-worker ubm-hyogo-web-production \
  --legacy-worker  ubm-hyogo-web \
  --config apps/web/wrangler.toml
```

- exit code: 1 (current-only=1: R1 Workers Logs)
- 出力: `outputs/phase-11/diff-sample.md` (= `tests/golden/diff-mismatch.md` と byte-level 一致)

## 検証 2: redaction grep

```
$ grep -rnE 'AKIA[0-9A-Z]{16}|ya29\.[A-Za-z0-9_-]{8,}' \
    scripts/observability-target-diff.sh \
    scripts/lib/redaction.sh \
    tests/
```
- 全 hit が `MOCK` / `FAKE` 合成値
- 実 token / 実 sink credential ヒット: 0 件

## 検証 3: cf.sh tail との整合 (cross-check)

`bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production` の Worker 名解決と本 script の `R2 Tail` セクションの target 名が一致する。

## 検証 4: 引数バリデーション

| 入力 | 期待 | 実測 |
| --- | --- | --- |
| 引数なし | exit 64 + usage | PASS |
| `--format invalid` | exit 64 | PASS |
| `--config nonexistent` | exit 2 | PASS (config not found) |

詳細: `manual-run-log.md`, `redaction-verification.md`, `cf-sh-tail-cross-check.md`
