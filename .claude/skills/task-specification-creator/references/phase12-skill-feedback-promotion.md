# Phase 12 Skill Feedback Promotion

## 目的

Phase 12 の `skill-feedback-report.md` を「報告書」だけで終わらせず、再利用可能な skill / reference / lesson へ同一 wave で昇格するための routing rules を定義する。

## Routing Matrix

| Feedback 種別 | 昇格先 | 例 |
| --- | --- | --- |
| Phase template / checklist gap | `task-specification-creator/references/*` または `assets/*` | Phase 12 必須成果物、unassigned-task 必須見出し、artifacts parity |
| domain implementation / spec lesson | `aiworkflow-requirements/references/lessons-learned-*.md` | API boundary、staging smoke、schema sync、security/data boundary |
| skill creation / update workflow lesson | `skill-creator/references/update-process.md` または related asset | AskUserQuestion 例外、SubAgent 監査分担、mirror sync |
| validation command gap | owning skill の `scripts/` または validation reference | warning ではなく error にする、実在コマンドだけを compliance に記録 |
| no-op | `documentation-changelog.md` と `skill-feedback-report.md` | 既に反映済み、対象 skill なし、実行 evidence 未取得 |

## 苦戦箇所 Required Fields

| Field | 内容 |
| --- | --- |
| symptom | 何が起きたか |
| cause | なぜ起きたか |
| recurrence condition | どの条件で再発するか |
| 5-minute resolution | 次回の短時間解決手順 |
| evidence path | 根拠となる workflow output / code / validation log |
| promoted-to | 反映先 path。反映しない場合は no-op reason |

## Same-wave Closeout Checklist

- [ ] `skill-feedback-report.md` の item を 1 件ずつ routing した
- [ ] `promotion target / no-op reason / evidence path` を記録した
- [ ] domain-specific lesson は `aiworkflow-requirements/references/lessons-learned-*.md` へ反映した
- [ ] workflow/template issue は `task-specification-creator` の reference / asset へ反映した
- [ ] skill-authoring/update-process issue は `skill-creator` の reference / asset へ反映した
- [ ] `documentation-changelog.md` に更新ファイルと no-op rationale を残した
- [ ] mirror directory が存在する skill は mirror sync と `diff -qr` を実行した

## 禁止事項

- `skill-feedback-report.md` に改善案を書いただけで Phase 12 を PASS にしない
- 「改善点なし」を根拠なしで書かない
- 存在しない validator / mirror script を PASS 根拠にしない
- 実測 evidence がない placeholder を skill lesson の成功例として扱わない

