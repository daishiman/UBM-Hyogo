# Phase 11 成果物: manual-smoke-log

## NON_VISUAL smoke summary

| 項目 | 結果 |
| --- | --- |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| UI screenshot | 不要（UI / UX 変更なし） |
| ADR 正本 | `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md` 存在確認 OK |
| artifacts parity | `artifacts.json` と `outputs/artifacts.json` の `cmp` = 0 |
| D1 direct binding guard | `apps/web/wrangler.toml` に `[[d1_databases]]` なし |

## 実測コマンド

```bash
test -f docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md
cmp -s docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/artifacts.json docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/outputs/artifacts.json
rg -n "^\[\[d1_databases\]\]|^\[d1_databases\]" apps/web/wrangler.toml
```

`rg` は出力なし（exit 1）を PASS とする。

## 関連証跡

- `manual-test-result.md`: Phase 4 検証コマンドと ADR レビューチェックリスト
- `link-checklist.md`: 同 wave ファイル死活確認
- `ui-sanity-visual-review.md`: NON_VISUAL 宣言
