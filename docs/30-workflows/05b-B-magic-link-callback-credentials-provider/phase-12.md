# Phase 12: ドキュメント更新 - 05b-B-magic-link-callback-credentials-provider

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-B-magic-link-callback-credentials-provider |
| phase | 12 / 13 |
| status | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 目的

task-specification-creator と aiworkflow-requirements の必須同期を満たし、implemented-local の実装範囲と未完 runtime smoke 境界を正本へ記録する。

## 必須成果物

| ファイル | 状態 |
| --- | --- |
| `outputs/phase-12/main.md` | required |
| `outputs/phase-12/implementation-guide.md` | required |
| `outputs/phase-12/system-spec-update-summary.md` | required |
| `outputs/phase-12/documentation-changelog.md` | required |
| `outputs/phase-12/unassigned-task-detection.md` | required |
| `outputs/phase-12/skill-feedback-report.md` | required |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | required |

## 同期方針

- workflow root は `implemented-local` とし、local typecheck / focused tests / boundary check PASS として扱う。
- `outputs/artifacts.json` は本 workflow では作成せず、root `artifacts.json` を唯一正本にする。
- aiworkflow-requirements の quick-reference / resource-map / task-workflow-active に canonical root を登録する。
- 起票元 unassigned task は「昇格済み・local implementation 完了・runtime smoke deferred」として扱う。
- Phase 13 は user approval なしに実行しない。

## 実行タスク

1. Phase固有の判断と成果物を確認する。
2. `index.md`、`artifacts.json`、Phase 12成果物との整合を確認する。
3. 実装・deploy・commit・push・PRを実行しない境界を確認する。

## 参照資料

- `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/index.md`
- `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/artifacts.json`
- `docs/30-workflows/unassigned-task/task-05b-authjs-callback-route-credentials-provider-001.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 実行手順

- Current canonical root is `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/`.
- Old root `docs/30-workflows/02-application-implementation/05b-B-magic-link-callback-credentials-provider/` is legacy path only.
- Runtime implementation evidence is separated into Phase 11 reserved paths.

## 統合テスト連携

- Upstream: 05b-A auth mail env, 05b Magic Link verify API, 06b login UI.
- Downstream: 06b-C logged-in profile evidence, 08b auth E2E, 09a staging auth smoke.
- Boundary: apps/web must not access D1 directly.

## 成果物

- `outputs/phase-12/main.md`

## 完了条件

- [ ] Phase 12 7成果物が実体として存在し、compliance check が4条件を評価している。
