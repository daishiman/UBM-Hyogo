# Phase 8: テスト戦略（evidence-driven verification）

## 8.1 テスト方針

本タスクは「コード変更ゼロ + 外部 API mutation 1 回」の特殊形態のため、通常の unit / integration test ではなく **evidence-driven verification** を採用する。テストアサーションは Phase 11 で評価する。

## 8.2 検証マトリクス

| ID | 検証項目 | 検証コマンド / 手段 | 期待結果 |
| --- | --- | --- | --- |
| V-1 | 削除前 variable 存在 | `jq '.variables[] \| select(.name=="CLOUDFLARE_PAGES_PROJECT")' before.json` | 1 件マッチ |
| V-2 | 削除後 variable 不在 | `jq '.variables \| map(.name) \| index("CLOUDFLARE_PAGES_PROJECT")' after.json` | `null` |
| V-3 | total_count 変化 | `jq '.total_count' before.json / after.json` | before - 1 == after |
| V-4 | single GET 404 | `grep -c "HTTP 404" after-single.txt` | `>= 1` |
| V-5 | grep gate 0 hits | `wc -l grep-gate.txt` | `0` |
| V-6 | 他 variable に影響なし | `diff <(jq '.variables\|map(.name)\|sort' before.json \| grep -v CLOUDFLARE_PAGES_PROJECT) <(jq '.variables\|map(.name)\|sort' after.json)` | 差分なし |
| V-7 | 旧 spec marker | `head -5 docs/30-workflows/unassigned-task/issue-331-followup-001-cloudflare-pages-project-var-deletion.md \| grep -c SUPERSEDED` | `>= 1` |
| V-8 | typecheck 成功 | `mise exec -- pnpm typecheck` | exit 0 |
| V-9 | lint 成功 | `mise exec -- pnpm lint` | exit 0 |

## 8.3 evidence 改ざん防止

- `outputs/phase-11/*.json` は `gh api` の **raw response** をそのまま保存する（手動編集禁止）
- `jq .` での pretty-print のみ許可（key/value 改変は禁止）
- commit 後の改変は git history で追跡可能

## 8.4 追加テストファイル

なし。テスト対象コードが存在しないため、新規 `*.spec.ts` / `*.test.ts` は追加しない。

## 8.5 fail 時の対応

| 検証 ID | fail 時アクション |
| --- | --- |
| V-1 | 既に削除済の可能性。Phase 5.3 冪等性に基づき成功扱い + log に記録 |
| V-2 | 削除失敗。`gh auth refresh -s repo` 後 Step 4 再実行 |
| V-3, V-4 | V-2 と同根。API レスポンス全文を log に記録 |
| V-5 | 削除後に `.github/` 配下で `CLOUDFLARE_PAGES_PROJECT` 参照が追加された可能性。git log で混入元を特定 |
| V-6 | 他 variable が誤削除された可能性 → Phase 5.2 rollback 手順で全件復元 |
| V-7 | marker 追記漏れ。`docs/30-workflows/unassigned-task/issue-331-followup-001-*.md` を再編集 |
| V-8, V-9 | typecheck/lint failure は本タスク変更 (docs のみ) と無関係の可能性大。原因特定して別 PR で fix |
