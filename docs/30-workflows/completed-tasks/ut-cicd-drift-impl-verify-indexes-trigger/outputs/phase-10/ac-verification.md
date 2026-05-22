# Phase 10 — AC 検証手順

| AC | 検証コマンド / 手順 | 期待結果 |
|---|---|---|
| AC-1 | `rg -n "verify-indexes-up-to-date" docs/00-getting-started-manual/lefthook-operations.md` | 新セクション内で trigger 条件と context 名が hit |
| AC-1 | `rg -n "push.*main\|pull_request.*main.*dev" docs/00-getting-started-manual/lefthook-operations.md` | trigger branches が記述されている |
| AC-2 | 新セクション「## skill indexes drift gate — trigger 条件と復旧 SOP」が単一ファイル内で SOP A/B/厳守事項まで完結している | 目視確認 |
| AC-3 | `rg -n "mise exec -- pnpm indexes:rebuild" docs/00-getting-started-manual/lefthook-operations.md` | SOP A・B 両方で hit |
| AC-4 | `rg -n "手編集禁止\|generator 単独正本" docs/00-getting-started-manual/lefthook-operations.md` | 厳守事項節で hit |
| AC-5 | `rg -n "verify-indexes-up-to-date\|mise exec -- pnpm indexes:rebuild" lefthook.yml docs/00-getting-started-manual/lefthook-operations.md scripts/hooks/indexes-drift-guard.sh` | hook 側と docs 側で文言が一致 |
