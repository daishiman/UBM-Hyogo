# Manual Evidence Deferred - UT-07B-FU-02

状態: `PENDING_RUNTIME_EVIDENCE`

## 未取得 Evidence

| Screenshot | 状態 | 保存予定先 |
| --- | --- | --- |
| `01-success.png` | 200 success（label「alias を割当てました」） | `outputs/phase-11/01-success.png` |
| `02-retryable.png` | 202 retryable（「Back-fill 再試行可能」+ 「続きから処理」） | `outputs/phase-11/02-retryable.png` |
| `03-validation-error.png` | 422 validation error | `outputs/phase-11/03-validation-error.png` |
| `04-conflict-error.png` | 409 conflict | `outputs/phase-11/04-conflict-error.png` |

## 理由

このワークツリーでは focused component/unit tests を取得済みだが、manual screenshot は admin session、schema diff fixture、POST `/api/admin/schema/aliases` の 200 / 202 / 422 / 409 response override が必要である。runtime browser capture は user 明示承認後の Phase 11 visual evidence cycle で取得する。

## 再取得条件

- `mise exec -- pnpm --filter @ubm-hyogo/web dev` を起動する
- `/admin/schema` に schema diff fixture を表示する
- Network override などで 4 response を固定する
- 上記 4 PNG を `outputs/phase-11/` に保存する

この deferred 記録は runtime PASS ではない。
