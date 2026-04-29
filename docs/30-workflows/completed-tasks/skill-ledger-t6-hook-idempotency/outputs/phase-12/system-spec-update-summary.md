# system-spec-update-summary — aiworkflow-requirements 反映要否マトリクス

> 本ワークフローは **タスク仕様書整備のみ**。aiworkflow-requirements 正本の本体差分は最小限とし、既存記述で T-6 の境界が読める場合は反映しない。

## 1. Step 1 完了記録（A〜G）

| Step | 判定 | 実施内容 / 根拠 |
| --- | --- | --- |
| 1-A 完了記録 | 実施 | 本 workflow を docs-only / spec_created close-out として `index.md` / `artifacts.json` / Phase 12 成果物に同期 |
| 1-B 実装状況テーブル | 実施 | Phase 1〜3 = `completed`、Phase 4〜11 = `template_created`、Phase 12 = `completed`、Phase 13 = `pending_user_approval` に分離 |
| 1-C 関連タスク / 残課題 | 実施 | `unassigned-task-detection.md` に U-1〜U-5、正式未タスク `task-skill-ledger-t6-implementation.md` を追加 |
| 1-D index 再生成 | 実施 | aiworkflow reference を最小更新したため `generate-index.js` を実行対象とする |
| 1-E 未タスク登録 | 実施 | hook 実装 / smoke 実走を後続 implementation タスクとして formalize |
| 1-F 補助更新 | 実施 | `skill-ledger-gitignore-policy.md` の古い post-commit / post-merge 再生成記述を現行方針に修正 |
| 1-G 検証 | 実施予定 | Phase 12 validator / Phase 11 screenshot coverage / verify-all-specs / rg drift check を再実行して本ファイルへ結果反映 |

## 2. Step 2 domain spec sync 判定

T-6 は UI / API / DB / security contract を変更しないため、domain spec sync は不要。ただし hook 運用正本と矛盾する古い A-1 policy 表現は governance 仕様として最小補正した。

## 3. 反映要否マトリクス

| reference | 既存記述で T-6 を読めるか | 反映要否 | 反映内容（必要時のみ） |
| --- | --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/skill-ledger-fragment-spec.md` | A-2 fragment 化の境界が記述済み。本タスクは派生物境界を継承するのみで A-2 自体を変更しない | **不要** | — |
| `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitignore-policy.md` | A-1 で確立した「派生物 untrack / 正本のみ追跡」境界が定義済み。ただし古い「hook が再生成する」表現が現行方針と矛盾 | **必要** | post-commit / post-merge は stale 通知のみ、再生成は明示 `pnpm indexes:rebuild` / CI gate、`git add` 系禁止へ最小更新 |
| `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitattributes-policy.md` | B-1 連携で派生物の merge=union を扱う。T-6 は hook 副作用ガードに閉じるためここでは触れない | **不要** | — |
| `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md` | hook 運用正本（lefthook 経由 / `.git/hooks/*` 直編集禁止 / 明示 `pnpm indexes:rebuild` / CI gate）が記述済み。T-6 はこれを実装段階に固定するタスクで、正本側には差分なし | **不要** | — |

## 4. 反映しない理由（共通）

1. T-6 のスコープは hook 副作用ガードと smoke 実走の **検証** であり、新しい不変条件を導入していない。
2. AC-1（hook が `git add` を呼ばない）は既存 policy（A-1）から導かれる帰結であり、references を二重化すると正本仕様の重心がぶれる。
3. Phase 11 evidence は本ワークフロー固有の記録（`manual-smoke-log.md`）に閉じ、references から本ワークフロー outputs を逆参照させない（情報の流れは references → workflow の一方向）。

## 5. 例外発生時の更新フロー

将来 Phase 11 実走で次のいずれかが観測された場合のみ references の最小差分を提案する:

- 4 worktree smoke が `unmerged=0` を再現できず、`pnpm indexes:rebuild` の決定論性に新たな前提条件が必要となった場合 → `technology-devops-core.md` に「smoke 実走前の jq 必須化」を追記。
- 部分 JSON リカバリ手順が運用標準として恒常化した場合 → 同 references にリカバリループ snippet を追加。

更新時のフローは `aiworkflow-requirements/references/spec-guidelines.md` に従い、変更後 `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を実行し index drift を解消する。

## 6. indexes / logs の扱い

- `.claude/skills/aiworkflow-requirements/indexes/*.json` は reference 更新後に `generate-index.js` で同期する。
- 仕様 references を変更したため `verify-indexes-up-to-date` CI gate の対象になる。
- LOGS.md（A-2 後の fragment 群）にも本 PR の差分は出ない（仕様書整備のみのため）。

## 7. 反映結論

| 項目 | 結論 |
| --- | --- |
| 正本 references への直接差分 | あり（`skill-ledger-gitignore-policy.md` の古い hook 再生成表現のみ） |
| indexes 再生成 | 必要 |
| LOGS 追記 | 不要（spec-only PR） |
| 例外発生時の更新ルート | §5 に記述 |
