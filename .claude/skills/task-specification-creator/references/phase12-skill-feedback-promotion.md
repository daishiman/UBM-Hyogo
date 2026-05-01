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

## Command Contract Drift Rule

タスク仕様書内の候補コマンドが実リポジトリの package script と一致しない場合、`local workflow metadata drift` とだけ記録して no-op にしない。次の順で同一 wave 内に閉じる。

1. `package.json` / workspace filter / test runner config から実行可能な current command を再解決する。
2. Phase 1 / Phase 4 / Phase 9 / Phase 11 / Phase 12 の command contract と evidence を同じ command string へ同期する。
3. stale command が再発しやすい条件を `skill-feedback-report.md` に `promotion target / no-op reason / evidence path` 付きで routing する。
4. 再利用可能なテンプレート差分なら `task-specification-creator` へ昇格し、単発 typo なら evidence path と no-op reason を残す。

実例: `issue-106-admin-member-notes-repository-task-spec` では `pnpm --filter @repo/api test:run -- adminNotes` が stale だったため、`pnpm --filter ./apps/api test -- adminNotes` と focused Vitest command へ再解決し、Phase 1/4/9/11/12 に同期した。

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

## Applied Examples

| Task | Routing decision | Evidence |
| --- | --- | --- |
| 09a staging smoke / Forms sync validation | placeholder evidence boundary と artifacts parity は task-specification-creator、domain lesson は aiworkflow-requirements、skill update process は skill-creator へ昇格 | `references/lessons-learned-09a-staging-smoke-forms-sync-validation-2026-05.md` |
| 09b cron monitoring / release runbook | cron env parity、rollback split、NON_VISUAL alternative evidence は aiworkflow-requirements の artifact inventory / lessons へ昇格。candidate task は existing unassigned を先に検索し、重複 formalize を避ける | `references/lessons-learned-09b-cron-monitoring-release-runbook-2026-05.md`, `references/workflow-task-09b-parallel-cron-triggers-monitoring-and-release-runbook-artifact-inventory.md` |

## 禁止事項

- `skill-feedback-report.md` に改善案を書いただけで Phase 12 を PASS にしない
- 「改善点なし」を根拠なしで書かない
- 存在しない validator / mirror script を PASS 根拠にしない
- 実測 evidence がない placeholder を skill lesson の成功例として扱わない
