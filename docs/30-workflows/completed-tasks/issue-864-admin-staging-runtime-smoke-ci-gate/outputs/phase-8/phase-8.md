# Phase 8: リファクタリング

## 目的

duplicate と navigation drift を削る。

## 変更内容（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| `runtime-attendance-provider.sh` の共通関数 | `fail_and_exit` / `write_summary` / redact 呼び出しが API runner に内包 | 重複が 2 runner に出るなら `scripts/smoke/lib/smoke-common.sh` へ抽出し両者 source | DRY。ただし初回は複製許容（過度な早期抽象化を避ける） |
| reason 分類文字列 | runner に直書き | runner 冒頭の定数ブロックへ集約（`auth-token-invalid-or-expired` 等） | 文字列 drift 防止・test と一致 |
| cookie 名 | runner と mint helper に重複 | `SESSION_COOKIE_NAME` を mint helper に定数化、runner は env 経由で受領 | SSOT |
| web-cd.yml の mask/redaction step | runtime-smoke-staging.yml とほぼ同一 | 共通化はせず**意図的に複製**（workflow 間の composite action 化は将来層） | CI workflow の早期共通化は壊れやすい。複製で独立性を優先 |

## navigation drift チェック

- 親タスク `fix-admin-server-components-render-error-stg` の Phase 11 が参照する「将来の自動 gate」への前方リンクを、本タスク root へ向ける（Phase 12 Step 1-C で更新）。
- `unassigned-task/fix-admin-scr-err-stg-followup-003-...` を本タスクで formalize した旨を記録（Phase 12）。

## 抽出判断（早期抽象化の抑制）

> runner 共通化は「2 個目の web runner が増えた時点」で行う。初回は API/web の 2 runner 間の差分が大きい（header vs cookie、JSON vs HTML、tail grep の有無）ため、共通化より独立性を優先する。

## 完了判定

- [x] reason 文字列 / cookie 名の SSOT 化
- [x] 早期共通化を避けた判断を記録
