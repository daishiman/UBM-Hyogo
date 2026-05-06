# Phase 9: 品質保証

## 検証コマンド

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm typecheck      | tee outputs/phase-9/typecheck.log
mise exec -- pnpm lint           | tee outputs/phase-9/lint.log
actionlint .github/workflows/*.yml | tee outputs/phase-9/actionlint.log
mise exec -- pnpm sync:check     | tee outputs/phase-9/sync-check.log

for workflow in .github/workflows/backend-ci.yml .github/workflows/web-cd.yml; do
  test -f "$workflow" || { echo "FAIL: missing workflow $workflow"; exit 1; }
done | tee outputs/phase-9/workflow-path-existence.log

# secret hygiene
grep -RInE 'CLOUDFLARE_API_TOKEN=[^$]' docs/ outputs/ scripts/ \
  | tee outputs/phase-9/secret-hygiene-grep.log || true
[ ! -s outputs/phase-9/secret-hygiene-grep.log ] || { echo "FAIL: secret leak"; exit 1; }
```

## 期待

- typecheck / lint / actionlint / sync:check すべて exit 0
- secret hygiene grep が空（`CLOUDFLARE_API_TOKEN=実値` の form は 0 hit。`${{ secrets.* }}` 参照は許容）

## 成果物

- `outputs/phase-9/quality-report.md`
- `outputs/phase-9/typecheck.log`
- `outputs/phase-9/lint.log`
- `outputs/phase-9/actionlint.log`
- `outputs/phase-9/sync-check.log`
- `outputs/phase-9/secret-hygiene-grep.log`
