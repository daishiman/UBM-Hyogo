# Phase 8: 実装 — 親 spec 追記

`[実装区分: 実装仕様書]`

判定根拠: 親 #408 の正本 spec に HOLD 状態を反映しないと、後続オペレーターが現状を誤認する。markdown 編集だが正本ドキュメントの更新は実装相当扱い。

---

## 目的

`docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` の Canonical Status 節に HOLD 反映行を追記し、親 spec が現状（HOLD 中・週次手動運用）を反映する状態にする。

## 変更対象ファイル

| パス | 種別 |
| --- | --- |
| `docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` | 編集（追記） |

## 編集内容

`Canonical Status` 節（既存の引用ブロックの直下）に以下を追記する。

```markdown
> **HOLD 反映 (2026-05-07 / Issue #518)**: 自動監視は保留。週次手動確認運用へ縮退。詳細は `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` および `docs/30-workflows/issue-518-cf-audit-logs-monitoring-hold/index.md`。
```

既存 `Canonical Status` 引用ブロックは無編集で残し、その**直後**に上記行を追加する（既存内容を保持）。

## 関数 / シグネチャ

該当なし。

## 入出力 / 副作用

- 親 spec の状態が `consumed_by_issue_408 / implemented_local / runtime pending` から「+ HOLD（issue-518）」へ補強される
- リンク経由で runbook と HOLD spec へ導線が張られる

## テスト方針

- 追記後の grep:
  ```bash
  grep -F "HOLD 反映 (2026-05-07 / Issue #518)" docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md
  ```
- markdown 構文崩れなし（`pnpm typecheck` / `pnpm lint` には影響しない）

## ローカル実行・検証コマンド

```bash
grep -n "Issue #518" docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md
git diff docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md
```

## DoD

- AC-6: HOLD 反映行が `Canonical Status` 節に追記されている
- 既存 Canonical Status 引用ブロックが破損していない（diff で確認）
