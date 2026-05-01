# Phase 7: AC マトリクス - 05b-B-magic-link-callback-credentials-provider

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-B-magic-link-callback-credentials-provider |
| phase | 7 / 13 |
| status | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 目的

受入条件、実装対象、検証方法を一対一に対応させる。

| AC | 実装対象 | 検証 | 完了基準 |
| --- | --- | --- | --- |
| AC-1 route exists | callback route | route test / curl | 404 ではない |
| AC-2 success session | provider + callback | route test / cookie assertion | session cookie set |
| AC-3 failure redirect | provider + mapping | failure matrix | login error redirect |
| AC-4 no D1 direct | imports | static boundary check | direct import 0件 |
| AC-5 tests added | test files | focused test command | all focused tests PASS |

## Traceability

| Source | Trace |
| --- | --- |
| unassigned task | `docs/30-workflows/unassigned-task/task-05b-authjs-callback-route-credentials-provider-001.md` |
| current workflow | `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/` |
| parent 05b | `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/` |
| downstream visual | `06b-C-profile-logged-in-visual-evidence` |

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

- `outputs/phase-07/main.md`

## 完了条件

- [ ] ACに対応しない実装項目、または実装項目に対応しないACがない。
