# Phase 7 — リンク整合性チェック方針

実装後に以下を実行し全件 0 件 / 想定パスを返すこと。

```bash
# 1. 追記セクションが lefthook-operations.md に追加されたか
rg -n "skill indexes drift gate" docs/00-getting-started-manual/lefthook-operations.md

# 2. 参照されるパスが実在するか
ls .github/workflows/verify-indexes.yml
ls scripts/hooks/indexes-drift-guard.sh
ls .claude/skills/aiworkflow-requirements/indexes

# 3. workflow name と context 名が一致しているか
rg -n "^name:|^  verify-indexes-up-to-date" .github/workflows/verify-indexes.yml

# 4. lefthook.yml fail_text の文言と SOP の文言整合
rg -n "verify-indexes-up-to-date|pnpm indexes:rebuild" lefthook.yml docs/00-getting-started-manual/lefthook-operations.md

# 5. CLAUDE.md の既存リンクが lefthook-operations.md を指していること
rg -n "lefthook-operations" CLAUDE.md
```
