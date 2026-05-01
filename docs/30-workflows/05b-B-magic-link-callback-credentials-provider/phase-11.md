# Phase 11: 手動 smoke / 実測 evidence - 05b-B-magic-link-callback-credentials-provider

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-B-magic-link-callback-credentials-provider |
| phase | 11 / 13 |
| status | EXECUTED |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 目的

実装後に取得した NON_VISUAL evidence と、未実行 runtime smoke の境界を固定する。

## Evidence Files

| ファイル | 内容 | 現時点 |
| --- | --- | --- |
| `outputs/phase-11/typecheck.log` | apps/web typecheck | created / exit=0 |
| `outputs/phase-11/test.log` | focused auth tests | created / 98 tests passed |
| `outputs/phase-11/boundary-check.log` | D1 direct access check | created / exit=0 |
| `outputs/phase-11/callback-smoke.log` | dev-server callback success/failure smoke | deferred to 09a-A staging smoke / not required for this NON_VISUAL local close-out |
| `outputs/phase-11/main.md` | NON_VISUAL evidence summary | exists |

## Spec-only Boundary

`outputs/phase-11/main.md` は local NON_VISUAL evidence の実行済み summary である。dev server を立てた curl smoke と staging auth smoke は未実行で、後続 09a 系 smoke で取得する。

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
- Runtime implementation evidence is recorded in Phase 11; dev-server curl / staging smoke are delegated.

## 統合テスト連携

- Upstream: 05b-A auth mail env, 05b Magic Link verify API, 06b login UI.
- Downstream: 06b-C logged-in profile evidence, 08b auth E2E, 09a staging auth smoke.
- Boundary: apps/web must not access D1 directly.

## 成果物

- `outputs/phase-11/main.md`

## 完了条件

- [x] 実測済み local evidence と、未実行 runtime smoke が分離されている。
