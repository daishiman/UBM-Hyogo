# Phase 13: PR 作成 - 05b-B-magic-link-callback-credentials-provider

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-B-magic-link-callback-credentials-provider |
| phase | 13 / 13 |
| status | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 目的

commit / push / PR 作成をユーザー承認ゲートとして固定する。

## User Approval Gate

次の操作はユーザーの明示承認なしに実行しない。

- `git commit`
- `git push`
- `gh pr create` または同等の PR 作成
- production / staging secret 値の取得や記録
- Cloudflare / GitHub の外部状態を変更する操作

## PR 準備物

| 成果物 | 内容 |
| --- | --- |
| change summary | callback/provider/session 接続の差分 |
| local check result | typecheck / tests / boundary check |
| evidence paths | Phase 11 実測ファイル |
| references | 05b-B workflow root と起票元 unassigned task |

## 現時点の判定

`blocked_pending_user_approval`。本タスク仕様書作成では Phase 13 を実行しない。

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

- `outputs/phase-13/main.md`

## 完了条件

- [ ] PR 作成条件だけが定義され、PR 作成自体は未実行である。
