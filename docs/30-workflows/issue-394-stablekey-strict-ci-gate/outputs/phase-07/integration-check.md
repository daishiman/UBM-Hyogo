# integration-check

## local / CI command 同等性

| 観点 | 値 |
| --- | --- |
| package.json scripts entry | `lint:stablekey:strict` → `node scripts/lint-stablekey-literal.mjs --strict` |
| local 実行 | `pnpm lint:stablekey:strict` |
| CI 実行（計画） | `pnpm lint:stablekey:strict`（pnpm 経由で同 entry） |
| 結果 | **完全一致** |

## 03a 親 workflow との整合

- 03a `implementation-guide.md` の AC-7 は `enforced_dry_run` / `warning mode`。
- 本タスクは「fully enforced」昇格条件として「strict 0 violations + ci.yml step 追加 + required context `ci` 維持」を確定。
- 本サイクルでは AC-7 を昇格させず、cleanup 完了後の同期 PR で昇格する旨を Phase 12 documentation diff 計画に保持。

## aiworkflow-requirements との整合

- `branch-protection-current-facts.md` で required context 名 `ci` / `Validate Build` を正本として参照。
- 本サイクルで `quick-reference.md` / `resource-map.md` を更新済（git status で diff 確認）。
