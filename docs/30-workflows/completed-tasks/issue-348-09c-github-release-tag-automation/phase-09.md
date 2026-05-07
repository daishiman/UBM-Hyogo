# Phase 9: SSOT 反映

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-9/phase-9.md` |
| 実装区分 | 実装仕様書 |

## 目的
`.claude/skills/aiworkflow-requirements/references/release-runbook.md` に GitHub Release 作成導線を追記し、`indexes/keywords.json` に新規キーワードを追加して `pnpm indexes:rebuild` を再生成する手順を仕様化する。SSOT 反映が CI の `verify-indexes-up-to-date` gate を通ることを担保する。

## 実行タスク
詳細は `outputs/phase-9/phase-9.md` を正本とする。

## 統合テスト連携
Phase 12 の compliance チェックで SSOT 反映が漏れないことを確認する。`unassigned-task` からの consumed trace を維持する。

## 参照資料
- `outputs/phase-9/phase-9.md`
- `.claude/skills/aiworkflow-requirements/`

## 成果物
- `outputs/phase-9/phase-9.md`
- `.claude/skills/aiworkflow-requirements/references/release-runbook.md`（仕様確定）
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（仕様確定）

## 完了条件
- Phase 9 正本ファイルが存在する。
- 追加キーワード ("GitHub Release 作成" / "release-create.yml" / "release note template") が仕様化されている。
- `pnpm indexes:rebuild` 実行手順が仕様化されている。
- CI `verify-indexes-up-to-date` gate に drift がない条件が明記されている。
