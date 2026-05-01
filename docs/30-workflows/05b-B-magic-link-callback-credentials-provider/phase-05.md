# Phase 5: 実装ランブック - 05b-B-magic-link-callback-credentials-provider

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-B-magic-link-callback-credentials-provider |
| phase | 5 / 13 |
| status | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 目的

実装者が不要な再設計をせず、最小差分で callback/session 接続を完了できる手順を定義する。

## 手順

1. current repo layout を確認する。
2. Auth.js v5 / next-auth 依存と既存 wrapper の状態を確認する。
3. `apps/web/src/lib/auth.ts` に Credentials Provider `id="magic-link"` を追加する。
4. Credentials Provider `authorize()` で apps/api verify endpoint を呼ぶ。
5. `/api/auth/callback/email` GET route を追加する。
6. 該当する場合は `[...nextauth]` route handler を追加または既存 route と接続する。
7. error mapping と safe redirect を実装する。
8. unit / route / static boundary test を追加する。
9. Phase 11 evidence を保存する。

## 実装境界

| やる | やらない |
| --- | --- |
| Auth.js callback と session 接続 | Magic Link 発行 API の再実装 |
| apps/api verify 契約の利用 | apps/web から D1 直接参照 |
| 既存 shared session type の再利用 | 重複した session union 型の新設 |
| error mapping の明示 | 失敗 reason の握りつぶし |

## Approval Gate

この仕様書作成タスクでは commit / push / PR を実行しない。実装差分の Phase 13 でもユーザーの明示承認が必要。

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

- `outputs/phase-05/main.md`

## 完了条件

- [ ] 実装手順がファイル責務と一致し、破壊的操作や production secret 記録を含まない。
