# Phase 11: link checklist

| リンク | 種別 | 状態 |
| --- | --- | --- |
| docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md | local | OK（原典） |
| .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | local | OK |
| .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | local | OK |
| .claude/skills/aiworkflow-requirements/references/environment-variables.md | local | OK |
| https://developers.google.com/identity/protocols/oauth2/service-account | external | OK |
| https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | external | OK |
| https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get | external | OK |

```bash
# 検証コマンド
for f in $(find docs/30-workflows/ut-03-sheets-api-auth-setup -name '*.md'); do
  grep -oE 'docs/[a-zA-Z0-9_/.-]+\.md|\.claude/[a-zA-Z0-9_/.-]+\.md' "$f" | while read p; do
    [ -f "$p" ] || echo "BROKEN: $p (in $f)"
  done
done
```
