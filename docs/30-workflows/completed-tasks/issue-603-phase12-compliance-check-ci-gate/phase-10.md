# Phase 10: 品質基準

## 目的

DoD（Definition of Done）を確定し、ローカル / CI で確認する gate を列挙する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## DoD（実装サイクル完了条件）

| # | 条件 | 確認方法 |
| --- | --- | --- |
| D1 | `pnpm typecheck` PASS | `mise exec -- pnpm typecheck` |
| D2 | `pnpm lint` PASS | `mise exec -- pnpm lint` |
| D3 | focused test 10 ケース PASS | `pnpm test:phase12-compliance` |
| D4 | 本 root の `outputs/phase-12/phase12-task-spec-compliance-check.md` が存在し canonical heading 9 項目を満たす | `mise exec -- pnpm verify:phase12-compliance`（ローカル）|
| D5 | `.github/workflows/verify-phase12-compliance.yml` PR で PASS | GitHub Actions UI |
| D6 | skill reference の drift 防止文言追加 | `rg 'verify-phase12-compliance' .claude/skills/task-specification-creator/` |
| D7 | SSOT 同期完了 | `rg 'verify-phase12-compliance' .claude/skills/aiworkflow-requirements/` |
| D8 | `pnpm indexes:rebuild` 実行済み（変更が indexes に影響する場合） | `git diff .claude/skills/aiworkflow-requirements/indexes/` |
| D9 | artifacts.json parity（`cmp -s artifacts.json outputs/artifacts.json`） | `cmp` exit 0 |

## 観測指標

- script execution time（< 5s 目標）
- false positive rate（既存 root 改修 PR で誤 fail なし）

## 完了条件

- [ ] D1〜D9 全 PASS

## Next Phase

- [Phase 11](phase-11.md): evidence path 予約
