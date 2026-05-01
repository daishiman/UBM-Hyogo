# Phase 3: 設計レビュー - 05b-B-magic-link-callback-credentials-provider

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-B-magic-link-callback-credentials-provider |
| phase | 3 / 13 |
| status | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 目的

4条件で設計をレビューし、実装時に破綻しやすい境界を先に固定する。

## 4条件レビュー

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 05b は verify API、05b-B は Auth.js callback/session 接続のみを担当する |
| 漏れなし | PASS | callback route、provider、session、error mapping、test、evidence を AC に対応付けた |
| 整合性あり | PASS | login gate state と session auth gate state を混同しない |
| 依存関係整合 | PASS | 05b-A / 05b / 06b / 08b / 09a の上流下流を分離した |

## リスクと対策

| リスク | 対策 |
| --- | --- |
| Auth.js Credentials Provider が Edge runtime で不整合を起こす | build / focused unit test / route test を Phase 9 と 11 に置く |
| verify API 失敗 reason が UI error と drift する | Phase 2 の mapping を single table とし、test で固定する |
| apps/web が D1 を直接 import する | static boundary check を必須 evidence にする |
| session user shape が 05a と競合する | 既存 shared type を再利用し、重複 union を作らない |

## 破棄判断

現状の重複テンプレを維持して追記するより、Phaseごとに責務を再構成する方が低複雑である。既存ファイル構造は保持し、本文だけを Phase 固有の仕様へ置換する。

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

- `outputs/phase-03/main.md`

## 完了条件

- [ ] 4条件がすべて PASS で、実装時の重点リスクが Phase 4 / 9 / 11 へ渡されている。
