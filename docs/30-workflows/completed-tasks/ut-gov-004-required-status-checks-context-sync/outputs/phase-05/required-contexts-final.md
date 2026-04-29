# required-contexts-final.md — UT-GOV-001 投入確定 context（Phase 5）

## 確定 contexts

```yaml
required_status_checks:
  strict_dev: false
  strict_main: true
  contexts:
    - "ci"
    - "Validate Build"
    - "verify-indexes-up-to-date"
```

## 実績証跡

| context | 直近 success 完了時刻 (UTC) | sha | 取得日 |
| --- | --- | --- | --- |
| `ci` | 2026-04-28T21:46:33Z | `f4fb3baa` | 2026-04-29 |
| `Validate Build` | 2026-04-28T21:46:33Z | `f4fb3baa` | 2026-04-29 |
| `verify-indexes-up-to-date` | 2026-04-28T21:46:27Z | `f4fb3baa` | 2026-04-29 |

## phase-1 cut-off 3 条件チェック

| context | 実在 | 30日以内 success | フルパス一致 | AND |
| --- | --- | --- | --- | --- |
| `ci` | ✅ | ✅ | ✅（top-level name = job name = `ci`） | PASS |
| `Validate Build` | ✅ | ✅ | ✅ | PASS |
| `verify-indexes-up-to-date` | ✅ | ✅ | ✅ | PASS |

## UT-GOV-001 への引き渡し

UT-GOV-001 はこのファイルおよび `outputs/phase-08/confirmed-contexts.yml`（機械可読正本）を唯一の入力契約として読み込み、`gh api -X PATCH /repos/:owner/:repo/branches/:branch/protection` を実行する。

リネーム / 追加が発生する場合は本タスクを再実行（または incremental update）し、本ファイルを更新したうえで UT-GOV-001 を再 apply する。
