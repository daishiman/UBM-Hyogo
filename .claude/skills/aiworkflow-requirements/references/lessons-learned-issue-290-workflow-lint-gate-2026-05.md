# Lessons Learned - Issue #290 workflow lint gate (2026-05)

## L-290-001: allowlist actionlint scope drifts

手動列挙の actionlint 対象は、新規 workflow 追加時に漏れる。`.github/workflows/*.yml` glob を owner job と local reproduction command の両方に適用する。

## L-290-002: yamllint is not a free quality gain

GitHub Actions 固有の `${{ }}` や workflow 文脈を扱うには actionlint が primary gate になる。yamllint は一般 YAML gate として有用だが、本タスクでは config / exception 運用の複雑性が価値を上回る。

## L-290-003: local and CI scopes must be one contract

`.github/workflows/ci.yml` だけを glob 化し、`package.json` の local command が旧列挙のままだと再現性が壊れる。CI owner job と `pnpm observation:lint` は同じ actionlint version / target scope を使う。

## L-290-004: runtime PASS and local PASS are separate

ローカル actionlint が PASS しても、GitHub Actions runtime evidence は commit / push / PR 後にしか取得できない。Phase 12 では `implemented_local_evidence_captured` + `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として分離する。
