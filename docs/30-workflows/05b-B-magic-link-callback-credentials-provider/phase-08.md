# Phase 8: DRY 化 - 05b-B-magic-link-callback-credentials-provider

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-B-magic-link-callback-credentials-provider |
| phase | 8 / 13 |
| status | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 目的

認証状態、error reason、session shape の重複定義を避ける。

## DRY 方針

| 対象 | 方針 |
| --- | --- |
| Session user | 既存 shared type を再利用し、apps/web 独自 union を増やさない |
| Error mapping | callback route 近傍の単一 table に集約する |
| Verify fetch | 既存 web API client/proxy があれば利用し、なければ最小 helper に閉じる |
| Redirect normalization | 既存 safe redirect helper を再利用する |
| Tests | success/failure table driven test にする |

## 削るもの

- Phaseごとの同一テンプレ文。
- 「実装予定」だけの成果物。
- parent 05b 完了証跡と 05b-B local implementation / deferred smoke 証跡の混同。

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

- `outputs/phase-08/main.md`

## 完了条件

- [ ] 重複した型、重複した path、重複した failure reason table を増やさない。
