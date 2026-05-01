# Local Check Result

未実行。Phase 13 実行時に以下を記録する。

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
if grep -RniE '(token|cookie|authorization|bearer|set-cookie)' docs/30-workflows/ut-06b-profile-logged-in-visual-evidence/outputs/phase-11/evidence; then echo "FAIL secret hygiene"; else echo "PASS secret hygiene"; fi
diff -u docs/30-workflows/ut-06b-profile-logged-in-visual-evidence/artifacts.json docs/30-workflows/ut-06b-profile-logged-in-visual-evidence/outputs/artifacts.json
```
