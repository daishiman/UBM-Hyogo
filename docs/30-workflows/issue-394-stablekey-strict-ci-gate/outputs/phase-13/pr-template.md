# pr-template

```markdown
## Summary

- Phase 1〜13 仕様書整備（issue-394-stablekey-strict-ci-gate）
- 現状 strict mode 148 violations の blocker evidence と、cleanup 後の ci.yml step 追加 / 03a AC-7 昇格 plan を確定
- aiworkflow-requirements の関連 indexes / references を更新
- 本サイクルでは `.github/workflows/ci.yml` には変更を加えない（strict 0 violations 未達のため）

## Spec

- docs/30-workflows/issue-394-stablekey-strict-ci-gate/

## Test plan

- [x] `node scripts/lint-stablekey-literal.mjs --strict` が現状 exit 1 / 148 violations であることを確認（blocker evidence）
- [x] `gh api .../branches/{main,dev}/protection/required_status_checks` の contexts に `ci` が含まれることを確認
- [ ] legacy cleanup 完了後、`pnpm lint:stablekey:strict` が exit 0 になることを確認（後続 PR）
- [ ] ci.yml step 追加後、required `ci` check が strict step を含めて PASS（後続 PR）

Refs #394
```
