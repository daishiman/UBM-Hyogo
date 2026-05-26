# Phase 11 Main — issue-917 alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

## NON_VISUAL 宣言

本タスクは API runtime observability と docs のみで UI/UX 変更を伴わない。スクリーンショット不要。`screenshots/` ディレクトリは作成しない。

## 本サイクル取得 evidence（local + docs gate）

| evidence | 取得方法 | 期待結果 | 状態 |
| --- | --- | --- | --- |
| focused contract test | `pnpm exec vitest run apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts --root=. --config=vitest.config.ts` | relay POST 200 / 401 responseStatus logging contract PASS | present（8 tests PASS） |
| gate-metadata 検証 | `mise exec -- pnpm gate-metadata:validate` | OK 件数増・ERROR 0 | present（ERROR 0） |
| Phase 12 compliance 検証 | `mise exec -- pnpm verify:phase12-compliance` | PASS | present（PASS） |
| indexes 冪等性 | `mise exec -- pnpm indexes:rebuild` | index generation succeeds; remaining diff is expected same-cycle ledger sync | present |

## 後続 runtime サイクルで取得する evidence

| evidence | 保存先 | 状態 |
| --- | --- | --- |
| secret name presence（staging） | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md` §1 | pending（user-gated） |
| deploy 前後 tail（no-op 消失） | 同 MD §2 | pending |
| SA 資格情報失効 dry-run 観測 | 同 MD §3 | pending |
| relay POST 到達ステータス | 同 MD §4 | pending |
| 通知到達（任意） | 同 MD §5 | pending（通知先設定済みの場合のみ） |

## 関連

- 上流（配線完了）: `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/`
- 親（healthcheck 本体）: `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/`
- 元 unassigned-task spec: `docs/30-workflows/unassigned-task/UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence.md`
- 受信側 smoke（重複回避）: `docs/30-workflows/unassigned-task/ut-17-followup-001-alert-relay-runtime-smoke-evidence.md`
