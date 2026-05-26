# Phase 13 — PR作成

## 1. PR 構成（本仕様書 commit のみ）

| 項目      | 値                                                                              |
| --------- | ------------------------------------------------------------------------------- |
| base      | `dev`                                                                           |
| head      | `docs/issue-899-static-bearer-fallback-retirement-spec`                         |
| 含まれる差分 | `docs/30-workflows/issue-899-static-bearer-fallback-retirement/**` のみ        |
| 含まれない差分 | `.github/workflows/runtime-smoke-staging.yml` / runbook / SSOT（実装 PR 側）|

## 2. PR title 案

```
docs(spec): issue #899 retire static bearer fallback (mint-only permanence) spec
```

## 3. PR body 案

```
## Summary
- Issue #899（静的 bearer fallback 撤去・mint 方式恒久化）の **実装仕様書** を Phase 1-13 で作成。
- 実コード変更（workflow / runbook / SSOT edit + GitHub Environment secret 物理削除）は本 PR には含めない。
- 前提タスク #916（`STAGING_AUTH_SECRET` provisioning + mint path smoke green）完了後に別実装 PR で実施する。

## 順序制約（不変条件）
1. 前提 #916 完了 → 2. 実装 PR merge → 3. mint-only smoke green 再確認 → 4. `gh secret delete` で静的 secret 物理削除
逆転禁止（順序逆転で smoke 即 fail する）

## Acceptance Criteria
AC-1〜AC-11 は `docs/30-workflows/issue-899-static-bearer-fallback-retirement/index.md` 参照

## Test plan
- [ ] `pnpm gate-metadata:validate` PASS
- [ ] `pnpm verify:phase12-compliance` PASS
- [ ] verify-pr-ready.sh PASS
- [ ] 実装 PR（別 PR）で actionlint / grep gate / mint-only smoke green を担保

Refs: #899, prerequisite #916
```

## 4. user-gated 実行

```bash
git push -u origin docs/issue-899-static-bearer-fallback-retirement-spec
gh pr create --base dev --title "docs(spec): issue #899 retire static bearer fallback (mint-only permanence) spec" --body "$(cat <<'EOF'
...上記 PR body...
EOF
)"
```

## 5. 完了条件

- PR URL 取得
- `pnpm gate-metadata:validate` / `pnpm verify:phase12-compliance` / `verify-pr-ready.sh` PASS
- 関連 issue #899 は CLOSED 維持（state 変更しない）
- 実装 PR は本 PR とは独立して、前提 #916 完了後に別途作成
