# Phase 3: 詳細設計

## 1. `.github/workflows/e2e-tests.yml`

PR では workflow を常に起動し、`precheck` job で changed files を判定する。

```yaml
jobs:
  precheck:
    name: e2e paths precheck
    outputs:
      run_e2e: ${{ steps.changed.outputs.run_e2e }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - id: changed
        run: |
          git fetch --no-tags --depth=1 origin "${{ github.base_ref }}"
          changed="$(git diff --name-only "origin/${{ github.base_ref }}...HEAD")"
          if printf '%s\n' "$changed" | grep -Eq '^(apps/web/|apps/api/|packages/|scripts/e2e-mock-api|scripts/coverage-gate-e2e\.sh$|scripts/lib/|\.github/workflows/e2e-tests\.yml$|\.github/actions/)'; then
            echo "run_e2e=true" >> "$GITHUB_OUTPUT"
          else
            echo "run_e2e=false" >> "$GITHUB_OUTPUT"
          fi
```

`e2e` matrix は `needs.precheck.outputs.run_e2e == 'true'` の時だけ走る。`e2e-tests-coverage-gate` は `always()` で走り、`run_e2e=false` の時は no-op success を返す。

## 2. `scripts/lib/ci-shell-prelude.sh`

```bash
#!/usr/bin/env bash
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "ci-shell-prelude.sh must be sourced, not executed" >&2
  exit 2
fi

set -euo pipefail
umask 077

gh_notice()  { printf '::notice::%s\n'  "$*"; }
gh_warning() { printf '::warning::%s\n' "$*" >&2; }
gh_error()   { printf '::error::%s\n'   "$*" >&2; }
```

The actual file also provides `assert_jq` and `awk_compare_ge`.

## 3. Coverage Scripts

`coverage-gate-e2e.sh` and `coverage-guard.sh` source the prelude:

```bash
# shellcheck source=lib/ci-shell-prelude.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/ci-shell-prelude.sh"
```

## 4. Shellcheck Workflow

`.github/workflows/lint-shell.yml` runs:

```bash
mapfile -t files < <(git ls-files 'scripts/**/*.sh')
shellcheck --severity=warning --external-sources "${files[@]}"
```

This command is CI-side Ubuntu bash. Local evidence uses the portable NUL-delimited command documented in Phase 7 / 11.

## 5. 完了条件

- [x] single-workflow precheck の pseudo-code が固定されている
- [x] source-only prelude の関数シグネチャが固定されている
- [x] shellcheck workflow と local portable evidence command の差分が明記されている
